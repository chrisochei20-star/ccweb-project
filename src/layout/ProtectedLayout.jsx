import { Loader2 } from "lucide-react";
import { Navigate, Outlet, useLocation, useOutletContext } from "react-router-dom";
import { getSessionToken } from "../session";

/** Requires a JWT in session storage — pair with API Bearer auth. Waits for MobileLayout auth hydration. */
export function ProtectedLayout() {
  const location = useLocation();
  const { authHydrated } = useOutletContext() || {};
  const token = getSessionToken();

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
