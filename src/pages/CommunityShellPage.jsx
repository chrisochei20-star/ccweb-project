import { Hash, Loader2, MessagesSquare, Newspaper, Radio, Sparkles, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
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
import { composerPaddingBottom, useKeyboardInset } from "../hooks/useKeyboardInset";
import { useStaleLoadingGuard } from "../hooks/useStaleLoadingGuard";
import { dedupeById, mergeChatsById } from "../lib/feedMerge";
import { useRealtimeSubscription } from "../hooks/useRealtimeSubscription";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import { PullToRefreshContainer } from "../components/mobile/PullToRefreshContainer";
import { isCapacitorNative } from "../lib/capacitorPlatform";
import { toast } from "../lib/toastBus";
import { getSessionToken } from "../session";
import { formatUserFacingError } from "../lib/userFacingError";
import { EmptyState } from "../components/ui/EmptyState";
import { timeAgo } from "../lib/timeFormat";

const CHANNELS = ["general", "trading", "builders"];

export function CommunityShellPage() {
  const { user, authHydrated } = useOutletContext() || {};
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState("feed");
  const [posts, setPosts] = useState([]);
  const [feedMode, setFeedMode] = useState("latest");
  const [chats, setChats] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const postsLoadStalled = useStaleLoadingGuard(loadingPosts);
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
  const tabRef = useRef(tab);
  tabRef.current = tab;
  const channelRef = useRef(channel);
  channelRef.current = channel;
  const expandedPostRef = useRef(expandedPost);
  expandedPostRef.current = expandedPost;
  const [postingBusy, setPostingBusy] = useState(false);
  const [postImage, setPostImage] = useState(null);
  const [postImagePreview, setPostImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [commentSubmittingId, setCommentSubmittingId] = useState(null);
  const [chatSending, setChatSending] = useState(false);
  const keyboardInset = useKeyboardInset();

  useEffect(() => {
    const postId = (searchParams.get("post") || "").trim();
    if (!postId) return;
    setTab("feed");
    setExpandedPost(postId);
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const loadPosts = useCallback(async () => {
    setLoadingPosts(true);
    setErr(null);
    try {
      const list = await fetchCommunityPosts(feedMode);
      setPosts(dedupeById(list));
      setVisibleCount(12);
    } catch (e) {
      const m = formatUserFacingError(e, "Could not load the feed.");
      setErr(m);
      toast.error(m);
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
      const m = formatUserFacingError(e, "Could not load channel messages.");
      setErr(m);
      toast.error(m);
    } finally {
      setLoadingChats(false);
    }
  }, [channel]);

  const loadPostsRef = useRef(loadPosts);
  loadPostsRef.current = loadPosts;
  const loadChatsRef = useRef(loadChats);
  loadChatsRef.current = loadChats;

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
        if (!cancelled) {
          const m = e.message || "Comments failed";
          setErr(m);
          toast.error(m);
        }
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

  const communityDebounceRef = useRef(null);

  const scheduleFeedReload = useCallback(() => {
    window.clearTimeout(communityDebounceRef.current);
    communityDebounceRef.current = window.setTimeout(() => {
      loadPostsRef.current();
    }, 620);
  }, []);

  useRealtimeSubscription(
    "community:update",
    (payload) => {
      const k = payload?.kind;
      if (k === "post" || k === "reaction") {
        scheduleFeedReload();
      }
      if (k === "comment") {
        scheduleFeedReload();
        const pid = payload.postId;
        if (pid && pid === expandedPostRef.current) {
          void fetchPostComments(pid).then((list) => {
            setCommentsByPost((p) => ({ ...p, [pid]: dedupeById(list) }));
          });
        }
      }
      if (k === "chat" && tabRef.current === "chat" && payload.channel === channelRef.current) {
        void loadChatsRef.current();
      }
    },
    Boolean(authHydrated && user?.id),
    "community-shell-feed"
  );

  useEffect(
    () => () => {
      window.clearTimeout(communityDebounceRef.current);
    },
    []
  );

  async function submitPost(e) {
    e.preventDefault();
    const token = (getSessionToken() || "").trim();
    if (!token) {
      const m = "Sign in to post.";
      setErr(m);
      toast.error(m);
      return;
    }
    if (!user?.id) {
      const m = "Your session is not ready yet. Try again in a moment or sign in again.";
      setErr(m);
      toast.error(m);
      return;
    }
    const title = postTitle.trim();
    const bodyText = postBody.trim();
    if (!title || !bodyText) {
      const m = "Add a headline and body before posting.";
      setErr(m);
      toast.error(m);
      return;
    }
    setErr(null);
    setPostingBusy(true);
    try {
      let imageUrl = null;
      if (postImage) {
        setUploadingImage(true);
        const fd = new FormData();
        fd.append("file", postImage);
        const token = localStorage.getItem("ccweb_session_token") || sessionStorage.getItem("ccweb_session_token");
    const up = await fetch("https://ccweb-api-production-a82c.up.railway.app/api/v1/uploads/media?folder=posts", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: fd
});

if (!up.ok) {
  throw new Error(`Upload failed (${up.status})`);
}

const upData = await up.json();
imageUrl = upData.url || null;

        setUploadingImage(false);
      }
      const created = await createCommunityPost({
        title,
        content: bodyText,
        tags: [],
        imageUrl,
      });
      setPostImage(null);
      setPostImagePreview(null);
      setPostTitle("");
      setPostBody("");
      if (created?.id) {
        if (feedMode === "latest") {
          setPosts((prev) => {
            if (prev.some((p) => p.id === created.id)) return prev;
            const row = { ...created, commentCount: created.commentCount ?? 0 };
            return [row, ...prev];
          });
        } else {
          await loadPosts();
        }
      } else {
        await loadPosts();
      }
      toast.success("Posted to the feed.");
    } catch (e) {
      const m = e.message || "Post failed";
      setErr(m);
      toast.error(m);
    } finally {
      setPostingBusy(false);
    }
  }

  function toggleThread(postId) {
    setExpandedPost((cur) => (cur === postId ? null : postId));
  }

  async function submitComment(postId) {
    const token = getSessionToken();
    if (!token) {
      toast.error("Sign in to comment.");
      return;
    }
    const text = (commentDraft[postId] || "").trim();
    if (!text) return;
    setErr(null);
    const tempId = `tmp_comment_${Date.now()}`;
    const optimistic = {
      id: tempId,
      postId,
      authorUserId: user?.id,
      authorDisplayName: user?.displayName || user?.email || "You",
      body: text,
      createdAt: new Date().toISOString(),
    };
    setCommentSubmittingId(postId);
    setCommentsByPost((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), optimistic],
    }));
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p))
    );
    setCommentDraft((prev) => ({ ...prev, [postId]: "" }));
    try {
      const row = await createPostComment(postId, {
        body: text,
      });
      const created = row && typeof row === "object" && row.id ? row : null;
      if (created) {
        setCommentsByPost((prev) => {
          const cur = (prev[postId] || []).filter((c) => c.id !== tempId);
          if (cur.some((c) => c.id === created.id)) return { ...prev, [postId]: cur };
          return { ...prev, [postId]: [...cur, created] };
        });
      } else {
        const list = await fetchPostComments(postId);
        setCommentsByPost((prev) => ({ ...prev, [postId]: list }));
      }
    } catch (e) {
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).filter((c) => c.id !== tempId),
      }));
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, commentCount: Math.max(0, (p.commentCount || 0) - 1) } : p))
      );
      setCommentDraft((prev) => ({ ...prev, [postId]: text }));
      const m = e.message || "Comment failed";
      setErr(m);
      toast.error(m);
    } finally {
      setCommentSubmittingId(null);
    }
  }

  async function sendChat(e) {
    e.preventDefault();
    const token = getSessionToken();
    if (!token) {
      toast.error("Sign in to chat.");
      return;
    }
    const trimmed = chatMsg.trim();
    if (!trimmed) return;
    setErr(null);
    const tempId = `tmp_chat_${Date.now()}`;
    const optimistic = {
      id: tempId,
      channel,
      authorUserId: user?.id,
      authorDisplayName: user?.displayName || user?.email || "You",
      message: trimmed,
      createdAt: new Date().toISOString(),
    };
    setChatMsg("");
      setChats((prev) => mergeChatsById(prev, [optimistic]));
    setChatSending(true);
    try {
      const chat = await createCommunityChat({
        channel,
        message: trimmed,
      });
      if (chat?.id) {
        setChats((prev) => prev.map((c) => (c.id === tempId ? chat : c)));
      } else {
        await loadChats();
      }
    } catch (e) {
      setChats((prev) => prev.filter((c) => c.id !== tempId));
      setChatMsg(trimmed);
      const m = e.message || "Send failed";
      setErr(m);
      toast.error(m);
    } finally {
      setChatSending(false);
    }
  }

  const shownPosts = posts.slice(0, visibleCount);
  const nativeShell = isCapacitorNative();

  const { pulling, refreshing } = usePullToRefresh(loadPosts, {
    disabled: !nativeShell || tab !== "feed" || loadingPosts,
    useDocumentScroll: true,
  });

  return (
    <PullToRefreshContainer pulling={pulling} refreshing={refreshing}>
    <div className="mx-auto max-w-3xl space-y-5 px-3 pb-6 pt-3 md:max-w-2xl">
      <header className="ccweb-stagger">
        <p className="ccweb-kicker flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-ccweb-cyan">
          <Radio className="h-3.5 w-3.5" aria-hidden />
          Live network
        </p>
        <h1 className="ccweb-display-heading mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl">Community</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-ccweb-muted">
          Community feed and live rooms for builders and learners — stay connected in one place.
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
          {authHydrated && user ? (
            <div
              className="sticky bottom-0 z-30 -mx-3 border-t border-white/10 bg-[#050810]/95 px-3 pt-3 shadow-[0_-8px_30px_rgba(0,0,0,0.45)] backdrop-blur-md md:static md:z-0 md:mx-0 md:border-t-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none"
              style={{ paddingBottom: composerPaddingBottom(keyboardInset) }}
            >
              <form
                onSubmit={submitPost}
                className="ccweb-card-premium space-y-3 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-transparent p-5 md:border-white/10"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Sparkles className="h-4 w-4 text-ccweb-cyan" aria-hidden />
                  Compose
                </div>
                <input
                  className="ccweb-input min-h-[44px]"
                  placeholder="Headline"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  disabled={postingBusy}
                />
                <textarea
                  className="ccweb-input min-h-[110px] resize-y"
                  placeholder="What are you shipping, learning, or seeing on-chain?"
                  value={postBody}
                  onChange={(e) => setPostBody(e.target.value)}
                  disabled={postingBusy}
                />
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer flex items-center gap-1 text-xs text-ccweb-cyan border border-ccweb-cyan/30 rounded-lg px-3 py-2 hover:bg-ccweb-cyan/10">
                    <span>📷 Photo</span>
                    <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => { const f = e.target.files[0]; if (f) { setPostImage(f); setPostImagePreview(URL.createObjectURL(f)); } }} />
                  </label>
                  {postImagePreview && <img src={postImagePreview} alt="preview" className="h-10 w-10 rounded-lg object-cover" />}
                </div>
                <button type="submit" className="ccweb-gradient-btn inline-flex min-h-[44px] items-center justify-center gap-2 text-sm disabled:opacity-50" disabled={postingBusy || uploadingImage}>
                  {postingBusy ? (
                    <>
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                      Posting…
                    </>
                  ) : (
                    "Post to feed"
                  )}
                </button>
              </form>
            </div>
          ) : !authHydrated ? (
            <div className="ccweb-glass flex items-center justify-center gap-2 rounded-2xl p-5 text-sm text-ccweb-muted">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
              Checking session…
            </div>
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

            {loadingPosts && postsLoadStalled && (
              <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-center text-sm text-rose-100">
                The feed is taking too long to load.{" "}
                <button type="button" className="font-medium text-ccweb-cyan underline" onClick={() => loadPosts()}>
                  Retry
                </button>
              </p>
            )}
            {loadingPosts && !postsLoadStalled && (
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
              <EmptyState
                icon={Newspaper}
                title="No posts yet"
                description="Be the first to share — post a win, ask a question, or drop alpha."
                actionLabel={user ? undefined : "Sign in to post"}
                actionTo={user ? undefined : "/login"}
              />
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
                    commentSubmitting={commentSubmittingId === p.id}
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
        <section className="ccweb-card-premium overflow-hidden rounded-2xl border border-white/10 shadow-[0_0_40px_-16px_rgba(167,139,250,0.35)]">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-gradient-to-r from-ccweb-violet/15 to-transparent px-4 py-3">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-ccweb-violet" />
              <span className="text-sm font-semibold text-white">Channels</span>
            </div>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">Live</span>
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
            {loadingChats && (
              <div className="space-y-3 py-2" role="status" aria-label="Loading messages">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-2">
                    <Skeleton className="h-8 w-8 shrink-0 rounded-md" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-24 rounded-md" />
                      <Skeleton className="h-10 w-full rounded-2xl" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!loadingChats &&
              [...chats].reverse().map((m) => (
                <div key={m.id} className="mb-2 flex gap-2">
                  <div className="mt-0.5 h-8 w-8 shrink-0 rounded-md bg-gradient-to-br from-ccweb-violet/40 to-ccweb-cyan/30" />
                  <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-white/8 bg-white/[0.04] px-3 py-2">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-sm font-semibold text-ccweb-cyan">{m.authorDisplayName}</span>
                      <span className="text-[10px] text-ccweb-muted">{timeAgo(m.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-slate-200">{m.message}</p>
                  </div>
                </div>
              ))}
          </div>
          {authHydrated && user ? (
            <form onSubmit={sendChat} className="flex gap-2 border-t border-white/10 bg-black/40 p-3">
              <input
                className="ccweb-input min-h-[44px] flex-1 text-sm"
                placeholder={`Message #${channel}`}
                value={chatMsg}
                onChange={(e) => setChatMsg(e.target.value)}
                disabled={chatSending}
              />
              <button type="submit" className="ccweb-gradient-btn inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 text-sm disabled:opacity-50" disabled={chatSending}>
                {chatSending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : "Send"}
              </button>
            </form>
          ) : !authHydrated ? (
            <p className="flex items-center justify-center gap-2 border-t border-white/10 p-4 text-center text-sm text-ccweb-muted">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
              Checking session…
            </p>
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
    </PullToRefreshContainer>
  );
}
