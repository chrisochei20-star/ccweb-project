/** Browser fetch with bounded retries for transient network failures (split CDN ↔ API). */

import { SESSION_TOKEN_KEY } from "../authStorageKeys";

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

function readAccessToken() {
  try {
    return sessionStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

function shouldSkipAutoBearer(urlStr) {
  try {
    const path = new URL(urlStr, "https://ccweb.invalid").pathname;
    return (
      path.includes("/api/auth/refresh") ||
      path.includes("/api/auth/login") ||
      path.includes("/api/auth/register") ||
      path.includes("/api/auth/oauth/")
    );
  } catch {
    return false;
  }
}

function mergeInitWithAuth(input, init) {
  const merged = { credentials: "include", ...init };
  const headers = new Headers(init.headers || {});
  const urlStr =
    typeof input === "string" ? input : input instanceof Request ? input.url : input?.url || "";
  const hasAuth = [...headers.keys()].some((k) => k.toLowerCase() === "authorization");
  if (!hasAuth && !shouldSkipAutoBearer(urlStr)) {
    const t = readAccessToken();
    if (t) headers.set("Authorization", `Bearer ${t}`);
  }
  merged.headers = headers;
  return merged;
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
  const finalInit = mergeInitWithAuth(input, init);
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fetch(input, finalInit);
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
