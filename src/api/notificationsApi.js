import { apiUrl } from "../config/env";
import { apiFetch } from "../lib/apiClient";
import { getSessionToken } from "../session";

function authHeaders() {
  const h = { "Content-Type": "application/json" };
  const t = getSessionToken();
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
}

export async function fetchNotificationSummary() {
  const res = await apiFetch(apiUrl("/api/v1/notifications/summary"), {
    headers: authHeaders(),
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Summary failed");
  return data;
}

export async function fetchNotifications({ limit = 25, cursor = null, unreadOnly = false, grouped = false } = {}) {
  const q = new URLSearchParams();
  q.set("limit", String(limit));
  if (cursor) q.set("cursor", cursor);
  if (unreadOnly) q.set("unreadOnly", "1");
  if (grouped) q.set("grouped", "1");
  const res = await apiFetch(apiUrl(`/api/v1/notifications?${q}`), {
    headers: authHeaders(),
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to load notifications");
  return data;
}

export async function markNotificationsRead({ markAll = false, ids = [] } = {}) {
  const res = await apiFetch(apiUrl("/api/v1/notifications/read"), {
    method: "POST",
    headers: authHeaders(),
    credentials: "include",
    body: JSON.stringify({ markAll, ids }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not update read state");
  return data;
}

export async function followUser(userId) {
  const res = await apiFetch(apiUrl(`/api/v1/users/${encodeURIComponent(userId)}/follow`), {
    method: "POST",
    headers: authHeaders(),
    credentials: "include",
    body: JSON.stringify({}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok && res.status !== 200 && res.status !== 201) throw new Error(data.error || "Follow failed");
  return data;
}

export async function unfollowUser(userId) {
  const res = await apiFetch(apiUrl(`/api/v1/users/${encodeURIComponent(userId)}/follow`), {
    method: "DELETE",
    headers: authHeaders(),
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Unfollow failed");
  return data;
}
