/**
 * Bounded retries for multipart uploads and similar flaky mobile networks.
 */

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * @param {() => Promise<Response>} doFetch
 * @param {{ retries?: number, baseDelayMs?: number, isRetryable?: (res: Response) => boolean }} [opts]
 */
export async function fetchWithRetry(doFetch, opts = {}) {
  const retries = Math.min(6, Math.max(1, Number(opts.retries) || 3));
  const baseDelayMs = Math.min(5000, Math.max(120, Number(opts.baseDelayMs) || 350));
  const isRetryable =
    opts.isRetryable ||
    ((res) => res.status === 0 || res.status === 408 || res.status === 429 || (res.status >= 500 && res.status <= 599));

  let lastErr;
  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      const res = await doFetch();
      if (!res.ok && isRetryable(res) && attempt < retries - 1) {
        await sleep(baseDelayMs * (attempt + 1));
        continue;
      }
      return res;
    } catch (e) {
      lastErr = e;
      if (attempt < retries - 1) await sleep(baseDelayMs * (attempt + 1));
    }
  }
  throw lastErr || new Error("Upload failed after retries.");
}
