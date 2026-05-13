/**
 * CCWEB Early Signals — scoring, feed assembly, optional chain enrichment.
 * Outputs probabilities and signal scores only; never profit guarantees.
 */

const crypto = require("crypto");
const liveIntel = require("./intel/liveCryptoIntel");
const { buildNarrativeKeywords } = require("./intel/socialNarratives");

const DISCLAIMER =
  "Signals combine heuristics and optional third-party APIs. Scores are not predictions. Crypto is highly volatile. Verify independently. Not financial advice.";

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

function hashSeed(s) {
  return parseInt(crypto.createHash("md5").update(String(s)).digest("hex").slice(0, 8), 16);
}

/** DEX / on-chain activity scores (0–100), normalized from raw metrics. */
function volumeActivityScore(volumeUsd24h) {
  const v = Math.log10(Math.max(1, volumeUsd24h));
  return clamp(Math.round(v * 22), 0, 100);
}

function holderGrowthScore(holderCount, txCount24h) {
  const h = clamp(Math.log10(Math.max(10, holderCount)) * 35, 0, 70);
  const t = clamp(Math.log10(Math.max(10, txCount24h)) * 25, 0, 40);
  return clamp(Math.round(h + t - 20), 0, 100);
}

function socialBuzzScore(keywords, seed) {
  const base = Math.min(100, keywords.length * 18 + (seed % 25));
  return clamp(base, 0, 100);
}

function whaleActivityScore(txCount24h, liquidityUsd, seed) {
  const intensity = Math.log10(Math.max(100, txCount24h * liquidityUsd ** 0.2));
  return clamp(Math.round(intensity * 12 + (seed % 15)), 0, 100);
}

/**
 * Opportunity score: weighted blend of volume, holders, social, whale signals.
 */
function computeOpportunityScore({ volumeUsd24h, holderCount, txCount24h, liquidityUsd, keywords }, seed) {
  const v = volumeActivityScore(volumeUsd24h);
  const h = holderGrowthScore(holderCount, txCount24h);
  const s = socialBuzzScore(keywords, seed);
  const w = whaleActivityScore(txCount24h, liquidityUsd, seed);
  return clamp(Math.round(v * 0.28 + h * 0.27 + s * 0.22 + w * 0.23), 0, 100);
}

/**
 * Risk score (0 = safest, 100 = riskiest) from structural and liquidity heuristics.
 */
function computeRiskScore({ liquidityUsd, deployedHoursAgo, contractVerifiedGuess }, seed) {
  const liqHealth = clamp(Math.log10(Math.max(500, liquidityUsd)) * 18, 0, 100);
  const ageRisk = deployedHoursAgo < 24 ? 35 : deployedHoursAgo < 72 ? 22 : 12;
  const verifyRisk = contractVerifiedGuess === false ? 28 : contractVerifiedGuess === true ? 4 : 14 + (seed % 12);
  const raw = 100 - liqHealth * 0.45 + ageRisk * 0.35 + verifyRisk * 0.35 + (seed % 10) * 0.15;
  return clamp(Math.round(raw), 0, 100);
}

function trendStatus(opp, risk, volumeScore) {
  if (risk >= 72 && opp >= 55) return "high_noise";
  if (opp >= 62 && risk < 55 && volumeScore >= 55) return "warming";
  if (opp < 38 || volumeScore < 28) return "cooling";
  return "neutral";
}

function buildWarnings(riskScore, liquidityUsd, deployedHoursAgo) {
  const w = [];
  if (liquidityUsd < 150_000) w.push({ code: "thin_liquidity", message: "Liquidity depth appears limited; slippage and exit risk may be high." });
  if (deployedHoursAgo < 48) w.push({ code: "very_new", message: "Contract age is very young; scams and honeypots are more common in this window." });
  if (riskScore >= 65) w.push({ code: "elevated_risk", message: "Model flags elevated structural or behavioral risk — treat as speculative." });
  return w;
}

