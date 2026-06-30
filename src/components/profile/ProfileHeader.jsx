import { Calendar, Copy, ExternalLink, Link2, MapPin, Share2 } from "lucide-react";
import { assetsUrl } from "../../config/env";
import { optimizeCloudinaryUrl } from "../../lib/cloudinaryUrl";
import { cn } from "../../lib/cn";
import { toast } from "../../lib/toastBus";
import { Skeleton } from "../ui/Skeleton";
import { CreatorBadge, VerificationBadge } from "./ProfileBadges";
import { CreatorStatsCard } from "./CreatorStatsCard";
import { ProfileMediaUpload } from "./ProfileMediaUpload";
import { CcwebBrandAvatarFallback } from "../brand/CcwebBrandMark";

function deriveInterestChips(user, creator, monetization) {
  const chips = [];
  if (creator?.badge) chips.push(String(creator.badge).replace(/_/g, " "));
  const tier = monetization?.tier || creator?.tier;
  if (tier && tier !== "free") chips.push(String(tier).replace(/_/g, " "));
  const bio = user?.bio || "";
  const tags = bio.match(/#[\w-]+/g);
  if (tags) chips.push(...tags.map((t) => t.slice(1)));
  if (Array.isArray(user?.socialLinks)) {
    for (const link of user.socialLinks.slice(0, 3)) {
      if (link?.label) chips.push(link.label);
    }
  }
  return [...new Set(chips)].slice(0, 8);
}

function formatJoined(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  } catch {
    return null;
  }
}

