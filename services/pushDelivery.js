/**
 * Firebase Cloud Messaging HTTP v1 (Android + iOS clients that register an FCM token).
 * Configure via FCM_SERVICE_ACCOUNT_JSON or FCM_PROJECT_ID + FCM_CLIENT_EMAIL + FCM_PRIVATE_KEY.
 * APNs credentials are managed inside the Firebase console for iOS apps using FCM.
 */

"use strict";

const axios = require("axios");
const { JWT } = require("google-auth-library");
const { logger } = require("../logging/logger");
const pushDevices = require("../db/persistencePushDevices");
const pgUserProfile = require("../db/pgUserProfile");

let accessCache = { token: null, expiresAt: 0 };

function parseServiceAccount() {
  const raw = String(process.env.FCM_SERVICE_ACCOUNT_JSON || "").trim();
  if (raw) {
    try {
      const j = JSON.parse(raw);
      if (j.project_id && j.client_email && j.private_key) return j;
    } catch {
      return null;
    }
  }
  const projectId = String(process.env.FCM_PROJECT_ID || "").trim();
  const clientEmail = String(process.env.FCM_CLIENT_EMAIL || "").trim();
  const pk = String(process.env.FCM_PRIVATE_KEY || "").trim().replace(/\\n/g, "\n");
  if (projectId && clientEmail && pk) {
    return { project_id: projectId, client_email: clientEmail, private_key: pk };
  }
  return null;
}

function isFcmConfigured() {
  return Boolean(parseServiceAccount());
}

async function getMessagingAccessToken() {
  const sa = parseServiceAccount();
  if (!sa) return null;
  const now = Date.now();
  if (accessCache.token && accessCache.expiresAt > now + 15_000) {
    return { token: accessCache.token, projectId: sa.project_id };
  }
  const client = new JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
  });
  const res = await client.getAccessToken();
  const token = res.token || null;
  accessCache = { token, expiresAt: now + 50 * 60 * 1000 };
  return token ? { token, projectId: sa.project_id } : null;
}

function deriveNotificationDeepLink(kind, payload = {}) {
  const p = payload && typeof payload === "object" ? payload : {};
  if (typeof p.deepLink === "string" && p.deepLink.startsWith("/")) return p.deepLink.slice(0, 512);
  if (typeof p.path === "string" && p.path.startsWith("/")) return p.path.slice(0, 512);
  const k = String(kind || "").toLowerCase();
  if (k === "chat") {
    const cid = String(p.chatId || "").trim();
    return cid ? `/messages?chat=${encodeURIComponent(cid)}` : "/messages";
  }
  if (k === "follow") return "/notifications";
  if (k === "earn") {
    if (p.marketplacePurchaseId || p.listingId) return "/shop/creator/dashboard";
    return "/earn";
  }
  if (k === "learn") {
    const slug = String(p.courseSlug || "").trim();
    return slug ? `/courses/${encodeURIComponent(slug)}` : "/learn";
  }
  if (k === "mention" || k === "reply" || k === "like" || k === "repost" || k === "community") return "/community";
  return "/notifications";
}

function fcmDataStrings({ notificationId, kind, path, extra = {} }) {
  const out = {
    path: String(path || "/notifications").slice(0, 512),
    ntfId: String(notificationId || "").slice(0, 120),
    kind: String(kind || "platform").slice(0, 64),
  };
  for (const [key, val] of Object.entries(extra)) {
    if (Object.keys(out).length >= 14) break;
    const k = String(key).slice(0, 48);
    out[k] = String(val ?? "").slice(0, 1024);
  }
  return out;
}

async function sendFcmToToken(access, fcmToken, { title, body, data }) {
  const url = `https://fcm.googleapis.com/v1/projects/${access.projectId}/messages:send`;
  const message = {
    token: fcmToken,
    notification: {
      title: String(title || "CCWEB").slice(0, 120),
      body: String(body || "").slice(0, 400),
    },
    data,
    android: { priority: "HIGH" },
    apns: {
      headers: { "apns-priority": "10" },
      payload: { aps: { sound: "default", category: "CCWEB_ALERT" } },
    },
  };
  await axios.post(url, { message }, { headers: { Authorization: `Bearer ${access.token}` }, timeout: 12_000 });
}

/**
 * Fire-and-forget push for a persisted notification row.
 * @param {string} userId
 * @param {{ id: string, kind: string, title: string, body: string, payload?: object }} n
 */
async function notifyUserForPgNotification(userId, n) {
  if (!userId || !n?.id) return;
  if (!isFcmConfigured()) return;
  try {
    const profile = await pgUserProfile.findByUserId(userId);
    if (profile && profile.push_enabled === false) return;
  } catch {
    /* continue */
  }
  let tokens;
  try {
    tokens = await pushDevices.listTokensForUser(userId, 24);
  } catch (e) {
    logger.warn({ msg: "push_list_tokens_failed", err: e.message, userId });
    return;
  }
  if (!tokens.length) return;
  let access;
  try {
    access = await getMessagingAccessToken();
  } catch (e) {
    logger.warn({ msg: "push_fcm_auth_failed", err: e.message });
    return;
  }
  if (!access?.token) return;
  const path = deriveNotificationDeepLink(n.kind, n.payload);
  const data = fcmDataStrings({
    notificationId: n.id,
    kind: n.kind,
    path,
    extra: {
      listingId: n.payload?.listingId,
      chatId: n.payload?.chatId,
      skuId: n.payload?.skuId,
    },
  });
  for (const row of tokens) {
    const tok = String(row.token || "").trim();
    if (!tok) continue;
    try {
      await sendFcmToToken(access, tok, { title: n.title, body: n.body, data });
    } catch (e) {
      const status = e.response?.status;
      logger.warn({ msg: "push_fcm_send_failed", status, err: e.message });
    }
  }
}

module.exports = {
  isFcmConfigured,
  notifyUserForPgNotification,
  deriveNotificationDeepLink,
  fcmDataStrings,
};
