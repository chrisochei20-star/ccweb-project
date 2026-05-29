import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_THRESHOLD = 72;

function scrollTopFor(el, useDocumentScroll) {
  if (useDocumentScroll) {
    return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
  }
  return el?.scrollTop ?? 0;
}

/**
 * Touch pull-to-refresh for native mobile lists/feeds.
 * Pass `useDocumentScroll: true` when the page scrolls on window/body instead of a nested list.
 */
export function usePullToRefresh(
  onRefresh,
  { disabled = false, threshold = DEFAULT_THRESHOLD, useDocumentScroll = false } = {}
) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pullPx = useRef(0);
  const containerRef = useRef(null);

  const runRefresh = useCallback(async () => {
    if (refreshing || disabled || typeof onRefresh !== "function") return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
      setPulling(false);
      pullPx.current = 0;
    }
  }, [disabled, onRefresh, refreshing]);

  useEffect(() => {
    const el = useDocumentScroll ? document.documentElement : containerRef.current;
    if (!el || disabled) return undefined;

    const onTouchStart = (e) => {
      if (scrollTopFor(el, useDocumentScroll) > 0 || refreshing) return;
      startY.current = e.touches[0]?.clientY ?? 0;
      pullPx.current = 0;
    };

    const onTouchMove = (e) => {
      if (scrollTopFor(el, useDocumentScroll) > 0 || refreshing) return;
      const y = e.touches[0]?.clientY ?? 0;
      const delta = Math.max(0, y - startY.current);
      if (delta <= 0) return;
      pullPx.current = Math.min(delta, threshold * 1.4);
      setPulling(pullPx.current > threshold * 0.35);
      if (pullPx.current > 8 && delta > 12) e.preventDefault();
    };

    const onTouchEnd = () => {
      if (pullPx.current >= threshold) void runRefresh();
      pullPx.current = 0;
      setPulling(false);
    };

    const target = useDocumentScroll ? document : el;
    target.addEventListener("touchstart", onTouchStart, { passive: true });
    target.addEventListener("touchmove", onTouchMove, { passive: false });
    target.addEventListener("touchend", onTouchEnd);
    return () => {
      target.removeEventListener("touchstart", onTouchStart);
      target.removeEventListener("touchmove", onTouchMove);
      target.removeEventListener("touchend", onTouchEnd);
    };
  }, [disabled, refreshing, runRefresh, threshold, useDocumentScroll]);

  return { containerRef, pulling, refreshing, refresh: runRefresh };
}
