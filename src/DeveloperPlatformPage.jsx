import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

const LS_KEY = "ccweb_dev_api_key";

export function DeveloperPlatformPage() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(LS_KEY) || "");
  const [newKeyName, setNewKeyName] = useState("My integration");
  const [createdSecret, setCreatedSecret] = useState(null);
  const [keys, setKeys] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tiers, setTiers] = useState(null);
  const [sessions, setSessions] = useState(null);
  const [usage, setUsage] = useState(null);
  const [logs, setLogs] = useState([]);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [marketplace, setMarketplace] = useState([]);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const loadConsole = useCallback(async () => {
    setErr(null);
    try {
      const [k, p, t, l, m] = await Promise.all([
        fetch("/api/developer/keys").then((r) => r.json()),
        fetch("/api/developer/projects").then((r) => r.json()),
        fetch("/api/developer/billing/tiers").then((r) => r.json()),
        fetch("/api/developer/logs").then((r) => r.json()),
        fetch("/api/developer/marketplace").then((r) => r.json()),
      ]);
      setKeys(k.keys || []);
      setProjects(p.projects || []);
      setTiers(t);
      setLogs(l.logs || []);
      setMarketplace(m.listings || []);
    } catch (e) {
      setErr(e.message);
    }
  }, []);

  useEffect(() => {
    loadConsole();
  }, [loadConsole]);

  useEffect(() => {
    if (apiKey) localStorage.setItem(LS_KEY, apiKey);
  }, [apiKey]);

  async function createKey() {
    setErr(null);
    setCreatedSecret(null);
    try {
      const res = await fetch("/api/developer/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName, roles: ["developer", "viewer", "admin"] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setCreatedSecret(data.secret);
      setApiKey(data.secret);
      setMsg("New key created — stored in this browser.");
      loadConsole();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function testPublicApi() {
    setErr(null);
    setSessions(null);
    if (!apiKey.trim()) {
      setErr("Paste an API key first.");
      return;
    }
    try {
      const res = await fetch("/v1/sessions", { headers: { CCWEB_API_KEY: apiKey.trim() } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      setSessions(data);
      setMsg("GET /v1/sessions OK");
      loadConsole();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function loadUsage() {
    setErr(null);
    setUsage(null);
    if (!apiKey.trim()) {
      setErr("Paste an API key first.");
      return;
    }
    try {
      const res = await fetch("/v1/analytics", { headers: { CCWEB_API_KEY: apiKey.trim() } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      setUsage(data);
      setMsg("Usage snapshot loaded");
      loadConsole();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function addWebhook() {
    setErr(null);
    if (!webhookUrl.trim()) return;
    try {
      const res = await fetch("/api/developer/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMsg(`Webhook created. Signing secret (save once): ${data.secret}`);
      setWebhookUrl("");
      loadConsole();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function addListing() {
    setErr(null);
    try {
      await fetch("/api/developer/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "agent", title: "Sample automation", priceUsd: 29 }),
      });
      loadConsole();
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-ccweb-cyan">Build · Developer</p>
        <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Developer platform</h1>
        <p className="mt-2 max-w-3xl text-sm text-ccweb-muted">
          Create API keys (console routes are open in this prototype — lock behind auth in production), call the Public
          API at <code className="text-ccweb-cyan">/v1</code>, browse OpenAPI docs, and wire webhooks.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/developers/onboarding"
            className="inline-flex items-center rounded-xl bg-gradient-to-r from-ccweb-cyan to-ccweb-violet px-4 py-2 text-sm font-semibold text-[#061329]"
          >
            5-minute onboarding
          </Link>
          <a
            href="/docs/DEVELOPER_QUICKSTART.md"
            className="inline-flex items-center rounded-xl border border-white/20 px-4 py-2 text-sm text-ccweb-cyan"
            target="_blank"
            rel="noreferrer"
          >
            Quick start guide
          </a>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-ccweb-border bg-ccweb-card p-5 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white">API keys</h2>
          <p className="mt-1 text-xs text-ccweb-muted">POST /api/developer/keys — secret shown once.</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Key name"
            />
            <button type="button" className="rounded-xl bg-gradient-to-r from-ccweb-cyan to-ccweb-violet px-4 py-2 text-sm font-semibold text-[#061329]" onClick={createKey}>
              Create key
            </button>
          </div>
          {createdSecret && (
            <p className="mt-3 break-all rounded-lg bg-black/40 p-2 font-mono text-xs text-emerald-300">{createdSecret}</p>
          )}
          <ul className="mt-4 space-y-2 text-sm text-ccweb-muted">
            {keys.map((k) => (
              <li key={k.id} className="flex justify-between gap-2 border-b border-white/10 py-2">
                <span>{k.name}</span>
                <span className="font-mono text-xs">{k.keyPrefix}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-ccweb-border bg-ccweb-card p-5 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white">Public API test</h2>
          <p className="mt-1 text-xs text-ccweb-muted">Header: CCWEB-API-Key</p>
          <textarea
            className="mt-3 w-full rounded-xl border border-white/15 bg-black/30 p-3 font-mono text-xs text-white"
            rows={2}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Paste API key"
          />
          <button type="button" className="mt-3 rounded-xl border border-white/20 px-4 py-2 text-sm text-ccweb-cyan" onClick={testPublicApi}>
            GET /v1/sessions
          </button>
          <button type="button" className="ml-2 mt-3 rounded-xl border border-white/20 px-4 py-2 text-sm text-white" onClick={loadUsage}>
            GET /v1/analytics (usage)
          </button>
          {sessions && (
            <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-black/50 p-2 text-xs text-slate-300">
              {JSON.stringify(sessions, null, 2)}
            </pre>
          )}
          {usage && (
            <div className="mt-3 rounded-lg border border-white/10 bg-black/35 p-3 text-xs text-ccweb-muted">
              <p>
                <span className="text-ccweb-cyan">callsThisMonth</span>: {usage.callsThisMonth ?? "—"} ·{" "}
                <span className="text-ccweb-cyan">rateLimitPerMin</span>: {usage.rateLimitPerMin ?? "—"}
              </p>
              <p className="mt-1 text-[11px] opacity-80">projectId: {usage.projectId}</p>
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-ccweb-border bg-ccweb-card p-5 backdrop-blur-xl">
        <h2 className="text-lg font-semibold text-white">Projects &amp; billing</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-ccweb-muted">Projects</h3>
            <ul className="mt-2 text-sm text-white">
              {projects.map((p) => (
                <li key={p.id}>
                  {p.name} · <span className="text-ccweb-muted">{p.tier}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-ccweb-muted">Tiers</h3>
            <ul className="mt-2 text-sm text-ccweb-muted">
              {tiers?.tiers?.map((t) => (
                <li key={t.id}>
                  {t.id}: ${t.priceUsd}/mo — {t.limits.rpm} RPM
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-ccweb-border bg-ccweb-card p-5 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white">Webhooks</h2>
          <input
            className="mt-3 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://example.com/hook"
          />
          <button type="button" className="mt-2 rounded-xl border border-white/20 px-4 py-2 text-sm" onClick={addWebhook}>
            Register webhook
          </button>
        </section>
        <section className="rounded-2xl border border-ccweb-border bg-ccweb-card p-5 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white">Marketplace (prototype)</h2>
          <button type="button" className="mt-2 rounded-xl border border-white/20 px-4 py-2 text-sm" onClick={addListing}>
            Add sample listing
          </button>
          <ul className="mt-3 text-sm text-ccweb-muted">
            {marketplace.map((x) => (
              <li key={x.id}>
                {x.title} — ${x.priceUsd}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-2xl border border-ccweb-border bg-ccweb-card p-5 backdrop-blur-xl">
        <h2 className="text-lg font-semibold text-white">Request logs</h2>
        <pre className="mt-3 max-h-48 overflow-auto rounded-lg bg-black/50 p-3 text-xs text-slate-400">
          {JSON.stringify(logs.slice(0, 20), null, 2)}
        </pre>
      </section>

      <section className="rounded-2xl border border-ccweb-border bg-ccweb-card p-5 backdrop-blur-xl">
        <h2 className="text-lg font-semibold text-white">Documentation</h2>
        <p className="mt-2 text-sm text-ccweb-muted">
          <a href="/api/developer/docs" className="text-ccweb-cyan underline" target="_blank" rel="noreferrer">
            Swagger UI
          </a>{" "}
          ·{" "}
          <a href="/api/developer/openapi.json" className="text-ccweb-cyan underline" target="_blank" rel="noreferrer">
            OpenAPI JSON
          </a>{" "}
          · Sandbox: <code className="text-ccweb-cyan">POST /api/developer/sandbox/echo</code>,{" "}
          <code className="text-ccweb-cyan">POST /api/developer/sandbox/workflow</code> ·{" "}
          <Link to="/dapp-builder" className="text-ccweb-cyan underline">
            DApp builder UI
          </Link>{" "}
          ·{" "}
          <a href="https://github.com/chrisochei20-star/ccweb-project/blob/main/docs/DEVELOPER_ECOSYSTEM.md" className="text-ccweb-cyan underline" target="_blank" rel="noreferrer">
            Architecture doc
          </a>
        </p>
      </section>

      {msg && <p className="text-sm text-emerald-300">{msg}</p>}
      {err && <p className="text-sm text-rose-400">{err}</p>}
    </div>
  );
}
