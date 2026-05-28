import { ArrowLeft, Circle, ImagePlus, Loader2, RefreshCw, Send, Smile, WifiOff } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiUrl, assetsUrl } from "../config/env";
import { apiFetch } from "../lib/apiClient";
import { compressImageFile } from "../lib/imageCompress";
import { uploadChatImage, formatUploadError } from "../api/uploadsApi";
import { dedupeById } from "../lib/feedMerge";
import { getSharedRealtimeSocket, getRealtimeConnectionState } from "../lib/realtimeSocket";
import { useConnectionState, useRealtimeSubscription, useSocketReconnect } from "../hooks/useRealtimeSubscription";
import { toast } from "../lib/toastBus";
import { getSessionToken } from "../session";
import { CCWEB_UI_LOAD_TIMEOUT_MS } from "../constants/loadTimeout";
import { useAppShellContext } from "../hooks/useAppShellContext";
import { useAuthGateRecovery } from "../hooks/useAuthGateRecovery";

const QUICK_EMOJIS = ["😀", "🙂", "😂", "🔥", "❤️", "👍", "🎉", "⚡", "📈", "🚀", "💎", "✨", "🙏", "👀", "💬"];

const CHAT_LOAD_TIMEOUT_MS = CCWEB_UI_LOAD_TIMEOUT_MS;

