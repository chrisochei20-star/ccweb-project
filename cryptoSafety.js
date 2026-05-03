/**
 * CCWEB Crypto Safety Scanner + Alpha Discovery Engine
 * Deterministic demo/simulation layer — not live chain oracles.
 * All scores are heuristic signals, not guarantees.
 */

const crypto = require("crypto");

const DISCLAIMER =
  "Signals are informational heuristics based on simulated or sample data. Crypto is volatile; past patterns do not predict future outcomes. This is not financial advice.";

const SAMPLE_SCANS = [
  {
    token: "ETH",
    name: "Ethereum",
    network: "ethereum",
    contractAddress: "0x0000000000000000000000000000000000000000",
    contractVerified: true,
    liquidityLocked: true,
    ownershipRenounced: true,
    mintBurnPresent: false,
    hiddenTaxEstimate: 0,
    honeypotRisk: "none",
    rugPullRisk: "very_low",
    score: 97,
    flags: [],
  },
  {
    token: "BTC",
    name: "Bitcoin",
    network: "bitcoin",
    contractAddress: null,
    contractVerified: true,
    liquidityLocked: true,
    ownershipRenounced: true,
    mintBurnPresent: false,
    hiddenTaxEstimate: 0,
    honeypotRisk: "none",
    rugPullRisk: "very_low",
    score: 99,
    flags: [],
  },
  {
    token: "SHIB",
    name: "Shiba Inu",
    network: "ethereum",
    contractAddress: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
    contractVerified: true,
    liquidityLocked: true,
    ownershipRenounced: false,
    mintBurnPresent: false,
    hiddenTaxEstimate: 0,
    honeypotRisk: "low",
    rugPullRisk: "low",
    score: 72,
    flags: ["high_supply_concentration", "meme_token"],
  },
  {
    token: "UNKNOWN",
    name: "ScamCoin",
    network: "ethereum",
    contractAddress: "0xdead000000000000000000000000000000000001",
    contractVerified: false,
    liquidityLocked: false,
    ownershipRenounced: false,
    mintBurnPresent: true,
    hiddenTaxEstimate: 18,
    honeypotRisk: "high",
    rugPullRisk: "critical",
    score: 12,
    flags: [
      "unverified_contract",
      "no_liquidity_lock",
      "ownership_not_renounced",
      "honeypot_detected",
      "no_audit",
    ],
  },
];

const SAMPLE_DISCOVER = [
  {
    id: "disc-eth-l2-1",
    symbol: "ZKPR",
    name: "ZK Proof Rail",
    network: "base",
    contractAddress: "0x4a2f8c1e9b3d5a7e6c0f1d2e3a4b5c6d7e8f9a0b",
    deployedHoursAgo: 18,
    liquidityUsd: 420000,
    holderCount: 890,
    txCount24h: 12400,
    volumeUsd24h: 2100000,
    narrativeKeywords: ["zk", "rollup", "infra"],
    signalStrength: 78,
    dataSourceNote: "Simulated indexer + DEX pool metadata",
  },
  {
    id: "disc-depin-2",
    symbol: "NODE7",
    name: "Node7 Mesh",
    network: "arbitrum",
    contractAddress: "0x7b3c9d1e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c",
    deployedHoursAgo: 42,
    liquidityUsd: 180000,
    holderCount: 412,
    txCount24h: 5600,
    volumeUsd24h: 890000,
    narrativeKeywords: ["depin", "hardware", "iot"],
    signalStrength: 71,
    dataSourceNote: "Simulated deployment watcher",
  },
  {
    id: "disc-meme-3",
    symbol: "FROG2",
    name: "Frogwave",
    network: "solana",
    contractAddress: "Frog2SoLaNaNaNaNaNaNaNaNaNaNaNaNaNaNaNa",
    deployedHoursAgo: 6,
    liquidityUsd: 95000,
    holderCount: 2100,
    txCount24h: 89000,
    volumeUsd24h: 4200000,
    narrativeKeywords: ["meme", "community", "viral"],
    signalStrength: 64,
    dataSourceNote: "High velocity — often high noise; exercise caution",
  },
];

