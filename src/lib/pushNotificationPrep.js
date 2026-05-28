/**
 * Push notification preparation — no fake push; registers intent + prefs only.
 * Browser push requires service worker + VAPID keys (future phase).
 */

import { useNotificationsStore } from "../store/notificationsStore";

export async function registerBrowserPushInterest() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return { ok: false, reason: "unsupported" };
  }
  const permission = await Notification.requestPermission();
  const enabled = permission === "granted";
  try {
    const data = await useNotificationsStore.getState().savePreferences({
      browserPush: {
        enabled,
        subscribedAt: enabled ? new Date().toISOString() : null,
      },
    });
    return { ok: enabled, permission, preferences: data.preferences };
  } catch (e) {
    return { ok: false, reason: e.message || "save_failed" };
  }
}

export function notificationPrefsReadyForNative() {
  const prefs = useNotificationsStore.getState().prefs;
  return Boolean(prefs?.nativePush?.enabled === false || prefs?.nativePush);
}
