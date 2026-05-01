import {
  Activity,
  ArrowRight,
  Bot,
  Boxes,
  Gauge,
  GitBranch,
  Layers,
  LineChart,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

const TENANT_ID = "default";

export function AutomationHubPage() {
  const [snapshot, setSnapshot] = useState(null);
  const [agents, setAgents] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [problem, setProblem] = useState("I need more qualified leads from search and referrals.");
  const [solveResult, setSolveResult] = useState(null);
  const [compatText, setCompatText] = useState(
    "We manually copy booking requests from email into a spreadsheet, then call customers back within 48 hours.",
  );
  const [compatReport, setCompatReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadAll = useCallback(async () => {
    setError("");
    try {
      const [monRes, agRes, pipeRes, tplRes] = await Promise.all([
        fetch(`/api/automation/monitoring/snapshot?tenantId=${encodeURIComponent(TENANT_ID)}`),
        fetch("/api/automation/agents"),
        fetch(`/api/automation/pipelines?tenantId=${encodeURIComponent(TENANT_ID)}`),
        fetch("/api/automation/templates"),
      ]);
      const mon = await monRes.json();
      const ag = await agRes.json();
      const pipes = await pipeRes.json();
      const tpl = await tplRes.json();
      if (!monRes.ok) throw new Error(mon.error || "Monitoring failed");
      if (!agRes.ok) throw new Error(ag.error || "Agents failed");
      if (!pipeRes.ok) throw new Error(pipes.error || "Pipelines failed");
      if (!tplRes.ok) throw new Error(tpl.error || "Templates failed");
      setSnapshot(mon);
      setAgents(ag.agents || []);
      setPipelines(pipes.pipelines || []);
      setTemplates(tpl.templates || []);
    } catch (e) {
      setError(e.message || "Could not load automation hub.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function runSolve() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/automation/problems/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem, tenantId: TENANT_ID }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Solve failed");
      setSolveResult(data);
      await loadAll();
    } catch (e) {
      setError(e.message || "Solve failed");
    } finally {
      setBusy(false);
    }
  }

  async function runCompatibility() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/automation/compatibility/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowDescription: compatText, businessFunction: "operations" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analyze failed");
      setCompatReport(data);
    } catch (e) {
      setError(e.message || "Analyze failed");
    } finally {
      setBusy(false);
    }
  }

  async function createFromTemplate(templateId) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/automation/pipelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, tenantId: TENANT_ID }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");
      await loadAll();
      await runPipeline(data.id);
    } catch (e) {
      setError(e.message || "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function runPipeline(pipelineId) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/automation/pipelines/${encodeURIComponent(pipelineId)}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: TENANT_ID, goal: problem }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Run failed");
      await loadAll();
    } catch (e) {
      setError(e.message || "Run failed");
    } finally {
      setBusy(false);
    }
  }

  const metrics = snapshot?.metrics;

  return (
    <div className="space-y-10">
      <motion.header initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl">
        <Pill icon={Sparkles}>CCWEB Business Automation Hub</Pill>
        <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
          Agent Operator: your business autopilot.
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          Describe an outcome in plain language. The Agent Operator interprets it, builds a pipeline, assigns specialized agents,
          and monitors conversion, cost, and errors with continuous feedback loops.
        </p>
      </motion.header>

      {error ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-700 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile icon={Bot} label="Active agents" value={loading ? "…" : String(agents.filter((a) => a.status === "running").length)} hint="Running instances" />
        <MetricTile icon={GitBranch} label="Workflows" value={loading ? "…" : String(pipelines.filter((p) => p.status === "active").length)} hint="Active pipelines" />
        <MetricTile
          icon={LineChart}
          label="Conversion (proxy)"
          value={loading ? "…" : `${metrics?.conversionRatePercent?.toFixed?.(1) ?? "—"}%`}
          hint="Attributed funnel"
        />
        <MetricTile
          icon={Activity}
          label="Revenue impact (est.)"
          value={loading ? "…" : money(metrics?.revenueImpactUsd)}
          hint="Rolling blend"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <GlassCard className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Business problem solver</p>
              <h2 className="mt-2 text-2xl font-black">One sentence → plan, agents, execution</h2>
            </div>
            <Target className="h-8 w-8 shrink-0 text-cyan-500" />
          </div>
          <label className="mt-6 block text-sm font-bold text-slate-700 dark:text-slate-200" htmlFor="problem-input">
            What do you want to improve?
          </label>
          <textarea
            id="problem-input"
            rows={3}
            className="mt-2 w-full rounded-2xl border border-slate-900/10 bg-white/90 px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
          />
          <button
            type="button"
            disabled={busy}
            onClick={runSolve}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-xl shadow-slate-950/15 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 sm:w-auto"
          >
            {busy ? "Generating…" : "Generate automation plan"} <ArrowRight className="h-4 w-4" />
          </button>

          {solveResult ? (
            <div className="mt-6 space-y-4 rounded-[1.5rem] border border-emerald-500/20 bg-emerald-500/5 p-5 dark:bg-emerald-500/10">
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">Interpreted intent</p>
              <p className="text-sm text-slate-700 dark:text-slate-200">{solveResult.interpretation?.intent}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-900/10 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Pipeline</p>
                  <p className="mt-1 font-black">{solveResult.pipeline?.name}</p>
                  <p className="mt-2 text-xs text-slate-500">{solveResult.pipeline?.id}</p>
                </div>
                <div className="rounded-2xl border border-slate-900/10 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Success score</p>
                  <p className="mt-1 text-2xl font-black">{solveResult.run?.successScore ?? "—"}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Assigned agents</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-200">
                  {(solveResult.pipeline?.assignedAgents || []).map((a) => (
                    <li key={a.agentTypeId}>• {a.name}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </GlassCard>

        <GlassCard className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Agent compatibility engine</p>
              <h2 className="mt-2 text-2xl font-black">Make workflows agent-ready</h2>
            </div>
            <Layers className="h-8 w-8 shrink-0 text-violet-500" />
          </div>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Paste how work happens today. We break it into steps, map agent actions, and flag risks for marketing, legal, finance, ops, or research.
          </p>
          <textarea
            rows={5}
            className="mt-4 w-full rounded-2xl border border-slate-900/10 bg-white/90 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-400/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
            value={compatText}
            onChange={(e) => setCompatText(e.target.value)}
          />
          <button
            type="button"
            disabled={busy}
            onClick={runCompatibility}
            className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-slate-900/10 bg-white/70 px-5 py-3 text-sm font-black text-slate-800 transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 sm:w-auto"
          >
            Analyze compatibility
          </button>

          {compatReport ? (
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white dark:bg-white dark:text-slate-950">
                  Score {compatReport.compatibilityScore}%
                </span>
                <span className="rounded-full border border-slate-900/15 px-3 py-1 text-xs font-bold dark:border-white/15">
                  {compatReport.agentCompatible ? "Agent-compatible" : "Needs integration work"}
                </span>
              </div>
              <ul className="space-y-2 text-slate-700 dark:text-slate-200">
                {(compatReport.steps || []).map((s) => (
                  <li key={s.id} className="rounded-2xl border border-slate-900/10 bg-slate-100/60 p-3 dark:border-white/10 dark:bg-white/5">
                    <span className="font-black">{s.title}</span>
                    <span className="text-slate-500"> — {s.actions?.length || 0} actions</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </GlassCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black">Active agents</h3>
            <Bot className="h-6 w-6 text-cyan-500" />
          </div>
          <ul className="mt-5 space-y-3">
            {(loading ? [] : agents).map((a) => (
              <li key={a.id} className="flex items-center justify-between rounded-2xl border border-slate-900/10 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                <div>
                  <p className="font-bold">{a.name}</p>
                  <p className="text-xs text-slate-500">{a.agentTypeId}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${
                    a.status === "running"
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : "bg-slate-500/15 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {a.status}
                </span>
              </li>
            ))}
            {!loading && !agents.length ? <li className="text-sm text-slate-500">No agents yet.</li> : null}
          </ul>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black">Running workflows</h3>
            <Boxes className="h-6 w-6 text-emerald-500" />
          </div>
          <ul className="mt-5 space-y-3">
            {(loading ? [] : pipelines).map((p) => (
              <li key={p.id} className="rounded-2xl border border-slate-900/10 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-black">{p.name}</p>
                  <span className="rounded-full bg-slate-950/90 px-3 py-1 text-xs font-bold text-white dark:bg-white dark:text-slate-950">
                    {p.status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">{p.templateId}</p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => runPipeline(p.id)}
                  className="mt-3 text-sm font-bold text-cyan-600 hover:underline dark:text-cyan-300"
                >
                  Run operator cycle
                </button>
              </li>
            ))}
            {!loading && !pipelines.length ? <li className="text-sm text-slate-500">No pipelines yet — use a template below.</li> : null}
          </ul>
        </GlassCard>
      </section>

      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Pill icon={Gauge}>Pipeline templates</Pill>
            <h3 className="mt-3 text-2xl font-black">Prebuilt modules — tap to instantiate</h3>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
              Modular graph: Input → AI analysis → task breakdown → agent assignment → execution → feedback. Drag-and-drop builder can snap to these nodes in a future release; today, templates compile instantly.
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {(loading ? [] : templates).map((tpl) => (
            <GlassCard key={tpl.id} className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{tpl.domain}</p>
                  <h4 className="mt-2 text-xl font-black">{tpl.name}</h4>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{tpl.description}</p>
                </div>
                <Zap className="h-7 w-7 shrink-0 text-amber-500" />
              </div>
              <ol className="mt-4 space-y-2">
                {tpl.stages.map((s, i) => (
                  <li key={s.id || i} className="flex gap-3 text-sm">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-950 text-xs font-black text-white dark:bg-white dark:text-slate-950">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-bold">{s.label}</p>
                      <p className="text-xs text-slate-500">{s.kind} · {s.agentHint}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <button
                type="button"
                disabled={busy}
                onClick={() => createFromTemplate(tpl.id)}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white dark:bg-white dark:text-slate-950"
              >
                Use template <ArrowRight className="h-4 w-4" />
              </button>
            </GlassCard>
          ))}
        </div>
      </section>

      <GlassCard className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black">Performance monitoring</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Operator tracks conversion proxies, response rates, revenue impact, and error budgets — then proposes adjustments.
            </p>
          </div>
          <Gauge className="h-8 w-8 text-cyan-500" />
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <MiniStat label="Response rate" value={`${metrics?.responseRatePercent?.toFixed?.(1) ?? "—"}%`} />
          <MiniStat label="Cost / outcome" value={money(metrics?.costPerOutcomeUsd)} />
          <MiniStat label="Error rate" value={`${metrics?.errorRatePercent?.toFixed?.(2) ?? "—"}%`} />
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div>
            <p className="text-sm font-black">Recent insights</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-200">
              {(snapshot?.recentInsights || []).map((i) => (
                <li key={i.id} className="rounded-2xl border border-slate-900/10 bg-slate-100/60 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                  <span className="font-bold">{i.title}</span> — {i.detail}
                </li>
              ))}
              {!snapshot?.recentInsights?.length ? <li className="text-slate-500">Run a pipeline to populate insights.</li> : null}
            </ul>
          </div>
          <div>
            <p className="text-sm font-black">Recommendations</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-200">
              {(snapshot?.recommendations || []).map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="border-dashed p-6">
        <h4 className="text-lg font-black">Example scenario</h4>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          A regional clinic types: “Automate my booking system and remind patients.” The solver selects the support and operations template,
          assigns the Ops Runner and Support Resolver agents, connects calendar and SMS tools in the execution stage, and opens a feedback loop
          that raises conversion on confirmed appointments while flagging legal risk if messaging touches PHI — handled with human review gates.
        </p>
      </GlassCard>
    </div>
  );
}

function GlassCard({ children, className = "" }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className={`rounded-[2rem] border border-slate-900/10 bg-white/75 shadow-xl shadow-slate-950/[0.04] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/20 ${className}`}
    >
      {children}
    </motion.article>
  );
}

function Pill({ children, icon: Icon }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-300">
      <Icon className="h-3.5 w-3.5" /> {children}
    </span>
  );
}

function MetricTile({ icon: Icon, label, value, hint }) {
  return (
    <GlassCard className="p-5">
      <Icon className="h-6 w-6 text-cyan-500" />
      <p className="mt-4 text-3xl font-black">{value}</p>
      <p className="mt-1 text-sm font-bold text-slate-700 dark:text-slate-200">{label}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </GlassCard>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-900/10 bg-slate-100/70 p-4 dark:border-white/10 dark:bg-white/5">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-black">{value}</p>
    </div>
  );
}

function money(value) {
  if (value === undefined || value === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}
