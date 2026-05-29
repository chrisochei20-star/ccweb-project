import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { CcwebBrandMark } from "../brand/CcwebBrandMark";
import { CCWEB_UI_LOAD_TIMEOUT_MS } from "../../constants/loadTimeout";

/** Shown while MobileLayout runs initial fetchMe / session restore — avoids false “Sign in” prompts. */
export function AuthSessionChecking({
  message = "Checking session…",
  className = "",
  timeoutMs = CCWEB_UI_LOAD_TIMEOUT_MS,
}) {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (timeoutMs == null || timeoutMs <= 0) return undefined;
    const id = window.setTimeout(() => setTimedOut(true), timeoutMs);
    return () => window.clearTimeout(id);
  }, [timeoutMs]);

  if (timedOut) {
    return (
      <div
        className={`flex min-h-[38vh] flex-col items-center justify-center gap-3 px-4 text-ccweb-muted ${className}`.trim()}
        role="alert"
      >
        <p className="text-center text-sm text-rose-200/90">
          This is taking longer than expected. Try refreshing the page or signing in again.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`flex min-h-[38vh] flex-col items-center justify-center gap-3 px-4 text-ccweb-muted ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      <CcwebBrandMark size={44} className="mb-1" showGlow />
      <Loader2 className="h-7 w-7 shrink-0 animate-spin" aria-hidden />
      <p className="text-center text-sm">{message}</p>
    </div>
  );
}
