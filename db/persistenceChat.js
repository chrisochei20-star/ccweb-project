/**
 * Direct messages: chats, members, messages, read state (PostgreSQL).
 */

const crypto = require("crypto");
const { query } = require("./pool");
const pgUserProfile = require("./pgUserProfile");

function usePostgres() {
  return Boolean((process.env.DATABASE_URL || "").trim());
}

function newId(prefix) {
  return `${prefix}_${crypto.randomBytes(10).toString("hex")}`;
}

async function ensureCcwebUser(userId) {
  if (!usePostgres() || !userId) return;
  await query(`INSERT INTO ccweb_users (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`, [userId]);
}

async function displayNameFor(userId) {
  try {
    const row = await pgUserProfile.findByUserId(userId);
    if (row?.display_name) return String(row.display_name).slice(0, 120);
  } catch {
    /* ignore */
  }
  return userId.slice(0, 8);
}

async function findDirectChat(userId, otherUserId) {
  const { rows } = await query(
    `SELECT c.id
     FROM ccweb_chats c
     JOIN ccweb_chat_members m1 ON m1.chat_id = c.id AND m1.user_id = $1
     JOIN ccweb_chat_members m2 ON m2.chat_id = c.id AND m2.user_id = $2
     WHERE c.kind = 'direct'
     LIMIT 1`,
    [userId, otherUserId]
  );
  return rows[0]?.id || null;
}

async function createDirectChat(userId, otherUserId) {
  await ensureCcwebUser(userId);
  await ensureCcwebUser(otherUserId);
  const id = newId("cht");
  const meta = JSON.stringify({ participants: [userId, otherUserId].sort() });
  await query(`INSERT INTO ccweb_chats (id, kind, created_by, metadata) VALUES ($1, 'direct', $2, $3::jsonb)`, [
    id,
    userId,
    meta,
  ]);
  await query(`INSERT INTO ccweb_chat_members (chat_id, user_id) VALUES ($1, $2), ($1, $3)`, [id, userId, otherUserId]);
  return id;
}

async function getOrCreateDirectChat(userId, otherUserId) {
  if (!userId || !otherUserId || userId === otherUserId) return null;
  const existing = await findDirectChat(userId, otherUserId);
  if (existing) return existing;
  return createDirectChat(userId, otherUserId);
}

async function verifyMember(chatId, userId) {
  if (!usePostgres() || !chatId || !userId) return false;
  const { rows } = await query(`SELECT 1 FROM ccweb_chat_members WHERE chat_id = $1 AND user_id = $2 LIMIT 1`, [
    chatId,
    userId,
  ]);
  return rows.length > 0;
}

async function listPartnerIds(userId) {
  if (!usePostgres() || !userId) return [];
  const { rows } = await query(
    `SELECT DISTINCT m2.user_id AS pid
     FROM ccweb_chat_members m1
     JOIN ccweb_chat_members m2 ON m2.chat_id = m1.chat_id AND m2.user_id <> m1.user_id
     WHERE m1.user_id = $1`,
    [userId]
  );
  return rows.map((r) => r.pid);
}

function hydrateMessageRow(row, authorDisplayName) {
  if (!row) return null;
  let meta = row.metadata;
  if (typeof meta === "string") {
    try {
      meta = JSON.parse(meta);
    } catch {
      meta = {};
    }
  }
  if (!meta || typeof meta !== "object") meta = {};
  const attType = meta.type === "image" && (meta.url || meta.imageUrl) ? "image" : meta.type === "video" ? "video" : meta.type === "file" ? "file" : null;
  const mediaUrl = meta.url || meta.imageUrl || null;
  return {
    id: row.id,
    chatId: row.chat_id,
    authorUserId: row.author_user_id,
    authorDisplayName,
    body: row.body,
    metadata: meta,
    createdAt: row.created_at,
    isImage: attType === "image",
    imageUrl: attType === "image" ? mediaUrl : null,
    attachmentType: attType,
    attachmentUrl: mediaUrl,
    attachmentName: meta.name || null,
    attachmentMime: meta.mime || null,
  };
}

