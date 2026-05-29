import { Bell, Home, Loader2, MessageSquare, Search, User } from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { ThemeToggle } from "../components/shell/ThemeToggle";
import { NotificationBell } from "../components/notifications/NotificationCenter";
import { MoreMenuSheet, MoreMenuTrigger } from "../components/shell/MoreMenuSheet";
import { CCWEB_UI_LOAD_TIMEOUT_MS } from "../constants/loadTimeout";
import { isSearchNavActive } from "../lib/navPaths";
import { fetchMe, getLocalSessionUser, getSessionToken, getStoredUser, logoutApi } from "../session";
import { captureInviteFromSearch, postBetaClientEvent } from "../lib/betaTelemetry";
import { disconnectSharedRealtimeSocket, initRealtimeLifecycle } from "../lib/realtimeSocket";
import { initNotificationsRealtime, useNotificationsStore } from "../store/notificationsStore";
import { useProfileStore } from "../store/profileStore";
import { OfflineBanner } from "../components/shell/OfflineBanner";
import { InstallPrompt } from "../components/pwa/InstallPrompt";
import { PageMeta, ROUTE_META } from "../components/seo/PageMeta";
import { useNativePushRouting } from "../hooks/useNativePushRouting";
import { useAppResumeSync } from "../hooks/useAppResume";
import { isCapacitorNative } from "../lib/capacitorPlatform";

const bottomTabs = [
  { id: "home", to: "/", label: "Home", shortLabel: "Home", icon: Home, end: true, match: (p) => p === "/" },
  {
    id: "search",
    to: "/find",
    label: "Search",
    shortLabel: "Search",
    icon: Search,
    end: false,
    match: (p) => isSearchNavActive(p),
  },
  {
    id: "notifications",
    to: "/notifications",
    label: "Notifications",
    shortLabel: "Alerts",
    icon: Bell,
    end: false,
    match: (p) => p === "/notifications" || p.startsWith("/notifications/"),
  },
  {
    id: "messages",
    to: "/messages",
    label: "Messages",
    shortLabel: "Chats",
    icon: MessageSquare,
    end: false,
    match: (p) => p === "/messages" || p.startsWith("/messages/"),
  },
  {
    id: "profile",
    to: "/profile",
    label: "Profile",
    shortLabel: "You",
    icon: User,
    end: false,
    match: (p) => p === "/profile" || p.startsWith("/profile/"),
  },
];

