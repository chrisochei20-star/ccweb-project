import { NavLink } from "react-router-dom";
import { BookOpen, Compass, Hammer, Coins, MessagesSquare, UserRound } from "lucide-react";

const items = [
  {
    to: "/learn",
    label: "Learn",
    Icon: BookOpen,
    match: (p) =>
      p === "/learn" ||
      p === "/ai-streaming" ||
      p.startsWith("/courses") ||
      p.startsWith("/ai-tutor"),
  },
  {
    to: "/find",
    label: "Find",
    Icon: Compass,
    match: (p) =>
      p === "/find" || p.startsWith("/crypto") || p.startsWith("/early-signals") || p.startsWith("/token/"),
  },
  {
    to: "/build",
    label: "Build",
    Icon: Hammer,
    match: (p) =>
      p === "/build" ||
      p.startsWith("/dapp") ||
      p.startsWith("/developers") ||
      p.startsWith("/ai-agents") ||
      p.startsWith("/growth-hub"),
  },
  { to: "/earn", label: "Earn", Icon: Coins, match: (p) => p === "/earn" || p.startsWith("/pricing") },
  { to: "/community", label: "Community", Icon: MessagesSquare, match: (p) => p.startsWith("/community") },
  { to: "/profile", label: "Profile", Icon: UserRound, match: (p) => p === "/profile" || p.startsWith("/setup-2fa") },
];

export function AppBottomNav({ pathname }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.1] bg-ccweb-navy-950/88 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl backdrop-saturate-150 shadow-[0_-12px_40px_rgba(0,0,0,0.35)] lg:hidden"
      aria-label="Primary"
    >
      <div className="mx-auto flex w-full max-w-[min(70rem,92vw)] justify-between px-0.5">
        {items.map(({ to, label, Icon, match }) => {
          const active = match(pathname);
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-[14px] py-1 no-underline transition ${
                active ? "text-ccweb-sky-200" : "text-ccweb-muted hover:text-ccweb-text"
              }`}
            >
              <span
                className={`flex h-9 w-10 items-center justify-center rounded-[12px] border transition ${
                  active
                    ? "border-ccweb-cyan-400/35 bg-gradient-to-br from-ccweb-cyan-400/20 to-ccweb-indigo-500/15"
                    : "border-transparent"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.25 : 2} />
              </span>
              <span className="max-w-[100%] truncate px-0.5 text-[8px] font-semibold uppercase tracking-tight sm:text-[9px]">
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