export function ChatPage() {
  const { user, authHydrated, refreshSession } = useAppShellContext();
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [presence, setPresence] = useState({});
  const [typing, setTyping] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [newDmId, setNewDmId] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [gateTimedOut, setGateTimedOut] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [chatUploadProgress, setChatUploadProgress] = useState(null);
  const [connectionState, setConnectionState] = useState(() => getRealtimeConnectionState());
  const typingTimer = useRef(null);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const nearBottomRef = useRef(true);
  const activeChatRef = useRef(null);
  activeChatRef.current = activeId;

  const activeConv = useMemo(() => conversations.find((c) => c.chatId === activeId), [conversations, activeId]);

  const loadConversations = useCallback(async () => {
    const res = await apiFetch(apiUrl("/api/v1/chat/conversations"));
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Could not load chats.");
    const list = data.conversations || [];
    setConversations(list);
    const ids = [...new Set(list.map((c) => c.otherUserId).filter(Boolean))];
    if (ids.length) {
      const pr = await apiFetch(apiUrl(`/api/v1/chat/presence?ids=${encodeURIComponent(ids.join(","))}`));
      const pd = await pr.json().catch(() => ({}));
      if (pr.ok && pd.presence) setPresence(pd.presence);
    }
  }, []);

  const loadMessages = useCallback(async (chatId) => {
    const res = await apiFetch(apiUrl(`/api/v1/chat/${encodeURIComponent(chatId)}/messages?limit=80`));
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Could not load messages.");
    setMessages(dedupeById(data.messages || []));
    await apiFetch(apiUrl(`/api/v1/chat/${encodeURIComponent(chatId)}/read`), {
      method: "POST",
    });
    setConversations((prev) =>
      prev.map((c) => (c.chatId === chatId ? { ...c, unreadCount: 0 } : c))
    );
  }, []);

  useEffect(() => {
    const waitingHydrate = !authHydrated;
    const waitingUserWithToken = Boolean(authHydrated && !user && getSessionToken());
    if (!waitingHydrate && !waitingUserWithToken) {
      setGateTimedOut(false);
      return undefined;
    }
    const id = window.setTimeout(() => setGateTimedOut(true), CHAT_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [authHydrated, user]);

  useAuthGateRecovery({ gateTimedOut, authHydrated, refreshSession });

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv || typeof vv.addEventListener !== "function") return undefined;
    const update = () => {
      const obscured = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardInset(Math.min(200, Math.round(obscured)));
    };
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    update();
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  useEffect(() => {
    if (!authHydrated) return;
    if (!user?.id) {
      setLoading(false);
      return;
    }
    const token = getSessionToken();
    if (!token) {
      setLoading(false);
      setErr("No access token in session. Sign in again.");
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        await Promise.race([
          loadConversations(),
          new Promise((_, reject) => {
            setTimeout(
              () => reject(new Error("Loading chats timed out. Check your connection and try again.")),
              CHAT_LOAD_TIMEOUT_MS
            );
          }),
        ]);
      } catch (e) {
        if (!cancelled) setErr(e.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authHydrated, user?.id, loadConversations]);

  useConnectionState(setConnectionState);

  const handleSocketMessage = useCallback(
    (msg) => {
      const cur = activeChatRef.current;
      if (!msg?.chatId) return;
      setMessages((prev) => {
        if (msg.chatId !== cur) return prev;
        if (prev.some((m) => m.id === msg.id)) return prev;
        return dedupeById([...prev.filter((m) => !String(m.id).startsWith("tmp_")), msg]);
      });
      setConversations((prev) => {
        const ix = prev.findIndex((c) => c.chatId === msg.chatId);
        const preview =
          msg.body && msg.body.trim()
            ? msg.body.slice(0, 120)
            : msg.metadata?.type === "image"
              ? "📷 Image"
              : "";
        if (ix === -1) {
          return [
            {
              chatId: msg.chatId,
              kind: "direct",
              otherUserId: msg.authorUserId === user?.id ? null : msg.authorUserId,
              otherDisplayName: msg.authorDisplayName || "Member",
              lastMessagePreview: preview,
              lastMessageAt: msg.createdAt,
              unreadCount: msg.authorUserId !== user?.id ? 1 : 0,
            },
            ...prev,
          ];
        }
        const row = { ...prev[ix], lastMessagePreview: preview, lastMessageAt: msg.createdAt };
        if (msg.chatId !== cur && msg.authorUserId !== user?.id) {
          row.unreadCount = (row.unreadCount || 0) + 1;
        }
        const next = [...prev];
        next[ix] = row;
        return next.sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
      });
    },
    [user?.id]
  );

  useRealtimeSubscription("message:new", handleSocketMessage, Boolean(user?.id), "chat-page-message-new");
  useRealtimeSubscription(
    "inbox:refresh",
    () => {
      loadConversations().catch(() => {});
    },
    Boolean(user?.id),
    "chat-page-inbox"
  );
  useRealtimeSubscription(
    "presence:update",
    ({ userId: uid, online }) => {
      if (!uid) return;
      setPresence((p) => ({ ...p, [uid]: !!online }));
    },
    Boolean(user?.id),
    "chat-page-presence"
  );
  useRealtimeSubscription(
    "typing",
    ({ chatId, userId: uid, typing: t }) => {
      if (chatId !== activeChatRef.current || uid === user?.id) return;
      setPeerTyping(!!t);
    },
    Boolean(user?.id),
    "chat-page-typing"
  );

  useSocketReconnect(() => {
    loadConversations().catch(() => {});
    const chatId = activeChatRef.current;
    if (chatId) {
      loadMessages(chatId).catch(() => {});
      const socket = getSharedRealtimeSocket();
      if (socket) socket.emit("join:chat", chatId, () => {});
    }
  }, Boolean(user?.id));

  useEffect(() => {
    if (!user?.id) return;
    socketRef.current = getSharedRealtimeSocket();
  }, [user?.id]);

  useEffect(() => {
    if (!nearBottomRef.current) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeId]);

  function onMessagesScroll() {
    const el = scrollContainerRef.current;
    if (!el) return;
    nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !activeId) return;
    socket.emit("join:chat", activeId, () => {});
    setPeerTyping(false);
    let cancelled = false;
    (async () => {
      try {
        await Promise.race([
          loadMessages(activeId),
          new Promise((_, reject) => {
            setTimeout(
              () => reject(new Error("Loading messages timed out. Check your connection and try again.")),
              CHAT_LOAD_TIMEOUT_MS
            );
          }),
        ]);
      } catch (e) {
        if (!cancelled) setErr(e.message || String(e));
      }
    })();
    return () => {
      cancelled = true;
      socket.emit("leave:chat", activeId);
    };
  }, [activeId, loadMessages]);

  function emitTyping(on) {
    const socket = socketRef.current;
    if (!socket || !activeId) return;
    socket.emit("typing", { chatId: activeId, typing: on }, () => {});
  }

  function onDraftChange(v) {
    setDraft(v);
    if (!typing) {
      setTyping(true);
      emitTyping(true);
    }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setTyping(false);
      emitTyping(false);
    }, 2000);
  }

  async function sendText(e, retryText) {
    if (e?.preventDefault) e.preventDefault();
    const text = (retryText ?? draft).trim();
    if (!text || !activeId) return;
    emitTyping(false);
    setTyping(false);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    if (!retryText) setDraft("");
    const tempId = `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const optimistic = {
      id: tempId,
      chatId: activeId,
      authorUserId: user.id,
      authorDisplayName: user.displayName || "You",
      body: text,
      createdAt: new Date().toISOString(),
      _status: "pending",
    };
    setMessages((prev) => dedupeById([...prev, optimistic]));
    nearBottomRef.current = true;
    try {
      const res = await apiFetch(
        apiUrl(`/api/v1/chat/${encodeURIComponent(activeId)}/messages`),
        {
          method: "POST",
          body: JSON.stringify({ body: text }),
        },
        { networkRetries: 2 }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Send failed.");
      if (data.message) {
        setMessages((prev) => dedupeById(prev.map((m) => (m.id === tempId ? data.message : m))));
      }
    } catch (e) {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, _status: "failed" } : m)));
      if (!retryText) setDraft(text);
      const m = e.message || "Send failed.";
      setErr(m);
      toast.error(m);
    }
  }

  async function uploadImage(file) {
    if (!activeId || !file) return;
    const isGif = file.type === "image/gif";
    let prepared = file;
    if (!isGif) {
      try {
        prepared = await compressImageFile(file, { maxWidth: 2048, maxHeight: 2048 });
      } catch {
        prepared = file;
      }
    }
    setChatUploadProgress(0);
    try {
      const data = await uploadChatImage(activeId, prepared, {
        onProgress: (pct) => setChatUploadProgress(pct),
      });
      if (data.message) setMessages((prev) => [...prev, data.message]);
    } catch (e) {
      const m = formatUploadError(e);
      setErr(m);
      toast.error(m);
    } finally {
      setChatUploadProgress(null);
    }
  }

  async function startDm(e) {
    e.preventDefault();
    const id = newDmId.trim();
    if (!id) return;
    try {
      const res = await apiFetch(
        apiUrl("/api/v1/chat/direct"),
        {
          method: "POST",
          body: JSON.stringify({ otherUserId: id }),
        },
        { networkRetries: 1 }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not start chat.");
      setNewDmId("");
      setActiveId(data.chatId);
      await loadConversations();
    } catch (e) {
      const m = e.message || "Could not start chat.";
      setErr(m);
      toast.error(m);
    }
  }

  if (!authHydrated) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 text-ccweb-muted" role="status">
        {!gateTimedOut ? <Loader2 className="h-6 w-6 shrink-0 animate-spin" aria-hidden /> : null}
        <span className="text-sm text-center max-w-sm">
          {gateTimedOut
            ? "We could not verify your session in time. Check your connection or try signing in again."
            : "Loading messages…"}
        </span>
        {gateTimedOut && getSessionToken() && typeof refreshSession === "function" && (
          <button type="button" className="ccweb-outline-btn min-h-[44px] px-4 text-sm" onClick={() => refreshSession()}>
            Retry session
          </button>
        )}
      </div>
    );
  }

  if (!user) {
    if (getSessionToken()) {
      return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 text-ccweb-muted" role="status">
          {!gateTimedOut ? <Loader2 className="h-6 w-6 shrink-0 animate-spin" aria-hidden /> : null}
          <span className="text-sm text-center max-w-sm">
            {gateTimedOut
              ? "We could not load your account in time. Check your connection or try signing in again."
              : "Syncing account…"}
          </span>
          {gateTimedOut && typeof refreshSession === "function" && (
            <button type="button" className="ccweb-outline-btn min-h-[44px] px-4 text-sm" onClick={() => refreshSession()}>
              Retry session
            </button>
          )}
        </div>
      );
    }
    return (
      <div className="px-4 py-10 text-center text-sm text-ccweb-muted">
        Sign in to use direct messages.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 px-4 text-ccweb-muted">
        {!err ? <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden /> : null}
        <span className={`text-sm text-center max-w-sm ${err ? "text-rose-200" : ""}`}>{err || "Loading chats…"}</span>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-5xl flex-col gap-3 px-3 pb-24 pt-3 md:flex-row md:pb-8">
      {connectionState !== "connected" && (
        <div className="fixed left-3 right-3 top-16 z-40 flex items-center gap-2 rounded-xl border border-amber-500/35 bg-amber-950/90 px-3 py-2 text-xs text-amber-100 md:mx-auto md:max-w-md">
          <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
          {connectionState === "reconnecting" ? "Reconnecting to chat…" : "Offline — messages send when you reconnect."}
        </div>
      )}

      {err && (
        <div className="fixed left-3 right-3 top-20 z-40 rounded-xl border border-rose-500/40 bg-rose-950/90 px-3 py-2 text-sm text-rose-100 md:left-auto md:right-auto md:max-w-md">
          {err}
          <button type="button" className="ml-2 text-ccweb-cyan underline" onClick={() => setErr(null)}>
            Dismiss
          </button>
        </div>
      )}

      <aside
        className={
          "flex w-full flex-col rounded-2xl border border-white/10 bg-black/30 md:max-w-sm " +
          (activeId ? "hidden md:flex" : "flex")
        }
      >
        <div className="border-b border-white/10 p-3">
          <h1 className="text-lg font-bold text-white">Messages</h1>
          <p className="text-xs text-ccweb-muted">Real-time direct chats · Socket.IO</p>
          <form onSubmit={startDm} className="mt-3 flex gap-2">
            <input
              className="ccweb-input flex-1 py-2 font-mono text-xs"
              placeholder="Start DM — paste user ID"
              value={newDmId}
              onChange={(e) => setNewDmId(e.target.value)}
            />
            <button type="submit" className="ccweb-gradient-btn shrink-0 px-3 py-2 text-xs">
              Go
            </button>
          </form>
        </div>
        <ul className="max-h-[55vh] overflow-y-auto md:max-h-[calc(100vh-14rem)]">
          {conversations.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-ccweb-muted">No conversations yet.</li>
          ) : (
            conversations.map((c) => (
              <li key={c.chatId}>
                <button
                  type="button"
                  onClick={() => setActiveId(c.chatId)}
                  className={
                    "flex w-full items-start gap-3 border-b border-white/5 px-3 py-3 text-left transition hover:bg-white/5 " +
                    (activeId === c.chatId ? "bg-white/10" : "")
                  }
                >
                  <div className="relative">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/30 to-violet-600/40 text-sm font-bold text-white">
                      {(c.otherDisplayName || "?").slice(0, 2).toUpperCase()}
                    </div>
                    <span
                      className={
                        "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-black " +
                        (presence[c.otherUserId] ? "bg-emerald-400" : "bg-zinc-600")
                      }
                      title={presence[c.otherUserId] ? "Online" : "Offline"}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium text-white">{c.otherDisplayName}</span>
                      {c.unreadCount > 0 && (
                        <span className="shrink-0 rounded-full bg-cyan-500/40 px-2 py-0.5 text-[10px] font-semibold text-cyan-50">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-ccweb-muted">{c.lastMessagePreview || "—"}</p>
                  </div>
                </button>
              </li>
            ))
          )}
        </ul>
      </aside>

      <section
        className={
          "flex min-h-[60vh] flex-1 flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-slate-950/90 to-black/50 shadow-[0_0_48px_rgba(34,211,238,0.06)] " +
          (!activeId ? "hidden md:flex" : "flex")
        }
      >
        {!activeId ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-ccweb-muted">
            <Circle className="h-10 w-10 opacity-30" />
            <p className="text-sm">Select a conversation or start a new DM.</p>
          </div>
        ) : (
          <>
            <header className="flex items-center gap-3 border-b border-white/10 px-3 py-3">
              <button
                type="button"
                className="rounded-xl p-2 text-ccweb-muted hover:bg-white/10 md:hidden"
                onClick={() => setActiveId(null)}
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/30 to-violet-600/40 text-xs font-bold text-white">
                  {(activeConv?.otherDisplayName || "?").slice(0, 2).toUpperCase()}
                </div>
                <span
                  className={
                    "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-black " +
                    (presence[activeConv?.otherUserId] ? "bg-emerald-400" : "bg-zinc-600")
                  }
                />
              </div>
              <div>
                <h2 className="font-semibold text-white">{activeConv?.otherDisplayName || "Chat"}</h2>
                <p className="text-xs text-ccweb-muted">
                  {presence[activeConv?.otherUserId] ? "Online" : "Offline"}
                  {peerTyping ? " · typing…" : ""}
                </p>
              </div>
            </header>

            <div ref={scrollContainerRef} onScroll={onMessagesScroll} className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-4">
              {messages.map((m) => {
                const mine = m.authorUserId === user.id;
                const img = m.isImage && (m.imageUrl || m.metadata?.url);
                const failed = m._status === "failed";
                const pending = m._status === "pending";
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={
                        "max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-lg " +
                        (mine
                          ? failed
                            ? "border border-rose-400/50 bg-rose-900/40 text-white"
                            : "bg-gradient-to-r from-ccweb-cyan/80 to-ccweb-violet/70 text-white"
                          : "border border-white/10 bg-white/5 text-white/95") +
                        (pending ? " opacity-80" : "")
                      }
                    >
                      {!mine && (
                        <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-ccweb-muted">
                          {m.authorDisplayName}
                        </p>
                      )}
                      {img ? (
                        <a href={assetsUrl(img)} target="_blank" rel="noreferrer">
                          <img src={assetsUrl(img)} alt="" className="max-h-56 max-w-full rounded-lg object-cover" />
                        </a>
                      ) : (
                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      )}
                      <div className={`mt-1 flex items-center gap-2 text-[10px] ${mine ? "text-white/70" : "text-ccweb-muted"}`}>
                        <span>
                          {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                        </span>
                        {pending && <span>Sending…</span>}
                        {failed && mine && (
                          <button
                            type="button"
                            className="inline-flex min-h-[44px] min-w-[44px] items-center gap-1 text-rose-200"
                            onClick={() => {
                              setMessages((prev) => prev.filter((x) => x.id !== m.id));
                              void sendText(null, m.body);
                            }}
                          >
                            <RefreshCw className="h-3 w-3" />
                            Retry
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {showEmoji && (
              <div className="flex flex-wrap gap-1 border-t border-white/10 bg-black/40 px-3 py-2">
                {QUICK_EMOJIS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    className="rounded-lg px-2 py-1 text-lg hover:bg-white/10"
                    onClick={() => {
                      setDraft((d) => d + em);
                      setShowEmoji(false);
                    }}
                  >
                    {em}
                  </button>
                ))}
              </div>
            )}

            {chatUploadProgress != null && (
              <div className="border-t border-white/10 px-3 pt-2">
                <div className="h-1 overflow-hidden rounded-full bg-white/10">
                  {chatUploadProgress < 0 ? (
                    <div className="h-full w-1/3 animate-pulse bg-gradient-to-r from-ccweb-cyan/80 to-ccweb-violet/80" />
                  ) : (
                    <div
                      className="h-full bg-gradient-to-r from-ccweb-cyan to-ccweb-violet transition-[width] duration-150"
                      style={{ width: `${Math.min(100, chatUploadProgress)}%` }}
                    />
                  )}
                </div>
                <p className="mt-1 text-[10px] text-ccweb-muted">Uploading image…</p>
              </div>
            )}

            <form
              onSubmit={sendText}
              className="sticky bottom-0 z-10 border-t border-white/10 bg-slate-950/95 p-3 backdrop-blur-md"
              style={{
                paddingBottom:
                  keyboardInset > 0
                    ? `calc(0.75rem + env(safe-area-inset-bottom, 0px) + ${keyboardInset}px)`
                    : "max(0.75rem, env(safe-area-inset-bottom, 0px))",
              }}
            >
              <div className="flex items-end gap-2">
                <label
                  className={`flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-xl border border-white/15 text-ccweb-muted hover:bg-white/5 ${chatUploadProgress != null ? "pointer-events-none opacity-50" : ""}`}
                >
                  <ImagePlus className="h-5 w-5" />
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    disabled={chatUploadProgress != null}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (f) uploadImage(f);
                    }}
                  />
                </label>
                <button
                  type="button"
                  className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/15 ${showEmoji ? "bg-white/10 text-ccweb-cyan" : "text-ccweb-muted hover:bg-white/5"}`}
                  onClick={() => setShowEmoji((s) => !s)}
                  aria-label="Emoji"
                >
                  <Smile className="h-5 w-5" />
                </button>
                <textarea
                  className="ccweb-input max-h-32 min-h-[44px] flex-1 resize-none py-2.5 text-sm"
                  placeholder="Message…"
                  rows={1}
                  value={draft}
                  onChange={(e) => onDraftChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendText(e);
                    }
                  }}
                />
                <button type="submit" className="ccweb-gradient-btn flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center p-3" aria-label="Send">
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