const SAMPLE_WALLET_INTEL = {
  "0x28c6c06298d538db24363dfa3a7bee9368290a4f": {
    label: "Jump Trading (sample)",
    scamLinked: false,
    clusterId: "cluster-mm-1",
    coordinatedActivityScore: 22,
    profitableHistoryScore: 88,
    suspiciousPatternScore: 15,
  },
  "0xdead000000000000000000000000000000000001": {
    label: "Flagged mixer path (sample)",
    scamLinked: true,
    clusterId: "cluster-risk-9",
    coordinatedActivityScore: 81,
    profitableHistoryScore: 12,
    suspiciousPatternScore: 94,
  },
};

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

function hashSeed(s) {
  const h = crypto.createHash("md5").update(String(s)).digest("hex");
  return parseInt(h.slice(0, 8), 16);
}

function riskBand(score) {
  if (score >= 70) return "safe";
  if (score >= 40) return "medium";
  return "high";
}

function opportunityFromBase(baseRiskScore, momentum, socialBuzz, smartMoneyOverlap) {
  const inv = 100 - baseRiskScore;
  const raw = inv * 0.45 + momentum * 0.25 + socialBuzz * 0.15 + smartMoneyOverlap * 0.15;
  return clamp(Math.round(raw), 0, 100);
}

function riskRewardLabel(riskScore, oppScore) {
  const ratio = oppScore / Math.max(1, 100 - riskScore);
  if (ratio < 0.6) return "skewed_risk";
  if (ratio < 1.1) return "balanced";
  return "favorable_on_signal_only";
}

function buildRugSignals(flags, rugPullRisk) {
  const patterns = [];
  if (!flags.includes("no_liquidity_lock") && rugPullRisk !== "critical") {
    patterns.push({ type: "liquidity_stable", confidence: 0.62, note: "No recent large LP removals in simulated window." });
  }
  if (flags.includes("no_liquidity_lock") || rugPullRisk === "critical" || rugPullRisk === "high") {
    patterns.push({ type: "liquidity_withdrawal_risk", confidence: 0.71, note: "LP unlock or removal patterns elevated vs baseline." });
  }
  if (flags.includes("high_supply_concentration")) {
    patterns.push({ type: "wallet_concentration", confidence: 0.58, note: "Top holders control outsized share of supply." });
  }
  if (flags.includes("honeypot_detected") || flags.includes("unverified_contract")) {
    patterns.push({ type: "suspicious_contract_logic", confidence: 0.55, note: "Unverified bytecode or sell restrictions suspected." });
  }
  return patterns;
}

function buildTokenFlow(seed) {
  const sources = [
    { type: "cex_inflow", label: "Centralized exchange", share: 0.22 + (seed % 15) / 100 },
    { type: "dex_router", label: "DEX aggregator", share: 0.35 + (seed % 10) / 100 },
    { type: "smart_wallet", label: "Tagged smart wallets", share: 0.12 + (seed % 8) / 100 },
  ];
  const sinks = [
    { type: "staking", label: "Staking contracts", share: 0.18 + (seed % 12) / 100 },
    { type: "cold_storage", label: "Cold / long-hold wallets", share: 0.28 + (seed % 10) / 100 },
    { type: "dex_lp", label: "Liquidity pools", share: 0.25 + (seed % 9) / 100 },
  ];
  return { sources, sinks, note: "Flow shares are illustrative aggregates, not wallet-level truth." };
}

function buildAiInsights(ctx) {
  const { name, flags, riskBand: band, oppScore, whaleAccumProb, socialSpike } = ctx;
  const insights = [];
  if (socialSpike > 0.65) {
    insights.push({
      id: "ins-1",
      text: `Social and narrative velocity for ${name} is elevated versus its 30-day baseline (simulated).`,
      confidence: 0.58,
    });
  }
  if (whaleAccumProb > 0.55) {
    insights.push({
      id: "ins-2",
      text: "Large-wallet net accumulation probability is above median — not proof of future price movement.",
      confidence: 0.52,
    });
  }
  if (band === "high") {
    insights.push({
      id: "ins-3",
      text: "Structural risk factors (ownership, liquidity, or contract verification) dominate the profile.",
      confidence: 0.66,
    });
  }
  if (flags.includes("meme_token")) {
    insights.push({
      id: "ins-4",
      text: "Meme-sector tokens often exhibit extreme volatility; treat momentum signals as high-noise.",
      confidence: 0.61,
    });
  }
  if (!insights.length) {
    insights.push({
      id: "ins-default",
      text: "No extreme narrative or whale divergence detected in the simulated snapshot.",
      confidence: 0.45,
    });
  }
  return {
    insights,
    opportunityScore: oppScore,
    riskVsReward: riskRewardLabel(ctx.riskScore, oppScore),
    disclaimer: DISCLAIMER,
  };
}

