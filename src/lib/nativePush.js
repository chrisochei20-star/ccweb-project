/**
 * FCM-ready native push architecture for Capacitor Android.
 * Requires `google-services.json` + Firebase project (see docs/MOBILE_APP_DEPLOYMENT.md).
 */

import { apiUrl } from "../config/env";
import { apiFetch } from "./apiClient";
import { isCapacitorNative } from "./capacitorPlatform";
import { useNotificationsStore } from "../store/notificationsStore";

/** @type {string | null} */
let lastDeviceToken = null;

export function getNativePushDeviceToken() {
  return lastDeviceToken;
}

async function registerDeviceTokenWithApi(token, platform = "android") {
  if (!token) return { ok: false, reason: "no_token" };
  try {
    const res = await apiFetch(
      apiUrl("/api/v1/notifications/device-token"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, platform, provider: "fcm" }),
      },
      { networkRetries: 2, timeoutMs: 15000 }
    );
    if (res.status === 404 || res.status === 501) {
      return { ok: false, reason: "endpoint_not_ready", status: res.status };
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, reason: data.error || "register_failed", status: res.status };
    }
    return { ok: true, data };
  } catch (e) {
    return { ok: false, reason: e?.message || "network" };
  }
}

async function persistNativePushPreference(enabled) {
  try {
    await useNotificationsStore.getState().savePreferences({
      nativePush: {
        enabled,
        subscribedAt: enabled ? new Date().toISOString() : null,
        provider: "fcm",
      },
    });
  } catch {
    /* prefs optional offline */
  }
}

/**
 * Register Capacitor PushNotifications listeners and request permission.
 * Idempotent — safe to call once at app boot on native.
 */
export async function initNativePushNotifications() {
  if (!isCapacitorNative()) {
    return { ok: false, reason: "not_native" };
  }

  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");

    await PushNotifications.addListener("registration", async (ev) => {
      lastDeviceToken = ev.value || null;
      if (lastDeviceToken) {
        await registerDeviceTokenWithApi(lastDeviceToken);
        await persistNativePushPreference(true);
      }
    });

    await PushNotifications.addListener("registrationError", () => {
      lastDeviceToken = null;
    });

    await PushNotifications.addListener("pushNotificationReceived", (notification) => {
      useNotificationsStore.getState().notifySocketTick();
      document.dispatchEvent(
        new CustomEvent("ccweb:native-push", { detail: { phase: "foreground", notification } })
      );
    });

    await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      document.dispatchEvent(
        new CustomEvent("ccweb:native-push", { detail: { phase: "action", action } })
      );
    });

    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === "prompt") {
      perm = await PushNotifications.requestPermissions();
    }
    if (perm.receive !== "granted") {
      await persistNativePushPreference(false);
      return { ok: false, reason: "permission_denied", permission: perm.receive };
    }

    await PushNotifications.register();
    return { ok: true, permission: perm.receive };
  } catch (e) {
    return { ok: false, reason: e?.message || "init_failed" };
  }
}
