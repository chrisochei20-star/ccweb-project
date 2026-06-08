import { Loader2, PenLine, Sparkles, TrendingUp, UserPlus, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fetchCommunityPosts } from "../../api/communityApi";
import { SocialPostCard } from "../community/SocialPostCard";
import { Skeleton } from "../ui/Skeleton";
import { EmptyState } from "../ui/EmptyState";
import { dedupeById } from "../../lib/feedMerge";
import { formatUserFacingError } from "../../lib/userFacingError";

function initials(name) {
  return (name || "U")
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function extractTopics(posts) {
  const counts = new Map();
  for (const p of posts) {
    const text = `${p.title || ""} ${p.content || ""}`;
    const tags = text.match(/#[\w-]+/g) || [];
    for (const t of tags) {
      const key = t.toLowerCase();
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([tag]) => tag);
}

function uniqueAuthors(posts, excludeId) {
  const seen = new Set();
  const out = [];
  for (const p of posts) {
    const id = p.authorUserId || p.authorDisplayName;
    if (!id || seen.has(id) || id === excludeId) continue;
    seen.add(id);
    out.push({ id, name: p.authorDisplayName || "Member" });
    if (out.length >= 8) break;
  }
  return out;
}

/**
 * X-style home timeline — For You / Following, stories, trending, suggested accounts.
 */
export function HomeFeedSection({ user }) {
  const [tab, setTab] = useState("for-you");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [err, setErr] = useState(null);
  const [visibleCount, setVisibleCount] = useState(8);
  const sentinelRef = useRef(null);

  const loadPosts = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const mode = tab === "following" ? "latest" : tab === "trending" ? "trending" : "latest";
      const list = await fetchCommunityPosts(mode);
      setPosts(dedupeById(list));
      setVisibleCount(8);
    } catch (e) {
      setErr(formatUserFacingError(e, "Could not load your feed."));
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    if (!user) {
      setPosts([]);
      setLoading(false);
      return;
    }
    loadPosts();
  }, [user?.id, loadPosts]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || loading || loadingMore) return undefined;
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (visibleCount < posts.length) {
          setLoadingMore(true);
          setVisibleCount((c) => Math.min(c + 6, posts.length));
          setLoadingMore(false);
        }
      },
      { rootMargin: "120px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loading, loadingMore, posts.length, visibleCount]);

  const topics = useMemo(() => extractTopics(posts), [posts]);
  const stories = useMemo(() => uniqueAuthors(posts, user?.id).slice(0, 6), [posts, user?.id]);
  const suggested = useMemo(() => uniqueAuthors(posts, user?.id).slice(0, 4), [posts, user?.id]);

  const followingEmpty = tab === "following";

  if (!user) return null;

  const visible = posts.slice(0, visibleCount);

  return (
    <section className="space-y-4" aria-label="Home feed">
      {/* Stories row */}
      <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
        <Link
          to="/community"
          className="flex min-w-[4.5rem] shrink-0 snap-start flex-col items-center gap-1.5"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-ccweb-cyan/50 bg-ccweb-cyan/10 text-ccweb-cyan">
            <PenLine className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-[10px] font-medium text-ccweb-muted">Compose</span>
        </Link>
        {stories.map((s) => (
          <div key={s.id} className="flex min-w-[4.5rem] shrink-0 snap-start flex-col items-center gap-1.5">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-ccweb-cyan/40 to-ccweb-violet/40 text-xs font-bold text-white ring-2 ring-ccweb-cyan/40">
              {initials(s.name)}
            </span>
            <span className="max-w-[4.5rem] truncate text-[10px] text-ccweb-muted">{s.name.split(" ")[0]}</span>
          </div>
        ))}
      </div>

      {/* For You / Following tabs */}
      <div className="flex gap-1 rounded-2xl border border-white/10 bg-black/25 p-1">
        {[
          ["for-you", "For you"],
          ["following", "Following"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex flex-1 items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold transition ${
              tab === id ? "bg-white/12 text-white" : "text-ccweb-muted hover:bg-white/6"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {topics.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-ccweb-muted">
            <TrendingUp className="h-3 w-3" aria-hidden /> Trending
          </span>
          {topics.map((t) => (
            <span
              key={t}
              className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-ccweb-cyan"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {suggested.length > 0 && tab === "for-you" && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-white">
            <UserPlus className="h-3.5 w-3.5 text-ccweb-violet" aria-hidden />
            Suggested for you
          </p>
          <div className="flex flex-wrap gap-2">
            {suggested.map((s) => (
              <Link
                key={s.id}
                to="/community"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white hover:border-ccweb-cyan/30"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-ccweb-cyan/30 to-ccweb-violet/30 text-[10px] font-bold">
                  {initials(s.name)}
                </span>
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {followingEmpty && tab === "following" && !loading && (
        <EmptyState
          icon={Users}
          title="Build your Following feed"
          description="Follow creators in Community to see their posts here."
          actionLabel="Discover Community"
          actionTo="/community"
        />
      )}

      {(tab === "for-you" || tab === "trending") && (
        <>
          {loading && (
            <div className="space-y-3" role="status" aria-label="Loading feed">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex gap-3">
                    <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-28 rounded-md" />
                      <Skeleton className="h-4 w-full rounded-md" />
                      <Skeleton className="h-3 w-4/5 rounded-md" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {err && !loading && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-sm text-rose-100">
              {err}
              <button type="button" className="ml-2 text-ccweb-cyan underline" onClick={loadPosts}>
                Retry
              </button>
            </div>
          )}

          {!loading && !err && visible.length === 0 && tab === "for-you" && (
            <EmptyState
              icon={Sparkles}
              title="Your feed is quiet"
              description="Be the first to post — share a win, ask a question, or drop alpha."
              actionLabel="Open Community"
              actionTo="/community"
            />
          )}

          {!loading &&
            visible.map((post) => (
              <SocialPostCard key={post.id} post={post} user={user} expanded={false} />
            ))}

          {loadingMore && (
            <p className="flex items-center justify-center gap-2 py-2 text-xs text-ccweb-muted">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Loading more…
            </p>
          )}
          <div ref={sentinelRef} className="h-1" aria-hidden />
        </>
      )}
    </section>
  );
}
