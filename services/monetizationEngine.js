/**
 * Dynamic pricing, tier limits, credit debit, and paywall helpers for CCWEB.
 */

const learningPg = require("../db/persistenceLearning");
const monPg = require("../db/persistenceMonetization");

function numEnv(name, def) {
  const v = Number(process.env[name]);
  return Number.isFinite(v) ? v : def;
}

function tierLimits(tier) {
  const t = String(tier || "free").toLowerCase();
  if (t === "premium") {
    return {
      scansPerMonth: numEnv("CCWEB_LIMIT_PREMIUM_SCANS", 50000),
      intelligencePerMonth: numEnv("CCWEB_LIMIT_PREMIUM_INTEL", 50000),
      aiPlatformRunsPerMonth: numEnv("CCWEB_LIMIT_PREMIUM_AI_RUNS", 50000),
    };
  }
  if (t === "pro") {
    return {
      scansPerMonth: numEnv("CCWEB_LIMIT_PRO_SCANS", 500),
      intelligencePerMonth: numEnv("CCWEB_LIMIT_PRO_INTEL", 2000),
      aiPlatformRunsPerMonth: numEnv("CCWEB_LIMIT_PRO_AI_RUNS", 400),
    };
  }
  return {
    scansPerMonth: numEnv("CCWEB_LIMIT_FREE_SCANS", 25),
    intelligencePerMonth: numEnv("CCWEB_LIMIT_FREE_INTEL", 60),
    aiPlatformRunsPerMonth: numEnv("CCWEB_LIMIT_FREE_AI_RUNS", 20),
  };
}

/** Demand multiplier from concurrent live learning sessions (1.0–1.35 default). */
async function demandMultiplier() {
  if (!learningPg.usePostgres()) return 1;
  try {
    const { query } = require("../db/pool");
    const { rows } = await query(`SELECT COUNT(*)::int AS c FROM learning_sessions WHERE status = 'live'`, []);
    const n = rows[0]?.c || 0;
    const cap = numEnv("CCWEB_DEMAND_MULT_CAP", 1.35);
    const step = numEnv("CCWEB_DEMAND_MULT_PER_LIVE_SESSION", 0.02);
    return Math.min(cap, 1 + n * step);
  } catch {
    return 1;
  }
}

function basePriceUsd(kind) {
  switch (kind) {
    case "scan":
      return numEnv("CCWEB_PRICE_SCAN_USD", 0.39);
    case "intelligence":
      return numEnv("CCWEB_PRICE_INTEL_USD", 0.15);
    case "ai_platform":
      return numEnv("CCWEB_PRICE_AI_RUN_USD", 0.08);
    default:
      return 0;
  }
}

function creditCentsFor(kind) {
  const usd = basePriceUsd(kind);
  return Math.max(1, Math.round(usd * 100 * numEnv("CCWEB_CREDIT_MARKUP", 1)));
}

/**
 * @returns {Promise<{ priceUsd: number, multiplier: number }>}
 */
async function quotePayPerUse(kind) {
  const mult = await demandMultiplier();
  const base = basePriceUsd(kind);
  return { priceUsd: +(base * mult).toFixed(4), multiplier: mult, baseUsd: base };
}

/**
 * Enforce monthly quota or debit credits for pay-per-use.
 * @param {'scan'|'intelligence'|'ai_platform'} usageKind
 * @returns {Promise<{ ok: boolean, reason?: string, tier?: string, limits?: object, used?: object, chargedCreditsCents?: number, upsell?: object }>}
 */
