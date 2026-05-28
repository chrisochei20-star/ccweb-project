import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProfileFeed, fetchPublicProfileBySlug, fetchPublicProfileByUserId, followUser } from "../api/profileApi";
import { ProfileFeedList } from "../components/profile/ProfileFeedList";
import { ProfileHeader } from "../components/profile/ProfileHeader";
import { ProfileTabs } from "../components/profile/ProfileTabs";
import { getSessionToken } from "../session";
import { toast } from "../lib/toastBus";
import { useAppShellContext } from "../hooks/useAppShellContext";

/**
 * Public profile view — used for /u/:slug and can be reused for user id routes.
 */
export function PublicProfileView({ slug, userId: userIdProp }) {
  const { user: viewer } = useAppShellContext() || {};
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("posts");
  const [feedItems, setFeedItems] = useState([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState(null);
  const [followBusy, setFollowBusy] = useState(false);

  const profileUserId = bundle?.user?.id || userIdProp;
  const isSelf = viewer?.id && profileUserId && viewer.id === profileUserId;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        let data;
        if (slug) {
          data = await fetchPublicProfileBySlug(slug);
        } else if (userIdProp) {
          data = await fetchPublicProfileByUserId(userIdProp);
        } else {
          throw new Error("Profile not found.");
        }
        if (!cancelled) setBundle(data);
      } catch (e) {
        if (!cancelled) setError(e.message || "Profile not found.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, userIdProp]);

  const loadFeed = useCallback(async () => {
    if (!profileUserId) return;
    setFeedLoading(true);
    setFeedError(null);
    try {
      const data = await fetchProfileFeed(profileUserId, activeTab);
      setFeedItems(data.items || []);
    } catch (e) {
      setFeedError(e.message);
      setFeedItems([]);
    } finally {
      setFeedLoading(false);
    }
  }, [profileUserId, activeTab]);

  useEffect(() => {
    if (profileUserId) loadFeed();
  }, [profileUserId, activeTab, loadFeed]);

  async function handleFollow() {
    if (!profileUserId || !getSessionToken()) {
      toast.error("Sign in to follow.");
      return;
    }
    setFollowBusy(true);
    try {
      await followUser(profileUserId);
      setBundle((b) =>
        b
          ? {
              ...b,
              social: {
                ...b.social,
                followers: (b.social?.followers || 0) + 1,
                isFollowing: true,
              },
            }
          : b
      );
      toast.success("Following.");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setFollowBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-ccweb-muted" role="status">
        <Loader2 className="h-7 w-7 animate-spin" aria-hidden />
      </div>
    );
  }

  if (error || !bundle?.user) {
    return (
      <section className="mx-auto max-w-lg px-4 pb-24 pt-8 text-center">
        <h1 className="text-xl font-bold text-white">Profile unavailable</h1>
        <p className="mt-2 text-sm text-ccweb-muted">{error || "This profile could not be loaded."}</p>
        <Link to="/" className="ccweb-outline-btn mt-6 inline-flex min-h-[44px] items-center px-5 text-sm">
          Home
        </Link>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-3 pb-24 pt-4 md:max-w-3xl">
      <ProfileHeader
        user={bundle.user}
        social={bundle.social}
        creator={bundle.creator}
        monetization={bundle.monetization}
        betaPublicUrl={bundle.betaPublicUrl}
        loading={false}
        isSelf={Boolean(isSelf)}
        onEdit={isSelf ? () => (window.location.href = "/profile") : undefined}
      />

      {!isSelf && getSessionToken() && !bundle.social?.isFollowing && (
        <button
          type="button"
          className="ccweb-gradient-btn w-full min-h-[44px] text-sm"
          disabled={followBusy}
          onClick={handleFollow}
        >
          {followBusy ? "Following…" : "Follow"}
        </button>
      )}

      <ProfileTabs active={activeTab} onChange={setActiveTab} isSelf={Boolean(isSelf)} sticky />
      <ProfileFeedList tab={activeTab} items={feedItems} loading={feedLoading} error={feedError} onRetry={loadFeed} />

      {!getSessionToken() && (
        <div className="ccweb-glass rounded-2xl p-5 text-center">
          <p className="text-sm text-ccweb-muted">Sign in for your full profile and likes tab.</p>
          <Link to="/login" className="ccweb-gradient-btn mt-3 inline-flex min-h-[44px] items-center px-5 text-sm">
            Sign in
          </Link>
        </div>
      )}
    </div>
  );
}
