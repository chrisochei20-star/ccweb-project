import { cn } from "../../lib/cn";

/** Circular upload progress ring (0–100). Indeterminate when progress === -1. */
export function UploadProgressRing({ progress = 0, size = 44, className = "" }) {
  const indeterminate = progress === -1;
  const pct = indeterminate ? 35 : Math.min(100, Math.max(0, progress));
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("shrink-0 -rotate-90", indeterminate && "animate-spin", className)}
      aria-hidden
    >
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="url(#ccweb-upload-ring)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`}
      />
      <defs>
        <linearGradient id="ccweb-upload-ring" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
    </svg>
  );
}
