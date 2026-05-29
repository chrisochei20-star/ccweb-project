import { Loader2 } from "lucide-react";
import { Skeleton } from "../ui/Skeleton";

/**
 * Standard loading skeleton for AI panels (tutor, lesson assistant).
 */
export function AiLoadingState({ label = "AI is thinking…", compact = false }) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm text-ccweb-muted" role="status">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
        <span>{label}</span>
      </div>
    );
  }
  return (
    <div className="space-y-3 px-1 py-2" role="status" aria-live="polite">
      <div className="flex items-center gap-2 text-sm text-ccweb-muted">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
        <span>{label}</span>
      </div>
      <Skeleton className="h-16 w-[85%] rounded-2xl" />
      <Skeleton className="ml-auto h-12 w-[70%] rounded-2xl" />
    </div>
  );
}