function synthesizeTokenScan(base) {
  const seed = hashSeed(base.token + (base.contractAddress || ""));
  const momentum = clamp(35 + (seed % 50) + (base.flags.includes("meme_token") ? 12 : 0), 0, 100);
  const socialBuzz = clamp(30 + ((seed >> 3) % 55), 0, 100);
  const smartMoneyOverlap = clamp(25 + ((seed >> 5) % 40), 0, 100);
  const whaleAccumProb = clamp(0.35 + (seed % 40) / 100, 0, 1);
  const socialSpike = clamp(0.3 + ((seed >> 7) % 50) / 100, 0, 1);

  const riskScore = base.score;
  const band = riskBand(riskScore);
  const oppScore = opportunityFromBase(riskScore, momentum, socialBuzz, smartMoneyOverlap);

  const security = {
    contractVerified: base.contractVerified,
    liquidityLocked: base.liquidityLocked,
    ownershipStatus: base.ownershipRenounced ? "renounced_or_burned" : "centralized_or_unknown",
    mintBurnFunctions: base.mintBurnPresent ? "present" : "none_detected",
    hiddenTaxEstimatePercent: base.hiddenTaxEstimate,
    riskScore,
    riskBand: band,
    rugPullSignals: buildRugSignals(base.flags, base.rugPullRisk),
  };

  const onChain = {
    smartMoney: {
      walletsBuyingEarly: Math.floor(3 + (seed % 8)),
      note: "Early-buy overlap is a weak signal; many profitable wallets also take quick losses.",
    },
    whaleActivity: {
      largeBuys24h: Math.floor(seed % 120),
      largeSells24h: Math.floor((seed >> 2) % 80),
      suddenAccumulationProbability: Number(whaleAccumProb.toFixed(2)),
    },
    walletClustering: {
      relatedWalletGroups: Math.floor(2 + (seed % 6)),
      coordinatedActivityScore: clamp(15 + (seed % 40) + (band === "high" ? 25 : 0), 0, 100),
    },
    tokenFlow: buildTokenFlow(seed),
  };

  const discovery = {
    newContractProbability: clamp(0.2 + (seed % 50) / 100, 0, 1),
    earlyLiquidityScore: clamp(40 + (seed % 35), 0, 100),
    volumeMomentumScore: momentum,
    holderGrowthRate: `${(seed % 12) + 1}.${(seed % 9)}% / 24h (simulated)`,
    socialSignals: {
      twitterX: { mentionVelocity: socialBuzz, trendingKeywords: ["L2", "AI", "restaking"].slice(0, 2 + (seed % 2)) },
      telegram: { channelCountEstimate: 8 + (seed % 15), spikeProbability: Number((0.4 + (seed % 30) / 100).toFixed(2)) },
      reddit: { postVelocity: clamp(socialBuzz - 10, 0, 100), subreddits: ["cryptocurrency", "ethfinance"] },
    },
    influencerCorrelation: {
      trackedHandlesSample: ["@sample_analyst", "@sample_fund"],
      postToPriceCorrelation: Number((0.15 + (seed % 25) / 100).toFixed(2)),
      note: "Correlation ≠ causation; posts can lag or lead price for unrelated reasons.",
    },
  };

  const ai = buildAiInsights({
    name: base.name,
    flags: base.flags,
    riskBand: band,
    oppScore,
    whaleAccumProb,
    socialSpike,
    riskScore,
  });

  return {
    ...base,
    modules: { security, onChainIntelligence: onChain, earlyDiscovery: discovery, aiInsightEngine: ai },
    alertsPreview: [
      { type: "risk", severity: band === "high" ? "high" : "low", message: band === "high" ? "Elevated structural risk in current model snapshot." : "No critical alerts in snapshot." },
      { type: "whale", severity: whaleAccumProb > 0.55 ? "medium" : "low", message: "Whale flow probability updated (simulated)." },
    ],
    methodology: {
      riskScoreFormula: "riskScore = weighted(contract, liquidity, ownership, mint/tax, honeypot, rug heuristics); clamped 0–100.",
      opportunityScoreFormula: "opportunityScore blends inverse risk, momentum, social buzz, smart-money overlap — all simulated.",
      notGuarantee: true,
    },
    scannedAt: new Date().toISOString(),
    disclaimer: DISCLAIMER,
  };
}

