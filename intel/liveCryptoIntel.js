/**
 * Live crypto intelligence — DexScreener (liquidity/pairs) + Etherscan (contract verification, txs).
 * No synthetic token rows; missing inputs return explicit errors.
 */

const { cacheGetJson, cacheSetJson, cacheKey } = require("../services/redisCache");

const DISCLAIMER =
  "Signals use third-party APIs (DexScreener; Etherscan for EVM contract verification). Data may be incomplete or delayed. Crypto is volatile; this is not financial advice.";

function isEvmAddress(a) {
  const s = String(a || "").trim();
  return /^0x[a-fA-F0-9]{40}$/.test(s);
}

function isSolMint(a) {
  const s = String(a || "").trim();
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s);
}

async function fetchJson(url, opts = {}) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), opts.timeoutMs || 15000);
  try {
    const res = await fetch(url, { signal: ac.signal, headers: opts.headers || {} });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.description || data.message || res.statusText);
    return data;
  } finally {
    clearTimeout(t);
  }
}

async function dexPairsForToken(address) {
  const ck = cacheKey("dex", ["pairs", address.toLowerCase()]);
  const hit = await cacheGetJson(ck);
  if (hit) return hit;
  const url = `https://api.dexscreener.com/latest/dex/tokens/${address}`;
  const data = await fetchJson(url);
  await cacheSetJson(ck, data, 45);
  return data;
}

async function etherscanContract(address) {
  const key = (process.env.ETHERSCAN_API_KEY || "").trim();
  if (!key) return null;
  const ck = cacheKey("esc", ["contract", address.toLowerCase()]);
  const hit = await cacheGetJson(ck);
  if (hit) return hit;
  const base = process.env.ETHERSCAN_API_URL || "https://api.etherscan.io/api";
  const url = `${base}?module=contract&action=getsourcecode&address=${address}&apikey=${key}`;
  const data = await fetchJson(url);
  await cacheSetJson(ck, data, 3600);
  return data;
}

async function etherscanTxCount(address) {
  const key = (process.env.ETHERSCAN_API_KEY || "").trim();
  if (!key) return null;
  const base = process.env.ETHERSCAN_API_URL || "https://api.etherscan.io/api";
  const url = `${base}?module=proxy&action=eth_getTransactionCount&address=${address}&tag=latest&apikey=${key}`;
  try {
    const data = await fetchJson(url);
    const hex = data.result;
    if (typeof hex === "string" && hex.startsWith("0x")) return parseInt(hex, 16);
  } catch {
    /* ignore */
  }
  return null;
}

function deriveRiskFromDex(pair, verified) {
  const liq = Number(pair?.liquidity?.usd || 0);
  let score = 55;
  const flags = [];
  if (!verified) {
    flags.push("unverified_contract");
    score -= 25;
  }
  if (liq < 50_000) {
    flags.push("low_liquidity");
    score -= 15;
  }
  if (liq < 10_000) {
    score -= 15;
    flags.push("very_low_liquidity");
  }
  score = Math.max(5, Math.min(95, score));
  let rugPullRisk = "medium";
  if (score >= 70) rugPullRisk = "low";
  if (score < 35) rugPullRisk = "high";
  if (score < 20) rugPullRisk = "critical";
  return { score, flags, rugPullRisk };
}

