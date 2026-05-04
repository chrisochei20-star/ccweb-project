import { NavLink } from "react-router-dom";
import { Home, Radio, MessagesSquare, UserRound } from "lucide-react";

const items = [
  { to: "/", label: "Home", end: true, Icon: Home, match: (p) => p === "/" },
  {
    to: "/learn",
    label: "Sessions",
    Icon: Radio,
    match: (p) =>
      p === "/learn" ||
      p === "/ai-streaming" ||
      p.startsWith("/courses") ||
      p.startsWith("/ai-tutor"),
  },
  { to: "/community", label: "Community", Icon: MessagesSquare, match: (p) => p.startsWith("/community") },
  {
    to: "/profile",
    label: "Profile",
    Icon: UserRound,
    match: (p) => p === "/profile" || p === "/dashboard",
  },
];

export function AppBottomNav({ pathname }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.1] bg-ccweb-navy-950/88 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl backdrop-saturate-150 shadow-[0_-12px_40px_rgba(0,0,0,0.35)]"
      aria-label="Primary"
    >
      <div className="mx-auto flex w-full max-w-[min(70rem,92vw)] justify-around px-1">
        {items.map(({ to, label, Icon, match, end }) => {
          const active = match(pathname);
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-[16px] py-1.5 no-underline transition ${
                active
                  ? "text-ccweb-sky-200"
                  : "text-ccweb-muted hover:text-ccweb-text"
              }`}
            >
              <span
                className={`flex h-10 w-14 items-center justify-center rounded-[14px] border transition ${
                  active
                    ? "border-ccweb-cyan-400/35 bg-gradient-to-br from-ccweb-cyan-400/20 to-ccweb-indigo-500/15 shadow-[0_0_20px_rgba(56,189,248,0.15)]"
                    : "border-transparent bg-transparent"
                }`}
              >
                <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.25 : 2} />
              </span>
              <span className="max-w-full truncate px-0.5 text-[10px] font-semibold uppercase tracking-wide sm:text-[11px]">
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
