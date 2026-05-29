import { SESSION_TOKEN_KEY } from "../authStorageKeys";

/**
 * Production API origin for split deploys (Vercel / Railway ↔ Node API).
 *
 * Production hardening:
 * - Canonical API: `https://ccweb-api-production-a92c.up.railway.app`
 * - Also allows sibling Railway deploys: `ccweb-api-production-<id>.up.railway.app`
 * - Rejects localhost, Render, Vercel-as-API, same-origin-as-SPA (split mistake), non-https, and legacy hostnames.
 * - If `VITE_CCWEB_ALLOW_NON_RAILWAY_API=1`, any https API host is allowed (custom domains).
 */

export const CCWEB_CANONICAL_PRODUCTION_API = "https://ccweb-api-production-a92c.up.railway.app";

const RAILWAY_CCWEB_API_HOST = /^ccweb-api-production-[a-z0-9]+\.up\.railway\.app$/i;

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

function legacyRenderRewriteTarget() {
  if (import.meta.env.PROD) return CCWEB_CANONICAL_PRODUCTION_API;
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

function isAllowedProductionApiHost(hostname) {
  const h = String(hostname || "").toLowerCase();
  if (h === new URL(CCWEB_CANONICAL_PRODUCTION_API).hostname.toLowerCase()) return true;
  return RAILWAY_CCWEB_API_HOST.test(h);
}

/**
 * True when the configured API base must not be used in production (wrong host, http, SPA origin, etc.).
 */
export function isUnsafeProductionApiBase(url) {
  const s = stripTrailingSlash(url);
  if (!s) return true;
  if (isObsoleteCcwebApiOrigin(s)) return true;
  if (import.meta.env.VITE_CCWEB_ALLOW_NON_RAILWAY_API === "1") {
    try {
      const u = new URL(s);
      if (u.protocol !== "https:") return true;
      const h = u.hostname.toLowerCase();
      if (h === "localhost" || h === "127.0.0.1") return true;
      if (h.endsWith(".vercel.app")) return true;
      if (typeof window !== "undefined" && window.location?.origin) {
        if (stripTrailingSlash(s) === stripTrailingSlash(window.location.origin)) return true;
      }
      return isObsoleteCcwebApiOrigin(s);
    } catch {
      return true;
    }
  }
  try {
    const u = new URL(s);
    if (u.protocol !== "https:") return true;
    const h = u.hostname.toLowerCase();
    if (h === "localhost" || h === "127.0.0.1") return true;
    if (h.endsWith(".vercel.app")) return true;
    if (typeof window !== "undefined" && window.location?.origin) {
      if (stripTrailingSlash(s) === stripTrailingSlash(window.location.origin)) return true;
    }
    return !isAllowedProductionApiHost(h);
  } catch {
    return true;
  }
}

export function getApiBaseUrl() {
  const isProd = import.meta.env.PROD === true;
  let raw = coerceConfiguredBase(import.meta.env.VITE_API_BASE_URL || "");
  if (!raw) raw = coerceConfiguredBase(readMetaApiBase());
  if (!raw && isProd) {
    raw = coerceConfiguredBase(stripTrailingSlash(import.meta.env.VITE_CCWEB_PRODUCTION_API_FALLBACK || ""));
  }
  if (isProd && (!raw || isUnsafeProductionApiBase(raw))) {
    return CCWEB_CANONICAL_PRODUCTION_API;
  }
  return raw;
}

/** Env-only base (no `<meta>`); matches getApiBaseUrl guard in production. */
export const API_BASE_URL = (() => {
  const r = coerceConfiguredBase(import.meta.env.VITE_API_BASE_URL || "");
  if (import.meta.env.PROD && (!r || isUnsafeProductionApiBase(r))) return CCWEB_CANONICAL_PRODUCTION_API;
  return r;
})();

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
 * `VITE_CCWEB_API_DEBUG=1` at build time → browser console (resolved base, build id, meta).
 * `VITE_CCWEB_AUTH_TRACE=1` → same block plus session token presence (no token value).
 */
export function logCcwebApiRuntimeDebug() {
  const debug = import.meta.env.VITE_CCWEB_API_DEBUG === "1";
  const trace = import.meta.env.VITE_CCWEB_AUTH_TRACE === "1";
  if (!debug && !trace) return;
  try {
    const base = getApiBaseUrl();
    const authLabel = base ? `${base}/api/auth` : "/api/auth (same-origin relative)";
    const wsHost = base || (typeof window !== "undefined" ? window.location.origin : "");
    const meta = typeof document !== "undefined" ? readMetaApiBase() : "";
    const rawVite = import.meta.env.VITE_API_BASE_URL || "";
    const buildId = import.meta.env.VITE_CCWEB_BUILD_ID || "";
    if (import.meta.env.PROD && (debug || trace) && !buildId) {
      // eslint-disable-next-line no-console -- gated split-deploy diagnostics
      console.warn(
        "[ccweb-api-debug] VITE_CCWEB_BUILD_ID is empty — redeploy with VERCEL_GIT_COMMIT_SHA / RAILWAY_GIT_COMMIT_SHA / CCWEB_BUILD_ID so stale bundles are identifiable."
      );
    }
    const coercedVite = coerceConfiguredBase(rawVite);
    const coercedMeta = coerceConfiguredBase(meta);
    const hadEmpty = !stripTrailingSlash(rawVite) && !stripTrailingSlash(meta);
    const hadUnsafe =
      (coercedVite && isUnsafeProductionApiBase(coercedVite)) ||
      (Boolean(stripTrailingSlash(meta)) && isUnsafeProductionApiBase(coercedMeta));
    const guardApplied = import.meta.env.PROD && base === CCWEB_CANONICAL_PRODUCTION_API && (hadEmpty || hadUnsafe);
    // eslint-disable-next-line no-console -- gated split-deploy diagnostics
    console.info("[ccweb-api-debug] buildId:", buildId || "(empty)");
    // eslint-disable-next-line no-console -- gated split-deploy diagnostics
    console.info("[ccweb-api-debug] import.meta.env.VITE_API_BASE_URL:", rawVite || "(empty)");
    // eslint-disable-next-line no-console -- gated split-deploy diagnostics
    console.info("[ccweb-api-debug] meta ccweb-api-base-url:", meta || "(empty)");
    // eslint-disable-next-line no-console -- gated split-deploy diagnostics
    console.info("[ccweb-api-debug] resolved API base URL:", base || "(empty)");
    // eslint-disable-next-line no-console -- gated split-deploy diagnostics
    console.info("[ccweb-api-debug] productionCanonicalGuardApplied:", Boolean(guardApplied));
    // eslint-disable-next-line no-console -- gated split-deploy diagnostics
    console.info("[ccweb-api-debug] auth REST base:", authLabel);
    // eslint-disable-next-line no-console -- gated split-deploy diagnostics
    console.info("[ccweb-api-debug] Socket.IO client host:", wsHost || "(empty)");
    if (trace && typeof window !== "undefined") {
      // eslint-disable-next-line no-console -- gated split-deploy diagnostics
      console.info("[ccweb-auth-trace] SPA origin (window.location):", window.location?.origin || "(empty)");
      // eslint-disable-next-line no-console -- gated split-deploy diagnostics
      console.info(
        "[ccweb-auth-trace] apiFetch uses credentials:include for same-site cookies + cross-origin credentialed requests"
      );
      try {
        const dc = document.cookie ? document.cookie.split(";").filter(Boolean).length : 0;
        // eslint-disable-next-line no-console -- gated split-deploy diagnostics
        console.info(
          "[ccweb-auth-trace] document.cookie segment count (HttpOnly API cookies are NOT visible here):",
          dc
        );
      } catch {
        /* ignore */
      }
      let hasToken = false;
      try {
        hasToken = Boolean(window.sessionStorage?.getItem(SESSION_TOKEN_KEY));
      } catch {
        hasToken = false;
      }
      // eslint-disable-next-line no-console -- gated split-deploy diagnostics
      console.info("[ccweb-auth-trace] sessionStorage access token present:", hasToken);
    }
  } catch (e) {
    // eslint-disable-next-line no-console -- gated split-deploy diagnostics
    console.warn("[ccweb-api-debug] logging failed:", e);
  }
}
