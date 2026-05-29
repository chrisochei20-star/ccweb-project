import { BotOff, RefreshCw } from "lucide-react";

/**
 * Graceful degradation when OpenAI/API is unavailable (503, missing key, outage).
 */
export function AiUnavailablePanel({ message, onRetry, retryLabel = "Retry", className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-4 text-sm text-amber-50 ${className}`}
      role="status"
    >
      <div className="flex items-start gap-3">
        <BotOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-amber-100">AI unavailable</p>
          <p className="mt-1 text-amber-50/90">{message}</p>
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
