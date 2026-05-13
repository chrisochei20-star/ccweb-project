import { Hash, MessagesSquare, Newspaper, Radio, Sparkles, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  createCommunityChat,
  createCommunityPost,
  createPostComment,
  fetchCommunityChats,
  fetchCommunityPosts,
  fetchPostComments,
} from "../api/communityApi";
import { SocialPostCard } from "../components/community/SocialPostCard";
import { Skeleton } from "../components/ui/Skeleton";

const CHANNELS = ["general", "trading", "builders"];

export function CommunityShellPage() {
  const { user } = useOutletContext() || {};
  const [tab, setTab] = useState("feed");
  const [posts, setPosts] = useState([]);
  const [feedMode, setFeedMode] = useState("latest");
  const [chats, setChats] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingChats, setLoadingChats] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postBody, setPostBody] = useState("");
  const [chatMsg, setChatMsg] = useState("");
  const [channel, setChannel] = useState("general");
  const [expandedPost, setExpandedPost] = useState(null);
  const [commentsByPost, setCommentsByPost] = useState({});
  const [commentDraft, setCommentDraft] = useState({});
  const [commentsLoadingId, setCommentsLoadingId] = useState(null);
  const [err, setErr] = useState(null);
  const [visibleCount, setVisibleCount] = useState(12);
  const sentinelRef = useRef(null);

  const loadPosts = useCallback(async () => {
    setLoadingPosts(true);
    setErr(null);
    try {
      const list = await fetchCommunityPosts(feedMode);
      setPosts(list);
      setVisibleCount(12);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoadingPosts(false);
    }
  }, [feedMode]);

  const loadChats = useCallback(async () => {
    setLoadingChats(true);
    setErr(null);
    try {
      const list = await fetchCommunityChats(channel);
      setChats(list);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoadingChats(false);
    }
  }, [channel]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    if (tab === "chat") loadChats();
  }, [tab, loadChats]);

  useEffect(() => {
    if (!expandedPost) return;
    let cancelled = false;
    (async () => {
      setCommentsLoadingId(expandedPost);
      setErr(null);
      try {
        const list = await fetchPostComments(expandedPost);
        if (!cancelled) setCommentsByPost((p) => ({ ...p, [expandedPost]: list }));
      } catch (e) {
        if (!cancelled) setErr(e.message);
      } finally {
        if (!cancelled) setCommentsLoadingId(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [expandedPost]);

  useEffect(() => {
    if (tab !== "feed" || loadingPosts) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setVisibleCount((c) => Math.min(c + 10, posts.length));
      },
      { rootMargin: "120px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [tab, loadingPosts, posts.length]);

  async function submitPost(e) {
    e.preventDefault();
    if (!user?.id || !postTitle.trim() || !postBody.trim()) return;
    setErr(null);
    try {
      await createCommunityPost({
        authorUserId: user.id,
        authorDisplayName: user.displayName,
        title: postTitle.trim(),
        content: postBody.trim(),
        tags: [],
      });
      setPostTitle("");
      setPostBody("");
      await loadPosts();
    } catch (e) {
      setErr(e.message);
    }
  }

  function toggleThread(postId) {
    setExpandedPost((cur) => (cur === postId ? null : postId));
  }

  async function submitComment(postId) {
    if (!user?.id) return;
    const text = (commentDraft[postId] || "").trim();
    if (!text) return;
    setErr(null);
    try {
      await createPostComment(postId, {
        authorUserId: user.id,
        authorDisplayName: user.displayName,
        body: text,
      });
      setCommentDraft((prev) => ({ ...prev, [postId]: "" }));
      const list = await fetchPostComments(postId);
      setCommentsByPost((prev) => ({ ...prev, [postId]: list }));
    } catch (e) {
      setErr(e.message);
    }
  }

  async function sendChat(e) {
    e.preventDefault();
    if (!user?.id || !chatMsg.trim()) return;
    setErr(null);
    try {
      await createCommunityChat({
        authorUserId: user.id,
        authorDisplayName: user.displayName,
        channel,
        message: chatMsg.trim(),
      });
      setChatMsg("");
      await loadChats();
    } catch (e) {
      setErr(e.message);
    }
  }

  const shownPosts = posts.slice(0, Math.max(visibleCount, posts.length));

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-3 pb-6 pt-3 md:max-w-2xl">
      <header className="ccweb-stagger">
        <p className="ccweb-kicker flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-ccweb-cyan">
          <Radio className="h-3.5 w-3.5" aria-hidden />
          Live network
        </p>
        <h1 className="ccweb-display-heading mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl">Community</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-ccweb-muted">
          X-style feed for builders and learners. Discord-style rooms for quick vibes. Everything syncs to your Render API.
        </p>
      </header>

      <div className="flex gap-2 rounded-2xl border border-white/10 bg-black/25 p-1 shadow-inner">
        <button
          type="button"
          onClick={() => setTab("feed")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
            tab === "feed" ? "bg-white/12 text-white shadow-[0_0_20px_rgba(34,211,238,0.12)]" : "text-ccweb-muted hover:bg-white/6"
          }`}
        >
          <Newspaper className="h-4 w-4" />
          Feed
        </button>
        <button
          type="button"
          onClick={() => setTab("chat")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
            tab === "chat" ? "bg-white/12 text-white shadow-[0_0_20px_rgba(167,139,250,0.12)]" : "text-ccweb-muted hover:bg-white/6"
          }`}
        >
          <MessagesSquare className="h-4 w-4" />
          Rooms
        </button>
      </div>

      {err && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100" role="alert">
          {err}
        </div>
      )}

      {tab === "feed" && (
        <>
          {user ? (
            <form
              onSubmit={submitPost}
              className="ccweb-card-premium space-y-3 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-transparent p-5"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Sparkles className="h-4 w-4 text-ccweb-cyan" />
                Compose
              </div>
              <input className="ccweb-input" placeholder="Headline" value={postTitle} onChange={(e) => setPostTitle(e.target.value)} />
              <textarea
                className="ccweb-input min-h-[110px] resize-y"
                placeholder="What are you shipping, learning, or seeing on-chain?"
                value={postBody}
                onChange={(e) => setPostBody(e.target.value)}
              />
              <button type="submit" className="ccweb-gradient-btn text-sm">
                Post to feed
              </button>
            </form>
          ) : (
            <div className="ccweb-glass rounded-2xl p-5 text-center">
              <p className="text-sm text-ccweb-muted">
                <Link to="/login" className="font-medium text-ccweb-cyan underline">
                  Sign in
                </Link>{" "}
                to compose and react.
              </p>
            </div>
          )}

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-ccweb-muted">Timeline</h2>
              <div className="flex gap-1 rounded-full border border-white/10 bg-black/35 p-0.5">
                <button
                  type="button"
                  onClick={() => setFeedMode("latest")}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${feedMode === "latest" ? "bg-white/15 text-white" : "text-ccweb-muted"}`}
                >
                  Latest
                </button>
                <button
                  type="button"
                  onClick={() => setFeedMode("trending")}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                    feedMode === "trending" ? "bg-white/15 text-white" : "text-ccweb-muted"
                  }`}
                >
                  <TrendingUp className="h-3.5 w-3.5" /> Trending
                </button>
              </div>
            </div>

            {loadingPosts && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="ccweb-glass rounded-2xl p-4">
                    <div className="flex gap-3">
                      <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-40 rounded-md" />
                        <Skeleton className="h-4 w-full rounded-md" />
                        <Skeleton className="h-16 w-full rounded-lg" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loadingPosts && posts.length === 0 && (
              <p className="rounded-2xl border border-dashed border-white/15 bg-black/20 px-4 py-8 text-center text-sm text-ccweb-muted">
                No posts yet — start the thread.
              </p>
            )}

            <ul className="space-y-3">
              {shownPosts.map((p) => (
                <li key={p.id}>
                  <SocialPostCard
                    post={p}
                    user={user}
                    expanded={expandedPost === p.id}
                    comments={commentsByPost[p.id]}
                    commentsLoading={commentsLoadingId === p.id}
                    commentDraft={commentDraft[p.id]}
                    onToggleThread={toggleThread}
                    onCommentDraft={(id, v) => setCommentDraft((prev) => ({ ...prev, [id]: v }))}
                    onSubmitComment={submitComment}
                  />
                </li>
              ))}
            </ul>
            {!loadingPosts && posts.length > visibleCount && <div ref={sentinelRef} className="h-4" aria-hidden />}
            {!loadingPosts && posts.length > 0 && visibleCount >= posts.length && (
              <p className="pb-4 text-center text-xs text-ccweb-muted">You&apos;re caught up.</p>
            )}
          </section>
        </>
      )}

      {tab === "chat" && (
        <section className="ccweb-card-premium overflow-hidden rounded-2xl border border-white/10">
          <div className="flex items-center gap-2 border-b border-white/10 bg-black/30 px-4 py-3">
            <Hash className="h-4 w-4 text-ccweb-violet" />
            <span className="text-sm font-semibold text-white">Channels</span>
          </div>
          <div className="flex flex-wrap gap-2 border-b border-white/5 px-4 py-3">
            {CHANNELS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setChannel(c)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
                  channel === c ? "bg-ccweb-violet/25 text-ccweb-violet ring-1 ring-ccweb-violet/40" : "border border-white/12 text-ccweb-muted hover:border-white/25"
                }`}
              >
                #{c}
              </button>
            ))}
          </div>
          <div className="flex max-h-[420px] min-h-[220px] flex-col-reverse overflow-y-auto bg-[#070b14] px-3 py-3">
            {loadingChats && <p className="text-center text-sm text-ccweb-muted">Loading messages…</p>}
            {!loadingChats &&
              [...chats].reverse().map((m) => (
                <div key={m.id} className="mb-2 flex gap-2">
                  <div className="mt-0.5 h-8 w-8 shrink-0 rounded-md bg-gradient-to-br from-ccweb-violet/40 to-ccweb-cyan/30" />
                  <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-white/8 bg-white/[0.04] px-3 py-2">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-sm font-semibold text-ccweb-cyan">{m.authorDisplayName}</span>
                      <span className="text-[10px] uppercase tracking-wide text-ccweb-muted">
                        {new Date(m.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-slate-200">{m.message}</p>
                  </div>
                </div>
              ))}
          </div>
          {user ? (
            <form onSubmit={sendChat} className="flex gap-2 border-t border-white/10 bg-black/40 p-3">
              <input
                className="ccweb-input flex-1 text-sm"
                placeholder={`Message #${channel}`}
                value={chatMsg}
                onChange={(e) => setChatMsg(e.target.value)}
              />
              <button type="submit" className="ccweb-gradient-btn shrink-0 text-sm">
                Send
              </button>
            </form>
          ) : (
            <p className="border-t border-white/10 p-4 text-center text-sm text-ccweb-muted">
              <Link to="/login" className="text-ccweb-cyan underline">
                Sign in
              </Link>{" "}
              to chat.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
