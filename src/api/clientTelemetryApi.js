import { apiFetch } from "../lib/apiClient";
import { apiUrl } from "../config/env";

/**
 * Fire-and-forget client crash / error reporting for ops dashboards (Pino on server).
 */
export function postClientErrorReport(payload) {
  const body = JSON.stringify({
    message: String(payload?.message || "").slice(0, 2000),
    stack: String(payload?.stack || "").slice(0, 12000),
    route: typeof window !== "undefined" ? window.location?.pathname + window.location?.search : "",
    digest: String(payload?.digest || ""),
    build: typeof import.meta !== "undefined" ? String(import.meta.env?.MODE || "dev").slice(0, 32) : "",
  });
  void apiFetch(apiUrl("/api/v1/telemetry/client-error"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}
