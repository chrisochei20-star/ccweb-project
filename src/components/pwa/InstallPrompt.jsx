import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { CcwebBrandMark } from "../brand/CcwebBrandMark";
import { trackProductionEvent } from "../../lib/clientAnalytics";
import { isCapacitorNative } from "../../lib/capacitorPlatform";

/**
 * Android Chrome / desktop install prompt for the CCWEB PWA.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isCapacitorNative()) {
      setDismissed(true);
      return undefined;
    }
    try {
      if (localStorage.getItem("ccweb_pwa_install_dismissed") === "1") {
        setDismissed(true);
      }
    } catch {
      /* ignore */
    }

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferred(e);
      trackProductionEvent("pwa_install_available");
    };
    const onInstalled = () => {
      setDeferred(null);
      trackProductionEvent("pwa_installed");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (dismissed || !deferred) return null;

  async function install() {
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      trackProductionEvent("pwa_install_prompt", { metadata: { outcome: choice?.outcome } });
      setDeferred(null);
    } catch {
      /* ignore */
    }
  }

  function dismiss() {
    setDismissed(true);
    setDeferred(null);
    try {
      localStorage.setItem("ccweb_pwa_install_dismissed", "1");
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-3 right-3 z-50 mx-auto max-w-md rounded-2xl border border-ccweb-cyan/30 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-md md:bottom-6"
      role="region"
      aria-label="Install app"
    >
      <div className="flex items-start gap-3">
        <CcwebBrandMark size={40} showGlow />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">Install CCWEB</p>
          <p className="mt-0.5 text-xs text-ccweb-muted">Add to your home screen for faster launch and app-like experience.</p>
          <div className="mt-3 flex gap-2">
            <button type="button" className="ccweb-gradient-btn inline-flex min-h-[44px] items-center gap-2 px-4 text-xs" onClick={install}>
              <Download className="h-4 w-4" aria-hidden />
              Install
            </button>
            <button type="button" className="ccweb-outline-btn min-h-[44px] px-3 text-xs" onClick={dismiss}>
              Not now
            </button>
          </div>
        </div>
        <button type="button" className="rounded-lg p-1 text-ccweb-muted hover:text-white" onClick={dismiss} aria-label="Dismiss install prompt">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
