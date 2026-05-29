import { apiUrl } from "../config/env";
import { apiFetchJson } from "../lib/parseApiResponse";

export async function fetchNotificationSummary() {
  const data = await apiFetchJson(apiUrl("/api/v1/notifications/summary"), {}, { fallbackError: "Summary failed" });
  return data;
}

export async function fetchNotifications({ limit = 25, cursor = null, unreadOnly = false, grouped = false } = {}) {
  const q = new URLSearchParams();
  q.set("limit", String(limit));
  if (cursor) q.set("cursor", cursor);
  if (unreadOnly) q.set("unreadOnly", "1");
  if (grouped) q.set("grouped", "1");
  const data = await apiFetchJson(
    apiUrl(`/api/v1/notifications?${q}`),
    {},
    { fallbackError: "Failed to load notifications" }
  );
  return data;
}

export async function markNotificationsRead({ markAll = false, ids = [] } = {}) {
  return apiFetchJson(
    apiUrl("/api/v1/notifications/read"),
    { method: "POST", body: JSON.stringify({ markAll, ids }) },
    { fallbackError: "Could not update read state" }
  );
}

export async function fetchNotificationPreferences() {
  return apiFetchJson(
    apiUrl("/api/v1/notifications/preferences"),
    {},
    { networkRetries: 2, fallbackError: "Could not load preferences" }
  );
}

export async function updateNotificationPreferences(preferences) {
  return apiFetchJson(
    apiUrl("/api/v1/notifications/preferences"),
    { method: "PUT", body: JSON.stringify({ preferences }) },
    { networkRetries: 1, fallbackError: "Could not save preferences" }
  );
}