async function buildSolanaTokenScan(sym, mint) {
  const dex = await dexPairsForToken(mint);
  const pairs = dex.pairs || [];
  const best =
    pairs.reduce((a, b) => (Number(a?.liquidity?.usd || 0) >= Number(b?.liquidity?.usd || 0) ? a : b), pairs[0]) ||
    null;

  if (!best && pairs.length === 0) {
    const err = new Error("No DexScreener liquidity pairs found for this mint.");
    err.status = 404;
    throw err;
  }

  const verified = false;
  const { score, flags, rugPullRisk } = deriveRiskFromDex(best, verified);

  const liquidityUsd = Number(best?.liquidity?.usd || 0);
  const volume24 = Number(best?.volume?.h24 || 0);
  const priceUsd = Number(best?.priceUsd || 0);
  const fdv = Number(best?.fdv || 0);

  const security = {
    contractVerified: verified,
    liquidityLocked: liquidityUsd >= 100_000,
    ownershipStatus: "unknown",
    mintBurnFunctions: "unknown",
    hiddenTaxEstimatePercent: 0,
    riskScore: score,
    riskBand: score >= 70 ? "safe" : score >= 40 ? "medium" : "high",
    rugPullSignals: [
      {
        type: "solana_mint",
        confidence: 0.65,
        note: "Solana token verification uses DexScreener market depth only; use Solscan + RugCheck for bytecode.",
      },
      {
        type: "liquidity_depth",
        confidence: 0.7,
        note: `Aggregate DEX liquidity ~ $${Math.round(liquidityUsd).toLocaleString()} (DexScreener).`,
      },
    ],
  };

  const discovery = {
    newContractProbability: 0,
    earlyLiquidityScore: Math.min(100, Math.round(Math.log10(Math.max(liquidityUsd, 1)) * 25)),
    volumeMomentumScore: Math.min(100, Math.round(Math.log10(Math.max(volume24, 1)) * 12)),
    holderGrowthRate: "n/a (configure Solana holder indexer)",
    socialSignals: {
      twitterX: { mentionVelocity: 0, trendingKeywords: [] },
      telegram: { channelCountEstimate: 0, spikeProbability: 0 },
      reddit: { postVelocity: 0, subreddits: [] },
    },
    influencerCorrelation: {
      trackedHandlesSample: [],
      postToPriceCorrelation: 0,
      note: "Social velocity requires X/Reddit API credentials.",
    },
  };

  const momentum = discovery.volumeMomentumScore;
  const oppScore = Math.min(100, Math.round((100 - score) * 0.45 + momentum * 0.35));

  const aiInsightEngine = {
    insights: [
      {
        id: "sol-1",
        text: `Solana pair snapshot: price ~ $${priceUsd || "—"}, 24h volume ~ $${Math.round(volume24).toLocaleString()}, liquidity ~ $${Math.round(liquidityUsd).toLocaleString()} (DexScreener).`,
        confidence: 0.72,
      },
      {
        id: "sol-2",
        text: "Review mint authority and liquidity on Solscan; DexScreener does not prove token safety.",
        confidence: 0.7,
      },
    ],
    opportunityScore: oppScore,
    riskVsReward: oppScore / Math.max(1, 100 - score) < 0.8 ? "skewed_risk" : "balanced",
    disclaimer: DISCLAIMER,
  };

  return {
    token: best?.baseToken?.symbol || sym || "?",
    name: best?.baseToken?.name || `Token ${mint.slice(0, 8)}…`,
    network: best?.chainId === "solana" ? "solana" : String(best?.chainId || "solana"),
    contractAddress: mint,
    contractVerified: verified,
    liquidityLocked: security.liquidityLocked,
    ownershipRenounced: false,
    mintBurnPresent: false,
    hiddenTaxEstimate: 0,
    honeypotRisk: score < 30 ? "high" : score < 55 ? "medium" : "low",
    rugPullRisk,
    score,
    flags,
    modules: {
      security,
      onChainIntelligence: {
        smartMoney: { walletsBuyingEarly: 0, note: "Indexer not configured." },
        whaleActivity: {
          largeBuys24h: 0,
          largeSells24h: 0,
          suddenAccumulationProbability: volume24 > 1e6 ? 0.35 : 0.15,
        },
        walletClustering: { relatedWalletGroups: 0, coordinatedActivityScore: 0 },
        tokenFlow: { sources: [], sinks: [], note: "Solana flow analytics require RPC indexer." },
      },
      earlyDiscovery: discovery,
      aiInsightEngine,
      market: {
        dexId: best?.dexId || null,
        pairAddress: best?.pairAddress || null,
        priceUsd,
        volumeUsd24h: volume24,
        liquidityUsd,
        fdv,
        url: best?.url || null,
        source: "dexscreener",
      },
    },
    alertsPreview: [],
    methodology: {
      riskScoreFormula: "riskScore from DexScreener liquidity depth (Solana — no Etherscan verification).",
      opportunityScoreFormula: "derived from inverse risk and reported 24h volume momentum.",
      notGuarantee: true,
    },
    scannedAt: new Date().toISOString(),
    disclaimer: DISCLAIMER,
    dataSources: ["dexscreener.com"],
  };
}

