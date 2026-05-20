import {
  AtSign,
  Bell,
  BookOpen,
  Briefcase,
  Hammer,
  Heart,
  Loader2,
  MessageCircle,
  Repeat2,
  Sparkles,
  UserPlus,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { fetchNotificationSummary, fetchNotifications, markNotificationsRead } from "../../api/notificationsApi";
import { createChatSocket } from "../../lib/chatSocket";
import { toast } from "../../lib/toastBus";
import { getSessionToken } from "../../session";
import { AuthSessionChecking } from "../auth/AuthSessionChecking";
import { Skeleton } from "../ui/Skeleton";

function hrefForNotification(n) {
  const p = n.payload || {};
  switch (n.kind) {
    case "chat":
      return p.chatId ? `/messages?highlight=${encodeURIComponent(p.chatId)}` : "/messages";
    case "learn":
      return p.courseSlug ? `/courses/${encodeURIComponent(p.courseSlug)}` : "/learn";
    case "like":
    case "repost":
    case "reply":
    case "mention":
    case "community":
      return "/community";
    case "earn":
      return "/earn";
    case "build":
      return "/build";
    case "follow":
      return "/profile";
    default:
      return "/";
  }
}

function kindIcon(kind) {
  switch (kind) {
    case "like":
      return Heart;
    case "repost":
      return Repeat2;
    case "reply":
      return MessageCircle;
    case "mention":
      return AtSign;
    case "follow":
      return UserPlus;
    case "chat":
      return MessageCircle;
    case "learn":
      return BookOpen;
    case "build":
      return Hammer;
    case "earn":
      return Briefcase;
    default:
      return Sparkles;
  }
}

export function NotificationCenterPage() {
  const { authHydrated } = useOutletContext() || {};
  const [items, setItems] = useState([]);
  const [grouped, setGrouped] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [err, setErr] = useState(null);
  const [showGrouped, setShowGrouped] = useState(false);

  const load = useCallback(
    async (cursor = null, append = false) => {
      if (append) setLoadingMore(true);
      else {
        setLoading(true);
        setErr(null);
      }
      try {
        const data = await fetchNotifications({
          limit: 25,
          cursor,
          grouped: showGrouped,
        });
        const next = data.items || [];
        setItems((prev) => (append ? [...prev, ...next] : next));
        setGrouped(data.grouped || []);
        setNextCursor(data.nextCursor || null);
      } catch (e) {
        const m = e.message || "Could not load notifications";
        setErr(m);
        toast.error(m);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [showGrouped]
  );

  useEffect(() => {
    if (!authHydrated) return;
    load(null, false);
  }, [load, authHydrated]);

  useEffect(() => {
    const socket = createChatSocket();
    if (!socket) return undefined;
    const onUp = () => load(null, false);
    socket.on("notifications:update", onUp);
    return () => {
      socket.off("notifications:update", onUp);
    };
  }, [load]);

  async function markAllRead() {
    setErr(null);
    try {
      await markNotificationsRead({ markAll: true });
      await load(null, false);
    } catch (e) {
      const m = e.message || "Could not mark read";
      setErr(m);
      toast.error(m);
    }
  }

  async function markOne(id) {
    try {
      await markNotificationsRead({ ids: [id] });
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, read: true, readAt: new Date().toISOString() } : x)));
    } catch (e) {
      toast.error(e.message || "Could not update");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-3 pb-24 pt-4 md:pb-10">
      {!authHydrated && getSessionToken() && <AuthSessionChecking message="Loading notifications…" />}
      {!authHydrated && !getSessionToken() && (
        <div className="ccweb-card-premium rounded-2xl border border-white/10 p-8 text-center text-sm text-ccweb-muted">
          <Link to="/login" className="ccweb-gradient-btn inline-block">
            Sign in
          </Link>{" "}
          to see notifications.
        </div>
      )}
      {authHydrated && (
      <>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="ccweb-kicker text-xs font-semibold uppercase tracking-widest text-ccweb-cyan">Activity</p>
          <h1 className="ccweb-display-heading mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">Notifications</h1>
          <p className="mt-1 max-w-md text-sm text-ccweb-muted">
            Likes, replies, mentions, follows, chat, learning, and rewards — synced in real time when you use PostgreSQL.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={`ccweb-outline-btn px-3 py-1.5 text-xs ${showGrouped ? "border-ccweb-cyan/50 text-ccweb-cyan" : ""}`}
            onClick={() => setShowGrouped((g) => !g)}
          >
            {showGrouped ? "Flat list" : "Grouped view"}
          </button>
          <button type="button" className="ccweb-gradient-btn px-3 py-1.5 text-xs" onClick={() => markAllRead()}>
            Mark all read
          </button>
        </div>
      </header>

      {err && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {err}
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="ccweb-card-premium rounded-2xl border border-white/10 p-4">
              <Skeleton className="h-4 w-[70%] rounded-md" />
              <Skeleton className="mt-3 h-3 w-full rounded-md" />
              <Skeleton className="mt-2 h-3 w-4/5 rounded-md" />
            </div>
          ))}
        </div>
      )}

      {!loading && showGrouped && grouped.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ccweb-muted">Grouped</h2>
          <ul className="space-y-2">
            {grouped.map((g) => (
              <li key={g.groupKey || g.sample?.id} className="ccweb-card-premium rounded-xl border border-white/10 px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-white">
                    {g.count}× {g.kind}
                  </span>
                  {g.unread > 0 && (
                    <span className="rounded-full bg-ccweb-cyan/20 px-2 py-0.5 text-[10px] font-semibold text-ccweb-cyan">
                      {g.unread} new
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-ccweb-muted">{g.sample?.body || g.sample?.message}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!loading && items.length === 0 && (
        <div className="ccweb-card-premium rounded-2xl border border-white/10 p-8 text-center text-sm text-ccweb-muted">
          You are all caught up. Interact on Community, Learn, or Chats to see notifications here.
        </div>
      )}

      {!loading && items.length > 0 && (
        <ul className="space-y-2">
          {items.map((n) => {
            const Icon = kindIcon(n.kind);
            const href = hrefForNotification(n);
            return (
              <li
                key={n.id}
                className={`ccweb-card-premium rounded-2xl border px-4 py-3 transition ${
                  n.read ? "border-white/5 opacity-75" : "border-ccweb-cyan/25 shadow-[0_0_28px_-12px_rgba(34,211,238,0.35)]"
                }`}
              >
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/6 text-ccweb-cyan">
                    <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-ccweb-muted">{n.kind}</span>
                      {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-ccweb-cyan" aria-label="Unread" />}
                    </div>
                    <p className="mt-0.5 text-sm font-semibold text-white">{n.title}</p>
                    <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-slate-300/95">{n.message || n.body}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-ccweb-muted">
                      <span>{new Date(n.createdAt).toLocaleString()}</span>
                      <Link to={href} className="text-ccweb-cyan underline-offset-2 hover:underline">
                        Open
                      </Link>
                      {!n.read && (
                        <button type="button" className="text-white/80 hover:text-white" onClick={() => markOne(n.id)}>
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {nextCursor && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            className="ccweb-outline-btn px-4 py-2 text-sm"
            disabled={loadingMore}
            onClick={() => load(nextCursor, true)}
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
      </>
      )}
    </div>
  );
}

export function NotificationBell({ user, authHydrated = true }) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const refresh = useCallback(async () => {
    if (!authHydrated) return;
    if (!user) {
      setUnread(0);
      setPreview([]);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const s = await fetchNotificationSummary();
      setUnread(s.unreadCount || 0);
      const data = await fetchNotifications({ limit: 8 });
      setPreview(data.items || []);
    } catch (e) {
      setErr(e.message || "");
      setUnread(0);
    } finally {
      setLoading(false);
    }
  }, [user, authHydrated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!authHydrated || !user) return undefined;
    const socket = createChatSocket();
    if (!socket) return undefined;
    const onUp = () => refresh();
    socket.on("notifications:update", onUp);
    return () => {
      socket.off("notifications:update", onUp);
    };
  }, [user, refresh, authHydrated]);

  if (!authHydrated && getSessionToken()) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-ccweb-muted" title="Checking session">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      </div>
    );
  }

  if (!authHydrated) return null;

  if (!user) return null;

  return (
    <div className="relative">
      <button
        type="button"
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:border-ccweb-cyan/30 hover:bg-white/10"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Notifications"
        onClick={() => setOpen((o) => !o)}
      >
        <Bell className="h-4 w-4" strokeWidth={2} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-1 text-[10px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <button type="button" className="fixed inset-0 z-40 bg-black/50 md:bg-black/30" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="fixed inset-x-0 top-[52px] z-50 mx-auto max-h-[min(70vh,520px)] w-[min(100%-1.5rem,420px)] overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/50 backdrop-blur-xl md:absolute md:inset-x-auto md:right-0 md:top-11 md:mx-0 md:mt-1 md:w-[380px]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <span className="text-sm font-semibold text-white">Notifications</span>
              <div className="flex items-center gap-2">
                <Link
                  to="/notifications"
                  className="text-xs font-medium text-ccweb-cyan hover:underline"
                  onClick={() => setOpen(false)}
                >
                  See all
                </Link>
                <button type="button" className="rounded-lg p-1 text-ccweb-muted hover:text-white" onClick={() => setOpen(false)}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="max-h-[min(60vh,460px)] overflow-y-auto px-2 py-2">
              {loading && (
                <div className="space-y-2 p-2">
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              )}
              {err && !loading && <p className="px-3 py-4 text-center text-xs text-rose-300">{err}</p>}
              {!loading && !err && preview.length === 0 && (
                <p className="px-3 py-6 text-center text-xs text-ccweb-muted">No notifications yet.</p>
              )}
              {!loading &&
                preview.map((n) => {
                  const Icon = kindIcon(n.kind);
                  const href = hrefForNotification(n);
                  return (
                    <Link
                      key={n.id}
                      to={href}
                      onClick={() => setOpen(false)}
                      className={`mb-1 flex gap-2 rounded-xl px-2 py-2.5 transition hover:bg-white/6 ${
                        n.read ? "opacity-70" : "bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/8 text-ccweb-cyan">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-white">{n.title}</p>
                        <p className="line-clamp-2 text-[11px] leading-snug text-ccweb-muted">{n.message || n.body}</p>
                      </div>
                    </Link>
                  );
                })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