async function enforcePaywall(userId, usageKind) {
  if (!userId) {
    return {
      ok: false,
      reason: "auth_required",
      upsell: {
        code: "SIGN_IN",
        title: "Sign in to continue",
        detail: "Create a free account to get monthly allowances and optional credit packs.",
      },
    };
  }
  if (!learningPg.usePostgres()) {
    return { ok: true, tier: "free", limits: tierLimits("free"), used: {}, note: "no_database_metering" };
  }

  const tier = await monPg.getEffectiveTier(userId);
  const limits = tierLimits(tier);
  const row = await monPg.getUsageRow(userId);
  const scans = row?.scan_count ?? 0;
  const intel = row?.intelligence_calls ?? 0;
  const aiRuns = row?.ai_platform_runs ?? 0;

  const used = { scans, intelligenceCalls: intel, aiPlatformRuns: aiRuns };

  let limitKey;
  let current;
  if (usageKind === "scan") {
    limitKey = limits.scansPerMonth;
    current = scans;
  } else if (usageKind === "intelligence") {
    limitKey = limits.intelligencePerMonth;
    current = intel;
  } else if (usageKind === "ai_platform") {
    limitKey = limits.aiPlatformRunsPerMonth;
    current = aiRuns;
  } else {
    return { ok: true, tier, limits, used };
  }

  if (current < limitKey) {
    return { ok: true, tier, limits, used };
  }

  const credits = await learningPg.getCreditBalanceCents(userId);
  const need = creditCentsFor(usageKind);
  if (credits >= need) {
    await learningPg.debitCreditsGeneric(userId, need, `paywall_${usageKind}`);
    const q = await quotePayPerUse(usageKind);
    await monPg.recordMeteringEvent({
      userId,
      kind: `overage_${usageKind}`,
      amountUsd: q.priceUsd,
      platformShareUsd: q.priceUsd,
      metadata: { creditsCents: need, tier, demandMultiplier: q.multiplier },
    });
    return { ok: true, tier, limits, used, chargedCreditsCents: need, payPerUse: true };
  }

  const q = await quotePayPerUse(usageKind);
  return {
    ok: false,
    reason: "limit_exceeded",
    tier,
    limits,
    used,
    neededCreditsCents: need,
    balanceCreditsCents: credits,
    quotedPriceUsd: q.priceUsd,
    upsell: {
      code: "CREDITS_OR_SUBSCRIPTION",
      title: "Upgrade or add credits",
      detail: `You've reached the ${tier} monthly limit for this feature. Buy credits or upgrade to Pro/Premium for higher allowances.`,
      checkoutHint: "POST /api/payments/stripe/checkout/learning with kind credits or subscription",
    },
  };
}

async function afterSuccessfulUse(userId, usageKind) {
  if (!userId || !monPg.usePostgres()) return;
  const field =
    usageKind === "scan"
      ? "scan"
      : usageKind === "intelligence"
        ? "intelligence"
        : usageKind === "ai_platform"
          ? "ai_platform"
          : null;
  if (field) await monPg.bumpUsage(userId, field);
}

/**
 * Developer API hub: bill micro-transaction when over monthly automation quota (wallet credits).
 */
async function hubAutomationCharge(projectId, kind) {
  const ownerUserId = await resolveProjectOwner(projectId);
  if (!ownerUserId) return { ok: true, skipped: true };

  const tier = await monPg.getEffectiveTier(ownerUserId);
  const row = await monPg.getUsageRow(ownerUserId);
  const agents = row?.hub_agent_runs ?? 0;
  const wfs = row?.hub_workflow_runs ?? 0;

  const limAgents = tier === "premium" ? 50000 : tier === "pro" ? 2000 : numEnv("CCWEB_LIMIT_FREE_HUB_AGENTS", 40);
  const limWf = tier === "premium" ? 50000 : tier === "pro" ? 800 : numEnv("CCWEB_LIMIT_FREE_HUB_WORKFLOWS", 15);

  const isAgent = kind === "hub_agent";
  const used = isAgent ? agents : wfs;
  const limit = isAgent ? limAgents : limWf;

  if (used < limit) {
    await monPg.bumpUsage(ownerUserId, isAgent ? "hub_agent" : "hub_workflow");
    return { ok: true, tier, used: used + 1, limit };
  }

  const base = numEnv(isAgent ? "CCWEB_HUB_AGENT_USD" : "CCWEB_HUB_WORKFLOW_USD", isAgent ? 0.12 : 0.18);
  const mult = await demandMultiplier();
  const gross = +(base * mult).toFixed(4);
  const cents = Math.max(1, Math.round(gross * 100));

  const bal = await learningPg.getCreditBalanceCents(ownerUserId);
  if (bal < cents) {
    return {
      ok: false,
      reason: "hub_quota_exceeded",
      tier,
      neededCreditsCents: cents,
      balanceCreditsCents: bal,
      upsell: {
        code: "CREDITS_OR_PRO",
        title: "Automation quota exceeded",
        detail: "Add credits or upgrade for higher Business Hub automation limits.",
      },
    };
  }

  await learningPg.debitCreditsGeneric(ownerUserId, cents, `hub_${kind}`);
  await monPg.bumpUsage(ownerUserId, isAgent ? "hub_agent" : "hub_workflow");
  await monPg.recordMeteringEvent({
    userId: ownerUserId,
    projectId,
    kind: isAgent ? "hub_agent_overage" : "hub_workflow_overage",
    amountUsd: gross,
    platformShareUsd: gross,
    metadata: { creditsCents: cents, demandMultiplier: mult },
  });
  return { ok: true, chargedCreditsCents: cents, tier };
}

async function resolveProjectOwner(projectId) {
  try {
    const dp = require("../developerPlatform");
    const p = dp.projects.get(projectId);
    return p?.ownerUserId || null;
  } catch {
    return null;
  }
}

module.exports = {
  tierLimits,
  demandMultiplier,
  quotePayPerUse,
  enforcePaywall,
  afterSuccessfulUse,
  hubAutomationCharge,
  creditCentsFor,
};
