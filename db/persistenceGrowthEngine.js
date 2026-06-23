/**
 * Viral growth: referrals, XP events, badges, streaks, lightweight analytics.
 * PostgreSQL when DATABASE_URL set; in-memory fallback for dev.
 */

const crypto = require("crypto");
const { query } = require("./pool");
const learningPg = require("./persistenceLearning");

function usePostgres() {
  return Boolean((process.env.DATABASE_URL || "").trim());
}

function newId(prefix) {
  return `${prefix}_${crypto.randomBytes(6).toString("hex")}`;
}

const mem = {
  codes: new Map(),
  codeToUser: new Map(),
  referredBy: new Map(),
  events: [],
  streaks: new Map(),
  badges: new Map(),
  analytics: { signups: 0, referrals: 0, events: 0 },
};

const REF_CREDIT_CENTS = Number(process.env.CCWEB_REFERRAL_BONUS_CENTS || 250);
const REF_XP = Number(process.env.CCWEB_REFERRAL_XP || 150);
const REF_REFERRER_XP = Number(process.env.CCWEB_REFERRER_XP || 200);

function randomCode() {
  return crypto.randomBytes(5).toString("hex");
}

async function ensureReferralCode(userId) {
  if (!userId) return null;
  if (usePostgres()) {
    const { rows } = await query(`SELECT code FROM ccweb_referral_codes WHERE user_id = $1`, [userId]);
    if (rows[0]?.code) return rows[0].code;
    for (let i = 0; i < 8; i += 1) {
      const code = randomCode();
      try {
        await query(`INSERT INTO ccweb_referral_codes (user_id, code) VALUES ($1,$2)`, [userId, code]);
        return code;
      } catch (e) {
        if (e.code !== "23505") throw e;
      }
    }
    throw new Error("Could not allocate referral code.");
  }
  let c = mem.codes.get(userId);
  if (!c) {
    do {
      c = randomCode();
    } while (mem.codeToUser.has(c));
    mem.codes.set(userId, c);
    mem.codeToUser.set(c, userId);
  }
  return c;
}

async function resolveUserIdFromCode(code) {
  const c = String(code || "").trim().toLowerCase();
  if (!c) return null;
  if (usePostgres()) {
    const { rows } = await query(`SELECT user_id FROM ccweb_referral_codes WHERE lower(code) = lower($1)`, [c]);
    return rows[0]?.user_id || null;
  }
  return mem.codeToUser.get(c) || null;
}

async function setReferredByIfEmpty(userId, referrerId) {
  if (!userId || !referrerId || userId === referrerId) return { ok: false };
  if (usePostgres()) {
    const { rows } = await query(`SELECT referred_by_user_id FROM ccweb_auth_users WHERE id = $1`, [userId]);
    if (rows[0]?.referred_by_user_id) return { ok: false, reason: "already_set" };
    await query(`UPDATE ccweb_auth_users SET referred_by_user_id = $2, updated_at = NOW() WHERE id = $1 AND referred_by_user_id IS NULL`, [
      userId,
      referrerId,
    ]);
    mem.analytics.referrals += 1;
    return { ok: true };
  }
  if (mem.referredBy.has(userId)) return { ok: false, reason: "already_set" };
  mem.referredBy.set(userId, referrerId);
  mem.analytics.referrals += 1;
  return { ok: true };
}

async function recordEvent(userId, eventType, metadata = {}) {
  if (!userId) return;
  const meta = typeof metadata === "object" && metadata ? metadata : {};
  if (usePostgres()) {
    await query(`INSERT INTO ccweb_growth_events (id, user_id, event_type, metadata) VALUES ($1,$2,$3,$4::jsonb)`, [
      newId("gev"),
      userId,
      eventType,
      JSON.stringify(meta),
    ]);
  } else {
    mem.events.unshift({ userId, eventType, metadata: meta, at: new Date().toISOString() });
    while (mem.events.length > 2000) mem.events.pop();
  }
  mem.analytics.events += 1;

  if (eventType === "session_attended" || eventType === "ai_tool_used") {
    await maybeRewardReferrer(userId, eventType);
  }
}

