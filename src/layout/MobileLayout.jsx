import { BookOpen, Briefcase, Hammer, MessageCircle, Search, User } from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchMe, getStoredUser, logoutApi } from "../session";
import { captureInviteFromSearch, postBetaClientEvent } from "../lib/betaTelemetry";

const tabs = [
  { to: "/learn", label: "Learn", icon: BookOpen },
  { to: "/find", label: "Find", icon: Search },
  { to: "/build", label: "Build", icon: Hammer },
  { to: "/earn", label: "Earn", icon: Briefcase },
  { to: "/community", label: "Community", icon: MessageCircle },
  { to: "/profile", label: "Profile", icon: User },
];

export function MobileLayout() {
  const [user, setUser] = useState(() => getStoredUser());
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
      const u = await fetchMe();
      if (!cancelled) setUser(u);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    await logoutApi();
    setUser(null);
    navigate("/login");
  }

  return (
    <div className="ccweb-app-root ccweb-app-pattern min-h-screen">
      <header className="ccweb-top-bar">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 md:max-w-5xl">
          <NavLink to="/" className="flex items-center gap-2 font-semibold tracking-tight text-white">
            <span className="text-lg">⚡</span>
            <span className="bg-gradient-to-r from-ccweb-cyan to-ccweb-violet bg-clip-text text-transparent">CCWEB</span>
          </NavLink>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden max-w-[140px] truncate text-xs text-ccweb-muted sm:inline">{user.displayName}</span>
                <button type="button" className="ccweb-outline-btn px-3 py-1.5 text-xs" onClick={handleLogout} data-ccweb-e2e="logout">
                  Log out
                </button>
              </>
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

      <main className="ccweb-main-pad mx-auto max-w-3xl md:max-w-5xl">
        <Outlet context={{ user, setUser }} />
      </main>

      <nav className="ccweb-bottom-nav lg:hidden" aria-label="Primary">
        <div className="ccweb-bottom-nav-inner">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to + label}
              to={to}
              className={({ isActive }) => `ccweb-nav-item${isActive ? " active" : ""}`}
            >
              <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
