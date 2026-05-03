import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

const trendLabel = {
  warming: "Warming",
  cooling: "Cooling",
  neutral: "Neutral",
  high_noise: "High noise",
};

function scoreTone(score, mode) {
  if (mode === "risk") {
    if (score <= 35) return "text-emerald-300 bg-emerald-500/15 border-emerald-500/30";
    if (score <= 55) return "text-amber-200 bg-amber-500/12 border-amber-400/35";
    return "text-rose-200 bg-rose-500/12 border-rose-400/35";
  }
  if (score >= 62) return "text-emerald-200 bg-emerald-500/12 border-emerald-400/30";
  if (score >= 42) return "text-amber-100 bg-amber-500/10 border-amber-400/25";
  return "text-slate-300 bg-white/5 border-white/10";
}

export function EarlySignalsDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trackAddr, setTrackAddr] = useState("");
  const [trackLabel, setTrackLabel] = useState("");
  const [trackMsg, setTrackMsg] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/intelligence/dashboard");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load dashboard");
      setData(json);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (typeof EventSource === "undefined") return;
    const es = new EventSource("/api/intelligence/stream");
    es.addEventListener("snapshot", () => {
      load();
    });
    es.onerror = () => {
      /* SSE may drop behind proxies; manual refresh still works */
    };
    return () => {
      es.close();
    };
  }, [load]);

  async function addTracked() {
    setTrackMsg(null);
    if (!trackAddr.trim()) return;
    try {
      const res = await fetch("/api/intelligence/tracked-wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: trackAddr.trim(),
          label: trackLabel.trim() || "Tracked wallet",
          alertsEnabled: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Track failed");
      setTrackMsg(
        json.persistence?.persisted
          ? "Saved to MongoDB."
          : json.persistence?.reason || json.note || "OK"
      );
      setTrackAddr("");
      setTrackLabel("");
      load();
    } catch (e) {
      setTrackMsg(e.message);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-ccweb-muted">
        Loading intelligence…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-100">
        {error}
      </div>
    );
  }

  const items = data?.feed?.items || [];
  const narratives = data?.narratives;
  const riskAlerts = data?.riskAlerts || [];
  const sm = data?.smartMoney;

  return (
    <div className="space-y-6 pb-16">
      <header className="rounded-2xl border border-ccweb-border bg-ccweb-card px-4 py-5 shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:px-8 sm:py-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ccweb-cyan">
          CCWEB · Early Signals
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Real-time crypto intelligence
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ccweb-muted sm:text-base">
          Emerging tokens from on-chain and social-style signals with explicit risk scores. All numbers are
          probabilistic signals — not profit forecasts. Always verify contracts and liquidity yourself.
        </p>
        <p className="mt-3 text-xs text-ccweb-muted/90 sm:text-sm">{data?.disclaimer}</p>
        <p className="mt-2 text-xs text-ccweb-muted">
          Updated {data?.updatedAt ? new Date(data.updatedAt).toLocaleString() : "—"} · SSE refresh ~12s
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Early signals feed</h2>
            <button
              type="button"
              onClick={() => load()}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-ccweb-cyan backdrop-blur-md transition hover:bg-white/10"
            >
              Refresh
            </button>
          </div>
          <div className="space-y-3">
            {items.map((t) => (
              <Link
                key={t.id}
                to={`/token/${encodeURIComponent(t.symbol)}`}
                className="block rounded-2xl border border-ccweb-border bg-ccweb-card p-4 shadow-lg backdrop-blur-xl transition hover:border-ccweb-cyan/40 hover:bg-ccweb-card sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">{t.name}</h3>
                      <span className="rounded-lg bg-white/10 px-2 py-0.5 font-mono text-xs text-ccweb-muted">
                        {t.symbol}
                      </span>
                      <span className="rounded-lg border border-ccweb-cyan/30 bg-ccweb-cyan/10 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-ccweb-cyan">
                        {t.chain}
                      </span>
                    </div>
                    <p className="mt-1 break-all font-mono text-xs text-ccweb-muted">{t.contractAddress}</p>
                    <p className="mt-2 text-xs text-ccweb-muted">
                      Detected ~{t.deployedHoursAgo}h after deploy · {t.dataSourceNote}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div
                      className={`rounded-xl border px-3 py-2 text-center text-sm font-semibold ${scoreTone(t.opportunityScore, "opp")}`}
                    >
                      <div className="text-[10px] font-normal uppercase tracking-wider text-white/60">
                        Opportunity
                      </div>
                      {t.opportunityScore}
                    </div>
                    <div
                      className={`rounded-xl border px-3 py-2 text-center text-sm font-semibold ${scoreTone(t.riskScore, "risk")}`}
                    >
                      <div className="text-[10px] font-normal uppercase tracking-wider text-white/60">Risk</div>
                      {t.riskScore}
                    </div>
                    <div className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-center text-sm text-white/90">
                      <div className="text-[10px] uppercase tracking-wider text-white/50">Trend</div>
                      {trendLabel[t.trendStatus] || t.trendStatus}
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
                  <div className="rounded-lg bg-black/20 px-3 py-2 text-ccweb-muted">
                    Vol spike p ≈ {(t.signalProbabilities.volumeSpike * 100).toFixed(0)}%
                  </div>
                  <div className="rounded-lg bg-black/20 px-3 py-2 text-ccweb-muted">
                    Holder growth p ≈ {(t.signalProbabilities.holderGrowth * 100).toFixed(0)}%
                  </div>
                  <div className="rounded-lg bg-black/20 px-3 py-2 text-ccweb-muted">
                    Social buzz p ≈ {(t.signalProbabilities.socialBuzz * 100).toFixed(0)}%
                  </div>
                  <div className="rounded-lg bg-black/20 px-3 py-2 text-ccweb-muted">
                    Whale activity p ≈ {(t.signalProbabilities.whaleActivity * 100).toFixed(0)}%
                  </div>
                </div>
                {t.warnings?.length > 0 && (
                  <ul className="mt-3 space-y-1 border-t border-white/10 pt-3 text-xs text-amber-100/95">
                    {t.warnings.map((w) => (
                      <li key={w.code}>· {w.message}</li>
                    ))}
                  </ul>
                )}
                <p className="mt-3 text-xs font-medium text-ccweb-cyan">Open token detail →</p>
              </Link>
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-ccweb-border bg-ccweb-card p-4 backdrop-blur-xl sm:p-5">
            <h2 className="text-lg font-semibold text-white">Risk alerts</h2>
            <p className="mt-1 text-xs text-ccweb-muted">Heuristic warnings — not exhaustive audits.</p>
            <ul className="mt-4 space-y-3">
              {riskAlerts.map((a) => (
                <li
                  key={a.id}
                  className={`rounded-xl border p-3 text-sm ${
                    a.severity === "high"
                      ? "border-rose-400/40 bg-rose-500/10"
                      : a.severity === "medium"
                        ? "border-amber-400/35 bg-amber-500/8"
                        : "border-white/10 bg-black/15"
                  }`}
                >
                  <div className="font-medium text-white">
                    {a.symbol} · {a.chain}
                  </div>
                  <p className="mt-1 text-xs text-ccweb-muted">{a.probabilityNote}</p>
                  <ul className="mt-2 space-y-0.5 text-xs text-amber-50/90">
                    {a.warnings?.map((w) => (
                      <li key={w.code}>{w.message}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-ccweb-border bg-ccweb-card p-4 backdrop-blur-xl sm:p-5">
            <h2 className="text-lg font-semibold text-white">Narrative trends</h2>
            <p className="mt-1 text-xs text-ccweb-muted">{narratives?.disclaimer}</p>
            <ul className="mt-4 space-y-3">
              {narratives?.keywords?.map((k) => (
                <li key={k.term} className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="flex justify-between gap-2 text-sm font-medium text-white">
                    <span>#{k.term}</span>
                    <span className="text-ccweb-cyan">{k.momentum}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-ccweb-muted">
                    <span>X {(k.sources.twitter * 100).toFixed(0)}%</span>
                    <span>· Reddit {(k.sources.reddit * 100).toFixed(0)}%</span>
                    <span>· TG {(k.sources.telegram * 100).toFixed(0)}%</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <section className="rounded-2xl border border-ccweb-border bg-ccweb-card p-4 backdrop-blur-xl sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Smart money tracker</h2>
            <p className="mt-1 max-w-xl text-sm text-ccweb-muted">
              Track EVM addresses (MongoDB when <code className="text-ccweb-cyan">MONGODB_URI</code> is set).
              Recent moves below mix demo flows with your list — wire your own indexer for production accuracy.
            </p>
            <p className="mt-2 text-xs text-ccweb-muted">{sm?.disclaimer}</p>
          </div>
          <div className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
            <input
              className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black/25 px-3 py-2.5 font-mono text-sm text-white placeholder:text-slate-500"
              placeholder="0x… address"
              value={trackAddr}
              onChange={(e) => setTrackAddr(e.target.value)}
            />
            <input
              className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black/25 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 sm:max-w-[140px]"
              placeholder="Label"
              value={trackLabel}
              onChange={(e) => setTrackLabel(e.target.value)}
            />
            <button
              type="button"
              onClick={addTracked}
              className="rounded-xl bg-gradient-to-r from-ccweb-cyan to-ccweb-violet px-4 py-2.5 text-sm font-semibold text-[#061329]"
            >
              Track
            </button>
          </div>
        </div>
        {trackMsg && <p className="mt-3 text-sm text-ccweb-muted">{trackMsg}</p>}

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-ccweb-muted">Your tracked wallets</h3>
            <ul className="mt-3 space-y-2">
              {(sm?.tracked || []).length === 0 && (
                <li className="text-sm text-ccweb-muted">No saved wallets yet.</li>
              )}
              {sm?.tracked?.map((w) => (
                <li key={w.address} className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
                  <div className="font-mono text-xs text-white">{w.address}</div>
                  <div className="text-ccweb-muted">{w.label}</div>
                  <p className="mt-2 text-xs text-ccweb-muted">{w.note}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {w.recentMoves?.map((m, i) => (
                      <span
                        key={i}
                        className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                          m.action === "buy"
                            ? "bg-emerald-500/15 text-emerald-200"
                            : "bg-rose-500/12 text-rose-200"
                        }`}
                      >
                        {m.action} {m.token}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-ccweb-muted">
              Market smart wallets (sample)
            </h3>
            <ul className="mt-3 space-y-2">
              {sm?.marketWallets?.map((w) => (
                <li key={w.address} className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium text-white">{w.label}</span>
                    <span className="text-xs text-ccweb-muted">{w.address}</span>
                  </div>
                  <p className="mt-1 text-xs text-ccweb-muted">Win rate (sample) {w.winRate}% — not predictive</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <footer className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-ccweb-muted">
        Scoring: {data?.scoring?.opportunity} · Risk: {data?.scoring?.risk}
      </footer>
    </div>
  );
}
