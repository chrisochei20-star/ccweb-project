import { useEffect, useRef } from "react";
import { onConnectionStateChange, onSocketReconnect, subscribeRealtime } from "../lib/realtimeSocket";

/**
 * Subscribe to a realtime socket event with automatic cleanup (no duplicate listeners on remount).
 */
export function useRealtimeSubscription(event, handler, enabled = true, subscriberId) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return undefined;
    const id = subscriberId || `hook_${event}`;
    return subscribeRealtime(
      event,
      (payload) => {
        handlerRef.current?.(payload);
      },
      id
    );
  }, [event, enabled, subscriberId]);
}

export function useSocketReconnect(handler, enabled = true) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return undefined;
    return onSocketReconnect(() => handlerRef.current?.());
  }, [enabled]);
}

export function useConnectionState(onChange) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    return onConnectionStateChange((state) => onChangeRef.current?.(state));
  }, []);
}
