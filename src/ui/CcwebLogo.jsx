/**
 * CCWEB wordmark + symbol inspired by a curved “C” ribbon and electric accent.
 * Swap `src="/your-logo.svg"` in AppHeader if you add the official asset to /public.
 */
export function CcwebLogoMark({ className = "h-9 w-9", title = "CCWEB" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={title}
      role="img"
    >
      <defs>
        <linearGradient id="ccweb-logo-a" x1="4" y1="6" x2="36" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7dd3fc" />
          <stop offset="0.45" stopColor="#38bdf8" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="ccweb-logo-b" x1="10" y1="10" x2="32" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22d3ee" />
          <stop offset="1" stopColor="#818cf8" />
        </linearGradient>
      </defs>
      <path
        d="M20 4C11.16 4 4 11.16 4 20s7.16 16 16 16c4.42 0 8.42-1.79 11.32-4.68l-2.83-2.83A12.96 12.96 0 1 1 20 7.04c3.59 0 6.84 1.45 9.2 3.8l2.52-2.52C28.42 5.43 24.42 4 20 4Z"
        fill="url(#ccweb-logo-a)"
        opacity="0.95"
      />
      <path
        d="M22 12c-5.52 0-10 4.03-10 9 0 3.1 1.62 5.84 4.1 7.45l2.2-3.02A5.7 5.7 0 0 1 16 21c0-2.76 2.46-5 5.5-5 1.48 0 2.83.55 3.85 1.45l2.35-2.35C25.9 13.38 24.08 12 22 12Z"
        fill="url(#ccweb-logo-b)"
      />
      <circle cx="31" cy="11" r="2.2" fill="#e0f2fe" opacity="0.95" />
    </svg>
  );
}

export function CcwebLogoWord({ className = "" }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <CcwebLogoMark className="h-9 w-9 shrink-0" />
      <span className="flex flex-col leading-tight">
        <span className="bg-gradient-to-r from-sky-200 via-cyan-200 to-indigo-200 bg-clip-text text-base font-bold tracking-wide text-transparent sm:text-lg">
          CCWEB
        </span>
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-ccweb-muted/90 sm:text-[11px]">
          Learn · Build · Earn
        </span>
      </span>
    </span>
  );
}
