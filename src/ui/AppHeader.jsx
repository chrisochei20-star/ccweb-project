import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Menu } from "lucide-react";
import { CcwebLogoWord } from "./CcwebLogo";
import { GlassCard } from "./GlassCard";
import { getSessionToken } from "../session";

export function AppHeader({ user, onOpenMenu }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notif, setNotif] = useState({ unreadCount: 0, notifications: [], loading: false });

  useEffect(() => {
    if (!user || !notifOpen) return;
    let cancelled = false;
    const token = getSessionToken();
    if (!token) return;
    (async () => {
      setNotif((n) => ({ ...n, loading: true }));
      try {
        const res = await fetch(`/api/notifications?unreadOnly=true`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!cancelled && res.ok) {
          setNotif({
            unreadCount: data.unreadCount ?? 0,
            notifications: data.notifications ?? [],
            loading: false,
          });
        } else if (!cancelled) setNotif((n) => ({ ...n, loading: false }));
      } catch {
        if (!cancelled) setNotif((n) => ({ ...n, loading: false }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, notifOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-ccweb-navy-950/75 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-[60px] max-w-[min(70rem,92vw)] items-center justify-between gap-3 px-4 sm:h-[64px] sm:px-5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            type="button"
            onClick={onOpenMenu}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-white/10 bg-white/[0.05] text-ccweb-text md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" strokeWidth={2} />
          </button>
          <Link to="/" className="min-w-0 shrink no-underline">
            <CcwebLogoWord />
          </Link>
        </div>

        <div className="relative flex shrink-0 items-center gap-2">
          {user ? (
            <>
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                className="relative flex h-11 w-11 items-center justify-center rounded-[14px] border border-white/10 bg-white/[0.05] text-ccweb-sky-200 transition hover:border-ccweb-sky-400/30 hover:bg-white/[0.08]"
                aria-expanded={notifOpen}
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" strokeWidth={2} />
                {notif.unreadCount > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-gradient-to-r from-ccweb-cyan-400 to-ccweb-indigo-400 px-1 text-[10px] font-bold text-ccweb-navy-950">
                    {notif.unreadCount > 9 ? "9+" : notif.unreadCount}
                  </span>
                ) : null}
              </button>
              {notifOpen ? (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-10 cursor-default bg-transparent"
                    aria-label="Close notifications"
                    onClick={() => setNotifOpen(false)}
                  />
                  <GlassCard className="absolute right-0 top-[calc(100%+8px)] z-20 w-[min(100vw-2rem,340px)] p-0 shadow-2xl" padding="p-0">
                    <div className="border-b border-white/10 px-4 py-3">
                      <p className="text-sm font-semibold text-ccweb-text">Notifications</p>
                      <p className="text-xs text-ccweb-muted">
                        {notif.loading ? "Loading…" : `${notif.unreadCount} unread`}
                      </p>
                    </div>
                    <ul className="max-h-72 overflow-y-auto py-1">
                      {notif.notifications.length === 0 ? (
                        <li className="px-4 py-6 text-center text-sm text-ccweb-muted">You&apos;re all caught up.</li>
                      ) : (
                        notif.notifications.map((n) => (
                          <li
                            key={n.id}
                            className="border-b border-white/[0.06] px-4 py-3 last:border-0"
                          >
                            <p className="text-sm font-medium text-ccweb-text">{n.title}</p>
                            <p className="mt-0.5 text-xs text-ccweb-muted line-clamp-2">{n.message}</p>
                          </li>
                        ))
                      )}
                    </ul>
                    <div className="border-t border-white/10 p-2">
                      <Link
                        to="/dashboard"
                        onClick={() => setNotifOpen(false)}
                        className="block rounded-xl py-2 text-center text-sm font-medium text-ccweb-sky-300 hover:bg-white/[0.06]"
                      >
                        Open dashboard
                      </Link>
                    </div>
                  </GlassCard>
                </>
              ) : null}
            </>
          ) : (
            <Link
              to="/login"
              className="hidden rounded-[14px] border border-white/15 bg-white/[0.06] px-3 py-2 text-sm font-medium text-ccweb-text hover:bg-white/[0.1] sm:inline-flex"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
