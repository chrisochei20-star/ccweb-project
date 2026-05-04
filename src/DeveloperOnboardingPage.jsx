import { Link, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchMe, getStoredUser } from "./session";

const LS_KEY = "ccweb_dev_api_key";
const LS_PROJECT = "ccweb_dev_onboarding_project_id";
const LS_STEP = "ccweb_onboarding_step";

const STEPS = [
  { id: 0, title: "Account", hint: "~1 min" },
  { id: 1, title: "Project", hint: "~1 min" },
  { id: 2, title: "API key", hint: "~1 min" },
  { id: 3, title: "Choose path", hint: "~1 min" },
  { id: 4, title: "Quick start", hint: "~1 min" },
];

function cardClass(active) {
  return `rounded-2xl border p-5 backdrop-blur-xl transition ${
    active
      ? "border-ccweb-cyan/50 bg-ccweb-cyan/10 shadow-[0_0_24px_rgba(17,212,255,0.12)]"
      : "border-ccweb-border bg-ccweb-card hover:border-white/25"
  }`;
}

export function DeveloperOnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(() => {
    const s = parseInt(sessionStorage.getItem(LS_STEP) || "0", 10);
    return Number.isFinite(s) && s >= 0 && s <= 4 ? s : 0;
  });
  const [user, setUser] = useState(() => getStoredUser());
  const [projectName, setProjectName] = useState("My first CCWEB project");
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState(() => sessionStorage.getItem(LS_PROJECT) || "");
  const [keyName, setKeyName] = useState("Onboarding key");
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(LS_KEY) || "");
  const [createdSecret, setCreatedSecret] = useState(null);
  const [pathChoice, setPathChoice] = useState(null);
  const [sandboxResult, setSandboxResult] = useState(null);
  const [apiTestResult, setApiTestResult] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    sessionStorage.setItem(LS_STEP, String(step));
  }, [step]);

  useEffect(() => {
    if (projectId) sessionStorage.setItem(LS_PROJECT, projectId);
  }, [projectId]);

  useEffect(() => {
    if (apiKey) localStorage.setItem(LS_KEY, apiKey);
  }, [apiKey]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const u = await fetchMe();
      if (!cancelled) setUser(u || getStoredUser());
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/developer/projects");
      const data = await res.json();
      setProjects(data.projects || []);
      if (!projectId && data.projects?.length) {
        const first = data.projects[0].id;
        setProjectId(first);
      }
    } catch {
      /* ignore */
    }
  }, [projectId]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const baseUrl = useMemo(() => {
    if (typeof window === "undefined") return "http://127.0.0.1:3000";
    return `${window.location.protocol}//${window.location.host}`;
  }, []);

  const curlSnippet = useMemo(() => {
    const key = apiKey || "<YOUR_CCWEB_API_KEY>";
    return `curl -s "${baseUrl}/v1/sessions" \\\n  -H "CCWEB-API-Key: ${key}"`;
  }, [apiKey, baseUrl]);

  const nodeSnippet = useMemo(() => {
    const key = apiKey || "<YOUR_CCWEB_API_KEY>";
    return `const res = await fetch("${baseUrl}/v1/sessions", {\n  headers: { "CCWEB-API-Key": "${key}" },\n});\nconsole.log(await res.json());`;
  }, [apiKey, baseUrl]);

  async function createProject() {
    setErr(null);
    setBusy(true);
    try {
      const ownerUserId = user?.email || user?.id || "anonymous";
      const res = await fetch("/api/developer/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName.trim() || "My project", ownerUserId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create project");
      setProjectId(data.id);
      await loadProjects();
      setStep(2);
    } catch (e) {
      setErr(e.message);
    }
    setBusy(false);
  }

  async function generateKey() {
    setErr(null);
    setCreatedSecret(null);
    setBusy(true);
    try {
      const pid = projectId || (projects[0] && projects[0].id);
      const res = await fetch("/api/developer/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: keyName,
          projectId: pid,
          roles: ["developer", "viewer", "admin"],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create key");
      setCreatedSecret(data.secret);
      setApiKey(data.secret);
      setStep(3);
    } catch (e) {
      setErr(e.message);
    }
    setBusy(false);
  }

  async function runSandbox() {
    setErr(null);
    setSandboxResult(null);
    setBusy(true);
    try {
      const res = await fetch("/api/developer/sandbox/echo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "onboarding", at: new Date().toISOString() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sandbox failed");
      setSandboxResult(data);
    } catch (e) {
      setErr(e.message);
    }
    setBusy(false);
  }

  async function runApiTest() {
    setErr(null);
    setApiTestResult(null);
    if (!apiKey.trim()) {
      setErr("Create or paste an API key first.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/v1/analytics", { headers: { CCWEB_API_KEY: apiKey.trim() } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      setApiTestResult(data);
    } catch (e) {
      setErr(e.message);
    }
    setBusy(false);
  }

  function goPath(choice) {
    setPathChoice(choice);
    setStep(4);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-20 pt-4">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-ccweb-cyan">Developer onboarding</p>
        <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Ship on CCWEB in about five minutes</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-ccweb-muted">
          Create a project, mint an API key, pick a builder path, then copy runnable examples. No credit card in this
          prototype.
        </p>
      </header>

      <nav aria-label="Progress" className="flex flex-wrap justify-center gap-2">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => i <= step && setStep(i)}
            disabled={i > step}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              step === i
                ? "bg-gradient-to-r from-ccweb-cyan to-ccweb-violet text-[#061329]"
                : i < step
                  ? "border border-ccweb-green/40 bg-ccweb-green/10 text-ccweb-green"
                  : "border border-white/10 text-ccweb-muted"
            } ${i > step ? "cursor-not-allowed opacity-50" : ""}`}
          >
            {i + 1}. {s.title}
            <span className="ml-1 opacity-70">{s.hint}</span>
          </button>
        ))}
      </nav>

      {step === 0 && (
        <section className={cardClass(true)}>
          <h2 className="text-lg font-semibold text-white">Sign up or sign in</h2>
          <p className="mt-2 text-sm text-ccweb-muted">
            CCWEB accounts power the rest of the product. For this developer walkthrough we only use your email as a
            project owner label when you create a project.
          </p>
          {user ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white">
              Signed in as <span className="text-ccweb-cyan">{user.email || user.displayName || user.id}</span>
              <button
                type="button"
                className="ml-3 text-xs text-ccweb-muted underline"
                onClick={() => navigate("/profile")}
              >
                Profile
              </button>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/signup"
                className="rounded-xl bg-gradient-to-r from-ccweb-cyan to-ccweb-violet px-5 py-2.5 text-sm font-semibold text-[#061329]"
              >
                Create account
              </Link>
              <Link to="/login" className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-medium text-white">
                Log in
              </Link>
            </div>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              className="rounded-xl border border-white/15 px-4 py-2 text-sm text-ccweb-muted"
              onClick={() => setStep(1)}
            >
              Skip for now
            </button>
            <button
              type="button"
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white"
              onClick={() => setStep(1)}
            >
              Continue
            </button>
          </div>
          <p className="mt-3 text-xs text-ccweb-muted">Tip: you can skip sign-in for a local-only API experiment.</p>
        </section>
      )}

      {step === 1 && (
        <section className={cardClass(true)}>
          <h2 className="text-lg font-semibold text-white">Create a project</h2>
          <p className="mt-2 text-sm text-ccweb-muted">Projects scope API keys, usage, and webhooks.</p>
          <label className="mt-4 block text-xs font-medium text-ccweb-muted">Project name</label>
          <input
            className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
          {projects.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-ccweb-muted">Or attach key to existing project</p>
              <select
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.tier})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="mt-6 flex flex-wrap justify-between gap-2">
            <button type="button" className="text-sm text-ccweb-muted underline" onClick={() => setStep(0)}>
              Back
            </button>
            <div className="flex flex-wrap gap-2">
              {projects.length > 0 && (
                <button
                  type="button"
                  disabled={busy || !projectId}
                  onClick={() => setStep(2)}
                  className="rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Use selected project
                </button>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={createProject}
                className="rounded-xl bg-gradient-to-r from-ccweb-cyan to-ccweb-violet px-5 py-2 text-sm font-semibold text-[#061329] disabled:opacity-50"
              >
                Create new project
              </button>
            </div>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className={cardClass(true)}>
          <h2 className="text-lg font-semibold text-white">Generate API key</h2>
          <p className="mt-2 text-sm text-ccweb-muted">Shown once — we store only a hash server-side.</p>
          <label className="mt-4 block text-xs text-ccweb-muted">Key name</label>
          <input
            className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
          />
          <p className="mt-2 text-xs text-ccweb-muted">
            Project: <code className="text-ccweb-cyan">{projectId || projects[0]?.id || "default"}</code>
          </p>
          <div className="mt-6 flex flex-wrap justify-between gap-2">
            <button type="button" className="text-sm text-ccweb-muted underline" onClick={() => setStep(1)}>
              Back
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={generateKey}
              className="rounded-xl bg-gradient-to-r from-ccweb-cyan to-ccweb-violet px-5 py-2 text-sm font-semibold text-[#061329] disabled:opacity-50"
            >
              Generate key
            </button>
          </div>
          {createdSecret && (
            <p className="mt-4 break-all rounded-lg bg-emerald-950/40 p-3 font-mono text-xs text-emerald-300">{createdSecret}</p>
          )}
        </section>
      )}

      {step === 3 && (
        <section className={cardClass(true)}>
          <h2 className="text-lg font-semibold text-white">What do you want to build first?</h2>
          <p className="mt-2 text-sm text-ccweb-muted">Pick one — you can switch anytime from the developer dashboard.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <button type="button" className="rounded-2xl border border-white/15 bg-black/25 p-4 text-left hover:border-ccweb-cyan/40" onClick={() => goPath("dapp")}>
              <div className="text-2xl">🏗️</div>
              <h3 className="mt-2 font-semibold text-white">Build DApp</h3>
              <p className="mt-1 text-xs text-ccweb-muted">Visual builder + simulated deploy</p>
            </button>
            <button type="button" className="rounded-2xl border border-white/15 bg-black/25 p-4 text-left hover:border-ccweb-violet/40" onClick={() => goPath("agent")}>
              <div className="text-2xl">🤖</div>
              <h3 className="mt-2 font-semibold text-white">Build Agent</h3>
              <p className="mt-1 text-xs text-ccweb-muted">Register + execute via API</p>
            </button>
            <button type="button" className="rounded-2xl border border-white/15 bg-black/25 p-4 text-left hover:border-ccweb-green/40" onClick={() => goPath("api")}>
              <div className="text-2xl">🔌</div>
              <h3 className="mt-2 font-semibold text-white">Use API</h3>
              <p className="mt-1 text-xs text-ccweb-muted">REST, workflows, webhooks</p>
            </button>
          </div>
          <div className="mt-6">
            <button type="button" className="text-sm text-ccweb-muted underline" onClick={() => setStep(2)}>
              Back
            </button>
          </div>
        </section>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <section className={cardClass(true)}>
            <h2 className="text-lg font-semibold text-white">Quick start</h2>
            <p className="mt-2 text-sm text-ccweb-muted">
              {pathChoice === "dapp" && "Open the visual builder, connect a wallet, and run a simulated deploy."}
              {pathChoice === "agent" && "Use the Public API to register an agent and trigger a simulated execution."}
              {pathChoice === "api" && "Call analytics and sessions with your key — same stack powers all paths."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {pathChoice === "dapp" && (
                <Link to="/dapp-builder" className="rounded-xl bg-ccweb-green/90 px-4 py-2 text-sm font-semibold text-[#061329]">
                  Open DApp builder
                </Link>
              )}
              {pathChoice === "agent" && (
                <Link to="/ai-agents" className="rounded-xl bg-ccweb-violet/90 px-4 py-2 text-sm font-semibold text-white">
                  Browse AI agents
                </Link>
              )}
              <Link to="/developers" className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white">
                Full dashboard
              </Link>
            </div>
          </section>

          <section className={cardClass(false)}>
            <h3 className="font-semibold text-white">Copy-paste: cURL</h3>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-black/50 p-3 text-left font-mono text-[11px] leading-relaxed text-slate-300">{curlSnippet}</pre>
            <button
              type="button"
              className="mt-2 text-xs text-ccweb-cyan underline"
              onClick={() => navigator.clipboard?.writeText(curlSnippet.replace(/\\\n/g, " "))}
            >
              Copy one-liner
            </button>
          </section>

          <section className={cardClass(false)}>
            <h3 className="font-semibold text-white">Copy-paste: fetch (browser or Node 18+)</h3>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-black/50 p-3 text-left font-mono text-[11px] leading-relaxed text-slate-300">{nodeSnippet}</pre>
            <button type="button" className="mt-2 text-xs text-ccweb-cyan underline" onClick={() => navigator.clipboard?.writeText(nodeSnippet)}>
              Copy
            </button>
          </section>

          <section className={cardClass(false)}>
            <h3 className="font-semibold text-white">Sandbox (no API key)</h3>
            <p className="mt-1 text-xs text-ccweb-muted">POST /api/developer/sandbox/echo — safe echo for wiring tests.</p>
            <button
              type="button"
              disabled={busy}
              onClick={runSandbox}
              className="mt-3 rounded-xl border border-white/20 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              Run sandbox echo
            </button>
            {sandboxResult && (
              <pre className="mt-3 max-h-32 overflow-auto rounded-lg bg-black/40 p-2 text-xs text-slate-300">
                {JSON.stringify(sandboxResult, null, 2)}
              </pre>
            )}
          </section>

          <section className={cardClass(false)}>
            <h3 className="font-semibold text-white">Example API call (with key)</h3>
            <p className="mt-1 text-xs text-ccweb-muted">GET /v1/analytics — confirms auth and increments usage.</p>
            <button
              type="button"
              disabled={busy}
              onClick={runApiTest}
              className="mt-3 rounded-xl bg-gradient-to-r from-ccweb-cyan/90 to-ccweb-violet/90 px-4 py-2 text-sm font-semibold text-[#061329] disabled:opacity-50"
            >
              Run GET /v1/analytics
            </button>
            {apiTestResult && (
              <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-black/40 p-2 text-xs text-slate-300">
                {JSON.stringify(apiTestResult, null, 2)}
              </pre>
            )}
          </section>

          <section className={cardClass(false)}>
            <h3 className="font-semibold text-white">CLI</h3>
            <pre className="mt-2 rounded-xl bg-black/50 p-3 font-mono text-[11px] text-slate-300">
              {`ccweb init "${projectName.slice(0, 24)}"\nccweb test\nCCWEB_API_KEY=... ccweb deploy`}
            </pre>
            <p className="mt-2 text-xs text-ccweb-muted">
              From repo: <code className="text-ccweb-cyan">node packages/ccweb-cli/bin.mjs</code>
            </p>
          </section>

          <div className="flex justify-between">
            <button type="button" className="text-sm text-ccweb-muted underline" onClick={() => setStep(3)}>
              Back
            </button>
            <Link to="/developers" className="text-sm font-medium text-ccweb-cyan underline">
              Open dashboard →
            </Link>
          </div>
        </div>
      )}

      {err && <p className="text-center text-sm text-rose-400">{err}</p>}

      <p className="text-center text-xs text-ccweb-muted">
        Longer guide:{" "}
        <a href="/docs/DEVELOPER_QUICKSTART.md" className="text-ccweb-cyan underline" target="_blank" rel="noreferrer">
          Developer quick start (docs)
        </a>
      </p>
    </div>
  );
}
