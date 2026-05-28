/**
 * Structured client-side realtime diagnostics (no PII).
 */

export function realtimeLog(event, data = {}) {
  if (typeof window === "undefined") return;
  const payload = { ts: Date.now(), ...data };
  if (import.meta.env?.DEV) {
    // eslint-disable-next-line no-console
    console.info(`[ccweb-realtime] ${event}`, payload);
  }
}
