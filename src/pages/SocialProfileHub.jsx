import {
  Bell,
  Bookmark,
  Camera,
  Heart,
  MessageCircle,
  Send,
  Share2,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../lib/apiClient";
import { apiUrl, assetsUrl } from "../config/env";
import { getSessionToken } from "../session";

function authHeaders() {
  const t = getSessionToken();
  const h = {};
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
}

async function parseJsonSafe(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: text.slice(0, 200) };
  }
}

export function SocialProfileHub({ userId, isSelf }) {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [tab, setTab] = useState("posts");
  const [modal, setModal] = useState(null);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [composer, setComposer] = useState("");
  const [commentDrafts, setCommentDrafts] = useState({});
  const [editBio, setEditBio] = useState("");
  const [editHeadline, setEditHeadline] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editTwitter, setEditTwitter] = useState("");
  const [editDiscord, setEditDiscord] = useState("");
  const [editGithub, setEditGithub] = useState("");
  const [editLinkedin, setEditLinkedin] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const refreshProfile = useCallback(async () => {
    if (!userId) return;
    const path = isSelf ? "/api/v1/social/me" : `/api/v1/social/profile/${encodeURIComponent(userId)}`;
    const res = await apiFetch(apiUrl(path), { headers: authHeaders(), credentials: "include" });
    const data = await parseJsonSafe(res);
    if (!res.ok) throw new Error(data.error || data.code || `HTTP ${res.status}`);
    setProfile(data.profile);
    if (data.profile && isSelf) {
      setEditBio(data.profile.bio || "");
      setEditHeadline(data.profile.headline || "");
      setEditWebsite(data.profile.websiteUrl || "");
      setEditTwitter(data.profile.twitterHandle || "");
      const sl = data.profile.socialLinks || {};
      setEditDiscord(sl.discord || "");
      setEditGithub(sl.github || "");
      setEditLinkedin(sl.linkedin || "");
    }
  }, [userId, isSelf]);

  const refreshPosts = useCallback(async () => {
    if (!userId) return;
    const res = await apiFetch(
      apiUrl(`/api/v1/social/posts?userId=${encodeURIComponent(userId)}&limit=30`),
      { headers: authHeaders(), credentials: "include" }
    );
    const data = await parseJsonSafe(res);
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    setPosts(data.posts || []);
  }, [userId]);

  const refreshSaved = useCallback(async () => {
    const res = await apiFetch(apiUrl("/api/v1/social/me/saved?limit=30"), {
      headers: authHeaders(),
      credentials: "include",
    });
    const data = await parseJsonSafe(res);
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    setSavedPosts(data.posts || []);
  }, []);

  const refreshNotifications = useCallback(async () => {
    const res = await apiFetch(apiUrl("/api/v1/social/me/notifications?limit=50"), {
      headers: authHeaders(),
      credentials: "include",
    });
    const data = await parseJsonSafe(res);
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    setNotifications(data.notifications || []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        await refreshProfile();
        await refreshPosts();
        if (isSelf) {
          await refreshSaved();
          await refreshNotifications();
        }
      } catch (e) {
        if (!cancelled) setErr(e.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshProfile, refreshPosts, refreshSaved, refreshNotifications, isSelf]);

  async function saveSocialEdit(e) {
    e.preventDefault();
    setSavingEdit(true);
    setErr(null);
    try {
      const res = await fetch(apiUrl("/api/v1/social/me"), {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        credentials: "include",
        body: JSON.stringify({
          bio: editBio,
          headline: editHeadline,
          websiteUrl: editWebsite,
          twitterHandle: editTwitter,
          socialLinks: {
            discord: editDiscord.trim(),
            github: editGithub.trim(),
            linkedin: editLinkedin.trim(),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setProfile(data.profile);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSavingEdit(false);
    }
  }

  async function uploadImage(kind) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp,image/gif";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const fd = new FormData();
      fd.append("file", file);
      const path = kind === "banner" ? "/api/v1/social/me/banner" : "/api/v1/social/me/avatar";
      try {
        const res = await fetch(apiUrl(path), {
          method: "POST",
          headers: authHeaders(),
          credentials: "include",
          body: fd,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        setProfile(data.profile);
      } catch (e) {
        setErr(e.message);
      }
    };
    input.click();
  }

  async function publishPost(e) {
    e.preventDefault();
    const body = composer.trim();
    if (!body) return;
    try {
      const res = await fetch(apiUrl("/api/v1/social/posts"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        credentials: "include",
        body: JSON.stringify({ title: "", body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Post failed");
      setComposer("");
      setPosts((prev) => [data.post, ...prev]);
      await refreshProfile();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function toggleLike(postId) {
    try {
      const res = await fetch(apiUrl(`/api/v1/social/posts/${encodeURIComponent(postId)}/like`), {
        method: "POST",
        headers: authHeaders(),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Like failed");
      const patch = (list) => list.map((p) => (p.id === postId ? data.post : p));
      setPosts(patch);
      setSavedPosts(patch);
    } catch (e) {
      setErr(e.message);
    }
  }

  async function toggleSave(postId) {
    try {
      const post = [...posts, ...savedPosts].find((p) => p.id === postId);
      const path = post?.saved ? "DELETE" : "POST";
      const res = await fetch(apiUrl(`/api/v1/social/posts/${encodeURIComponent(postId)}/save`), {
        method: path,
        headers: authHeaders(),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      const patch = (list) => list.map((p) => (p.id === postId ? data.post : p));
      setPosts(patch);
      setSavedPosts(patch);
      if (tab === "saved") await refreshSaved();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function sharePost(postId) {
    try {
      const res = await fetch(apiUrl(`/api/v1/social/posts/${encodeURIComponent(postId)}/share`), {
        method: "POST",
        headers: authHeaders(),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Share failed");
      const patch = (list) => list.map((p) => (p.id === postId ? data.post : p));
      setPosts(patch);
    } catch (e) {
      setErr(e.message);
    }
  }

  async function postComment(postId) {
    const text = (commentDrafts[postId] || "").trim();
    if (!text) return;
    try {
      const res = await fetch(apiUrl(`/api/v1/social/posts/${encodeURIComponent(postId)}/comments`), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        credentials: "include",
        body: JSON.stringify({ body: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Comment failed");
      setCommentDrafts((d) => ({ ...d, [postId]: "" }));
      setPosts((list) =>
        list.map((p) => (p.id === postId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p))
      );
    } catch (e) {
      setErr(e.message);
    }
  }

  async function loadFollowers() {
    if (!userId) return;
    const res = await apiFetch(apiUrl(`/api/v1/social/followers/${encodeURIComponent(userId)}`), {
      headers: authHeaders(),
      credentials: "include",
    });
    const data = await parseJsonSafe(res);
    if (res.ok) setFollowersList(data.followers || []);
  }

  async function loadFollowing() {
    if (!userId) return;
    const res = await apiFetch(apiUrl(`/api/v1/social/following/${encodeURIComponent(userId)}`), {
      headers: authHeaders(),
      credentials: "include",
    });
    const data = await parseJsonSafe(res);
    if (res.ok) setFollowingList(data.following || []);
  }

  async function toggleFollow() {
    if (!userId || isSelf) return;
    const method = profile?.viewerFollows ? "DELETE" : "POST";
    try {
      const res = await fetch(apiUrl(`/api/v1/social/follow/${encodeURIComponent(userId)}`), {
        method,
        headers: authHeaders(),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Follow failed");
      setProfile(data.profile);
    } catch (e) {
      setErr(e.message);
    }
  }

  async function markNotifRead() {
    try {
      await fetch(apiUrl("/api/v1/social/me/notifications/read"), {
        method: "POST",
        headers: authHeaders(),
        credentials: "include",
      });
      setNotifications((n) => n.map((x) => ({ ...x, readAt: x.readAt || new Date().toISOString() })));
    } catch {
      /* ignore */
    }
  }

  const openModal = async (m) => {
    setModal(m);
    if (m === "followers") await loadFollowers();
    if (m === "following") await loadFollowing();
  };

  if (loading) {
    return (
      <div className="ccweb-glass rounded-2xl p-8 text-center text-sm text-ccweb-muted">
        <Sparkles className="mx-auto mb-2 h-6 w-6 text-ccweb-cyan opacity-80" />
        Loading social layer…
      </div>
    );
  }

  if (err && !profile) {
    const pgMsg = /PostgreSQL|NO_DATABASE|503/i.test(String(err));
    return (
      <div className="ccweb-glass rounded-2xl p-4 text-sm text-rose-200">
        {err}
        {pgMsg ? (
          <p className="mt-2 text-xs text-ccweb-muted">
            Social profiles require PostgreSQL. Set DATABASE_URL on the API and run migrations.
          </p>
        ) : null}
      </div>
    );
  }

  const c = profile?.counts || { followers: 0, following: 0, posts: 0 };
  const banner = profile?.bannerUrl || profile?.bannerPath;
  const avatar = profile?.avatarUrl || profile?.avatarPath;
  const unreadN = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="space-y-4">
      {err && !/PostgreSQL|NO_DATABASE|503/i.test(String(err)) && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{err}</p>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-black/40 shadow-[0_0_40px_rgba(34,211,238,0.08)]">
        <div
          className="relative h-32 bg-gradient-to-r from-violet-900/50 to-cyan-900/40 sm:h-40"
          style={
            banner
              ? {
                  backgroundImage: `url(${assetsUrl(banner)})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          {isSelf && (
            <button
              type="button"
              onClick={() => uploadImage("banner")}
              className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-xs text-white backdrop-blur-sm"
            >
              <Camera className="h-3.5 w-3.5" />
              Banner
            </button>
          )}
        </div>
        <div className="relative flex flex-col gap-3 px-4 pb-4 pt-0 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-3">
            <div className="relative -mt-10 h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-cyan-500/40 bg-slate-900 shadow-lg sm:-mt-12 sm:h-24 sm:w-24">
              {avatar ? (
                <img src={assetsUrl(avatar)} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white/30">◎</div>
              )}
              {isSelf && (
                <button
                  type="button"
                  onClick={() => uploadImage("avatar")}
                  className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-lg border border-white/20 bg-black/60 text-white"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="min-w-0 pb-1">
              <h2 className="truncate text-lg font-bold text-white sm:text-xl">{profile?.displayName || "Member"}</h2>
              {profile?.headline ? <p className="text-sm text-ccweb-muted">{profile.headline}</p> : null}
              {profile?.betaSlug ? (
                <p className="mt-0.5 text-xs text-ccweb-cyan/90">/u/{profile.betaSlug}</p>
              ) : null}
            </div>
          </div>
          {!isSelf && getSessionToken() && (
            <button
              type="button"
              onClick={toggleFollow}
              className={
                profile?.viewerFollows
                  ? "ccweb-outline-btn shrink-0 px-4 py-2 text-sm"
                  : "ccweb-gradient-btn shrink-0 px-4 py-2 text-sm"
              }
            >
              {profile?.viewerFollows ? "Following" : "Follow"}
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 border-t border-white/5 px-4 py-3 text-center text-sm">
          <button type="button" onClick={() => openModal("followers")} className="rounded-xl py-2 hover:bg-white/5">
            <div className="font-semibold text-white">{c.followers}</div>
            <div className="text-xs text-ccweb-muted">Followers</div>
          </button>
          <button type="button" onClick={() => openModal("following")} className="rounded-xl py-2 hover:bg-white/5">
            <div className="font-semibold text-white">{c.following}</div>
            <div className="text-xs text-ccweb-muted">Following</div>
          </button>
          <div className="rounded-xl py-2">
            <div className="font-semibold text-white">{c.posts}</div>
            <div className="text-xs text-ccweb-muted">Posts</div>
          </div>
        </div>
      </div>

      {isSelf && (
        <form onSubmit={saveSocialEdit} className="ccweb-glass space-y-3 rounded-2xl p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Sparkles className="h-4 w-4 text-ccweb-violet" />
            Edit public profile
          </h3>
          <label className="block text-xs text-ccweb-muted">Bio</label>
          <textarea
            className="ccweb-input min-h-[72px] text-sm"
            value={editBio}
            onChange={(e) => setEditBio(e.target.value)}
            maxLength={4000}
            placeholder="Builder · DeFi · On-chain research"
          />
          <label className="block text-xs text-ccweb-muted">Headline</label>
          <input
            className="ccweb-input text-sm"
            value={editHeadline}
            onChange={(e) => setEditHeadline(e.target.value)}
            maxLength={200}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="text-xs text-ccweb-muted">Website</label>
              <input
                className="ccweb-input mt-0.5 text-sm"
                value={editWebsite}
                onChange={(e) => setEditWebsite(e.target.value)}
                placeholder="https://"
              />
            </div>
            <div>
              <label className="text-xs text-ccweb-muted">X (Twitter) handle</label>
              <input
                className="ccweb-input mt-0.5 text-sm"
                value={editTwitter}
                onChange={(e) => setEditTwitter(e.target.value)}
                placeholder="username (no @)"
              />
            </div>
            <div>
              <label className="text-xs text-ccweb-muted">Discord</label>
              <input
                className="ccweb-input mt-0.5 text-sm"
                value={editDiscord}
                onChange={(e) => setEditDiscord(e.target.value)}
                placeholder="user#0000 or link"
              />
            </div>
            <div>
              <label className="text-xs text-ccweb-muted">GitHub</label>
              <input
                className="ccweb-input mt-0.5 text-sm"
                value={editGithub}
                onChange={(e) => setEditGithub(e.target.value)}
                placeholder="username"
              />
            </div>
            <div>
              <label className="text-xs text-ccweb-muted">LinkedIn</label>
              <input
                className="ccweb-input mt-0.5 text-sm"
                value={editLinkedin}
                onChange={(e) => setEditLinkedin(e.target.value)}
                placeholder="Profile URL or handle"
              />
            </div>
          </div>
          <button type="submit" disabled={savingEdit} className="ccweb-gradient-btn text-sm">
            {savingEdit ? "Saving…" : "Save social profile"}
          </button>
        </form>
      )}

      {profile?.bio && !isSelf && (
        <div className="ccweb-glass rounded-2xl p-4 text-sm leading-relaxed text-white/90">{profile.bio}</div>
      )}

      {isSelf && (
        <div className="flex gap-1 rounded-2xl border border-white/10 bg-black/20 p-1">
          {[
            { id: "posts", label: "Posts" },
            { id: "saved", label: "Saved" },
            { id: "notify", label: "Alerts", icon: Bell, badge: unreadN },
          ].map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => {
                setTab(x.id);
                if (x.id === "notify" && (x.badge ?? 0) > 0) markNotifRead();
              }}
              className={
                "flex flex-1 items-center justify-center gap-1 rounded-xl py-2.5 text-xs font-medium sm:text-sm " +
                (tab === x.id ? "bg-white/10 text-white shadow-inner" : "text-ccweb-muted hover:text-white")
              }
            >
              {x.icon ? <x.icon className="h-3.5 w-3.5" /> : null}
              {x.label}
              {(x.badge ?? 0) > 0 ? (
                <span className="rounded-full bg-cyan-500/30 px-1.5 text-[10px] text-cyan-100">{x.badge}</span>
              ) : null}
            </button>
          ))}
        </div>
      )}

      {isSelf && tab === "posts" && (
        <form onSubmit={publishPost} className="ccweb-glass rounded-2xl p-4">
          <label className="text-xs font-medium text-ccweb-muted">New signal</label>
          <textarea
            className="ccweb-input mt-1 min-h-[88px] text-sm"
            placeholder="Share alpha, a build update, or a hot take…"
            value={composer}
            onChange={(e) => setComposer(e.target.value)}
            maxLength={8000}
          />
          <button type="submit" className="mt-2 flex items-center gap-2 ccweb-gradient-btn text-sm">
            <Send className="h-4 w-4" />
            Publish
          </button>
        </form>
      )}

      {isSelf && tab === "notify" && (
        <div className="space-y-2">
          {notifications.length === 0 ? (
            <p className="text-center text-sm text-ccweb-muted">No notifications yet.</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={
                  "rounded-xl border border-white/10 px-3 py-2 text-sm " +
                  (n.readAt ? "bg-black/20 text-ccweb-muted" : "bg-cyan-500/10 text-white")
                }
              >
                <div className="font-medium">{n.title}</div>
                <div className="text-xs text-ccweb-muted">{n.body}</div>
              </div>
            ))
          )}
        </div>
      )}

      {(!isSelf || tab === "posts") && (
        <div className="space-y-3">
          {posts.length === 0 ? (
            <p className="text-center text-sm text-ccweb-muted">No posts yet.</p>
          ) : (
            posts.map((p) => (
              <article key={p.id} className="ccweb-glass rounded-2xl p-4">
                <div className="flex gap-3">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-slate-800">
                    {p.authorAvatarUrl ? (
                      <img src={assetsUrl(p.authorAvatarUrl)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-white/40">◇</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-white">{p.authorDisplayName}</span>
                      <span className="text-xs text-ccweb-muted">
                        {p.createdAt ? new Date(p.createdAt).toLocaleString() : ""}
                      </span>
                    </div>
                    {p.title ? <h4 className="mt-1 font-medium text-white">{p.title}</h4> : null}
                    <p className="mt-1 whitespace-pre-wrap text-sm text-ccweb-muted">{p.body}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-ccweb-muted">
                      {getSessionToken() && (
                        <>
                          <button
                            type="button"
                            onClick={() => toggleLike(p.id)}
                            className={
                              "flex items-center gap-1 rounded-full px-2 py-1 " +
                              (p.liked ? "text-rose-300" : "hover:bg-white/5")
                            }
                          >
                            <Heart className={"h-4 w-4 " + (p.liked ? "fill-current" : "")} />
                            {p.likeCount ?? 0}
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleSave(p.id)}
                            className={
                              "flex items-center gap-1 rounded-full px-2 py-1 " +
                              (p.saved ? "text-amber-200" : "hover:bg-white/5")
                            }
                          >
                            <Bookmark className={"h-4 w-4 " + (p.saved ? "fill-current" : "")} />
                          </button>
                          <button
                            type="button"
                            onClick={() => sharePost(p.id)}
                            className="flex items-center gap-1 rounded-full px-2 py-1 hover:bg-white/5"
                          >
                            <Share2 className="h-4 w-4" />
                            {p.shareCount ?? 0}
                          </button>
                        </>
                      )}
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        {p.commentCount ?? 0}
                      </span>
                    </div>
                    {getSessionToken() && (
                      <div className="mt-2 flex gap-2">
                        <input
                          className="ccweb-input flex-1 py-1.5 text-xs"
                          placeholder="Reply…"
                          value={commentDrafts[p.id] || ""}
                          onChange={(e) => setCommentDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                        />
                        <button type="button" className="ccweb-outline-btn px-3 py-1.5 text-xs" onClick={() => postComment(p.id)}>
                          Reply
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {isSelf && tab === "saved" && (
        <div className="space-y-3">
          {savedPosts.length === 0 ? (
            <p className="text-center text-sm text-ccweb-muted">No saved posts.</p>
          ) : (
            savedPosts.map((p) => (
              <article key={p.id} className="ccweb-glass rounded-2xl p-4">
                <div className="flex gap-3">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-slate-800">
                    {p.authorAvatarUrl ? (
                      <img src={assetsUrl(p.authorAvatarUrl)} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-white">{p.authorDisplayName}</span>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-ccweb-muted">{p.body}</p>
                    <div className="mt-2 flex gap-2">
                      <button type="button" onClick={() => toggleLike(p.id)} className="text-xs text-rose-200">
                        <Heart className="mr-1 inline h-3.5 w-3.5" />
                        {p.likeCount ?? 0}
                      </button>
                      <button type="button" onClick={() => toggleSave(p.id)} className="text-xs text-amber-200">
                        Unsave
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
          <div className="max-h-[70vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-white/10 bg-slate-950 p-4 shadow-2xl sm:rounded-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold text-white">
                <Users className="h-4 w-4 text-ccweb-cyan" />
                {modal === "followers" ? "Followers" : "Following"}
              </h3>
              <button type="button" onClick={() => setModal(null)} className="rounded-lg p-1 text-ccweb-muted hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="space-y-2">
              {(modal === "followers" ? followersList : followingList).map((u) => (
                <li key={u.userId} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-3 py-2">
                  <div className="h-9 w-9 overflow-hidden rounded-lg bg-slate-800">
                    {u.avatarUrl ? <img src={assetsUrl(u.avatarUrl)} alt="" className="h-full w-full object-cover" /> : null}
                  </div>
                  <span className="text-sm font-medium text-white">{u.displayName}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
