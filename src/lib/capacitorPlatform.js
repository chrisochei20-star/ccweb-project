import { Capacitor } from "@capacitor/core";
import { runNativeBackHandler } from "./nativeBackStack";
import { releaseDiag } from "./releaseLog";

/** @type {string | null} */
let pendingDeepLinkUrl = null;

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
    Keyboard.addListener("keyboardWillShow", () => {
      document.documentElement.classList.add("ccweb-keyboard-open");
    });
    Keyboard.addListener("keyboardWillHide", () => {
      document.documentElement.classList.remove("ccweb-keyboard-open");
    });
  } catch {
    /* optional */
  }

  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide({ fadeOutDuration: 320 });
  } catch {
    /* optional */
  }

  try {
    const { App } = await import("@capacitor/app");
    App.addListener("appStateChange", ({ isActive }) => {
      if (isActive) {
        document.dispatchEvent(new CustomEvent("ccweb:app-resume"));
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
