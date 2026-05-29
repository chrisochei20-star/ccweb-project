/**
 * FCM delivery diagnostics log.
 */

"use strict";

const crypto = require("crypto");
const { query } = require("./pool");

function enabled() {
  return Boolean((process.env.DATABASE_URL || "").trim());
}

function newId() {
  return `pdl_${crypto.randomBytes(8).toString("hex")}`;
}

async function logDelivery({
  userId,
  deviceId,
  notificationKind,
  pushCategory,
  fcmMessageId,
  status,
  errorCode,
}) {
  if (!enabled()) return null;
  const id = newId();
  await query(
    `INSERT INTO ccweb_push_delivery_log (id, user_id, device_id, notification_kind, push_category, fcm_message_id, status, error_code)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      id,
      userId || null,
      deviceId || null,
      notificationKind || null,
      pushCategory || null,
      fcmMessageId || null,
      status,
      errorCode || null,
    ]
  );
  return id;
}

async function recentForUser(userId, limit = 25) {
  if (!enabled() || !userId) return [];
  const lim = Math.min(50, Math.max(1, Number(limit) || 25));
  const { rows } = await query(
    `SELECT id, notification_kind, push_category, fcm_message_id, status, error_code, created_at, device_id
     FROM ccweb_push_delivery_log
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, lim]
  );
  return rows.map((r) => ({
    id: r.id,
    notificationKind: r.notification_kind,
    pushCategory: r.push_category,
    fcmMessageId: r.fcm_message_id,
    status: r.status,
    errorCode: r.error_code,
    createdAt: r.created_at,
    deviceId: r.device_id,
  }));
}

async function summaryForUser(userId, hours = 24) {
  if (!enabled() || !userId) return { sent: 0, failed: 0, skipped: 0 };
  const { rows } = await query(
    `SELECT status, COUNT(*)::int AS c
     FROM ccweb_push_delivery_log
     WHERE user_id = $1 AND created_at > NOW() - ($2::text || ' hours')::interval
     GROUP BY status`,
    [userId, String(Math.min(168, Math.max(1, Number(hours) || 24)))]
  );
  const out = { sent: 0, failed: 0, skipped: 0 };
  for (const r of rows) {
    if (r.status === "sent") out.sent += r.c;
    else if (r.status === "failed") out.failed += r.c;
    else if (r.status === "skipped") out.skipped += r.c;
  }
  return out;
}

module.exports = {
  enabled,
  logDelivery,
  recentForUser,
  summaryForUser,
};
