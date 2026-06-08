import { Loader2, PenLine, Users } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fetchCommunityPosts } from "../../api/communityApi";
import { SocialPostCard } from "../community/SocialPostCard";
import { Skeleton } from "../ui/Skeleton";
import { EmptyState } from "../ui/EmptyState";
import { dedupeById } from "../../lib/feedMerge";
import { formatUserFacingError } from "../../lib/userFacingError";

/**
 * X-style home timeline — latest community posts with infinite scroll.
 */
export function HomeFeedSection({ user }) {
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
      const list = await fetchCommunityPosts("latest");
      setPosts(dedupeById(list));
      setVisibleCount(8);
    } catch (e) {
      setErr(formatUserFacingError(e, "Could not load your feed."));
    } finally {
      setLoading(false);
    }
  }, []);

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

  if (!user) return null;

  const visible = posts.slice(0, visibleCount);

  return (
    <section className="space-y-3" aria-label="Home feed">
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div>
          <p className="ccweb-kicker text-[10px]">For you</p>
          <h2 className="text-lg font-bold tracking-tight text-white">Timeline</h2>
        </div>
        <Link
          to="/community"
          className="ccweb-outline-btn inline-flex min-h-[40px] items-center gap-1.5 px-3 text-xs font-semibold"
        >
          <PenLine className="h-3.5 w-3.5" aria-hidden />
          Compose
        </Link>
      </div>

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

      {!loading && !err && visible.length === 0 && (
        <EmptyState
          icon={Users}
          title="Your feed is quiet"
          description="Be the first to post — share a win, ask a question, or drop alpha."
          actionLabel="Open Community"
          actionTo="/community"
        />
      )}

      {!loading && visible.map((post) => (
        <SocialPostCard key={post.id} post={post} user={user} expanded={false} />
      ))}

      {loadingMore && (
        <p className="flex items-center justify-center gap-2 py-2 text-xs text-ccweb-muted">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading more…
        </p>
      )}
      <div ref={sentinelRef} className="h-1" aria-hidden />
    </section>
  );
}
