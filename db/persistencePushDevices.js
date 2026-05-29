/**
 * FCM device token persistence (encrypted at rest when configured).
 */

"use strict";

const crypto = require("crypto");
const { query } = require("./pool");
const { hashToken, encryptToken, decryptToken } = require("../services/pushTokenCrypto");

function enabled() {
  return Boolean((process.env.DATABASE_URL || "").trim());
}

function newId() {
  return `pd_${crypto.randomBytes(8).toString("hex")}`;
}

async function upsertDeviceToken({
  userId,
  token,
  platform = "android",
  provider = "fcm",
  deviceLabel = null,
  appVersion = null,
}) {
  if (!enabled() || !userId || !token) return null;
  const tokenHash = hashToken(token);
  const { ciphertext, encrypted } = encryptToken(token);

  const existing = await query(
    `SELECT id FROM ccweb_push_devices WHERE token_hash = $1 AND revoked_at IS NULL LIMIT 1`,
    [tokenHash]
  );

  if (existing.rows[0]) {
    const { rows } = await query(
      `UPDATE ccweb_push_devices SET
         user_id = $2,
         token_ciphertext = $3,
         token_encrypted = $4,
         platform = $5,
         provider = $6,
         device_label = COALESCE($7, device_label),
         app_version = COALESCE($8, app_version),
         last_seen_at = NOW()
       WHERE id = $1
       RETURNING id, user_id, platform, provider, device_label, app_version, last_seen_at, created_at, token_encrypted`,
      [
        existing.rows[0].id,
        userId,
        ciphertext,
        encrypted,
        platform,
        provider,
        deviceLabel,
        appVersion,
      ]
    );
    const row = rows[0];
    return row
      ? {
          id: row.id,
          userId: row.user_id,
          platform: row.platform,
          provider: row.provider,
          deviceLabel: row.device_label,
          appVersion: row.app_version,
          lastSeenAt: row.last_seen_at,
          createdAt: row.created_at,
          encrypted: row.token_encrypted,
        }
      : null;
  }

  await query(
    `UPDATE ccweb_push_devices SET revoked_at = NOW()
     WHERE token_hash = $1 AND revoked_at IS NULL AND user_id <> $2`,
    [tokenHash, userId]
  );

  const id = newId();
  const { rows } = await query(
    `INSERT INTO ccweb_push_devices (
       id, user_id, token_hash, token_ciphertext, token_encrypted, platform, provider, device_label, app_version, last_seen_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
     RETURNING id, user_id, platform, provider, device_label, app_version, last_seen_at, created_at, token_encrypted`,
    [id, userId, tokenHash, ciphertext, encrypted, platform, provider, deviceLabel, appVersion]
  );

  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    platform: row.platform,
    provider: row.provider,
    deviceLabel: row.device_label,
    appVersion: row.app_version,
    lastSeenAt: row.last_seen_at,
    createdAt: row.created_at,
    encrypted: row.token_encrypted,
  };
}

async function listActiveTokensForUser(userId) {
  if (!enabled() || !userId) return [];
  const { rows } = await query(
    `SELECT id, token_ciphertext, token_encrypted, platform, provider, device_label, last_seen_at
     FROM ccweb_push_devices
     WHERE user_id = $1 AND revoked_at IS NULL
     ORDER BY last_seen_at DESC
     LIMIT 20`,
    [userId]
  );
  const out = [];
  for (const row of rows) {
    try {
      out.push({
        id: row.id,
        token: decryptToken(row.token_ciphertext, row.token_encrypted),
        platform: row.platform,
        provider: row.provider,
        deviceLabel: row.device_label,
        lastSeenAt: row.last_seen_at,
      });
    } catch {
      /* skip undecryptable */
    }
  }
  return out;
}

async function revokeTokenForUser(userId, token) {
  if (!enabled() || !userId) return 0;
  if (token) {
    const tokenHash = hashToken(token);
    const r = await query(
      `UPDATE ccweb_push_devices SET revoked_at = NOW()
       WHERE user_id = $1 AND token_hash = $2 AND revoked_at IS NULL`,
      [userId, tokenHash]
    );
    return r.rowCount || 0;
  }
  const r = await query(
    `UPDATE ccweb_push_devices SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId]
  );
  return r.rowCount || 0;
}

async function revokeDeviceById(deviceId) {
  if (!enabled() || !deviceId) return 0;
  const r = await query(
    `UPDATE ccweb_push_devices SET revoked_at = NOW() WHERE id = $1 AND revoked_at IS NULL`,
    [deviceId]
  );
  return r.rowCount || 0;
}

async function touchToken(token) {
  if (!enabled() || !token) return;
  const tokenHash = hashToken(token);
  await query(
    `UPDATE ccweb_push_devices SET last_seen_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL`,
    [tokenHash]
  );
}

async function listDevicesForUser(userId) {
  if (!enabled() || !userId) return [];
  const { rows } = await query(
    `SELECT id, platform, provider, device_label, app_version, last_seen_at, created_at, token_encrypted
     FROM ccweb_push_devices
     WHERE user_id = $1 AND revoked_at IS NULL
     ORDER BY last_seen_at DESC`,
    [userId]
  );
  return rows.map((r) => ({
    id: r.id,
    platform: r.platform,
    provider: r.provider,
    deviceLabel: r.device_label,
    appVersion: r.app_version,
    lastSeenAt: r.last_seen_at,
    createdAt: r.created_at,
    encrypted: r.token_encrypted,
  }));
}

module.exports = {
  enabled,
  upsertDeviceToken,
  listActiveTokensForUser,
  revokeTokenForUser,
  revokeDeviceById,
  touchToken,
  listDevicesForUser,
};
