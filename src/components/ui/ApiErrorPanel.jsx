import { RefreshCw, WifiOff } from "lucide-react";

/**
 * Consistent recoverable error panel for production API/AI surfaces.
 */
export function ApiErrorPanel({ message, onRetry, retryLabel = "Retry", offline = false, className = "" }) {
  if (!message) return null;
  return (
    <div
      className={`rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-4 text-sm text-rose-100 ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {offline ? <WifiOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> : null}
        <div className="min-w-0 flex-1">
          <p>{message}</p>
          {onRetry ? (
            <button
              type="button"
              className="ccweb-outline-btn mt-3 inline-flex min-h-[44px] items-center gap-2 px-4 text-xs"
              onClick={onRetry}
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              {retryLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
