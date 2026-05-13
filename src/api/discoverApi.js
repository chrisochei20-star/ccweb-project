import { apiFetch } from "../lib/apiClient";
import { apiUrl } from "../config/env";
import { getSessionToken } from "../session";

function authHeaders() {
  const t = getSessionToken();
  const h = {};
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
}

export async function fetchDiscover({ q = "", limit = 20 } = {}) {
  const qs = new URLSearchParams();
  if (q) qs.set("q", q);
  if (limit) qs.set("limit", String(limit));
  const path = apiUrl(`/api/v1/discover?${qs}`);
  const res = await apiFetch(path, { headers: authHeaders(), credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Discover failed");
  return data;
}
