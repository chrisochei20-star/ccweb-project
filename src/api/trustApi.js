import { apiFetch } from "../lib/apiClient";
import { apiUrl } from "../config/env";
import { getSessionToken } from "../session";

export async function submitTrustReport({ targetType, targetId, reasonCode, details }) {
  const token = getSessionToken();
  const res = await apiFetch(apiUrl("/api/v1/trust/report"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ targetType, targetId, reasonCode, details }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Report failed");
  return data;
}
