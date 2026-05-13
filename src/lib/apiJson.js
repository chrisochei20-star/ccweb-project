import { apiFetch } from "./apiClient";
import { toast } from "./toastBus";

/**
 * JSON fetch with optional automatic error toast.
 * @param {string} url
 * @param {RequestInit} [init]
 * @param {{ networkRetries?: number, toastOnError?: boolean }} [options]
 */
export async function apiJson(url, init = {}, options = {}) {
  const { networkRetries, toastOnError = true } = options;
  const res = await apiFetch(url, init, { networkRetries });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error || data.message || data.detail || `Error ${res.status}`;
    if (toastOnError) toast.error(msg);
    const err = new Error(msg);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}
