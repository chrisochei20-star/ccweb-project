import { BarChart3, Crown, Users } from "lucide-react";

function formatCount(n) {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (v >= 10_000) return `${Math.round(v / 1000)}K`;
  if (v >= 1_000) return `${(v / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(v);
}

/**
 * Creator stats from real profile bundle data only (no mock analytics).
 */
export function CreatorStatsCard({ social, stats, creator, monetization, isSelf }) {
  const postCount = stats?.postCount;
  const followers = social?.followers;
  const following = social?.following;
  const tier = monetization?.tier || creator?.tier;
  const showPremium = tier && tier !== "free";

  const hasPosts = typeof postCount === "number";
  const hasSocial = typeof followers === "number" || typeof following === "number";
  if (!hasPosts && !hasSocial && !showPremium) return null;

  return (
    <section className="ccweb-card-premium grid grid-cols-2 gap-3 rounded-2xl border border-white/10 p-4 sm:grid-cols-4">
      {hasPosts ? (
        <StatTile icon={BarChart3} label="Posts" value={formatCount(postCount)} />
      ) : null}
      {typeof followers === "number" ? (
        <StatTile icon={Users} label="Followers" value={formatCount(followers)} />
      ) : null}
      {typeof following === "number" ? (
        <StatTile icon={Users} label="Following" value={formatCount(following)} />
      ) : null}
      {showPremium ? (
        <StatTile
          icon={Crown}
          label={isSelf ? "Your plan" : "Tier"}
          value={String(tier).replace(/_/g, " ")}
          highlight
        />
      ) : null}
    </section>
  );
}

function StatTile({ icon: Icon, label, value, highlight }) {
  return (
    <div
      className={`rounded-xl border px-3 py-3 ${highlight ? "border-ccweb-violet/35 bg-ccweb-violet/10" : "border-white/10 bg-black/25"}`}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-ccweb-muted">
        <Icon className="h-3 w-3 shrink-0" aria-hidden />
        {label}
      </div>
      <p className="mt-1 text-lg font-bold capitalize text-white">{value}</p>
    </div>
  );
}
