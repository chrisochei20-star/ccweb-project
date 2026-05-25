/**
 * Canonical public app URL for payment return flows, referral links, and OAuth.
 * In production, PUBLIC_APP_URL is required and must be https.
 */

function trimOrigin(url) {
  return String(url || "")
    .trim()
    .replace(/\/$/, "");
}

/**
 * @returns {string|null} null when unset in development (caller may use dev fallback)
 */
function requirePublicAppUrl() {
  const u = trimOrigin(process.env.PUBLIC_APP_URL);
  if (!u && process.env.NODE_ENV === "production") {
    throw new Error("PUBLIC_APP_URL must be set to your production SPA URL (https, no trailing slash).");
  }
  if (u && process.env.NODE_ENV === "production" && !/^https:\/\//i.test(u)) {
    throw new Error("PUBLIC_APP_URL must use https:// in production.");
  }
  return u || null;
}

/**
 * Public app base for redirects. Development fallback only when PUBLIC_APP_URL unset.
 * @param {{ allowDevFallback?: boolean }} [opts]
 */
function publicAppBaseUrl(opts = {}) {
  const u = trimOrigin(process.env.PUBLIC_APP_URL);
  if (u) return u;
  if (process.env.NODE_ENV === "production") {
    throw new Error("PUBLIC_APP_URL is required in production.");
  }
  if (opts.allowDevFallback === false) {
    return "";
  }
  return "http://127.0.0.1:5173";
}

module.exports = { trimOrigin, requirePublicAppUrl, publicAppBaseUrl };
