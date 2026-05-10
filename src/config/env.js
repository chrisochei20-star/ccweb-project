/**
 * Production API origin for split deploys (Vercel ↔ Render).
 * Primary: `import.meta.env.VITE_API_BASE_URL` (set in Vercel or `.env.production` at build time).
 * Fallback: `<meta name="ccweb-api-base-url">` for emergency overrides without rebuild.
 */

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

/** Snapshot of env-only base (no meta); rare legacy use. */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/$/, "");

/** Prefix API paths when the SPA is served from a different origin than the Node API. */
export function apiUrl(path) {
  const base = getApiBaseUrl();
  const p = String(path || "").startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}

/** `/uploads/...` on the API host — full URL for `<img src>`. */
export function assetsUrl(pathOrUrl) {
  if (!pathOrUrl) return "";
  const s = String(pathOrUrl).trim();
  if (/^https?:\/\//i.test(s)) return s;
  return apiUrl(s.startsWith("/") ? s : `/${s}`);
}
