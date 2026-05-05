import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

export function FindPage({ initialTab = "scanner" }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const validTabs = ["scanner", "signals", "trending", "wallets", "alerts"];
  const initial = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : initialTab;
  const [tab, setTab] = useState(initial);

  useEffect(() => {
    if (tabFromUrl && validTabs.includes(tabFromUrl)) setTab(tabFromUrl);
  }, [tabFromUrl]);

  const [scanSymbol, setScanSymbol] = useState("");
  const [scanAddress, setScanAddress] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [signals, setSignals] = useState([]);
  const [smartMoney, setSmartMoney] = useState(null);
  const [discover, setDiscover] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [walletInput, setWalletInput] = useState("");
  const [walletScan, setWalletScan] = useState(null);
  const [walletTrackMsg, setWalletTrackMsg] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [loadingSignals, setLoadingSignals] = useState(false);
  const [loadingSm, setLoadingSm] = useState(false);
  const [loadingDiscover, setLoadingDiscover] = useState(false);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [smDisclosure, setSmDisclosure] = useState(false);

  function goTab(next) {
    setTab(next);
    setSearchParams(next === "scanner" ? {} : { tab: next });
  }

  async function doScan() {
    if (!scanSymbol.trim() && !scanAddress.trim()) return;
    setScanning(true);
    setScanResult(null);
    try {
      const params = new URLSearchParams();
      if (scanSymbol.trim()) params.set("token", scanSymbol.trim().toUpperCase());
      if (scanAddress.trim()) params.set("address", scanAddress.trim());
      const res = await fetch(`/api/scan-token?${params.toString()}`);
      const data = await res.json();
      setScanResult(data);
    } catch {
      /* ignore */
    }
    setScanning(false);
  }

  async function loadSignals() {
    setLoadingSignals(true);
    try {
      const res = await fetch("/api/find/signals");
      const data = await res.json();
      setSignals(data.signals || []);
    } catch {
      /* ignore */
    }
    setLoadingSignals(false);
  }

  async function loadSmartMoney() {
    setLoadingSm(true);
    try {
      const res = await fetch("/api/find/smart-money");
      const data = await res.json();
      setSmartMoney(data);
    } catch {
      /* ignore */
    }
    setLoadingSm(false);
  }

  async function loadDiscover() {
    setLoadingDiscover(true);
    try {
      const res = await fetch("/api/discover-tokens");
      const data = await res.json();
      setDiscover(data);
    } catch {
      /* ignore */
    }
    setLoadingDiscover(false);
  }

  async function loadAlerts() {
    setLoadingAlerts(true);
    try {
      const res = await fetch("/api/crypto/alerts");
      const data = await res.json();
      setAlerts(data);
    } catch {
      /* ignore */
    }
    setLoadingAlerts(false);
  }

  async function scanWallet() {
    if (!walletInput.trim()) return;
    setWalletLoading(true);
    setWalletScan(null);
    setWalletTrackMsg(null);
    try {
      const res = await fetch(`/api/scan-wallet?address=${encodeURIComponent(walletInput.trim())}`);
      const data = await res.json();
      setWalletScan(data.error ? null : data);
    } catch {
      /* ignore */
    }
    setWalletLoading(false);
  }

  async function trackWallet() {
    if (!walletInput.trim()) return;
    setWalletTrackMsg(null);
    try {
      const res = await fetch("/api/track-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: walletInput.trim(),
          action: "register",
          alertsEnabled: true,
        }),
      });
      const data = await res.json();
      setWalletTrackMsg(data.error || data.note || "Tracking updated.");
    } catch {
      setWalletTrackMsg("Request failed.");
    }
  }

  useEffect(() => {
    if (tab === "signals" && !signals.length) loadSignals();
    if (tab === "trending" && !smartMoney) loadSmartMoney();
    if (tab === "trending" && !discover) loadDiscover();
    if (tab === "wallets" && !smartMoney) loadSmartMoney();
    if (tab === "alerts" && !alerts) loadAlerts();
  }, [tab]);

  const scoreColor = (score) =>
    score >= 70 ? "find-score-safe" : score >= 40 ? "find-score-warn" : "find-score-danger";

  const mod = scanResult?.modules;
  const sec = mod?.security;
  const ai = mod?.aiInsightEngine;
  const onChain = mod?.onChainIntelligence;
  const early = mod?.earlyDiscovery;

  return (
    <section className="find-page find-hub">
      <header className="page-header find-hub-header">
        <span className="pill">FIND — Safety Scanner &amp; Alpha Engine</span>
        <h1 className="section-title">Crypto Intelligence Hub</h1>
        <p className="muted">
          On-chain signals, narrative velocity, and risk heuristics — framed as probabilities, not promises.
          Volatility is extreme; verify everything independently.
        </p>
      </header>

      <div className="dash-tabs find-hub-tabs">
        {[
          ["scanner", "Token Scanner"],
          ["signals", "Early Signals"],
          ["trending", "Trending & Discovery"],
          ["wallets", "Wallets & Smart Money"],
          ["alerts", "Alerts"],
        ].map(([key, label]) => (
          <button key={key} type="button" className={`dash-tab ${tab === key ? "active" : ""}`} onClick={() => goTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {tab === "scanner" && (
        <div className="find-scanner find-scanner-wide">
          <div className="panel glass-panel find-scan-input-panel">
            <h3>Token safety &amp; alpha snapshot</h3>
            <p className="muted">
              Contract verification, liquidity lock, ownership, mint or burn paths, estimated transfer friction,
              rug-pattern heuristics, and a synthesized opportunity score. Accuracy depends on configured explorer and
              indexer credentials.
            </p>
            <div className="find-scan-form find-scan-form-stack">
              <input
                type="text"
                value={scanSymbol}
                onChange={(e) => setScanSymbol(e.target.value)}
                placeholder="Token symbol (e.g. ETH, SHIB)"
                onKeyDown={(e) => e.key === "Enter" && doScan()}
              />
              <input
                type="text"
                value={scanAddress}
                onChange={(e) => setScanAddress(e.target.value)}
                placeholder="Optional contract address (0x…)"
                onKeyDown={(e) => e.key === "Enter" && doScan()}
              />
              <button className="btn btn-primary" type="button" onClick={doScan} disabled={scanning}>
                {scanning ? "Scanning…" : "Run scan"}
              </button>
            </div>
            <p className="find-legal-note">
              Scores are model outputs, not audits. High opportunity scores can still coincide with scams.
            </p>
          </div>

          {scanResult && (
            <div className="find-scan-results-grid">
              <div className="find-scan-result panel glass-panel">
                <div className="find-scan-header">
                  <div>
                    <h3 style={{ margin: 0 }}>
                      {scanResult.name} <span className="muted">({scanResult.token})</span>
                    </h3>
                    {scanResult.contractAddress && <p className="muted find-mono">{scanResult.contractAddress}</p>}
                  </div>
                  <div className="find-score-row">
                    <div className="find-score-pair">
                      <span className="muted">Risk</span>
                      <div className={`find-score-badge ${scoreColor(scanResult.score)}`}>{scanResult.score}/100</div>
                    </div>
                    {ai && (
                      <div className="find-score-pair">
                        <span className="muted">Opportunity</span>
                        <div className={`find-score-badge ${scoreColor(ai.opportunityScore)}`}>{ai.opportunityScore}/100</div>
                      </div>
                    )}
                  </div>
                </div>
                <p className="muted find-band-label">
                  Risk tier: <strong>{sec?.riskBand || "—"}</strong>
                  {ai && (
                    <>
                      {" "}
                      · Risk vs reward (heuristic): <strong>{ai.riskVsReward?.replace(/_/g, " ")}</strong>
                    </>
                  )}
                </p>
                <div className="find-scan-grid">
                  <div className="find-check-item">
                    <span className={scanResult.contractVerified ? "check-pass" : "check-fail"}>
                      {scanResult.contractVerified ? "✓" : "✗"}
                    </span>{" "}
                    Contract verified
                  </div>
                  <div className="find-check-item">
                    <span className={scanResult.liquidityLocked ? "check-pass" : "check-fail"}>
                      {scanResult.liquidityLocked ? "✓" : "✗"}
                    </span>{" "}
                    Liquidity lock
                  </div>
                  <div className="find-check-item">
                    <span className={scanResult.ownershipRenounced ? "check-pass" : "check-fail"}>
                      {scanResult.ownershipRenounced ? "✓" : "✗"}
                    </span>{" "}
                    Ownership renounced
                  </div>
                  <div className="find-check-item">
                    <span>Mint / burn:</span> <strong>{sec?.mintBurnFunctions || "—"}</strong>
                  </div>
                  <div className="find-check-item">
                    <span>Hidden tax (est.):</span> <strong>{sec?.hiddenTaxEstimatePercent ?? 0}%</strong>
                  </div>
                  <div className="find-check-item">
                    <span>Honeypot risk:</span>{" "}
                    <strong
                      className={
                        scanResult.honeypotRisk === "none" || scanResult.honeypotRisk === "low"
                          ? "check-pass"
                          : "check-fail"
                      }
                    >
                      {scanResult.honeypotRisk}
                    </strong>
                  </div>
                  <div className="find-check-item">
                    <span>Rug pull risk:</span>{" "}
                    <strong
                      className={
                        scanResult.rugPullRisk === "very_low" || scanResult.rugPullRisk === "low"
                          ? "check-pass"
                          : "check-fail"
                      }
                    >
                      {scanResult.rugPullRisk}
                    </strong>
                  </div>
                  <div className="find-check-item">
                    <span>Network:</span> <strong>{scanResult.network}</strong>
                  </div>
                </div>
                {scanResult.flags?.length > 0 && (
                  <div className="find-flags">
                    <strong>Flags:</strong>{" "}
                    <div className="pill-row">
                      {scanResult.flags.map((f) => (
                        <span key={f} className="tiny-pill find-flag-pill">
                          {f.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {sec && (
                <div className="panel glass-panel find-module-card">
                  <h4>Rug-pattern signals</h4>
                  <ul className="find-bullet-list">
                    {sec.rugPullSignals?.map((r) => (
                      <li key={r.type}>
                        <strong>{r.type.replace(/_/g, " ")}</strong> — {r.note}{" "}
                        <span className="muted">(p ≈ {(r.confidence * 100).toFixed(0)}%)</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {onChain && (
                <div className="panel glass-panel find-module-card">
                  <h4>On-chain intelligence (sample)</h4>
                  <p className="muted small-print">{onChain.smartMoney?.note}</p>
                  <ul className="find-bullet-list">
                    <li>
                      Smart wallets with early overlap: <strong>{onChain.smartMoney?.walletsBuyingEarly}</strong>
                    </li>
                    <li>
                      Large buys / sells (24h): <strong>{onChain.whaleActivity?.largeBuys24h}</strong> /{" "}
                      <strong>{onChain.whaleActivity?.largeSells24h}</strong>
                    </li>
                    <li>
                      Accumulation probability (model): <strong>{onChain.whaleActivity?.suddenAccumulationProbability}</strong>
                    </li>
                    <li>
                      Coordinated-activity score: <strong>{onChain.walletClustering?.coordinatedActivityScore}</strong> / 100
                    </li>
                  </ul>
                  <p className="muted small-print">{onChain.tokenFlow?.note}</p>
                </div>
              )}

              {early && (
                <div className="panel glass-panel find-module-card">
                  <h4>Early discovery signals</h4>
                  <ul className="find-bullet-list">
                    <li>
                      New contract probability: <strong>{(early.newContractProbability * 100).toFixed(0)}%</strong>
                    </li>
                    <li>
                      Early liquidity score: <strong>{early.earlyLiquidityScore}</strong>/100
                    </li>
                    <li>
                      Volume momentum: <strong>{early.volumeMomentumScore}</strong>/100
                    </li>
                    <li>
                      Holder growth (model): <strong>{early.holderGrowthRate}</strong>
                    </li>
                  </ul>
                  <p className="muted small-print">
                    Social: Twitter velocity {early.socialSignals?.twitterX?.mentionVelocity}/100 · Reddit velocity{" "}
                    {early.socialSignals?.reddit?.postVelocity}/100
                  </p>
                  <p className="muted small-print">{early.influencerCorrelation?.note}</p>
                </div>
              )}

              {ai && (
                <div className="panel glass-panel find-module-card find-ai-card">
                  <h4>AI insight layer</h4>
                  <ul className="find-insight-list">
                    {ai.insights?.map((ins) => (
                      <li key={ins.id}>
                        {ins.text} <span className="muted">(confidence {(ins.confidence * 100).toFixed(0)}%)</span>
                      </li>
                    ))}
                  </ul>
                  {scanResult.methodology && (
                    <p className="muted small-print find-mono-small">{scanResult.methodology.riskScoreFormula}</p>
                  )}
                </div>
              )}

              {scanResult.disclaimer && <p className="find-disclaimer glass-panel">{scanResult.disclaimer}</p>}
              <div style={{ marginTop: "1rem" }}>
                <Link
                  className="btn btn-primary"
                  to={
                    scanResult.contractAddress
                      ? `/token/${encodeURIComponent(scanResult.contractAddress)}`
                      : `/token/${encodeURIComponent(scanResult.token)}`
                  }
                >
                  Open full token detail
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "signals" && (
        <div className="find-signals">
          <div className="find-signals-toolbar">
            <h3 style={{ margin: 0 }}>Early Signals feed</h3>
            <button type="button" className="btn btn-outline btn-sm" onClick={loadSignals} disabled={loadingSignals}>
              Refresh
            </button>
          </div>
          {loadingSignals && <p className="muted">Loading signals…</p>}
          <div className="find-signals-grid">
            {signals.map((sig) => (
              <article key={sig.id} className="find-signal-card panel glass-panel">
                <div className="find-signal-header">
                  <span className="badge">{sig.type.replace(/_/g, " ")}</span>
                  <span className="find-confidence">{sig.confidence}% signal</span>
                </div>
                <h4>{sig.title}</h4>
                <p className="muted">{sig.description}</p>
                <div className="pill-row">
                  {sig.tokens.map((t) => (
                    <span key={t} className="tiny-pill">
                      {t}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {tab === "trending" && (
        <div className="find-trending">
          {loadingDiscover && <p className="muted">Loading discovery…</p>}
          {discover?.tokens && (
            <>
              <h3>Alpha discovery (new &amp; early liquidity)</h3>
              <div className="find-discover-grid">
                {discover.tokens.map((t) => (
                  <Link
                    key={t.id}
                    to={`/token/${encodeURIComponent(t.symbol)}`}
                    className="panel glass-panel find-discover-card"
                    style={{ textDecoration: "none", color: "inherit", display: "block" }}
                  >
                    <div className="find-discover-head">
                      <strong>{t.symbol}</strong>
                      <span className="badge">{t.network}</span>
                    </div>
                    <p className="muted" style={{ margin: "0.35rem 0" }}>
                      {t.name}
                    </p>
                    <p className="muted small-print find-mono">{t.contractAddress}</p>
                    <ul className="find-discover-stats">
                      <li>Liquidity ~ ${(t.liquidityUsd / 1e3).toFixed(0)}k</li>
                      <li>Holders ~ {t.holderCount}</li>
                      <li>Deployed ~ {t.deployedHoursAgo}h ago</li>
                      <li>Signal strength {t.signalStrength}/100</li>
                    </ul>
                    <div className="pill-row">
                      {t.narrativeKeywords.map((k) => (
                        <span key={k} className="tiny-pill">
                          {k}
                        </span>
                      ))}
                    </div>
                    <p className="muted small-print">{t.dataSourceNote}</p>
                    <p className="muted small-print" style={{ marginTop: "0.5rem", color: "var(--brand-cyan)" }}>
                      Full detail page →
                    </p>
                  </Link>
                ))}
              </div>
            </>
          )}

          {loadingSm && <p className="muted">Loading whale trends…</p>}
          {smartMoney && (
            <>
              <h3 style={{ marginTop: "1.5rem" }}>Whale flow trends (sample)</h3>
              <div className="find-trends-grid">
                {smartMoney.trends.map((t) => (
                  <div key={t.token} className="find-trend-card panel glass-panel">
                    <strong>{t.token}</strong>
                    <div className={t.direction === "accumulation" ? "find-trend-up" : "find-trend-down"}>
                      {t.direction === "accumulation" ? "↑" : "↓"} ${(t.netFlow / 1e6).toFixed(1)}M
                    </div>
                    <span className="muted">
                      {t.whaleCount} wallets · {t.direction}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {tab === "wallets" && (
        <div className="find-wallets-tab">
          <div className="panel glass-panel find-wallet-scan-panel">
            <h3>Wallet risk scanner</h3>
            <p className="muted">
              Scam-adjacency probabilities, pattern flags, and cluster estimates. Paste any EVM address; example addresses in the API return illustrative patterns for QA.
            </p>
            <div className="find-scan-form">
              <input
                type="text"
                value={walletInput}
                onChange={(e) => setWalletInput(e.target.value)}
                placeholder="0x wallet address"
                onKeyDown={(e) => e.key === "Enter" && scanWallet()}
              />
              <button type="button" className="btn btn-primary" onClick={scanWallet} disabled={walletLoading}>
                {walletLoading ? "Scanning…" : "Scan wallet"}
              </button>
              <button type="button" className="btn btn-outline" onClick={trackWallet}>
                Track wallet
              </button>
            </div>
            {walletTrackMsg && <p className="muted small-print">{walletTrackMsg}</p>}
            {walletScan && (
              <div className="find-wallet-scan-result">
                <div className="find-scan-header">
                  <div>
                    <strong>{walletScan.label}</strong>
                    <p className="muted find-mono">{walletScan.address}</p>
                  </div>
                  <div className={`find-score-badge ${scoreColor(100 - walletScan.walletRiskScore)}`}>
                    danger {walletScan.walletRiskScore}/100
                  </div>
                </div>
                <p className="muted">
                  Safety tier: <strong>{walletScan.safetyTier}</strong> · Scam-link probability ~{" "}
                  {(walletScan.scamLinkedProbability * 100).toFixed(0)}%
                </p>
                <ul className="find-bullet-list">
                  {walletScan.suspiciousPatterns?.map((p) => (
                    <li key={p.type}>
                      {p.type.replace(/_/g, " ")} — p ≈ {(p.probability * 100).toFixed(0)}%
                    </li>
                  ))}
                </ul>
                <p className="muted small-print">
                  Cluster {walletScan.cluster?.id} · ~{walletScan.cluster?.relatedWalletsEstimate} related wallets (estimate)
                </p>
                {walletScan.disclaimer && <p className="find-disclaimer inline">{walletScan.disclaimer}</p>}
              </div>
            )}
          </div>

          {loadingSm && <p className="muted">Loading smart money panel…</p>}
          {smartMoney && (
            <>
              <div className="find-smart-toolbar">
                <h3 style={{ margin: 0 }}>Smart money &amp; whale panel</h3>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setSmDisclosure((v) => !v)}>
                  {smDisclosure ? "Hide" : "Show"} data disclaimer
                </button>
              </div>
              {smDisclosure && smartMoney.disclaimer && <p className="find-disclaimer glass-panel">{smartMoney.disclaimer}</p>}
              <div className="find-wallets-list">
                {smartMoney.wallets.map((w) => (
                  <div key={w.address} className="find-wallet-card panel glass-panel">
                    <div className="find-wallet-header">
                      <strong>{w.label}</strong>
                      <span className="muted">{w.address}</span>
                    </div>
                    <div className="find-wallet-stats">
                      <span>Win rate (sample): {w.winRate}%</span>
                      <span>Avg return (sample): {w.avgReturn}%</span>
                      <span>Not predictive — labels illustrative</span>
                    </div>
                    <div className="find-wallet-moves">
                      {w.recentMoves.map((m, i) => (
                        <span key={i} className={`find-move ${m.action === "buy" ? "move-buy" : "move-sell"}`}>
                          {m.action.toUpperCase()} {m.token} · ${(m.amountUsd / 1e6).toFixed(1)}M
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {tab === "alerts" && (
        <div className="find-alerts-tab">
          {loadingAlerts && <p className="muted">Loading alerts…</p>}
          {alerts?.alerts && (
            <>
              <h3>Alert stream (sample)</h3>
              <div className="find-alerts-grid">
                {alerts.alerts.map((a) => (
                  <article key={a.id} className={`panel glass-panel find-alert-card sev-${a.severity}`}>
                    <div className="find-alert-head">
                      <span className="badge">{a.type.replace(/_/g, " ")}</span>
                      <span className="muted small-print">{new Date(a.at).toLocaleString()}</span>
                    </div>
                    <h4>{a.title}</h4>
                    <p className="muted small-print">{a.probabilityNote}</p>
                  </article>
                ))}
              </div>
              {alerts.disclaimer && <p className="find-disclaimer glass-panel">{alerts.disclaimer}</p>}
            </>
          )}
        </div>
      )}
    </section>
  );
}
