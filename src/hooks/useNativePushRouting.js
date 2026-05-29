import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "../lib/toastBus";
import { isCapacitorNative } from "../lib/capacitorPlatform";
import {
  bodyFromPushPayload,
  routeForPushPayload,
  titleFromPushPayload,
} from "../lib/pushNotificationRouter";
import { useNotificationsStore } from "../store/notificationsStore";

/**
 * Foreground toast + tap navigation for Capacitor FCM notifications.
 */
export function useNativePushRouting(enabled = true) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!enabled || !isCapacitorNative()) return undefined;

    function handlePush(ev) {
      const { phase, notification, action } = ev.detail || {};
      const payload = action?.notification || notification || action;

      if (phase === "foreground") {
        useNotificationsStore.getState().notifySocketTick();
        const title = titleFromPushPayload(payload);
        const body = bodyFromPushPayload(payload);
        toast.info(body ? `${title}: ${body}` : title);
        return;
      }

      if (phase === "action") {
        const route = routeForPushPayload(payload);
        useNotificationsStore.getState().notifySocketTick();
        if (route) navigate(route);
      }
    }

    document.addEventListener("ccweb:native-push", handlePush);
    return () => document.removeEventListener("ccweb:native-push", handlePush);
  }, [enabled, navigate]);
}
