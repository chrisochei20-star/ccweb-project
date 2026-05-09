/** Resolved at build time (VITE_API_BASE_URL) and optionally at runtime via <meta name="ccweb-api-base-url"> for split CDN + API deploys. */

export function getApiBaseUrl() {
  const fromVite = (import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/$/, "");
  if (fromVite) return fromVite;
  if (typeof document !== "undefined") {
    const meta = document.querySelector('meta[name="ccweb-api-base-url"]');
    const fromMeta = (meta?.getAttribute("content") || "").trim().replace(/\/$/, "");
    if (fromMeta) return fromMeta;
  }
  return "";
}

/** @deprecated Prefer getApiBaseUrl() — env-only, does not read meta tag */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/$/, "");

/** Prefix API paths when frontend is on a different origin than the Node API. */
export function apiUrl(path) {
  const base = getApiBaseUrl();
  const p = String(path || "").startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}
