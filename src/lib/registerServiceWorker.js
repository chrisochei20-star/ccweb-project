import { isCapacitorNative } from "./capacitorPlatform";

/**
 * Register CCWEB service worker (production web only — not in Capacitor WebView).
 */
export function registerServiceWorker() {
  if (isCapacitorNative()) return;
  if (!import.meta.env.PROD) return;
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/ccweb-sw.js", { scope: "/" })
      .then((reg) => {
        reg.update().catch(() => {});
      })
      .catch(() => {
        /* SW optional — app works without it */
      });
  });
}
