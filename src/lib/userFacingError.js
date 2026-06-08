/**
 * Sanitize errors for user-facing UI — never expose env vars, stack traces, or raw fetch strings.
 */

const ENV_PATTERNS = [
  /VITE_[A-Z0-9_]+/gi,
  /CCWEB_[A-Z0-9_]+/gi,
  /DATABASE_URL/gi,
  /OPENAI_API_KEY/gi,
  /FLUTTERWAVE_[A-Z0-9_]+/gi,
  /RAILWAY_[A-Z0-9_]+/gi,
];

export function formatUserFacingError(err, fallback = "Something went wrong. Please try again.") {
  const raw = err instanceof Error ? err.message : String(err || "");
  const name = err instanceof Error ? err.name : "";

  if (name === "AbortError" || /request cancelled|aborted/i.test(raw)) {
    return "Request timed out. Check your connection and try again.";
  }
  if (raw === "Failed to fetch" || raw === "Load failed" || /networkerror/i.test(raw)) {
    return "Network error. Check your connection and try again.";
  }
  if (/stack trace|at\s+\S+\s+\(/i.test(raw)) {
    return fallback;
  }

  let msg = raw;
  for (const pat of ENV_PATTERNS) {
    msg = msg.replace(pat, "");
  }
  msg = msg.replace(/\s{2,}/g, " ").trim();
  if (!msg || msg.length > 180) return fallback;
  return msg;
}
