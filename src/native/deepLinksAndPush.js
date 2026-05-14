/**
 * Capacitor-only: universal links / push action routing + FCM/APNs token registration.
 * Dynamic import keeps the web bundle from eagerly loading native plugins.
 */

import { toast } from "../lib/toastBus";

let deepLinkDispose = null;
let pushListenersBound = false;

export async function installNativeListeners(navigate) {
  if (typeof window === "undefined" || typeof navigate !== "function") return () => {};
  const { Capacitor } = await import("@capacitor/core");
  if (Capacitor.getPlatform() === "web") return () => {};

  if (deepLinkDispose) {
    try {
      deepLinkDispose();
    } catch {
      /* ignore */
    }
    deepLinkDispose = null;
  }

  const disposers = [];
  const { App } = await import("@capacitor/app");
  const h1 = await App.addListener("appUrlOpen", ({ url }) => {
    try {
      const u = new URL(url);
      const path = `${u.pathname || ""}${u.search || ""}`;
      if (path && path !== "/") navigate(path);
    } catch {
      /* ignore malformed */
    }
  });
  disposers.push(() => h1.remove());

  const { PushNotifications } = await import("@capacitor/push-notifications");
  const h2 = await PushNotifications.addListener("pushNotificationActionPerformed", (event) => {
    const d = event.notification?.data || {};
    const raw = d.path || d.deepLink || d.ccwebPath || "";
    const path = String(raw).startsWith("/") ? String(raw).slice(0, 512) : raw ? `/${String(raw).slice(0, 500)}` : "/notifications";
    navigate(path);
  });
  disposers.push(() => h2.remove());

  deepLinkDispose = () => {
    for (const d of disposers) {
      try {
        d();
      } catch {
        /* ignore */
      }
    }
  };
  return deepLinkDispose;
}

export async function registerNativePushFlow() {
  const { Capacitor } = await import("@capacitor/core");
  if (Capacitor.getPlatform() === "web") return { ok: false, skipped: true };

  const { getSessionToken } = await import("../session");
  if (!getSessionToken()) return { ok: false, skipped: true };

  const { PushNotifications } = await import("@capacitor/push-notifications");
  const { postPushDeviceToken } = await import("../api/devicesApi");

  if (!pushListenersBound) {
    pushListenersBound = true;
    await PushNotifications.addListener("registration", async (reg) => {
      const value = reg.value;
      if (!value) return;
      const plat = Capacitor.getPlatform() === "ios" ? "ios" : "android";
      try {
        await postPushDeviceToken({ platform: plat, token: value });
      } catch {
        /* session or network; next visibility refresh may retry */
      }
    });
    await PushNotifications.addListener("registrationError", (err) => {
      try {
        // eslint-disable-next-line no-console -- native diagnostics
        console.warn("[ccweb-push]", err);
      } catch {
        /* ignore */
      }
    });
  }

  const perm = await PushNotifications.requestPermissions();
  if (perm.receive !== "granted") {
    toast.info("Notifications stay in-app until you allow push in system settings.");
    return { ok: false, denied: true };
  }

  await PushNotifications.register();
  return { ok: true };
}
