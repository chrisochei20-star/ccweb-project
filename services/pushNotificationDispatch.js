/**
 * Dispatch real FCM push for in-app notification events (Railway + Capacitor).
 */

"use strict";

const pgUserProfile = require("../db/pgUserProfile");
const persistencePushDevices = require("../db/persistencePushDevices");
const persistencePushDelivery = require("../db/persistencePushDelivery");
const { sendMulticast, isFcmConfigured, resolveAndroidChannel } = require("./fcmPush");
const { logger } = require("../logging/logger");

const DEFAULT_NATIVE_CATEGORIES = {
  messages: true,
  mentions: true,
  follows: true,
  reactions: true,
  comments: true,
  aiAlerts: true,
};

function resolvePushCategory({ kind, legacyType }) {
  const t = String(legacyType || "").toLowerCase();
  const k = String(kind || "").toLowerCase();
  if (k === "chat" || t === "dm_received" || t === "chat_dm" || t === "community_chat_message") return "messages";
  if (k === "mention" || t === "mention") return "mentions";
  if (k === "follow" || t === "follow") return "follows";
  if (k === "like" || k === "repost" || t === "community_reaction_received") return "reactions";
  if (k === "reply" || t === "community_post_comment") return "comments";
  if (
    k === "learn" ||
    k === "build" ||
    t.startsWith("ai_") ||
    t.includes("stream") ||
    t === "ai_blog_published"
  ) {
    return "aiAlerts";
  }
  return null;
}

function buildPushRoute({ kind, payload = {}, legacyType }) {
  const p = payload && typeof payload === "object" ? payload : {};
  const k = String(kind || "").toLowerCase();
  switch (k) {
    case "chat":
      return p.chatId ? `/messages?highlight=${encodeURIComponent(p.chatId)}` : "/messages";
    case "learn":
      return p.courseSlug ? `/courses/${encodeURIComponent(p.courseSlug)}` : "/learn";
    case "like":
    case "repost":
    case "reply":
    case "mention":
    case "community":
      return p.postId ? `/community?post=${encodeURIComponent(p.postId)}` : "/community";
    case "earn":
      return "/earn";
    case "build":
      return p.route || "/ai-tutor";
    case "follow":
      return p.followerId ? `/profile?user=${encodeURIComponent(p.followerId)}` : "/profile";
    default:
      if (String(legacyType || "").includes("ai")) return "/ai-tutor";
      return "/notifications";
  }
}

function inQuietHours(quietHours) {
  if (!quietHours || typeof quietHours !== "object") return false;
  const start = quietHours.start;
  const end = quietHours.end;
  if (!start || !end) return false;
  try {
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    const parse = (s) => {
      const [h, m] = String(s).split(":").map(Number);
      return h * 60 + (m || 0);
    };
    const a = parse(start);
    const b = parse(end);
    if (a <= b) return mins >= a && mins < b;
    return mins >= a || mins < b;
  } catch {
    return false;
  }
}

async function shouldSendNativePush(userId, category, prefs, profileRow) {
  if (!category) return { ok: false, reason: "no_category" };
  if (profileRow?.push_enabled === false) return { ok: false, reason: "push_disabled_profile" };
  const native = prefs?.nativePush || {};
  if (native.enabled !== true) return { ok: false, reason: "native_push_disabled" };
  const catPref = native[category];
  if (catPref === false) return { ok: false, reason: `category_${category}_disabled` };
  if (catPref === undefined && DEFAULT_NATIVE_CATEGORIES[category] === false) {
    return { ok: false, reason: `category_${category}_default_off` };
  }
  if (inQuietHours(prefs?.quietHours)) return { ok: false, reason: "quiet_hours" };
  if (!isFcmConfigured()) return { ok: false, reason: "fcm_not_configured" };
  if (!persistencePushDevices.enabled()) return { ok: false, reason: "no_database" };
  const devices = await persistencePushDevices.listActiveTokensForUser(userId);
  if (!devices.length) return { ok: false, reason: "no_devices" };
  return { ok: true, devices };
}

/**
 * Fire-and-forget FCM dispatch for one recipient.
 */
async function dispatchPushForUser({
  userId,
  kind,
  title,
  body,
  payload,
  legacyType,
  notificationId,
}) {
  if (!userId) return;
  const category = resolvePushCategory({ kind, legacyType });
  try {
    const row = await pgUserProfile.findByUserId(userId);
    const prefs = pgUserProfile.parseNotificationPrefs(row?.notification_prefs);
    const gate = await shouldSendNativePush(userId, category, prefs, row);
    if (!gate.ok) {
      if (persistencePushDelivery.enabled()) {
        await persistencePushDelivery.logDelivery({
          userId,
          notificationKind: kind,
          pushCategory: category,
          status: "skipped",
          errorCode: gate.reason,
        });
      }
      return;
    }

    const route = buildPushRoute({ kind, payload, legacyType });
    const tokens = gate.devices.map((d) => d.token);
    const deviceByToken = new Map(gate.devices.map((d) => [d.token, d]));

    const result = await sendMulticast(tokens, {
      title: title || "CCWEB",
      body: body || "",
      channelId: resolveAndroidChannel(category),
      data: {
        kind: String(kind || ""),
        category: String(category || ""),
        groupKey: `${category || kind || "ccweb"}_${userId}`.slice(0, 64),
        route,
        notificationId: notificationId ? String(notificationId) : "",
        legacyType: legacyType ? String(legacyType) : "",
      },
    });

    for (const r of result.results) {
      const device = deviceByToken.get(r.token);
      await persistencePushDelivery.logDelivery({
        userId,
        deviceId: device?.id || null,
        notificationKind: kind,
        pushCategory: category,
        fcmMessageId: r.messageId || null,
        status: r.ok ? "sent" : "failed",
        errorCode: r.ok ? null : r.errorCode,
      });

      if (
        !r.ok &&
        r.errorCode &&
        /registration-token-not-registered|invalid-registration-token/i.test(String(r.errorCode))
      ) {
        await persistencePushDevices.revokeTokenForUser(userId, r.token);
      }
    }
  } catch (e) {
    logger.warn({ msg: "push_dispatch_failed", userId, kind, err: e.message });
    if (persistencePushDelivery.enabled()) {
      await persistencePushDelivery.logDelivery({
        userId,
        notificationKind: kind,
        pushCategory: category,
        status: "failed",
        errorCode: e.message,
      });
    }
  }
}

function dispatchPushForNotificationEvent(input) {
  const recipients = Array.isArray(input.recipientUserIds)
    ? input.recipientUserIds
    : input.userId
      ? [input.userId]
      : [];
  for (const userId of recipients) {
    void dispatchPushForUser({
      userId,
      kind: input.kind,
      title: input.title,
      body: input.body,
      payload: input.payload,
      legacyType: input.legacyType,
      notificationId: input.notificationId,
    });
  }
}

module.exports = {
  resolvePushCategory,
  buildPushRoute,
  shouldSendNativePush,
  dispatchPushForUser,
  dispatchPushForNotificationEvent,
  DEFAULT_NATIVE_CATEGORIES,
};
