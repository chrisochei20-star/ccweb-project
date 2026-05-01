const crypto = require("crypto");

/** In-memory token intel — replace with chain indexers + ML in production */
const scans = new Map();

function safeNumber(n, f = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : f;
}

function hashTokenId(chain, address) {
  return `${(chain || "eth").toLowerCase()}:${(address || "").toLowerCase()}`;
}

function synthesizeScan(chain, address, symbol) {
  const seed = hashTokenId(chain, address);
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const liquidityUsd = 120000 + (h % 900000);
  const holderCount = 400 + (h % 12000);
  const contractAgeDays = 3 + (h % 400);

  const honeypotRisk = ((h % 100) / 100) * 0.35;
  const rugPullSignals = h % 17 > 12 ? ["concentrated_top_holders", "renounced_lp_unclear"] : ["none_major"];
  const riskScore = Math.min(
    100,
    Math.round(22 + honeypotRisk * 80 + (h % 25))
  );

  const safetyTier =
    riskScore < 35 ? "lower_risk" : riskScore < 60 ? "moderate" : "elevated";

  const earlySignal =
    h % 11 > 6
      ? {
          label: "unusual_smart_money_inflow",
          strength: "medium",
          detail: "Detected wallet cluster accumulation vs 7d baseline.",
        }
      : {
          label: "quiet_accumulation",
          strength: "low",
          detail: "No strong divergence vs sector peers.",
        };

  const narrative = {
    themes: ["AI infra", "L2 scaling", "RWAs"].slice(0, 1 + (h % 3)),
    socialVelocity: ((h % 50) + 30) / 10,
  };

  return {
    id: `scan-${crypto.randomUUID().slice(0, 12)}`,
    chain: chain || "ethereum",
    tokenAddress: address,
    symbol: symbol || "TOKEN",
    scannedAt: new Date().toISOString(),
    riskScore,
    safetyTier,
    metrics: {
      liquidityUsd,
      holderCount,
      contractAgeDays,
      honeypotProbability: Math.round(honeypotRisk * 100) / 100,
    },
    flags: {
      mintAuthorityRenounced: h % 3 === 0,
      lpLocked: h % 4 !== 0,
      openSourceVerified: h % 5 !== 0,
    },
    rugPullSignals,
    earlySignal,
    narrative,
    smartMoney: {
      netFlow7dUsd: ((h % 200) - 80) * 1000,
      notableWallets: 2 + (h % 5),
    },
    disclaimer: "Educational estimate only — verify on-chain before transacting.",
  };
}

function runScan(body) {
  const chain = (body.chain || "ethereum").toString().trim();
  const address = (body.tokenAddress || body.address || "").toString().trim();
  const symbol = (body.symbol || "").toString().trim();
  if (!address || address.length < 8) {
    return { error: "tokenAddress (or address) is required.", status: 400 };
  }
  const result = synthesizeScan(chain, address, symbol || "UNKNOWN");
  scans.set(result.id, result);
  return { scan: result };
}

function getScan(id) {
  return scans.get(id) || null;
}

function listRecent(limit = 20) {
  return Array.from(scans.values())
    .sort((a, b) => (a.scannedAt < b.scannedAt ? 1 : -1))
    .slice(0, safeNumber(limit, 20));
}

module.exports = {
  runScan,
  getScan,
  listRecent,
};
