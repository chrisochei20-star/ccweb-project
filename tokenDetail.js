/**
 * Token detail payload for CCWEB Token Detail Page.
 * Combines scan heuristics, discovery row when matched, sample whale feed, and simulated market series.
 */

const cryptoSafety = require("./cryptoSafety");

const EXPLORER_TOKEN = {
  ethereum: "https://etherscan.io/token/",
  bitcoin: "https://blockstream.info/", // no token path
  base: "https://basescan.org/token/",
  arbitrum: "https://arbiscan.io/token/",
  solana: "https://solscan.io/token/",
};

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

function hashSeed(s) {
  const crypto = require("crypto");
  return parseInt(crypto.createHash("md5").update(String(s)).digest("hex").slice(0, 8), 16);
}

function normalizeSlug(raw) {
  if (!raw) return { symbol: "", address: "", solMint: "" };
  const s = decodeURIComponent(String(raw).trim());
  const lower = s.toLowerCase();
  if (lower.startsWith("0x") && lower.length === 42) {
    return { symbol: "", address: lower, solMint: "" };
  }
  // Solana mint: base58, length typically 32-44
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s)) {
    return { symbol: "", address: "", solMint: s };
  }
  return { symbol: s.toUpperCase().replace(/[^A-Z0-9]/g, "") || s, address: "", solMint: "" };
}

function findDiscoverRow(symbol, address, solMint) {
  const list = cryptoSafety.discoverTokens({}).tokens || [];
  const addr = (address || "").toLowerCase();
  if (addr) {
    const byAddr = list.find((t) => (t.contractAddress || "").toLowerCase() === addr);
    if (byAddr) return byAddr;
  }
  const mint = solMint || "";
  if (mint) {
    const byMint = list.find((t) => (t.contractAddress || "") === mint);
    if (byMint) return byMint;
  }
  const sym = (symbol || "").toUpperCase();
  if (sym) return list.find((t) => t.symbol.toUpperCase() === sym) || null;
  return null;
}

function syntheticPriceUsd(seed) {
  const base = 0.02 + (seed % 900) / 10000;
  return Number((base * (1 + (seed % 50) / 200)).toFixed(6));
}

function buildSeries14(symbol, seed) {
  const out = [];
  let price = syntheticPriceUsd(seed);
  for (let i = 13; i >= 0; i -= 1) {
    const dayJitter = 1 + ((seed >> (i % 5)) % 7) / 100 - ((seed >> ((i + 2) % 5)) % 5) / 100;
    price = clamp(price * dayJitter, 1e-8, 1e9);
    const volume = Math.max(1000, (seed % 500000) * (1 + i / 14) * (0.85 + (seed % 20) / 100));
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push({
      date: d.toISOString().slice(0, 10),
      priceUsd: Number(price.toFixed(6)),
      volumeUsd: Math.round(volume),
    });
  }
  const last = out[out.length - 1].priceUsd;
  const prev = out[out.length - 2]?.priceUsd ?? last;
  const change24hApproxPct = Number((((last - prev) / Math.max(prev, 1e-12)) * 100).toFixed(2));
  const change14dPct = Number((((last - out[0].priceUsd) / Math.max(out[0].priceUsd, 1e-12)) * 100).toFixed(2));
  return { series: out, change24hApproxPct, change14dPct };
}

function ownershipSlices(seed, flags) {
  const concentration = flags.includes("high_supply_concentration") ? 0.22 : 0.08 + (seed % 12) / 100;
  const top1 = clamp(18 + (seed % 25) + concentration * 40, 5, 55);
  const top10 = clamp(top1 + 15 + (seed % 20), top1 + 5, 85);
  const retail = clamp(100 - top10, 10, 90);
  return {
    top1HolderPct: Number(top1.toFixed(1)),
    top10HoldersPct: Number(top10.toFixed(1)),
    retailApproxPct: Number(retail.toFixed(1)),
    note: "Ownership bands are modeled estimates, not a live holder census.",
  };
}

function whaleTransactionsForToken(tokenSymbol, scan, limit = 8) {
  const feed = cryptoSafety.getIntelligenceFeed();
  const txs = [];
  const matchSym = (tokenSymbol || scan.token || "").toUpperCase();
  for (const w of feed.smartMoney.wallets) {
    for (const m of w.recentMoves || []) {
      if ((m.token || "").toUpperCase() === matchSym) {
        txs.push({
          walletLabel: w.label,
          walletShort: w.address,
          action: m.action,
          amountUsd: m.amountUsd,
          timestamp: m.timestamp,
          probabilityNotable: 0.55,
        });
      }
    }
  }
  if (txs.length >= 2) return txs.slice(0, limit);
  const seed = hashSeed(matchSym + (scan?.contractAddress || ""));
  const now = Date.now();
  const synth = [];
  for (let i = 0; i < limit; i += 1) {
    const buy = (seed + i) % 3 !== 0;
    synth.push({
      walletLabel: ["Wintermute (sample)", "Flow desk (sample)", "OTC desk (sample)"][i % 3],
      walletShort: `0x${(seed + i * 7919).toString(16).slice(0, 6)}…${(i * 17).toString(16).slice(0, 4)}`,
      action: buy ? "buy" : "sell",
      amountUsd: 400_000 + ((seed >> i) % 8) * 250_000,
      timestamp: new Date(now - (i + 1) * 1_800_000).toISOString(),
      probabilityNotable: Number((0.42 + ((seed + i) % 15) / 100).toFixed(2)),
    });
  }
  return synth;
}

