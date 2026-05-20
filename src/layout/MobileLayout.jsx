import { BookOpen, Briefcase, Hammer, Loader2, MessageCircle, MessageSquare, Search, User } from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ThemeToggle } from "../components/shell/ThemeToggle";
import { NotificationBell } from "../components/notifications/NotificationCenter";
import { fetchMe, getSessionToken, getStoredUser, logoutApi } from "../session";
import { captureInviteFromSearch, postBetaClientEvent } from "../lib/betaTelemetry";

const tabs = [
  { to: "/learn", label: "Learn", icon: BookOpen },
  { to: "/find", label: "Find", icon: Search },
  { to: "/build", label: "Build", icon: Hammer },
  { to: "/earn", label: "Earn", icon: Briefcase },
  { to: "/community", label: "Community", icon: MessageCircle },
  { to: "/messages", label: "Chats", icon: MessageSquare },
  { to: "/profile", label: "Profile", icon: User },
];

export function MobileLayout() {
  const [user, setUser] = useState(() => getStoredUser());
  const [authHydrated, setAuthHydrated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    captureInviteFromSearch(location.search || "");
    postBetaClientEvent({
      eventType: "route_view",
      path: location.pathname + location.search,
      metadata: { route: location.pathname },
    });
  }, [location.pathname, location.search]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const u = await fetchMe();
        if (!cancelled) setUser(u);
      } finally {
        if (!cancelled) setAuthHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** If /me transiently fails, keep React user in sync with sessionStorage (token + cached user). */
  useEffect(() => {
    if (user) return;
    if (getSessionToken() && getStoredUser()) setUser(getStoredUser());
  }, [user]);

  async function handleLogout() {
    await logoutApi();
    setUser(null);
    navigate("/login");
  }

  return (
    <div className="ccweb-app-root ccweb-app-pattern min-h-screen font-sans antialiased">
      <header className="ccweb-top-bar">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3.5 md:max-w-5xl">
          <NavLink to="/" className="group flex items-center gap-3 font-semibold tracking-tight text-white">
            <span className="ccweb-brand-mark text-lg transition-transform duration-300 group-hover:scale-105">⚡</span>
            <span className="bg-gradient-to-r from-ccweb-cyan via-ccweb-violet to-ccweb-green bg-clip-text text-lg text-transparent">
              CCWEB
            </span>
          </NavLink>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell user={user} authHydrated={authHydrated} />
            {user ? (
              <>
                <span className="hidden max-w-[140px] truncate text-xs text-ccweb-muted sm:inline">{user.displayName}</span>
                <button type="button" className="ccweb-outline-btn px-3 py-1.5 text-xs" onClick={handleLogout} data-ccweb-e2e="logout">
                  Log out
                </button>
              </>
            ) : !authHydrated ? (
              <span className="flex items-center gap-1.5 text-xs text-ccweb-muted" title="Checking session">
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
                <span className="hidden sm:inline">Session…</span>
              </span>
            ) : (
              <>
                <NavLink to="/login" className="text-xs font-medium text-ccweb-muted hover:text-white">
                  Sign in
                </NavLink>
                <NavLink to="/signup" className="ccweb-gradient-btn px-3 py-1.5 text-xs">
                  Join
                </NavLink>
              </>
            )}
          </div>
        </div>
      </header>

      <nav
        className="hidden border-b border-white/5 bg-slate-950/40 backdrop-blur-md lg:block"
        aria-label="Primary sections"
      >
        <div className="mx-auto max-w-3xl px-4 py-3 md:max-w-5xl">
          <div className="ccweb-desktop-nav-inner flex flex-wrap items-center justify-center gap-0.5">
            <NavLink
              end
              to="/"
              className={({ isActive }) =>
                `px-4 py-2.5 text-sm font-semibold transition-all ${isActive ? "bg-white/12 text-white shadow-[0_0_24px_rgba(34,211,238,0.12)]" : "text-ccweb-muted hover:bg-white/6 hover:text-white"}`
              }
            >
              Home
            </NavLink>
            {tabs.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to + label}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all ${isActive ? "bg-white/12 text-white shadow-[0_0_24px_rgba(34,211,238,0.1)]" : "text-ccweb-muted hover:bg-white/6 hover:text-white"}`
                }
              >
                <Icon className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      <main className="ccweb-main-pad mx-auto max-w-3xl md:max-w-5xl">
        <Outlet context={{ user, setUser, authHydrated }} />
      </main>

      <div className="ccweb-floating-shell lg:hidden" aria-hidden={false}>
        <nav className="ccweb-floating-dock" aria-label="Primary">
          <div className="ccweb-floating-dock-inner">
            {tabs.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to + label}
                to={to}
                className={({ isActive }) => `ccweb-nav-item${isActive ? " active" : ""}`}
              >
                <Icon className="h-[1.15rem] w-[1.15rem]" strokeWidth={2} aria-hidden />
                <span className="max-w-[4.5rem] truncate">{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