async function buildTokenScan(token, address) {
  const addr = (address || "").trim();
  const sym = (token || "").trim().toUpperCase();

  if (!addr && !sym) {
    const err = new Error("token or address is required.");
    err.status = 400;
    throw err;
  }

  if (isSolMint(addr)) {
    return buildSolanaTokenScan(sym, addr);
  }

  if (!isEvmAddress(addr)) {
    const err = new Error(
      "Live scan requires an EVM contract address (0x…) or a Solana mint. Symbol-only lookups are disabled."
    );
    err.status = 400;
    throw err;
  }

  const dex = await dexPairsForToken(addr);
  const pairs = dex.pairs || [];
  const best =
    pairs.reduce((a, b) => (Number(a?.liquidity?.usd || 0) >= Number(b?.liquidity?.usd || 0) ? a : b), pairs[0]) ||
    null;

  const esc = await etherscanContract(addr);
  let verified = false;
  let contractName = "";
  if (esc?.result?.[0]) {
    const row = esc.result[0];
    contractName = row.ContractName || "";
    verified = Boolean(row.SourceCode && String(row.SourceCode).trim() && row.SourceCode !== "{{");
  }

  const baseSymbol = best?.baseToken?.symbol || sym || "?";
  const baseName = best?.baseToken?.name || contractName || `Token ${addr.slice(0, 8)}`;

  const { score, flags, rugPullRisk } = deriveRiskFromDex(best, verified);

  const liquidityUsd = Number(best?.liquidity?.usd || 0);
  const volume24 = Number(best?.volume?.h24 || 0);
  const priceUsd = Number(best?.priceUsd || 0);
  const fdv = Number(best?.fdv || 0);

  const security = {
    contractVerified: verified,
    liquidityLocked: liquidityUsd >= 100_000,
    ownershipStatus: "unknown",
    mintBurnFunctions: "unknown",
    hiddenTaxEstimatePercent: 0,
    riskScore: score,
    riskBand: score >= 70 ? "safe" : score >= 40 ? "medium" : "high",
    rugPullSignals: [
      {
        type: verified ? "contract_verified" : "contract_not_verified",
        confidence: verified ? 0.85 : 0.75,
        note: verified
          ? "Source code is published on the explorer index."
          : "Source code not verified on Etherscan — higher ambiguity.",
      },
      {
        type: "liquidity_depth",
        confidence: 0.7,
        note: `Aggregate DEX liquidity ~ $${Math.round(liquidityUsd).toLocaleString()} (DexScreener).`,
      },
    ],
  };

  const onChain = {
    smartMoney: {
      walletsBuyingEarly: 0,
      note: "Smart-money overlap requires a dedicated indexer; not inferred here.",
    },
    whaleActivity: {
      largeBuys24h: 0,
      largeSells24h: 0,
      suddenAccumulationProbability: volume24 > 1e6 ? 0.35 : 0.15,
    },
    walletClustering: {
      relatedWalletGroups: 0,
      coordinatedActivityScore: 0,
    },
    tokenFlow: {
      sources: [],
      sinks: [],
      note: "Wallet-level flows require chain indexing.",
    },
  };

  const discovery = {
    newContractProbability: 0,
    earlyLiquidityScore: Math.min(100, Math.round(Math.log10(Math.max(liquidityUsd, 1)) * 25)),
    volumeMomentumScore: Math.min(100, Math.round(Math.log10(Math.max(volume24, 1)) * 12)),
    holderGrowthRate: "n/a (configure holder indexer)",
    socialSignals: {
      twitterX: { mentionVelocity: 0, trendingKeywords: [] },
      telegram: { channelCountEstimate: 0, spikeProbability: 0 },
      reddit: { postVelocity: 0, subreddits: [] },
    },
    influencerCorrelation: {
      trackedHandlesSample: [],
      postToPriceCorrelation: 0,
      note: "Social velocity requires X/Reddit API credentials.",
    },
  };

  const momentum = discovery.volumeMomentumScore;
  const socialBuzz = 0;
  const smartMoneyOverlap = 0;
  const inv = 100 - score;
  const oppScore = Math.min(
    100,
    Math.round(inv * 0.45 + momentum * 0.35 + socialBuzz * 0.1 + smartMoneyOverlap * 0.1)
  );

  const aiInsightEngine = {
    insights: [
      {
        id: "live-1",
        text: `Live market snapshot: price ~ $${priceUsd || "—"}, 24h volume ~ $${Math.round(volume24).toLocaleString()}, liquidity ~ $${Math.round(liquidityUsd).toLocaleString()} (DexScreener).`,
        confidence: 0.72,
      },
      {
        id: "live-2",
        text: verified
          ? "Contract source is verified on the configured explorer."
          : "Contract verification not found — exercise additional diligence.",
        confidence: 0.68,
      },
    ],
    opportunityScore: oppScore,
    riskVsReward: oppScore / Math.max(1, 100 - score) < 0.8 ? "skewed_risk" : "balanced",
    disclaimer: DISCLAIMER,
  };

  return {
    token: baseSymbol,
    name: baseName,
    network: best?.chainId ? `chain-${best.chainId}` : "ethereum",
    contractAddress: addr,
    contractVerified: verified,
    liquidityLocked: security.liquidityLocked,
    ownershipRenounced: false,
    mintBurnPresent: false,
    hiddenTaxEstimate: 0,
    honeypotRisk: score < 30 ? "high" : score < 55 ? "medium" : "low",
    rugPullRisk,
    score,
    flags,
    modules: {
      security,
      onChainIntelligence: onChain,
      earlyDiscovery: discovery,
      aiInsightEngine,
      market: {
        dexId: best?.dexId || null,
        pairAddress: best?.pairAddress || null,
        priceUsd,
        volumeUsd24h: volume24,
        liquidityUsd,
        fdv,
        url: best?.url || null,
        source: "dexscreener",
      },
    },
    alertsPreview: [],
    methodology: {
      riskScoreFormula: "riskScore from liquidity depth + EVM contract verification via DexScreener & Etherscan.",
      opportunityScoreFormula: "derived from inverse risk and reported 24h volume momentum.",
      notGuarantee: true,
    },
    scannedAt: new Date().toISOString(),
    disclaimer: DISCLAIMER,
    dataSources: ["dexscreener.com", esc ? "etherscan" : null].filter(Boolean),
  };
}

