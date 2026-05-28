import { useEffect, useState } from "react";

/**
 * Android Chrome / mobile keyboard inset via visualViewport.
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

    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
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
