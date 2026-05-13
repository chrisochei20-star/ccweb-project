import {
  BookOpen,
  Briefcase,
  Globe2,
  Loader2,
  MessageSquarePlus,
  PanelLeftClose,
  PanelLeftOpen,
  Rocket,
  Send,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  deleteTutorConversation,
  ensureTutorConversation,
  fetchTutorConversations,
  fetchTutorMessages,
  fetchTutorMemory,
  streamTutor,
} from "../api/coursesApi";

const MODES = [
  { id: "general", label: "General", icon: BookOpen },
  { id: "startup", label: "Startup", icon: Rocket },
  { id: "web3", label: "Web3", icon: Globe2 },
  { id: "proposal", label: "Proposals", icon: Briefcase },
];

export function AiTutorPage() {
  const { user } = useOutletContext() || {};
  const [mode, setMode] = useState("general");
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [memoryNote, setMemoryNote] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const endRef = useRef(null);

  async function refreshList() {
    if (!user) return;
    try {
      const list = await fetchTutorConversations();
      setConversations(list);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    refreshList();
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    let c = false;
    (async () => {
      try {
        const m = await fetchTutorMemory();
        if (!c && m?.summary) setMemoryNote(m.summary);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      c = true;
    };
  }, [user?.id]);

  async function openOrCreateConversation() {
    if (!user) return;
    setLoading(true);
    setErr(null);
    try {
      const conv = await ensureTutorConversation({ mode, courseSlug: "", lessonId: "" });
      setActiveId(conv.id);
      const data = await fetchTutorMessages(conv.id);
      setMessages(data.messages || []);
      await refreshList();
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user || !activeId) return;
    let c = false;
    (async () => {
      try {
        const data = await fetchTutorMessages(activeId);
        if (!c) setMessages(data.messages || []);
      } catch (e) {
        if (!c) setErr(e.message);
      }
    })();
    return () => {
      c = true;
    };
  }, [activeId, user?.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!user || !draft.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      let cid = activeId;
      if (!cid) {
        const conv = await ensureTutorConversation({ mode, courseSlug: "", lessonId: "" });
        cid = conv.id;
        setActiveId(cid);
        await refreshList();
      }
      const userText = draft.trim();
      setDraft("");
      setMessages((prev) => [...prev, { role: "user", content: userText, id: `local_${Date.now()}` }]);
      let assistantText = "";
      const replyId = `tmp_${Date.now()}`;
      setMessages((prev) => [...prev, { role: "assistant", content: "", id: replyId }]);

      await streamTutor({
        message: userText,
        mode,
        conversationId: cid,
        onDelta: (_chunk, full) => {
          assistantText = full;
          setMessages((prev) =>
            prev.map((m) => (m.id === replyId ? { ...m, content: full } : m))
          );
        },
      });

      void assistantText;
      const data = await fetchTutorMessages(cid);
      setMessages(data.messages || []);
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function newChat() {
    if (!user) return;
    setLoading(true);
    setErr(null);
    try {
      const conv = await ensureTutorConversation({ mode, courseSlug: "", lessonId: "", forceNew: true });
      setActiveId(conv.id);
      setMessages([]);
      await refreshList();
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function removeConv(id, e) {
    e.stopPropagation();
    if (!user) return;
    try {
      await deleteTutorConversation(id);
      if (activeId === id) {
        setActiveId(null);
        setMessages([]);
      }
      await refreshList();
    } catch (err2) {
      setErr(err2.message);
    }
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-ccweb-muted">Sign in to use the full CCWEB AI tutor with saved chats and memory.</p>
        <Link to="/login" className="mt-4 inline-block ccweb-gradient-btn">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-6xl flex-col gap-3 px-3 pb-24 pt-4 md:flex-row">
      <aside
        className={
          "flex w-full flex-col rounded-2xl border border-white/10 bg-black/30 md:max-w-xs " +
          (sidebarOpen ? "" : "hidden md:flex")
        }
      >
        <div className="flex items-center justify-between border-b border-white/10 p-3">
          <h2 className="text-sm font-semibold text-white">Chats</h2>
          <button
            type="button"
            className="rounded-lg p-1 text-ccweb-muted hover:bg-white/10 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <PanelLeftClose className="h-5 w-5" />
          </button>
        </div>
        <div className="flex gap-1 border-b border-white/10 p-2">
          <button
            type="button"
            onClick={newChat}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-white/10 px-2 py-2 text-xs font-medium text-white hover:bg-white/15"
          >
            <MessageSquarePlus className="h-4 w-4" />
            New
          </button>
          <button
            type="button"
            onClick={() => setMemoryOpen((v) => !v)}
            className="rounded-xl border border-white/15 px-2 py-2 text-xs text-ccweb-muted hover:bg-white/5"
          >
            Memory
          </button>
        </div>
        <ul className="max-h-[40vh] overflow-y-auto md:max-h-[calc(100vh-14rem)]">
          {conversations.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setActiveId(c.id)}
                className={
                  "flex w-full items-start gap-2 border-b border-white/5 px-3 py-2 text-left text-sm transition hover:bg-white/5 " +
                  (activeId === c.id ? "bg-white/10" : "")
                }
              >
                <span className="flex-1 truncate text-white">{c.title || "Chat"}</span>
                <span
                  role="button"
                  tabIndex={0}
                  className="text-zinc-500 hover:text-rose-400"
                  onClick={(e) => removeConv(c.id, e)}
                  onKeyDown={(e) => e.key === "Enter" && removeConv(c.id, e)}
                >
                  <Trash2 className="h-4 w-4" />
                </span>
              </button>
            </li>
          ))}
          {conversations.length === 0 && (
            <li className="px-3 py-6 text-center text-xs text-ccweb-muted">No saved threads yet.</li>
          )}
        </ul>
      </aside>

      <section className="flex min-h-[60vh] flex-1 flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-slate-950/90 to-black/50">
        <header className="flex flex-wrap items-center gap-2 border-b border-white/10 px-3 py-3">
          <button
            type="button"
            className="rounded-lg p-2 text-ccweb-muted hover:bg-white/10 md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <PanelLeftOpen className="h-5 w-5" />
          </button>
          <div className="flex flex-wrap gap-2">
            {MODES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setMode(id);
                  setActiveId(null);
                  setMessages([]);
                }}
                className={
                  "flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition " +
                  (mode === id ? "bg-ccweb-cyan/25 text-white" : "bg-black/40 text-ccweb-muted hover:bg-white/10")
                }
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={openOrCreateConversation}
            disabled={loading}
            className="ml-auto text-xs text-ccweb-cyan hover:underline"
          >
            Open mode thread
          </button>
        </header>

        {memoryOpen && (
          <div className="border-b border-white/10 bg-black/40 px-3 py-2 text-xs text-ccweb-muted">
            Long-term notes inform personalization. Facts accumulate server-side when OpenAI key is set.
            {memoryNote && <p className="mt-2 whitespace-pre-wrap text-white/80">{memoryNote}</p>}
          </div>
        )}

        {err && (
          <div className="mx-3 mt-2 rounded-lg border border-rose-500/40 bg-rose-950/50 px-3 py-2 text-sm text-rose-100">
            {err}
          </div>
        )}

        <div className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
          {messages.length === 0 && (
            <p className="text-center text-sm text-ccweb-muted">
              Pick a mode, then <strong className="text-white">Open mode thread</strong> or <strong className="text-white">New</strong>
              . Streaming uses thread history and learner memory when PostgreSQL and OpenAI are configured.
            </p>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={
                  "max-w-[90%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap shadow-lg md:max-w-[85%] " +
                  (m.role === "user"
                    ? "bg-gradient-to-r from-ccweb-cyan/70 to-ccweb-violet/60 text-white"
                    : "border border-white/10 bg-white/5 text-white/95")
                }
              >
                {m.content || (m.role === "assistant" && busy ? "…" : "")}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <form
          className="border-t border-white/10 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <div className="flex items-end gap-2">
            <textarea
              className="ccweb-input max-h-36 min-h-[48px] flex-1 resize-none py-3 text-sm"
              placeholder="Ask anything — lessons, Web3, startup plan, proposal outline…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <button type="submit" disabled={busy || !draft.trim()} className="ccweb-gradient-btn shrink-0 p-3">
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </div>
          <p className="mt-2 text-[10px] text-ccweb-muted">
            Requires <code className="text-ccweb-cyan">OPENAI_API_KEY</code> on the API for live models; conversations persist in PostgreSQL.
          </p>
        </form>
      </section>
    </div>
  );
}
