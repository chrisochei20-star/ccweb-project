import { Bell, Search, Sun, Moon, ChevronDown } from "lucide-react";
import Button from "../ui/Button";

export default function TopBar({ darkMode, onToggleDark, title, subtitle }) {
  return (
    <header className="h-16 flex items-center gap-4 px-6 border-b border-white/[0.06] bg-surface-950/80 backdrop-blur-xl sticky top-0 z-20">
      {/* Title */}
      <div className="flex-1 min-w-0">
        {title && <h1 className="text-sm font-semibold text-slate-100 truncate">{title}</h1>}
        {subtitle && <p className="text-xs text-slate-500 truncate">{subtitle}</p>}
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 bg-surface-800 border border-white/[0.06] rounded-xl px-3 py-2 w-48 lg:w-64">
        <Search size={14} className="text-slate-500 shrink-0" />
        <input
          type="text"
          placeholder="Search..."
          className="flex-1 text-sm bg-transparent text-slate-300 placeholder-slate-600 outline-none min-w-0"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="xs"
          className="relative"
          onClick={onToggleDark}
          aria-label="Toggle theme"
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </Button>

        <Button variant="ghost" size="xs" className="relative">
          <Bell size={16} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-brand-cyan" />
        </Button>

        <div className="flex items-center gap-2 pl-2 border-l border-white/[0.06] ml-1">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-cyan/50 to-blue-500/50 border border-brand-cyan/30" />
          <span className="hidden lg:block text-xs text-slate-400">Demo User</span>
          <ChevronDown size={12} className="text-slate-500 hidden lg:block" />
        </div>
      </div>
    </header>
  );
}
