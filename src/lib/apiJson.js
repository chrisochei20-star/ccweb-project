import { apiFetch } from "./apiClient";
import { parseApiResponse } from "./parseApiResponse";
import { toast } from "./toastBus";

/**
 * JSON fetch with optional automatic error toast.
 * @param {string} url
 * @param {RequestInit} [init]
 * @param {{ networkRetries?: number; toastOnError?: boolean; timeoutMs?: number }} [options]
 */
export async function apiJson(url, init = {}, options = {}) {
  const { networkRetries, toastOnError = true, timeoutMs } = options;
  try {
    const res = await apiFetch(url, init, { networkRetries, timeoutMs });
    return await parseApiResponse(res);
  } catch (e) {
    if (toastOnError && e?.message) toast.error(e.message);
    throw e;
  }
}
