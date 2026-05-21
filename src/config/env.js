/**
 * Production API origin for split deploys (Vercel / Railway ↔ Node API).
 * Primary: `import.meta.env.VITE_API_BASE_URL` (set in CI or `.env.production` / Vercel at build time).
 * Fallback: `<meta name="ccweb-api-base-url">` — use `%VITE_API_BASE_URL%` in `index.html` so it matches the build env.
 * Legacy `*.onrender.com` bases rewrite to `VITE_CCWEB_LEGACY_API_REPLACE_TO`, else the first non-obsolete
 * value among `VITE_API_BASE_URL`, then meta (never a second hardcoded hostname).
 */

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

function readMetaApiBase() {
  if (typeof document === "undefined") return "";
  const meta = document.querySelector('meta[name="ccweb-api-base-url"]');
  return stripTrailingSlash(meta?.getAttribute("content") || "");
}

/** First configured non-obsolete HTTPS origin used when rewriting legacy Render API URLs. */
function legacyRenderRewriteTarget() {
  const explicit = stripTrailingSlash(import.meta.env.VITE_CCWEB_LEGACY_API_REPLACE_TO || "");
  if (explicit && !isObsoleteCcwebApiOrigin(explicit)) return explicit;
  const vite = stripTrailingSlash(import.meta.env.VITE_API_BASE_URL || "");
  if (vite && !isObsoleteCcwebApiOrigin(vite)) return vite;
  const meta = readMetaApiBase();
  if (meta && !isObsoleteCcwebApiOrigin(meta)) return meta;
  return "";
}

function coerceConfiguredBase(raw) {
  const s = stripTrailingSlash(raw);
  if (!s) return "";
  if (isObsoleteCcwebApiOrigin(s)) {
    const t = legacyRenderRewriteTarget();
    return t || s;
  }
  return s;
}

export function getApiBaseUrl() {
  const isProd = import.meta.env.PROD === true;
  let raw = coerceConfiguredBase(import.meta.env.VITE_API_BASE_URL || "");
  if (!raw) raw = coerceConfiguredBase(readMetaApiBase());
  if (!raw && isProd) {
    raw = coerceConfiguredBase(stripTrailingSlash(import.meta.env.VITE_CCWEB_PRODUCTION_API_FALLBACK || ""));
  }
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
 * Set `VITE_CCWEB_API_DEBUG=1` at build time, redeploy, then check the browser console.
 */
export function logCcwebApiRuntimeDebug() {
  if (import.meta.env.VITE_CCWEB_API_DEBUG !== "1") return;
  try {
    const base = getApiBaseUrl();
    const authLabel = base ? `${base}/api/auth` : "/api/auth (same-origin relative)";
    const wsHost = base || (typeof window !== "undefined" ? window.location.origin : "");
    const meta = typeof document !== "undefined" ? readMetaApiBase() : "";
    // eslint-disable-next-line no-console -- intentional gated split-deploy diagnostics
    console.info("[ccweb-api-debug] import.meta.env.VITE_API_BASE_URL:", import.meta.env.VITE_API_BASE_URL || "(empty)");
    // eslint-disable-next-line no-console -- intentional gated split-deploy diagnostics
    console.info("[ccweb-api-debug] meta ccweb-api-base-url:", meta || "(empty)");
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
