import { apiUrl } from "../config/env";
import { apiFetch } from "../lib/apiClient";

export async function fetchNotificationSummary() {
  const res = await apiFetch(apiUrl("/api/v1/notifications/summary"));
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
  const res = await apiFetch(apiUrl(`/api/v1/notifications?${q}`));
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to load notifications");
  return data;
}

export async function markNotificationsRead({ markAll = false, ids = [] } = {}) {
  const res = await apiFetch(apiUrl("/api/v1/notifications/read"), {
    method: "POST",
    body: JSON.stringify({ markAll, ids }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not update read state");
  return data;
}

export async function followUser(userId) {
  const res = await apiFetch(apiUrl(`/api/v1/users/${encodeURIComponent(userId)}/follow`), {
    method: "POST",
    body: JSON.stringify({}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok && res.status !== 200 && res.status !== 201) throw new Error(data.error || "Follow failed");
  return data;
}
