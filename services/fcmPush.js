/**
 * Firebase Cloud Messaging via firebase-admin.
 * No-op when FIREBASE_SERVICE_ACCOUNT_JSON is unset — never fake-delivers push.
 */

"use strict";

const { logger } = require("../logging/logger");

/** @type {import('firebase-admin') | null} */
let admin = null;
/** @type {boolean | null} */
let initAttempted = null;

function parseServiceAccount() {
  const raw = (process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "").trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    logger.error({ msg: "fcm_service_account_invalid_json", err: e.message });
    return null;
  }
}

function isFcmConfigured() {
  if (initAttempted === true) return Boolean(admin);
  return Boolean(parseServiceAccount());
}

function ensureAdmin() {
  if (initAttempted) return admin;
  initAttempted = true;
  const sa = parseServiceAccount();
  if (!sa) {
    admin = null;
    return null;
  }
  try {
    // eslint-disable-next-line global-require
    admin = require("firebase-admin");
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(sa),
      });
    }
    logger.info({ msg: "fcm_initialized", projectId: sa.project_id || null });
  } catch (e) {
    logger.error({ msg: "fcm_init_failed", err: e.message });
    admin = null;
  }
  return admin;
}

function resolveAndroidChannel(category) {
  const c = String(category || "").toLowerCase();
  if (c === "messages") return "ccweb_messages";
  if (c === "aialerts") return "ccweb_ai";
  if (c === "mentions" || c === "follows" || c === "reactions" || c === "comments") return "ccweb_social";
  return "ccweb_alerts";
}

/**
 * @param {string[]} tokens
 * @param {{ title: string, body: string, data?: Record<string, string>, channelId?: string }} payload
 * @returns {Promise<{ sent: number, failed: number, results: Array<{ token: string, ok: boolean, messageId?: string, errorCode?: string }> }>}
 */
async function sendMulticast(tokens, payload) {
  const uniq = [...new Set((tokens || []).filter(Boolean))];
  if (!uniq.length) {
    return { sent: 0, failed: 0, results: [] };
  }

  const fb = ensureAdmin();
  if (!fb) {
    return {
      sent: 0,
      failed: uniq.length,
      results: uniq.map((token) => ({ token, ok: false, errorCode: "fcm_not_configured" })),
    };
  }

  const data = {};
  if (payload.data && typeof payload.data === "object") {
    for (const [k, v] of Object.entries(payload.data)) {
      if (v != null) data[String(k)] = String(v);
    }
  }

  const message = {
    tokens: uniq,
    notification: {
      title: String(payload.title || "CCWEB").slice(0, 120),
      body: String(payload.body || "").slice(0, 500),
    },
    data,
    android: {
      priority: "high",
      collapseKey: payload.data?.groupKey || payload.data?.kind || undefined,
      notification: {
        channelId: payload.channelId || resolveAndroidChannel(payload.data?.category),
        sound: "default",
        color: "#22D3EE",
        tag: payload.data?.groupKey || payload.data?.kind || "ccweb",
      },
    },
  };

  try {
    const res = await fb.messaging().sendEachForMulticast(message);
    const results = [];
    uniq.forEach((token, i) => {
      const r = res.responses[i];
      if (r?.success) {
        results.push({ token, ok: true, messageId: r.messageId });
      } else {
        results.push({
          token,
          ok: false,
          errorCode: r?.error?.code || r?.error?.message || "send_failed",
        });
      }
    });
    return {
      sent: res.successCount,
      failed: res.failureCount,
      results,
    };
  } catch (e) {
    logger.warn({ msg: "fcm_multicast_error", err: e.message });
    return {
      sent: 0,
      failed: uniq.length,
      results: uniq.map((token) => ({ token, ok: false, errorCode: e.code || e.message })),
    };
  }
}

module.exports = {
  isFcmConfigured,
  ensureAdmin,
  sendMulticast,
  resolveAndroidChannel,
};