async function buildSolanaWalletScan(mint) {
  const dex = await dexPairsForToken(mint).catch(() => ({ pairs: [] }));
  const unusual = Array.isArray(dex.pairs) && dex.pairs.length > 0;
  const walletRiskScore = unusual ? Math.min(72, 48) : 40;

  return {
    address: mint,
    chain: "solana",
    label: unusual ? "Solana pool-associated address" : "Solana wallet / mint",
    scamLinkedProbability: null,
    suspiciousPatterns: unusual
      ? [{ type: "dex_pair_associated", probability: 0.35, note: "Appears in DexScreener pairs for this mint." }]
      : [],
    cluster: { id: `sol-${mint.slice(0, 12)}`, relatedWalletsEstimate: 0 },
    walletRiskScore,
    safetyTier: walletRiskScore < 45 ? "safe" : walletRiskScore < 65 ? "medium" : "high",
    profitableHistoryScore: null,
    coordinatedActivityScore: null,
    scannedAt: new Date().toISOString(),
    disclaimer: DISCLAIMER,
    txCountHint: null,
    dataSources: ["dexscreener"],
  };
}

async function buildWalletScan(address) {
  const raw = String(address || "").trim();
  const norm = raw.toLowerCase();

  if (isSolMint(raw)) {
    return buildSolanaWalletScan(raw);
  }

  if (!isEvmAddress(norm)) {
    return { error: "Invalid wallet address. Provide a 0x-prefixed EVM address or a Solana mint." };
  }

  if (!(process.env.ETHERSCAN_API_KEY || "").trim()) {
    const dex = await dexPairsForToken(norm).catch(() => ({ pairs: [] }));
    const unusual = Array.isArray(dex.pairs) && dex.pairs.length > 0;
    const walletRiskScore = unusual ? Math.min(72, 52) : 48;
    const suspiciousPatterns = unusual
      ? [{ type: "token_associated_wallet", probability: 0.35, note: "Address appears in DexScreener pair data (no Etherscan tx count)." }]
      : [];

    return {
      address: norm,
      chain: "evm",
      label: unusual ? "Tagged liquidity participant (partial)" : "Wallet (partial)",
      scamLinkedProbability: null,
      suspiciousPatterns,
      cluster: { id: `addr-${norm.slice(2, 10)}`, relatedWalletsEstimate: 0 },
      walletRiskScore,
      safetyTier: walletRiskScore < 45 ? "safe" : walletRiskScore < 65 ? "medium" : "high",
      profitableHistoryScore: null,
      coordinatedActivityScore: null,
      scannedAt: new Date().toISOString(),
      disclaimer: DISCLAIMER,
      txCountHint: null,
      dataSources: ["dexscreener"],
      degraded: true,
      degradationReason:
        "ETHERSCAN_API_KEY not set — transaction count and full EVM explorer checks unavailable. Configure for stronger wallet analysis.",
    };
  }

  const nonce = await etherscanTxCount(norm);
  const dex = await dexPairsForToken(norm).catch(() => ({ pairs: [] }));
  const unusual = Array.isArray(dex.pairs) && dex.pairs.length > 0;

  if (typeof nonce !== "number") {
    return { error: "Could not read on-chain transaction count from the explorer." };
  }

  const walletRiskScore = Math.min(100, Math.max(0, Math.round(55 - Math.log10(nonce + 1) * 12 + (unusual ? 8 : 0))));

  const suspiciousPatterns = unusual
    ? [{ type: "token_associated_wallet", probability: 0.4, note: "Address appears in DexScreener token pair data." }]
    : [];

  return {
    address: norm,
    chain: "evm",
    label: unusual ? "Tagged liquidity participant" : "Wallet",
    scamLinkedProbability: null,
    suspiciousPatterns,
    cluster: { id: `addr-${norm.slice(2, 10)}`, relatedWalletsEstimate: 0 },
    walletRiskScore,
    safetyTier: walletRiskScore < 40 ? "safe" : walletRiskScore < 65 ? "medium" : "high",
    profitableHistoryScore: null,
    coordinatedActivityScore: null,
    scannedAt: new Date().toISOString(),
    disclaimer: DISCLAIMER,
    txCountHint: nonce,
    dataSources: ["etherscan", "dexscreener"],
  };
}

