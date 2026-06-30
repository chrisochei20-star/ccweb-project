import { LayoutDashboard, Workflow } from "lucide-react";
import { Link } from "react-router-dom";

export function BuildHubPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5 px-3 pb-6 pt-3 md:max-w-5xl">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-ccweb-violet">
          Build
        </p>

        <h1 className="mt-1 text-2xl font-bold text-white md:text-3xl">
          Ship faster on CCWEB
        </h1>

        <p className="mt-1 max-w-2xl text-sm text-ccweb-muted">
          AI agents and workflow automation for creators and businesses.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/workflows"
          className="ccweb-glass group flex flex-col rounded-2xl p-5 transition hover:border-ccweb-cyan/45"
        >
          <LayoutDashboard className="h-8 w-8 text-ccweb-cyan" />

          <h2 className="mt-3 text-lg font-semibold text-white">
            Workflow Automation
          </h2>

          <p className="mt-1 text-sm text-ccweb-muted">
            Drag-and-drop canvas, templates and automation flows.
          </p>

          <span className="mt-4 text-sm font-medium text-ccweb-cyan group-hover:underline">
            Open workflow →
          </span>
        </Link>

        <Link
          to="/ai-agents"
          className="ccweb-glass group flex flex-col rounded-2xl p-5 transition hover:border-ccweb-violet/45"
        >
          <Workflow className="h-8 w-8 text-ccweb-violet" />

          <h2 className="mt-3 text-lg font-semibold text-white">
            AI Agents
          </h2>

          <p className="mt-1 text-sm text-ccweb-muted">
            Configure agents and automate intelligent tasks.
          </p>

          <span className="mt-4 text-sm font-medium text-ccweb-violet group-hover:underline">
            Manage agents →
          </span>
        </Link>
      </div>

      <section className="ccweb-glass rounded-2xl p-5">
        <h3 className="font-semibold text-white">
          Workflow automation
        </h3>

        <p className="mt-2 text-sm text-ccweb-muted">
          Build automation inside Growth Hub without blockchain or wallet
          dependencies.
        </p>

        <Link
          to="/growth-hub"
          className="mt-3 inline-block text-sm font-medium text-ccweb-cyan hover:underline"
        >
          Open Growth Hub workflows →
        </Link>
      </section>
    </div>
  );
}
