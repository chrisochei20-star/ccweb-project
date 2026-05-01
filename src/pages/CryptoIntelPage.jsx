import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  Bell,
  Binoculars,
  Brain,
  Search,
  Shield,
  Sparkles,
  Wallet,
} from "lucide-react";

const API = "/api/v1/crypto";

export function CryptoIntelPage() {
  const [chain, setChain] = useState("ethereum");
  const [tokenForm, setTokenForm] = useState({ address: "0xabc1234567890abcdef1234567890abcdef1234", symbol: "DEMO" });
  const [scanResult, setScanResult] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);

  const [walletForm, setWalletForm] = useState({ address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e" });
  const [walletResult, setWalletResult] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);

  const [discover, setDiscover] = useState(null);
  const [signals, setSignals] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [tracked, setTracked] = useState(null);
  const [trackForm, setTrackForm] = useState({ address: "", label: "My watch" });
  const [err, setErr] = useState("");

  const loadSecondary = useCallback(() => {
    setErr("");
    Promise.all([
      fetch(`${API}/discover-tokens?chain=${chain}&limit=12`).then((r) => r.json()),
      fetch(`${API}/signals?chain=${chain}`).then((r) => r.json()),
      fetch(`${API}/alerts?limit=25`).then((r) => r.json()),
      fetch(`${API}/tracked-wallets`).then((r) => r.json()),
    ])
      .then(([d, s, a, t]) => {
        setDiscover(d);
        setSignals(s);
        setAlerts(a);
        setTracked(t);
      })
      .catch(() => setErr("Could not load feeds — is the API server running on port 3000?"));
  }, [chain]);

  useEffect(() => {
    loadSecondary();
  }, [loadSecondary]);

  async function runTokenScan(e) {
    e.preventDefault();
    setScanLoading(true);
    setErr("");
    try {
      const r = await fetch(`${API}/scan-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chain,
          tokenAddress: tokenForm.address.trim(),
          symbol: tokenForm.symbol.trim() || "TOKEN",
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Scan failed");
      setScanResult(j);
      loadSecondary();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setScanLoading(false);
    }
  }

  async function runWalletScan(e) {
    e.preventDefault();
    setWalletLoading(true);
    setErr("");
    try {
      const r = await fetch(`${API}/scan-wallet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chain, walletAddress: walletForm.address.trim() }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Wallet scan failed");
      setWalletResult(j);
      loadSecondary();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setWalletLoading(false);
    }
  }

  async function addTrack(e) {
    e.preventDefault();
    if (!trackForm.address.trim()) return;
    setErr("");
    const r = await fetch(`${API}/track-wallet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chain, walletAddress: trackForm.address.trim(), label: trackForm.label }),
    });
    const j = await r.json();
    if (!r.ok) {
      setErr(j.error || "Track failed");
      return;
    }
    setTrackForm({ address: "", label: "My watch" });
    loadSecondary();
  }

  async function removeTrack(addr) {
    await fetch(`${API}/untrack-wallet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chain, walletAddress: addr }),
    });
    loadSecondary();
  }

  return (
    <div className="space-y-10 pb-16">
      <header className="max-w-4xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-violet-700 dark:text-violet-300">
          <Shield className="h-3.5 w-3.5" /> Crypto intelligence
        </span>
        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">Safety scanner & alpha discovery</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
          Contract risk heuristics, on-chain behavior proxies, early discovery signals, and AI-style summaries. Outputs are{" "}
          <strong className="font-bold">probabilistic signals</strong>, not guarantees — always verify on-chain and assume volatility.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/platform#crypto" className="text-sm font-bold text-cyan-600 dark:text-cyan-300">
            ← Platform APIs
          </Link>
          <span className="text-sm text-slate-500">Chain:</span>
          <select
            value={chain}
            onChange={(e) => setChain(e.target.value)}
            className="rounded-xl border border-slate-900/10 bg-white/90 px-3 py-1.5 text-sm font-semibold dark:border-white/10 dark:bg-slate-950 dark:text-white"
          >
            <option value="ethereum">Ethereum</option>
            <option value="bsc">BSC</option>
            <option value="base">Base</option>
            <option value="arbitrum">Arbitrum</option>
          </select>
        </div>
      </header>

      {err ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-800 dark:text-rose-200">
          {err}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <GlassSection title="Token scanner" icon={Search} subtitle="Security, rug hints, smart-money proxy, AI insight">
          <form onSubmit={runTokenScan} className="space-y-3">
            <Field label="Token contract" value={tokenForm.address} onChange={(v) => setTokenForm((p) => ({ ...p, address: v }))} />
            <Field label="Symbol (optional)" value={tokenForm.symbol} onChange={(v) => setTokenForm((p) => ({ ...p, symbol: v }))} />
            <button
              type="submit"
              disabled={scanLoading}
              className="w-full rounded-2xl bg-slate-950 py-3 text-sm font-black text-white disabled:opacity-50 dark:bg-white dark:text-slate-950"
            >
              {scanLoading ? "Scanning…" : "Run scan"}
            </button>
          </form>
          {scanResult ? <ScanSummary data={scanResult} /> : null}
        </GlassSection>

        <GlassSection title="Wallet risk" icon={Wallet} subtitle="Scam-linked / suspicious pattern heuristics">
          <form onSubmit={runWalletScan} className="space-y-3">
            <Field label="Wallet address" value={walletForm.address} onChange={(v) => setWalletForm({ address: v })} />
            <button
              type="submit"
              disabled={walletLoading}
              className="w-full rounded-2xl border border-slate-900/15 bg-white/80 py-3 text-sm font-black dark:border-white/10 dark:bg-white/10"
            >
              {walletLoading ? "Analyzing…" : "Scan wallet"}
            </button>
          </form>
          {walletResult ? <WalletSummary data={walletResult} /> : null}
        </GlassSection>
      </div>

      <GlassSection title="Early signals feed" icon={Sparkles} subtitle="New liquidity + momentum + narrative proxies (demo data)">
        <div className="grid gap-3 md:grid-cols-2">
          {(discover?.tokens || []).map((t) => (
            <motion.div
              key={t.tokenAddress}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-slate-900/10 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-500">#{t.rank} {t.symbol}</p>
                  <p className="mt-1 font-mono text-[11px] text-slate-500">{t.tokenAddress.slice(0, 14)}…</p>
                </div>
                <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-xs font-bold text-violet-700 dark:text-violet-300">
                  α {t.alphaSignalStrength}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                Deployed ~{t.deployedHoursAgo}h ago · Liq ~${(t.earlyLiquidityUsd / 1000).toFixed(0)}k · Tx spike {t.momentum.txCountSpikeVsBaseline}%
              </p>
              <p className="mt-1 text-xs text-slate-500">Keywords: {t.social.trendingKeywords.join(", ")}</p>
            </motion.div>
          ))}
        </div>
        {!discover?.tokens?.length ? <p className="text-sm text-slate-500">Load the API to populate discovery.</p> : null}
      </GlassSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassSection title="Trending signals" icon={Activity} subtitle="GET /api/v1/crypto/signals">
          <ul className="space-y-2">
            {(signals?.signals || []).map((s) => (
              <li key={s.id} className="rounded-xl border border-slate-900/10 bg-white/60 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
                <span className="font-bold">{s.asset}</span> · {s.type}{" "}
                <span className="text-slate-500">({(s.strength * 100).toFixed(0)}% strength — demo)</span>
                <p className="mt-1 text-xs text-slate-500">{s.note}</p>
              </li>
            ))}
          </ul>
        </GlassSection>

        <GlassSection title="Alert stream" icon={Bell} subtitle="Risk + opportunity notifications (session memory)">
          <ul className="max-h-64 space-y-2 overflow-y-auto">
            {(alerts?.alerts || []).map((a) => (
              <li
                key={a.id}
                className={`rounded-xl border px-3 py-2 text-xs ${
                  a.severity === "warning"
                    ? "border-amber-500/30 bg-amber-500/10"
                    : "border-slate-900/10 bg-white/60 dark:border-white/10 dark:bg-white/5"
                }`}
              >
                <span className="font-black uppercase tracking-wide text-slate-500">{a.category}</span>
                <p className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{a.title}</p>
                <p className="text-slate-600 dark:text-slate-400">{a.detail}</p>
              </li>
            ))}
          </ul>
        </GlassSection>
      </div>

      <GlassSection title="Wallet tracking" icon={Binoculars} subtitle="POST /track-wallet — demo watchlist stored in memory">
        <form onSubmit={addTrack} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Field label="Address" value={trackForm.address} onChange={(v) => setTrackForm((p) => ({ ...p, address: v }))} />
          </div>
          <div className="w-full sm:w-48">
            <Field label="Label" value={trackForm.label} onChange={(v) => setTrackForm((p) => ({ ...p, label: v }))} />
          </div>
          <button type="submit" className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white dark:bg-white dark:text-slate-950">
            Track
          </button>
        </form>
        <ul className="mt-4 space-y-2">
          {(tracked?.wallets || []).map((w) => (
            <li key={w.id} className="flex items-center justify-between rounded-xl border border-slate-900/10 bg-white/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
              <span className="font-mono text-xs">{w.walletAddress.slice(0, 18)}…</span>
              <button type="button" className="text-xs font-bold text-rose-600 dark:text-rose-400" onClick={() => removeTrack(w.walletAddress)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      </GlassSection>

      <section className="rounded-[2rem] border border-dashed border-slate-900/20 bg-white/40 p-6 dark:border-white/15 dark:bg-white/[0.03]">
        <h3 className="flex items-center gap-2 text-lg font-black">
          <Brain className="h-5 w-5 text-cyan-500" /> Disclosure
        </h3>
        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
          This MVP uses deterministic synthetic data mixed with heuristics to demonstrate architecture. For production, connect Etherscan-class APIs,
          node RPC, indexers, and labeled-address datasets. Never interpret opportunity scores as profit promises.
        </p>
        <p className="mt-2 text-sm font-mono text-slate-500">
          Example bundle: GET {API}/examples — routes also accept POST /api/v1/crypto/scan (alias scan-token).
        </p>
      </section>
    </div>
  );
}

function GlassSection({ title, subtitle, icon: Icon, children }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[2rem] border border-slate-900/10 bg-white/75 p-6 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.06]"
    >
      <h2 className="flex items-center gap-2 text-lg font-black">
        <Icon className="h-5 w-5 text-violet-500" /> {title}
      </h2>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">{subtitle}</p>
      <div className="mt-5">{children}</div>
    </motion.section>
  );
}

function Field({ label, value, onChange }) {
  return (
    <label className="block text-xs font-bold text-slate-500">
      {label}
      <input
        className="mt-1 w-full rounded-xl border border-slate-900/10 bg-white/90 px-3 py-2 text-sm font-medium outline-none focus:border-violet-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function ScanSummary({ data }) {
  const ai = data.aiInsights;
  const sec = data.security;
  return (
    <div className="mt-5 space-y-4 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4">
      <div className="flex flex-wrap gap-4">
        <ScorePill label="Risk" value={data.riskScore} invert />
        <ScorePill label="Opportunity" value={ai?.opportunityScore} />
        <span className="rounded-full bg-slate-950/10 px-3 py-1 text-xs font-black uppercase dark:bg-white/10">
          {data.riskBand?.label || data.safetyTier}
        </span>
      </div>
      <div className="grid gap-2 text-xs sm:grid-cols-2">
        <p>
          <strong>Verification:</strong> {sec?.contractVerification?.status}
        </p>
        <p>
          <strong>LP lock:</strong> {sec?.liquidity?.lock?.lockedPercentOfLp}% ({sec?.liquidity?.lock?.vendorHint})
        </p>
        <p>
          <strong>Ownership:</strong> {sec?.ownership?.renounced ? "Renounced" : `Centralized (${sec?.ownership?.ownerWallet || "unknown"})`}
        </p>
        <p>
          <strong>Tax (est. bps):</strong> buy {sec?.taxes?.estimatedBuyFeeBps} / sell {sec?.taxes?.estimatedSellFeeBps}
        </p>
      </div>
      {ai?.summaryLines?.length ? (
        <div>
          <p className="text-xs font-black uppercase text-slate-500">AI insight</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-200">
            {ai.summaryLines.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-slate-500">{ai.riskVsReward?.explanation}</p>
        </div>
      ) : null}
      <p className="text-xs text-amber-800 dark:text-amber-200">{data.disclosure?.notAdvice}</p>
    </div>
  );
}

function WalletSummary({ data }) {
  return (
    <div className="mt-5 rounded-2xl border border-slate-900/10 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-wrap gap-3">
        <ScorePill label="Wallet risk" value={data.walletRiskScore} invert />
        <span className="text-sm font-bold">{data.walletRiskBand?.label}</span>
      </div>
      <ul className="mt-3 text-sm text-slate-600 dark:text-slate-300">
        {(data.findings?.suspiciousPatternFlags || []).map((f) => (
          <li key={f}>• {f}</li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-slate-500">{data.findings?.explanation}</p>
    </div>
  );
}

function ScorePill({ label, value, invert }) {
  const n = value ?? "—";
  const tone =
    invert && typeof value === "number"
      ? value > 65
        ? "bg-rose-500/15 text-rose-800 dark:text-rose-200"
        : value > 40
          ? "bg-amber-500/15 text-amber-900 dark:text-amber-100"
          : "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
      : typeof value === "number"
        ? value > 65
          ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
          : "bg-slate-500/10 text-slate-700 dark:text-slate-200"
        : "bg-slate-500/10";

  return (
    <span className={`inline-flex flex-col rounded-2xl px-4 py-2 ${tone}`}>
      <span className="text-[10px] font-black uppercase tracking-wider opacity-80">{label}</span>
      <span className="text-xl font-black">{n}{typeof value === "number" ? "/100" : ""}</span>
    </span>
  );
}
