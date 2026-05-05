import { Gift, Radio, Share2, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useCachedFetch } from "../hooks/useCachedFetch";

export function EarnShellPage() {
  const { user } = useOutletContext() || {};
  const { data: analytics, loading, error, refresh } = useCachedFetch(
    user ? "/api/v1/analytics/user" : null,
    { enabled: Boolean(user), ttlMs: 60_000 }
  );

  const summary = useMemo(() => {
    if (!analytics?.postgres || !analytics.profile) return null;
    const p = analytics.profile;
    const subs = p.subscription;
    return {
      xp: p.xp,
      credits: p.creditsCents != null ? (p.creditsCents / 100).toFixed(2) : null,
      tier: subs?.tier || null,
      recent: (p.recentSessions || []).slice(0, 4),
      orders: (analytics.orders || []).slice(0, 6),
    };
  }, [analytics]);

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-3 pb-6 pt-3 md:max-w-5xl">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-ccweb-green">Earn</p>
        <h1 className="mt-1 text-2xl font-bold text-white md:text-3xl">Revenue &amp; referrals</h1>
        <p className="mt-1 max-w-2xl text-sm text-ccweb-muted">
          Affiliate-style growth, AI streaming payouts, and escrow-backed client work — grounded in real API data where Postgres is enabled.
        </p>
      </header>

      {!user && (
        <div className="ccweb-glass rounded-2xl p-5">
          <p className="text-sm text-ccweb-muted">Sign in to load your credits, XP, and marketplace orders.</p>
          <Link to="/login" className="mt-3 inline-block ccweb-gradient-btn text-sm">
            Sign in
          </Link>
        </div>
      )}

      {user && (
        <section className="ccweb-glass rounded-2xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-white">Your earnings snapshot</h2>
            <button type="button" className="text-xs text-ccweb-cyan hover:underline" onClick={() => refresh()}>
              Refresh
            </button>
          </div>
          {loading && <p className="mt-3 text-sm text-ccweb-muted">Loading…</p>}
          {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
          {!loading && analytics && !analytics.postgres && (
            <p className="mt-3 text-sm text-amber-200/90">
              Connect <code className="rounded bg-black/30 px-1">DATABASE_URL</code> to sync credits, subscriptions, and order lines shown here.
            </p>
          )}
          {summary && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="ccweb-glass-subtle rounded-xl p-4">
                <TrendingUp className="h-6 w-6 text-ccweb-green" />
                <p className="mt-2 text-xs text-ccweb-muted">Credits (USD eq.)</p>
                <p className="text-xl font-bold text-white">${summary.credits ?? "—"}</p>
              </div>
              <div className="ccweb-glass-subtle rounded-xl p-4">
                <Gift className="h-6 w-6 text-ccweb-cyan" />
                <p className="mt-2 text-xs text-ccweb-muted">XP / engagement</p>
                <p className="text-xl font-bold text-white">{summary.xp ?? "—"}</p>
              </div>
              <div className="ccweb-glass-subtle rounded-xl p-4">
                <Radio className="h-6 w-6 text-ccweb-violet" />
                <p className="mt-2 text-xs text-ccweb-muted">Subscription</p>
                <p className="text-lg font-semibold text-white">{summary.tier || "None active"}</p>
              </div>
            </div>
          )}
          {summary?.recent?.length > 0 && (
            <div className="mt-5">
              <h3 className="text-sm font-semibold text-white">Recent learning sessions</h3>
              <ul className="mt-2 space-y-2 text-sm text-ccweb-muted">
                {summary.recent.map((s) => (
                  <li key={`${s.sessionId}-${s.lastSeenAt}`} className="flex justify-between rounded-lg bg-black/25 px-3 py-2">
                    <span className="text-white/90">{s.title}</span>
                    <span>{s.watchMinutes} min</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {summary?.orders?.length > 0 && (
            <div className="mt-5">
              <h3 className="text-sm font-semibold text-white">Marketplace / escrow (recent)</h3>
              <ul className="mt-2 space-y-2 text-xs text-ccweb-muted">
                {summary.orders.map((o) => (
                  <li key={o.id} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                    <span className="text-white/90">{o.listingTitle || o.id}</span> · {o.status} · ${o.amountUsd}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="ccweb-glass rounded-2xl p-5">
          <Share2 className="h-6 w-6 text-ccweb-cyan" />
          <h3 className="mt-3 font-semibold text-white">Referral program</h3>
          <p className="mt-2 text-sm text-ccweb-muted">
            Share CCWEB with builders and learners. Track recurring commissions from your referral dashboard when billing is connected.
          </p>
          <Link to="/signup" className="mt-4 inline-block text-sm font-medium text-ccweb-cyan hover:underline">
            Get your invite link →
          </Link>
        </div>
        <div className="ccweb-glass rounded-2xl p-5">
          <Radio className="h-6 w-6 text-ccweb-violet" />
          <h3 className="mt-3 font-semibold text-white">Streaming revenue</h3>
          <p className="mt-2 text-sm text-ccweb-muted">
            Host AI sessions with hourly monetization. Revenue splits finalize when sessions end and Postgres records ledger rows.
          </p>
          <Link to="/learn" className="mt-4 inline-block text-sm font-medium text-ccweb-violet hover:underline">
            Go to Learn hub →
          </Link>
        </div>
      </section>
    </div>
  );
}
