import { useEffect, useState } from "react";
import { CCWEB_UI_LOAD_TIMEOUT_MS } from "../constants/loadTimeout";

/**
 * True when `active` has stayed true for at least `timeoutMs` (e.g. hung network).
 */
export function useStaleLoadingGuard(active, timeoutMs = CCWEB_UI_LOAD_TIMEOUT_MS) {
  const [stale, setStale] = useState(false);
  useEffect(() => {
    if (!active) {
      setStale(false);
      return undefined;
    }
    const id = window.setTimeout(() => setStale(true), timeoutMs);
    return () => window.clearTimeout(id);
  }, [active, timeoutMs]);
  return stale;
}
