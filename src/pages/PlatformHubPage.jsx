import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Bot,
  Clapperboard,
  Coins,
  GitBranch,
  LayoutGrid,
  Radio,
  ScanLine,
  Shield,
  Users,
  Zap,
} from "lucide-react";

export function PlatformHubPage() {
  const [manifest, setManifest] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/v1/platform/manifest")
      .then((r) => r.json())
      .then(setManifest)
      .catch(() => setErr("Start the API server to load the live manifest."));
  }, []);

  const modules = manifest?.modules || [];
  const iconMap = {
    streaming: Radio,
    "teaching-brain": BookOpen,
    engagement: Coins,
    "crypto-intelligence": ScanLine,
    automation: Bot,
    community: Users,
  };
  const links = {
    streaming: "/ai-streaming",
    "teaching-brain": "/ai-tutor",
    engagement: "/ai-streaming",
    "crypto-intelligence": "/platform#crypto",
    automation: "/automation",
    community: "/community",
  };

  return (
    <div className="space-y-10">
      <motion.header initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">
          <LayoutGrid className="h-3.5 w-3.5" /> CCWEB unified platform
        </span>
        <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
          One ecosystem: learn, earn, automate, analyze.
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          CCWEB combines live AI streaming with an AI Teaching Brain, engagement-weighted revenue, crypto intelligence,
          business automation with agents, and community tools — modular APIs and realtime channels for developers.
        </p>
      </motion.header>

      {err ? (
        <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">{err}</p>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((m) => {
          const Icon = iconMap[m.id] || Zap;
          const to = links[m.id] || "/";
          return (
            <Link
              key={m.id}
              to={to}
              className="group rounded-[2rem] border border-slate-900/10 bg-white/75 p-6 shadow-xl backdrop-blur-xl transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/[0.06]"
            >
              <Icon className="h-8 w-8 text-cyan-500" />
              <h2 className="mt-4 text-xl font-black">{m.name}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{m.description}</p>
              <p className="mt-3 text-xs font-mono text-slate-500">{m.apiPrefix}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-cyan-600 dark:text-cyan-300">
                Open <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-slate-900/10 bg-white/70 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05]">
          <h3 className="flex items-center gap-2 text-xl font-black">
            <Clapperboard className="h-6 w-6 text-cyan-500" /> Example: session lifecycle
          </h3>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
            <li>User joins stream → <code className="rounded bg-slate-100 px-1 dark:bg-white/10">POST /api/streaming/rooms/…/attendance</code></li>
            <li>Realtime channel → <code className="rounded bg-slate-100 px-1 dark:bg-white/10">WebSocket /ws?roomId=&amp;userId=</code></li>
            <li>Teaching Brain answers → <code className="rounded bg-slate-100 px-1 dark:bg-white/10">POST /api/v1/teaching-brain/answer</code></li>
            <li>Engagement scored → <code className="rounded bg-slate-100 px-1 dark:bg-white/10">POST /api/v1/engagement/score</code></li>
            <li>Payout pool → existing streaming payout + distribution endpoints</li>
          </ol>
        </div>
        <div id="crypto" className="rounded-[2rem] border border-slate-900/10 bg-white/70 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05]">
          <h3 className="flex items-center gap-2 text-xl font-black">
            <Shield className="h-6 w-6 text-violet-500" /> Crypto intelligence (MVP)
          </h3>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Token safety scan and signals dashboard — wire on-chain indexers in production.
          </p>
          <ul className="mt-4 space-y-2 text-sm font-mono text-slate-600 dark:text-slate-400">
            <li>POST /api/v1/crypto/scan</li>
            <li>GET /api/v1/crypto/signals</li>
            <li>GET /api/v1/crypto/scans</li>
          </ul>
          <Link to="/pricing" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-cyan-600 dark:text-cyan-300">
            Plans & usage <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="rounded-[2rem] border border-dashed border-slate-900/20 bg-white/40 p-6 dark:border-white/15 dark:bg-white/[0.03]">
        <h3 className="flex items-center gap-2 text-lg font-black">
          <GitBranch className="h-5 w-5" /> Developer surface
        </h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          JSON manifest: <code className="rounded bg-slate-100 px-1 dark:bg-white/10">GET /api/v1/platform/manifest</code> — use it to discover modules and route mobile or partner apps.
        </p>
      </section>
    </div>
  );
}