async function maybeRewardReferrer(refereeId, trigger) {
  if (!usePostgres() || !learningPg.usePostgres()) return;
  const { rows } = await query(`SELECT referred_by_user_id FROM ccweb_auth_users WHERE id = $1`, [refereeId]);
  const referrerId = rows[0]?.referred_by_user_id;
  if (!referrerId) return;

  const { rows: existing } = await query(
    `SELECT 1 FROM ccweb_growth_events WHERE event_type = 'referral_conversion' AND metadata->>'refereeId' = $1 LIMIT 1`,
    [refereeId]
  );
  if (existing.length) return;

  await query(`INSERT INTO ccweb_growth_events (id, user_id, event_type, metadata) VALUES ($1,$2,'referral_conversion',$3::jsonb)`, [
    newId("gev"),
    referrerId,
    JSON.stringify({ refereeId, trigger, creditsCents: REF_CREDIT_CENTS, xp: REF_REFERRER_XP }),
  ]);

  await learningPg.addCreditsCents(referrerId, REF_CREDIT_CENTS);
  await learningPg.addXpDelta(referrerId, REF_REFERRER_XP);
  await learningPg.addCreditsCents(refereeId, REF_CREDIT_CENTS);
  await learningPg.addXpDelta(refereeId, REF_XP);

  await awardBadge(referrerId, "community_builder");
  await awardBadge(refereeId, "early_supporter");
}

async function awardBadge(userId, badgeId) {
  if (!usePostgres()) return;
  await query(
    `INSERT INTO ccweb_user_badges (user_id, badge_id) VALUES ($1,$2) ON CONFLICT (user_id, badge_id) DO NOTHING`,
    [userId, badgeId]
  );
}

async function pingDaily(userId) {
  const today = new Date().toISOString().slice(0, 10);
  if (usePostgres()) {
    const { rows } = await query(`SELECT * FROM ccweb_login_streaks WHERE user_id = $1`, [userId]);
    const row = rows[0];
    if (!row) {
      await query(
        `INSERT INTO ccweb_login_streaks (user_id, current_streak, longest_streak, last_login_date, streak_bonus_claimed)
         VALUES ($1,1,1,$2::date,FALSE)`,
        [userId, today]
      );
      await learningPg.addXpDelta(userId, 5);
      await recordEvent(userId, "daily_login", { streak: 1 });
      return { streak: 1, longest: 1, bonusCreditsCents: 0 };
    }
    const last = row.last_login_date ? String(row.last_login_date).slice(0, 10) : null;
    if (last === today) {
      return { streak: row.current_streak, longest: row.longest_streak, bonusCreditsCents: 0 };
    }
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().slice(0, 10);
    let next = 1;
    if (last === yStr) next = row.current_streak + 1;
    const longest = Math.max(row.longest_streak || 0, next);
    await query(
      `UPDATE ccweb_login_streaks SET current_streak = $2, longest_streak = $3, last_login_date = $4::date, updated_at = NOW() WHERE user_id = $1`,
      [userId, next, longest, today]
    );
    let bonus = 0;
    if (next % 7 === 0) {
      bonus = Number(process.env.CCWEB_STREAK_7_BONUS_CENTS || 100);
      await learningPg.addCreditsCents(userId, bonus);
    }
    await learningPg.addXpDelta(userId, 10 + Math.min(50, next));
    await recordEvent(userId, "daily_login", { streak: next });
    return { streak: next, longest, bonusCreditsCents: bonus };
  }
  const prev = mem.streaks.get(userId) || { last: null, streak: 0, longest: 0 };
  if (prev.last === today) return { streak: prev.streak, longest: prev.longest, bonusCreditsCents: 0 };
  const next = prev.last && daysApart(prev.last, today) === 1 ? prev.streak + 1 : 1;
  const longest = Math.max(prev.longest, next);
  mem.streaks.set(userId, { last: today, streak: next, longest });
  return { streak: next, longest, bonusCreditsCents: 0 };
}

function daysApart(a, b) {
  const d1 = new Date(a).getTime();
  const d2 = new Date(b).getTime();
  return Math.round((d2 - d1) / (86400 * 1000));
}

