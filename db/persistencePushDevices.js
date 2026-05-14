/**
 * Push device token registration (FCM/APNs prep).
 */

const crypto = require("crypto");
const { query } = require("./pool");

function usePostgres() {
  return Boolean((process.env.DATABASE_URL || "").trim());
}

function newId() {
  return `push_${crypto.randomBytes(8).toString("hex")}`;
}

const ALLOWED_PLATFORMS = new Set(["android", "ios", "web"]);

async function upsertDeviceToken(userId, platform, token) {
  if (!usePostgres() || !userId || !token) return { ok: false };
  let plat = String(platform || "web").toLowerCase().slice(0, 32);
  if (!ALLOWED_PLATFORMS.has(plat)) plat = "web";
  const tok = String(token).trim().slice(0, 4096);
  const id = newId();
  await query(
    `INSERT INTO ccweb_push_device_tokens (id, user_id, platform, token)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (user_id, platform, token) DO UPDATE SET updated_at = NOW()`,
    [id, userId, plat, tok]
  );
  return { ok: true };
}

async function listTokensForUser(userId, limit = 20) {
  if (!usePostgres() || !userId) return [];
  const lim = Math.min(50, Math.max(1, Number(limit) || 20));
  const { rows } = await query(
    `SELECT token, platform FROM ccweb_push_device_tokens
     WHERE user_id = $1 ORDER BY updated_at DESC LIMIT $2`,
    [userId, lim]
  );
  return rows || [];
}

module.exports = { upsertDeviceToken, listTokensForUser };
