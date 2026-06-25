import {
  Activity,
  ArrowRight,
  Bell,
  BookOpen,
  Bot,
  ChevronRight,
  Clock,
  Cpu,
  Gift,
  Loader2,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { useEffect, useMemo } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useCachedFetch } from "../hooks/useCachedFetch";
import { http } from "../api/http";
import { fetchMe, getSessionToken } from "../session";
import { HomeFeedSection } from "../components/home/HomeFeedSection";
import { Skeleton } from "../components/ui/Skeleton";
import { formatUserFacingError } from "../lib/userFacingError";

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function formatUsd(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  const v = Number(n);
  if (Math.abs(v) >= 1000) return `$${v.toFixed(0)}`;
  return `$${v.toFixed(2)}`;
}

function formatShortDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

const REC_ACCENT = {
  cyan: "from-ccweb-cyan/35 to-ccweb-violet/15 border-ccweb-cyan/25",
  violet: "from-ccweb-violet/35 to-ccweb-cyan/12 border-ccweb-violet/25",
  green: "from-ccweb-green/30 to-ccweb-cyan/12 border-ccweb-green/25",
};

export function MobileDashboardPage() {
  const { user, authHydrated } = useOutletContext() || {};
  const canAnalytics = Boolean(user);

  useEffect(() => {
    if (!authHydrated || !user) return undefined;
    let cancelled = false;
    (async () => {
      try {
        await http.post("/api/v1/growth/daily", {});
      } catch {
        /* optional */
      }
      if (!cancelled) {
        try {
          await fetchMe();
        } catch {
          /* ignore */
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const { data: analytics, loading, error, refresh } = useCachedFetch(
    canAnalytics ? "/api/v1/analytics/user" : null,
    { enabled: canAnalytics }
  );

  const dash = analytics?.dashboard;

  const snapshot = useMemo(() => {
    if (!analytics?.postgres || !analytics.profile) {
      return {
        cards: [
          {
            label: "Credits",
            primary: "—",
            secondary: user ? "Enable Postgres for live balances" : "Sign in",
            Icon: TrendingUp,
            tone: "green",
          },
          {
            label: "Activity",
            primary: "—",
            secondary: "XP & streaks",
            Icon: Sparkles,
            tone: "cyan",
          },
          {
            label: "Commerce",
            primary: "—",
            secondary: "Orders & marketplace",
            Icon: Bot,
            tone: "violet",
          },
        ],
      };
    }

    const p = analytics.profile;
    const creditsUsd = p.creditsCents != null ? (p.creditsCents / 100).toFixed(2) : "—";

    if (dash) {
      const aiPrimary = `${dash.ai.tutorEvents30d} tutor · ${dash.ai.assistantMessages30d} AI msgs`;
      const aiSecondary = dash.ai.monthlyUsage
        ? `Tier ${dash.ai.monthlyUsage.tier ?? "—"} · ${dash.ai.meteringEvents30d} metered (30d)`
        : `${dash.ai.meteringEvents30d} metered · ${formatUsd(dash.ai.meteringUsd30d)} (30d)`;
      return {
        cards: [
          {
            label: "Learning",
            primary: `${dash.learning.avgProgressPct}% avg progress`,
            secondary: `${dash.learning.completedLessonsWeek} lessons · 7d · ${dash.learning.coursesTracked} enrolled`,
            Icon: BookOpen,
            tone: "green",
          },
          {
            label: "AI usage",
            primary: aiPrimary,
            secondary: aiSecondary,
            Icon: Cpu,
            tone: "cyan",
          },
          {
            label: "Wallet & earn",
            primary: `${formatUsd(dash.earnings.lifetimeUsd)} lifetime`,
            secondary: `${dash.wallets.total} wallets tracked`,
            Icon: Wallet,
            tone: "violet",
          },
        ],
      };
    }

    return {
      cards: [
        {
          label: "Credits",
          primary: creditsUsd !== "—" ? `$${creditsUsd} credits` : "—",
          secondary: `${p.xp ?? 0} XP`,
          Icon: TrendingUp,
          tone: "green",
        },
        {
          label: "Activity",
          primary: `${p.xp ?? 0} XP`,
          secondary: "Growth & daily streaks",
          Icon: Sparkles,
          tone: "cyan",
        },
        {
          label: "Commerce",
          primary: `${(analytics.orders || []).length} orders (sample)`,
          secondary: "Marketplace history",
          Icon: Bot,
          tone: "violet",
        },
      ],
    };
  }, [analytics, user, dash]);

  const greet = timeGreeting();

  const quickLinks = [
    { to: "/community", title: "Community feed", sub: "Posts, reactions & channels", accent: "from-ccweb-cyan/30 to-ccweb-violet/20", icon: Users },
    { to: "/learn", title: "Learn", sub: "Courses, AI tutor & live labs", accent: "from-ccweb-violet/25 to-ccweb-cyan/15", icon: Sparkles },
    { to: "/find", title: "Search & intel", sub: "Scanner, signals & wallets", accent: "from-ccweb-green/25 to-ccweb-cyan/15", icon: Zap },
    { to: "/earn", title: "Earn", sub: "Rewards & referrals", accent: "from-ccweb-green/20 to-ccweb-violet/15", icon: Gift },
    { to: "/build", title: "Build", sub: "DApps, agents & APIs", accent: "from-ccweb-violet/30 to-ccweb-cyan/15", icon: Bot },
  ];

  return (
    <div className="ccweb-stagger mx-auto max-w-3xl space-y-6 px-3 pb-8 pt-4 md:max-w-5xl">
      <header className="ccweb-glass ccweb-card-premium relative overflow-hidden rounded-3xl p-6 md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-gradient-to-br from-ccweb-cyan/25 via-ccweb-violet/15 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-ccweb-green/10 blur-3xl" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <span className="ccweb-kicker">Home</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300/95">
              <span className="ccweb-live-dot" />
              Live
            </span>
          </div>
          <div className="ccweb-shimmer-bar mb-5 mt-4 max-w-xs" />
          <h1 className="ccweb-display-heading mt-1 max-w-2xl text-3xl text-white md:text-4xl">
            {user ? (
              <>
                {greet},{" "}
                <span className="bg-gradient-to-r from-white via-ccweb-cyan/95 to-ccweb-violet/90 bg-clip-text text-transparent">
                  {user.displayName || "learner"}
                </span>
              </>
            ) : (
              <>
                The Web3 workspace for{" "}
                <span className="bg-gradient-to-r from-ccweb-cyan to-ccweb-violet bg-clip-text text-transparent">
                  builders &amp; learners
                </span>
              </>
            )}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ccweb-muted sm:text-[15px] md:text-base">
            Your social hub: feed, messages, and alerts — with learn, earn, and build tools one tap away in{" "}
            <span className="text-ccweb-cyan/90">More</span>.
          </p>
          {!authHydrated && getSessionToken() && (
            <p className="mt-3 flex items-center gap-2 text-sm text-ccweb-muted">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
              Checking session…
            </p>
          )}
          {authHydrated && !user && getSessionToken() && (
            <p className="mt-3 flex items-center gap-2 text-sm text-ccweb-muted">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
              Syncing account…
            </p>
          )}
          {authHydrated && !user && !getSessionToken() && (
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/login" className="ccweb-gradient-btn inline-flex items-center gap-2 text-sm">
                Sign in <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/signup" className="ccweb-outline-btn text-sm">
                Create account
              </Link>
            </div>
          )}
        </div>
      </header>

      {user && <HomeFeedSection user={user} />}

      {/* Community feed preview — latest 3 posts from social feed */}
      {user && (
        <section className="ccweb-glass ccweb-card-premium rounded-3xl p-6 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-ccweb-cyan" />
              <h2 className="text-lg font-bold text-white">Community</h2>
            </div>
            <Link to="/community" className="text-xs font-semibold text-ccweb-cyan hover:underline flex items-center gap-1">
              See all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <p className="text-sm text-ccweb-muted mb-4">Latest posts from your network. Click any avatar to view their profile.</p>
          <div className="space-y-3">
            {[
              { label: "Social Feed", href: "/community", icon: Users, accent: "text-ccweb-cyan", desc: "Posts, reactions & channels" },
              { label: "Marketplace", href: "/marketplace", icon: ShoppingBag, accent: "text-ccweb-violet", desc: "Products, services & escrow" },
              { label: "Earn & Rewards", href: "/earn", icon: Gift, accent: "text-ccweb-green", desc: "Credits, referrals & leaderboard" },
            ].map(({ label, href, icon: Icon, accent, desc }) => (
              <Link
                key={href}
                to={href}
                className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 hover:border-white/15 transition"
              >
                <Icon className={`h-5 w-5 shrink-0 ${accent}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-xs text-ccweb-muted">{desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-ccweb-muted shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {user && (
        <section className="ccweb-glass ccweb-card-premium rounded-3xl p-6 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white md:text-xl">Your snapshot</h2>
              <p className="mt-1 text-sm text-ccweb-muted">Credits, learning, AI usage, and social reach.</p>
            </div>
            <button
              type="button"
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-ccweb-cyan transition hover:bg-white/10"
              onClick={() => refresh()}
            >
              Refresh
            </button>
          </div>

          {loading && !analytics && (
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="ccweb-glass-subtle rounded-2xl p-4">
                  <Skeleton className="mx-auto h-8 w-8 rounded-xl" />
                  <Skeleton className="mx-auto mt-3 h-3 w-16 rounded-md" />
                  <Skeleton className="mx-auto mt-2 h-5 w-14 rounded-md" />
                </div>
              ))}
            </div>
          )}

          {error && (
            <p className="mt-4 text-sm text-rose-300">
              {formatUserFacingError(error, "Could not load your snapshot.")}{" "}
              <button type="button" className="font-medium underline underline-offset-2" onClick={() => refresh()}>
                Retry
              </button>
            </p>
          )}

          {!loading && !error && analytics && !analytics.postgres && (
            <p className="mt-4 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/95">
              Live balances and order history will appear when your account is fully connected to the platform database.
            </p>
          )}

          {!loading && analytics?.postgres && (
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {snapshot.cards.map(({ label, primary, secondary, Icon, tone }) => {
                const hover =
                  tone === "green"
                    ? "hover:border-ccweb-green/35"
                    : tone === "cyan"
                      ? "hover:border-ccweb-cyan/35"
                      : "hover:border-ccweb-violet/35";
                const glow =
                  tone === "green"
                    ? "from-ccweb-green/10"
                    : tone === "cyan"
                      ? "from-ccweb-cyan/10"
                      : "from-ccweb-violet/10";
                const icon =
                  tone === "green"
                    ? "text-ccweb-green"
                    : tone === "cyan"
                      ? "text-ccweb-cyan"
                      : "text-ccweb-violet";
                return (
                  <div
                    key={label}
                    className={`group ccweb-glass-subtle relative overflow-hidden rounded-2xl p-4 text-center transition ${hover}`}
                  >
                    <div
                      className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${glow} to-transparent opacity-0 transition group-hover:opacity-100`}
                    />
                    <Icon className={`relative mx-auto h-6 w-6 ${icon}`} />
                    <p className="relative mt-2 text-[11px] font-semibold uppercase tracking-wider text-ccweb-muted">{label}</p>
                    <p className="relative mt-1 ccweb-display-heading text-base leading-snug text-white md:text-lg">{primary}</p>
                    {secondary ? (
                      <p className="relative mt-1.5 text-[11px] leading-snug text-ccweb-muted/95">{secondary}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {user && dash && (
        <div className="space-y-6">
          <section className="ccweb-glass ccweb-card-premium rounded-3xl p-6 md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-white md:text-xl">Learning progress</h2>
                <p className="mt-1 text-sm text-ccweb-muted">Courses you are enrolled in and completion velocity.</p>
              </div>
              <Link
                to="/courses"
                className="inline-flex items-center gap-1 text-xs font-semibold text-ccweb-cyan hover:text-ccweb-cyan/90"
              >
                Catalog <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            {dash.learning.progressRows?.length ? (
              <ul className="mt-5 space-y-3">
                {dash.learning.progressRows.map((row) => (
                  <li key={row.courseId}>
                    <Link
                      to={row.slug ? `/courses/${encodeURIComponent(row.slug)}` : "/learn"}
                      className="ccweb-glass-subtle block rounded-2xl p-4 transition hover:border-ccweb-cyan/25"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-white">{row.title || "Course"}</p>
                          {row.categorySlug ? (
                            <p className="mt-0.5 text-[11px] uppercase tracking-wide text-ccweb-muted">{row.categorySlug}</p>
                          ) : null}
                        </div>
                        <span className="shrink-0 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 font-mono text-xs text-ccweb-cyan">
                          {Math.round(row.progressPct ?? 0)}%
                        </span>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-ccweb-cyan to-ccweb-violet transition-all"
                          style={{ width: `${Math.min(100, Math.max(0, Number(row.progressPct) || 0))}%` }}
                        />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-ccweb-muted">
                No enrollments yet — browse the catalog and bookmark lessons to populate this tracker.
              </p>
            )}
          </section>

          <section className="ccweb-glass ccweb-card-premium rounded-3xl p-6 md:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <Cpu className="h-6 w-6 text-ccweb-cyan" />
              <h2 className="text-lg font-bold text-white md:text-xl">AI &amp; platform usage</h2>
            </div>
            <p className="mt-1 text-sm text-ccweb-muted">Tutor sessions, assistant messages, and metered runs (rolling windows).</p>
            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="ccweb-glass-subtle rounded-2xl p-4 text-center">
                <Bot className="mx-auto h-5 w-5 text-ccweb-violet" />
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-ccweb-muted">Tutor · 30d</p>
                <p className="mt-1 ccweb-display-heading text-xl text-white">{dash.ai.tutorEvents30d}</p>
              </div>
              <div className="ccweb-glass-subtle rounded-2xl p-4 text-center">
                <Sparkles className="mx-auto h-5 w-5 text-ccweb-cyan" />
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-ccweb-muted">AI msgs · 30d</p>
                <p className="mt-1 ccweb-display-heading text-xl text-white">{dash.ai.assistantMessages30d}</p>
              </div>
              <div className="ccweb-glass-subtle rounded-2xl p-4 text-center">
                <Activity className="mx-auto h-5 w-5 text-ccweb-green" />
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-ccweb-muted">Metered · 30d</p>
                <p className="mt-1 ccweb-display-heading text-xl text-white">{dash.ai.meteringEvents30d}</p>
              </div>
              <div className="ccweb-glass-subtle rounded-2xl p-4 text-center">
                <Zap className="mx-auto h-5 w-5 text-amber-300/90" />
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-ccweb-muted">Meter $ · 30d</p>
                <p className="mt-1 ccweb-display-heading text-xl text-white">{formatUsd(dash.ai.meteringUsd30d)}</p>
              </div>
            </div>
            {dash.ai.monthlyUsage ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-ccweb-muted">
                <span className="font-semibold text-white">Plan tier:</span>{" "}
                <span className="text-ccweb-cyan">{dash.ai.monthlyUsage.tier ?? "—"}</span>
                <span className="mx-2 text-white/20">·</span>
                scans {dash.ai.monthlyUsage.scanCount}, intel {dash.ai.monthlyUsage.intelligenceCalls}, AI runs{" "}
                {dash.ai.monthlyUsage.aiPlatformRuns}
              </div>
            ) : null}
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="ccweb-glass ccweb-card-premium rounded-3xl p-6 md:p-7">
              <div className="flex items-center gap-2">
                <Wallet className="h-6 w-6 text-ccweb-green" />
                <h2 className="text-lg font-bold text-white">Wallets</h2>
              </div>
              <p className="mt-3 text-3xl font-bold tracking-tight text-white">{dash.wallets.total}</p>
              <p className="text-sm text-ccweb-muted">Addresses on file</p>
              {dash.wallets.byChain?.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {dash.wallets.byChain.map((c) => (
                    <span
                      key={c.chain}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-ccweb-muted"
                    >
                      {c.chain}{" "}
                      <span className="font-mono text-ccweb-cyan/90">{c.count}</span>
                    </span>
                  ))}
                </div>
              ) : null}
              {dash.wallets.items?.length ? (
                <ul className="mt-4 space-y-2 border-t border-white/10 pt-4">
                  {dash.wallets.items.slice(0, 6).map((w) => {
                    const addr = w.address || "";
                    const short =
                      addr.length > 14 ? `${addr.slice(0, 8)}…${addr.slice(-6)}` : addr || "—";
                    return (
                      <li
                        key={w.id}
                        className="flex items-center justify-between gap-2 text-sm text-ccweb-muted"
                      >
                        <span className="font-medium text-white/90">{w.chain || "wallet"}</span>
                        <span className="font-mono text-xs text-ccweb-cyan/90">{short}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-ccweb-muted">Connect wallets from your profile to populate analytics.</p>
              )}
            </section>

            <section className="ccweb-glass ccweb-card-premium rounded-3xl p-6 md:p-7">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-ccweb-violet" />
                <h2 className="text-lg font-bold text-white">Earnings</h2>
              </div>
              <p className="mt-3 ccweb-display-heading text-3xl text-white">{formatUsd(dash.earnings.lifetimeUsd)}</p>
              <p className="text-sm text-ccweb-muted">Lifetime on-platform (USD)</p>
              {dash.earnings.recent?.length ? (
                <ul className="mt-5 space-y-2 border-t border-white/10 pt-4">
                  {dash.earnings.recent.map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-ccweb-muted">{e.source || "payout"}</span>
                      <span className="font-mono text-ccweb-green">{formatUsd(e.amount_usd)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-5 text-sm text-ccweb-muted">No payout rows yet — referrals and marketplace wins appear here.</p>
              )}
            </section>
          </div>

          <section className="ccweb-glass ccweb-card-premium rounded-3xl p-6 md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="h-6 w-6 text-ccweb-violet" />
                <h2 className="text-lg font-bold text-white">Social reach</h2>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="ccweb-glass-subtle rounded-2xl p-5 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ccweb-muted">Followers</p>
                <p className="mt-2 ccweb-display-heading text-3xl text-white">{dash.social.followers}</p>
              </div>
              <div className="ccweb-glass-subtle rounded-2xl p-5 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ccweb-muted">Following</p>
                <p className="mt-2 ccweb-display-heading text-3xl text-white">{dash.social.following}</p>
              </div>
            </div>
          </section>

          <section className="ccweb-glass ccweb-card-premium rounded-3xl p-6 md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Bell className="h-6 w-6 text-ccweb-cyan" />
                <h2 className="text-lg font-bold text-white">Notifications</h2>
                {dash.notifications.unread > 0 ? (
                  <span className="rounded-full bg-ccweb-rose/20 px-2.5 py-0.5 text-[11px] font-bold text-rose-200">
                    {dash.notifications.unread} new
                  </span>
                ) : null}
              </div>
              <Link to="/profile" className="text-xs font-semibold text-ccweb-cyan hover:text-ccweb-cyan/90">
                Settings
              </Link>
            </div>
            {dash.notifications.items?.length ? (
              <ul className="mt-5 space-y-2">
                {dash.notifications.items.slice(0, 8).map((n) => (
                  <li
                    key={n.id}
                    className="flex gap-3 rounded-2xl border border-white/5 bg-black/20 px-3 py-3 text-sm"
                  >
                    <span
                      className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${n.read_at ? "bg-white/20" : "bg-ccweb-cyan shadow-[0_0_10px_rgba(34,211,238,0.45)]"}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white">{n.title || n.kind || "Notice"}</p>
                      {n.body ? <p className="mt-0.5 text-ccweb-muted">{n.body}</p> : null}
                      <p className="mt-1 text-[11px] text-ccweb-muted/80">{formatShortDate(n.created_at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 text-sm text-ccweb-muted">You are all caught up — new alerts land here in real time.</p>
            )}
          </section>

          <section className="ccweb-glass ccweb-card-premium rounded-3xl p-6 md:p-7">
            <div className="flex items-center gap-2">
              <Clock className="h-6 w-6 text-ccweb-muted" />
              <h2 className="text-lg font-bold text-white">Recent activity</h2>
            </div>
            {dash.activity?.length ? (
              <ul className="mt-5 space-y-3">
                {dash.activity.map((a, idx) => {
                  const inner = (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-white">{a.title}</p>
                          {a.subtitle ? <p className="mt-0.5 text-sm text-ccweb-muted">{a.subtitle}</p> : null}
                          <p className="mt-1 text-[11px] text-ccweb-muted/80">{formatShortDate(a.at)}</p>
                        </div>
                        <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-ccweb-muted">
                          {a.type === "lesson_complete" ? "Lesson" : "Event"}
                        </span>
                      </div>
                    </>
                  );
                  return (
                    <li key={`${a.at}-${idx}`}>
                      {a.href ? (
                        <Link
                          to={a.href}
                          className="ccweb-glass-subtle block rounded-2xl p-4 transition hover:border-ccweb-cyan/25"
                        >
                          {inner}
                        </Link>
                      ) : (
                        <div className="ccweb-glass-subtle rounded-2xl p-4">{inner}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-5 text-sm text-ccweb-muted">
                Complete a lesson or trigger growth events — your timeline builds automatically.
              </p>
            )}
          </section>

          <section className="ccweb-glass ccweb-card-premium rounded-3xl p-6 md:p-7">
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-amber-300/90" />
              <h2 className="text-lg font-bold text-white">Suggested next steps</h2>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {(dash.recommendedActions || []).map((rec) => (
                <Link
                  key={rec.id}
                  to={rec.href}
                  className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 transition hover:scale-[1.01] ${REC_ACCENT[rec.accent] || REC_ACCENT.cyan}`}
                >
                  <p className="font-semibold text-white">{rec.title}</p>
                  <p className="mt-1 text-sm text-ccweb-muted">{rec.description}</p>
                  <ChevronRight className="mt-4 h-5 w-5 text-ccweb-muted transition group-hover:translate-x-1 group-hover:text-ccweb-cyan" />
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}

      <section>
        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-ccweb-muted">Explore apps</h2>
        <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:pb-0">
          {quickLinks.map(({ to, title, sub, accent, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`group ccweb-glass ccweb-card-premium relative min-w-[min(288px,86vw)] shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${accent} p-4 sm:min-w-0 sm:p-5`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{title}</p>
                  <p className="mt-1 text-sm text-ccweb-muted">{sub}</p>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/25 text-ccweb-cyan transition group-hover:scale-105 group-hover:border-ccweb-cyan/35">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <ArrowRight className="mt-4 h-5 w-5 text-ccweb-muted transition group-hover:translate-x-1 group-hover:text-ccweb-cyan" />
            </Link>
          ))}
        </div>
      </section>

      <section className="ccweb-glass ccweb-card-premium rounded-3xl p-6 md:flex md:items-center md:justify-between md:gap-8">
        <div>
          <div className="flex items-center gap-2">
            <Gift className="h-6 w-6 text-ccweb-green" />
            <h3 className="text-lg font-bold text-white">Referrals &amp; revenue</h3>
          </div>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-ccweb-muted">
            Referral loops and payouts sync when you connect Earn with Postgres-backed analytics.
          </p>
        </div>
        <Link
          to="/earn"
          className="mt-4 inline-flex shrink-0 items-center gap-2 rounded-2xl border border-ccweb-green/35 bg-ccweb-green/10 px-5 py-3 text-sm font-semibold text-ccweb-green transition hover:bg-ccweb-green/15 md:mt-0"
        >
          Open Earn <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
