/**
 * Capacitor FCM native push — registration, refresh, foreground/background, diagnostics.
 */

import { apiUrl } from "../config/env";
import { apiFetch } from "./apiClient";
import { isCapacitorNative } from "./capacitorPlatform";
import { releaseDiag } from "./releaseLog";
import { useNotificationsStore } from "../store/notificationsStore";

/** @type {string | null} */
let lastDeviceToken = null;
/** @type {string | null} */
let lastRegisteredApiToken = null;
/** @type {boolean} */
let listenersWired = false;
/** @type {Promise<void> | null} */
let registerInFlight = null;
/** @type {{ registeredAt?: string; lastError?: string; fcmConfigured?: boolean; permission?: string } | null} */
let lastRegistrationMeta = null;

const REGISTER_RETRY_DELAYS_MS = [0, 1200, 3500];

export function getNativePushDeviceToken() {
  return lastDeviceToken;
}

export function getNativePushDiagnostics() {
  return {
    tokenPresent: Boolean(lastDeviceToken),
    tokenPreview: lastDeviceToken ? `${lastDeviceToken.slice(0, 8)}…` : null,
    apiSynced: lastRegisteredApiToken === lastDeviceToken && Boolean(lastDeviceToken),
    listenersWired,
    ...lastRegistrationMeta,
  };
}

async function registerDeviceTokenWithApi(token, platform = "android", attempt = 0) {
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
      lastRegistrationMeta = {
        ...lastRegistrationMeta,
        lastError: data.error || "register_failed",
        registeredAt: null,
      };
      if (attempt < REGISTER_RETRY_DELAYS_MS.length - 1) {
        const delay = REGISTER_RETRY_DELAYS_MS[attempt + 1];
        await new Promise((r) => setTimeout(r, delay));
        return registerDeviceTokenWithApi(token, platform, attempt + 1);
      }
      return { ok: false, reason: data.error || "register_failed", status: res.status };
    }
    lastRegisteredApiToken = token;
    lastRegistrationMeta = {
      registeredAt: new Date().toISOString(),
      fcmConfigured: data.fcmConfigured,
      lastError: undefined,
      permission: lastRegistrationMeta?.permission,
    };
    releaseDiag("fcm_token_registered", { preview: `${token.slice(0, 8)}…` });
    return { ok: true, data };
  } catch (e) {
    lastRegistrationMeta = {
      ...lastRegistrationMeta,
      lastError: e?.message || "network",
    };
    if (attempt < REGISTER_RETRY_DELAYS_MS.length - 1) {
      const delay = REGISTER_RETRY_DELAYS_MS[attempt + 1];
      await new Promise((r) => setTimeout(r, delay));
      return registerDeviceTokenWithApi(token, platform, attempt + 1);
    }
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
    if (token === lastDeviceToken) {
      lastDeviceToken = null;
      lastRegisteredApiToken = null;
    }
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

async function onRegistrationToken(next) {
  if (!next) return;
  const changed = next !== lastDeviceToken;
  lastDeviceToken = next;
  if (registerInFlight) await registerInFlight;
  registerInFlight = registerDeviceTokenWithApi(lastDeviceToken).finally(() => {
    registerInFlight = null;
  });
  await registerInFlight;
  if (changed) await persistNativePushPreference(true);
}

async function wirePushListeners(PushNotifications) {
  if (listenersWired) return;
  listenersWired = true;

  await PushNotifications.addListener("registration", async (ev) => {
    await onRegistrationToken(ev.value || null);
  });

  await PushNotifications.addListener("registrationError", (err) => {
    lastDeviceToken = null;
    lastRegisteredApiToken = null;
    lastRegistrationMeta = {
      ...lastRegistrationMeta,
      lastError: err?.error || "registration_error",
    };
    releaseDiag("fcm_registration_error", { error: err?.error });
  });

  await PushNotifications.addListener("pushNotificationReceived", (notification) => {
    useNotificationsStore.getState().notifySocketTick();
    document.dispatchEvent(
      new CustomEvent("ccweb:native-push", { detail: { phase: "foreground", notification } })
    );
  });

  await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    document.dispatchEvent(
      new CustomEvent("ccweb:native-push", {
        detail: { phase: "action", action, coldStart: false },
      })
    );
  });
}

/** Check POST_NOTIFICATIONS (Android 13+) and re-prompt only when still denied. */
export async function ensureNotificationPermission() {
  if (!isCapacitorNative()) return { ok: false, reason: "not_native" };
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === "prompt") {
      perm = await PushNotifications.requestPermissions();
    }
    lastRegistrationMeta = { ...lastRegistrationMeta, permission: perm.receive };
    return { ok: perm.receive === "granted", permission: perm.receive };
  } catch (e) {
    return { ok: false, reason: e?.message || "permission_check_failed" };
  }
}

/** Re-register token after app resume (FCM token refresh + API sync). */
export async function refreshNativePushRegistration() {
  if (!isCapacitorNative()) return { ok: false, reason: "not_native" };
  try {
    const perm = await ensureNotificationPermission();
    if (!perm.ok) {
      return { ok: false, reason: "permission_denied", permission: perm.permission };
    }
    const { PushNotifications } = await import("@capacitor/push-notifications");
    await PushNotifications.register();
    if (lastDeviceToken) {
      if (lastRegisteredApiToken !== lastDeviceToken) {
        await registerDeviceTokenWithApi(lastDeviceToken);
      }
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

    const perm = await ensureNotificationPermission();
    if (!perm.ok) {
      await persistNativePushPreference(false);
      return { ok: false, reason: "permission_denied", permission: perm.permission };
    }

    await PushNotifications.register();

    return { ok: true, permission: perm.permission };
  } catch (e) {
    return { ok: false, reason: e?.message || "init_failed" };
  }
}
