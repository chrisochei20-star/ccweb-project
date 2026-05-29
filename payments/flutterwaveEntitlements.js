/**
 * Post-payment entitlement snapshot for client refresh (no fake unlocks — DB-backed only).
 */

const learningPg = require("../db/persistenceLearning");
const monPg = require("../db/persistenceMonetization");

async function buildPaymentEntitlements(userId) {
  if (!userId || !learningPg.usePostgres()) {
    return { tier: "free", subscription: null, creditsCents: 0, postgres: false };
  }
  const profile = await learningPg.userLearningProfile(userId);
  const tier = await monPg.getEffectiveTier(userId);
  return {
    postgres: true,
    tier,
    subscription: profile?.subscription ?? null,
    creditsCents: profile?.creditsCents ?? 0,
    xp: profile?.xp ?? 0,
  };
}

module.exports = { buildPaymentEntitlements };
