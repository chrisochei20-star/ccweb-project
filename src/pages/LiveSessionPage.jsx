import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Bot,
  CircleDollarSign,
  MessageCircle,
  Radio,
  Send,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

const DEFAULT_ROOM = "live-demo";
const USER_KEY = "ccweb-live-user";

function loadUserId() {
  try {
    let id = localStorage.getItem(USER_KEY);
    if (!id) {
      id = `user-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(USER_KEY, id);
    }
    return id;
  } catch {
    return `user-${Date.now()}`;
  }
}

export function LiveSessionPage() {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [roomId] = useState(DEFAULT_ROOM);
  const [displayName, setDisplayName] = useState("You");
  const [userLevel, setUserLevel] = useState("intermediate");
  const [topic] = useState("Token economics and sustainable creator revenue");
  const [poolUsd] = useState(3200);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [summary, setSummary] = useState({ bullets: [], topics: [], proficiency: "" });
  const [engagement, setEngagement] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const watchRef = useRef(0);
  const socketRef = useRef(null);
  const listRef = useRef(null);
  const joinPayloadRef = useRef({});
  const userId = useMemo(() => loadUserId(), []);

  joinPayloadRef.current = {
    roomId,
    userId,
    displayName,
    userLevel,
    topic,
    poolUsd,
    curriculumTracks: ["AI Foundations", "Digital Business Systems", "Web3 Product Development"],
    watchMinutes: 0,
  };

  useEffect(() => {
    setError("");
    const url = typeof window !== "undefined" ? window.location.origin : "";
    const s = io(url, {
      path: "/socket.io/",
      transports: ["websocket", "polling"],
    });
    socketRef.current = s;

    s.on("connect", () => {
      setConnected(true);
      s.emit("session:join", joinPayloadRef.current);
    });

    s.on("connect_error", (err) => {
      setError(
        err?.message ||
          "Could not connect. Install backend deps: npm install socket.io — then run node server.js alongside Vite.",
      );
      setConnected(false);
    });

    s.on("disconnect", () => setConnected(false));

    s.on("session:joined", (payload) => {
      setSessionInfo(payload);
      if (Array.isArray(payload.messages)) setMessages(payload.messages);
    });

    s.on("chat:message", (msg) => {
      setMessages((prev) => [...prev, msg].slice(-200));
    });

    s.on("summary:update", setSummary);

    s.on("engagement:update", (e) => {
      if (e?.userId === userId) setEngagement(e.snapshot);
    });

    s.on("earnings:update", setEarnings);

    s.on("ai:nudge", (nudge) => {
      setMessages((prev) => [
        ...prev,
        { ...nudge, kind: "system", displayName: "CCWEB", userId: "system" },
      ]);
    });

    const watchTimer = setInterval(() => {
      watchRef.current += 0.25;
      s.emit("engagement:sync", { watchMinutes: watchRef.current });
    }, 15000);

    return () => {
      clearInterval(watchTimer);
      s.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function onSubmit(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || !socketRef.current) return;
    const askAi = /^\/ai\b|^@brain\b/i.test(text);
    socketRef.current.emit("chat:message", { text, askAi });
    setInput("");
  }

  const myEarnings = earnings?.participants?.find((p) => p.userId === userId)?.estimatedEarningsUsd;

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      <header className="max-w-5xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">
          <Radio className="h-3.5 w-3.5" /> Live AI session
        </span>
        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">Real-time stream with Teaching Brain</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
          Chat updates over Socket.io. Prefix with <code className="rounded bg-slate-200/80 px-1.5 dark:bg-white/10">/ai</code> or{" "}
          <code className="rounded bg-slate-200/80 px-1.5 dark:bg-white/10">@brain</code> for AI replies with topic + recent chat context.
          Engagement feeds earnings estimates from the session pool.
        </p>
        <Link to="/platform" className="mt-4 inline-block text-sm font-bold text-cyan-600 dark:text-cyan-300">
          ← Platform overview
        </Link>
      </header>

      {error ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-800 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
        <span className={`rounded-full px-3 py-1 ${connected ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-slate-500/15"}`}>
          {connected ? "Live connected" : "Connecting…"}
        </span>
        <span className="rounded-full bg-white/10 px-3 py-1 dark:bg-white/5">Room {sessionInfo?.roomId || roomId}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <section className="flex flex-col gap-4">
          <GlassPanel className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-slate-950/80 to-cyan-900/30" />
            <div className="relative aspect-video rounded-[1.5rem] border border-white/10 bg-black/40 p-6 sm:p-8">
              <div className="flex h-full flex-col justify-between text-white">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/90">Now streaming</p>
                    <h2 className="mt-2 text-2xl font-black sm:text-3xl">{sessionInfo?.topic || topic}</h2>
                  </div>
                  <span className="flex items-center gap-2 rounded-full bg-red-500/90 px-3 py-1 text-xs font-black">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> LIVE
                  </span>
                </div>
                <div>
                  <p className="max-w-xl text-sm leading-7 text-cyan-50/95">
                    AI Teaching Brain co-hosts this session — use /ai for instant explanations. Idle learners receive gentle prompts.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <MiniBadge icon={Users} label={`${earnings?.participants?.length ?? 1} in pool`} />
                    <MiniBadge icon={Zap} label={`Tier: ${engagement?.tier || "—"}`} />
                  </div>
                </div>
              </div>
            </div>
          </GlassPanel>

          <GlassPanel className="flex min-h-[320px] flex-col p-0 sm:min-h-[380px]">
            <div className="flex items-center justify-between border-b border-slate-900/10 px-4 py-3 dark:border-white/10">
              <span className="flex items-center gap-2 text-sm font-black">
                <MessageCircle className="h-4 w-4 text-cyan-500" /> Chat + AI
              </span>
              <button
                type="button"
                className="text-xs font-bold text-cyan-600 dark:text-cyan-300"
                onClick={() => socketRef.current?.emit("reaction:increment")}
              >
                + Reaction
              </button>
            </div>
            <div ref={listRef} className="max-h-[280px] flex-1 space-y-3 overflow-y-auto px-4 py-3">
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl px-4 py-3 text-sm ${
                      m.kind === "ai"
                        ? "border border-cyan-500/25 bg-cyan-500/10 text-slate-800 dark:text-slate-100"
                        : m.kind === "system"
                          ? "border border-amber-500/20 bg-amber-500/10 text-amber-900 dark:text-amber-100"
                          : "border border-slate-900/10 bg-white/70 dark:border-white/10 dark:bg-white/5"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {m.kind === "ai" ? <Bot className="h-3.5 w-3.5 text-cyan-500" /> : null}
                      {m.displayName}
                      {m.difficulty ? (
                        <span className="rounded-full bg-slate-950/10 px-2 py-0.5 dark:bg-white/10">{m.difficulty}</span>
                      ) : null}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-100">{m.text}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <form onSubmit={onSubmit} className="border-t border-slate-900/10 p-3 dark:border-white/10">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  className="flex-1 rounded-2xl border border-slate-900/10 bg-white/90 px-4 py-3 text-sm outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  placeholder="Message… or /ai your question"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white dark:bg-white dark:text-slate-950"
                >
                  Send <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </GlassPanel>
        </section>

        <aside className="flex flex-col gap-4">
          <GlassPanel>
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              <Sparkles className="h-4 w-4 text-cyan-500" /> Live summary
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-200">
              {(summary.bullets?.length ? summary.bullets : ["Interact with /ai to build session checkpoints."]).map((b, i) => (
                <li key={i} className="rounded-xl border border-slate-900/10 bg-white/60 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                  {b}
                </li>
              ))}
            </ul>
            {summary.topics?.length ? <p className="mt-4 text-xs text-slate-500">Topics: {summary.topics.join(", ")}</p> : null}
          </GlassPanel>

          <GlassPanel>
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              <Activity className="h-4 w-4 text-emerald-500" /> Engagement
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-3 text-center">
              <Stat label="Score" value={engagement?.score ?? "—"} />
              <Stat label="Tier" value={engagement?.tier ?? "—"} />
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Watch time syncs every 15s. Chat spam reduces weight.
            </p>
          </GlassPanel>

          <GlassPanel>
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              <CircleDollarSign className="h-4 w-4 text-amber-500" /> Earnings tracker
            </h3>
            <p className="mt-3 text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {myEarnings != null ? `$${myEarnings.toFixed(2)}` : "—"}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Share of ${earnings?.poolUsd ?? poolUsd} pool from engagement score (demo).
            </p>
          </GlassPanel>

          <GlassPanel className="text-sm">
            <p className="font-black text-slate-700 dark:text-slate-200">Your profile</p>
            <label className="mt-3 block text-xs font-bold text-slate-500">
              Display name
              <input
                className="mt-1 w-full rounded-xl border border-slate-900/10 bg-white/90 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </label>
            <label className="mt-3 block text-xs font-bold text-slate-500">
              Level (Teaching Brain)
              <select
                className="mt-1 w-full rounded-xl border border-slate-900/10 bg-white/90 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-950 dark:text-white"
                value={userLevel}
                onChange={(e) => setUserLevel(e.target.value)}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>
            <p className="mt-3 text-xs text-slate-500">Refresh the page after changing level or name to re-join with new context.</p>
          </GlassPanel>
        </aside>
      </div>
    </div>
  );
}

function GlassPanel({ children, className = "" }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[2rem] border border-slate-900/10 bg-white/75 p-5 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.06] ${className}`}
    >
      {children}
    </motion.section>
  );
}

function MiniBadge({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold backdrop-blur">
      <Icon className="h-3.5 w-3.5" /> {label}
    </span>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-900/10 bg-slate-100/70 py-3 dark:border-white/10 dark:bg-white/5">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}
