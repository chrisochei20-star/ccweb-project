export default function StatCard({ label, value, sub, icon, trend, color = "cyan", className = "" }) {
  const colorMap = {
    cyan: "text-brand-cyan",
    green: "text-brand-green",
    amber: "text-brand-amber",
    blue: "text-blue-400",
    red: "text-brand-red",
  };

  const bgMap = {
    cyan: "bg-brand-cyan/[0.08]",
    green: "bg-brand-green/[0.08]",
    amber: "bg-brand-amber/[0.08]",
    blue: "bg-blue-500/[0.08]",
    red: "bg-brand-red/[0.08]",
  };

  return (
    <div className={`rounded-2xl bg-surface-800/80 border border-white/[0.06] p-5 backdrop-blur-sm ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-slate-500 tracking-wide uppercase">{label}</p>
        {icon && (
          <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${bgMap[color]} ${colorMap[color]}`}>
            {icon}
          </span>
        )}
      </div>
      <p className={`text-2xl font-bold tracking-tight ${colorMap[color]}`}>{value}</p>
      {(sub || trend !== undefined) && (
        <div className="flex items-center gap-2 mt-1.5">
          {trend !== undefined && (
            <span className={`text-xs font-medium ${trend >= 0 ? "text-brand-green" : "text-brand-red"}`}>
              {trend >= 0 ? "+" : ""}{trend}%
            </span>
          )}
          {sub && <p className="text-xs text-slate-500">{sub}</p>}
        </div>
      )}
    </div>
  );
}
