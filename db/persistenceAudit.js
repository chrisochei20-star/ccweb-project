/**
 * Append-only audit log for admin / system actions (no raw bank data).
 */

const crypto = require("crypto");
const { query } = require("./pool");

function usePostgres() {
  return Boolean((process.env.DATABASE_URL || "").trim());
}

function newId() {
  return `aud_${crypto.randomBytes(8).toString("hex")}`;
}

function hashIp(ip) {
  const salt = (process.env.CCWEB_AUDIT_IP_SALT || process.env.CCWEB_ADMIN_KEY || "ccweb-audit").toString().slice(0, 64);
  const raw = `${salt}:${ip || ""}`;
  return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 64);
}

async function insertAuditLog({
  actorKind = "admin",
  actorLabel = null,
  action,
  targetType = null,
  targetId = null,
  ip = null,
  metadata = {},
}) {
  if (!usePostgres() || !action) return null;
  const id = newId();
  await query(
    `INSERT INTO ccweb_admin_audit_logs (id, actor_kind, actor_label, action, target_type, target_id, ip_hash, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)`,
    [
      id,
      String(actorKind).slice(0, 32),
      actorLabel ? String(actorLabel).slice(0, 120) : null,
      String(action).slice(0, 120),
      targetType ? String(targetType).slice(0, 64) : null,
      targetId ? String(targetId).slice(0, 200) : null,
      ip ? hashIp(ip) : null,
      JSON.stringify(metadata && typeof metadata === "object" ? metadata : {}),
    ]
  );
  return id;
}

async function listAuditLogs(limit = 80) {
  if (!usePostgres()) return [];
  const lim = Math.min(500, Math.max(1, limit));
  const { rows } = await query(
    `SELECT id, actor_kind, actor_label, action, target_type, target_id, ip_hash, metadata, created_at
     FROM ccweb_admin_audit_logs ORDER BY created_at DESC LIMIT $1`,
    [lim]
  );
  return rows.map((r) => ({
    id: r.id,
    actorKind: r.actor_kind,
    actorLabel: r.actor_label,
    action: r.action,
    targetType: r.target_type,
    targetId: r.target_id,
    ipHash: r.ip_hash,
    metadata: typeof r.metadata === "object" ? r.metadata : {},
    createdAt: r.created_at,
  }));
}

module.exports = {
  insertAuditLog,
  listAuditLogs,
  hashIp,
};