function buildTokenScanFromQuery(token, address) {
  const t = (token || "").toUpperCase().trim();
  const addr = (address || "").trim().toLowerCase();

  let base = SAMPLE_SCANS.find((s) => s.token === t);
  if (!base && addr) {
    base = SAMPLE_SCANS.find((s) => s.contractAddress && s.contractAddress.toLowerCase() === addr);
  }

  if (!base) {
    const hash = hashSeed(t || addr);
    const score = 20 + (hash % 60);
    const isRisky = score < 50;
    base = {
      token: t || "CUSTOM",
      name: t || `Contract ${addr.slice(0, 10)}…`,
      network: "ethereum",
      contractAddress: addr && addr.startsWith("0x") ? addr : `0x${crypto.createHash("sha256").update(t || addr).digest("hex").slice(0, 40)}`,
      contractVerified: !isRisky,
      liquidityLocked: score > 40,
      ownershipRenounced: score > 60,
      mintBurnPresent: score < 45,
      hiddenTaxEstimate: score < 50 ? 5 + (hash % 12) : 0,
      honeypotRisk: isRisky ? "medium" : "low",
      rugPullRisk: score < 30 ? "high" : score < 50 ? "medium" : "low",
      score,
      flags: isRisky ? ["low_liquidity", "concentrated_holders"] : [],
    };
  }

  return synthesizeTokenScan(base);
}

function normalizeWalletAddress(addr) {
  const a = String(addr || "").trim();
  if (!a.startsWith("0x") || a.length < 10) return null;
  return a.toLowerCase();
}

function buildWalletScan(address) {
  const norm = normalizeWalletAddress(address);
  if (!norm) {
    return { error: "Invalid wallet address. Provide a 0x-prefixed EVM address." };
  }

  const seed = hashSeed(norm);
  const preset = SAMPLE_WALLET_INTEL[norm] || {
    label: "Unlabeled wallet",
    scamLinked: seed % 17 === 0,
    clusterId: `cluster-${(seed % 40).toString(16)}`,
    coordinatedActivityScore: 20 + (seed % 50),
    profitableHistoryScore: 30 + (seed % 55),
    suspiciousPatternScore: 10 + (seed % 45),
  };

  const riskScore = clamp(
    (preset.scamLinked ? 55 : 10) + preset.suspiciousPatternScore * 0.35 + preset.coordinatedActivityScore * 0.25,
    0,
    100
  );

  const danger = Math.round(riskScore);

  return {
    address: norm,
    label: preset.label,
    scamLinkedProbability: preset.scamLinked ? 0.82 : Number((0.05 + (seed % 20) / 100).toFixed(2)),
    suspiciousPatterns: [
      { type: "rapid_dust_roundtrip", probability: Number((0.08 + (seed % 15) / 100).toFixed(2)) },
      { type: "mixer_adjacent_hop", probability: preset.scamLinked ? 0.77 : Number((0.04 + (seed % 10) / 100).toFixed(2)) },
      { type: "contract_deploy_burst", probability: Number((0.12 + (seed % 20) / 100).toFixed(2)) },
    ],
    cluster: { id: preset.clusterId, relatedWalletsEstimate: 4 + (seed % 20) },
    walletRiskScore: danger,
    safetyTier: riskBand(100 - danger),
    profitableHistoryScore: preset.profitableHistoryScore,
    coordinatedActivityScore: preset.coordinatedActivityScore,
    scannedAt: new Date().toISOString(),
    disclaimer: DISCLAIMER,
  };
}

