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

function parseSocialLinks(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const j = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
}

function parseNotificationPrefs(raw) {
  if (!raw || typeof raw !== "object") {
    try {
      const j = typeof raw === "string" ? JSON.parse(raw) : raw;
      return j && typeof j === "object" && !Array.isArray(j) ? j : {};
    } catch {
      return {};
    }
  }
  return raw;
}

function mapProfileRow(r) {
  if (!r) return null;
  return {
    user_id: r.user_id,
    display_name: r.display_name,
    roles: r.roles,
    is_organic: r.is_organic,
    push_enabled: r.push_enabled,
    avatar_url: r.avatar_url,
    banner_url: r.banner_url,
    bio: r.bio,
    location: r.location,
    website: r.website,
    social_links: r.social_links,
    verified_at: r.verified_at,
    notification_prefs: r.notification_prefs,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

async function findByUserId(userId) {
  const { rows } = await query(
    `SELECT user_id, display_name, roles, is_organic, push_enabled, avatar_url, banner_url,
            bio, location, website, social_links, verified_at, notification_prefs, created_at, updated_at
     FROM ccweb_user_profiles WHERE user_id = $1`,
    [userId]
  );
  return mapProfileRow(rows[0]) || null;
}

async function upsert({ userId, displayName, roles, isOrganic, pushEnabled, bio, location, website, socialLinks }) {
  const r = Array.isArray(roles) ? roles : ["member"];
  const linksJson = JSON.stringify(Array.isArray(socialLinks) ? socialLinks : []);
  await query(
    `INSERT INTO ccweb_user_profiles (user_id, display_name, roles, is_organic, push_enabled, bio, location, website, social_links, updated_at)
     VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7, $8, $9::jsonb, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       display_name = EXCLUDED.display_name,
       roles = EXCLUDED.roles,
       is_organic = EXCLUDED.is_organic,
       push_enabled = EXCLUDED.push_enabled,
       bio = COALESCE(EXCLUDED.bio, ccweb_user_profiles.bio),
       location = COALESCE(EXCLUDED.location, ccweb_user_profiles.location),
       website = COALESCE(EXCLUDED.website, ccweb_user_profiles.website),
       social_links = COALESCE(EXCLUDED.social_links, ccweb_user_profiles.social_links),
       updated_at = NOW()`,
    [
      userId,
      displayName || "Member",
      JSON.stringify(r),
      isOrganic !== false,
      pushEnabled !== false,
      bio !== undefined ? bio : null,
      location !== undefined ? location : null,
      website !== undefined ? website : null,
      linksJson,
    ]
  );
}

async function patchProfileFields(userId, patch = {}) {
  if (!userId) return;
  const sets = [];
  const params = [];
  let i = 0;
  const fields = [
    ["bio", patch.bio],
    ["location", patch.location],
    ["website", patch.website],
  ];
  for (const [col, val] of fields) {
    if (val !== undefined) {
      i += 1;
      params.push(val === null || val === "" ? null : String(val).slice(0, col === "bio" ? 500 : 120));
      sets.push(`${col} = $${i}`);
    }
  }
  if (patch.socialLinks !== undefined) {
    i += 1;
    params.push(JSON.stringify(Array.isArray(patch.socialLinks) ? patch.socialLinks : []));
    sets.push(`social_links = $${i}::jsonb`);
  }
  if (!sets.length) return;
  i += 1;
  params.push(userId);
  await query(
    `UPDATE ccweb_user_profiles SET ${sets.join(", ")}, updated_at = NOW() WHERE user_id = $${i}`,
    params
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

async function patchNotificationPrefs(userId, prefs = {}) {
  if (!userId || !prefs || typeof prefs !== "object") return null;
  const merged = JSON.stringify(prefs);
  await query(
    `UPDATE ccweb_user_profiles SET notification_prefs = COALESCE(notification_prefs, '{}'::jsonb) || $1::jsonb, updated_at = NOW()
     WHERE user_id = $2`,
    [merged, userId]
  );
  const row = await findByUserId(userId);
  return parseNotificationPrefs(row?.notification_prefs);
}

async function getNotificationPrefs(userId) {
  const row = await findByUserId(userId);
  if (!row) return {};
  return parseNotificationPrefs(row.notification_prefs);
}

module.exports = {
  findByUserId,
  upsert,
  parseRoles,
  parseSocialLinks,
  parseNotificationPrefs,
  patchProfileMedia,
  patchProfileFields,
  patchNotificationPrefs,
  getNotificationPrefs,
};
