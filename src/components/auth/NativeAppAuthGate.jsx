import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { CcwebBrandMark } from "../brand/CcwebBrandMark";
import { isCapacitorNative } from "../../lib/platformDetect";
import { isNativePublicPath } from "../../lib/nativeAuthPaths";
import { getSessionToken } from "../../session";

const SPLASH_MS = 1200;
const RESTORE_MS = 900;

/**
 * On Capacitor Android/iOS: branded splash → session restore → login before main app.
 */
export function NativeAppAuthGate({ authHydrated, children }) {
  const location = useLocation();
  const path = location.pathname;
  const [splashPhase, setSplashPhase] = useState(true);
  const [restorePhase, setRestorePhase] = useState(false);
  const hasToken = Boolean(getSessionToken());

  useEffect(() => {
    if (!isCapacitorNative()) {
      setSplashPhase(false);
      return undefined;
    }
    const id = window.setTimeout(() => setSplashPhase(false), SPLASH_MS);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!isCapacitorNative() || splashPhase || !hasToken || authHydrated) {
      setRestorePhase(false);
      return undefined;
    }
    setRestorePhase(true);
    const id = window.setTimeout(() => setRestorePhase(false), RESTORE_MS);
    return () => window.clearTimeout(id);
  }, [splashPhase, hasToken, authHydrated]);

  if (!isCapacitorNative() || isNativePublicPath(path)) {
    return children;
  }

  if (splashPhase) {
    return (
      <div className="ccweb-native-splash flex min-h-[100dvh] flex-col items-center justify-center gap-5 px-6 text-center" role="status">
        <CcwebBrandMark size={96} showGlow className="ccweb-splash-logo" />
        <p className="text-lg font-bold tracking-tight text-white">CCWEB</p>
        <p className="max-w-xs text-xs text-ccweb-muted">Your Web3 workspace</p>
      </div>
    );
  }

  if (!authHydrated || restorePhase) {
    return (
      <div className="ccweb-native-splash flex min-h-[70dvh] flex-col items-center justify-center gap-4 px-6 text-center" role="status">
        <CcwebBrandMark size={72} showGlow className="ccweb-splash-logo opacity-90" />
        <Loader2 className="h-6 w-6 animate-spin text-ccweb-cyan" aria-hidden />
        <p className="text-sm font-medium text-white">
          {hasToken ? "Restoring your session…" : "Preparing sign in…"}
        </p>
      </div>
    );
  }

  if (!getSessionToken()) {
    return <Navigate to="/login" replace state={{ from: path + location.search }} />;
  }

  return <div className="ccweb-page-enter">{children}</div>;
}
