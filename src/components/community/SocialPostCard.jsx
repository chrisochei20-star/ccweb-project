import { Heart, MessageCircle, Repeat2 } from "lucide-react";
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { createPostReaction, fetchPostReactions } from "../../api/communityApi";
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
  commentDraft,
  onToggleThread,
  onCommentDraft,
  onSubmitComment,
}) {
  const [likeBusy, setLikeBusy] = useState(false);
  const [repostBusy, setRepostBusy] = useState(false);
  const [localReactions, setLocalReactions] = useState(null);

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

  async function handleLike() {
    if (!user?.id) return;
    setLikeBusy(true);
    try {
      await createPostReaction({
        authorUserId: user.id,
        authorDisplayName: user.displayName,
        postId: post.id,
        reaction: "like",
      });
      await loadReactions();
    } catch {
      /* duplicate or network */
    } finally {
      setLikeBusy(false);
    }
  }

  async function handleRepost() {
    if (!user?.id) return;
    setRepostBusy(true);
    try {
      await createPostReaction({
        authorUserId: user.id,
        authorDisplayName: user.displayName,
        postId: post.id,
        reaction: "repost",
      });
      await loadReactions();
    } catch {
      /* ignore */
    } finally {
      setRepostBusy(false);
    }
  }

  const repostCount = localReactions?.filter((x) => x.reaction === "repost").length ?? null;

  return (
    <article className="ccweb-social-post group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.06] to-transparent p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] transition hover:border-ccweb-cyan/25 hover:shadow-[0_12px_40px_-18px_rgba(34,211,238,0.35)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ccweb-cyan/40 to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="flex gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ccweb-cyan/30 to-ccweb-violet/30 text-xs font-bold text-white ring-2 ring-white/10">
          {initials(post.authorDisplayName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-semibold text-white">{post.authorDisplayName || "Member"}</span>
            <span className="text-xs text-ccweb-muted">· {new Date(post.createdAt).toLocaleString()}</span>
          </div>
          <h3 className="mt-1 text-[15px] font-semibold leading-snug text-white">{post.title}</h3>
          <p className="mt-1.5 whitespace-pre-wrap text-[14px] leading-relaxed text-slate-300/95">{post.content}</p>

          <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-white/5 pt-3">
            <button
              type="button"
              disabled={!user || likeBusy}
              onClick={handleLike}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-ccweb-muted transition hover:bg-rose-500/10 hover:text-rose-200 disabled:opacity-40"
            >
              <Heart className="h-3.5 w-3.5" strokeWidth={2} />
              {likeCount != null ? likeCount : "—"}
            </button>
            <button
              type="button"
              disabled={!user || repostBusy}
              onClick={handleRepost}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-ccweb-muted transition hover:bg-ccweb-green/10 hover:text-ccweb-green disabled:opacity-40"
            >
              <Repeat2 className="h-3.5 w-3.5" strokeWidth={2} />
              {repostCount != null ? repostCount : "Boost"}
            </button>
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
                      <span className="text-xs text-ccweb-muted"> · {new Date(c.createdAt).toLocaleString()}</span>
                      <p className="mt-0.5 text-white/90">{c.body}</p>
                    </li>
                  ))}
                </ul>
              )}
              {user ? (
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