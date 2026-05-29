/**
 * Deep-link routes for push notification taps (shared with in-app notification center).
 */

export function routeForPushPayload(payload = {}) {
  const data = payload?.data || payload?.notification?.data || payload || {};
  if (data.route && String(data.route).startsWith("/")) {
    return String(data.route);
  }

  const kind = String(data.kind || "").toLowerCase();
  let meta = {};
  try {
    if (data.payload) meta = typeof data.payload === "string" ? JSON.parse(data.payload) : data.payload;
  } catch {
    meta = {};
  }

  switch (kind) {
    case "chat":
      return meta.chatId ? `/messages?highlight=${encodeURIComponent(meta.chatId)}` : "/messages";
    case "learn":
      return meta.courseSlug ? `/courses/${encodeURIComponent(meta.courseSlug)}` : "/learn";
    case "like":
    case "repost":
    case "reply":
    case "mention":
    case "community":
      return meta.postId ? `/community?post=${encodeURIComponent(meta.postId)}` : "/community";
    case "earn":
      return "/earn";
    case "build":
      return meta.route || "/ai-tutor";
    case "follow":
      return meta.followerId ? `/profile?user=${encodeURIComponent(meta.followerId)}` : "/profile";
    default:
      if (String(data.legacyType || "").includes("ai")) return "/ai-tutor";
      return "/notifications";
  }
}

export function titleFromPushPayload(payload = {}) {
  const n = payload?.notification || payload;
  return n?.title || n?.data?.title || "CCWEB";
}

export function bodyFromPushPayload(payload = {}) {
  const n = payload?.notification || payload;
  return n?.body || n?.data?.body || "";
}