function discoverTokens(query) {
  const chain = (query.chain || "").toLowerCase();
  const minSignal = query.minSignalStrength != null ? Number(query.minSignalStrength) : 0;
  let list = SAMPLE_DISCOVER.map((d) => ({
    ...d,
    earlySignalProbability: Number((d.signalStrength / 100).toFixed(2)),
  }));
  if (chain) list = list.filter((d) => d.network === chain);
  if (Number.isFinite(minSignal)) list = list.filter((d) => d.signalStrength >= minSignal);
  return {
    count: list.length,
    tokens: list,
    updatedAt: new Date().toISOString(),
    disclaimer: DISCLAIMER,
  };
}

async function trackWallet(address, action, body) {
  const norm = normalizeWalletAddress(address);
  if (!norm) {
    return { error: "Invalid wallet address." };
  }
  const watchlist = body && Array.isArray(body.watchlist) ? body.watchlist : [];
  const alertsEnabled = !!(body && body.alertsEnabled);
  let persistence = { persisted: false, reason: "not_attempted" };
  try {
    const intelligenceDb = require("./intelligenceDb");
    if ((action || "register") === "register" || action === "add") {
      persistence = await intelligenceDb.addTrackedWallet(
        norm,
        (body && body.label) || "Tracked wallet",
        alertsEnabled
      );
    } else if (action === "remove" || action === "unregister") {
      const r = await intelligenceDb.removeTrackedWallet(norm);
      persistence = { persisted: r.removed, reason: r.removed ? "removed" : "not_found" };
    }
  } catch (e) {
    persistence = { persisted: false, reason: e.message };
  }
  return {
    address: norm,
    action: action || "status",
    tracking: true,
    alertsEnabled,
    watchlistCount: watchlist.length,
    lastSyncedAt: new Date().toISOString(),
    note: persistence.persisted
      ? "Wallet saved to MongoDB (when MONGODB_URI is set)."
      : process.env.MONGODB_URI
        ? "MongoDB configured but persistence step did not confirm."
        : "MONGODB_URI not set — tracking is session-only until you configure MongoDB.",
    persistence,
    disclaimer: DISCLAIMER,
  };
}

