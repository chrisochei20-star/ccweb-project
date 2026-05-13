/**
 * Persisted AI agent runs (PostgreSQL).
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

async function insertRun({
  userId,
  agentId,
  input = {},
  outputPreview = "",
  provider = null,
  model = null,
  usage = {},
  mock = false,
  status = "completed",
}) {
  if (!usePostgres() || !userId || !agentId) return null;
  await ensureCcwebUser(userId);
  const id = newId("arun");
  await query(
    `INSERT INTO ccweb_agent_runs (id, user_id, agent_id, status, input_json, output_preview, provider, model, usage_json, mock)
     VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9::jsonb,$10)`,
    [
      id,
      userId,
      String(agentId).slice(0, 120),
      String(status).slice(0, 32),
      JSON.stringify(typeof input === "object" && input ? input : {}),
      String(outputPreview || "").slice(0, 8000),
      provider ? String(provider).slice(0, 64) : null,
      model ? String(model).slice(0, 120) : null,
      JSON.stringify(typeof usage === "object" && usage ? usage : {}),
      Boolean(mock),
    ]
  );
  return id;
}

async function listRuns(userId, limit = 40) {
  if (!usePostgres() || !userId) return [];
  const lim = Math.min(100, Math.max(1, limit));
  const { rows } = await query(
    `SELECT id, user_id, agent_id, status, input_json, output_preview, provider, model, usage_json, mock, created_at
     FROM ccweb_agent_runs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [userId, lim]
  );
  return rows.map((r) => ({
    id: r.id,
    agentId: r.agent_id,
    status: r.status,
    input: typeof r.input_json === "object" ? r.input_json : {},
    outputPreview: r.output_preview,
    provider: r.provider,
    model: r.model,
    usage: typeof r.usage_json === "object" ? r.usage_json : {},
    mock: r.mock,
    createdAt: new Date(r.created_at).toISOString(),
  }));
}

module.exports = { usePostgres, insertRun, listRuns };
