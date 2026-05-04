const SESSION_KEY = "ccweb_telemetry_session";

function getSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `sess_${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "sess_unknown";
  }
}

export async function trackEvent(name, metadata = {}) {
  const path = typeof window !== "undefined" ? window.location.pathname + window.location.search : "";
  try {
    await fetch("/api/telemetry/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        path,
        sessionId: getSessionId(),
        metadata,
      }),
    });
  } catch {
    /* ignore */
  }
}

export async function reportClientError(message, extra = {}) {
  const path = typeof window !== "undefined" ? window.location.pathname + window.location.search : "";
  try {
    await fetch("/api/telemetry/client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: String(message).slice(0, 500),
        path,
        sessionId: getSessionId(),
        ...extra,
      }),
    });
  } catch {
    /* ignore */
  }
}
