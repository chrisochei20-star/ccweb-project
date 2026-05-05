import { MessageCircle, MessagesSquare, Newspaper, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";

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
  const [err, setErr] = useState(null);

  const loadPosts = useCallback(async () => {
    setLoadingPosts(true);
    setErr(null);
    try {
      const path = feedMode === "trending" ? "/api/community/posts/trending" : "/api/community/posts";
      const res = await fetch(path);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load posts");
      setPosts(data.posts || []);
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
      const q = channel ? `?channel=${encodeURIComponent(channel)}` : "";
      const res = await fetch(`/api/community/chats${q}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load chat");
      setChats(data.chats || []);
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

  async function submitPost(e) {
    e.preventDefault();
    if (!user?.id || !postTitle.trim() || !postBody.trim()) return;
    setErr(null);
    try {
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorUserId: user.id,
          authorDisplayName: user.displayName,
          title: postTitle.trim(),
          content: postBody.trim(),
          tags: [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not post");
      setPostTitle("");
      setPostBody("");
      await loadPosts();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function openComments(postId) {
    setExpandedPost(postId);
    if (commentsByPost[postId]) return;
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Comments failed");
      setCommentsByPost((prev) => ({ ...prev, [postId]: data.comments || [] }));
    } catch (e) {
      setErr(e.message);
    }
  }

  async function submitComment(postId) {
    if (!user?.id) return;
    const text = (commentDraft[postId] || "").trim();
    if (!text) return;
    setErr(null);
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorUserId: user.id,
          authorDisplayName: user.displayName,
          body: text,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Comment failed");
      setCommentDraft((prev) => ({ ...prev, [postId]: "" }));
      const listRes = await fetch(`/api/community/posts/${postId}/comments`);
      const listData = await listRes.json();
      setCommentsByPost((prev) => ({ ...prev, [postId]: listData.comments || [] }));
    } catch (e) {
      setErr(e.message);
    }
  }

  async function sendChat(e) {
    e.preventDefault();
    if (!user?.id || !chatMsg.trim()) return;
    setErr(null);
    try {
      const res = await fetch("/api/community/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorUserId: user.id,
          authorDisplayName: user.displayName,
          channel,
          message: chatMsg.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      setChatMsg("");
      await loadChats();
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-3 pb-6 pt-3 md:max-w-5xl">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-ccweb-violet">Community</p>
        <h1 className="mt-1 text-2xl font-bold text-white md:text-3xl">Feed &amp; rooms</h1>
        <p className="mt-1 max-w-2xl text-sm text-ccweb-muted">
          Posts and chat sync with <code className="text-ccweb-cyan">/api/community/*</code>. Sign in to publish.
        </p>
      </header>

      <div className="flex gap-2 rounded-2xl border border-white/10 bg-black/25 p-1">
        <button
          type="button"
          onClick={() => setTab("feed")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold ${
            tab === "feed" ? "bg-white/10 text-white" : "text-ccweb-muted"
          }`}
        >
          <Newspaper className="h-4 w-4" />
          Feed
        </button>
        <button
          type="button"
          onClick={() => setTab("chat")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold ${
            tab === "chat" ? "bg-white/10 text-white" : "text-ccweb-muted"
          }`}
        >
          <MessagesSquare className="h-4 w-4" />
          Chat
        </button>
      </div>

      {err && <p className="text-sm text-rose-300">{err}</p>}

      {tab === "feed" && (
        <>
          {user ? (
            <form onSubmit={submitPost} className="ccweb-glass space-y-3 rounded-2xl p-5">
              <h2 className="font-semibold text-white">New post</h2>
              <input
                className="ccweb-input"
                placeholder="Title"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
              />
              <textarea
                className="ccweb-input min-h-[100px] resize-y"
                placeholder="What are you building or learning?"
                value={postBody}
                onChange={(e) => setPostBody(e.target.value)}
              />
              <button type="submit" className="ccweb-gradient-btn text-sm">
                Publish
              </button>
            </form>
          ) : (
            <div className="ccweb-glass rounded-2xl p-5">
              <p className="text-sm text-ccweb-muted">
                <Link to="/login" className="text-ccweb-cyan underline">
                  Sign in
                </Link>{" "}
                to create posts and comments.
              </p>
            </div>
          )}

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ccweb-muted">
                {feedMode === "trending" ? "Trending" : "Latest"}
              </h2>
              <div className="flex gap-1 rounded-full border border-white/10 bg-black/30 p-0.5">
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
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${feedMode === "trending" ? "bg-white/15 text-white" : "text-ccweb-muted"}`}
                >
                  <TrendingUp className="h-3.5 w-3.5" /> Trending
                </button>
              </div>
            </div>
            {loadingPosts && <p className="text-sm text-ccweb-muted">Loading posts…</p>}
            {!loadingPosts && posts.length === 0 && <p className="text-sm text-ccweb-muted">No posts yet — be the first.</p>}
            <ul className="space-y-3">
              {posts.map((p) => (
                <li key={p.id} className="ccweb-glass rounded-2xl p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-white">{p.title}</p>
                      <p className="text-xs text-ccweb-muted">
                        {p.authorDisplayName || "Member"} · {new Date(p.createdAt).toLocaleString()}
                      </p>
                    </div>
                      <span className="text-xs text-ccweb-muted">
                        {p.commentCount ?? 0} comments
                        {p.reactionCount != null ? ` · ${p.reactionCount} reactions` : ""}
                      </span>
                  </div>
                  <p className="mt-2 text-sm text-ccweb-muted">{p.content}</p>
                  <button
                    type="button"
                    className="mt-3 flex items-center gap-1 text-xs font-medium text-ccweb-cyan hover:underline"
                    onClick={() => openComments(p.id)}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    {expandedPost === p.id ? "Hide thread" : "View thread"}
                  </button>
                  {expandedPost === p.id && (
                    <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
                      <ul className="max-h-48 space-y-2 overflow-y-auto text-sm">
                        {(commentsByPost[p.id] || []).map((c) => (
                          <li key={c.id} className="border-b border-white/5 pb-2">
                            <span className="text-ccweb-cyan">{c.authorDisplayName}</span>
                            <span className="text-ccweb-muted"> · {new Date(c.createdAt).toLocaleString()}</span>
                            <p className="text-white/90">{c.body}</p>
                          </li>
                        ))}
                      </ul>
                      {user && (
                        <div className="mt-3 flex gap-2">
                          <input
                            className="ccweb-input flex-1 text-sm"
                            placeholder="Write a comment…"
                            value={commentDraft[p.id] || ""}
                            onChange={(e) => setCommentDraft((prev) => ({ ...prev, [p.id]: e.target.value }))}
                          />
                          <button type="button" className="ccweb-outline-btn shrink-0 text-sm" onClick={() => submitComment(p.id)}>
                            Send
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {tab === "chat" && (
        <section className="ccweb-glass rounded-2xl p-5">
          <div className="flex flex-wrap gap-2">
            {["general", "trading", "builders"].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setChannel(c)}
                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                  channel === c ? "bg-ccweb-cyan/20 text-ccweb-cyan" : "border border-white/15 text-ccweb-muted"
                }`}
              >
                #{c}
              </button>
            ))}
          </div>
          <div className="mt-4 max-h-72 space-y-2 overflow-y-auto rounded-xl bg-black/35 p-3">
            {loadingChats && <p className="text-sm text-ccweb-muted">Loading…</p>}
            {!loadingChats &&
              chats.map((m) => (
                <div key={m.id} className="text-sm">
                  <span className="font-medium text-ccweb-cyan">{m.authorDisplayName}</span>
                  <span className="text-xs text-ccweb-muted"> · {new Date(m.createdAt).toLocaleTimeString()}</span>
                  <p className="text-white/90">{m.message}</p>
                </div>
              ))}
          </div>
          {user ? (
            <form onSubmit={sendChat} className="mt-4 flex gap-2">
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
            <p className="mt-4 text-sm text-ccweb-muted">
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