function shortTokenAddr(addr) {
  const a = String(addr || "").trim();
  if (!a) return null;
  if (a.length <= 12) return a;
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function symbolFromBoostEntry(b) {
  if (b.symbol) return String(b.symbol).slice(0, 16);
  const desc = String(b.description || "").trim();
  const first = desc.split(/\s+/)[0];
  if (first && first.length <= 16 && /^[A-Za-z0-9$]+$/.test(first)) return first.toUpperCase();
  return shortTokenAddr(b.tokenAddress) || "Token";
}

function mapTokenBoostEntry(b, i) {
  const addr = b.tokenAddress || "";
  return {
    id: `boost-${addr || i}`,
    symbol: symbolFromBoostEntry(b),
    name: b.name || String(b.description || "").slice(0, 64) || shortTokenAddr(addr) || "Token",
    network: String(b.chainId || "unknown"),
    contractAddress: addr,
    deployedHoursAgo: null,
    liquidityUsd: Number(b.liquidityUsd || 0),
    holderCount: null,
    txCount24h: null,
    volumeUsd24h: Number(b.volumeUsd24h || 0),
    narrativeKeywords: [],
    signalStrength: Math.min(100, Math.round(Math.log10(Math.max(Number(b.volumeUsd24h || 1), 1)) * 22)),
    dataSourceNote: "DexScreener token boosts — verify contracts independently.",
    earlySignalProbability: null,
    pairUrl: b.url || null,
  };
}

function mapDexPairEntry(p, i) {
  const addr = p.baseToken?.address || p.token?.address || "";
  return {
    id: `pair-${p.pairAddress || p.pair?.pairAddress || i}`,
    symbol: p.baseToken?.symbol || p.token?.symbol || shortTokenAddr(addr) || "Token",
    name: p.baseToken?.name || p.token?.name || shortTokenAddr(addr) || "Token",
    network: String(p.chainId || p.pair?.chainId || "unknown"),
    contractAddress: addr,
    deployedHoursAgo: null,
    liquidityUsd: Number(p.liquidity?.usd || p.pair?.liquidity?.usd || 0),
    holderCount: null,
    txCount24h: null,
    volumeUsd24h: Number(p.volume?.h24 || p.pair?.volume?.h24 || 0),
    narrativeKeywords: [],
    signalStrength: Math.min(
      100,
      Math.round(Math.log10(Math.max(Number(p.volume?.h24 || p.pair?.volume?.h24 || 1), 1)) * 22)
    ),
    dataSourceNote: "DexScreener API — verify contracts independently.",
    earlySignalProbability: null,
    pairUrl: p.url || p.pair?.url || null,
  };
}

async function discoverTokens(query) {
  const chain = (query.chain || "").toLowerCase();
  const minSignal =
    query.minSignalStrength != null && query.minSignalStrength !== ""
      ? Number(query.minSignalStrength)
      : null;

  const ck = cacheKey("dexboost", [chain || "all"]);
  let hit = await cacheGetJson(ck);
  if (!hit) {
    try {
      hit = await fetchJson("https://api.dexscreener.com/token-boosts/latest/v1");
    } catch {
      hit = null;
    }
    if (!hit) {
      const q = chain || "ethereum";
      hit = await fetchJson(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(q)}`);
    }
    await cacheSetJson(ck, hit, 45);
  }

  const isBoostFeed = Array.isArray(hit) && hit.length > 0 && hit[0]?.tokenAddress && !hit[0]?.baseToken;

  let entries = [];
  if (isBoostFeed) {
    entries = hit;
  } else if (Array.isArray(hit)) {
    entries = hit;
  } else if (hit?.pairs) {
    entries = hit.pairs;
  }

  const filtered = chain
    ? entries.filter(
        (p) =>
          String(p.chainId || p.pair?.chainId || "")
            .toLowerCase()
            .includes(chain) || String(p.chainId || p.pair?.chainId) === chain
      )
    : entries;

  let mapped = filtered
    .slice(0, 40)
    .map((p, i) => (isBoostFeed || (p.tokenAddress && !p.baseToken) ? mapTokenBoostEntry(p, i) : mapDexPairEntry(p, i)));

  const filteredStrength =
    Number.isFinite(minSignal) && minSignal > 0 ? mapped.filter((t) => (t.signalStrength || 0) >= minSignal) : mapped;

  return {
    count: filteredStrength.length,
    tokens: filteredStrength,
    updatedAt: new Date().toISOString(),
    disclaimer: DISCLAIMER,
  };
}

async function getIntelligenceFeed() {
  const disc = await discoverTokens({ chain: "eth" });
  const tokens = disc.tokens.slice(0, 6);
  const signals = tokens.map((t, i) => ({
    id: `sig-${t.contractAddress || i}`,
    type: "liquidity_volume",
    title: `${t.symbol} · $${Math.round(t.liquidityUsd).toLocaleString()} liquidity`,
    description: `24h volume ~ $${Math.round(t.volumeUsd24h || 0).toLocaleString()} on DexScreener.`,
    confidence: Math.min(95, 60 + Math.min(30, t.signalStrength || 0)),
    timestamp: new Date().toISOString(),
    tokens: [t.symbol].filter(Boolean),
    category: "market",
  }));

  const wallets = tokens.slice(0, 4).map((t) => ({
    address: t.contractAddress || "—",
    label: t.name,
    totalValueUsd: t.liquidityUsd,
    recentMoves: [],
    winRate: null,
    avgReturn: null,
  }));

  const trends = tokens.slice(0, 4).map((t) => ({
    token: t.symbol,
    netFlow: t.volumeUsd24h,
    direction: t.volumeUsd24h > t.liquidityUsd ? "accumulation" : "distribution",
    whaleCount: null,
  }));

  return {
    signals,
    smartMoney: { wallets, trends },
    updatedAt: new Date().toISOString(),
    disclaimer: DISCLAIMER,
  };
}

function getAlertsSnapshot() {
  return {
    alerts: [],
    feedSummary: { signalCount: 0, walletCount: 0 },
    disclaimer: DISCLAIMER,
    note: "Configure alerting rules + persistence for production alert streams.",
  };
}

module.exports = {
  DISCLAIMER,
  buildTokenScan: buildTokenScan,
  buildWalletScan,
  discoverTokens,
  getIntelligenceFeed,
  getAlertsSnapshot,
};
