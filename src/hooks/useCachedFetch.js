import { useCallback, useEffect, useRef, useState } from "react";
import { apiUrl } from "../config/env";
import { getSessionToken } from "../session";

const cache = new Map();

function resolveFetchUrl(url) {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return apiUrl(url);
}

/**
 * GET JSON with simple in-memory TTL cache (per tab session).
 * Uses apiUrl() so production split CDN + API deploy works; sends Bearer token when present.
 */
export function useCachedFetch(url, opts = {}) {
  const { ttlMs = 45_000, enabled = true } = opts;
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
    try {
      const headers = {};
      const token = getSessionToken();
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(resolved, { credentials: "include", headers });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || res.statusText || "Request failed");
      cache.set(key, { at: Date.now(), json });
      if (mounted.current) {
        setData(json);
      }
      return json;
    } catch (e) {
      if (mounted.current) setError(e.message || "Error");
      throw e;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [url, enabled, ttlMs]);

  useEffect(() => {
    mounted.current = true;
    if (url && enabled) refresh().catch(() => {});
    return () => {
      mounted.current = false;
    };
  }, [url, enabled, refresh]);

  return { data, loading, error, refresh };
}
