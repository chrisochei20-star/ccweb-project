import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useOutletContext } from "react-router-dom";
import { CCWEB_UI_LOAD_TIMEOUT_MS } from "../constants/loadTimeout";
import { getSessionToken } from "../session";

/** Requires a JWT in session storage — pair with API Bearer auth. Waits for MobileLayout auth hydration. */
export function ProtectedLayout() {
  const location = useLocation();
  const { authHydrated } = useOutletContext() || {};
  const token = getSessionToken();
  const [hydrateTimedOut, setHydrateTimedOut] = useState(false);

  useEffect(() => {
    if (authHydrated) {
      setHydrateTimedOut(false);
      return undefined;
    }
    const id = window.setTimeout(() => setHydrateTimedOut(true), CCWEB_UI_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [authHydrated]);

  if (!authHydrated && hydrateTimedOut) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 px-4 text-center text-ccweb-muted" role="alert">
        <p className="text-sm text-rose-200/90">We could not finish checking your session in time.</p>
        <p className="text-xs">Try refreshing the page or signing in again.</p>
      </div>
    );
  }

  if (!authHydrated) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 px-4 text-ccweb-muted" role="status">
        <Loader2 className="h-6 w-6 shrink-0 animate-spin" aria-hidden />
        <span className="text-sm">Checking session…</span>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
