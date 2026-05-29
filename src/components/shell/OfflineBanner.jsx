import { RefreshCw, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Global offline / back-online banner for mobile shell.
 */
export function OfflineBanner() {
  const [online, setOnline] = useState(() => (typeof navigator !== "undefined" ? navigator.onLine : true));
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    const onOffline = () => {
      setOnline(false);
      setShowBackOnline(false);
    };
    const onOnline = () => {
      setOnline(true);
      setShowBackOnline(true);
      window.setTimeout(() => setShowBackOnline(false), 3200);
    };
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  if (online && !showBackOnline) return null;

  if (!online) {
    return (
      <div
        className="fixed left-0 right-0 top-0 z-[60] flex items-center justify-center gap-2 border-b border-amber-500/35 bg-amber-950/95 px-3 py-2 text-xs text-amber-100"
        role="status"
        aria-live="polite"
        style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
      >
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
        <span>You’re offline — live features pause until connection returns.</span>
        <button type="button" className="ml-1 font-semibold text-ccweb-cyan underline" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed left-0 right-0 top-0 z-[60] flex items-center justify-center gap-2 border-b border-emerald-500/30 bg-emerald-950/90 px-3 py-2 text-xs text-emerald-100"
      role="status"
      aria-live="polite"
      style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
    >
      <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
      Back online
    </div>
  );
}
