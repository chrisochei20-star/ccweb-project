import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Wires Capacitor App URL opens + notification taps into React Router,
 * and registers the device for FCM/APNs delivery after login.
 */
export function NativeAppBindings() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    let disposeDl = null;
    (async () => {
      const m = await import("./deepLinksAndPush");
      if (cancelled) return;
      disposeDl = await m.installNativeListeners(navigate);
      await m.registerNativePushFlow();
    })();

    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      void import("./deepLinksAndPush").then((m) => m.registerNativePushFlow());
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      if (typeof disposeDl === "function") {
        try {
          disposeDl();
        } catch {
          /* ignore */
        }
      }
    };
  }, [navigate]);

  return null;
}
