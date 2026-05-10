import { ArrowRight, Bot, Gift, Sparkles, TrendingUp, Zap } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useCachedFetch } from "../hooks/useCachedFetch";
import { http } from "../api/http";
import { fetchMe } from "../session";
import { Skeleton } from "../components/ui/Skeleton";

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function MobileDashboardPage() {
  const { user } = useOutletContext() || {};
  const canAnalytics = Boolean(user);

  useEffect(() => {
    if (!user) return undefined;
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

  const stats = useMemo(() => {
    if (!analytics?.postgres || !analytics.profile) {
      return {
        earningsHint: "—",
        activityHint: user ? "Sign in + Postgres for live stats" : "Sign in",
        agentsHint: "Commerce rows when DB enabled",
        xp: null,
      };
    }
    const p = analytics.profile;
    const creditsUsd = p.creditsCents != null ? (p.creditsCents / 100).toFixed(2) : "—";
    return {
      earningsHint: creditsUsd !== "—" ? `$${creditsUsd} credits` : "—",
      activityHint: `${p.xp ?? 0} XP`,
      agentsHint: `${(analytics.orders || []).length} orders (sample)`,
      xp: p.xp,
    };
  }, [analytics, user]);

  const greet = timeGreeting();

  const quickLinks = [
    { to: "/learn", title: "Start learning", sub: "Courses, AI tutor & live labs", accent: "from-ccweb-cyan/30 to-ccweb-violet/20", icon: Sparkles },
    { to: "/find", title: "Market intelligence", sub: "Scanner, signals & wallets", accent: "from-ccweb-green/25 to-ccweb-cyan/15", icon: Zap },
    { to: "/dapp-builder", title: "Build a DApp", sub: "Visual builder & templates", accent: "from-ccweb-violet/30 to-ccweb-cyan/15", icon: Bot },
    { to: "/ai-agents", title: "AI agents", sub: "Automations & API runs", accent: "from-ccweb-cyan/25 to-ccweb-green/15", icon: Bot },
  ];

  return (
    <div className="ccweb-stagger mx-auto max-w-3xl space-y-6 px-3 pb-8 pt-4 md:max-w-5xl">
      <header className="ccweb-glass ccweb-card-premium relative overflow-hidden rounded-3xl p-6 md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-gradient-to-br from-ccweb-cyan/25 via-ccweb-violet/15 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-ccweb-green/10 blur-3xl" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <span className="ccweb-kicker">Command center</span>
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
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ccweb-muted md:text-base">
            Premium intelligence, courses, and automation — one fluid surface inspired by Linear, Discord, and modern
            on-chain apps.
          </p>
          {!user && (
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

      {user && (
        <section className="ccweb-glass ccweb-card-premium rounded-3xl p-6 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white md:text-xl">Your snapshot</h2>
              <p className="mt-1 font-mono text-[11px] text-ccweb-muted/90">
                <span className="text-ccweb-cyan/90">GET</span> /api/v1/analytics/user
              </p>
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
              {error}{" "}
              <button type="button" className="font-medium underline underline-offset-2" onClick={() => refresh()}>
                Retry
              </button>
            </p>
          )}

          {!loading && !error && analytics && !analytics.postgres && (
            <p className="mt-4 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/95">
              Enable <code className="rounded-md bg-black/40 px-1.5 py-0.5 font-mono text-ccweb-cyan">DATABASE_URL</code>{" "}
              on the API for credits, XP, and order history.
            </p>
          )}

          {!loading && analytics?.postgres && (
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="group ccweb-glass-subtle relative overflow-hidden rounded-2xl p-4 text-center transition hover:border-ccweb-green/30">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-ccweb-green/10 to-transparent opacity-0 transition group-hover:opacity-100" />
                <TrendingUp className="relative mx-auto h-6 w-6 text-ccweb-green" />
                <p className="relative mt-2 text-[11px] font-semibold uppercase tracking-wider text-ccweb-muted">Credits</p>
                <p className="relative mt-1 ccweb-display-heading text-lg text-white">{stats.earningsHint}</p>
              </div>
              <div className="group ccweb-glass-subtle relative overflow-hidden rounded-2xl p-4 text-center transition hover:border-ccweb-cyan/30">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-ccweb-cyan/10 to-transparent opacity-0 transition group-hover:opacity-100" />
                <Sparkles className="relative mx-auto h-6 w-6 text-ccweb-cyan" />
                <p className="relative mt-2 text-[11px] font-semibold uppercase tracking-wider text-ccweb-muted">Activity</p>
                <p className="relative mt-1 ccweb-display-heading text-lg text-white">{stats.activityHint}</p>
              </div>
              <div className="group ccweb-glass-subtle relative overflow-hidden rounded-2xl p-4 text-center transition hover:border-ccweb-violet/30">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-ccweb-violet/10 to-transparent opacity-0 transition group-hover:opacity-100" />
                <Bot className="relative mx-auto h-6 w-6 text-ccweb-violet" />
                <p className="relative mt-2 text-[11px] font-semibold uppercase tracking-wider text-ccweb-muted">Commerce</p>
                <p className="relative mt-1 ccweb-display-heading text-lg text-white">{stats.agentsHint}</p>
              </div>
            </div>
          )}
        </section>
      )}

      <section>
        <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-ccweb-muted">Quick actions</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {quickLinks.map(({ to, title, sub, accent, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`group ccweb-glass ccweb-card-premium relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${accent} p-5`}
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
