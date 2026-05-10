import { cn } from "../../lib/cn";

/** Premium loading skeleton — shimmer from ccweb-shell.css */
export function Skeleton({ className = "", rounded = "rounded-xl" }) {
  return <div className={cn("ccweb-skeleton block", rounded, className)} aria-hidden />;
}

export function SkeletonText({ lines = 3, className = "" }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-3", i === lines - 1 ? "max-w-[70%]" : "w-full")}
          rounded="rounded-md"
        />
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="ccweb-stagger mx-auto max-w-3xl space-y-5 px-3 pb-6 pt-3 md:max-w-5xl">
      <div className="ccweb-glass ccweb-card-premium rounded-3xl p-6 md:p-8">
        <Skeleton className="mb-4 h-1 max-w-40 rounded-full" />
        <Skeleton className="h-4 w-24 rounded-md" />
        <Skeleton className="mt-3 h-9 max-w-md rounded-lg" />
        <SkeletonText lines={2} className="mt-4 max-w-lg" />
        <div className="mt-6 flex gap-2">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>
      <div className="ccweb-glass ccweb-card-premium rounded-3xl p-6">
        <div className="mb-4 flex justify-between">
          <Skeleton className="h-6 w-40 rounded-lg" />
          <Skeleton className="h-4 w-16 rounded-md" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="ccweb-glass-subtle rounded-2xl p-4">
              <Skeleton className="mx-auto h-8 w-8 rounded-lg" />
              <Skeleton className="mx-auto mt-3 h-3 w-16 rounded-md" />
              <Skeleton className="mx-auto mt-2 h-5 w-12 rounded-md" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="ccweb-glass ccweb-card-premium flex items-center justify-between gap-3 rounded-2xl p-5"
          >
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-36 rounded-md" />
              <Skeleton className="h-3 w-28 rounded-md" />
            </div>
            <Skeleton className="h-6 w-6 shrink-0 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
