/**
 * Trust & safety: user reports.
 */

const crypto = require("crypto");
const { query } = require("./pool");

function usePostgres() {
  return Boolean((process.env.DATABASE_URL || "").trim());
}

function newId() {
  return `rep_${crypto.randomBytes(8).toString("hex")}`;
}

const TARGETS = new Set(["post", "comment", "message", "user", "marketplace_listing"]);
const REASONS = new Set(["spam", "harassment", "scam", "ip_violation", "self_harm", "other"]);

async function createReport({ reporterUserId, targetType, targetId, reasonCode, body }) {
  if (!usePostgres()) return { ok: false, error: "NO_DATABASE" };
  const tt = String(targetType || "").toLowerCase();
  const tid = String(targetId || "").trim();
  if (!TARGETS.has(tt) || !tid) return { ok: false, error: "invalid_target" };
  const rc = REASONS.has(String(reasonCode || "").toLowerCase()) ? String(reasonCode).toLowerCase() : "other";
  const b = String(body || "").trim().slice(0, 4000);
  const exists = await assertTargetExists(tt, tid);
  if (!exists) return { ok: false, error: "target_not_found" };
  const id = newId();
  await query(
    `INSERT INTO ccweb_trust_reports (id, reporter_user_id, target_type, target_id, reason_code, body, status)
     VALUES ($1,$2,$3,$4,$5,$6,'open')`,
    [id, reporterUserId, tt, tid, rc, b]
  );
  return { ok: true, id };
}

async function listReportsForAdmin({ status = null, limit = 50 } = {}) {
  if (!usePostgres()) return [];
  const lim = Math.min(200, Math.max(1, limit));
  if (status) {
    const { rows } = await query(
      `SELECT * FROM ccweb_trust_reports WHERE status = $1 ORDER BY created_at DESC LIMIT $2`,
      [String(status), lim]
    );
    return rows.map(mapRow);
  }
  const { rows } = await query(`SELECT * FROM ccweb_trust_reports ORDER BY created_at DESC LIMIT $1`, [lim]);
  return rows.map(mapRow);
}

async function updateReportStatus(reportId, { status, moderatorNote, resolved = true }) {
  if (!usePostgres()) return { ok: false };
  const st = String(status || "").toLowerCase();
  if (!["open", "reviewing", "actioned", "dismissed"].includes(st)) return { ok: false, error: "bad_status" };
  const note = moderatorNote != null ? String(moderatorNote).slice(0, 2000) : null;
  const { rowCount } = await query(
    `UPDATE ccweb_trust_reports SET status = $2, moderator_note = COALESCE($3, moderator_note),
        resolved_at = CASE WHEN $4 THEN NOW() ELSE resolved_at END
     WHERE id = $1`,
    [reportId, st, note, Boolean(resolved)]
  );
  return { ok: rowCount > 0 };
}

function mapRow(r) {
  return {
    id: r.id,
    reporterUserId: r.reporter_user_id,
    targetType: r.target_type,
    targetId: r.target_id,
    reasonCode: r.reason_code,
    body: r.body,
    status: r.status,
    moderatorNote: r.moderator_note,
    resolvedAt: r.resolved_at,
    createdAt: r.created_at,
  };
}

async function assertTargetExists(targetType, targetId) {
  if (targetType === "post") {
    const { rows } = await query(`SELECT 1 FROM community_posts WHERE id = $1 LIMIT 1`, [targetId]);
    return rows.length > 0;
  }
  if (targetType === "comment") {
    const { rows } = await query(`SELECT 1 FROM community_post_comments WHERE id = $1 LIMIT 1`, [targetId]);
    return rows.length > 0;
  }
  if (targetType === "message") {
    const { rows } = await query(`SELECT 1 FROM ccweb_chat_messages WHERE id = $1 LIMIT 1`, [targetId]);
    return rows.length > 0;
  }
  if (targetType === "user") {
    const { rows } = await query(`SELECT 1 FROM ccweb_users WHERE id = $1 LIMIT 1`, [targetId]);
    return rows.length > 0;
  }
  if (targetType === "marketplace_listing") {
    const { rows } = await query(`SELECT 1 FROM ccweb_marketplace_listings WHERE id = $1 LIMIT 1`, [targetId]);
    return rows.length > 0;
  }
  return false;
}

module.exports = {
  createReport,
  listReportsForAdmin,
  updateReportStatus,
  assertTargetExists,
};