export function MobileLayout() {
  const [user, setUserState] = useState(() => getStoredUser());
  const setUser = useCallback((u) => {
    setUserState(u);
    if (u) useProfileStore.getState().applySessionUser(u);
    else useProfileStore.getState().reset();
  }, []);
  const [authHydrated, setAuthHydrated] = useState(false);
  const [hydrateTimedOut, setHydrateTimedOut] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const nativeShell = isCapacitorNative();

  useNativePushRouting(authHydrated && Boolean(user));
  useAppResumeSync(authHydrated && Boolean(user));

  useEffect(() => {
    const stopLifecycle = initRealtimeLifecycle();
    return stopLifecycle;
  }, []);

  useEffect(() => {
    if (!authHydrated || !user?.id) return;
    initNotificationsRealtime().catch(() => {});
    useNotificationsStore.getState().loadPreferences().catch(() => {});
  }, [authHydrated, user?.id]);

  useEffect(() => {
    captureInviteFromSearch(location.search || "");
    postBetaClientEvent({
      eventType: "route_view",
      path: location.pathname + location.search,
      metadata: { route: location.pathname },
    });
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (authHydrated) {
      setHydrateTimedOut(false);
      return undefined;
    }
    const id = window.setTimeout(() => setHydrateTimedOut(true), CCWEB_UI_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [authHydrated]);

  useEffect(() => {
    let cancelled = false;
    const token = getSessionToken();
    const cached = getLocalSessionUser();
    if (token) {
      if (cached) setUser(cached);
      setAuthHydrated(true);
    }
    (async () => {
      try {
        const u = await fetchMe();
        if (!cancelled) {
          setUser(u ?? getStoredUser());
        }
      } finally {
        if (!cancelled) setAuthHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (user) return;
    if (getSessionToken() && getStoredUser()) setUser(getStoredUser());
  }, [user]);

  async function handleLogout() {
    await logoutApi();
    disconnectSharedRealtimeSocket();
    setUser(null);
    useNotificationsStore.getState().reset();
    navigate("/login");
  }

  const refreshSession = useCallback(async () => {
    setHydrateTimedOut(false);
    const token = getSessionToken();
    const cached = getStoredUser();
    if (token && cached) {
      setUser(cached);
      setAuthHydrated(true);
    }
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const u = await fetchMe();
        setUser(u ?? getStoredUser());
        return;
      } catch {
        if (attempt < 1) await new Promise((r) => setTimeout(r, 480));
      } finally {
        setAuthHydrated(true);
      }
    }
  }, []);

  const path = location.pathname;
  const routeMeta = ROUTE_META[path] || (path.startsWith("/u/") ? { title: "Profile", description: "Public CCWEB creator profile." } : null);

  return (
    <div className={`ccweb-app-root ccweb-app-pattern min-h-screen font-sans antialiased${nativeShell ? " ccweb-mobile-shell" : ""}`}>
      <a href="#ccweb-main" className="ccweb-skip-link">
        Skip to main content
      </a>
      <PageMeta title={routeMeta?.title} description={routeMeta?.description} path={path} />
      <OfflineBanner onSoftRecover={refreshSession} />
      <InstallPrompt />
      <header className="ccweb-top-bar">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3.5 md:max-w-5xl">
          <NavLink
            to="/"
            className="group flex min-h-[var(--ccweb-touch-min,44px)] min-w-[var(--ccweb-touch-min,44px)] shrink-0 items-center gap-2.5 rounded-xl font-semibold tracking-tight text-white sm:gap-3"
          >
            <span className="ccweb-brand-mark text-lg transition-transform duration-300 group-hover:scale-105">⚡</span>
            <span className="hidden bg-gradient-to-r from-ccweb-cyan via-ccweb-violet to-ccweb-green bg-clip-text text-lg text-transparent sm:inline">
              CCWEB
            </span>
          </NavLink>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-2">
            <MoreMenuTrigger onOpen={() => setMoreOpen(true)} />
            <ThemeToggle />
            <NotificationBell user={user} authHydrated={authHydrated} />
            {user ? (
              <>
                <span className="hidden max-w-[120px] truncate text-xs text-ccweb-muted md:inline">{user.displayName}</span>
                <button
                  type="button"
                  className="ccweb-outline-btn hidden min-h-[var(--ccweb-touch-min,44px)] px-3 py-2 text-xs sm:inline-flex sm:items-center"
                  onClick={handleLogout}
                  data-ccweb-e2e="logout"
                >
                  Log out
                </button>
              </>
            ) : !authHydrated ? (
              <span
                className="flex max-w-[7rem] items-center gap-1.5 truncate text-xs text-ccweb-muted"
                title={hydrateTimedOut ? "Session check slow" : "Checking session"}
              >
                {hydrateTimedOut ? (
                  <span className="text-amber-200/90">Slow network…</span>
                ) : (
                  <>
                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
                    <span className="hidden sm:inline">Session…</span>
                  </>
                )}
              </span>
            ) : getSessionToken() ? (
              <span className="flex max-w-[9rem] items-center gap-1.5 truncate text-xs text-ccweb-muted" title="Finishing sign-in">
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
                <span className="hidden sm:inline">Account…</span>
              </span>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className="hidden min-h-[var(--ccweb-touch-min,44px)] items-center px-2 text-xs font-medium text-ccweb-muted hover:text-white sm:inline-flex"
                >
                  Sign in
                </NavLink>
                <NavLink
                  to="/signup"
                  className="ccweb-gradient-btn inline-flex min-h-[var(--ccweb-touch-min,44px)] items-center px-3 py-2 text-xs"
                >
                  Join
                </NavLink>
              </>
            )}
          </div>
        </div>
      </header>

      <nav className="hidden border-b border-white/5 bg-slate-950/40 backdrop-blur-md lg:block" aria-label="Primary">
        <div className="mx-auto max-w-3xl px-4 py-3 md:max-w-5xl">
          <div className="ccweb-desktop-nav-inner flex flex-wrap items-center justify-center gap-0.5">
            {bottomTabs.map(({ to, label, shortLabel, icon: Icon, end, match }) => {
              const active = match(path);
              return (
                <NavLink
                  key={to + label}
                  end={end}
                  to={to}
                  className={() =>
                    `flex min-h-[40px] items-center gap-2 px-3 py-2 text-sm font-semibold transition-all sm:px-4 sm:py-2.5 ${
                      active ? "bg-white/12 text-white shadow-[0_0_24px_rgba(34,211,238,0.12)]" : "text-ccweb-muted hover:bg-white/6 hover:text-white"
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
                  {label}
                </NavLink>
              );
            })}
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className="rounded-full px-4 py-2.5 text-sm font-semibold text-ccweb-muted transition hover:bg-white/6 hover:text-white"
            >
              More
            </button>
          </div>
        </div>
      </nav>

      <main id="ccweb-main" className="ccweb-main-pad ccweb-native-scroll mx-auto max-w-3xl md:max-w-5xl" tabIndex={-1}>
        <div key={path} className={nativeShell ? "ccweb-page-enter" : undefined}>
          <Outlet context={{ user, setUser, authHydrated, refreshSession }} />
        </div>
      </main>

      <div className="ccweb-floating-shell lg:hidden" aria-hidden={false}>
        <nav className="ccweb-floating-dock" aria-label="Primary">
          <div className="ccweb-floating-dock-inner">
            {bottomTabs.map(({ to, label, shortLabel, icon: Icon, end, match }) => {
              const active = match(path);
              return (
                <NavLink
                  key={to + label}
                  end={end}
                  to={to}
                  className={() => `ccweb-nav-item${active ? " active" : ""}`}
                  aria-label={label}
                >
                  <Icon className="h-[1.2rem] w-[1.2rem]" strokeWidth={2} aria-hidden />
                  <span className="max-w-[4.25rem] truncate">{shortLabel}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div>

      <MoreMenuSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </div>
  );
}
