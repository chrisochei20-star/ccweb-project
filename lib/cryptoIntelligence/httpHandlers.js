const { runScan, getScan, listRecent } = require("./scanner");
const {
  synthesizeWalletRiskScan,
  discoveryFeed,
  exampleDataset,
} = require("./intelligenceEngine");
const {
  addTrackedWallet,
  removeTrackedWallet,
  listTracked,
  pushAlert,
  listAlerts,
  isTracked,
} = require("./trackStore");
const { sendJson, readJsonBody } = require("../ccweb/http");

async function handleCryptoScan(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }
  const result = runScan(body);
  if (result.error) {
    sendJson(res, result.status || 400, { error: result.error });
    return;
  }

  const scan = result.scan;
  if (scan.aiInsights?.opportunityScore >= 72 && scan.riskScore < 55) {
    pushAlert({
      severity: "info",
      category: "early_signal",
      title: "Notable opportunity vs risk spread (demo)",
      detail: `${scan.symbol} on ${scan.chain} — synthetic model suggests elevated attention vs peers.`,
      related: { scanId: scan.id, tokenAddress: scan.tokenAddress },
    });
  }
  if (scan.riskScore >= 72) {
    pushAlert({
      severity: "warning",
      category: "risk_warning",
      title: "Elevated risk score",
      detail: `${scan.symbol}: heuristic risk ${scan.riskScore}/100 — verify contract manually.`,
      related: { scanId: scan.id, tokenAddress: scan.tokenAddress },
    });
  }

  sendJson(res, 200, scan);
}

function handleCryptoScanGet(pathname, res) {
  const id = pathname.replace(/^\/api\/v1\/crypto\/scans\//, "").split("/")[0];
  if (!id) {
    sendJson(res, 400, { error: "Scan id required." });
    return;
  }
  const scan = getScan(id);
  if (!scan) {
    sendJson(res, 404, { error: "Scan not found." });
    return;
  }
  sendJson(res, 200, scan);
}

function handleCryptoSignals(requestUrl, res) {
  const chain = requestUrl.searchParams.get("chain") || "ethereum";
  const disc = discoveryFeed(chain, 8);
  const signals = disc.tokens.slice(0, 6).map((t, i) => ({
    id: `sig-${t.tokenAddress.slice(2, 10)}-${i}`,
    type: t.momentum.txCountSpikeVsBaseline > 65 ? "volume_momentum" : "new_liquidity",
    asset: t.symbol,
    chain: t.chain,
    tokenAddress: t.tokenAddress,
    strength: Math.min(1, t.alphaSignalStrength / 100),
    note: `Demo narrative keywords: ${t.social.trendingKeywords.join(", ")} — not investment advice.`,
    probabilityNote: "Strength is a normalized demo score, not a calibrated win probability.",
  }));

  sendJson(res, 200, {
    windows: ["1h", "4h", "24h", "7d"],
    chain,
    signals,
    earlyDiscoveryPreview: disc.tokens.slice(0, 3),
    updatedAt: new Date().toISOString(),
    disclaimer: "Signals are heuristic and may include false positives.",
  });
}

function handleCryptoScansList(requestUrl, res) {
  const limit = Math.min(100, Math.max(1, parseInt(requestUrl.searchParams.get("limit") || "20", 10) || 20));
  const items = listRecent(limit);
  sendJson(res, 200, { count: items.length, scans: items });
}

/** POST /scan-wallet */
async function handleScanWallet(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }
  const chain = (body.chain || "ethereum").toString().trim();
  const wallet =
    (body.walletAddress || body.address || body.wallet || "").toString().trim();
  if (!wallet || wallet.length < 8) {
    sendJson(res, 400, { error: "walletAddress is required." });
    return;
  }
  const report = synthesizeWalletRiskScan(chain, wallet);

  if (report.walletRiskScore >= 70) {
    pushAlert({
      severity: "warning",
      category: "wallet_risk",
      title: "Wallet risk elevated",
      detail: `Address ${wallet.slice(0, 8)}… scored ${report.walletRiskScore}/100 in demo model.`,
      related: { chain, walletAddress: wallet },
    });
  }

  if (isTracked(chain, wallet)) {
    pushAlert({
      severity: "info",
      category: "tracked_wallet_activity",
      title: "Tracked wallet re-scan",
      detail: `Updated risk snapshot for watched wallet.`,
      related: { chain, walletAddress: wallet },
    });
  }

  sendJson(res, 200, report);
}

/** GET /discover-tokens */
function handleDiscoverTokens(requestUrl, res) {
  const chain = requestUrl.searchParams.get("chain") || "ethereum";
  const limit = Math.min(50, Math.max(1, parseInt(requestUrl.searchParams.get("limit") || "15", 10) || 15));
  const feed = discoveryFeed(chain, limit);
  sendJson(res, 200, {
    ...feed,
    disclosure: feed.tokens[0]?.disclaimer || "",
    methodology:
      "Ranking blends synthetic liquidity age, momentum, and social velocity proxies — not a buy recommendation.",
  });
}

/** POST /track-wallet */
async function handleTrackWallet(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }
  const chain = (body.chain || "ethereum").toString().trim();
  const wallet = (body.walletAddress || body.address || "").toString().trim();
  if (!wallet || wallet.length < 8) {
    sendJson(res, 400, { error: "walletAddress is required." });
    return;
  }
  const rec = addTrackedWallet(chain, wallet, body.label);
  pushAlert({
    severity: "info",
    category: "watchlist",
    title: "Wallet added to CCWEB watchlist",
    detail: `${rec.walletAddress.slice(0, 10)}… on ${chain}`,
    related: { id: rec.id },
  });
  sendJson(res, 201, { tracked: rec, watchlistSize: listTracked().length });
}

/** DELETE — query params or JSON body (POST fallback for browsers) */
async function handleUntrackWallet(req, res, requestUrl) {
  let body = {};
  try {
    body = await readJsonBody(req);
  } catch {
    body = {};
  }
  const chain = (requestUrl.searchParams.get("chain") || body.chain || "ethereum").toString().trim();
  const wallet = (
    requestUrl.searchParams.get("walletAddress") ||
    requestUrl.searchParams.get("address") ||
    body.walletAddress ||
    body.address ||
    ""
  )
    .toString()
    .trim();
  if (!wallet || wallet.length < 8) {
    sendJson(res, 400, { error: "walletAddress required (query or JSON body)." });
    return;
  }
  const removed = removeTrackedWallet(chain, wallet);
  sendJson(res, 200, { ok: true, removed });
}

function handleListTracked(res) {
  sendJson(res, 200, { count: listTracked().length, wallets: listTracked() });
}

function handleAlerts(requestUrl, res) {
  const limit = Math.min(100, Math.max(1, parseInt(requestUrl.searchParams.get("limit") || "30", 10) || 30));
  sendJson(res, 200, {
    count: listAlerts(limit).length,
    alerts: listAlerts(limit),
    disclaimer: "Alerts reflect demo heuristics — enable push notifications only after real data wiring.",
  });
}

function handleExamples(res) {
  sendJson(res, 200, exampleDataset());
}

module.exports = {
  handleCryptoScan,
  handleCryptoScanGet,
  handleCryptoSignals,
  handleCryptoScansList,
  handleScanWallet,
  handleDiscoverTokens,
  handleTrackWallet,
  handleUntrackWallet,
  handleListTracked,
  handleAlerts,
  handleExamples,
  listRecent,
};
