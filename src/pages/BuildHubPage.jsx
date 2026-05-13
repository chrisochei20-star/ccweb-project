import { History, LayoutDashboard, Link2, ShoppingBag, Workflow } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchAgentRuns } from "../api/agentsApi";
import { Skeleton } from "../components/ui/Skeleton";

export function BuildHubPage() {
  const { user } = useOutletContext() || {};
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setRuns([]);
      return;
    }
    let c = false;
    setLoading(true);
    setError(null);
    fetchAgentRuns(20)
      .then((list) => {
        if (!c) setRuns(list);
      })
      .catch((e) => {
        if (!c) setError(e.message || "Could not load runs");
      })
      .finally(() => {
        if (!c) setLoading(false);
      });
    return () => {
      c = true;
    };
  }, [user]);

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-3 pb-6 pt-3 md:max-w-5xl">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-ccweb-violet">Build</p>
        <h1 className="mt-1 text-2xl font-bold text-white md:text-3xl">Ship faster on CCWEB</h1>
        <p className="mt-1 max-w-2xl text-sm text-ccweb-muted">
          Visual DApp builder, AI agents with persisted run history on PostgreSQL, and automation workflows.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          to="/dapp-builder"
          className="ccweb-glass group flex flex-col rounded-2xl p-5 transition hover:border-ccweb-cyan/45"
        >
          <LayoutDashboard className="h-8 w-8 text-ccweb-cyan" />
          <h2 className="mt-3 text-lg font-semibold text-white">DApp Builder</h2>
          <p className="mt-1 text-sm text-ccweb-muted">Drag-and-drop canvas, templates, deploy flow.</p>
          <span className="mt-4 text-sm font-medium text-ccweb-cyan group-hover:underline">Open builder →</span>
        </Link>
        <Link
          to="/ai-agents"
          className="ccweb-glass group flex flex-col rounded-2xl p-5 transition hover:border-ccweb-violet/45"
        >
          <Workflow className="h-8 w-8 text-ccweb-violet" />
          <h2 className="mt-3 text-lg font-semibold text-white">AI Agents</h2>
          <p className="mt-1 text-sm text-ccweb-muted">Configure agents and run against live APIs.</p>
          <span className="mt-4 text-sm font-medium text-ccweb-violet group-hover:underline">Manage agents →</span>
        </Link>
        <Link
          to="/shop"
          className="ccweb-glass group flex flex-col rounded-2xl p-5 transition hover:border-ccweb-green/45"
        >
          <ShoppingBag className="h-8 w-8 text-ccweb-green" />
          <h2 className="mt-3 text-lg font-semibold text-white">Creator shop</h2>
          <p className="mt-1 text-sm text-ccweb-muted">AI tools, agents, and workflows with Flutterwave checkout.</p>
          <span className="mt-4 text-sm font-medium text-ccweb-green group-hover:underline">Browse marketplace →</span>
        </Link>
        <Link
          to="/developers/onboarding"
          className="ccweb-glass group flex flex-col rounded-2xl p-5 transition hover:border-ccweb-violet/45"
        >
          <Link2 className="h-8 w-8 text-ccweb-cyan" />
          <h2 className="mt-3 text-lg font-semibold text-white">Developer API</h2>
          <p className="mt-1 text-sm text-ccweb-muted">Keys, onboarding, and REST v1 integration.</p>
          <span className="mt-4 text-sm font-medium text-ccweb-cyan group-hover:underline">Start onboarding →</span>
        </Link>
      </div>

      <section className="ccweb-glass rounded-2xl p-5">
        <h3 className="flex items-center gap-2 font-semibold text-white">
          <History className="h-5 w-5 text-ccweb-cyan" />
          Recent AI runs
        </h3>
        <p className="mt-1 text-xs text-ccweb-muted">
          Successful <code className="text-ccweb-cyan">POST /api/v1/agents/run</code> calls are stored in{" "}
          <code className="text-ccweb-cyan">ccweb_agent_runs</code> when PostgreSQL is enabled.
        </p>
        {!user && <p className="mt-3 text-sm text-ccweb-muted">Sign in to load your run history.</p>}
        {user && loading && (
          <div className="mt-4 space-y-2">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        )}
        {user && error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
        {user && !loading && runs.length === 0 && (
          <p className="mt-3 text-sm text-ccweb-muted">No runs yet — execute an agent from the AI Agents page.</p>
        )}
        {user && !loading && runs.length > 0 && (
          <ul className="mt-4 max-h-72 space-y-2 overflow-y-auto text-sm">
            {runs.map((r) => (
              <li key={r.id} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-mono text-xs text-ccweb-cyan">{r.agentId}</span>
                  <span className="text-[10px] text-ccweb-muted">{new Date(r.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-white/85">{r.outputPreview}</p>
                {r.mock && <p className="mt-1 text-[10px] uppercase text-amber-200/90">Mock model</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="ccweb-glass rounded-2xl p-5">
        <h3 className="font-semibold text-white">Workflow automation</h3>
        <p className="mt-2 text-sm text-ccweb-muted">
          Compose triggers and actions in the Growth Hub campaigns tab, or extend with{" "}
          <code className="rounded bg-black/40 px-1 py-0.5 text-ccweb-cyan">/api/v1/agents/run</code> when authenticated.
        </p>
        <Link to="/growth-hub" className="mt-3 inline-block text-sm font-medium text-ccweb-cyan hover:underline">
          Open Growth Hub workflows →
        </Link>
      </section>
    </div>
  );
}
