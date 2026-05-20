import { Loader2 } from "lucide-react";

/** Shown while MobileLayout runs initial fetchMe / session restore — avoids false “Sign in” prompts. */
export function AuthSessionChecking({ message = "Checking session…", className = "" }) {
  return (
    <div
      className={`flex min-h-[38vh] flex-col items-center justify-center gap-3 px-4 text-ccweb-muted ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-7 w-7 shrink-0 animate-spin" aria-hidden />
      <p className="text-center text-sm">{message}</p>
    </div>
  );
}
