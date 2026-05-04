export function GhostInput({ className = "", ...props }) {
  return (
    <input
      className={`min-h-[44px] w-full rounded-[14px] border border-white/[0.14] bg-white/[0.04] px-4 text-sm text-ccweb-text placeholder:text-ccweb-muted/70 outline-none ring-ccweb-cyan-400/30 transition focus:border-ccweb-sky-400/40 focus:ring-2 ${className}`}
      {...props}
    />
  );
}