function buildScoreExplanation(scan, riskAggressive) {
  const sec = scan.modules?.security;
  const ai = scan.modules?.aiInsightEngine;
  const parts = [];
  if (sec?.riskBand === "safe") parts.push("Structural checks skew toward lower model risk.");
  else if (sec?.riskBand === "medium") parts.push("Mixed signals: review liquidity and ownership before sizing exposure.");
  else parts.push("Several structural risk flags are elevated in this snapshot.");
  parts.push(
    `Displayed risk score ${riskAggressive}/100 is a danger-oriented view (not a profit forecast). Opportunity ${ai?.opportunityScore}/100 blends momentum and overlap signals only.`
  );
  return parts.join(" ");
}

function buildAiSummary(scan, riskAggressive) {
  const ai = scan.modules?.aiInsightEngine;
  const opp = ai?.opportunityScore ?? 0;
  const headline =
    opp >= 60 && riskAggressive >= 55
      ? "High opportunity score alongside elevated danger score — typical of volatile, narrative-driven markets."
      : opp >= 55 && riskAggressive < 45
        ? "Opportunity signals are relatively stronger than modeled danger; still verify on-chain facts."
        : riskAggressive >= 55
          ? "Danger score dominates: prioritize contract verification, liquidity depth, and exit liquidity before any action."
          : "Balanced snapshot: neither extreme opportunity nor extreme danger in this model window.";
  const bullets = (ai?.insights || []).slice(0, 2).map((x) => x.text);
  return { headline, bullets, riskVsReward: ai?.riskVsReward };
}

function explorerUrlFor(network, contractAddress) {
  if (!contractAddress) return null;
  const base = EXPLORER_TOKEN[network];
  if (!base) return null;
  if (network === "bitcoin") return null;
  return `${base}${contractAddress}`;
}

function buildTokenDetail(slug) {
  const { symbol: symIn, address: addrIn, solMint } = normalizeSlug(slug);
  const discover = findDiscoverRow(symIn, addrIn, solMint);
  const symbol = discover?.symbol || symIn || (addrIn ? "TOKEN" : solMint ? "TOKEN" : "");
  const address = discover?.contractAddress || addrIn || solMint || "";
  const scan = cryptoSafety.buildTokenScanFromQuery(symbol, address);

  const seed = hashSeed(symbol + (scan.contractAddress || ""));
  const { series, change24hApproxPct, change14dPct } = buildSeries14(symbol, seed);
  const lastPrice = series[series.length - 1]?.priceUsd ?? syntheticPriceUsd(seed);

  const liquidityUsd =
    discover?.liquidityUsd ??
    (scan.score >= 70 ? 5_000_000 + (seed % 2_000_000) : 80_000 + (seed % 400_000));

  const ownership = ownershipSlices(seed, scan.flags || []);

  const whaleTxs = whaleTransactionsForToken(scan.token, scan, 8);

  const disc = scan.modules?.earlyDiscovery;
  const social = {
    twitterMentions24h: Math.round(200 + (seed % 4000) * (disc?.socialSignals?.twitterX?.mentionVelocity / 100 || 1)),
    redditPosts24h: Math.round(30 + (seed % 400) * (disc?.socialSignals?.reddit?.postVelocity / 100 || 0.5)),
    trendingKeywords: [
      ...(disc?.socialSignals?.twitterX?.trendingKeywords || []),
      ...(discover?.narrativeKeywords || []),
    ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 8),
    note: "Social counts are simulated unless you connect X/Reddit APIs.",
  };

  const ai = scan.modules?.aiInsightEngine;
  const sec = scan.modules?.security;
  const safetyScore = sec?.riskScore ?? scan.score;
  const riskScoreAggressive = clamp(100 - safetyScore, 0, 100);

  return {
    disclaimer: scan.disclaimer,
    slug: slug || symbol || address,
    name: scan.name,
    symbol: scan.token,
    chain: scan.network,
    contractAddress: scan.contractAddress,
    scores: {
      safety: safetyScore,
      risk: riskScoreAggressive,
      opportunity: ai?.opportunityScore ?? 0,
      note: "Risk score is shown as higher = more dangerous (inverse of internal safety score) for readability.",
    },
    market: {
      priceUsd: lastPrice,
      change24hApproxPct,
      change14dPct,
      series14d: series,
      note: "Price/volume series is synthetic for UI demonstration, not live OHLCV.",
    },
    opportunityScore: ai?.opportunityScore ?? 0,
    riskScore: riskScoreAggressive,
    safetyScore,
    riskBand: sec?.riskBand,
    opportunityBand: ai?.opportunityScore >= 60 ? "elevated" : ai?.opportunityScore >= 40 ? "moderate" : "subdued",
    scoreExplanation: buildScoreExplanation(scan, riskScoreAggressive),
    whaleTransactions: whaleTxs,
    liquidity: {
      usd: liquidityUsd,
      locked: !!scan.liquidityLocked,
      depthLabel:
        liquidityUsd >= 1_000_000 ? "deep" : liquidityUsd >= 200_000 ? "moderate" : "thin",
      note: "DEX liquidity is estimated from discovery row or heuristics, not guaranteed depth.",
    },
    ownership,
    contract: {
      verified: !!scan.contractVerified,
      ownershipStatus: sec?.ownershipStatus,
      mintFunctions: sec?.mintBurnFunctions,
      honeypotRisk: scan.honeypotRisk,
      rugPullRisk: scan.rugPullRisk,
    },
    social,
    aiSummary: buildAiSummary(scan, riskScoreAggressive),
    explorerUrl: explorerUrlFor(scan.network, scan.contractAddress),
    scannedAt: scan.scannedAt,
    methodology: scan.methodology,
    discoverMatch: discover
      ? { id: discover.id, dataSourceNote: discover.dataSourceNote }
      : null,
  };
}

module.exports = { buildTokenDetail, normalizeSlug };
