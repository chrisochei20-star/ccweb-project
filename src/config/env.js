/**
 * API base for split deploys (e.g. Vercel UI + Render API).
 * When VITE_API_BASE_URL is unset, paths stay relative so Vite dev proxy can forward /api.
 *
 * @param {string} path Absolute path beginning with "/" or relative segment
 * @param {ImportMetaEnv} [metaEnv] Optional override for unit tests
 */
export function apiUrl(path, metaEnv = import.meta.env) {
  const raw = String(metaEnv?.VITE_API_BASE_URL || "")
    .trim()
    .replace(/\/$/, "");
  const p = String(path || "").startsWith("/") ? String(path) : `/${path}`;
  if (!raw) return p;
  return `${raw}${p}`;
}

/** Optional Supabase (set on Vercel when used). */
export function getSupabaseConfig(metaEnv = import.meta.env) {
  return {
    url: String(metaEnv?.VITE_SUPABASE_URL || "").trim(),
    anonKey: String(metaEnv?.VITE_SUPABASE_ANON_KEY || "").trim(),
  };
}
