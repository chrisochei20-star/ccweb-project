import { Award, Copy, ExternalLink, Gift, Loader2, Radio, RefreshCw, Share2, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { GrowthLoopCard } from "../components/GrowthLoopCard";
import { ShareActions } from "../components/ShareCard";
import { Skeleton } from "../components/ui/Skeleton";
import { useCachedFetch } from "../hooks/useCachedFetch";
import { getSessionToken } from "../session";
import { toast } from "../lib/toastBus";

export function EarnShellPage() {
  const { user, authHydrated } = useOutletContext() || {};
  const { data: analytics, loading, error, refresh } = useCachedFetch(user && authHydrated ? "/api/v1/analytics/user" : null, {
    enabled: Boolean(authHydrated && user),
    ttlMs: 60_000,
    toastOnError: true,
  });

  const { data: lb, loading: lbLoading } = useCachedFetch(user && authHydrated ? "/api/v1/growth/leaderboards?limit=15" : null, {
    enabled: Boolean(authHydrated && user),
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
        <h1 className="mt-1 text-2xl font-bold text-white md:text-3xl">Revenue &amp; Rewards</h1>
        <p className="mt-1 max-w-2xl text-sm text-ccweb-muted">
          Credits, XP, referrals, and leaderboards — all synced to your account.
        </p>
      </header>

      {!authHydrated && getSessionToken() && (
        <div className="ccweb-glass flex items-center gap-2 rounded-2xl p-5 text-sm text-ccweb-muted">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
          Checking session…
        </div>
      )}

      {authHydrated && !user && getSessionToken() && (
        <div className="ccweb-glass flex items-center gap-2 rounded-2xl p-5 text-sm text-ccweb-muted">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
          Syncing account…
        </div>
      )}

      {authHydrated && !user && !getSessionToken() && (
        <div className="ccweb-glass rounded-2xl p-5">
          <p className="text-sm text-ccweb-muted">Sign in to load your credits, XP, invite link, and marketplace orders.</p>
          <Link to="/login" className="mt-3 inline-block ccweb-gradient-btn text-sm">
            Sign in
          </Link>
        </div>
      )}

      {/* Earnings snapshot cards */}
      {user && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">Your Earnings Snapshot</h2>
            <button type="button" className="text-xs text-ccweb-cyan hover:underline flex items-center gap-1" onClick={() => refresh()}>
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          </div>
          {loading && (
            <div className="grid gap-3 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="ccweb-glass-subtle rounded-2xl p-4 animate-pulse">
                  <div className="h-6 w-6 rounded-lg bg-white/10" />
                  <div className="mt-3 h-3 w-24 rounded-md bg-white/10" />
                  <div className="mt-2 h-8 w-20 rounded-md bg-white/10" />
                </div>
              ))}
            </div>
          )}
          {error && <p className="text-sm text-rose-300">{error}</p>}
          {!loading && analytics && !analytics.postgres && (
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200/90">
              Sign in with a full account to sync credits, referral codes, and order history.
            </p>
          )}
          {summary && (
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: TrendingUp, color: "text-ccweb-green", label: "Credits (USD)", value: `$${summary.credits ?? "—"}` },
                { icon: Award, color: "text-ccweb-cyan", label: "XP / Engagement", value: summary.xp ?? "—" },
                { icon: Radio, color: "text-ccweb-violet", label: "Subscription", value: summary.tier || "None active" },
              ].map(({ icon: Icon, color, label, value }) => (
                <div key={label} className="ccweb-glass-subtle rounded-2xl p-4">
                  <Icon className={`h-6 w-6 ${color}`} />
                  <p className="mt-2 text-xs text-ccweb-muted">{label}</p>
                  <p className="mt-1 text-xl font-bold text-white">{value}</p>
                </div>
              ))}
            </div>
          )}
          {summary?.recent?.length > 0 && (
            <div className="mt-4 ccweb-glass rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-white mb-2">Recent Learning Sessions</h3>
              <ul className="space-y-2">
                {summary.recent.map((s) => (
                  <li key={`${s.sessionId}-${s.lastSeenAt}`} className="flex justify-between rounded-xl bg-black/25 px-3 py-2 text-sm">
                    <span className="text-white/90 truncate">{s.title}</span>
                    <span className="text-ccweb-muted shrink-0 ml-2">{s.watchMinutes} min</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {summary?.orders?.length > 0 && (
            <div className="mt-3 ccweb-glass rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-white mb-2">Recent Marketplace Orders</h3>
              <ul className="space-y-2">
                {summary.orders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    <span className="text-white/90 text-sm truncate">{o.listingTitle || o.id}</span>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-xs capitalize text-ccweb-muted">{o.status}</span>
                      <span className="text-xs font-semibold text-ccweb-green">${o.amountUsd}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Referral / Growth Loop */}
      {user && growth && (
        <section className="ccweb-glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-5 w-5 text-ccweb-cyan" />
            <h2 className="font-semibold text-white">Referral Program</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 mb-4">
            {[
              { label: "Invited", value: growth.invitedCount ?? 0 },
              { label: "Converted", value: growth.convertedCount ?? 0 },
              { label: "Rate", value: growth.conversionRate != null ? `${growth.conversionRate}%` : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-white/[0.04] border border-white/[0.07] p-3 text-center">
                <p className="text-xl font-bold text-white">{value}</p>
                <p className="text-xs text-ccweb-muted mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          {growth.referralLink && (
            <div>
              <p className="text-xs text-ccweb-muted mb-1.5">Your referral link</p>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                <p className="flex-1 truncate text-sm text-white/80">{growth.referralLink}</p>
                <button
                  type="button"
                  onClick={() => { navigator.clipboard?.writeText(growth.referralLink); toast.success("Referral link copied!"); }}
                  className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-ccweb-cyan hover:underline"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy
                </button>
              </div>
            </div>
          )}
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
        </section>
      )}

      {/* Share progress */}
      {user && growth && (
        <div className="ccweb-glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Share2 className="h-5 w-5 text-ccweb-cyan" />
            <h3 className="font-semibold text-white">Share Your Progress</h3>
          </div>
          <p className="mt-1 text-xs text-ccweb-muted mb-3">One tap — you edit before posting, no spammy defaults.</p>
          <ShareActions kind="earn_snapshot" payload={earningsSharePayload} />
        </div>
      )}

      {/* Leaderboard */}
      {user && lb && (
        <section className="ccweb-glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Award className="h-5 w-5 text-ccweb-cyan" />
            <h2 className="font-semibold text-white">Leaderboard</h2>
          </div>
          <p className="mt-0.5 text-xs text-ccweb-muted mb-4">
            {lbLoading ? "Loading ranks…" : "Top earners by XP, credits, and referrals (anonymized IDs)"}
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: "Top XP", rows: lb.topXp, fmt: (r) => r.xp, color: "text-ccweb-cyan" },
              { title: "Top Credits", rows: lb.topCredits, fmt: (r) => `$${(r.creditsCents / 100).toFixed(2)}`, color: "text-ccweb-green" },
              { title: "Top Referrers", rows: lb.topReferrers, fmt: (r) => `${r.referrals} refs`, color: "text-ccweb-violet" },
            ].map(({ title, rows, fmt, color }) => (
              <div key={title}>
                <p className={`text-xs font-semibold mb-2 ${color}`}>{title}</p>
                <ol className="space-y-1.5">
                  {(rows || []).slice(0, 8).map((r, i) => (
                    <li key={r.userId} className="flex justify-between items-center rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2">
                      <span className="text-xs text-ccweb-muted">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`} {(r.userId || "member").slice(0, 10)}…
                      </span>
                      <span className={`text-xs font-semibold ${color}`}>{fmt(r)}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Passive income tiles */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="ccweb-glass rounded-2xl p-5">
          <Users className="h-6 w-6 text-ccweb-cyan" />
          <h3 className="mt-3 font-semibold text-white">Invite Loop</h3>
          <p className="mt-2 text-sm text-ccweb-muted">
            Your unique referral link is above when signed in. Friends who join and engage unlock bonus credits for both sides.
          </p>
          <Link to="/signup" className="mt-4 inline-block text-sm font-medium text-ccweb-cyan hover:underline">
            Preview signup →
          </Link>
        </div>
        <div className="ccweb-glass rounded-2xl p-5">
          <Radio className="h-6 w-6 text-ccweb-violet" />
          <h3 className="mt-3 font-semibold text-white">Streaming Revenue</h3>
          <p className="mt-2 text-sm text-ccweb-muted">
            Host AI sessions with hourly monetization. Revenue splits finalize when sessions end and the ledger is updated.
          </p>
          <Link to="/learn" className="mt-4 inline-block text-sm font-medium text-ccweb-violet hover:underline">
            Go to Learn hub →
          </Link>
        </div>
      </section>
    </div>
  );
}
