/** Browser fetch with bounded retries for transient network failures (split CDN ↔ API). */

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isLikelyNetworkFailure(err) {
  if (err instanceof TypeError) return true;
  const m = String(err?.message || err || "");
  return /failed to fetch|load failed|networkerror/i.test(m);
}

/**
 * @param {RequestInfo} input
 * @param {RequestInit} [init]
 * @param {{ networkRetries?: number }} [options]
 */
export async function apiFetch(input, init = {}, options = {}) {
  const networkRetries = Number.isFinite(options.networkRetries) ? options.networkRetries : 1;
  let lastErr;
  const attempts = 1 + Math.max(0, networkRetries);
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fetch(input, init);
    } catch (e) {
      lastErr = e;
      const canRetry = i < attempts - 1 && isLikelyNetworkFailure(e);
      if (!canRetry) throw e;
      await sleep(320 * (i + 1));
    }
  }
  throw lastErr;
}
