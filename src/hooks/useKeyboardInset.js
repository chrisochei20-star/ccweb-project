import { useEffect, useState } from "react";
import { isCapacitorNative } from "../lib/capacitorPlatform";

/**
 * Android Chrome / Capacitor keyboard inset via visualViewport + Capacitor Keyboard plugin.
 * Prevents composer/input areas from being covered by the software keyboard.
 */
export function useKeyboardInset(maxPx = 200) {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!vv || typeof vv.addEventListener !== "function") return undefined;

    const update = () => {
      const obscured = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setInset(Math.min(maxPx, Math.round(obscured)));
    };

    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    update();

    let keyboardShow;
    let keyboardHide;
    let cancelled = false;

    if (isCapacitorNative()) {
      void import("@capacitor/keyboard")
        .then(({ Keyboard }) => {
          if (cancelled) return;
          keyboardShow = Keyboard.addListener("keyboardWillShow", (info) => {
            const h = info?.keyboardHeight ?? 0;
            if (h > 0) setInset(Math.min(maxPx, Math.round(h)));
          });
          keyboardHide = Keyboard.addListener("keyboardWillHide", () => setInset(0));
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      keyboardShow?.remove?.();
      keyboardHide?.remove?.();
    };
  }, [maxPx]);

  return inset;
}

/** CSS padding-bottom for sticky composers with safe-area + keyboard inset. */
export function composerPaddingBottom(keyboardInset, baseRem = 0.75) {
  if (keyboardInset > 0) {
    return `calc(${baseRem}rem + env(safe-area-inset-bottom, 0px) + ${keyboardInset}px)`;
  }
  return `max(${baseRem}rem, env(safe-area-inset-bottom, 0px))`;
}
