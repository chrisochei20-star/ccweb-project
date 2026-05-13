import { ExternalLink, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchCommunityPostsByUser } from "../api/communityApi";
import { followUser, unfollowUser } from "../api/notificationsApi";
import { assetsUrl, apiUrl } from "../config/env";
import { SocialPostCard } from "../components/community/SocialPostCard";
import { Skeleton } from "../components/ui/Skeleton";
import { apiFetch } from "../lib/apiClient";
import { toast } from "../lib/toastBus";
import { getSessionToken } from "../session";

export function PublicProfilePage() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [followerCount, setFollowerCount] = useState(null);
  const [followingCount, setFollowingCount] = useState(null);
  const [isFollowing, setIsFollowing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [tab, setTab] = useState("posts");
  const [myId, setMyId] = useState(null);
  const [expandedPost, setExpandedPost] = useState(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await apiFetch(apiUrl(`/api/v1/users/${encodeURIComponent(userId)}`), { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Profile not found");
      setProfile(data.user);
      setFollowerCount(data.followerCount);
      setFollowingCount(data.followingCount);
      setIsFollowing(data.isFollowing);
    } catch (e) {
      toast.error(e.message || "Could not load profile");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = getSessionToken();
    if (!t) return;
    let c = false;
    apiFetch(apiUrl("/api/auth/me"), { headers: { Authorization: `Bearer ${t}` } }, { networkRetries: 1 })
      .then((r) => r.json())
      .then((d) => {
        if (!c && d.user?.id) setMyId(d.user.id);
      })
      .catch(() => {});
    return () => {
      c = true;
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    let c = false;
    fetchCommunityPostsByUser(userId)
      .then((list) => {
        if (!c) setPosts(list);
      })
      .catch(() => {
        if (!c) setPosts([]);
      });
    return () => {
      c = true;
    };
  }, [userId]);

  async function toggleFollow() {
    const token = getSessionToken();
    if (!token) {
      toast.error("Sign in to follow.");
      return;
    }
    try {
      if (isFollowing) {
        await unfollowUser(userId);
        setIsFollowing(false);
        setFollowerCount((n) => Math.max(0, (n ?? 1) - 1));
        toast.success("Unfollowed");
      } else {
        await followUser(userId);
        setIsFollowing(true);
        setFollowerCount((n) => (n ?? 0) + 1);
        toast.success("Following");
      }
    } catch (e) {
      toast.error(e.message || "Could not update follow");
    }
  }

  const mediaPosts = posts.filter((p) => (p.mediaUrls || []).length > 0);
  const selfId = getSessionToken() ? JSON.parse(atob(getSessionToken().split(".")[1] || "e30=") || "{}").sub : null;

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-3 pb-24 pt-4">
        <Skeleton className="h-40 w-full rounded-3xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg px-3 py-16 text-center text-ccweb-muted">
        <p>Profile unavailable.</p>
        <Link to="/community" className="mt-4 inline-block text-ccweb-cyan underline">
          Back to community
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-3 pb-24 pt-3 md:max-w-3xl">
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-black/40 shadow-xl">
        <div
          className="h-36 bg-cover bg-center md:h-44"
          style={{
            backgroundImage: profile.bannerUrl
              ? `url(${assetsUrl(profile.bannerUrl)})`
              : "linear-gradient(115deg, rgba(34,211,238,0.35), rgba(99,102,241,0.45))",
          }}
        />
        <div className="relative flex flex-col gap-3 border-t border-white/10 px-5 pb-5 pt-14">
          <div className="absolute -top-12 left-5 flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-4 border-[#070b14] bg-gradient-to-br from-ccweb-cyan/35 to-ccweb-violet/30 text-lg font-bold text-white shadow-2xl">
            {profile.avatarUrl ? (
              <img src={assetsUrl(profile.avatarUrl)} alt="" className="h-full w-full object-cover" />
            ) : (
              <span>{(profile.displayName || "?").slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ccweb-muted">Creator</p>
              <h1 className="text-2xl font-bold text-white md:text-3xl">{profile.displayName}</h1>
              {profile.headline ? <p className="mt-1 text-sm text-ccweb-cyan/90">{profile.headline}</p> : null}
            </div>
            {myId !== userId && (
              <button type="button" onClick={() => toggleFollow()} className="ccweb-gradient-btn shrink-0 px-4 py-2 text-sm">
                {isFollowing ? "Following" : "Follow"}
              </button>
            )}
          </div>
          {profile.bio ? <p className="text-sm leading-relaxed text-slate-300/95">{profile.bio}</p> : null}
          <div className="flex flex-wrap gap-4 text-sm text-ccweb-muted">
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4" aria-hidden />
              <strong className="text-white">{followerCount ?? "—"}</strong> followers
            </span>
            <span>
              <strong className="text-white">{followingCount ?? "—"}</strong> following
            </span>
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            {profile.websiteUrl ? (
              <a
                href={profile.websiteUrl.startsWith("http") ? profile.websiteUrl : `https://${profile.websiteUrl}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-ccweb-cyan hover:underline"
              >
                Website <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
            {profile.twitterHandle ? (
              <a
                href={`https://twitter.com/${encodeURIComponent(profile.twitterHandle)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-ccweb-cyan hover:underline"
              >
                @{profile.twitterHandle}
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <div className="flex gap-2 rounded-2xl border border-white/10 bg-black/25 p-1">
        <button
          type="button"
          onClick={() => setTab("posts")}
          className={`flex-1 rounded-xl py-2 text-sm font-semibold ${tab === "posts" ? "bg-white/12 text-white" : "text-ccweb-muted"}`}
        >
          Posts
        </button>
        <button
          type="button"
          onClick={() => setTab("media")}
          className={`flex-1 rounded-xl py-2 text-sm font-semibold ${tab === "media" ? "bg-white/12 text-white" : "text-ccweb-muted"}`}
        >
          Media
        </button>
      </div>

      <ul className="space-y-3">
        {(tab === "posts" ? posts : mediaPosts).map((p) => (
          <li key={p.id}>
            <SocialPostCard
              post={p}
              user={null}
              expanded={expandedPost === p.id}
              comments={[]}
              commentsLoading={false}
              commentDraft={{}}
              onToggleThread={() => setExpandedPost((cur) => (cur === p.id ? null : p.id))}
              onCommentDraft={() => {}}
              onSubmitComment={() => {}}
              compactThread
            />
          </li>
        ))}
      </ul>

      {tab === "media" && mediaPosts.length === 0 && (
        <p className="text-center text-sm text-ccweb-muted">No media attachments yet.</p>
      )}
    </div>
  );
}
