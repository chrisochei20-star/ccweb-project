/**
 * AI tutor: conversations, messages, per-user long-term memory (PostgreSQL).
 */

const crypto = require("crypto");
const { query } = require("./pool");

function usePostgres() {
  return Boolean((process.env.DATABASE_URL || "").trim());
}

function newId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

async function ensureCcwebUser(userId) {
  if (!usePostgres() || !userId) return;
  await query(`INSERT INTO ccweb_users (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`, [userId]);
}

function parseJson(val, fallback) {
  if (val == null) return fallback;
  if (Array.isArray(val)) return val;
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

/* ---- User memory (long-term) ---- */

async function getUserMemory(userId) {
  if (!usePostgres() || !userId) return { summary: "", facts: [] };
  const { rows } = await query(`SELECT summary, facts, updated_at FROM ccweb_user_ai_memory WHERE user_id = $1`, [userId]);
  const r = rows[0];
  if (!r) return { summary: "", facts: [] };
  const facts = parseJson(r.facts, []);
  return {
    summary: r.summary || "",
    facts: Array.isArray(facts) ? facts.map(String).filter(Boolean).slice(0, 30) : [],
    updatedAt: r.updated_at,
  };
}

async function setUserMemory(userId, { summary, facts }) {
  if (!usePostgres() || !userId) return;
  await ensureCcwebUser(userId);
  const cur = await getUserMemory(userId);
  const nextSummary = summary !== undefined ? String(summary).slice(0, 4000) : cur.summary;
  const nextFacts =
    facts !== undefined ? facts.map(String).filter(Boolean).slice(0, 30) : cur.facts;
  await query(
    `INSERT INTO ccweb_user_ai_memory (user_id, summary, facts, updated_at)
     VALUES ($1,$2,$3::jsonb,NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       summary = EXCLUDED.summary,
       facts = EXCLUDED.facts,
       updated_at = NOW()`,
    [userId, nextSummary, JSON.stringify(nextFacts)]
  );
}

async function appendMemoryFacts(userId, newFacts) {
  if (!usePostgres() || !userId || !newFacts?.length) return;
  const cur = await getUserMemory(userId);
  const merged = [...cur.facts];
  for (const f of newFacts) {
    const s = String(f).trim().slice(0, 500);
    if (!s) continue;
    if (!merged.some((x) => x.toLowerCase() === s.toLowerCase())) merged.push(s);
  }
  await setUserMemory(userId, { summary: cur.summary, facts: merged.slice(-25) });
}

/** Append a short assistant excerpt into rolling summary (capped) for personalization. */
async function mergeRollingAssistantSnippet(userId, assistantText) {
  if (!usePostgres() || !userId) return;
  const cur = await getUserMemory(userId);
  const para = String(assistantText || "")
    .trim()
    .split(/\n\s*\n/)[0]
    .slice(0, 700);
  if (!para) return;
  const block = cur.summary ? `${cur.summary}\n\n• ${para}` : para;
  await setUserMemory(userId, { summary: block.slice(-4000), facts: cur.facts });
}

/* ---- Conversations ---- */

async function listConversations(userId, { limit = 40 } = {}) {
  if (!usePostgres() || !userId) return [];
  const { rows } = await query(
    `SELECT id, title, model, metadata, created_at, updated_at
     FROM ccweb_ai_conversations WHERE user_id = $1
     ORDER BY updated_at DESC NULLS LAST
     LIMIT $2`,
    [userId, Math.min(100, Math.max(1, limit))]
  );
  return rows.map(mapConvRow);
}

function mapConvRow(r) {
  return {
    id: r.id,
    title: r.title,
    model: r.model,
    metadata: parseJson(r.metadata, {}),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

async function findScopedConversation(userId, scope) {
  if (!usePostgres() || !userId) return null;
  const courseSlug = scope.courseSlug ? String(scope.courseSlug) : "";
  const lessonId = scope.lessonId ? String(scope.lessonId) : "";
  const mode = scope.mode ? String(scope.mode) : "general";
  const { rows } = await query(
    `SELECT id, title, model, metadata, created_at, updated_at
     FROM ccweb_ai_conversations
     WHERE user_id = $1
       AND COALESCE(metadata->>'scope','') = 'ccweb_tutor'
       AND COALESCE(metadata->>'courseSlug','') = $2
       AND COALESCE(metadata->>'lessonId','') = $3
       AND COALESCE(metadata->>'mode','general') = $4
     ORDER BY updated_at DESC
     LIMIT 1`,
    [userId, courseSlug, lessonId, mode]
  );
  return rows[0] ? mapConvRow(rows[0]) : null;
}

async function createConversation(userId, { title, metadata = {} }) {
  if (!usePostgres()) return null;
  await ensureCcwebUser(userId);
  const id = newId("conv");
  const meta = { ...metadata, scope: "ccweb_tutor" };
  await query(
    `INSERT INTO ccweb_ai_conversations (id, user_id, title, metadata, updated_at)
     VALUES ($1,$2,$3,$4::jsonb,NOW())`,
    [id, userId, String(title || "Chat").slice(0, 200), JSON.stringify(meta)]
  );
  return findConversationById(userId, id);
}

async function findConversationById(userId, conversationId) {
  if (!usePostgres() || !userId || !conversationId) return null;
  const { rows } = await query(
    `SELECT id, title, model, metadata, created_at, updated_at
     FROM ccweb_ai_conversations WHERE user_id = $1 AND id = $2`,
    [userId, conversationId]
  );
  return rows[0] ? mapConvRow(rows[0]) : null;
}

async function touchConversation(conversationId) {
  await query(`UPDATE ccweb_ai_conversations SET updated_at = NOW() WHERE id = $1`, [conversationId]);
}

async function getOrCreateScopedConversation(userId, { courseSlug, lessonId, mode, titleHint, extraMeta = {} }) {
  const existing = await findScopedConversation(userId, { courseSlug, lessonId, mode });
  if (existing) return existing;
  const meta = {
    ...extraMeta,
    scope: "ccweb_tutor",
    courseSlug: courseSlug || "",
    lessonId: lessonId || "",
    mode: mode || "general",
  };
  return createConversation(userId, { title: titleHint || "CCWEB AI Tutor", metadata: meta });
}

async function listMessages(conversationId, { limit = 24 } = {}) {
  if (!usePostgres() || !conversationId) return [];
  const lim = Math.min(80, Math.max(1, limit));
  const { rows } = await query(
    `SELECT id, role, content, metadata, created_at
     FROM ccweb_ai_messages
     WHERE conversation_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [conversationId, lim]
  );
  const chronological = rows.reverse();
  return chronological.map((r) => ({
    id: r.id,
    role: r.role,
    content: r.content,
    metadata: parseJson(r.metadata, {}),
    createdAt: r.created_at,
  }));
}

async function appendMessage(conversationId, role, content, metadata = {}) {
  if (!usePostgres() || !conversationId) return null;
  const id = newId("aim");
  await query(
    `INSERT INTO ccweb_ai_messages (id, conversation_id, role, content, metadata)
     VALUES ($1,$2,$3,$4,$5::jsonb)`,
    [id, conversationId, role, String(content || "").slice(0, 200000), JSON.stringify(metadata || {})]
  );
  await touchConversation(conversationId);
  return id;
}

async function deleteConversation(userId, conversationId) {
  if (!usePostgres()) return false;
  const { rowCount } = await query(`DELETE FROM ccweb_ai_conversations WHERE user_id = $1 AND id = $2`, [
    userId,
    conversationId,
  ]);
  return rowCount > 0;
}

module.exports = {
  usePostgres,
  ensureCcwebUser,
  getUserMemory,
  setUserMemory,
  appendMemoryFacts,
  mergeRollingAssistantSnippet,
  listConversations,
  findScopedConversation,
  getOrCreateScopedConversation,
  createConversation,
  findConversationById,
  listMessages,
  appendMessage,
  deleteConversation,
};
