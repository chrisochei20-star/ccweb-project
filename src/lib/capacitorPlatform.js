import { Capacitor } from "@capacitor/core";
import { runNativeBackHandler } from "./nativeBackStack";

/** Lazy diag — avoids static import of releaseLog during shell bootstrap (TDZ hardening). */
function releaseDiag(label, data = {}) {
  void import("./releaseLog.js")
    .then(({ releaseDiag: rd }) => rd(label, data))
    .catch(() => {});
}

/** @type {string | null} */
let pendingDeepLinkUrl = null;
/** @type {boolean} */
let splashHideScheduled = false;

export function consumePendingDeepLink() {
  const url = pendingDeepLinkUrl;
  pendingDeepLinkUrl = null;
  return url;
}

export function getPendingDeepLink() {
  return pendingDeepLinkUrl;
}

/** True when running inside a Capacitor native shell (Android/iOS). */
export function isCapacitorNative() {
  return Capacitor.isNativePlatform();
}

/** True for Android native WebView. */
export function isCapacitorAndroid() {
  return Capacitor.getPlatform() === "android";
}

function scheduleNativeSplashHide() {
  if (splashHideScheduled || !isCapacitorNative()) return;
  splashHideScheduled = true;

  const hide = async () => {
    try {
      const { SplashScreen } = await import("@capacitor/splash-screen");
      await SplashScreen.hide({ fadeOutDuration: 420 });
      releaseDiag("splash_hidden");
    } catch {
      /* optional */
    }
  };

  document.addEventListener("ccweb:shell-ready", hide, { once: true });
  window.setTimeout(hide, 3200);
}

/**
 * Initialize native shell: status bar, splash hide, keyboard, safe-area class, app lifecycle.
 * Safe to call on web — no-ops when plugins are unavailable.
 */
export async function initCapacitorShell() {
  if (typeof document === "undefined") return;

  if (isCapacitorNative()) {
    document.documentElement.classList.add("ccweb-capacitor-native");
    document.documentElement.dataset.ccwebPlatform = Capacitor.getPlatform();
  }

  if (!isCapacitorNative()) return;

  scheduleNativeSplashHide();

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#030712" });
  } catch {
    /* optional */
  }

  try {
    const { Keyboard } = await import("@capacitor/keyboard");
    await Keyboard.setAccessoryBarVisible({ isVisible: false });
    await Keyboard.setScroll({ isDisabled: false });
    Keyboard.addListener("keyboardWillShow", (info) => {
      document.documentElement.classList.add("ccweb-keyboard-open");
      if (info?.keyboardHeight) {
        document.documentElement.style.setProperty(
          "--ccweb-keyboard-inset",
          `${info.keyboardHeight}px`
        );
      }
    });
    Keyboard.addListener("keyboardWillHide", () => {
      document.documentElement.classList.remove("ccweb-keyboard-open");
      document.documentElement.style.removeProperty("--ccweb-keyboard-inset");
    });
  } catch {
    /* optional */
  }

  try {
    const { App } = await import("@capacitor/app");
    App.addListener("appStateChange", ({ isActive }) => {
      if (isActive) {
        document.dispatchEvent(new CustomEvent("ccweb:app-resume"));
      } else {
        releaseDiag("app_background");
      }
    });
    App.addListener("backButton", ({ canGoBack }) => {
      if (runNativeBackHandler()) return;
      if (canGoBack) {
        window.history.back();
      } else {
        App.minimizeApp();
      }
    });

    App.addListener("appUrlOpen", ({ url }) => {
      releaseDiag("app_url_open", { url });
      document.dispatchEvent(new CustomEvent("ccweb:deep-link", { detail: { url } }));
    });

    try {
      const launch = await App.getLaunchUrl();
      if (launch?.url) {
        pendingDeepLinkUrl = launch.url;
        releaseDiag("launch_url", { url: launch.url });
        document.dispatchEvent(
          new CustomEvent("ccweb:deep-link", { detail: { url: launch.url, coldStart: true } })
        );
      }
    } catch {
      /* no cold-start URL */
    }
  } catch {
    /* optional */
  }
}

/** Call when shell content is ready (after auth hydrate) for smoother splash handoff. */
export function signalNativeShellReady() {
  if (!isCapacitorNative()) return;
  document.dispatchEvent(new CustomEvent("ccweb:shell-ready"));
}
