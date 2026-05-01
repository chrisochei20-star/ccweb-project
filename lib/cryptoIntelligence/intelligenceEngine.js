/**
 * CCWEB Crypto Intelligence — deterministic synthetic signals for MVP demos.
 * Production: wire Etherscan/BscScan/indexers; never treat outputs as financial advice.
 */

const crypto = require("crypto");

function safeNum(n, d = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : d;
}

function hashSeed(parts) {
  const s = parts.map((p) => String(p || "").toLowerCase()).join(":");
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function fr(seed, min, max) {
  const x = Math.sin(seed) * 10000;
  const r = x - Math.floor(x);
  return min + r * (max - min);
}

function riskBand(score) {
  if (score < 35) return { label: "Safe", tier: "safe" };
  if (score < 60) return { label: "Medium Risk", tier: "medium" };
  return { label: "High Risk", tier: "high" };
}

/** Module 1 — Security & risk (expanded) */
function synthesizeTokenSecurity(chain, address, symbol) {
  const h = hashSeed([chain, address, symbol]);
  const liquidityUsd = Math.round(80000 + fr(h, 0, 1) * 920000);
  const holderCount = Math.round(300 + fr(h + 1, 0, 1) * 14000);
  const contractAgeDays = Math.round(2 + fr(h + 2, 0, 1) * 500);
  const top10HolderPct = Math.round((15 + fr(h + 3, 0, 1) * 75) * 10) / 10;

  const contractVerified = fr(h + 4, 0, 1) > 0.12;
  const liquidityLockedPct = Math.round(fr(h + 5, 0, 1) * 100);
  const lpLockVendor = liquidityLockedPct > 60 ? ["unicrypt", "team_finance", "unknown"][h % 3] : "unclear";
  const ownershipRenounced = fr(h + 6, 0, 1) > 0.45;
  const ownerAddress = ownershipRenounced ? null : `0x${(h >>> 0).toString(16).padStart(8, "0")}…${(h % 9999).toString(16)}`;
  const mintPresent = fr(h + 7, 0, 1) > 0.55;
  const burnPresent = fr(h + 8, 0, 1) > 0.4;
  const hiddenTaxEstimateBps = Math.round(fr(h + 9, 0, 1) * 1200);
  const buyTaxBps = Math.round(fr(h + 10, 0, 1) * 800);
  const sellTaxBps = Math.round(fr(h + 11, 0, 1) * 1100);

  const honeypotScore = fr(h + 12, 0, 1);
  const rugPullSignals = [];
  if (top10HolderPct > 55) rugPullSignals.push("wallet_concentration_top10");
  if (liquidityLockedPct < 30) rugPullSignals.push("liquidity_lock_weak");
  if (!ownershipRenounced && top10HolderPct > 40) rugPullSignals.push("centralized_ownership_and_concentration");
  if (hiddenTaxEstimateBps > 600) rugPullSignals.push("elevated_transfer_mechanics");
  if (rugPullSignals.length === 0) rugPullSignals.push("no_major_pattern_flagged");

  const liquidityWithdrawalPattern =
    fr(h + 13, 0, 1) > 0.85 ? "suspicious_lp_moves_vs_peer_baseline" : "within_expected_variance";

  let riskScore = Math.round(
    18 +
      honeypotScore * 42 +
      (100 - liquidityLockedPct) * 0.25 +
      top10HolderPct * 0.35 +
      (ownershipRenounced ? 0 : 12) +
      (hiddenTaxEstimateBps / 25)
  );
  riskScore = Math.min(100, Math.max(0, riskScore));

  return {
    chain: chain || "ethereum",
    tokenAddress: address,
    symbol: symbol || "TOKEN",
    contractAgeDays,
    security: {
      contractVerification: {
        status: contractVerified ? "verified_similar_to_explorer" : "unverified_or_proxy",
        note: "Synthesized — verify source on Etherscan/BscScan before trusting.",
      },
      liquidity: {
        totalUsd: liquidityUsd,
        lock: {
          lockedPercentOfLp: liquidityLockedPct,
          vendorHint: lpLockVendor,
        },
      },
      ownership: {
        renounced: ownershipRenounced,
        ownerWallet: ownerAddress,
      },
      contractFunctions: {
        mintable: mintPresent,
        burnable: burnPresent,
        note: "Heuristic flags only — full bytecode audit required for certainty.",
      },
      taxes: {
        estimatedBuyFeeBps: buyTaxBps,
        estimatedSellFeeBps: sellTaxBps,
        hiddenOrDynamicTaxRisk: hiddenTaxEstimateBps > 400 ? "elevated" : "moderate",
      },
    },
    metrics: {
      liquidityUsd,
      holderCount,
      top10HolderPct,
      honeypotProbability: Math.round(honeypotScore * 100) / 100,
    },
    rugPullAnalysis: {
      liquidityWithdrawalPattern,
      walletConcentrationScore: Math.min(100, Math.round(top10HolderPct * 1.1)),
      suspiciousLogicHints: mintPresent && !ownershipRenounced ? ["mint_without_renounce"] : [],
    },
    riskScore,
    riskBand: riskBand(riskScore),
    flags: {
      mintAuthorityRenounced: !mintPresent || ownershipRenounced,
      lpLocked: liquidityLockedPct > 40,
      openSourceVerified: contractVerified,
    },
    rugPullSignals,
  };
}

/** Module 2 — On-chain style intelligence */
function synthesizeOnChainIntel(chain, tokenSeed) {
  const h = hashSeed([chain, tokenSeed, "onchain"]);
  const wallets = [];
  for (let i = 0; i < 4; i += 1) {
    const wh = h + i * 9973;
    wallets.push({
      address: `0x${(wh >>> 0).toString(16).padStart(6, "0")}…${((wh * 13) >>> 0).toString(16).slice(0, 4)}`,
      label: ["historically_profitable", "fresh_wallet", "cex_hot_wallet", "dao_treasury"][i % 4],
      winRateEstimate: Math.round(40 + fr(wh, 0, 1) * 55),
      earlyBuys7d: Math.round(fr(wh + 1, 0, 1) * 12),
    });
  }

  return {
    smartMoney: {
      netFlow7dUsd: Math.round((fr(h, 0, 1) - 0.4) * 2_500_000),
      notableWallets: wallets,
      narrative:
        "Tracks wallets with above-median realized gains in synthetic history — not a guarantee of future performance.",
    },
    whaleActivity: [
      {
        type: fr(h + 2, 0, 1) > 0.5 ? "large_buy" : "large_sell",
        usdNotional: Math.round(200_000 + fr(h + 3, 0, 1) * 4_000_000),
        confidence: 0.55 + fr(h + 4, 0, 1) * 0.35,
      },
    ],
    walletClusters: [
      {
        clusterId: `cl-${(h % 999).toString(16)}`,
        linkedWallets: 3 + (h % 5),
        coordinationScore: Math.round(fr(h + 5, 0, 1) * 100) / 100,
        interpretation: "Possible related EOAs — investigate timing overlap (signal, not proof).",
      },
    ],
    tokenFlows: {
      inflowsTopSources: ["dex_router", "cex_withdrawal", "bridge"][((h % 3) + 0) % 3],
      outflowsTopSinks: ["dex", "staking", "unknown_contract"],
      interpretation: "Directional hints from synthetic graph — production uses traced transfers.",
    },
  };
}

/** Module 3 — Alpha discovery */
function synthesizeDiscoveryItem(chain, idx, baseH) {
  const h = baseH + idx * 7919;
  const addr = `0x${(h >>> 0).toString(16).padStart(8, "0")}${((h * 17) >>> 0).toString(16).slice(0, 8)}`;
  const ageHours = Math.round(fr(h, 0, 1) * 96);
  const volSpike = Math.round(fr(h + 1, 0, 1) * 100);
  const holderGrowth = Math.round(fr(h + 2, 0, 1) * 100);
  const twitterMentions = Math.round(fr(h + 3, 0, 1) * 5000);
  const redditMentions = Math.round(fr(h + 4, 0, 1) * 800);
  const telegramSignal = fr(h + 5, 0, 1) > 0.6 ? "channel_velocity_up" : "flat";

  const keywords = ["AI", "L2", "RWA", "restaking", "meme", "perps"].filter((_, i) => (h >> i) & 1).slice(0, 3);
  if (keywords.length === 0) keywords.push("general");

  return {
    rank: idx + 1,
    chain,
    tokenAddress: addr,
    symbol: `TK${(h % 99).toString().padStart(2, "0")}`,
    deployedHoursAgo: ageHours,
    earlyLiquidityUsd: Math.round(50_000 + fr(h + 6, 0, 1) * 400_000),
    momentum: {
      txCountSpikeVsBaseline: volSpike,
      holderGrowth24hPct: holderGrowth,
    },
    social: {
      twitterXMentions24h: twitterMentions,
      redditMentions24h: redditMentions,
      telegram: telegramSignal,
      trendingKeywords: keywords,
    },
    influencerCorrelation: {
      score: Math.round(fr(h + 7, 0, 1) * 100) / 100,
      note: "Correlation between watch-listed influencer timing and price/volume is weak-to-moderate in this demo.",
    },
    alphaSignalStrength: Math.round(30 + fr(h + 8, 0, 1) * 65),
    disclaimer: "Early-stage metrics can reflect wash activity — confirm with independent tooling.",
  };
}

/** Module 4 — AI-style insights */
function buildAiInsights(security, onChain, riskScore, opportunityScore) {
  const bullets = [];
  if (security.rugPullAnalysis.walletConcentrationScore > 60) {
    bullets.push("High holder concentration increases governance and dump risk relative to typical pools.");
  }
  if (security.security.liquidity.lock.lockedPercentOfLp > 70) {
    bullets.push("Liquidity lock appears stronger than many peers — still verify lock contract and duration on-chain.");
  }
  if (onChain.smartMoney.netFlow7dUsd > 0) {
    bullets.push("Smart-money cohorts show net inflows vs synthetic baseline — not predictive of returns.");
  }
  if (bullets.length === 0) {
    bullets.push("No dominant narrative from synthetic signals — treat as neutral until more data arrives.");
  }

  const riskReward = {
    ratioLabel:
      opportunityScore > 70 && riskScore < 45
        ? "favorable_on_demo_metrics"
        : opportunityScore > riskScore
          ? "opportunity_skews_higher_in_model"
          : "risk_skews_higher_in_model",
    explanation:
      "Ratio compares heuristic opportunity vs risk scores (0–100). High volatility assets can invalidate short-term signals.",
  };

  return {
    summaryLines: bullets,
    opportunityScore,
    riskVsReward: riskReward,
    volatilityWarning:
      "Crypto markets are volatile. This engine outputs probabilistic signals for research, not investment advice.",
  };
}

function computeOpportunityScore(h, riskScore) {
  const raw = Math.round(55 + fr(h + 99, 0, 1) * 40 - riskScore * 0.25);
  return Math.min(100, Math.max(0, raw));
}

function fullTokenScan(chain, address, symbol) {
  const sec = synthesizeTokenSecurity(chain, address, symbol);
  const h = hashSeed([chain, address, symbol]);
  const onChain = synthesizeOnChainIntel(chain, address);
  const opportunityScore = computeOpportunityScore(h, sec.riskScore);
  const ai = buildAiInsights(sec, onChain, sec.riskScore, opportunityScore);

  const earlySignal =
    fr(h + 50, 0, 1) > 0.55
      ? {
          label: "unusual_smart_money_inflow",
          strength: "medium",
          detail: "Synthetic cluster shows early accumulation vs 7d baseline — verify independently.",
        }
      : {
          label: "quiet_accumulation",
          strength: "low",
          detail: "Flows resemble sector median — no strong divergence detected in demo model.",
        };

  return {
    id: `scan-${crypto.randomUUID().slice(0, 12)}`,
    scannedAt: new Date().toISOString(),
    ...sec,
    safetyTier: sec.riskBand.tier === "safe" ? "lower_risk" : sec.riskBand.tier === "medium" ? "moderate" : "elevated",
    onChainIntelligence: onChain,
    earlySignal,
    narrative: {
      themes: ["AI infra", "L2", "RWAs"].slice(0, 1 + (h % 3)),
      socialVelocity: ((h % 50) + 30) / 10,
    },
    aiInsights: ai,
    opportunityScore,
    disclosure: {
      notAdvice:
        "Signals are educational and probabilistic. Past patterns do not guarantee future results. DYOR and use hardware wallets for self-custody.",
      dataProvenance: "MVP synthetic + heuristic mix — connect Etherscan/BscScan/Glassnode-style feeds for production.",
    },
  };
}

function synthesizeWalletRiskScan(chain, walletAddress) {
  const h = hashSeed([chain, walletAddress, "wallet"]);
  const scamLinks = fr(h, 0, 1) > 0.82;
  const tornadoExposure = fr(h + 1, 0, 1) > 0.88;
  const sybilCluster = Math.round(fr(h + 2, 0, 1) * 100) / 100;

  let riskScore = Math.round(25 + fr(h + 3, 0, 1) * 50 + (scamLinks ? 15 : 0) + (tornadoExposure ? 8 : 0));
  riskScore = Math.min(100, riskScore);

  return {
    chain: chain || "ethereum",
    walletAddress,
    scannedAt: new Date().toISOString(),
    walletRiskScore: riskScore,
    walletRiskBand: riskBand(riskScore),
    findings: {
      scamLinkedCounterparties: scamLinks,
      suspiciousPatternFlags: [
        sybilCluster > 0.65 ? "rapid_micro_transfers" : null,
        tornadoExposure ? "privacy_protocol_touchpoint" : null,
        scamLinks ? "known_scam_token_interaction_synthetic" : null,
      ].filter(Boolean),
      explanation:
        "Wallet risk combines counterparty heuristics and transfer shapes — false positives are possible. Review transactions manually.",
    },
    transactionPatternSummary: {
      burstScore: Math.round(fr(h + 4, 0, 1) * 100),
      circularFlowSuspicion: Math.round(fr(h + 5, 0, 1) * 100) / 100,
    },
    disclosure: {
      notAdvice: "Wallet scores are indicative only and may mis-rank privacy-conscious users.",
    },
  };
}

function discoveryFeed(chain, limit) {
  const c = chain || "ethereum";
  const h = hashSeed([c, "discovery"]);
  const n = Math.min(50, Math.max(1, safeNum(limit, 12)));
  const items = [];
  for (let i = 0; i < n; i += 1) items.push(synthesizeDiscoveryItem(c, i, h));
  return { chain: c, updatedAt: new Date().toISOString(), count: items.length, tokens: items };
}

function exampleDataset() {
  const chain = "ethereum";
  const demoAddr = "0xabc1234567890abcdef1234567890abcdef1234";
  return {
    description: "Static + deterministic examples for integration tests and UI demos.",
    tokenScanSample: fullTokenScan(chain, demoAddr, "DEMO"),
    walletScanSample: synthesizeWalletRiskScan(chain, "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
    discoverySample: discoveryFeed(chain, 5),
    probabilityNote:
      "All numeric fields in demo mode are synthetic unless you attach live indexers. Probabilities are not calibrated to real base rates.",
  };
}

module.exports = {
  hashSeed,
  synthesizeTokenSecurity,
  fullTokenScan,
  synthesizeWalletRiskScan,
  discoveryFeed,
  synthesizeOnChainIntel,
  exampleDataset,
  riskBand,
};
