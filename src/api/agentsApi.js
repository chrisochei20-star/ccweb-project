import { apiFetch } from "../lib/apiClient";
import { apiUrl } from "../config/env";
import { getSessionToken } from "../session";

function authHeaders() {
  const t = getSessionToken();
  const h = {};
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
}

export async function fetchAgentRuns(limit = 40) {
  const res = await apiFetch(apiUrl(`/api/v1/agents/runs?limit=${encodeURIComponent(limit)}`), {
    headers: authHeaders(),
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Runs failed");
  return data.runs || [];
}
