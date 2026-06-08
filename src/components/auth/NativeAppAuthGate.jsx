import { Loader2 } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";
import { CcwebBrandMark } from "../brand/CcwebBrandMark";
import { isCapacitorNative } from "../../lib/capacitorPlatform";
import { isNativePublicPath } from "../../lib/nativeAuthPaths";
import { getSessionToken } from "../../session";

/**
 * On Capacitor Android/iOS: require sign-in before main app routes (X-style cold start).
 * Web SPA behavior is unchanged.
 */
export function NativeAppAuthGate({ authHydrated, children }) {
  const location = useLocation();
  const path = location.pathname;

  if (!isCapacitorNative() || isNativePublicPath(path)) {
    return children;
  }

  if (!authHydrated) {
    return (
      <div
        className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center"
        role="status"
        aria-live="polite"
      >
        <CcwebBrandMark size={80} showGlow className="animate-pulse" />
        <Loader2 className="h-6 w-6 animate-spin text-ccweb-cyan" aria-hidden />
        <p className="text-sm font-medium text-white">CCWEB</p>
        <p className="max-w-xs text-xs text-ccweb-muted">Preparing your session…</p>
      </div>
    );
  }

  if (!getSessionToken()) {
    return (
      <Navigate to="/login" replace state={{ from: path + location.search }} />
    );
  }

  return children;
}
