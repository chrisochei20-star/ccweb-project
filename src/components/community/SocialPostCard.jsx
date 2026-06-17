import { Heart, MessageCircle, Repeat2 } from "lucide-react";
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { createPostReaction, fetchPostReactions } from "../../api/communityApi";
import { getSessionToken } from "../../session";
import { toast } from "../../lib/toastBus";
import { timeAgo } from "../../lib/timeFormat";
import { formatUserFacingError } from "../../lib/userFacingError";
import { SkeletonText } from "../ui/Skeleton";

function initials(name) {
  const s = (name || "U").trim();
  return s
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function SocialPostCard({
  post,
  user,
  expanded,
  comments,
  commentsLoading,
  commentSubmitting = false,
  commentDraft,
  onToggleThread,
  onCommentDraft,
  onSubmitComment,
}) {
  const [likeBusy, setLikeBusy] = useState(false);
  const [repostBusy, setRepostBusy] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [localReactions, setLocalReactions] = useState(null);
  const [likeBump, setLikeBump] = useState(0);
  const [repostBump, setRepostBump] = useState(0);
  const canInteract = Boolean(getSessionToken());

  const loadReactions = useCallback(async () => {
    try {
      const r = await fetchPostReactions(post.id);
      setLocalReactions(r);
      setLikeBump(0);
      setRepostBump(0);
    } catch {
      /* ignore */
    }
  }, [post.id]);

  const likesFromList = localReactions?.filter((x) => x.reaction === "like").length;
  const likeCount =
    likesFromList != null ? likesFromList : (post.reactionCount != null ? post.reactionCount : 0) + likeBump;

  async function handleLike() {
    if (!getSessionToken()) return;
    setLikeBusy(true);
    const hadList = localReactions != null;
    if (!hadList) setLikeBump((b) => b + 1);
    const prevReactions = localReactions;
    if (hadList && user?.id) {
      setLocalReactions((r) => [
        ...(r || []),
        {
          id: `opt_${Date.now()}`,
          authorUserId: user.id,
          authorDisplayName: user.displayName || "You",
          targetType: "post",
          targetId: post.id,
          reaction: "like",
          createdAt: new Date().toISOString(),
        },
      ]);
    }
    try {
      await createPostReaction({
        postId: post.id,
        reaction: "like",
      });
      await loadReactions();
    } catch (e) {
      if (!hadList) setLikeBump((b) => Math.max(0, b - 1));
      else setLocalReactions(prevReactions);
      toast.error(formatUserFacingError(e, "Could not like"));
    } finally {
      setLikeBusy(false);
    }
  }

  async function handleRepost() {
    if (!getSessionToken()) return;
    setRepostBusy(true);
    const hadList = localReactions != null;
    if (!hadList) setRepostBump((b) => b + 1);
    const prevReactions = localReactions;
    if (hadList && user?.id) {
      setLocalReactions((r) => [
        ...(r || []),
        {
          id: `opt_${Date.now()}`,
          authorUserId: user.id,
          authorDisplayName: user.displayName || "You",
          targetType: "post",
          targetId: post.id,
          reaction: "repost",
          createdAt: new Date().toISOString(),
        },
      ]);
    }
    try {
      await createPostReaction({
        postId: post.id,
        reaction: "repost",
      });
      await loadReactions();
    } catch (e) {
      if (!hadList) setRepostBump((b) => Math.max(0, b - 1));
      else setLocalReactions(prevReactions);
      toast.error(formatUserFacingError(e, "Could not repost"));
    } finally {
      setRepostBusy(false);
    }
  }

  const repostsFromList = localReactions?.filter((x) => x.reaction === "repost").length;
  const repostCount =
    repostsFromList != null ? repostsFromList : repostBump > 0 ? repostBump : null;

  const userLiked = Boolean(
    user?.id && localReactions?.some((x) => x.reaction === "like" && x.authorUserId === user.id)
  );
  const userReposted = Boolean(
    user?.id && localReactions?.some((x) => x.reaction === "repost" && x.authorUserId === user.id)
  );

  return (
    <article className="ccweb-social-post group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.06] to-transparent p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] transition hover:border-ccweb-cyan/25 hover:shadow-[0_12px_40px_-18px_rgba(34,211,238,0.35)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ccweb-cyan/40 to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="flex gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-ccweb-cyan/30 to-ccweb-violet/30 text-xs font-bold text-white ring-2 ring-white/10">
          {post.authorAvatarUrl ? (
            <img src={post.authorAvatarUrl} alt={post.authorDisplayName || "Member"} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            initials(post.authorDisplayName)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-semibold text-white">{post.authorDisplayName || "Member"}</span>
            <span className="text-xs text-ccweb-muted">· {timeAgo(post.createdAt)}</span>
          </div>
          <h3 className="mt-1 text-[15px] font-semibold leading-snug text-white">{post.title}</h3>
          <p className="mt-1.5 whitespace-pre-wrap text-[14px] leading-relaxed text-slate-300/95">{post.content}</p>
          {post.imageUrl && (
            <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
              <img src={post.imageUrl} alt="Post media" className="w-full max-h-[400px] object-cover cursor-pointer" loading="lazy" onClick={() => setLightboxOpen(true)} />
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-white/5 pt-3">
            <button
              type="button"
              disabled={!canInteract || likeBusy}
              onClick={handleLike}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition disabled:opacity-40 ${
                userLiked ? "bg-rose-500/15 text-rose-300" : "text-ccweb-muted hover:bg-rose-500/10 hover:text-rose-200"
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${userLiked ? "fill-rose-400 text-rose-400" : ""}`} strokeWidth={2} />
              {likeCount != null ? likeCount : "—"}
            </button>
            <button
              type="button"
              disabled={!canInteract || repostBusy}
              onClick={handleRepost}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition disabled:opacity-40 ${
                userReposted ? "bg-ccweb-green/15 text-ccweb-green" : "text-ccweb-muted hover:bg-ccweb-green/10 hover:text-ccweb-green"
              }`}
            >
              <Repeat2 className="h-3.5 w-3.5" strokeWidth={2} />
              {repostCount != null ? repostCount : "Boost"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof onToggleThread === "function") onToggleThread(post.id);
                if (!expanded) void loadReactions();
              }}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-ccweb-muted transition hover:bg-white/8 hover:text-ccweb-cyan"
            >
              <MessageCircle className="h-3.5 w-3.5" strokeWidth={2} />
              {expanded ? "Hide" : "Thread"} · {post.commentCount ?? 0}
            </button>
          </div>

          {expanded && (
            <div className="mt-3 rounded-xl border border-white/10 bg-black/35 p-3">
              {commentsLoading && (
                <div className="py-1">
                  <SkeletonText lines={2} />
                </div>
              )}
              {!commentsLoading && (
                <ul className="max-h-56 space-y-2.5 overflow-y-auto text-sm">
                  {(comments || []).map((c) => (
                    <li key={c.id} className="border-b border-white/5 pb-2 last:border-0">
                      <span className="font-medium text-ccweb-cyan">{c.authorDisplayName}</span>
                      <span className="text-xs text-ccweb-muted"> · {timeAgo(c.createdAt)}</span>
                      <p className="mt-0.5 text-white/90">{c.body}</p>
                    </li>
                  ))}
                </ul>
              )}
              {canInteract ? (
                <div className="mt-3 flex gap-2">
                  <input
                    className="ccweb-input min-h-[44px] flex-1 text-sm"
                    placeholder="Post your reply…"
                    value={commentDraft || ""}
                    onChange={(e) => onCommentDraft(post.id, e.target.value)}
                    disabled={commentSubmitting}
                  />
                  <button
                    type="button"
                    className="ccweb-outline-btn inline-flex min-h-[44px] shrink-0 items-center justify-center px-3 text-sm disabled:opacity-50"
                    onClick={() => onSubmitComment(post.id)}
                    disabled={commentSubmitting}
                  >
                    {commentSubmitting ? "…" : "Reply"}
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-xs text-ccweb-muted">
                  <Link to="/login" className="text-ccweb-cyan underline">
                    Sign in
                  </Link>{" "}
                  to reply.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      {lightboxOpen && post.imageUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <img src={post.imageUrl} alt="Post media full view" className="max-h-[90vh] max-w-full rounded-lg object-contain" />
          <button
            type="button"
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => setLightboxOpen(false)}
          >
            ✕
          </button>
        </div>
      )}
    </article>
  );
}