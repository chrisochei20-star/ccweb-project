/**
 * Apply referral code + acquisition source after user row exists (PostgreSQL).
 */

const { query } = require("./pool");
const {
  resolveUserIdFromCode,
  setReferredByIfEmpty,
} = require("./persistenceGrowthEngine");

function usePostgres() {
  return Boolean((process.env.DATABASE_URL || "").trim());
}

async function applyReferralAttribution(userId, opts = {}) {
  if (!userId || !usePostgres()) return { ok: false };
  const code = String(opts.referralCode || opts.ref || "").trim();
  const src = String(opts.acquisitionSource || opts.utm_source || "").trim().slice(0, 120);
  if (src) {
    await query(
      `UPDATE ccweb_auth_users SET acquisition_source = COALESCE(acquisition_source, $2), updated_at = NOW()
       WHERE id = $1 AND (acquisition_source IS NULL OR acquisition_source = '')`,
      [userId, src]
    );
  }
  if (!code) return { ok: true };
  const referrerId = await resolveUserIdFromCode(code);
  if (!referrerId) return { ok: false, reason: "invalid_code" };
  const out = await setReferredByIfEmpty(userId, referrerId);
  return out;
}

module.exports = { applyReferralAttribution };
