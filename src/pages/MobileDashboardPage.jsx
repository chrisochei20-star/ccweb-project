import { ArrowRight, Bot, Gift, Sparkles, TrendingUp } from "lucide-react";
import { useEffect } from "react";
import { useMemo } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useCachedFetch } from "../hooks/useCachedFetch";
import { http } from "../api/http";
import { fetchMe } from "../session";

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

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-3 pb-6 pt-3 md:max-w-5xl">
      <header className="ccweb-glass rounded-2xl p-5">
        <div className="ccweb-shimmer-bar mb-4 max-w-xs" />
        <p className="text-xs font-semibold uppercase tracking-widest text-ccweb-cyan">Home</p>
        <h1 className="mt-1 text-2xl font-bold text-white md:text-3xl">
          {user ? `Welcome back, ${user.displayName || "learner"}` : "Welcome to CCWEB"}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-ccweb-muted">
          Your AI-powered Web3 academy and business engine — learn, scan markets, ship products, and earn with real APIs.
        </p>
        {!user && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/login" className="ccweb-gradient-btn inline-flex items-center gap-2 text-sm">
              Sign in <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/signup" className="ccweb-outline-btn text-sm">
              Create account
            </Link>
          </div>
        )}
      </header>

      {user && (
        <section className="ccweb-glass rounded-2xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-white">Your snapshot</h2>
            <button type="button" className="text-xs font-medium text-ccweb-cyan hover:underline" onClick={() => refresh()}>
              Refresh
            </button>
          </div>
          <p className="mt-1 text-xs text-ccweb-muted">
            From <code className="text-ccweb-cyan">GET /api/v1/analytics/user</code>
          </p>
          {loading && <p className="mt-3 text-sm text-ccweb-muted">Loading analytics…</p>}
          {error && (
            <p className="mt-3 text-sm text-rose-300">
              {error}{" "}
              <button type="button" className="underline" onClick={() => refresh()}>
                Retry
              </button>
            </p>
          )}
          {!loading && !error && analytics && !analytics.postgres && (
            <p className="mt-3 text-sm text-amber-200/90">
              Enable <code className="rounded bg-black/30 px-1">DATABASE_URL</code> on the API for credits, XP, and order
              history in this panel.
            </p>
          )}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="ccweb-glass-subtle rounded-xl p-3 text-center">
              <TrendingUp className="mx-auto h-5 w-5 text-ccweb-green" />
              <p className="mt-2 text-xs text-ccweb-muted">Earnings / credits</p>
              <p className="mt-1 text-sm font-semibold text-white">{stats.earningsHint}</p>
            </div>
            <div className="ccweb-glass-subtle rounded-xl p-3 text-center">
              <Sparkles className="mx-auto h-5 w-5 text-ccweb-cyan" />
              <p className="mt-2 text-xs text-ccweb-muted">Activity</p>
              <p className="mt-1 text-sm font-semibold text-white">{stats.activityHint}</p>
            </div>
            <div className="ccweb-glass-subtle rounded-xl p-3 text-center">
              <Bot className="mx-auto h-5 w-5 text-ccweb-violet" />
              <p className="mt-2 text-xs text-ccweb-muted">Agents &amp; orders</p>
              <p className="mt-1 text-sm font-semibold text-white">{stats.agentsHint}</p>
            </div>
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ccweb-muted">Quick actions</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            to="/learn"
            className="ccweb-glass flex items-center justify-between gap-3 rounded-2xl p-4 transition hover:border-ccweb-cyan/40"
          >
            <div>
              <p className="font-medium text-white">Start learning</p>
              <p className="text-xs text-ccweb-muted">Live AI sessions &amp; tutor</p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-ccweb-cyan" />
          </Link>
          <Link
            to="/find"
            className="ccweb-glass flex items-center justify-between gap-3 rounded-2xl p-4 transition hover:border-ccweb-green/40"
          >
            <div>
              <p className="font-medium text-white">Scan a token</p>
              <p className="text-xs text-ccweb-muted">Risk &amp; early signals</p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-ccweb-green" />
          </Link>
          <Link
            to="/dapp-builder"
            className="ccweb-glass flex items-center justify-between gap-3 rounded-2xl p-4 transition hover:border-ccweb-violet/40"
          >
            <div>
              <p className="font-medium text-white">Build a DApp</p>
              <p className="text-xs text-ccweb-muted">Visual builder &amp; deploy</p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-ccweb-violet" />
          </Link>
          <Link
            to="/ai-agents"
            className="ccweb-glass flex items-center justify-between gap-3 rounded-2xl p-4 transition hover:border-ccweb-cyan/40"
          >
            <div>
              <p className="font-medium text-white">Launch an agent</p>
              <p className="text-xs text-ccweb-muted">Automations &amp; API runs</p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-ccweb-cyan" />
          </Link>
        </div>
      </section>

      <section className="ccweb-glass rounded-2xl p-5">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-ccweb-green" />
          <h3 className="font-semibold text-white">Referrals &amp; revenue</h3>
        </div>
        <p className="mt-2 text-sm text-ccweb-muted">
          Track referrals and streaming revenue from the Earn hub. Sign in to load merged analytics when Postgres is enabled.
        </p>
        <Link to="/earn" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-ccweb-green hover:underline">
          Open Earn <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
