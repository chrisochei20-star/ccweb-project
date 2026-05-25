import { createClient } from "@supabase/supabase-js";

const url = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

let client = null;

/**
 * Browser Supabase client — only created when both env vars are set.
 * Never falls back to hardcoded project keys.
 */
export function getSupabaseBrowserClient() {
  if (!url || !anonKey) return null;
  if (!client) client = createClient(url, anonKey);
  return client;
}

/** @returns {Promise<string|null>} Supabase session JWT, or null if not configured / signed out. */
export async function getSupabaseAccessToken() {
  const c = getSupabaseBrowserClient();
  if (!c) return null;
  try {
    const { data, error } = await c.auth.getSession();
    if (error) return null;
    return data.session?.access_token || null;
  } catch {
    return null;
  }
}
