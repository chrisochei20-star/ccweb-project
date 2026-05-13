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
    `SELECT user_id, display_name, roles, is_organic, push_enabled, avatar_url, banner_url,
            bio, headline, website_url, twitter_handle, created_at, updated_at
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

async function patchProfileMedia(userId, patch = {}) {
  const avatarUrl = patch.avatarUrl !== undefined ? patch.avatarUrl : undefined;
  const bannerUrl = patch.bannerUrl !== undefined ? patch.bannerUrl : undefined;
  if (!userId || (avatarUrl === undefined && bannerUrl === undefined)) return;
  const sets = [];
  const params = [];
  let i = 0;
  if (avatarUrl !== undefined) {
    i += 1;
    params.push(avatarUrl);
    sets.push(`avatar_url = $${i}`);
  }
  if (bannerUrl !== undefined) {
    i += 1;
    params.push(bannerUrl);
    sets.push(`banner_url = $${i}`);
  }
  if (!sets.length) return;
  i += 1;
  params.push(userId);
  await query(
    `UPDATE ccweb_user_profiles SET ${sets.join(", ")}, updated_at = NOW() WHERE user_id = $${i}`,
    params
  );
}

async function patchSocialFields(userId, patch = {}) {
  if (!userId || !patch || typeof patch !== "object") return;
  const sets = [];
  const params = [];
  let i = 0;
  const add = (col, val) => {
    if (val === undefined) return;
    i += 1;
    params.push(val);
    sets.push(`${col} = $${i}`);
  };
  const trunc = (s, n) => (s == null ? undefined : String(s).trim().slice(0, n));
  add("bio", trunc(patch.bio, 2000));
  add("headline", trunc(patch.headline, 200));
  add("website_url", trunc(patch.websiteUrl, 500));
  add("twitter_handle", trunc(patch.twitterHandle, 80).replace(/^@+/, ""));
  if (!sets.length) return;
  i += 1;
  params.push(userId);
  await query(
    `UPDATE ccweb_user_profiles SET ${sets.join(", ")}, updated_at = NOW() WHERE user_id = $${i}`,
    params
  );
}

module.exports = { findByUserId, upsert, parseRoles, patchProfileMedia, patchSocialFields };
