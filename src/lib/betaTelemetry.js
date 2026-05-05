import { http } from "../api/http";

function pathInvite(code) {
  return `/invite/${encodeURIComponent(code)}`;
}

function pathProfile(slug) {
  return `/u/${encodeURIComponent(slug)}`;
}

function pathTestUser(userId) {
  return `/test/${encodeURIComponent(userId)}`;
}

/**
 * Store invite code from URL for attribution on subsequent telemetry events.
 */
export function captureInviteFromSearch(search) {
  try {
    const q = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
    const inv = (q.get("invite") || "").trim().toLowerCase();
    if (inv) sessionStorage.setItem("ccweb_invite", inv.slice(0, 64));
  } catch {
    /* ignore */
  }
}

export function setBetaSlugContext(slug) {
  if (slug) sessionStorage.setItem("ccweb_beta_slug", slug.slice(0, 64));
  else sessionStorage.removeItem("ccweb_beta_slug");
}

export async function postBetaClientEvent(payload = {}) {
  try {
    const inviteCode = sessionStorage.getItem("ccweb_invite") || undefined;
    const slug = sessionStorage.getItem("ccweb_beta_slug") || undefined;
    await http.post("/api/v1/beta/event", {
      eventType: payload.eventType || "page_view",
      path: payload.path || (typeof window !== "undefined" ? window.location.pathname : ""),
      featureKey: payload.featureKey,
      inviteCode: payload.inviteCode || inviteCode,
      slug: payload.slug || slug,
      durationMs: payload.durationMs,
      error: payload.error,
      metadata: payload.metadata || {},
    });
  } catch {
    /* non-blocking */
  }
}

export const betaLinkHelpers = { pathInvite, pathProfile, pathTestUser };
