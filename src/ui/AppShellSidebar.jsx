import { NavLink, useLocation } from "react-router-dom";
import {
  BookOpen,
  Compass,
  Hammer,
  Coins,
  MessagesSquare,
  UserRound,
  LayoutDashboard,
  Store,
} from "lucide-react";

const links = [
  { to: "/dashboard", label: "Home", Icon: LayoutDashboard, match: (p) => p === "/" || p === "/dashboard" },
  { to: "/learn", label: "Learn", Icon: BookOpen, match: (p) => p === "/learn" || p.startsWith("/courses") || p.startsWith("/ai-tutor") || p.startsWith("/ai-streaming") },
  { to: "/find", label: "Find", Icon: Compass, match: (p) => p === "/find" || p.startsWith("/crypto") || p.startsWith("/early-signals") || p.startsWith("/token/") },
  { to: "/build", label: "Build", Icon: Hammer, match: (p) => p === "/build" || p.startsWith("/dapp") || p.startsWith("/developers") || p.startsWith("/ai-agents") || p.startsWith("/growth-hub") },
  { to: "/earn", label: "Earn", Icon: Coins, match: (p) => p === "/earn" || p.startsWith("/pricing") },
  { to: "/community", label: "Community", Icon: MessagesSquare, match: (p) => p.startsWith("/community") },
  { to: "/marketplace", label: "Marketplace", Icon: Store, match: (p) => p.startsWith("/marketplace") },
  { to: "/profile", label: "Profile", Icon: UserRound, match: (p) => p === "/profile" || p.startsWith("/setup-2fa") },
];

export function AppShellSidebar() {
  const { pathname } = useLocation();
  return (
    <aside className="hidden w-[220px] shrink-0 flex-col gap-0.5 border-r border-white/[0.08] py-2 pr-3 lg:flex">
      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-ccweb-muted">Navigate</p>
      {links.map(({ to, label, Icon, match }) => {
        const active = match(pathname);
        return (
          <NavLink
            key={to}
            to={to}
            className={`flex items-center gap-2.5 rounded-[14px] px-3 py-2.5 text-sm font-medium no-underline transition ${
              active
                ? "bg-gradient-to-r from-ccweb-cyan-400/18 to-ccweb-indigo-500/12 text-ccweb-sky-100 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.28)]"
                : "text-ccweb-muted hover:bg-white/[0.05] hover:text-ccweb-text"
            }`}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={active ? 2.25 : 2} />
            {label}
          </NavLink>
        );
      })}
    </aside>
  );
}
