import { Heart, MessageCircle, Repeat2, Share2 } from "lucide-react";
import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPostReaction, fetchPostReactions } from "../../api/communityApi";
import { getSessionToken } from "../../session";
import { toast } from "../../lib/toastBus";
import { timeAgo } from "../../lib/timeFormat";
import { formatUserFacingError } from "../../lib/userFacingError";
import { SkeletonText } from "../ui/Skeleton";
import { ProfileActionBar } from "../profile/ProfileActionBar";
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
  const navigate = useNavigate();
  const [likeBusy, setLikeBusy] = useState(false);
  const [repostBusy, setRepostBusy] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [localReactions, setLocalReactions] = useState(null);
  const [likeBump, setLikeBump] = useState(0);
  const [repostBump, setRepostBump] = useState(0);
  const canInteract = Boolean(getSessionToken());

  function goToAuthorProfile(e) {
    e.stopPropagation();
    if (post.authorSlug) {
      navigate(`/u/${post.authorSlug}`);
    } else if (post.authorUserId && post.authorUserId === user?.id) {
      navigate(`/u/${post.authorSlug}`);
    }
  }

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
        {/* Clickable avatar → profile (X-style behavior) */}
        <button
          type="button"
          aria-label={`View ${post.authorDisplayName || "Member"}'s profile`}
          onClick={goToAuthorProfile}
          className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-ccweb-cyan/30 to-ccweb-violet/30 text-xs font-bold text-white ring-2 ring-white/10 transition hover:ring-ccweb-cyan/50 focus:outline-none focus:ring-ccweb-cyan/60"
        >
          {post.authorAvatarUrl ? (
            <img src={post.authorAvatarUrl} alt={post.authorDisplayName || "Member"} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            initials(post.authorDisplayName)
          )}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            {/* Clickable name → profile */}
            <button
              type="button"
              onClick={goToAuthorProfile}
              className="font-semibold text-white hover:text-ccweb-cyan transition focus:outline-none"
            >
              {post.authorDisplayName || "Member"}
            </button>
            {post.authorSlug && (
              <span className="text-xs text-ccweb-muted/70">@{post.authorSlug}</span>
            )}
            <span className="text-xs text-ccweb-muted">· {timeAgo(post.createdAt)}</span>
          </div>
      

<ProfileActionBar
  profile={{
    id: post.authorUserId,
    slug: post.authorSlug,
  }}
/>

   
          <h3 className="mt-1 text-[15px] font-semibold leading-snug text-white">{post.title}</h3>
          <p className="mt-1.5 whitespace-pre-wrap text-[14px] leading-relaxed text-slate-300/95">{post.content}</p>
          {post.imageUrl && (
            <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
              <img src={post.imageUrl} alt="Post media" className="w-full max-h-[400px] object-cover cursor-pointer" loading="lazy" onClick={() => setLightboxOpen(true)} />
            </div>
          )}

          <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
            <button
              type="button"
              onClick={() => {
                if (typeof onToggleThread === "function") onToggleThread(post.id);
                if (!expanded) void loadReactions();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-ccweb-muted transition hover:text-ccweb-cyan group"
            >
              <MessageCircle className="h-4 w-4 group-hover:text-ccweb-cyan" strokeWidth={2} />
              <span>{post.commentCount ?? 0}</span>
            </button>
            <button
              type="button"
              disabled={!canInteract || repostBusy}
              onClick={handleRepost}
              className={`inline-flex items-center gap-1.5 text-xs font-medium transition disabled:opacity-40 group ${
                userReposted ? "text-ccweb-green" : "text-ccweb-muted hover:text-ccweb-green"
              }`}
            >
              <Repeat2 className="h-4 w-4" strokeWidth={2} />
              <span>{repostCount != null ? repostCount : 0}</span>
            </button>
            <button
              type="button"
              disabled={!canInteract || likeBusy}
              onClick={handleLike}
              className={`inline-flex items-center gap-1.5 text-xs font-medium transition disabled:opacity-40 group ${
                userLiked ? "text-rose-400" : "text-ccweb-muted hover:text-rose-400"
              }`}
            >
              <Heart className={`h-4 w-4 ${userLiked ? "fill-rose-400" : ""}`} strokeWidth={2} />
              <span>{likeCount != null ? likeCount : 0}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const shareUrl = post.authorSlug
                  ? `${window.location.origin}/u/${post.authorSlug}`
                  : window.location.href;
                if (navigator.share) {
                  navigator.share({ title: post.title, text: post.content, url: shareUrl });
                } else {
                  navigator.clipboard?.writeText(shareUrl);
                  toast.success("Link copied!");
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-ccweb-muted transition hover:text-ccweb-cyan"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>

          {expanded && (
            <div className="mt-2 space-y-0 border-t border-white/5">
              {commentsLoading && (
                <div className="py-3 pl-4">
                  <SkeletonText lines={2} />
                </div>
              )}
              {!commentsLoading && (comments || []).map((c) => (
                <div key={c.id} className="flex gap-3 border-b border-white/5 px-1 py-3 last:border-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ccweb-cyan/30 to-ccweb-violet/30 text-[10px] font-bold text-white">
                    {initials(c.authorDisplayName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-white">{c.authorDisplayName}</span>
                      <span className="text-[11px] text-ccweb-muted">{timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-white/85 leading-relaxed">{c.body}</p>
                  </div>
                </div>
              ))}
              {!commentsLoading && (comments || []).length === 0 && (
                <p className="py-3 text-center text-xs text-ccweb-muted">No replies yet — be first!</p>
              )}
              {canInteract ? (
                <div className="flex gap-2 pt-2 pb-1">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ccweb-cyan/30 to-ccweb-violet/30 text-[10px] font-bold text-white">
                    {initials(user?.displayName || "Me")}
                  </div>
                  <div className="flex flex-1 gap-2">
                    <input
                      className="ccweb-input min-h-[36px] flex-1 rounded-full px-4 text-sm"
                      placeholder="Post your reply…"
                      value={commentDraft || ""}
                      onChange={(e) => onCommentDraft(post.id, e.target.value)}
                      disabled={commentSubmitting}
                    />
                    <button
                      type="button"
                      className="rounded-full bg-ccweb-cyan px-4 py-1.5 text-xs font-bold text-[#061329] disabled:opacity-50"
                      onClick={() => onSubmitComment(post.id)}
                      disabled={commentSubmitting || !commentDraft?.trim()}
                    >
                      {commentSubmitting ? "…" : "Reply"}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="py-2 text-xs text-ccweb-muted">
                  <Link to="/login" className="text-ccweb-cyan underline">Sign in</Link> to reply.
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
