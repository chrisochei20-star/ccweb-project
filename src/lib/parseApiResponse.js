import { apiFetch } from "./apiClient";

/**
 * Standard JSON response parsing for apiFetch callers.
 * @param {Response} res
 * @param {{ fallbackError?: string }} [opts]
 */
export async function parseApiResponse(res, opts = {}) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error || data.message || data.detail || opts.fallbackError || `Error ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.code = data.code;
    err.body = data;
    throw err;
  }
  return data;
}

/**
 * @param {string} url
 * @param {RequestInit} init
 * @param {{ networkRetries?: number, timeoutMs?: number, fallbackError?: string }} [options]
 */
export async function apiFetchJson(url, init, options = {}) {
  const { networkRetries, timeoutMs, fallbackError } = options;
  const res = await apiFetch(url, init, { networkRetries, timeoutMs });
  return parseApiResponse(res, { fallbackError });
}
