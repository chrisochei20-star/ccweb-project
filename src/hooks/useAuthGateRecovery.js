import { useEffect, useRef } from "react";
import { getSessionToken } from "../session";

/**
 * One automatic session refresh when a page gate times out but a local access token exists
 * (mobile Chrome / slow cross-origin /me). Manual retry button remains available.
 */
export function useAuthGateRecovery({ gateTimedOut, authHydrated, refreshSession }) {
  const autoRetriedRef = useRef(false);

  useEffect(() => {
    if (!gateTimedOut || authHydrated || !getSessionToken() || typeof refreshSession !== "function") {
      return undefined;
    }
    if (autoRetriedRef.current) return undefined;
    autoRetriedRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        await refreshSession();
      } catch {
        /* UI keeps manual retry */
      }
      if (cancelled) autoRetriedRef.current = false;
    })();
    return () => {
      cancelled = true;
    };
  }, [gateTimedOut, authHydrated, refreshSession]);
}
