import { apiFetch } from "../lib/apiClient";
import { apiUrl } from "../config/env";
import { getSessionToken } from "../session";

function authHeaders() {
  const t = getSessionToken();
  const h = { "Content-Type": "application/json" };
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
}

export async function fetchFlutterwaveConfig() {
  const res = await apiFetch(apiUrl("/api/v1/payments/flutterwave/config"));
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Config failed");
  return data;
}

export async function initializeFlutterwaveCheckout(body) {
  const res = await apiFetch(apiUrl("/api/v1/payments/flutterwave/initialize"), {
    method: "POST",
    headers: authHeaders(),
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Checkout init failed");
  return data;
}

export async function verifyFlutterwaveTx(txRef) {
  const res = await apiFetch(apiUrl(`/api/v1/payments/flutterwave/verify?tx_ref=${encodeURIComponent(txRef)}`), {
    headers: authHeaders(),
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Verify failed");
  return data;
}

export async function requestFlutterwavePayout(body) {
  const res = await apiFetch(apiUrl("/api/v1/payments/flutterwave/payout-request"), {
    method: "POST",
    headers: authHeaders(),
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Payout request failed");
  return data;
}
