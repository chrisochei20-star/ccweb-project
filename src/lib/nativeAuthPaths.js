/**
 * Capacitor native app paths that do not require an authenticated session.
 * Web (Vercel) keeps public browsing on home/community; native gates the shell.
 */

const NATIVE_PUBLIC_EXACT = new Set([
  "/login",
  "/signup",
  "/forgot-password",
  "/verify-email",
  "/about",
  "/faq",
  "/contact",
  "/privacy",
  "/terms",
]);

const NATIVE_PUBLIC_PREFIXES = ["/invite/", "/u/", "/test/"];

/** True when pathname is reachable without signing in on Capacitor native. */
export function isNativePublicPath(pathname) {
  const path = String(pathname || "/").split("?")[0] || "/";
  if (NATIVE_PUBLIC_EXACT.has(path)) return true;
  return NATIVE_PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix));
}