function getIntelligenceFeed() {
  const now = Date.now();
  const signals = [
    {
      id: "sig-001",
      type: "narrative_shift",
      title: "AI x DePIN convergence",
      description:
        "Multiple DePIN protocols integrating AI inference layers. Sector capital inflows up 340% this week.",
      confidence: 89,
      timestamp: new Date(now - 3600000).toISOString(),
      tokens: ["RNDR", "FET", "OCEAN"],
      category: "ai_depin",
    },
    {
      id: "sig-002",
      type: "whale_accumulation",
      title: "Smart money loading RWA tokens",
      description:
        "Top 50 wallets accumulated $42M in RWA tokens over 48h. Tokenized treasuries sector heating up.",
      confidence: 82,
      timestamp: new Date(now - 7200000).toISOString(),
      tokens: ["ONDO", "MKR", "COMP"],
      category: "rwa",
    },
    {
      id: "sig-003",
      type: "on_chain_anomaly",
      title: "Layer 2 TVL surge on Base",
      description: "Base chain TVL grew 28% in 7 days. New DEX deployments indicate growing DeFi ecosystem.",
      confidence: 76,
      timestamp: new Date(now - 14400000).toISOString(),
      tokens: ["BASE", "AERO"],
      category: "layer2",
    },
    {
      id: "sig-004",
      type: "social_momentum",
      title: "Solana DeFi narrative gaining steam",
      description: "Social mentions of Solana DeFi up 520%. Jupiter and Raydium hitting ATH volumes.",
      confidence: 71,
      timestamp: new Date(now - 21600000).toISOString(),
      tokens: ["JUP", "RAY", "SOL"],
      category: "defi",
    },
    {
      id: "sig-005",
      type: "funding_round",
      title: "Modular blockchain raises $60M",
      description: "Celestia ecosystem project closes Series B. Modular thesis gaining institutional backing.",
      confidence: 85,
      timestamp: new Date(now - 43200000).toISOString(),
      tokens: ["TIA", "MANTA"],
      category: "infrastructure",
    },
    {
      id: "sig-006",
      type: "regulatory_catalyst",
      title: "ETH ETF options approval expected",
      description: "SEC anticipated to approve ETH ETF options within 30 days. Institutional demand signal.",
      confidence: 78,
      timestamp: new Date(now - 86400000).toISOString(),
      tokens: ["ETH", "LDO", "RPL"],
      category: "regulatory",
    },
  ];

  const wallets = [
    {
      address: "0x28C6…9a4F",
      label: "Jump Trading",
      totalValueUsd: 847000000,
      recentMoves: [
        { action: "buy", token: "ETH", amountUsd: 12500000, timestamp: new Date(now - 1800000).toISOString() },
        { action: "buy", token: "SOL", amountUsd: 4200000, timestamp: new Date(now - 5400000).toISOString() },
      ],
      winRate: 84,
      avgReturn: 32,
    },
    {
      address: "0x7a3B…e21D",
      label: "Paradigm Fund",
      totalValueUsd: 2100000000,
      recentMoves: [
        { action: "buy", token: "ONDO", amountUsd: 8000000, timestamp: new Date(now - 3600000).toISOString() },
        { action: "sell", token: "DYDX", amountUsd: 3100000, timestamp: new Date(now - 7200000).toISOString() },
      ],
      winRate: 79,
      avgReturn: 45,
    },
    {
      address: "0xF92a…b8C1",
      label: "Wintermute",
      totalValueUsd: 560000000,
      recentMoves: [{ action: "buy", token: "ARB", amountUsd: 6700000, timestamp: new Date(now - 2700000).toISOString() }],
      winRate: 76,
      avgReturn: 28,
    },
    {
      address: "0x3eD9…44aF",
      label: "a16z Crypto",
      totalValueUsd: 4500000000,
      recentMoves: [
        { action: "buy", token: "UNI", amountUsd: 15000000, timestamp: new Date(now - 10800000).toISOString() },
        { action: "buy", token: "MKR", amountUsd: 9200000, timestamp: new Date(now - 14400000).toISOString() },
      ],
      winRate: 88,
      avgReturn: 56,
    },
    {
      address: "0xC4b2…7f3E",
      label: "Nansen Smart Money",
      totalValueUsd: 320000000,
      recentMoves: [{ action: "buy", token: "FET", amountUsd: 2100000, timestamp: new Date(now - 900000).toISOString() }],
      winRate: 72,
      avgReturn: 24,
    },
  ];

  const trends = [
    { token: "ETH", netFlow: 42000000, direction: "accumulation", whaleCount: 12 },
    { token: "SOL", netFlow: 18000000, direction: "accumulation", whaleCount: 8 },
    { token: "ONDO", netFlow: 11000000, direction: "accumulation", whaleCount: 5 },
    { token: "ARB", netFlow: -3500000, direction: "distribution", whaleCount: 3 },
  ];

  return { signals, smartMoney: { wallets, trends }, updatedAt: new Date().toISOString(), disclaimer: DISCLAIMER };
}

function getAlertsSnapshot() {
  const feed = getIntelligenceFeed();
  const alerts = [
    {
      id: "al-1",
      type: "new_token",
      severity: "info",
      title: "New deployment: ZKPR (Base)",
      probabilityNote: "Early liquidity detected — false positives common.",
      at: new Date(Date.now() - 600000).toISOString(),
    },
    {
      id: "al-2",
      type: "whale_buy",
      severity: "medium",
      title: "Large ETH inflow to smart-tagged wallets",
      probabilityNote: "Could be internal treasury moves.",
      at: new Date(Date.now() - 1200000).toISOString(),
    },
    {
      id: "al-3",
      type: "trend_spike",
      severity: "low",
      title: "Narrative spike: modular infra",
      probabilityNote: "Social velocity up; verify with primary sources.",
      at: new Date(Date.now() - 2400000).toISOString(),
    },
    {
      id: "al-4",
      type: "risk_warning",
      severity: "high",
      title: "High concentration in sample meme basket",
      probabilityNote: "Liquidity and ownership checks recommended.",
      at: new Date(Date.now() - 3600000).toISOString(),
    },
  ];
  return { alerts, feedSummary: { signalCount: feed.signals.length, walletCount: feed.smartMoney.wallets.length }, disclaimer: DISCLAIMER };
}

module.exports = {
  DISCLAIMER,
  SAMPLE_SCANS,
  buildTokenScanFromQuery,
  buildWalletScan,
  discoverTokens,
  trackWallet,
  getIntelligenceFeed,
  getAlertsSnapshot,
};
