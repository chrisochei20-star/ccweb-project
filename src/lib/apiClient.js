/** Browser fetch with bounded retries for transient network failures (split CDN ↔ API). */

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isLikelyNetworkFailure(err) {
  if (err instanceof TypeError) return true;
  const m = String(err?.message || err || "");
  return /failed to fetch|load failed|networkerror/i.test(m);
}

function logApiFailure(phase, input, err, attempt) {
  try {
    const raw = typeof input === "string" ? input : input?.url || String(input || "");
    let origin = raw;
    try {
      origin = new URL(raw, "https://ccweb.invalid").origin;
    } catch {
      /* keep raw */
    }
    // eslint-disable-next-line no-console -- intentional production diagnostics for split-deploy debugging
    console.warn("[ccweb-api]", phase, { attempt, origin, message: String(err?.message || err) });
  } catch {
    /* ignore */
  }
}

/**
 * @param {RequestInfo} input
 * @param {RequestInit} [init]
 * @param {{ networkRetries?: number }} [options]
 */
export async function apiFetch(input, init = {}, options = {}) {
  const networkRetries = Number.isFinite(options.networkRetries) ? options.networkRetries : 2;
  let lastErr;
  const attempts = 1 + Math.max(0, networkRetries);
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fetch(input, init);
    } catch (e) {
      lastErr = e;
      logApiFailure("fetch_failed", input, e, i + 1);
      const canRetry = i < attempts - 1 && isLikelyNetworkFailure(e);
      if (!canRetry) throw e;
      await sleep(320 * (i + 1));
    }
  }
  throw lastErr;
}