async function appendMessage(chatId, authorId, body, metadata = {}) {
  if (!usePostgres()) return null;
  await ensureCcwebUser(authorId);
  const id = newId("msg");
  const metaJson = JSON.stringify(typeof metadata === "object" && metadata ? metadata : {});
  await query(
    `INSERT INTO ccweb_chat_messages (id, chat_id, author_user_id, body, metadata)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [id, chatId, authorId, body, metaJson]
  );
  await query(`UPDATE ccweb_chats SET updated_at = NOW() WHERE id = $1`, [chatId]);
  const { rows } = await query(`SELECT * FROM ccweb_chat_messages WHERE id = $1`, [id]);
  const dn = await displayNameFor(authorId);
  return hydrateMessageRow(rows[0], dn);
}

async function getMessages(chatId, userId, { limit = 50, before } = {}) {
  if (!usePostgres()) return null;
  const ok = await verifyMember(chatId, userId);
  if (!ok) return null;
  const lim = Math.min(100, Math.max(1, limit));
  const params = [chatId];
  let sql = `SELECT * FROM ccweb_chat_messages WHERE chat_id = $1`;
  if (before) {
    sql += ` AND created_at < $2 ORDER BY created_at DESC LIMIT $3`;
    params.push(new Date(before), lim);
  } else {
    sql += ` ORDER BY created_at DESC LIMIT $2`;
    params.push(lim);
  }
  const { rows } = await query(sql, params);
  const chronological = rows.reverse();
  const out = [];
  for (const r of chronological) {
    const aid = r.author_user_id;
    const dn = aid ? await displayNameFor(aid) : "System";
    out.push(hydrateMessageRow(r, dn));
  }
  return out;
}

async function markRead(chatId, userId) {
  if (!usePostgres()) return false;
  const ok = await verifyMember(chatId, userId);
  if (!ok) return false;
  await query(`UPDATE ccweb_chat_members SET last_read_at = NOW() WHERE chat_id = $1 AND user_id = $2`, [
    chatId,
    userId,
  ]);
  return true;
}

async function listConversations(userId) {
  if (!usePostgres() || !userId) return [];
  await ensureCcwebUser(userId);
  const { rows } = await query(
    `SELECT 
       c.id AS chat_id,
       c.kind,
       c.updated_at,
       om.user_id AS other_user_id,
       lm.body AS last_body,
       lm.metadata AS last_metadata,
       lm.created_at AS last_message_at,
       lm.author_user_id AS last_author_id,
       my.last_read_at,
       (
         SELECT COUNT(*)::int FROM ccweb_chat_messages msg
         WHERE msg.chat_id = c.id
           AND msg.author_user_id <> $1
           AND msg.created_at > COALESCE(my.last_read_at, to_timestamp(0))
       ) AS unread_count
     FROM ccweb_chat_members my
     JOIN ccweb_chats c ON c.id = my.chat_id
     JOIN ccweb_chat_members om ON om.chat_id = c.id AND om.user_id <> $1
     LEFT JOIN LATERAL (
       SELECT body, metadata, created_at, author_user_id
       FROM ccweb_chat_messages
       WHERE chat_id = c.id
       ORDER BY created_at DESC
       LIMIT 1
     ) lm ON true
     WHERE my.user_id = $1
     ORDER BY COALESCE(lm.created_at, c.updated_at) DESC NULLS LAST`,
    [userId]
  );

  const out = [];
  for (const r of rows) {
    const otherId = r.other_user_id;
    const otherName = await displayNameFor(otherId);
    let lastPreview = r.last_body || "";
    let meta = r.last_metadata;
    if (typeof meta === "string") {
      try {
        meta = JSON.parse(meta);
      } catch {
        meta = {};
      }
    }
    if (meta?.type === "image") lastPreview = "📷 Image";
    else if (meta?.type === "video") lastPreview = "🎬 Video";
    else if (meta?.type === "file") lastPreview = `📎 ${meta.name || "File"}`;

    out.push({
      chatId: r.chat_id,
      kind: r.kind,
      updatedAt: r.updated_at,
      otherUserId: otherId,
      otherDisplayName: otherName,
      lastMessagePreview: lastPreview,
      lastMessageAt: r.last_message_at,
      lastAuthorId: r.last_author_id,
      unreadCount: Number(r.unread_count) || 0,
    });
  }
  return out;
}

async function getOtherMember(chatId, userId) {
  if (!usePostgres() || !chatId || !userId) return null;
  const { rows } = await query(`SELECT user_id FROM ccweb_chat_members WHERE chat_id = $1 AND user_id <> $2 LIMIT 1`, [
    chatId,
    userId,
  ]);
  return rows[0]?.user_id || null;
}

module.exports = {
  usePostgres,
  ensureCcwebUser,
  getOrCreateDirectChat,
  verifyMember,
  listPartnerIds,
  appendMessage,
  getMessages,
  markRead,
  listConversations,
  displayNameFor,
  getOtherMember,
};
