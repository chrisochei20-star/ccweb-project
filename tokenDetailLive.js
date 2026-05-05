/**
 * Token detail payload using live DexScreener + Etherscan (no synthetic price series).
 */

const liveIntel = require("./intel/liveCryptoIntel");
const cryptoSafety = require("./cryptoSafety");

const EXPLORER_TOKEN = {
  ethereum: "https://etherscan.io/token/",
  base: "https://basescan.org/token/",
  arbitrum: "https://arbiscan.io/token/",
  solana: "https://solscan.io/token/",
};

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

function normalizeSlug(raw) {
  if (!raw) return { symbol: "", address: "", solMint: "" };
  const s = decodeURIComponent(String(raw).trim());
  const lower = s.toLowerCase();
  if (lower.startsWith("0x") && lower.length === 42) {
    return { symbol: "", address: lower, solMint: "" };
  }
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s)) {
    return { symbol: "", address: "", solMint: s };
  }
  return { symbol: s.toUpperCase().replace(/[^A-Z0-9]/g, "") || s, address: "", solMint: "" };
}

function explorerUrlFor(network, contractAddress) {
  if (!contractAddress) return null;
  const addr = String(contractAddress).trim();
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr)) {
    return `${EXPLORER_TOKEN.solana}${addr}`;
  }
  if (!/^0x[a-fA-F0-9]{40}$/i.test(addr)) return null;
  const n = String(network || "").toLowerCase();
  if (n.includes("base")) return `${EXPLORER_TOKEN.base}${addr}`;
  if (n.includes("arb")) return `${EXPLORER_TOKEN.arbitrum}${addr}`;
  return `${EXPLORER_TOKEN.ethereum}${addr}`;
}

async function buildTokenDetail(slug) {
  const { symbol: symIn, address: addrIn, solMint } = normalizeSlug(slug);

  let addr = addrIn || solMint;
  const symbol = symIn;

  if (!addr) {
    throw new Error("Token detail requires a contract address or Solana mint in the URL path.");
  }

  const scan = await liveIntel.buildTokenScan(symbol, addr);
  const mkt = scan.modules?.market || {};
  const priceUsd = Number(mkt.priceUsd || 0);
  const vol24 = Number(mkt.volumeUsd24h || 0);
  const liq = Number(mkt.liquidityUsd || 0);

  const ai = scan.modules?.aiInsightEngine;
  const sec = scan.modules?.security;
  const safetyScore = sec?.riskScore ?? scan.score;
  const riskScoreAggressive = clamp(100 - safetyScore, 0, 100);

  const series = [
    {
      date: new Date().toISOString().slice(0, 10),
      priceUsd: priceUsd || null,
      volumeUsd: Math.round(vol24),
    },
  ];

  return {
    disclaimer: scan.disclaimer,
    slug: slug || scan.token || addr,
    name: scan.name,
    symbol: scan.token,
    chain: scan.network,
    contractAddress: scan.contractAddress,
    scores: {
      safety: safetyScore,
      risk: riskScoreAggressive,
      opportunity: ai?.opportunityScore ?? 0,
      note: "Risk score shown as danger-oriented (inverse of structural safety).",
    },
    market: {
      priceUsd: priceUsd || null,
      change24hApproxPct: null,
      change14dPct: null,
      series14d: series,
      note: "Spot price and 24h volume from DexScreener pair; historical OHLCV requires a dedicated market data feed.",
      liquidityUsd: liq,
      fdv: mkt.fdv || null,
      pairUrl: mkt.url || null,
    },
    opportunityScore: ai?.opportunityScore ?? 0,
    riskScore: riskScoreAggressive,
    safetyScore,
    riskBand: sec?.riskBand,
    opportunityBand: ai?.opportunityScore >= 60 ? "elevated" : ai?.opportunityScore >= 40 ? "moderate" : "subdued",
    scoreExplanation: (ai?.insights || []).map((x) => x.text).join(" "),
    whaleTransactions: [],
    liquidity: {
      usd: liq,
      locked: !!scan.liquidityLocked,
      depthLabel: liq >= 1_000_000 ? "deep" : liq >= 200_000 ? "moderate" : "thin",
      note: "Liquidity from aggregated DEX pairs (DexScreener).",
    },
    ownership: {
      top1HolderPct: null,
      top10HoldersPct: null,
      retailApproxPct: null,
      note: "Holder distribution requires an archival RPC or indexer.",
    },
    contract: {
      verified: !!scan.contractVerified,
      ownershipStatus: sec?.ownershipStatus,
      mintFunctions: sec?.mintBurnFunctions,
      honeypotRisk: scan.honeypotRisk,
      rugPullRisk: scan.rugPullRisk,
    },
    social: {
      twitterMentions24h: null,
      redditPosts24h: null,
      trendingKeywords: [],
      note: "Social metrics require X/Reddit API credentials.",
    },
    aiSummary: {
      headline: ai?.insights?.[0]?.text || "Live market snapshot.",
      bullets: (ai?.insights || []).slice(1, 3).map((x) => x.text),
      riskVsReward: ai?.riskVsReward,
    },
    explorerUrl: explorerUrlFor(scan.network, scan.contractAddress),
    scannedAt: scan.scannedAt,
    methodology: scan.methodology,
    dataSources: scan.dataSources || [],
    discoverMatch: null,
  };
}

module.exports = {
  buildTokenDetail,
  normalizeSlug,
  async trackWallet(address, action, body) {
    return cryptoSafety.trackWallet(address, action, body);
  },
};
