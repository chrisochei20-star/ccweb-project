export default function ProgressBar({ value, max = 100, color = "cyan", label, showValue = false, className = "" }) {
  const pct = Math.min(100, Math.round((value / max) * 100));

  const trackColor = {
    cyan: "bg-brand-cyan",
    green: "bg-brand-green",
    amber: "bg-brand-amber",
    blue: "bg-blue-400",
    red: "bg-brand-red",
  };

  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-xs text-slate-400">{label}</span>}
          {showValue && <span className="text-xs text-slate-400 font-mono">{pct}%</span>}
        </div>
      )}
      <div className="w-full h-1.5 bg-surface-600 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${trackColor[color]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
