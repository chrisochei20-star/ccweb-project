/**
 * Centralized user-facing error sanitization.
 * Never expose env vars, stack traces, infrastructure names, or raw fetch strings.
 */

const ENV_PATTERNS = [
  /VITE_[A-Z0-9_]+/gi,
  /CCWEB_[A-Z0-9_]+/gi,
  /DATABASE_URL/gi,
  /OPENAI_API_KEY/gi,
  /FLUTTERWAVE_[A-Z0-9_]+/gi,
  /RAILWAY_[A-Z0-9_]+/gi,
  /LIVEKIT_URL/gi,
  /CCWEB_ALLOWED_ORIGINS/gi,
  /CCWEB_ADMIN_KEY/gi,
  /X-CCWEB-Admin/gi,
  /onrender\.com/gi,
  /\.vercel\.app/gi,
];

const INFRA_PATTERNS = [
  /PostgreSQL/gi,
  /postgres/gi,
  /Render API/gi,
  /Railway/gi,
  /SSE updates?/gi,
  /Socket\.IO/gi,
  /NO_DATABASE/gi,
  /when OpenAI is configured/gi,
  /when database is enabled/gi,
  /when explorer credentials exist/gi,
  /explorer credentials/gi,
  /credentials on the API/gi,
  /payment keys are configured/gi,
  /prototype/gi,
  /in-memory/gi,
  /VITE_API_BASE_URL/gi,
];

function stripSensitive(msg) {
  let out = msg;
  for (const pat of [...ENV_PATTERNS, ...INFRA_PATTERNS]) {
    out = out.replace(pat, "");
  }
  return out.replace(/\s{2,}/g, " ").trim();
}

export function formatUserFacingError(err, fallback = "Something went wrong. Please try again.") {
  const raw = err instanceof Error ? err.message : String(err || "");
  const name = err instanceof Error ? err.name : "";
  const code = err?.code || err?.response?.data?.code;

  if (name === "AbortError" || /request cancelled|aborted|session_hydration_timeout/i.test(raw)) {
    return "Request timed out. Check your connection and try again.";
  }
  if (raw === "Failed to fetch" || raw === "Load failed" || /networkerror|cannot reach/i.test(raw)) {
    return "Network error. Check your connection and try again.";
  }
  if (/stack trace|at\s+\S+\s+\(|ReferenceError|TypeError.*before initialization|Cannot access .* before initialization/i.test(raw)) {
    return fallback;
  }
  if (code === "NO_DATABASE" || /NO_DATABASE|PostgreSQL required/i.test(raw)) {
    return "This feature is temporarily unavailable. Please try again later.";
  }
  if (/flutterwave.*disabled|FLUTTERWAVE/i.test(raw)) {
    return "Card checkout is not available right now. Try again later.";
  }
  if (/OpenAI|OPENAI_API_KEY|ai unavailable|503/i.test(raw) && /key|configured|unavailable/i.test(raw)) {
    return "AI is temporarily unavailable. Please try again shortly.";
  }
  if (/exceeded your current quota|insufficient_quota|billing details|usage limit/i.test(raw)) {
    return "Live AI is temporarily limited. A fallback response was used — try again after billing is restored.";
  }

  const msg = stripSensitive(raw);
  if (!msg || msg.length > 180) return fallback;
  return msg;
}

/** Sanitize arbitrary UI copy that may contain leaked API error text. */
export function sanitizeUserMessage(text, fallback = "") {
  if (!text) return fallback;
  const raw = String(text);
  const hadInfra = INFRA_PATTERNS.some((pat) => pat.test(raw)) || ENV_PATTERNS.some((pat) => pat.test(raw));
  const cleaned = stripSensitive(raw);
  if (hadInfra || !cleaned || cleaned.length < 8 || /failed to fetch|networkerror/i.test(cleaned)) {
    return fallback || "Something went wrong. Please try again.";
  }
  return cleaned.length > 220 ? fallback || cleaned.slice(0, 217) + "…" : cleaned;
}