function formatCount(n) {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (v >= 10_000) return `${Math.round(v / 1000)}K`;
  if (v >= 1_000) return `${(v / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(v);
}

export function ProfileHeaderSkeleton() {
  return (
    <section className="overflow-hidden rounded-3xl border border-white/10">
      <Skeleton className="h-40 w-full rounded-none md:h-48" />
      <div className="relative border-t border-white/10 bg-black/50 px-4 pb-5 pt-16 backdrop-blur-lg md:px-6">
        <Skeleton className="absolute -top-12 left-4 h-24 w-24 rounded-2xl md:left-6" />
        <Skeleton className="mt-1 h-8 w-48 rounded-lg" />
        <Skeleton className="mt-2 h-4 w-32 rounded-md" />
        <div className="mt-4 flex gap-4">
          <Skeleton className="h-4 w-20 rounded-md" />
          <Skeleton className="h-4 w-20 rounded-md" />
        </div>
      </div>
    </section>
  );
}

export function ProfileHeader({
  user,
  social,
  creator,
  monetization,
  stats,
  betaPublicUrl,
  loading,
  isSelf,
  onEdit,
  onShare,
  avatarUpload,
  bannerUpload,
}) {
  if (loading && !user) return <ProfileHeaderSkeleton />;

  const joined = formatJoined(user?.createdAt);
  const interestChips = deriveInterestChips(user, creator, monetization);
  const bannerStyle = user?.bannerUrl
    ? { backgroundImage: `url(${assetsUrl(user.bannerUrl)})` }
    : { backgroundImage: "linear-gradient(120deg, rgba(34,211,238,0.45), rgba(167,139,250,0.45))" };

  async function copyLink() {
    const url = betaPublicUrl || window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Profile link copied.");
    } catch {
      toast.error("Could not copy link.");
    }
  }

  return (
    <section className="ccweb-stagger overflow-hidden rounded-3xl border border-white/10 shadow-[0_24px_80px_-28px_rgba(0,0,0,0.55)]">
      <div className="relative h-40 bg-cover bg-center md:h-48" style={bannerStyle}>
        {isSelf && bannerUpload ? (
          <ProfileMediaUpload
            variant="banner"
            className="absolute inset-0"
            previewUrl={user?.bannerUrl ? assetsUrl(user.bannerUrl) : null}
            {...bannerUpload}
          />
        ) : null}
      </div>

      <div
        className="relative border-t border-white/10 bg-black/50 px-4 pb-5 backdrop-blur-lg md:px-6"
        style={{ paddingTop: "3.75rem", paddingBottom: "max(1.25rem, env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="absolute -top-12 left-4 h-24 w-24 md:left-6">
          {isSelf && avatarUpload ? (
            <ProfileMediaUpload
              variant="avatar"
              className="h-24 w-24"
              previewUrl={user?.avatarUrl ? assetsUrl(user.avatarUrl) : null}
              compressOptions={{ maxWidth: 1024, maxHeight: 1024, quality: 0.88 }}
              {...avatarUpload}
            >
              <div className="h-full w-full overflow-hidden rounded-2xl">
                <CcwebBrandAvatarFallback name={user?.displayName} size={96} className="h-full w-full rounded-2xl" />
              </div>
            </ProfileMediaUpload>
          ) : (
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-4 border-[#070b14] bg-gradient-to-br from-ccweb-cyan/35 to-ccweb-violet/30 text-lg font-bold text-white shadow-2xl ring-1 ring-white/15">
              {user?.avatarUrl ? (
                <img
                  src={optimizeCloudinaryUrl(assetsUrl(user.avatarUrl), { width: 256 })}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <CcwebBrandAvatarFallback name={user?.displayName} size={96} className="h-full w-full rounded-2xl" />
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">{user?.displayName || "Member"}</h1>
              {user?.verified ? <VerificationBadge /> : null}
              <CreatorBadge tier={creator?.tier || monetization?.tier} badge={creator?.badge} />
            </div>
            {isSelf && user?.email ? <p className="mt-0.5 text-sm text-ccweb-muted">{user.email}</p> : null}
            {user?.bio ? (
              <div className="mt-3 max-w-xl rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ccweb-muted">Bio</p>
                <p className="mt-1 text-sm leading-relaxed text-white/90">{user.bio}</p>
              </div>
            ) : null}
            {interestChips.length > 0 && (
              <div className="mt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ccweb-muted">Skills &amp; interests</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {interestChips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-ccweb-cyan/25 bg-ccweb-cyan/10 px-3 py-1 text-xs font-medium capitalize text-ccweb-cyan"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {Array.isArray(user?.socialLinks) && user.socialLinks.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {user.socialLinks.map((link) => (
                  <a
                    key={`${link.label}-${link.url}`}
                    href={link.url.startsWith("http") ? link.url : `https://${link.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] items-center rounded-full border border-white/15 px-3 text-xs font-medium text-white/90 hover:bg-white/8"
                  >
                    {link.label || "Link"}
                    <ExternalLink className="ml-1.5 h-3 w-3 opacity-60" aria-hidden />
                  </a>
                ))}
              </div>
            )}
            {social && (
              <div className="mt-4 flex flex-wrap gap-6 border-t border-white/10 pt-4 text-sm">
                <button type="button" className="group text-left">
                  <p className="text-lg font-bold text-white group-hover:text-ccweb-cyan">{formatCount(social.followers)}</p>
                  <p className="text-ccweb-muted">Followers</p>
                </button>
                <button type="button" className="group text-left">
                  <p className="text-lg font-bold text-white group-hover:text-ccweb-cyan">{formatCount(social.following)}</p>
                  <p className="text-ccweb-muted">Following</p>
                </button>
                {typeof stats?.postCount === "number" && (
                  <div>
                    <p className="text-lg font-bold text-white">{formatCount(stats.postCount)}</p>
                    <p className="text-ccweb-muted">Posts</p>
                  </div>
                )}
              </div>
            )}
            {(user?.location || user?.website || joined) && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ccweb-muted">About</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ccweb-muted">
                  {user?.location ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {user.location}
                    </span>
                  ) : null}
                  {user?.website ? (
                    <a
                      href={user.website.startsWith("http") ? user.website : `https://${user.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-ccweb-cyan hover:underline"
                    >
                      <Link2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {user.website.replace(/^https?:\/\//, "").slice(0, 40)}
                    </a>
                  ) : null}
                  {joined ? (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      Joined {joined}
                    </span>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            {isSelf ? (
              <button type="button" className="ccweb-outline-btn min-h-[44px] px-4 text-sm" onClick={onEdit}>
                Edit profile
              </button>
            ) : null}
            <button type="button" className="ccweb-outline-btn flex min-h-[44px] items-center gap-2 px-4 text-sm" onClick={onShare || copyLink}>
              <Share2 className="h-4 w-4" aria-hidden />
              Share
            </button>
            {betaPublicUrl && (
              <button
                type="button"
                className="ccweb-outline-btn flex min-h-[44px] items-center gap-2 px-4 text-sm"
                onClick={copyLink}
                aria-label="Copy profile link"
              >
                <Copy className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
        </div>
      </div>
      <CreatorStatsCard social={social} stats={stats} creator={creator} monetization={monetization} isSelf={isSelf} />
      {isSelf && monetization?.subscription?.status ? (
        <div className="border-t border-white/10 bg-black/40 px-4 py-3 text-xs text-ccweb-muted md:px-6">
          {isSelf && monetization?.tier && monetization.tier !== "free" && (
            <p>
              Plan: <span className="font-semibold capitalize text-white">{monetization.tier}</span>
              {monetization.subscription?.status ? ` · ${monetization.subscription.status}` : ""}
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
