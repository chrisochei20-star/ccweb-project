import {
  ArrowRight,
  Bot,
  MapPin,
  Megaphone,
  RefreshCw,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

const TENANT_ID = "default";

export function LeadGenPage() {
  const [businessType, setBusinessType] = useState("B2B SaaS — productivity tools");
  const [targetAudience, setTargetAudience] = useState("Ops directors at 50–500 employee companies");
  const [location, setLocation] = useState("United States — West Coast");
  const [leadCount, setLeadCount] = useState(8);
  const [dashboard, setDashboard] = useState(null);
  const [selectedId, setSelectedId] = useState("");
  const [campaignDetail, setCampaignDetail] = useState(null);
  const [runResult, setRunResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setError("");
    try {
      const res = await fetch(`/api/automation/lead-gen/dashboard?tenantId=${encodeURIComponent(TENANT_ID)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load dashboard");
      setDashboard(data);
      setSelectedId((prev) => (prev && data.campaigns?.some((c) => c.id === prev) ? prev : data.campaigns?.[0]?.id || ""));
    } catch (e) {
      setError(e.message || "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setCampaignDetail(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/automation/lead-gen/campaigns/${encodeURIComponent(selectedId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.campaign) setCampaignDetail(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [selectedId, dashboard]);

  async function createAndRun() {
    setBusy(true);
    setError("");
    setRunResult(null);
    try {
      const createRes = await fetch("/api/automation/lead-gen/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: TENANT_ID,
          businessType,
          targetAudience,
          location,
        }),
      });
      const created = await createRes.json();
      if (!createRes.ok) throw new Error(created.error || "Create failed");

      const runRes = await fetch(`/api/automation/lead-gen/campaigns/${encodeURIComponent(created.id)}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: TENANT_ID, leadCount }),
      });
      const runData = await runRes.json();
      if (!runRes.ok) throw new Error(runData.error || "Run failed");

      setRunResult(runData);
      setSelectedId(created.id);
      await loadDashboard();
    } catch (e) {
      setError(e.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  const funnel = dashboard?.funnel;
  const rates = dashboard?.monetization?.rates;

  return (
    <div className="space-y-10">
      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-300">
          <Sparkles className="h-3.5 w-3.5" /> Lead generation automation
        </span>
        <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
          Research, discover, outreach — tracked end to end.
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          Describe who you serve and where. The hub runs AI research, surfaces contact opportunities, drafts personalized messages,
          schedules non-spammy follow-ups, and ties everything to usage-based billing so cost stays visible next to pipeline outcomes.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/automation" className="text-sm font-bold text-cyan-600 dark:text-cyan-300">
            Automation Hub →
          </Link>
          <Link to="/billing" className="text-sm font-bold text-slate-600 dark:text-slate-400">
            Billing & meters →
          </Link>
        </div>
      </motion.header>

      {error ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-700 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <GlassTile icon={Users} label="Leads discovered" value={loading ? "…" : String(funnel?.discovered ?? 0)} />
        <GlassTile icon={Megaphone} label="Contacted" value={loading ? "…" : String(funnel?.contacted ?? 0)} />
        <GlassTile icon={Bot} label="Replies" value={loading ? "…" : String(funnel?.replied ?? 0)} />
        <GlassTile icon={Target} label="Conversions" value={loading ? "…" : String(funnel?.converted ?? 0)} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
        <GlassCard className="p-6 sm:p-8">
          <h2 className="text-2xl font-black">New campaign</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Inputs feed the pipeline template <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-white/10">tpl-lead-generation</code>.
          </p>
          <div className="mt-6 space-y-4">
            <Field label="Business type" htmlFor="biz-type">
              <Input id="biz-type" value={businessType} onChange={(e) => setBusinessType(e.target.value)} />
            </Field>
            <Field label="Target audience (ICP)" htmlFor="audience">
              <Input id="audience" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} />
            </Field>
            <Field label="Location / market" htmlFor="loc">
              <Input id="loc" icon={<MapPin className="h-4 w-4" />} value={location} onChange={(e) => setLocation(e.target.value)} />
            </Field>
            <Field label="Leads to simulate this run (3–40)" htmlFor="lc">
              <Input id="lc" type="number" min={3} max={40} value={leadCount} onChange={(e) => setLeadCount(Number(e.target.value))} />
            </Field>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={createAndRun}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-xl disabled:opacity-60 dark:bg-white dark:text-slate-950 sm:w-auto"
          >
            {busy ? "Running pipeline…" : "Create & run lead engine"} <ArrowRight className="h-4 w-4" />
          </button>

          {runResult ? (
            <div className="mt-6 space-y-4 rounded-[1.5rem] border border-emerald-500/25 bg-emerald-500/5 p-5 dark:bg-emerald-500/10">
              <p className="text-sm font-black text-emerald-800 dark:text-emerald-200">Run complete</p>
              <p className="text-sm text-slate-700 dark:text-slate-200">{runResult.research?.summary}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Stat label="Leads" value={runResult.campaign?.metrics?.leadsDiscovered} />
                <Stat label="Outreach sent" value={runResult.campaign?.metrics?.contacted} />
                <Stat label="Replies" value={runResult.campaign?.metrics?.replies} />
                <Stat label="Conversions" value={runResult.campaign?.metrics?.conversions} />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Est. rolling bill: <strong>{money(runResult.billing?.estimatedTotalUsd)}</strong> —{" "}
                {runResult.billing?.breakdownNote}
              </p>
              {runResult.outreachPreview?.length ? (
                <div className="rounded-2xl border border-slate-900/10 bg-white/80 p-4 text-xs dark:border-white/10 dark:bg-white/5">
                  <p className="font-bold">Sample message ({runResult.outreachPreview[0]?.channel})</p>
                  <pre className="mt-2 whitespace-pre-wrap font-sans text-slate-700 dark:text-slate-200">
                    {runResult.outreachPreview[0]?.body}
                  </pre>
                </div>
              ) : null}
            </div>
          ) : null}
        </GlassCard>

        <GlassCard className="p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-black">Monetization</h2>
            <RefreshCw
              className={`h-6 w-6 text-cyan-500 ${loading ? "animate-spin" : "cursor-pointer"}`}
              onClick={() => loadDashboard()}
              role="button"
              aria-label="Refresh"
            />
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Each qualified lead, outreach action, and scheduled follow-up increments meters; overage bills at published rates alongside core automation usage.
          </p>
          <ul className="mt-5 space-y-2 text-sm">
            <li className="flex justify-between rounded-2xl border border-slate-900/10 bg-slate-100/70 px-4 py-3 dark:border-white/10 dark:bg-white/5">
              <span>Per qualified lead</span>
              <span className="font-black">${rates?.qualifiedLeadUsd?.toFixed?.(2) ?? "—"}</span>
            </li>
            <li className="flex justify-between rounded-2xl border border-slate-900/10 bg-slate-100/70 px-4 py-3 dark:border-white/10 dark:bg-white/5">
              <span>Per outreach (email/DM)</span>
              <span className="font-black">${rates?.outreachActionUsd?.toFixed?.(2) ?? "—"}</span>
            </li>
            <li className="flex justify-between rounded-2xl border border-slate-900/10 bg-slate-100/70 px-4 py-3 dark:border-white/10 dark:bg-white/5">
              <span>Per follow-up scheduled</span>
              <span className="font-black">${rates?.followUpScheduledUsd?.toFixed?.(2) ?? "—"}</span>
            </li>
          </ul>
          <p className="mt-4 text-xs text-slate-500">
            Period estimate: <strong>{money(dashboard?.monetization?.estimatedPeriodBillUsd)}</strong>
          </p>
        </GlassCard>
      </section>

      <GlassCard className="p-6 sm:p-8">
        <h2 className="text-xl font-black">Campaigns & contacts</h2>
        <div className="mt-5 grid gap-6 lg:grid-cols-[280px_1fr]">
          <div>
            <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Select campaign</label>
            <select
              className="mt-2 w-full rounded-2xl border border-slate-900/10 bg-white/90 px-4 py-3 text-sm dark:border-white/10 dark:bg-slate-950 dark:text-white"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="">—</option>
              {(dashboard?.campaigns || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.businessType.slice(0, 36)}… ({c.status})
                </option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-900/10 text-xs uppercase tracking-[0.14em] text-slate-500 dark:border-white/10">
                  <th className="pb-3 pr-3">Company</th>
                  <th className="pb-3 pr-3">Role</th>
                  <th className="pb-3 pr-3">Status</th>
                  <th className="pb-3">Follow-up</th>
                </tr>
              </thead>
              <tbody>
                {(campaignDetail?.contacts || []).map((row) => (
                  <tr key={row.id} className="border-b border-slate-900/5 dark:border-white/5">
                    <td className="py-3 pr-3 font-semibold">{row.company}</td>
                    <td className="py-3 pr-3">{row.role}</td>
                    <td className="py-3 pr-3">
                      <span className="rounded-full bg-slate-950/90 px-2 py-0.5 text-xs font-bold text-white dark:bg-white dark:text-slate-950">
                        {row.status}
                      </span>
                      {row.replied ? " · replied" : ""}
                      {row.converted ? " · won" : ""}
                    </td>
                    <td className="py-3 text-xs text-slate-500">{row.nextFollowUpAt?.slice(0, 10) || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!campaignDetail?.contacts?.length ? (
              <p className="mt-4 text-sm text-slate-500">Create a campaign to see contacts here.</p>
            ) : null}
          </div>
        </div>
      </GlassCard>

      <GlassCard className="border-dashed p-6">
        <h3 className="text-lg font-black">Example workflow</h3>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
          <li>
            <strong>POST</strong> <code className="rounded bg-slate-100 px-1 dark:bg-white/10">/api/automation/lead-gen/campaigns</code> with{" "}
            <code className="rounded bg-slate-100 px-1 dark:bg-white/10">businessType</code>, <code className="rounded bg-slate-100 px-1 dark:bg-white/10">targetAudience</code>,{" "}
            <code className="rounded bg-slate-100 px-1 dark:bg-white/10">location</code>.
          </li>
          <li>
            <strong>POST</strong> <code className="rounded bg-slate-100 px-1 dark:bg-white/10">/api/automation/lead-gen/campaigns/:id/run</code> with optional{" "}
            <code className="rounded bg-slate-100 px-1 dark:bg-white/10">leadCount</code> — runs research → discovery → outreach → follow-up simulation → tracking events.
          </li>
          <li>
            <strong>GET</strong> <code className="rounded bg-slate-100 px-1 dark:bg-white/10">/api/automation/lead-gen/dashboard</code> for funnel totals and billing snapshot;{" "}
            <strong>GET</strong> <code className="rounded bg-slate-100 px-1 dark:bg-white/10">/api/automation/calculate-cost</code> for line-item costs.
          </li>
        </ol>
      </GlassCard>
    </div>
  );
}

function GlassCard({ children, className = "" }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[2rem] border border-slate-900/10 bg-white/75 p-6 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.06] ${className}`}
    >
      {children}
    </motion.article>
  );
}

function GlassTile({ icon: Icon, label, value }) {
  return (
    <GlassCard className="p-5">
      <Icon className="h-6 w-6 text-cyan-500" />
      <p className="mt-4 text-3xl font-black">{value}</p>
      <p className="mt-1 text-sm font-bold text-slate-700 dark:text-slate-200">{label}</p>
    </GlassCard>
  );
}

function Field({ label, htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">{label}</span>
      {children}
    </label>
  );
}

function Input({ icon, ...props }) {
  return (
    <div className="relative">
      {icon ? <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span> : null}
      <input
        className={`w-full rounded-2xl border border-slate-900/10 bg-white/90 py-3 text-sm outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 dark:border-white/10 dark:bg-white/5 dark:text-white ${icon ? "pl-11 pr-4" : "px-4"}`}
        {...props}
      />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-900/10 bg-white/80 p-3 dark:border-white/10 dark:bg-white/5">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-black">{value ?? "—"}</p>
    </div>
  );
}

function money(v) {
  if (v === undefined || v === null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(Number(v) || 0);
}
