/** Browser fetch with bounded retries for transient network failures (split CDN ↔ API). */

import { SESSION_TOKEN_KEY } from "../authStorageKeys";
import { getSupabaseAccessToken } from "./supabaseClient";
import { logClientStructured } from "./productionDiag";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isLikelyNetworkFailure(err) {
  if (err instanceof TypeError) return true;
  const m = String(err?.message || err || "");
  return /failed to fetch|load failed|networkerror/i.test(m);
}

function ccwebApiDiagEnabled() {
  return import.meta.env.VITE_CCWEB_API_DEBUG === "1" || import.meta.env.VITE_CCWEB_AUTH_TRACE === "1";
}

function logApiFailure(phase, input, err, attempt) {
  if (!ccwebApiDiagEnabled()) return;
  try {
    const raw = typeof input === "string" ? input : input?.url || String(input || "");
    let origin = raw;
    try {
      origin = new URL(raw, "https://ccweb.invalid").origin;
    } catch {
      /* keep raw */
    }
    const trace = import.meta.env.VITE_CCWEB_AUTH_TRACE === "1";
    const payload = {
      attempt,
      origin,
      message: String(err?.message || err),
      ...(trace ? { cause: err?.cause ? String(err.cause) : undefined, name: err?.name } : {}),
    };
    // eslint-disable-next-line no-console -- gated split-deploy diagnostics
    console.warn("[ccweb-api]", phase, payload);
  } catch {
    /* ignore */
  }
}

function readCcwebAccessToken() {
  try {
    return sessionStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Prefer Supabase session JWT when configured; otherwise CCWEB access token from sessionStorage.
 * @returns {Promise<string|null>}
 */
export async function getApiBearerToken() {
  const supa = await getSupabaseAccessToken();
  if (supa) return supa;
  return readCcwebAccessToken();
}

function shouldSkipAutoBearer(urlStr) {
  try {
    const path = new URL(urlStr, "https://ccweb.invalid").pathname;
    return (
      path.includes("/api/auth/refresh") ||
      path.includes("/api/auth/login") ||
      path.includes("/api/auth/register") ||
      path.includes("/api/auth/oauth/") ||
      path.includes("/api/auth/verify-email") ||
      path.includes("/api/auth/password")
    );
  } catch {
    return false;
  }
}

function isFormDataBody(body) {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

function mergeAbortSignals(parent, child) {
  if (!parent) return child;
  if (!child) return parent;
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.any === "function") {
    return AbortSignal.any([parent, child]);
  }
  parent.addEventListener("abort", () => child.abort(), { once: true });
  return child;
}

function applyRequestTimeout(init, timeoutMs) {
  if (!timeoutMs || timeoutMs <= 0) return { init: init || {}, clearTimer: () => {} };
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  const clearTimer = () => clearTimeout(t);
  const merged = { ...(init || {}) };
  merged.signal = mergeAbortSignals(init?.signal, ctrl.signal);
  return { init: merged, clearTimer };
}

/**
 * @param {RequestInfo} input
 * @param {RequestInit} [init]
 * @returns {Promise<RequestInit>}
 */
async function mergeInitWithApiDefaults(input, init = {}) {
  const merged = { credentials: "include", ...init };
  const headers = new Headers(init.headers || {});
  const urlStr =
    typeof input === "string" ? input : input instanceof Request ? input.url : input?.url || "";

  const hasCT = [...headers.keys()].some((k) => k.toLowerCase() === "content-type");
  if (!hasCT && !isFormDataBody(merged.body)) {
    headers.set("Content-Type", "application/json");
  }

  const hasAuth = [...headers.keys()].some((k) => k.toLowerCase() === "authorization");
  if (!hasAuth && !shouldSkipAutoBearer(urlStr)) {
    const t = await getApiBearerToken();
    if (t) headers.set("Authorization", `Bearer ${t}`);
  }
  merged.headers = headers;
  return merged;
}

/**
 * @param {RequestInfo} input
 * @param {RequestInit} [init]
 * @param {{ networkRetries?: number; timeoutMs?: number }} [options]
 */
export async function apiFetch(input, init = {}, options = {}) {
  const networkRetries = Number.isFinite(options.networkRetries) ? options.networkRetries : 2;
  const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : 0;
  const { init: timedInit, clearTimer } = applyRequestTimeout(init, timeoutMs);
  let lastErr;
  const attempts = 1 + Math.max(0, networkRetries);
  try {
    for (let i = 0; i < attempts; i += 1) {
      try {
        const finalInit = await mergeInitWithApiDefaults(input, timedInit);
        const res = await fetch(input, finalInit);
        if (!res.ok) {
          const urlStr =
            typeof input === "string" ? input : input instanceof Request ? input.url : input?.url || "";
          let path = urlStr;
          try {
            path = new URL(urlStr, "https://ccweb.invalid").pathname;
          } catch {
            /* keep */
          }
          logClientStructured("http_non_ok", { path, status: res.status, statusText: res.statusText });
        }
        if (!res.ok && ccwebApiDiagEnabled()) {
          const urlStr =
            typeof input === "string" ? input : input instanceof Request ? input.url : input?.url || "";
          // eslint-disable-next-line no-console -- gated split-deploy diagnostics
          console.warn("[ccweb-api] fetch_non_ok", {
            url: urlStr,
            status: res.status,
            statusText: res.statusText,
          });
        }
        return res;
      } catch (e) {
        lastErr = e;
        if (e?.name === "AbortError") throw e;
        logApiFailure("fetch_failed", input, e, i + 1);
        const canRetry = i < attempts - 1 && isLikelyNetworkFailure(e);
        if (!canRetry) throw e;
        await sleep(320 * (i + 1));
      }
    }
    throw lastErr;
  } finally {
    clearTimer();
  }
}
