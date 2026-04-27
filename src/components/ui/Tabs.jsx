import { useState } from "react";

export function Tabs({ tabs, defaultTab, onChange, className = "" }) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.id);

  function handleChange(id) {
    setActive(id);
    onChange?.(id);
  }

  return (
    <div className={`flex items-center gap-1 p-1 bg-surface-900 rounded-xl border border-white/[0.06] ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => handleChange(tab.id)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150
            ${active === tab.id
              ? "bg-surface-700 text-slate-100 shadow-sm"
              : "text-slate-500 hover:text-slate-300"
            }`}
        >
          {tab.icon && <span>{tab.icon}</span>}
          {tab.label}
          {tab.badge !== undefined && (
            <span className={`px-1.5 py-0.5 rounded-md text-xs font-mono ${active === tab.id ? "bg-brand-cyan/20 text-brand-cyan" : "bg-surface-600 text-slate-400"}`}>
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function TabPanel({ activeId, id, children }) {
  if (activeId !== id) return null;
  return <div className="animate-fade-in">{children}</div>;
}
