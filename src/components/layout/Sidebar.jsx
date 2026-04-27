import { NavLink, Link } from "react-router-dom";
import { LayoutDashboard, Radio, BookOpen, ChartBar as BarChart3, Wallet, Users, Settings, Zap, ChevronLeft, ChevronRight, Bell } from "lucide-react";
import Badge from "../ui/Badge";

const navSections = [
  {
    label: "Main",
    items: [
      { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/streaming", icon: Radio, label: "AI Streaming", badge: "Live" },
      { to: "/courses", icon: BookOpen, label: "Courses" },
    ],
  },
  {
    label: "Finance",
    items: [
      { to: "/revenue", icon: BarChart3, label: "Revenue" },
      { to: "/tokens", icon: Wallet, label: "Tokens" },
    ],
  },
  {
    label: "Platform",
    items: [
      { to: "/community", icon: Users, label: "Community" },
      { to: "/settings", icon: Settings, label: "Settings" },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside
      className={`
        fixed left-0 top-0 h-full z-30
        flex flex-col bg-surface-900/95 backdrop-blur-xl
        border-r border-white/[0.06]
        transition-all duration-300 ease-in-out
        ${collapsed ? "w-16" : "w-60"}
      `}
    >
      {/* Logo */}
      <div className={`flex items-center h-16 px-4 border-b border-white/[0.06] shrink-0 ${collapsed ? "justify-center" : "gap-3"}`}>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-cyan to-blue-500 flex items-center justify-center shrink-0 shadow-glow-sm">
          <Zap size={16} className="text-surface-950" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <span className="block text-sm font-bold text-slate-100 whitespace-nowrap leading-tight">CCWEB</span>
            <span className="block text-[10px] text-slate-500 whitespace-nowrap">AI Academy</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {navSections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="px-3 mb-1 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
                {section.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150
                      ${isActive
                        ? "bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/15"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                      }`
                    }
                  >
                    <item.icon size={17} className="shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 whitespace-nowrap">{item.label}</span>
                        {item.badge && <Badge variant="green" dot>{item.badge}</Badge>}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-2 border-t border-white/[0.06] space-y-0.5 shrink-0">
        <Link
          to="/notifications"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-all"
        >
          <Bell size={17} />
          {!collapsed && <span>Notifications</span>}
        </Link>
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 mt-1">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-cyan/40 to-blue-500/40 border border-brand-cyan/30 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">Demo User</p>
              <p className="text-[10px] text-slate-500 truncate">Pro Plan</p>
            </div>
          </div>
        )}
      </div>

      {/* Collapse button */}
      <button
        type="button"
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-surface-700 border border-white/[0.10] flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors shadow-sm"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
