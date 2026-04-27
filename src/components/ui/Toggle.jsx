export default function Toggle({ checked, onChange, label, size = "md" }) {
  const sizes = {
    sm: { track: "w-8 h-4", thumb: "w-3 h-3", translate: "translate-x-4" },
    md: { track: "w-10 h-5", thumb: "w-4 h-4", translate: "translate-x-5" },
  };
  const s = sizes[size];

  return (
    <label className="inline-flex items-center gap-2.5 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex items-center rounded-full transition-colors duration-200
          ${s.track}
          ${checked ? "bg-brand-cyan" : "bg-surface-500"}
        `}
      >
        <span
          className={`
            absolute left-0.5 top-0.5 rounded-full bg-white shadow transition-transform duration-200
            ${s.thumb}
            ${checked ? s.translate : "translate-x-0"}
          `}
        />
      </button>
      {label && <span className="text-sm text-slate-300">{label}</span>}
    </label>
  );
}
