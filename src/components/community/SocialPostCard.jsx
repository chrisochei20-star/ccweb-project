import { Bookmark, Flag, Heart, MessageCircle, Repeat2, Share2 } from "lucide-react";
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { createCommunityPost, createPostReaction, fetchPostReactions, setCommunityBookmark } from "../../api/communityApi";
import { submitTrustReport } from "../../api/trustApi";
import { assetsUrl } from "../../config/env";
import { getSessionToken } from "../../session";
import { toast } from "../../lib/toastBus";
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

function isVideoUrl(url) {
  const u = (url || "").toLowerCase();
  return /\.(mp4|webm|mov)(\?|$)/i.test(u) || /\/video\//i.test(u) || u.includes("resource_type=video");
}

export function SocialPostCard({
  post,
  user: _user,
  expanded,
  comments,
  commentsLoading,
  commentDraft,
  onToggleThread,
  onCommentDraft,
  onSubmitComment,
  bookmarked = false,
  onBookmarkChange,
  onQuoteRepost,
  compactThread = false,
}) {
  const [likeBusy, setLikeBusy] = useState(false);
  const [repostBusy, setRepostBusy] = useState(false);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);
  const [reportBusy, setReportBusy] = useState(false);
  const [localReactions, setLocalReactions] = useState(null);
  const canInteract = Boolean(getSessionToken());
  const mediaUrls = post.mediaUrls || [];
  const tags = post.hashtags || post.tags || [];

  const loadReactions = useCallback(async () => {
    try {
      const r = await fetchPostReactions(post.id);
      setLocalReactions(r);
    } catch {
      /* ignore */
    }
  }, [post.id]);

  const likeCount =
    localReactions != null
      ? localReactions.filter((x) => x.reaction === "like").length
      : post.reactionCount != null
        ? post.reactionCount
        : null;

  async function handleReportPost() {
    if (!canInteract) return;
    const details = typeof window !== "undefined" ? window.prompt("Optional details for moderators", "") : "";
    if (details === null) return;
    setReportBusy(true);
    try {
      await submitTrustReport({ targetType: "post", targetId: post.id, reasonCode: "other", details: details || "" });
      toast.success("Thanks — moderators will review this report.");
    } catch (e) {
      toast.error(e.message || "Report failed");
    } finally {
      setReportBusy(false);
    }
  }

  async function handleReportComment(commentId) {
    if (!canInteract) return;
    const details = typeof window !== "undefined" ? window.prompt("Optional details for moderators", "") : "";
    if (details === null) return;
    setReportBusy(true);
    try {
      await submitTrustReport({ targetType: "comment", targetId: commentId, reasonCode: "other", details: details || "" });
      toast.success("Comment reported.");
    } catch (e) {
      toast.error(e.message || "Report failed");
    } finally {
      setReportBusy(false);
    }
  }

  async function handleLike() {
    if (!getSessionToken()) return;
    setLikeBusy(true);
    try {
      await createPostReaction({
        postId: post.id,
        reaction: "like",
      });
      await loadReactions();
    } catch (e) {
      toast.error(e.message || "Could not like");
    } finally {
      setLikeBusy(false);
    }
  }

  async function handleBoostReaction() {
    if (!getSessionToken()) return;
    setRepostBusy(true);
    try {
      await createPostReaction({
        postId: post.id,
        reaction: "repost",
      });
      await loadReactions();
    } catch (e) {
      toast.error(e.message || "Could not boost");
    } finally {
      setRepostBusy(false);
    }
  }

  async function handleBookmark() {
    if (!canInteract) return;
    setBookmarkBusy(true);
    try {
      await setCommunityBookmark(post.id, !bookmarked);
      onBookmarkChange?.(post.id, !bookmarked);
      toast.success(bookmarked ? "Removed from saved" : "Saved");
    } catch (e) {
      toast.error(e.message || "Bookmark failed");
    } finally {
      setBookmarkBusy(false);
    }
  }

  async function handleQuoteRepost() {
    if (!canInteract) return;
    if (onQuoteRepost) {
      onQuoteRepost(post);
      return;
    }
    setRepostBusy(true);
    try {
      await createCommunityPost({
        title: "Repost",
        content: post.content?.slice(0, 4000) || " ",
        tags: [],
        mediaUrls: [],
        repostOfId: post.id,
      });
      toast.success("Reposted to feed");
    } catch (e) {
      toast.error(e.message || "Repost failed");
    } finally {
      setRepostBusy(false);
    }
  }

  const repostCount = localReactions?.filter((x) => x.reaction === "repost").length ?? null;

  return (
    <article className="ccweb-social-post group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.06] to-transparent p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] transition hover:border-ccweb-cyan/25 hover:shadow-[0_12px_40px_-18px_rgba(34,211,238,0.35)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ccweb-cyan/40 to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="flex gap-3">
        <Link
          to={post.authorUserId ? `/p/${encodeURIComponent(post.authorUserId)}` : "#"}
          onClick={(e) => {
            if (!post.authorUserId) e.preventDefault();
          }}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ccweb-cyan/30 to-ccweb-violet/30 text-xs font-bold text-white ring-2 ring-white/10"
        >
          {initials(post.authorDisplayName)}
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <Link
              to={post.authorUserId ? `/p/${encodeURIComponent(post.authorUserId)}` : "#"}
              onClick={(e) => {
                if (!post.authorUserId) e.preventDefault();
              }}
              className="font-semibold text-white hover:underline"
            >
              {post.authorDisplayName || "Member"}
            </Link>
            <span className="text-xs text-ccweb-muted">· {new Date(post.createdAt).toLocaleString()}</span>
          </div>
          <h3 className="mt-1 text-[15px] font-semibold leading-snug text-white">{post.title}</h3>
          <p className="mt-1.5 whitespace-pre-wrap text-[14px] leading-relaxed text-slate-300/95">{post.content}</p>

          {post.originalPost && (
            <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3 text-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ccweb-muted">Original post</p>
              <p className="mt-1 font-medium text-white/90">{post.originalPost.authorDisplayName}</p>
              <p className="mt-1 line-clamp-3 text-ccweb-muted">{post.originalPost.content}</p>
            </div>
          )}

          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.slice(0, 8).map((t) => (
                <span key={t} className="rounded-full bg-white/8 px-2 py-0.5 text-[11px] text-ccweb-cyan">
                  #{t}
                </span>
              ))}
            </div>
          )}

          {mediaUrls.length > 0 && (
            <div className={`mt-3 grid gap-2 ${mediaUrls.length === 1 ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-2"}`}>
              {mediaUrls.map((url) =>
                isVideoUrl(url) ? (
                  <video key={url} controls className="max-h-64 w-full rounded-xl border border-white/10 bg-black/40" src={assetsUrl(url)} />
                ) : (
                  <a key={url} href={assetsUrl(url)} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-white/10">
                    <img src={assetsUrl(url)} alt="" className="max-h-64 w-full object-cover" loading="lazy" />
                  </a>
                )
              )}
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-white/5 pt-3">
            <button
              type="button"
              disabled={!canInteract || likeBusy}
              onClick={handleLike}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-ccweb-muted transition hover:bg-rose-500/10 hover:text-rose-200 disabled:opacity-40"
            >
              <Heart className="h-3.5 w-3.5" strokeWidth={2} />
              {likeCount != null ? likeCount : "—"}
            </button>
            <button
              type="button"
              disabled={!canInteract || repostBusy}
              onClick={handleBoostReaction}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-ccweb-muted transition hover:bg-ccweb-green/10 hover:text-ccweb-green disabled:opacity-40"
              title="Boost (reaction)"
            >
              <Repeat2 className="h-3.5 w-3.5" strokeWidth={2} />
              {repostCount != null ? repostCount : "Boost"}
            </button>
            <button
              type="button"
              disabled={!canInteract || repostBusy}
              onClick={handleQuoteRepost}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-ccweb-muted transition hover:bg-ccweb-cyan/10 hover:text-ccweb-cyan disabled:opacity-40"
              title="Quote repost"
            >
              <Share2 className="h-3.5 w-3.5" strokeWidth={2} />
              Repost
            </button>
            <button
              type="button"
              disabled={!canInteract || bookmarkBusy}
              onClick={handleBookmark}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition disabled:opacity-40 ${
                bookmarked ? "text-ccweb-cyan" : "text-ccweb-muted hover:bg-white/8"
              }`}
              title="Save"
            >
              <Bookmark className="h-3.5 w-3.5" strokeWidth={2} fill={bookmarked ? "currentColor" : "none"} />
            </button>
            <button
              type="button"
              disabled={!canInteract || reportBusy}
              onClick={handleReportPost}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-ccweb-muted transition hover:bg-amber-500/10 hover:text-amber-200 disabled:opacity-40"
              title="Report post"
            >
              <Flag className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
            {!compactThread && (
              <button
                type="button"
                onClick={() => {
                  onToggleThread(post.id);
                  if (!expanded) void loadReactions();
                }}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-ccweb-muted transition hover:bg-white/8 hover:text-ccweb-cyan"
              >
                <MessageCircle className="h-3.5 w-3.5" strokeWidth={2} />
                {expanded ? "Hide" : "Thread"} · {post.commentCount ?? 0}
              </button>
            )}
          </div>

          {expanded && !compactThread && (
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
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium text-ccweb-cyan">{c.authorDisplayName}</span>
                        <button
                          type="button"
                          className="text-[11px] text-amber-200/80 underline-offset-2 hover:underline"
                          disabled={!canInteract || reportBusy}
                          onClick={() => handleReportComment(c.id)}
                        >
                          Report
                        </button>
                      </div>
                      <span className="text-xs text-ccweb-muted"> · {new Date(c.createdAt).toLocaleString()}</span>
                      <p className="mt-0.5 text-white/90">{c.body}</p>
                    </li>
                  ))}
                </ul>
              )}
              {canInteract ? (
                <div className="mt-3 flex gap-2">
                  <input
                    className="ccweb-input flex-1 text-sm"
                    placeholder="Post your reply…"
                    value={commentDraft || ""}
                    onChange={(e) => onCommentDraft(post.id, e.target.value)}
                  />
                  <button type="button" className="ccweb-outline-btn shrink-0 text-sm" onClick={() => onSubmitComment(post.id)}>
                    Reply
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
    </article>
  );
}
