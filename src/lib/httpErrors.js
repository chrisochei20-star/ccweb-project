import { toast } from "./toastBus";

/**
 * Best-effort JSON error string from a fetch Response.
 * @param {Response} res
 */
export async function readApiErrorMessage(res) {
  try {
    const data = await res.clone().json();
    return data.error || data.message || data.detail || res.statusText || `HTTP ${res.status}`;
  } catch {
    return res.statusText || `HTTP ${res.status}`;
  }
}

/**
 * @param {unknown} err
 * @param {{ context?: string, silent?: boolean }} [opts]
 */
export function reportClientError(err, opts = {}) {
  const prefix = opts.context ? `${opts.context}: ` : "";
  const msg = err instanceof Error ? err.message : String(err || "Unknown error");
  if (!opts.silent) toast.error(`${prefix}${msg}`);
}
