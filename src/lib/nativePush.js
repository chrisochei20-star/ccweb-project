/**
 * Capacitor FCM native push — registration, refresh, foreground/background, diagnostics.
 */

import { apiUrl } from "../config/env";
import { apiFetch } from "./apiClient";
import { isCapacitorNative } from "./capacitorPlatform";
import { useNotificationsStore } from "../store/notificationsStore";

/** @type {string | null} */
let lastDeviceToken = null;
/** @type {boolean} */
let listenersWired = false;
/** @type {{ registeredAt?: string; lastError?: string; fcmConfigured?: boolean } | null} */
let lastRegistrationMeta = null;

export function getNativePushDeviceToken() {
  return lastDeviceToken;
}

export function getNativePushDiagnostics() {
  return {
    tokenPresent: Boolean(lastDeviceToken),
    tokenPreview: lastDeviceToken ? `${lastDeviceToken.slice(0, 8)}…` : null,
    listenersWired,
    ...lastRegistrationMeta,
  };
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
        body: JSON.stringify({
          token,
          platform,
          provider: "fcm",
          appVersion: import.meta.env.VITE_CCWEB_BUILD_ID || "mobile",
        }),
      },
      { networkRetries: 2, timeoutMs: 15000 }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      lastRegistrationMeta = { lastError: data.error || "register_failed", registeredAt: null };
      return { ok: false, reason: data.error || "register_failed", status: res.status };
    }
    lastRegistrationMeta = {
      registeredAt: new Date().toISOString(),
      fcmConfigured: data.fcmConfigured,
      lastError: undefined,
    };
    return { ok: true, data };
  } catch (e) {
    lastRegistrationMeta = { lastError: e?.message || "network" };
    return { ok: false, reason: e?.message || "network" };
  }
}

export async function revokeNativeDeviceToken(token = lastDeviceToken) {
  if (!token) return { ok: true, revoked: 0 };
  try {
    const res = await apiFetch(
      apiUrl("/api/v1/notifications/device-token"),
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token }),
      },
      { networkRetries: 1, timeoutMs: 10000 }
    );
    const data = await res.json().catch(() => ({}));
    if (token === lastDeviceToken) lastDeviceToken = null;
    return { ok: res.ok, ...data };
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

async function wirePushListeners(PushNotifications) {
  if (listenersWired) return;
  listenersWired = true;

  await PushNotifications.addListener("registration", async (ev) => {
    const next = ev.value || null;
    if (!next) return;
    const changed = next !== lastDeviceToken;
    lastDeviceToken = next;
    await registerDeviceTokenWithApi(lastDeviceToken);
    if (changed) await persistNativePushPreference(true);
  });

  await PushNotifications.addListener("registrationError", (err) => {
    lastDeviceToken = null;
    lastRegistrationMeta = { lastError: err?.error || "registration_error" };
  });

  await PushNotifications.addListener("pushNotificationReceived", (notification) => {
    useNotificationsStore.getState().notifySocketTick();
    document.dispatchEvent(
      new CustomEvent("ccweb:native-push", { detail: { phase: "foreground", notification } })
    );
  });

  await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    document.dispatchEvent(
      new CustomEvent("ccweb:native-push", { detail: { phase: "action", action, coldStart: false } })
    );
  });
}

/** Re-register token after app resume (FCM token refresh). */
export async function refreshNativePushRegistration() {
  if (!isCapacitorNative()) return { ok: false, reason: "not_native" };
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    await PushNotifications.register();
    if (lastDeviceToken) {
      await registerDeviceTokenWithApi(lastDeviceToken);
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e?.message || "refresh_failed" };
  }
}

export async function fetchPushDiagnosticsFromApi() {
  try {
    const res = await apiFetch(apiUrl("/api/v1/notifications/push/diagnostics"), {
      credentials: "include",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
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
    await wirePushListeners(PushNotifications);

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
