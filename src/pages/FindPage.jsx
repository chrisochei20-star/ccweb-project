import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ShareActions } from "../components/ShareCard";
import { ApiErrorPanel } from "../components/ui/ApiErrorPanel";
import { apiUrl } from "../config/env";
import { apiFetch } from "../lib/apiClient";
import { logScannerClient } from "../lib/aiDiagnostics";
import { formatUserFacingError } from "../lib/userFacingError";
import { Skeleton } from "../components/ui/Skeleton";

function fmtProbPct(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(0)}%`;
}

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
  const [scanMessage, setScanMessage] = useState(null);
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
  const [signalsErr, setSignalsErr] = useState(null);
  const [smErr, setSmErr] = useState(null);
  const [discoverErr, setDiscoverErr] = useState(null);
  const [alertsErr, setAlertsErr] = useState(null);
  const [walletErr, setWalletErr] = useState(null);

  function goTab(next) {
    setTab(next);
    setSearchParams(next === "scanner" ? {} : { tab: next });
  }

  const SCAN_TIMEOUT_MS = 15_000;
  const SCAN_EMPTY_HINT =
    "No data found for this token. Check the symbol and try again. If you only entered a symbol, add the contract address (0x…) — live scans need an on-chain address.";

  async function doScan() {
    if (!scanSymbol.trim() && !scanAddress.trim()) return;
    setScanning(true);
    setScanResult(null);
    setScanMessage(null);
    const ac = new AbortController();
    const timeoutId = setTimeout(() => ac.abort(), SCAN_TIMEOUT_MS);
    try {
      const params = new URLSearchParams();
      if (scanSymbol.trim()) params.set("token", scanSymbol.trim().toUpperCase());
      if (scanAddress.trim()) params.set("address", scanAddress.trim());
      const res = await apiFetch(apiUrl(`/api/scan-token?${params.toString()}`), { signal: ac.signal });
      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }
      if (!res.ok) {
        const apiErr =
          (typeof data.error === "string" && data.error) ||
          (typeof data.message === "string" && data.message) ||
          (res.status === 402 ? "Scan allowance exhausted for this account." : null);
        setScanMessage(apiErr || SCAN_EMPTY_HINT);
        return;
      }
      if (data && typeof data.error === "string" && data.error) {
        setScanMessage(data.error);
        return;
      }
      const hasPayload = Boolean(
        (data.token != null && String(data.token).trim()) ||
          (data.name != null && String(data.name).trim()) ||
          (data.contractAddress != null && String(data.contractAddress).trim()) ||
          (data.modules && typeof data.modules === "object")
      );
      if (!hasPayload) {
        setScanMessage(SCAN_EMPTY_HINT);
        return;
      }
      setScanResult(data);
    } catch (e) {
      if (e?.name === "AbortError") {
        setScanMessage("This scan is taking too long and was stopped. Check the symbol or address and try again.");
      } else {
        setScanMessage(SCAN_EMPTY_HINT);
      }
    } finally {
      clearTimeout(timeoutId);
      setScanning(false);
    }
  }

  async function loadSignals() {
    setLoadingSignals(true);
    setSignalsErr(null);
    try {
      const res = await apiFetch(apiUrl("/api/find/signals"), {}, { timeoutMs: 8000 });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not load signals.");
      setSignals(data.signals || []);
      logScannerClient("signals_ok", { count: (data.signals || []).length });
    } catch (e) {
      setSignalsErr(formatUserFacingError(e, "Could not load signals."));
      logScannerClient("signals_error", { message: e.message });
    }
    setLoadingSignals(false);
  }

  async function loadSmartMoney() {
    setLoadingSm(true);
    setSmErr(null);
    try {
      const res = await apiFetch(apiUrl("/api/find/smart-money"), {}, { timeoutMs: 8000 });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not load smart money data.");
      setSmartMoney(data);
      logScannerClient("smart_money_ok", { wallets: data?.wallets?.length || 0 });
    } catch (e) {
      setSmErr(formatUserFacingError(e, "Could not load smart money data."));
      logScannerClient("smart_money_error", { message: e.message });
    }
    setLoadingSm(false);
  }

  async function loadDiscover() {
    setLoadingDiscover(true);
    setDiscoverErr(null);
    try {
      const res = await apiFetch(apiUrl("/api/discover-tokens"), {}, { timeoutMs: 8000 });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not load discovery feed.");
      setDiscover(data);
      logScannerClient("discover_ok", { tokens: data?.tokens?.length || 0 });
    } catch (e) {
      setDiscoverErr(formatUserFacingError(e, "Could not load discovery feed."));
      logScannerClient("discover_error", { message: e.message });
    }
    setLoadingDiscover(false);
  }

  async function loadAlerts() {
    setLoadingAlerts(true);
    setAlertsErr(null);
    try {
      const res = await apiFetch(apiUrl("/api/crypto/alerts"), {}, { timeoutMs: 8000 });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not load alerts.");
      setAlerts(data);
      logScannerClient("alerts_ok", { count: data?.alerts?.length || 0 });
    } catch (e) {
      setAlertsErr(formatUserFacingError(e, "Could not load alerts."));
      logScannerClient("alerts_error", { message: e.message });
    }
    setLoadingAlerts(false);
  }

  async function scanWallet() {
    if (!walletInput.trim()) return;
    setWalletLoading(true);
    setWalletScan(null);
    setWalletTrackMsg(null);
    setWalletErr(null);
    try {
      const res = await apiFetch(
        apiUrl(`/api/scan-wallet?address=${encodeURIComponent(walletInput.trim())}`),
        {},
        { timeoutMs: 8000 }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        throw new Error(data.error || "Wallet scan failed.");
      }
      setWalletScan(data);
      logScannerClient("wallet_scan_ok", { address: walletInput.trim().slice(0, 10) });
    } catch (e) {
      setWalletErr(formatUserFacingError(e, "Wallet scan failed."));
      logScannerClient("wallet_scan_error", { message: e.message });
    }
    setWalletLoading(false);
  }

  async function trackWallet() {
    if (!walletInput.trim()) return;
    setWalletTrackMsg(null);
    try {
      const res = await apiFetch(apiUrl("/api/track-wallet"), {
        method: "POST",
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
    if (tab === "signals" && !signals.length && !signalsErr) loadSignals();
    if (tab === "trending" && !smartMoney && !smErr) loadSmartMoney();
    if (tab === "trending" && !discover && !discoverErr) loadDiscover();
    if (tab === "wallets" && !smartMoney && !smErr) loadSmartMoney();
    if (tab === "alerts" && !alerts && !alertsErr) loadAlerts();
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
            {scanning && (
              <div className="find-scan-status" role="status" aria-live="polite">
                <span className="find-scan-spinner-el" aria-hidden />
                <span>Running scan…</span>
              </div>
            )}
            {scanMessage && !scanning && (
              <p className="find-scan-message" role="alert">
                {scanMessage}
              </p>
            )}
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
                <div className="mt-3">
                  <ShareActions
                    kind="token_scan"
                    payload={{
                      symbol: scanResult.token,
                      score: scanResult.score,
                      url:
                        typeof window !== "undefined"
                          ? `${window.location.origin}/token/${encodeURIComponent(scanResult.contractAddress || scanResult.token)}`
                          : "",
                    }}
                  />
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
                  <h4>Heuristic insight layer</h4>
                  <p className="muted small-print">Rule-based synthesis from on-chain heuristics — not a live LLM call.</p>
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
          {loadingSignals && (
            <div className="space-y-3 py-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          )}
          {signalsErr ? <ApiErrorPanel message={signalsErr} onRetry={loadSignals} className="mb-3" /> : null}
          {!loadingSignals && !signalsErr && signals.length === 0 && (
            <p className="muted">No early signals available right now. Try refreshing in a moment.</p>
          )}
          <div className="find-signals-grid">
            {signals.map((sig) => (
              <article key={sig.id} className="find-signal-card panel glass-panel">
                <div className="find-signal-header">
                  <span className="badge">{(sig.type || "signal").replace(/_/g, " ")}</span>
                  <span className="find-confidence">{sig.confidence}% signal</span>
                </div>
                <h4>{sig.title}</h4>
                <p className="muted">{sig.description}</p>
                <ShareActions
                  kind="signal"
                  payload={{ title: sig.title }}
                  className="mt-2"
                />
                <div className="pill-row">
                  {(sig.tokens || []).map((t) => (
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
          {discoverErr ? <ApiErrorPanel message={discoverErr} onRetry={loadDiscover} className="mb-3" /> : null}
          {!loadingDiscover && !discoverErr && discover?.tokens?.length === 0 && (
            <p className="muted">No discovery tokens returned from the API.</p>
          )}
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
                      {(t.narrativeKeywords || []).map((k) => (
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
          {smErr ? <ApiErrorPanel message={smErr} onRetry={loadSmartMoney} className="mb-3" /> : null}
          {!loadingSm && !smErr && smartMoney?.trends?.length === 0 && (
            <p className="muted">No whale trend data available.</p>
          )}
          {smartMoney && (
            <>
              <h3 style={{ marginTop: "1.5rem" }}>Whale flow trends (sample)</h3>
              <div className="find-trends-grid">
                {(smartMoney.trends || []).map((t) => (
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

          {loadingSm && <p className="muted">Loading smart money panel…</p>}
          {smErr ? <ApiErrorPanel message={smErr} onRetry={loadSmartMoney} className="mb-3" /> : null}
          {!loadingSm && !smErr && smartMoney?.wallets?.length === 0 && (
            <p className="muted">No smart money wallet data available.</p>
          )}
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
                {(smartMoney.wallets || []).map((w) => (
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
                      {(w.recentMoves || []).map((m, i) => (
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
          {alertsErr ? <ApiErrorPanel message={alertsErr} onRetry={loadAlerts} className="mb-3" /> : null}
          {!loadingAlerts && !alertsErr && alerts?.alerts?.length === 0 && (
            <p className="muted">No alerts in the feed right now.</p>
          )}
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
