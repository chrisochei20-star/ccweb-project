import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function fmtUsd(n) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}k`;
  return `$${Number(n).toFixed(2)}`;
}

function fmtPrice(n) {
  if (n >= 1) return `$${n.toFixed(4)}`;
  if (n >= 0.0001) return `$${n.toFixed(6)}`;
  return `$${n.toPrecision(4)}`;
}

function Badge({ children, tone }) {
  const tones = {
    opp: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
    risk: "border-rose-400/40 bg-rose-500/12 text-rose-100",
    neutral: "border-white/15 bg-white/8 text-slate-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${tones[tone] || tones.neutral}`}
    >
      {children}
    </span>
  );
}

export function TokenDetailPage() {
  const { slug: slugParam } = useParams();
  const slug = slugParam ? decodeURIComponent(slugParam) : "";
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trackMsg, setTrackMsg] = useState(null);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/intelligence/token/${encodeURIComponent(slug)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load token");
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const chartData = useMemo(() => {
    if (!data?.market?.series14d) return [];
    return data.market.series14d.map((row) => ({
      ...row,
      volM: row.volumeUsd / 1e6,
    }));
  }, [data]);

  async function toggleTrack() {
    if (!data) return;
    setTrackMsg(null);
    try {
      if (data.tracking?.isTracked) {
        const res = await fetch(
          `/api/intelligence/tracked-tokens/${encodeURIComponent(data.tracking.key)}`,
          { method: "DELETE" }
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Untrack failed");
        setTrackMsg("Removed from watchlist.");
      } else {
        const res = await fetch("/api/intelligence/tracked-tokens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbol: data.symbol,
            chain: data.chain,
            contractAddress: data.contractAddress,
            alertsEnabled: true,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Track failed");
        setTrackMsg(
          json.persistence?.persisted ? "Saved to your watchlist (MongoDB)." : json.persistence?.reason || "OK"
        );
      }
      load();
    } catch (e) {
      setTrackMsg(e.message);
    }
  }

  function openExternal() {
    if (data?.explorerUrl) window.open(data.explorerUrl, "_blank", "noopener,noreferrer");
  }

  if (!slug) {
    return (
      <div className="rounded-2xl border border-white/10 bg-ccweb-card p-8 text-center text-ccweb-muted backdrop-blur-xl">
        No token specified.{" "}
        <Link to="/early-signals" className="text-ccweb-cyan underline">
          Browse Early Signals
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-ccweb-muted">Loading token…</div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-100">
        {error || "Not found"}
        <div className="mt-4">
          <Link to="/early-signals" className="text-ccweb-cyan underline">
            Back to Early Signals
          </Link>
        </div>
      </div>
    );
  }

  const ch24 = data.market?.change24hApproxPct ?? 0;
  const chPos = ch24 >= 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-20">
      <nav className="text-sm text-ccweb-muted">
        <Link to="/early-signals" className="text-ccweb-cyan hover:underline">
          Early Signals
        </Link>
        <span className="mx-2 text-white/30">/</span>
        <span className="text-white/80">{data.symbol}</span>
      </nav>

      {/* Header */}
      <header className="rounded-2xl border border-ccweb-border bg-ccweb-card p-5 shadow-xl backdrop-blur-xl sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{data.name}</h1>
              <span className="rounded-lg bg-white/10 px-2 py-0.5 font-mono text-sm text-ccweb-muted">
                {data.symbol}
              </span>
              <span className="rounded-lg border border-ccweb-cyan/35 bg-ccweb-cyan/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-ccweb-cyan">
                {data.chain}
              </span>
            </div>
            {data.contractAddress && (
              <p className="mt-2 break-all font-mono text-xs text-ccweb-muted sm:text-sm">{data.contractAddress}</p>
            )}
            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-bold text-white sm:text-4xl">{fmtPrice(data.market.priceUsd)}</span>
              <span className={chPos ? "text-emerald-400" : "text-rose-400"}>
                {chPos ? "+" : ""}
                {ch24}% <span className="text-ccweb-muted">~24h (simulated)</span>
              </span>
              <span className="text-sm text-ccweb-muted">
                14d: {data.market.change14dPct >= 0 ? "+" : ""}
                {data.market.change14dPct}%
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="opp">Opportunity {data.opportunityScore}/100</Badge>
              <Badge tone="risk">Risk {data.riskScore}/100</Badge>
              <Badge tone="neutral">Band {data.riskBand}</Badge>
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:max-w-xs lg:w-72">
            <button
              type="button"
              onClick={toggleTrack}
              className="rounded-xl bg-gradient-to-r from-ccweb-cyan to-ccweb-violet px-4 py-3 text-sm font-semibold text-[#061329]"
            >
              {data.tracking?.isTracked ? "Stop tracking" : "Track token"}
            </button>
            <button
              type="button"
              onClick={openExternal}
              disabled={!data.explorerUrl}
              className="rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-medium text-white backdrop-blur-md transition enabled:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              View on explorer
            </button>
            {trackMsg && <p className="text-xs text-ccweb-muted">{trackMsg}</p>}
          </div>
        </div>
        <p className="mt-6 text-xs leading-relaxed text-ccweb-muted sm:text-sm">{data.disclaimer}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Score panel */}
        <section className="rounded-2xl border border-ccweb-border bg-ccweb-card p-5 backdrop-blur-xl lg:col-span-1">
          <h2 className="text-lg font-semibold text-white">Score panel</h2>
          <p className="mt-1 text-xs text-ccweb-muted">{data.scores?.note}</p>
          <dl className="mt-6 space-y-4">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ccweb-muted">Opportunity</dt>
              <dd className="mt-1 text-3xl font-bold text-emerald-300">{data.opportunityScore}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ccweb-muted">Risk (danger)</dt>
              <dd className="mt-1 text-3xl font-bold text-rose-300">{data.riskScore}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ccweb-muted">Safety (model)</dt>
              <dd className="mt-1 text-2xl font-semibold text-white/90">{data.safetyScore}</dd>
            </div>
          </dl>
          <p className="mt-6 text-sm leading-relaxed text-ccweb-muted">{data.scoreExplanation}</p>
        </section>

        {/* Chart */}
        <section className="rounded-2xl border border-ccweb-border bg-ccweb-card p-4 backdrop-blur-xl sm:p-5 lg:col-span-2">
          <h2 className="text-lg font-semibold text-white">Price &amp; volume (14d sample)</h2>
          <p className="mt-1 text-xs text-ccweb-muted">{data.market.note}</p>
          <div className="mt-4 h-64 w-full sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(117,160,214,0.12)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#8ca3c4", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis
                  yAxisId="price"
                  tick={{ fill: "#8ca3c4", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                  tickFormatter={(v) => (v >= 1 ? v.toFixed(2) : v.toPrecision(2))}
                />
                <YAxis
                  yAxisId="vol"
                  orientation="right"
                  tick={{ fill: "#8ca3c4", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                  tickFormatter={(v) => `${v.toFixed(1)}M`}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(6,18,38,0.95)",
                    border: "1px solid rgba(117,160,214,0.25)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#cde4ff" }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar yAxisId="vol" dataKey="volM" name="Volume ($M)" fill="rgba(145,89,255,0.45)" radius={[4, 4, 0, 0]} />
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="priceUsd"
                  name="Price (USD)"
                  stroke="#11d4ff"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Smart money */}
        <section className="rounded-2xl border border-ccweb-border bg-ccweb-card p-5 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white">Smart money activity</h2>
          <p className="mt-1 text-xs text-ccweb-muted">
            Large flows tagged as notable with a probability — not proof of intent or future price.
          </p>
          <ul className="mt-4 space-y-3">
            {data.whaleTransactions?.map((tx, i) => (
              <li
                key={`${tx.walletShort}-${i}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm"
              >
                <div>
                  <div className="font-medium text-white">{tx.walletLabel}</div>
                  <div className="text-xs text-ccweb-muted">{tx.walletShort}</div>
                </div>
                <div className="text-right">
                  <span
                    className={`font-semibold ${tx.action === "buy" ? "text-emerald-400" : "text-rose-400"}`}
                  >
                    {tx.action.toUpperCase()} {fmtUsd(tx.amountUsd)}
                  </span>
                  <div className="text-[10px] text-ccweb-muted">
                    p(notable) ≈ {(tx.probabilityNotable * 100).toFixed(0)}%
                  </div>
                  <div className="text-[10px] text-ccweb-muted">
                    {new Date(tx.timestamp).toLocaleString()}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Token analysis */}
        <section className="rounded-2xl border border-ccweb-border bg-ccweb-card p-5 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white">Token analysis</h2>
          <ul className="mt-4 space-y-3 text-sm text-ccweb-muted">
            <li className="flex justify-between gap-2 border-b border-white/10 pb-2">
              <span>Liquidity (est.)</span>
              <span className="text-right text-white">
                {fmtUsd(data.liquidity.usd)}{" "}
                <span className="text-ccweb-muted">({data.liquidity.depthLabel})</span>
              </span>
            </li>
            <li className="flex justify-between gap-2 border-b border-white/10 pb-2">
              <span>LP lock</span>
              <span className={data.liquidity.locked ? "text-emerald-300" : "text-amber-300"}>
                {data.liquidity.locked ? "Yes (model)" : "No / unknown"}
              </span>
            </li>
            <li className="flex justify-between gap-2 border-b border-white/10 pb-2">
              <span>Top 1 holder</span>
              <span className="text-white">{data.ownership.top1HolderPct}%</span>
            </li>
            <li className="flex justify-between gap-2 border-b border-white/10 pb-2">
              <span>Top 10 holders</span>
              <span className="text-white">{data.ownership.top10HoldersPct}%</span>
            </li>
            <li className="flex justify-between gap-2 border-b border-white/10 pb-2">
              <span>Contract verified</span>
              <span className={data.contract.verified ? "text-emerald-300" : "text-rose-300"}>
                {data.contract.verified ? "Yes" : "No"}
              </span>
            </li>
            <li className="flex justify-between gap-2 border-b border-white/10 pb-2">
              <span>Ownership</span>
              <span className="text-right capitalize text-white">{data.contract.ownershipStatus?.replace(/_/g, " ")}</span>
            </li>
            <li className="flex justify-between gap-2">
              <span>Mint / burn</span>
              <span className="text-right text-white">{data.contract.mintFunctions}</span>
            </li>
          </ul>
          <p className="mt-3 text-xs text-ccweb-muted">{data.liquidity.note}</p>
          <p className="mt-1 text-xs text-ccweb-muted">{data.ownership.note}</p>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Social */}
        <section className="rounded-2xl border border-ccweb-border bg-ccweb-card p-5 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white">Social signals</h2>
          <p className="mt-1 text-xs text-ccweb-muted">{data.social.note}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-xs text-ccweb-muted">X (Twitter) est.</div>
              <div className="text-xl font-semibold text-white">{data.social.twitterMentions24h}</div>
              <div className="text-[10px] text-ccweb-muted">mentions / 24h</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-xs text-ccweb-muted">Reddit est.</div>
              <div className="text-xl font-semibold text-white">{data.social.redditPosts24h}</div>
              <div className="text-[10px] text-ccweb-muted">posts / 24h</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xs font-medium uppercase tracking-wide text-ccweb-muted">Trending keywords</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {data.social.trendingKeywords?.map((k) => (
                <span key={k} className="rounded-full border border-ccweb-violet/30 bg-ccweb-violet/10 px-2.5 py-1 text-xs text-violet-100">
                  #{k}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* AI summary */}
        <section className="rounded-2xl border border-ccweb-border bg-ccweb-card p-5 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white">AI-style summary</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-200">{data.aiSummary.headline}</p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-ccweb-muted">
            {data.aiSummary.bullets?.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-ccweb-muted">
            Risk vs reward (heuristic label):{" "}
            <span className="text-ccweb-cyan">{data.aiSummary.riskVsReward?.replace(/_/g, " ")}</span>
          </p>
        </section>
      </div>

      {data.discoverMatch && (
        <p className="text-center text-xs text-ccweb-muted">
          Discovery row: {data.discoverMatch.id} — {data.discoverMatch.dataSourceNote}
        </p>
      )}
    </div>
  );
}
