/**
 * In-app notifications (PostgreSQL ccweb_notifications).
 * Used by platform API, chat DM alerts, learning milestones, and legacy server.js fan-out.
 */

"use strict";

const crypto = require("crypto");
const { query } = require("./pool");

function usePostgres() {
  return Boolean((process.env.DATABASE_URL || "").trim());
}

function enabled() {
  return usePostgres();
}

function newId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

async function ensureCcwebUser(userId) {
  if (!enabled() || !userId) return;
  await query(`INSERT INTO ccweb_users (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`, [userId]);
}

function mapRow(r) {
  let payload = r.payload;
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch {
      payload = {};
    }
  }
  if (!payload || typeof payload !== "object") payload = {};
  return {
    id: r.id,
    kind: r.kind,
    title: r.title,
    message: r.body,
    body: r.body,
    read: r.read_at != null,
    readAt: r.read_at ? new Date(r.read_at).toISOString() : null,
    actorUserId: r.actor_user_id || null,
    groupKey: r.group_key || null,
    payload,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

async function insertRow({ recipientUserId, kind, title, body, payload, actorUserId, groupKey }) {
  if (!enabled() || !recipientUserId) return null;
  await ensureCcwebUser(recipientUserId);
  if (actorUserId) await ensureCcwebUser(actorUserId);
  const id = newId("ntf");
  const pay = JSON.stringify(payload && typeof payload === "object" ? payload : {});
  await query(
    `INSERT INTO ccweb_notifications (id, user_id, kind, title, body, payload, actor_user_id, group_key)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8)`,
    [id, recipientUserId, kind, title || "", body || "", pay, actorUserId || null, groupKey || null]
  );
  return id;
}

function mapLegacyTypeToKind(type, metadata = {}) {
  const t = (type || "").toString();
  if (t === "community_reaction_received") {
    return String(metadata.reaction || "").toLowerCase() === "repost" ? "repost" : "like";
  }
  if (t === "community_post_comment") return "reply";
  if (t === "community_chat_message") return "chat";
  if (t === "community_post_created") return "community";
  if (t === "ai_blog_published") return "build";
  if (t.startsWith("ai_streaming") || t.includes("stream")) return "learn";
  if (t.includes("growth") || t.includes("referral") || t.includes("xp") || t === "xp_awarded" || t === "earn_reward") {
    return "earn";
  }
  if (t === "mention") return "mention";
  if (t === "follow") return "follow";
  if (t === "dm_received" || t === "chat_dm") return "chat";
  return "platform";
}

function deriveGroupKey(type, metadata = {}) {
  const t = (type || "").toString();
  if (t === "community_reaction_received") {
    const tid = (metadata.targetId || "").toString();
    const r = String(metadata.reaction || "like").toLowerCase();
    const slug = r === "repost" ? "reposts" : "likes";
    return tid ? `post:${tid}:${slug}` : null;
  }
  if (t === "community_post_comment") {
    const pid = (metadata.postId || "").toString();
    return pid ? `post:${pid}:comments` : null;
  }
  if (t === "mention") {
    const pid = (metadata.postId || "").toString();
    return pid ? `post:${pid}:mentions` : null;
  }
  if (t === "follow") {
    const aid = (metadata.actorUserId || metadata.followerId || "").toString();
    return aid ? `follow:${aid}` : null;
  }
  return null;
}

function deriveActorUserId(metadata = {}) {
  return (
    metadata.fromUserId ||
    metadata.actorUserId ||
    metadata.authorUserId ||
    metadata.followerId ||
    null
  );
}

async function insertFromLegacyEvent(record, recipients) {
  if (!enabled() || !record || !recipients?.length) return [];
  const kind = mapLegacyTypeToKind(record.type, record.metadata);
  const actor = deriveActorUserId(record.metadata || {});
  const groupKey = deriveGroupKey(record.type, record.metadata || {});
  const payload = {
    ...(record.metadata && typeof record.metadata === "object" ? record.metadata : {}),
    legacyType: record.type,
    channels: record.channels,
  };
  const out = [];
  for (const uid of recipients) {
    const id = await insertRow({
      recipientUserId: uid,
      kind,
      title: record.title || "",
      body: record.message || "",
      payload,
      actorUserId: actor,
      groupKey,
    });
    if (id) out.push({ userId: uid, id });
  }
  return out;
}

async function listForUser(userId, { limit = 25, cursor = null, unreadOnly = false, includeGrouped = false } = {}) {
  if (!enabled() || !userId) return { items: [], nextCursor: null, unreadCount: 0, grouped: [] };
  const lim = Math.min(100, Math.max(1, Number(limit) || 25));
  let cursorCreated = null;
  let cursorId = null;
  if (cursor) {
    try {
      const obj = JSON.parse(Buffer.from(String(cursor), "base64").toString("utf8"));
      cursorCreated = obj.c;
      cursorId = obj.i;
    } catch {
      /* ignore */
    }
  }
  const params = [userId];
  let where = `WHERE user_id = $1`;
  if (unreadOnly) where += ` AND read_at IS NULL`;
  if (cursorCreated && cursorId) {
    params.push(cursorCreated, cursorId);
    const i1 = params.length - 1;
    const i2 = params.length;
    where += ` AND (created_at < $${i1}::timestamptz OR (created_at = $${i1}::timestamptz AND id < $${i2}))`;
  }
  params.push(lim + 1);
  const limIdx = params.length;
  const sql = `
    SELECT id, user_id, kind, title, body, payload, read_at, created_at, actor_user_id, group_key
    FROM ccweb_notifications
    ${where}
    ORDER BY created_at DESC, id DESC
    LIMIT $${limIdx}
  `;
  const { rows } = await query(sql, params);
  const slice = rows.slice(0, lim);
  let nextCursor = null;
  if (rows.length > lim) {
    const last = slice[slice.length - 1];
    nextCursor = Buffer.from(
      JSON.stringify({ c: new Date(last.created_at).toISOString(), i: last.id }),
      "utf8"
    ).toString("base64");
  }
  const items = slice.map(mapRow);
  const { rows: uc } = await query(
    `SELECT COUNT(*)::int AS c FROM ccweb_notifications WHERE user_id = $1 AND read_at IS NULL`,
    [userId]
  );
  const unreadCount = uc[0]?.c || 0;
  let grouped = [];
  if (includeGrouped && items.length) {
    const m = new Map();
    for (const it of items) {
      const k = it.groupKey || it.id;
      if (!m.has(k)) {
        m.set(k, {
          groupKey: it.groupKey,
          kind: it.kind,
          unread: 0,
          count: 0,
          latestAt: it.createdAt,
          sample: it,
        });
      }
      const g = m.get(k);
      g.count += 1;
      if (!it.read) g.unread += 1;
      if (new Date(it.createdAt) > new Date(g.latestAt)) {
        g.latestAt = it.createdAt;
        g.sample = it;
      }
    }
    grouped = [...m.values()].sort((a, b) => new Date(b.latestAt) - new Date(a.latestAt));
  }
  return { items, nextCursor, unreadCount, grouped };
}

async function markRead(userId, { notificationIds = [], markAll = false } = {}) {
  if (!enabled() || !userId) return 0;
  if (markAll) {
    const r = await query(`UPDATE ccweb_notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL`, [userId]);
    return r.rowCount || 0;
  }
  if (!notificationIds.length) return 0;
  const r = await query(
    `UPDATE ccweb_notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL AND id = ANY($2::text[])`,
    [userId, notificationIds]
  );
  return r.rowCount || 0;
}

async function unreadCount(userId) {
  if (!enabled() || !userId) return 0;
  const { rows } = await query(`SELECT COUNT(*)::int AS c FROM ccweb_notifications WHERE user_id = $1 AND read_at IS NULL`, [
    userId,
  ]);
  return rows[0]?.c || 0;
}

async function createChatMessageNotification({ recipientUserId, actorUserId, chatId, preview, messageId }) {
  return insertRow({
    recipientUserId,
    kind: "chat",
    title: "New message",
    body: (preview || "").slice(0, 280),
    payload: { chatId, messageId },
    actorUserId,
    groupKey: chatId ? `chat:${chatId}` : null,
  });
}

async function createLearnProgressNotification({ userId, title, body, payload }) {
  return insertRow({
    recipientUserId: userId,
    kind: "learn",
    title: title || "Learning progress",
    body: body || "",
    payload: payload || {},
    actorUserId: null,
    groupKey: payload?.courseSlug ? `learn:${payload.courseSlug}` : null,
  });
}

async function createFollowNotification({ recipientUserId, actorUserId, actorDisplayName }) {
  return insertRow({
    recipientUserId,
    kind: "follow",
    title: "New follower",
    body: `${(actorDisplayName || "Someone").toString().slice(0, 120)} started following you.`,
    payload: { followerId: actorUserId },
    actorUserId,
    groupKey: actorUserId ? `follow:${actorUserId}` : null,
  });
}

async function findMentionedUserIdsFromText(text, excludeUserId) {
  if (!enabled() || !text) return [];
  const re = /@([a-zA-Z0-9][a-zA-Z0-9_-]{1,40})/g;
  const handles = new Set();
  let m;
  while ((m = re.exec(text)) !== null) {
    handles.add(m[1].toLowerCase());
  }
  if (!handles.size) return [];
  const arr = [...handles];
  const { rows } = await query(
    `SELECT user_id FROM ccweb_user_profiles WHERE lower(display_name) = ANY($1::text[])`,
    [arr]
  );
  const ids = rows.map((r) => r.user_id).filter((id) => id && id !== excludeUserId);
  return [...new Set(ids)];
}

module.exports = {
  enabled,
  insertRow,
  insertFromLegacyEvent,
  listForUser,
  markRead,
  unreadCount,
  createChatMessageNotification,
  createLearnProgressNotification,
  createFollowNotification,
  findMentionedUserIdsFromText,
};
