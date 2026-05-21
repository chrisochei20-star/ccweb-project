/**
 * Production API origin for split deploys (Vercel / Railway ↔ Node API).
 * Primary: `import.meta.env.VITE_API_BASE_URL` (set in CI or `.env.production` at build time).
 * Fallback: `<meta name="ccweb-api-base-url">` for emergency overrides without rebuild.
 * Legacy Render (`*.onrender.com`) values are rewritten to the Railway production API.
 */

export const CCWEB_PRODUCTION_RAILWAY_API = "https://ccweb-api-production.up.railway.app";

function stripTrailingSlash(s) {
  return String(s || "").trim().replace(/\/$/, "");
}

/** True if this URL must not be used as the CCWEB API origin (retired Render web service). */
export function isObsoleteCcwebApiOrigin(originUrl) {
  const s = stripTrailingSlash(originUrl);
  if (!s) return false;
  try {
    const host = new URL(s).hostname.toLowerCase();
    return host.endsWith(".onrender.com");
  } catch {
    return /\.onrender\.com\b/i.test(s);
  }
}

function coerceConfiguredBase(raw) {
  const s = stripTrailingSlash(raw);
  if (!s) return "";
  return isObsoleteCcwebApiOrigin(s) ? CCWEB_PRODUCTION_RAILWAY_API : s;
}

function readMetaApiBase() {
  if (typeof document === "undefined") return "";
  const meta = document.querySelector('meta[name="ccweb-api-base-url"]');
  return stripTrailingSlash(meta?.getAttribute("content") || "");
}

export function getApiBaseUrl() {
  const isProd = import.meta.env.PROD === true;
  let raw = coerceConfiguredBase(import.meta.env.VITE_API_BASE_URL || "");
  if (!raw) raw = coerceConfiguredBase(readMetaApiBase());
  if (!raw && isProd) raw = CCWEB_PRODUCTION_RAILWAY_API;
  return raw;
}

/** Env-only base (no `<meta>`); Vite build value with legacy-host rewrite. */
export const API_BASE_URL = coerceConfiguredBase(import.meta.env.VITE_API_BASE_URL || "");

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

/**
 * Gated diagnostics for split deploys. Set `VITE_CCWEB_API_DEBUG=1` at **build** time, redeploy, then check the browser console.
 * Prints resolved REST base, auth prefix, and Socket.IO host (same as REST base when split).
 */
export function logCcwebApiRuntimeDebug() {
  if (import.meta.env.VITE_CCWEB_API_DEBUG !== "1") return;
  try {
    const base = getApiBaseUrl();
    const authLabel = base ? `${base}/api/auth` : "/api/auth (same-origin relative)";
    const wsHost = base || (typeof window !== "undefined" ? window.location.origin : "");
    // eslint-disable-next-line no-console -- intentional gated split-deploy diagnostics
    console.info("[ccweb-api-debug] resolved API base URL:", base || "(empty)");
    // eslint-disable-next-line no-console -- intentional gated split-deploy diagnostics
    console.info("[ccweb-api-debug] auth REST base:", authLabel);
    // eslint-disable-next-line no-console -- intentional gated split-deploy diagnostics
    console.info("[ccweb-api-debug] Socket.IO client host:", wsHost || "(empty)");
  } catch (e) {
    // eslint-disable-next-line no-console -- intentional gated split-deploy diagnostics
    console.warn("[ccweb-api-debug] logging failed:", e);
  }
}
