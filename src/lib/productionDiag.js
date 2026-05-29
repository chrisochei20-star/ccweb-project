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

/** Snapshot for support / QA when client diag is enabled. */
export async function getClientDiagnostics() {
  let realtime = null;
  try {
    const mod = await import("./realtimeSocket.js");
    realtime = mod.getRealtimeDiagnostics();
  } catch {
    /* SSR / tests */
  }
  const perf =
    typeof performance !== "undefined" && performance.memory
      ? {
          jsHeapUsedMb: Math.round(performance.memory.usedJSHeapSize / 1048576),
          jsHeapLimitMb: Math.round(performance.memory.jsHeapSizeLimit / 1048576),
        }
      : null;
  return {
    online: typeof navigator !== "undefined" ? navigator.onLine : null,
    visibility: typeof document !== "undefined" ? document.visibilityState : null,
    buildId: import.meta.env.VITE_CCWEB_BUILD_ID || null,
    perf,
    realtime,
  };
}
