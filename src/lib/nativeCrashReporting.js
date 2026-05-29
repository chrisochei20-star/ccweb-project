import { isCapacitorNative } from "./capacitorPlatform";
import { trackProductionEvent, reportClientError } from "./clientAnalytics";
import { releaseDiag } from "./releaseLog";

let initialized = false;

/**
 * First-party native/WebView crash & lifecycle diagnostics (no third-party SDK).
 * Reports to `/api/v1/beta/event` via clientAnalytics.
 */
export function initNativeCrashReporting() {
  if (initialized || typeof window === "undefined" || !isCapacitorNative()) return;
  initialized = true;

  window.addEventListener("ccweb:release-diag", (ev) => {
    const { label, data } = ev.detail || {};
    trackProductionEvent("native_release_diag", {
      metadata: { label, ...(data || {}) },
    });
  });

  document.addEventListener("ccweb:app-resume", () => {
    trackProductionEvent("native_app_resume", {
      metadata: { visibility: document.visibilityState },
    });
  });

  document.addEventListener("ccweb:soft-resume", () => {
    trackProductionEvent("native_soft_resume");
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      releaseDiag("app_background");
    }
  });

  const prevOnError = window.onerror;
  window.onerror = function ccwebNativeOnError(message, source, lineno, colno, error) {
    reportClientError(error || new Error(String(message)), {
      source,
      line: lineno,
      col: colno,
      platform: "capacitor-android",
    });
    if (typeof prevOnError === "function") return prevOnError.apply(this, arguments);
    return false;
  };
}

export function reportNativeRecovery(action, context = {}) {
  trackProductionEvent("native_recovery", {
    metadata: { action, ...context },
  });
}
