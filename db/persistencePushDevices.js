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

async function upsertDeviceToken(userId, platform, token) {
  if (!usePostgres() || !userId || !token) return { ok: false };
  const plat = String(platform || "web").toLowerCase().slice(0, 32);
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

module.exports = { upsertDeviceToken };
