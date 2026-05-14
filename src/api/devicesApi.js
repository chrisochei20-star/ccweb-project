import { apiFetch } from "../lib/apiClient";
import { apiUrl } from "../config/env";
import { getSessionToken } from "../session";

function authHeaders() {
  const t = getSessionToken();
  const h = { "Content-Type": "application/json" };
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
}

export async function postPushDeviceToken({ platform, token }) {
  const res = await apiFetch(apiUrl("/api/v1/devices/push-token"), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ platform, token }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Push registration failed (${res.status})`);
  return data;
}
