/**
 * Client-side structured diagnostics for AI surfaces (tutor, scanners, intelligence).
 * Enable with VITE_CCWEB_CLIENT_DIAG=1 or VITE_CCWEB_API_DEBUG=1.
 */

import { logClientStructured } from "./productionDiag";

export function logAiClient(event, fields = {}) {
  logClientStructured(`ai_${event}`, fields);
}

export function logScannerClient(event, fields = {}) {
  logClientStructured(`scanner_${event}`, fields);
}

/**
 * Normalize API/stream errors into user-facing copy + recovery hints.
 */
export function formatAiError(err) {
  const code = err?.code || err?.cause?.code;
  const msg = String(err?.message || err || "AI request failed.");
  if (code === "AI_NOT_CONFIGURED" || /not configured/i.test(msg)) {
    return {
      message: "AI is temporarily unavailable — the API key is not configured on the server.",
      unavailable: true,
      retryable: false,
    };
  }
  if (err?.name === "AbortError" || code === "AI_ABORTED") {
    return { message: "Request cancelled.", unavailable: false, retryable: true };
  }
  if (code === "AI_TIMEOUT" || /timed out|timeout/i.test(msg)) {
    return {
      message: "The AI response timed out. Try a shorter question or retry in a moment.",
      unavailable: false,
      retryable: true,
    };
  }
  if (/503|502|504|429/.test(msg) || /unavailable|overloaded|rate limit/i.test(msg)) {
    return {
      message: "AI service is busy or unavailable. Please retry shortly.",
      unavailable: true,
      retryable: true,
    };
  }
  return { message: msg, unavailable: false, retryable: true };
}
