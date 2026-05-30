/**
 * Map external / native App URLs to in-app React Router paths.
 * Used by Capacitor App.getLaunchUrl / appUrlOpen and share links.
 */

const CCWEB_WEB_HOSTS = new Set([
  "ccweb-project-b4jq.vercel.app",
  "ccweb.io",
  "www.ccweb.io",
  "chrisccweb.com",
  "www.chrisccweb.com",
]);

const CUSTOM_SCHEME = "io.chrisccweb.app";

/** @param {string} path */
function sanitizeAppRoute(path) {
  if (!path || typeof path !== "string") return null;
  let p = path.trim();
  if (!p.startsWith("/")) p = `/${p}`;
  if (p.startsWith("//")) return null;
  if (/^\/\w+:/i.test(p)) return null;
  if (p.length > 512) return null;
  return p;
}

/**
 * @param {string} urlString
 * @returns {string | null} React Router path + search
 */
export function routeFromAppUrl(urlString) {
  if (!urlString || typeof urlString !== "string") return null;

  const raw = urlString.trim();
  if (raw.startsWith("/")) return sanitizeAppRoute(raw);

  try {
    const url = new URL(raw);

    if (url.protocol === `${CUSTOM_SCHEME}:` || url.hostname === CUSTOM_SCHEME) {
      const path = url.pathname + url.search;
      return sanitizeAppRoute(path || "/");
    }

    if (url.protocol === "https:" && CCWEB_WEB_HOSTS.has(url.hostname.toLowerCase())) {
      return sanitizeAppRoute(url.pathname + url.search);
    }

    if (url.protocol === "https:" && url.hostname.endsWith(".vercel.app") && url.hostname.includes("ccweb")) {
      return sanitizeAppRoute(url.pathname + url.search);
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Human-readable reason when a URL cannot be routed (for UX + analytics).
 * @param {string} urlString
 * @returns {string | null} null when URL is valid
 */
export function invalidAppUrlReason(urlString) {
  if (!urlString || typeof urlString !== "string") return "empty_url";
  if (routeFromAppUrl(urlString)) return null;

  const raw = urlString.trim();
  if (raw.startsWith("javascript:") || raw.startsWith("data:")) return "unsafe_scheme";

  try {
    const url = new URL(raw);
    if (url.protocol === `${CUSTOM_SCHEME}:` && url.hostname !== "app" && url.hostname !== CUSTOM_SCHEME) {
      return "unknown_custom_host";
    }
    if (url.protocol === "http:") return "cleartext_not_allowed";
    if (url.protocol === "https:" && !CCWEB_WEB_HOSTS.has(url.hostname.toLowerCase())) {
      if (!(url.hostname.endsWith(".vercel.app") && url.hostname.includes("ccweb"))) {
        return "untrusted_host";
      }
    }
  } catch {
    return "malformed_url";
  }

  return "unsupported_link";
}

export function isRecognizedAppUrl(urlString) {
  return routeFromAppUrl(urlString) != null;
}

export function isAuthRedirectUrl(urlString) {
  const route = routeFromAppUrl(urlString);
  if (!route) return false;
  return (
    route.startsWith("/login") ||
    route.startsWith("/signup") ||
    route.startsWith("/verify-email") ||
    route.startsWith("/forgot-password")
  );
}