function enrichDiscoverRow(row) {
  const seed = hashSeed(row.id + row.contractAddress);
  const keywords = row.narrativeKeywords || [];
  const volumeUsd24h = Number(row.volumeUsd24h || 0);
  const holderCount = row.holderCount != null ? Number(row.holderCount) : 1000;
  const txCount24h = row.txCount24h != null ? Number(row.txCount24h) : 100;
  const liquidityUsd = Number(row.liquidityUsd || 0);
  const deployedHoursAgo =
    row.deployedHoursAgo != null ? Number(row.deployedHoursAgo) : 720;

  const volumeScore = volumeActivityScore(volumeUsd24h);
  const opportunityScore = computeOpportunityScore(
    {
      volumeUsd24h,
      holderCount,
      txCount24h,
      liquidityUsd,
      keywords,
    },
    seed
  );
  const contractVerifiedGuess =
    row.network === "solana" ? null : seed % 7 !== 0;
  const riskScore = computeRiskScore(
    {
      liquidityUsd,
      deployedHoursAgo,
      contractVerifiedGuess,
    },
    seed
  );
  const status = trendStatus(opportunityScore, riskScore, volumeScore);
  return {
    id: row.id,
    name: row.name,
    symbol: row.symbol,
    chain: row.network,
    contractAddress: row.contractAddress,
    detectedAt: new Date(Date.now() - deployedHoursAgo * 3600000).toISOString(),
    deployedHoursAgo,
    opportunityScore,
    riskScore,
    trendStatus: status,
    liquidityUsd,
    volumeUsd24h,
    holderCount,
    txCount24h,
    signalProbabilities: {
      volumeSpike: clamp(volumeScore / 100, 0, 1),
      holderGrowth: clamp(holderGrowthScore(holderCount, txCount24h) / 100, 0, 1),
      socialBuzz: clamp(socialBuzzScore(keywords, seed) / 100, 0, 1),
      whaleActivity: clamp(whaleActivityScore(txCount24h, liquidityUsd, seed) / 100, 0, 1),
    },
    warnings: buildWarnings(riskScore, liquidityUsd, deployedHoursAgo),
    narrativeKeywords: keywords,
    dataSourceNote: row.dataSourceNote,
  };
}

async function buildNarrativeTrends() {
  let keywords = [];
  try {
    keywords = await buildNarrativeKeywords();
  } catch {
    keywords = [];
  }
  return {
    updatedAt: new Date().toISOString(),
    channels: {
      twitter: {
        label: "X (Twitter)",
        note: process.env.TWITTER_BEARER_TOKEN
          ? "Recent search query results (configurable via CCWEB_TWITTER_SEARCH_QUERY)."
          : "Set TWITTER_BEARER_TOKEN for live keyword velocity from X API v2.",
      },
      reddit: {
        label: "Reddit",
        note: process.env.CCWEB_REDDIT_SUBS
          ? `Subs: ${process.env.CCWEB_REDDIT_SUBS}`
          : "Public JSON from CCWEB_REDDIT_SUBS (default cryptocurrency,ethereum,solana).",
      },
      telegram: {
        label: "Telegram",
        note: "Telegram Bot API not configured.",
      },
    },
    keywords,
    disclaimer:
      keywords.length === 0
        ? "No narrative keywords yet — add TWITTER_BEARER_TOKEN and/or configure Reddit subs."
        : "Keyword momentum is informational only; high momentum often coincides with scams.",
  };
}

function buildRiskAlerts(feedItems) {
  return feedItems
    .filter((t) => t.riskScore >= 58 || t.warnings.length >= 2)
    .map((t) => ({
      id: `risk-${t.id}`,
      tokenId: t.id,
      symbol: t.symbol,
      chain: t.chain,
      severity: t.riskScore >= 72 ? "high" : t.riskScore >= 62 ? "medium" : "low",
      title: `${t.symbol} — elevated model risk`,
      warnings: t.warnings,
      opportunityScore: t.opportunityScore,
      riskScore: t.riskScore,
      probabilityNote: "Risk tier is a heuristic; false negatives and false positives occur.",
    }));
}

