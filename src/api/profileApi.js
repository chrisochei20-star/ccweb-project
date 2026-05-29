import { apiUrl } from "../config/env";
import { apiFetch } from "../lib/apiClient";
import { getSessionToken } from "../session";

function authHeaders() {
  const token = getSessionToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchMyProfile() {
  const res = await apiFetch(apiUrl("/api/v1/users/me"), { headers: authHeaders() }, { networkRetries: 2, timeoutMs: 12000 });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not load profile.");
  return data;
}

export async function updateProfile(body) {
  const res = await apiFetch(
    apiUrl("/api/v1/users/update"),
    {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(body),
    },
    { networkRetries: 2 }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Save failed.");
  return data;
}

export async function fetchPublicProfileByUserId(userId) {
  const res = await apiFetch(
    apiUrl(`/api/v1/users/${encodeURIComponent(userId)}/profile`),
    { headers: authHeaders() },
    { networkRetries: 2, timeoutMs: 12000 }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Profile not found.");
  return data;
}

export async function fetchPublicProfileBySlug(slug) {
  const res = await apiFetch(
    apiUrl(`/api/v1/beta/profile/${encodeURIComponent(slug)}`),
    { headers: authHeaders() },
    { networkRetries: 2, timeoutMs: 12000 }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Profile not found.");
  return data;
}

export async function fetchProfileFeed(userId, tab, { limit = 30, offset = 0 } = {}) {
  const q = new URLSearchParams({ tab, limit: String(limit), offset: String(offset) });
  const res = await apiFetch(
    apiUrl(`/api/v1/users/${encodeURIComponent(userId)}/feed?${q}`),
    { headers: authHeaders() },
    { networkRetries: 2, timeoutMs: 12000 }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not load feed.");
  return data;
}

export async function followUser(userId) {
  const res = await apiFetch(
    apiUrl(`/api/v1/users/${encodeURIComponent(userId)}/follow`),
    { method: "POST", headers: authHeaders() },
    { networkRetries: 1 }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Follow failed.");
  return data;
}
