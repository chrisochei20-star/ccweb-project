/**
 * Gated client-side diagnostics for production triage (Railway/Vercel split).
 * Enable with `VITE_CCWEB_CLIENT_DIAG=1` in the Vite env for the static build.
 */

export function isClientDiagEnabled() {
  try {
    return import.meta.env.VITE_CCWEB_CLIENT_DIAG === "1" || import.meta.env.VITE_CCWEB_API_DEBUG === "1";
  } catch {
    return false;
  }
}

/**
 * @param {string} event
 * @param {Record<string, unknown>} fields
 */
export function logClientStructured(event, fields = {}) {
  if (!isClientDiagEnabled()) return;
  try {
    const line = JSON.stringify({ ts: new Date().toISOString(), event, ...fields });
    // eslint-disable-next-line no-console -- intentional gated diagnostics
    console.warn("[ccweb-client]", line);
  } catch {
    /* ignore */
  }
}
