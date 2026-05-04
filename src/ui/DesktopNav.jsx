import { NavLink, useLocation } from "react-router-dom";

const links = [
  { to: "/learn", label: "Learn" },
  { to: "/find", label: "Find" },
  { to: "/build", label: "Build" },
  { to: "/earn", label: "Earn" },
  { to: "/about", label: "About" },
];

export function DesktopNav() {
  const { pathname } = useLocation();
  return (
    <nav className="hidden min-w-[200px] flex-col gap-1 border-r border-white/[0.08] py-4 pr-4 md:flex">
      {links.map(({ to, label }) => {
        const active =
          to === "/learn"
            ? pathname === "/learn" ||
              pathname.startsWith("/courses") ||
              pathname.startsWith("/ai-tutor") ||
              pathname.startsWith("/ai-streaming")
            : to === "/find"
              ? pathname === "/find" ||
                pathname.startsWith("/crypto") ||
                pathname.startsWith("/early-signals") ||
                pathname.startsWith("/token/")
              : to === "/build"
                ? pathname === "/build" ||
                  pathname.startsWith("/dapp") ||
                  pathname.startsWith("/developers") ||
                  pathname.startsWith("/ai-agents") ||
                  pathname.startsWith("/growth-hub")
                : to === "/earn"
                  ? pathname === "/earn" || pathname.startsWith("/pricing")
                  : pathname.startsWith("/about") || pathname.startsWith("/faq") || pathname.startsWith("/blog");
        return (
          <NavLink
            key={to}
            to={to}
            className={`rounded-[14px] px-3 py-2.5 text-sm font-medium no-underline transition ${
              active
                ? "bg-gradient-to-r from-ccweb-cyan-400/15 to-ccweb-indigo-500/10 text-ccweb-sky-100 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.25)]"
                : "text-ccweb-muted hover:bg-white/[0.05] hover:text-ccweb-text"
            }`}
          >
            {label}
          </NavLink>
        );
      })}
    </nav>
  );
}
