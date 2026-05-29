/**
 * Production client analytics — persisted via real `/api/v1/beta/event` (PostgreSQL).
 * No third-party mock trackers; events are first-party only.
 */

import { postBetaClientEvent } from "./betaTelemetry";
import { isCapacitorNative } from "./capacitorPlatform";
import { releaseLog } from "./releaseLog";

let initialized = false;

export function trackProductionEvent(eventType, fields = {}) {
  if (typeof window === "undefined") return;
  void postBetaClientEvent({
    eventType: String(eventType || "client_event").slice(0, 64),
    path: window.location.pathname + window.location.search,
    featureKey: fields.featureKey,
    durationMs: fields.durationMs,
    error: fields.error,
    metadata: {
      ...fields.metadata,
      platform: isCapacitorNative() ? "capacitor-android" : "web",
      ...(fields.message ? { message: String(fields.message).slice(0, 240) } : {}),
    },
  });
}

export function reportClientError(error, context = {}) {
  const message = error?.message || String(error || "unknown");
  trackProductionEvent("client_error", {
    error: message.slice(0, 280),
    metadata: { ...context, stack: error?.stack ? String(error.stack).slice(0, 400) : undefined },
  });
}

export function initProductionAnalytics() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  window.addEventListener("error", (event) => {
    reportClientError(event.error || new Error(event.message || "Script error"), {
      source: event.filename,
      line: event.lineno,
      col: event.colno,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    reportClientError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)), {
      kind: "unhandledrejection",
    });
  });

  window.addEventListener("load", () => {
    try {
      const nav = performance.getEntriesByType("navigation")[0];
      if (nav) {
        trackProductionEvent("perf_navigation", {
          durationMs: Math.round(nav.duration),
          metadata: {
            domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
            transferSize: nav.transferSize || 0,
          },
        });
      }
    } catch {
      /* ignore */
    }
  });

  if ("serviceWorker" in navigator && !isCapacitorNative()) {
    navigator.serviceWorker.ready
      .then(() => trackProductionEvent("pwa_sw_ready"))
      .catch(() => {});
  }

  releaseLog("[ccweb] production analytics initialized");
}
