import { useEffect, useRef } from "react";
import { isCapacitorNative } from "../lib/capacitorPlatform";
import { refreshNativePushRegistration } from "../lib/nativePush";
import { getSharedRealtimeSocket } from "../lib/realtimeSocket";
import { useNotificationsStore } from "../store/notificationsStore";

const RESUME_DEBOUNCE_MS = 650;

/**
 * Debounced native resume: socket reconnect, notification refresh, push token sync.
 * Prevents duplicate reconnect storms on rapid foreground toggles.
 */
export function useAppResumeSync(enabled = true) {
  const timerRef = useRef(null);
  const runningRef = useRef(false);

  useEffect(() => {
    if (!enabled) return undefined;

    const run = async () => {
      if (runningRef.current) return;
      runningRef.current = true;
      try {
        const socket = getSharedRealtimeSocket();
        if (socket && !socket.connected) socket.connect();
        useNotificationsStore.getState().scheduleRefresh();
        if (isCapacitorNative()) {
          await refreshNativePushRegistration();
        }
        document.dispatchEvent(new CustomEvent("ccweb:soft-resume"));
      } finally {
        runningRef.current = false;
      }
    };

    const schedule = () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        void run();
      }, RESUME_DEBOUNCE_MS);
    };

    document.addEventListener("ccweb:app-resume", schedule);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") schedule();
    });
    window.addEventListener("online", schedule);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      document.removeEventListener("ccweb:app-resume", schedule);
      window.removeEventListener("online", schedule);
    };
  }, [enabled]);
}
