import { LayoutDashboard, Link2, Workflow } from "lucide-react";
import { Link } from "react-router-dom";

export function BuildHubPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5 px-3 pb-6 pt-3 md:max-w-5xl">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-ccweb-violet">Build</p>
        <h1 className="mt-1 text-2xl font-bold text-white md:text-3xl">Ship faster on CCWEB</h1>
        <p className="mt-1 max-w-2xl text-sm text-ccweb-muted">
          Visual DApp builder, AI agents, and automation workflows — connected to the same APIs you use in production.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          to="/workflows"
          className="ccweb-glass group flex flex-col rounded-2xl p-5 transition hover:border-ccweb-cyan/45"
        >
          <LayoutDashboard className="h-8 w-8 text-ccweb-cyan" />
          <h2 className="mt-3 text-lg font-semibold text-white">Workflow Automation</h2>
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
          to="/developers/onboarding"
          className="ccweb-glass group flex flex-col rounded-2xl p-5 transition hover:border-ccweb-green/45"
        >
          <Link2 className="h-8 w-8 text-ccweb-green" />
          <h2 className="mt-3 text-lg font-semibold text-white">Developer API</h2>
          <p className="mt-1 text-sm text-ccweb-muted">Keys, onboarding, and REST v1 integration.</p>
          <span className="mt-4 text-sm font-medium text-ccweb-green group-hover:underline">Start onboarding →</span>
        </Link>
      </div>

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