async function listBadges(userId) {
  if (usePostgres()) {
    const { rows } = await query(`SELECT badge_id, earned_at FROM ccweb_user_badges WHERE user_id = $1 ORDER BY earned_at ASC`, [
      userId,
    ]);
    return rows.map((r) => ({ id: r.badge_id, earnedAt: new Date(r.earned_at).toISOString() }));
  }
  return [];
}

async function referralStats(userId) {
  const code = await ensureReferralCode(userId);
  let invited = 0;
  let converted = 0;
  if (usePostgres()) {
    const { rows: inv } = await query(`SELECT COUNT(*)::int AS c FROM ccweb_auth_users WHERE referred_by_user_id = $1`, [
      userId,
    ]);
    invited = inv[0]?.c || 0;
    const { rows: conv } = await query(
      `SELECT COUNT(*)::int AS c FROM ccweb_growth_events WHERE user_id = $1 AND event_type = 'referral_conversion'`,
      [userId]
    );
    converted = conv[0]?.c || 0;
  }
  const rate = invited ? converted / invited : 0;
  return { referralCode: code, invitedCount: invited, convertedCount: converted, conversionRate: Math.round(rate * 1000) / 1000 };
}

async function leaderboards(limit = 25) {
  const lim = Math.min(100, Math.max(5, limit));
  if (!usePostgres()) {
    return { topXp: [], topCredits: [], topReferrers: [] };
  }
  const topXp = await query(
    `SELECT w.user_id, w.xp, p.display_name, p.avatar_url
     FROM learning_user_wallet w
     LEFT JOIN ccweb_user_profiles p ON p.user_id = w.user_id
     ORDER BY w.xp DESC NULLS LAST LIMIT $1`,
    [lim]
  );
  const topCredits = await query(
    `SELECT w.user_id, w.credits_cents, p.display_name, p.avatar_url
     FROM learning_user_wallet w
     LEFT JOIN ccweb_user_profiles p ON p.user_id = w.user_id
     ORDER BY w.credits_cents DESC NULLS LAST LIMIT $1`,
    [lim]
  );
  const topReferrers = await query(
    `SELECT a.referred_by_user_id AS uid, COUNT(*)::int AS cnt, p.display_name, p.avatar_url
     FROM ccweb_auth_users a
     LEFT JOIN ccweb_user_profiles p ON p.user_id = a.referred_by_user_id
     WHERE a.referred_by_user_id IS NOT NULL
     GROUP BY a.referred_by_user_id, p.display_name, p.avatar_url
     ORDER BY cnt DESC LIMIT $1`,
    [lim]
  );
  return {
    topXp: topXp.rows.map((r) => ({ userId: r.user_id, displayName: r.display_name || r.user_id.slice(0,8), avatarUrl: r.avatar_url, xp: Number(r.xp) })),
    topCredits: topCredits.rows.map((r) => ({ userId: r.user_id, displayName: r.display_name || r.user_id.slice(0,8), avatarUrl: r.avatar_url, creditsCents: Number(r.credits_cents) })),
    topReferrers: topReferrers.rows.map((r) => ({ userId: r.uid, displayName: r.display_name || r.uid.slice(0,8), avatarUrl: r.avatar_url, referrals: r.cnt })),
  };
}

async function growthAnalyticsSummary() {
  if (!usePostgres()) {
    return { postgres: false, ...mem.analytics };
  }
  const [{ rows: users }, { rows: refs }, { rows: ev }] = await Promise.all([
    query(`SELECT COUNT(*)::int AS c FROM ccweb_auth_users`, []),
    query(`SELECT COUNT(*)::int AS c FROM ccweb_auth_users WHERE referred_by_user_id IS NOT NULL`, []),
    query(`SELECT COUNT(*)::int AS c FROM ccweb_growth_events`, []),
  ]);
  return {
    postgres: true,
    totalUsers: users[0]?.c || 0,
    referredSignups: refs[0]?.c || 0,
    growthEvents: ev[0]?.c || 0,
  };
}

async function onUserLogin(userId) {
  return pingDaily(userId);
}

module.exports = {
  usePostgres,
  ensureReferralCode,
  resolveUserIdFromCode,
  setReferredByIfEmpty,
  recordEvent,
  pingDaily,
  onUserLogin,
  listBadges,
  referralStats,
  leaderboards,
  growthAnalyticsSummary,
  REF_CREDIT_CENTS,
};
