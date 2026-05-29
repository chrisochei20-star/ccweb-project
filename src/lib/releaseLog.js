import { isCapacitorNative } from "./capacitorPlatform";

/** True in Vite production builds (release APK ships PROD bundle). */
export function isReleaseBuild() {
  return Boolean(import.meta.env.PROD);
}

/** Production-safe console.log — suppressed in release unless CCWEB_DEBUG=1. */
export function releaseLog(...args) {
  if (isReleaseBuild() && !import.meta.env.VITE_CCWEB_DEBUG) return;
  console.log(...args);
}

export function releaseWarn(...args) {
  if (isReleaseBuild() && !import.meta.env.VITE_CCWEB_DEBUG) return;
  console.warn(...args);
}

export function releaseDiag(label, data = {}) {
  if (!isReleaseBuild() || import.meta.env.VITE_CCWEB_DEBUG) {
    releaseLog(`[ccweb-diag] ${label}`, data);
  }
  if (typeof document !== "undefined" && isCapacitorNative()) {
    document.dispatchEvent(
      new CustomEvent("ccweb:release-diag", { detail: { label, data, at: Date.now() } })
    );
  }
}
