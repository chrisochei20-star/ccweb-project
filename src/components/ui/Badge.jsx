const variants = {
  default: "bg-slate-700/60 text-slate-300 border-slate-600/40",
  cyan: "bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20",
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  green: "bg-brand-green/10 text-brand-green border-brand-green/20",
  amber: "bg-brand-amber/10 text-brand-amber border-brand-amber/20",
  red: "bg-brand-red/10 text-brand-red border-brand-red/20",
  live: "bg-brand-green/15 text-brand-green border-brand-green/25",
  success: "bg-brand-green/10 text-brand-green border-brand-green/20",
};

export default function Badge({ variant = "default", children, dot = false, className = "" }) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full
        text-xs font-medium border
        ${variants[variant]}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${variant === "live" || variant === "green" || variant === "success" ? "bg-brand-green animate-pulse" : "bg-current"}`} />
      )}
      {children}
    </span>
  );
}
