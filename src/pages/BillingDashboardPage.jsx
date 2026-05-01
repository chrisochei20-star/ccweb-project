import { ArrowRight, CreditCard, Link as LinkIcon, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

const TENANT_ID = "default";

export function BillingDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [attributionUsd, setAttributionUsd] = useState("");
  const [planSelection, setPlanSelection] = useState("pro");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [sumRes, priceRes] = await Promise.all([
        fetch(`/api/automation/billing-summary?tenantId=${encodeURIComponent(TENANT_ID)}`),
        fetch("/api/automation/billing/pricing"),
      ]);
      const sum = await sumRes.json();
      const price = await priceRes.json();
      if (!sumRes.ok) throw new Error(sum.error || "Billing summary failed");
      if (!priceRes.ok) throw new Error(price.error || "Pricing failed");
      setSummary(sum);
      setPricing(price);
      setPlanSelection(sum.cost?.planId === "free" ? "free" : sum.cost?.planId === "enterprise" ? "enterprise" : "pro");
    } catch (e) {
      setError(e.message || "Could not load billing.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submitAttribution() {
    setMessage("");
    const amount = Number(attributionUsd);
    if (!Number.isFinite(amount) || amount < 0) {
      setMessage("Enter a valid dollar amount.");
      return;
    }
    try {
      const res = await fetch("/api/automation/billing/attribute-revenue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: TENANT_ID, attributedGrowthUsd: amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setSummary(data.billingSummary);
      setMessage(`Recorded $${amount} attributed growth. Performance fee updates when your plan applies it.`);
      setAttributionUsd("");
    } catch (e) {
      setMessage(e.message || "Failed");
    }
  }

  async function changePlan(planId) {
    setMessage("");
    try {
      const res = await fetch("/api/automation/billing/set-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: TENANT_ID, planId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setPlanSelection(planId);
      await load();
      setMessage(`Plan set to ${data.plan?.name || planId}.`);
    } catch (e) {
      setMessage(e.message || "Failed");
    }
  }

  const cost = summary?.cost;

  return (
    <div className="space-y-10">
      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-300">
          <Sparkles className="h-3.5 w-3.5" /> Billing & ROI
        </span>
        <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">Transparent automation spend</h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          Usage meters, published rates, optional performance fees on growth you attribute, and marketplace commissions — no surprise line items.
        </p>
        <Link
          to="/automation"
          className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-cyan-600 dark:text-cyan-300"
        >
          Back to Automation Hub <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.header>

      {error ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-700 dark:text-rose-300">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-800 dark:text-emerald-200">
          {message}
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        <GlassCard>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
            <CreditCard className="h-4 w-4" /> Current plan
          </div>
          <p className="mt-4 text-3xl font-black">{loading ? "…" : cost?.planName}</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Subscription: {cost?.subscriptionUsd > 0 ? `$${cost.subscriptionUsd}/mo` : cost?.planId === "enterprise" ? "Custom (contact sales)" : "$0"}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Est. period total</p>
          <p className="mt-4 text-3xl font-black">{loading ? "…" : formatUsd(cost?.estimatedTotalUsd)}</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Includes subscription + overages + optional performance fee.</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Value story</p>
          <p className="mt-4 text-2xl font-black">{summary?.valueStory?.headline}</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            ROI: {summary?.valueStory?.roiMultiple != null ? `${summary.valueStory.roiMultiple}×` : "—"} · Value {formatUsd(summary?.valueStory?.attributedValueUsd)} vs spend{" "}
            {formatUsd(summary?.valueStory?.estimatedSpendUsd)}
          </p>
        </GlassCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <h2 className="text-xl font-black">Usage meters</h2>
          <div className="mt-6 space-y-5">
            <Meter label="Workflow runs" row={summary?.usageMeter?.workflowRuns} />
            <Meter label="Agent actions" row={summary?.usageMeter?.agentActions} />
            <Meter label="API / AI units" row={summary?.usageMeter?.apiUnits} />
          </div>
        </GlassCard>
        <GlassCard className="p-6">
          <h2 className="text-xl font-black">Cost breakdown</h2>
          <ul className="mt-5 space-y-3 text-sm">
            <BreakRow label="Subscription" value={formatUsd(cost?.subscriptionUsd)} />
            <BreakRow label="Usage overages" value={formatUsd(cost?.usageBreakdown?.usageChargesUsd)} />
            <BreakRow label="Premium integrations (est.)" value={formatUsd(cost?.premiumIntegrationUsd)} />
            <BreakRow
              label={`Performance fee (${cost?.performanceFee?.percent ?? 0}% of attributed)`}
              value={formatUsd(cost?.performanceFee?.feeUsd)}
            />
            <li className="flex justify-between border-t border-slate-900/10 pt-4 font-black dark:border-white/10">
              <span>Total (estimate)</span>
              <span>{formatUsd(cost?.estimatedTotalUsd)}</span>
            </li>
          </ul>
          <p className="mt-4 text-xs text-slate-500">{summary?.transparency?.noHiddenFees}</p>
        </GlassCard>
      </section>

      <GlassCard className="p-6">
        <h2 className="text-xl font-black">Attribute measurable growth (optional)</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Connect CRM revenue or enter attributed pipeline value. CCWEB only applies performance fees on what you confirm — typically 5% on Pro, 3% on Enterprise.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm font-bold">
            Attributed growth (USD)
            <input
              type="number"
              min="0"
              step="1"
              placeholder="e.g. 5000"
              value={attributionUsd}
              onChange={(e) => setAttributionUsd(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-900/10 bg-white/90 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5"
            />
          </label>
          <button
            type="button"
            onClick={submitAttribution}
            className="rounded-full bg-slate-950 px-6 py-3 text-sm font-black text-white dark:bg-white dark:text-slate-950"
          >
            Record attribution
          </button>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="text-xl font-black">Change subscription tier</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {["free", "pro", "enterprise"].map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => changePlan(id)}
              className={`rounded-full px-5 py-2 text-sm font-black capitalize ${
                planSelection === id
                  ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                  : "border border-slate-900/10 bg-white/70 dark:border-white/10 dark:bg-white/5"
              }`}
            >
              {id}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">Enterprise is priced with sales; limits here are placeholders for demo.</p>
      </GlassCard>

      <GlassCard className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-black">Published meter rates</h2>
          <Link to="/pricing" className="inline-flex items-center gap-2 text-sm font-bold text-cyan-600 dark:text-cyan-300">
            Full pricing page <LinkIcon className="h-4 w-4" />
          </Link>
        </div>
        {pricing?.meterRates ? (
          <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            {Object.entries(pricing.meterRates).map(([k, v]) => (
              <li key={k} className="flex justify-between rounded-2xl border border-slate-900/10 bg-slate-100/60 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                <span className="font-mono text-xs text-slate-500">{k}</span>
                <span className="font-bold">${v}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-slate-500">{loading ? "Loading…" : "No rates."}</p>
        )}
        <p className="mt-4 text-xs text-slate-500">
          Marketplace: {pricing?.marketplace?.ccwebCommissionPercent}% platform commission on third-party template usage (creator keeps the rest).
        </p>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="text-xl font-black">Recent billing events</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {(summary?.history || []).map((h) => (
            <li key={h.id} className="rounded-2xl border border-slate-900/10 px-4 py-3 dark:border-white/10">
              <span className="font-bold">{h.kind}</span> · {formatUsd(h.estimatedBillUsd)} · {h.createdAt?.slice(0, 10)}
            </li>
          ))}
          {!summary?.history?.length ? <li className="text-slate-500">No history yet — run a pipeline from Automation.</li> : null}
        </ul>
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

function Meter({ label, row }) {
  const pct = row?.percent ?? 0;
  return (
    <div>
      <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
        <span>{label}</span>
        <span>
          {(row?.used ?? 0).toLocaleString()} / {(row?.limit ?? "∞").toLocaleString?.() ?? row?.limit} ({pct}%)
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500" style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}

function BreakRow({ label, value }) {
  return (
    <li className="flex justify-between">
      <span className="text-slate-600 dark:text-slate-300">{label}</span>
      <span className="font-bold">{value}</span>
    </li>
  );
}

function formatUsd(n) {
  if (n === undefined || n === null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(Number(n) || 0);
}
