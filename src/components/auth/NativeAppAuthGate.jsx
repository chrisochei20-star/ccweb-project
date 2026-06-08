import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { CcwebBrandMark } from "../brand/CcwebBrandMark";
import { isCapacitorNative } from "../../lib/capacitorPlatform";
import { isNativePublicPath } from "../../lib/nativeAuthPaths";
import { getSessionToken } from "../../session";

const SPLASH_MS = 1400;

/**
 * On Capacitor Android/iOS: branded splash → login before main app routes (X-style cold start).
 * Web SPA behavior is unchanged.
 */
export function NativeAppAuthGate({ authHydrated, children }) {
  const location = useLocation();
  const path = location.pathname;
  const [splashPhase, setSplashPhase] = useState(true);

  useEffect(() => {
    if (!isCapacitorNative()) {
      setSplashPhase(false);
      return undefined;
    }
    const id = window.setTimeout(() => setSplashPhase(false), SPLASH_MS);
    return () => window.clearTimeout(id);
  }, []);

  if (!isCapacitorNative() || isNativePublicPath(path)) {
    return children;
  }

  if (splashPhase || !authHydrated) {
    return (
      <div
        className="ccweb-native-splash flex min-h-[100dvh] flex-col items-center justify-center gap-5 px-6 text-center"
        role="status"
        aria-live="polite"
      >
        <CcwebBrandMark size={96} showGlow className="ccweb-splash-logo" />
        <div className="space-y-1">
          <p className="text-lg font-bold tracking-tight text-white">CCWEB</p>
          <p className="max-w-xs text-xs text-ccweb-muted">
            {splashPhase ? "Your Web3 workspace" : "Preparing your session…"}
          </p>
        </div>
        {!splashPhase && (
          <Loader2 className="h-5 w-5 animate-spin text-ccweb-cyan" aria-hidden />
        )}
      </div>
    );
  }

  if (!getSessionToken()) {
    return <Navigate to="/login" replace state={{ from: path + location.search }} />;
  }

  return <div className="ccweb-page-enter">{children}</div>;
}
