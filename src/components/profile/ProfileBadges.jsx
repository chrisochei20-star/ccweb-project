import { BadgeCheck, Sparkles } from "lucide-react";
import { cn } from "../../lib/cn";

export function VerificationBadge({ className = "" }) {
  return (
    <span className={cn("inline-flex items-center text-ccweb-cyan", className)} title="Verified">
      <BadgeCheck className="h-[1.1em] w-[1.1em]" strokeWidth={2.2} aria-hidden />
      <span className="sr-only">Verified</span>
    </span>
  );
}

export function CreatorBadge({ tier, badge, className = "" }) {
  if (!badge && (!tier || tier === "free")) return null;
  const label = badge === "creator" ? "Creator" : tier && tier !== "free" ? tier : "Creator";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-ccweb-violet/40 bg-ccweb-violet/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-100",
        className
      )}
    >
      <Sparkles className="h-3 w-3 text-ccweb-violet" aria-hidden />
      {label}
    </span>
  );
}
