/**
 * App profile rows (display name, prefs) — survives API process restarts unlike in-memory ccwebUsers.
 */

const { query } = require("./pool");

function parseRoles(raw) {
  if (!raw) return ["member"];
  if (Array.isArray(raw)) return raw.length ? raw : ["member"];
  if (typeof raw === "object") return Array.isArray(raw.roles) ? raw.roles : ["member"];
  try {
    const j = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(j) ? j : ["member"];
  } catch {
    return ["member"];
  }
}

async function findByUserId(userId) {
  const { rows } = await query(
    `SELECT user_id, display_name, roles, is_organic, push_enabled, created_at, updated_at
     FROM ccweb_user_profiles WHERE user_id = $1`,
    [userId]
  );
  return rows[0] || null;
}

async function upsert({ userId, displayName, roles, isOrganic, pushEnabled }) {
  const r = Array.isArray(roles) ? roles : ["member"];
  await query(
    `INSERT INTO ccweb_user_profiles (user_id, display_name, roles, is_organic, push_enabled, updated_at)
     VALUES ($1, $2, $3::jsonb, $4, $5, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       display_name = EXCLUDED.display_name,
       roles = EXCLUDED.roles,
       is_organic = EXCLUDED.is_organic,
       push_enabled = EXCLUDED.push_enabled,
       updated_at = NOW()`,
    [userId, displayName || "Member", JSON.stringify(r), isOrganic !== false, pushEnabled !== false]
  );
}

module.exports = { findByUserId, upsert, parseRoles };
