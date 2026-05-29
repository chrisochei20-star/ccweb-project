import { useCallback, useEffect, useRef, useState } from "react";
import { CCWEB_UI_LOAD_TIMEOUT_MS } from "../constants/loadTimeout";
import { apiUrl } from "../config/env";
import { apiFetch } from "../lib/apiClient";
import { toast } from "../lib/toastBus";

const cache = new Map();
/** @type {Map<string, Promise<unknown>>} */
const inFlight = new Map();

function resolveFetchUrl(url) {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return apiUrl(url);
}

/**
 * GET JSON with simple in-memory TTL cache (per tab session).
 * Uses apiUrl() so production split CDN + API deploy works; sends JSON + Bearer via apiFetch.
 */
export function useCachedFetch(url, opts = {}) {
  const { ttlMs = 45_000, enabled = true, toastOnError = false, timeoutMs = CCWEB_UI_LOAD_TIMEOUT_MS } = opts;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled && url));
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    if (!url || !enabled) {
      setLoading(false);
      return null;
    }
    const resolved = resolveFetchUrl(url);
    const key = resolved;
    const now = Date.now();
    const hit = cache.get(key);
    if (hit && now - hit.at < ttlMs) {
      setData(hit.json);
      setError(null);
      setLoading(false);
      return hit.json;
    }
    setLoading(true);
    setError(null);
    const existing = inFlight.get(key);
    if (existing) {
      try {
        const json = await existing;
        if (mounted.current) {
          setData(json);
          setError(null);
          setLoading(false);
        }
        return json;
      } catch (e) {
        if (mounted.current) setError(e.message || "Error");
        setLoading(false);
        throw e;
      }
    }
    const task = (async () => {
      const res = await apiFetch(resolved, {}, { networkRetries: 2, timeoutMs });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || res.statusText || "Request failed");
      cache.set(key, { at: Date.now(), json });
      return json;
    })();
    inFlight.set(key, task);
    try {
      const json = await task;
      if (mounted.current) {
        setData(json);
      }
      return json;
    } catch (e) {
      const msg =
        e?.name === "AbortError"
          ? "Request timed out. Check your connection and try again."
          : e.message || "Error";
      if (mounted.current) setError(msg);
      if (toastOnError && mounted.current) toast.error(msg);
      throw e;
    } finally {
      inFlight.delete(key);
      if (mounted.current) setLoading(false);
    }
  }, [url, enabled, ttlMs, toastOnError, timeoutMs]);

  useEffect(() => {
    mounted.current = true;
    if (url && enabled) refresh().catch(() => {});
    return () => {
      mounted.current = false;
    };
  }, [url, enabled, refresh]);

  return { data, loading, error, refresh };
}