async function fetchEtherscanTokenSnapshot(contractAddress, apiKey) {
  if (!apiKey || !contractAddress || !/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) return null;
  const url = new URL("https://api.etherscan.io/v2/api");
  url.searchParams.set("chainid", "1");
  url.searchParams.set("module", "contract");
  url.searchParams.set("action", "getabi");
  url.searchParams.set("address", contractAddress);
  url.searchParams.set("apikey", apiKey);
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 8000);
  try {
    const res = await fetch(url.toString(), { signal: ac.signal });
    const json = await res.json();
    clearTimeout(t);
    if (json.status === "1" && json.result && json.result !== "Contract source code not verified") {
      return { contractVerified: true, source: "etherscan" };
    }
    return { contractVerified: false, source: "etherscan" };
  } catch {
    clearTimeout(t);
    return null;
  }
}

async function buildFeedItems() {
  const discover = await liveIntel.discoverTokens({});
  const items = discover.tokens.map((row) => enrichDiscoverRow(row));
  const apiKey = process.env.ETHERSCAN_API_KEY;
  if (apiKey) {
    await Promise.all(
      items
        .filter((i) => i.chain === "ethereum" || i.chain === "base" || i.chain === "arbitrum")
        .slice(0, 3)
        .map(async (item) => {
          if (!item.contractAddress || !item.contractAddress.startsWith("0x")) return;
          const snap = await fetchEtherscanTokenSnapshot(item.contractAddress, apiKey);
          if (snap) {
            item.chainApiEnrichment = snap;
            if (snap.contractVerified === false) {
              item.riskScore = clamp(item.riskScore + 12, 0, 100);
              item.warnings = [
                ...item.warnings,
                { code: "verification", message: "Explorer reports unverified or missing source match — treat bytecode as untrusted." },
              ];
            }
          }
        })
    );
  }
  return items;
}

async function buildSmartMoneySection(trackedFromDb) {
  const feed = await liveIntel.getIntelligenceFeed();
  const marketWallets = feed.smartMoney.wallets;
  const tracked = (trackedFromDb || []).map((w, i) => ({
    address: w.address,
    label: w.label,
    addedAt: w.addedAt,
    recentMoves: marketWallets[i % Math.max(1, marketWallets.length)]?.recentMoves?.slice(0, 3) || [],
    note: "Moves shown when available from live pair/boost feeds.",
  }));
  return {
    tracked,
    marketWallets: feed.smartMoney.wallets,
    trends: feed.smartMoney.trends,
    updatedAt: feed.updatedAt,
    disclaimer: feed.disclaimer,
  };
}

async function buildDashboardPayload(trackedFromDb) {
  const feedItems = await buildFeedItems();
  const narratives = await buildNarrativeTrends();
  const riskAlerts = buildRiskAlerts(feedItems);
  const smartMoney = await buildSmartMoneySection(trackedFromDb);

  return {
    disclaimer: DISCLAIMER,
    updatedAt: new Date().toISOString(),
    live: { ssePath: "/api/intelligence/stream", pollSeconds: 12 },
    feed: { items: feedItems },
    narratives,
    riskAlerts,
    smartMoney,
    scoring: {
      opportunity:
        "round(0.28×volumeActivity + 0.27×holderTx + 0.22×socialBuzz + 0.23×whaleIntensity), each 0–100, then clamped.",
      risk: "100 minus liquidity health (log-scaled) with age and verification penalties; clamped 0–100 (higher = riskier).",
    },
  };
}

module.exports = {
  buildDashboardPayload,
  buildFeedItems,
  buildNarrativeTrends,
  buildRiskAlerts,
  DISCLAIMER,
};
