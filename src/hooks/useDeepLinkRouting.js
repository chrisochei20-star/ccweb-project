import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { invalidAppUrlReason, isAuthRedirectUrl, routeFromAppUrl } from "../lib/deepLinkRouter";
import { isCapacitorNative, consumePendingDeepLink } from "../lib/capacitorPlatform";
import { releaseDiag } from "../lib/releaseLog";
import { trackProductionEvent } from "../lib/clientAnalytics";
import { toast } from "../lib/toastBus";

/**
 * Routes Capacitor App URL opens (cold start + warm) into React Router.
 */
export function useDeepLinkRouting(enabled = true) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!enabled || !isCapacitorNative()) return undefined;

    function handleUrl(url, coldStart = false) {
      const route = routeFromAppUrl(url);
      if (!route) {
        const reason = invalidAppUrlReason(url);
        releaseDiag("deep_link_rejected", { url, reason, coldStart });
        trackProductionEvent("native_deep_link_rejected", {
          metadata: { reason, coldStart },
        });
        if (reason && reason !== "empty_url") {
          toast.info("This link cannot be opened in CCWEB.");
        }
        return;
      }
      releaseDiag("deep_link", { url, route, coldStart });
      trackProductionEvent("native_deep_link", {
        metadata: { route, coldStart, auth: isAuthRedirectUrl(url) },
      });
      navigate(route, { replace: coldStart });
    }

    function onDeepLink(ev) {
      const { url, coldStart } = ev.detail || {};
      if (url) handleUrl(url, Boolean(coldStart));
    }

    document.addEventListener("ccweb:deep-link", onDeepLink);

    const pending = consumePendingDeepLink();
    if (pending) handleUrl(pending, true);

    return () => document.removeEventListener("ccweb:deep-link", onDeepLink);
  }, [enabled, navigate]);
}
