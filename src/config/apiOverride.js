/**
 * Force relative API URLs when running on Vercel so requests go through
 * the Vercel proxy (/api/* → Railway) instead of cross-origin directly.
 */
export function getEffectiveApiBase() {
  if (typeof window !== "undefined" && 
      window.location.hostname.endsWith(".vercel.app")) {
    return ""; // Use relative URLs → Vercel proxy handles it
  }
  return null; // Fall through to normal env config
}
