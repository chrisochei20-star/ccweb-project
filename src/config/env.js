/** Resolved at build time for production CDN deploys (Vercel/Netlify). */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/$/, "");

/** Prefix API paths when frontend is on a different origin than the Node API. */
export function apiUrl(path) {
  const p = String(path || "").startsWith("/") ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${p}` : p;
}
