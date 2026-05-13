import { Gift, Radio, Share2, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { GrowthLoopCard } from "../components/GrowthLoopCard";
import { ShareActions } from "../components/ShareCard";
import { Skeleton } from "../components/ui/Skeleton";
import { useCachedFetch } from "../hooks/useCachedFetch";

export function EarnShellPage() {
  const { user } = useOutletContext() || {};
  const { data: analytics, loading, error, refresh } = useCachedFetch(user ? "/api/v1/analytics/user" : null, {
    enabled: Boolean(user),
    ttlMs: 60_000,
    toastOnError: true,
  });

  const { data: lb, loading: lbLoading } = useCachedFetch(user ? "/api/v1/growth/leaderboards?limit=15" : null, {
    enabled: Boolean(user),
    ttlMs: 120_000,
    toastOnError: true,
  });

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

  const growth = analytics?.growth;

  const earningsSharePayload = useMemo(
    () => ({
      headline:
        summary?.xp != null
          ? `${summary.xp} XP · $${summary.credits ?? "0"} credits`
          : "Building on CCWEB",
    }),
    [summary]
  );

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-3 pb-6 pt-3 md:max-w-5xl">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-ccweb-green">Earn</p>
        <h1 className="mt-1 text-2xl font-bold text-white md:text-3xl">Revenue &amp; referrals</h1>
        <p className="mt-1 max-w-2xl text-sm text-ccweb-muted">
          Credits, XP, invites, and leaderboards — tied to real Postgres rows when the API is connected.
        </p>
      </header>

      {!user && (
        <div className="ccweb-glass rounded-2xl p-5">
          <p className="text-sm text-ccweb-muted">Sign in to load your credits, XP, invite link, and marketplace orders.</p>
          <Link to="/login" className="mt-3 inline-block ccweb-gradient-btn text-sm">
            Sign in
          </Link>
        </div>
      )}

      {user && growth && (
        <GrowthLoopCard
          referralLink={growth.referralLink}
          referralCode={growth.referralCode}
          invitedCount={growth.invitedCount}
          convertedCount={growth.convertedCount}
          conversionRate={growth.conversionRate}
          badges={growth.badges}
          streak={growth.streak}
          level={growth.level}
          xp={growth.profileXp ?? summary?.xp}
          rewardHint={growth.rewardHint}
        />
      )}

      {user && growth && (
        <div className="ccweb-glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white">Share your progress</h3>
          <p className="mt-1 text-xs text-ccweb-muted">One tap — no spammy defaults; you edit before posting.</p>
          <div className="mt-3">
            <ShareActions kind="earn_snapshot" payload={earningsSharePayload} />
          </div>
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
          {loading && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="ccweb-glass-subtle rounded-xl p-4">
                  <Skeleton className="h-6 w-6 rounded-lg" />
                  <Skeleton className="mt-3 h-3 w-24 rounded-md" />
                  <Skeleton className="mt-2 h-8 w-20 rounded-md" />
                </div>
              ))}
            </div>
          )}
          {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
          {!loading && analytics && !analytics.postgres && (
            <p className="mt-3 text-sm text-amber-200/90">
              Connect <code className="rounded bg-black/30 px-1">DATABASE_URL</code> to sync credits, subscriptions, referral codes, and order lines.
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

      {user && lb && (
        <section className="ccweb-glass rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-white">Leaderboards</h2>
          <p className="mt-1 text-xs text-ccweb-muted">
            {lbLoading ? "Loading ranks…" : "Top learners (XP), credit balances, and referrers — anonymized IDs."}
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-ccweb-muted">Top XP</p>
              <ol className="mt-2 space-y-1 text-xs text-ccweb-muted">
                {(lb.topXp || []).slice(0, 8).map((r, i) => (
                  <li key={r.userId} className="flex justify-between gap-2">
                    <span>
                      #{i + 1} {r.userId.slice(0, 10)}…
                    </span>
                    <span className="text-white">{r.xp}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <p className="text-xs font-medium text-ccweb-muted">Top credits</p>
              <ol className="mt-2 space-y-1 text-xs text-ccweb-muted">
                {(lb.topCredits || []).slice(0, 8).map((r, i) => (
                  <li key={r.userId} className="flex justify-between gap-2">
                    <span>
                      #{i + 1} {r.userId.slice(0, 10)}…
                    </span>
                    <span className="text-white">${(r.creditsCents / 100).toFixed(2)}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <p className="text-xs font-medium text-ccweb-muted">Top referrers</p>
              <ol className="mt-2 space-y-1 text-xs text-ccweb-muted">
                {(lb.topReferrers || []).slice(0, 8).map((r, i) => (
                  <li key={r.userId} className="flex justify-between gap-2">
                    <span>
                      #{i + 1} {r.userId.slice(0, 10)}…
                    </span>
                    <span className="text-white">{r.referrals}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="ccweb-glass rounded-2xl p-5">
          <Share2 className="h-6 w-6 text-ccweb-cyan" />
          <h3 className="mt-3 font-semibold text-white">Invite loop</h3>
          <p className="mt-2 text-sm text-ccweb-muted">
            Your referral link lives above when signed in with Postgres. Friends who join and engage unlock bonus credits for both sides.
          </p>
          <Link to="/signup" className="mt-4 inline-block text-sm font-medium text-ccweb-cyan hover:underline">
            Preview signup →
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
