import { Loader2 } from "lucide-react";
import { cn } from "../../lib/cn";

/**
 * Pull-to-refresh wrapper for mobile feeds/lists.
 */
export function PullToRefreshContainer({ children, pulling, refreshing, className }) {
  return (
    <div className={cn("relative", className)}>
      <div className={cn("ccweb-pull-indicator", (pulling || refreshing) && "active")} aria-hidden>
        {refreshing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <span>{pulling ? "Release to refresh" : "Pull to refresh"}</span>
        )}
      </div>
      {children}
    </div>
  );
}
