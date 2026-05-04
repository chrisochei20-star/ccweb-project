/**
 * PostgreSQL persistence for monetized AI streaming / tutor (Stripe-backed).
 * No-op when DATABASE_URL unset — callers should keep in-memory streaming only.
 */

const crypto = require("crypto");
const { query } = require("./pool");

function usePostgres() {
  return Boolean((process.env.DATABASE_URL || "").trim());
}

function newId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

function money(n) {
  return +Number(n || 0).toFixed(2);
}

async function upsertSessionFromStreamRoom(room) {
  if (!usePostgres()) return null;
  const hourly = money(room.hourlyParticipationUsd ?? process.env.CCWEB_LEARNING_HOURLY_USD ?? 4.99);
  const platformPct = money(room.platformRevenueSharePercent ?? 25);
  const sid = room.learningSessionId || newId("lsn");
  room.learningSessionId = sid;
  await query(
    `INSERT INTO learning_sessions (id, stream_room_id, title, topic, created_by, status, hourly_rate_usd, platform_fee_percent, started_at, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(), $9::jsonb)
     ON CONFLICT (stream_room_id) DO UPDATE SET
       title = EXCLUDED.title,
       topic = EXCLUDED.topic,
       status = EXCLUDED.status,
       hourly_rate_usd = EXCLUDED.hourly_rate_usd,
       platform_fee_percent = EXCLUDED.platform_fee_percent,
       metadata = COALESCE(learning_sessions.metadata, '{}'::jsonb) || EXCLUDED.metadata`,
    [
      sid,
      room.id,
      room.roomName,
      room.topic,
      room.createdBy,
      room.status === "finished" ? "finished" : "live",
      hourly,
      platformPct,
      JSON.stringify({ curriculum: room.tutoringSchedule?.curriculumFields || [] }),
    ]
  );
  const { rows } = await query("SELECT * FROM learning_sessions WHERE stream_room_id = $1", [room.id]);
  return rows[0] || null;
}

async function getSessionByStreamRoomId(streamRoomId) {
  if (!usePostgres()) return null;
  const { rows } = await query("SELECT * FROM learning_sessions WHERE stream_room_id = $1", [streamRoomId]);
  return rows[0] || null;
}

async function markSessionFinished(streamRoomId) {
  if (!usePostgres()) return;
  await query(
    `UPDATE learning_sessions SET status = 'finished', ended_at = NOW() WHERE stream_room_id = $1`,
    [streamRoomId]
  );
}

async function createPendingAccess({ sessionId, userId, hours, amountUsd, platformUsd, creatorUsd, stripeCheckoutSessionId }) {
  const id = newId("acc");
  await query(
    `INSERT INTO learning_access (id, session_id, user_id, hours_purchased, hours_consumed, amount_usd, platform_fee_usd, creator_share_usd, status, stripe_checkout_session_id)
     VALUES ($1,$2,$3,$4,0,$5,$6,$7,'pending_payment',$8)`,
    [id, sessionId, userId, hours, amountUsd, platformUsd, creatorUsd, stripeCheckoutSessionId || null]
  );
  return id;
}

async function attachCheckoutSessionToAccess(accessId, stripeSessionId) {
  await query(`UPDATE learning_access SET stripe_checkout_session_id = $2, updated_at = NOW() WHERE id = $1`, [
    accessId,
    stripeSessionId,
  ]);
}

async function activateAccessByCheckoutSession(stripeSessionId, paymentIntentId) {
  const { rows } = await query(`SELECT * FROM learning_access WHERE stripe_checkout_session_id = $1`, [stripeSessionId]);
  const row = rows[0];
  if (!row) return null;
  await query(
    `UPDATE learning_access SET status = 'active', stripe_payment_intent_id = COALESCE($2, stripe_payment_intent_id), updated_at = NOW() WHERE id = $1`,
    [row.id, paymentIntentId || null]
  );
  await query(`INSERT INTO platform_transactions (kind, reference_id, provider, amount_usd, currency, status, metadata)
     VALUES ('learning_access', $1, 'stripe', $2, 'USD', 'captured', $3::jsonb)`, [
    row.id,
    money(row.amount_usd),
    JSON.stringify({ userId: row.user_id, sessionId: row.session_id, hours: row.hours_purchased }),
  ]);
  return row;
}

async function userHasActiveAccess(sessionId, userId) {
  const { rows } = await query(
    `SELECT COALESCE(SUM(hours_purchased - hours_consumed),0)::float AS h FROM learning_access
     WHERE session_id = $1 AND user_id = $2 AND status = 'active'`,
    [sessionId, userId]
  );
  const hours = Number(rows[0]?.h || 0);
  if (hours > 0.01) return { ok: true, hoursRemaining: hours };
  const sub = await getActiveSubscription(userId);
  if (sub && (sub.tier === "standard" || sub.tier === "premium")) return { ok: true, hoursRemaining: null, via: "subscription", tier: sub.tier };
  const credits = await getCreditBalanceCents(userId);
  if (credits >= 50) return { ok: true, hoursRemaining: null, via: "credits", creditsCents: credits };
  return { ok: false };
}

async function consumeAccessHours(sessionId, userId, hours) {
  const { rows } = await query(
    `SELECT * FROM learning_access WHERE session_id = $1 AND user_id = $2 AND status = 'active' ORDER BY created_at ASC`,
    [sessionId, userId]
  );
  let remaining = hours;
  for (const r of rows) {
    if (remaining <= 0) break;
    const avail = Number(r.hours_purchased) - Number(r.hours_consumed);
    if (avail <= 0) continue;
    const take = Math.min(avail, remaining);
    await query(`UPDATE learning_access SET hours_consumed = hours_consumed + $1, updated_at = NOW() WHERE id = $2`, [
      take,
      r.id,
    ]);
    remaining -= take;
  }
}

async function upsertParticipation(sessionId, streamRoomId, userId, watchMinutes, interactionScore) {
  if (!usePostgres()) return;
  await query(
    `INSERT INTO learning_participation (id, session_id, stream_room_id, user_id, watch_minutes, interaction_score, last_seen_at)
     VALUES ($1,$2,$3,$4,$5,$6,NOW())
     ON CONFLICT (session_id, user_id) DO UPDATE SET
       watch_minutes = GREATEST(learning_participation.watch_minutes, EXCLUDED.watch_minutes),
       interaction_score = GREATEST(learning_participation.interaction_score, EXCLUDED.interaction_score),
       last_seen_at = NOW()`,
    [newId("part"), sessionId, streamRoomId, userId, Math.round(watchMinutes), Math.round(interactionScore)]
  );
}

async function finalizeSessionRevenue(streamRoomId, attendances) {
  if (!usePostgres()) return { skipped: true };
  const sess = await getSessionByStreamRoomId(streamRoomId);
  if (!sess) return { skipped: true };
  if (sess.revenue_closed) return { skipped: true, alreadyClosed: true };
  const hourly = money(sess.hourly_rate_usd);
  const platformPct = money(sess.platform_fee_percent);
  let lines = 0;
  for (const a of attendances) {
    const hours = Math.max(0, Number(a.watchMinutes || 0) / 60);
    const gross = money(hours * hourly);
    if (gross <= 0) continue;
    const platform = money((gross * platformPct) / 100);
    const creator = money(gross - platform);
    await query(
      `INSERT INTO learning_revenue_ledger (id, session_id, user_id, watch_minutes, gross_usd, platform_usd, creator_usd, source)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'session_close')`,
      [newId("lrn"), sess.id, a.userId, Math.round(a.watchMinutes || 0), gross, platform, creator]
    );
    lines += 1;
  }
  await query(
    `UPDATE learning_sessions ls SET
      total_gross_usd = sub.g,
      total_platform_usd = sub.p,
      total_creator_usd = sub.c
     FROM (SELECT session_id, SUM(gross_usd) g, SUM(platform_usd) p, SUM(creator_usd) c FROM learning_revenue_ledger WHERE session_id = $1 GROUP BY session_id) sub
     WHERE ls.id = sub.session_id`,
    [sess.id]
  );
  return { lines };
}

async function addCredits(userId, cents, stripeSessionId) {
  await query(
    `INSERT INTO learning_user_wallet (user_id, credits_cents, xp, updated_at)
     VALUES ($1,$2,0,NOW())
     ON CONFLICT (user_id) DO UPDATE SET credits_cents = learning_user_wallet.credits_cents + $2, updated_at = NOW()`,
    [userId, Math.round(cents)]
  );
  await query(
    `INSERT INTO platform_transactions (kind, reference_id, provider, amount_usd, currency, status, metadata)
     VALUES ('learning_credits', $1, 'stripe', $2, 'USD', 'captured', $3::jsonb)`,
    [stripeSessionId || userId, money(cents / 100), JSON.stringify({ userId, cents })]
  );
}

async function getCreditBalanceCents(userId) {
  const { rows } = await query(`SELECT credits_cents FROM learning_user_wallet WHERE user_id = $1`, [userId]);
  return rows[0] ? Number(rows[0].credits_cents) : 0;
}

async function debitCreditsForMinutes(userId, minutes, hourlyUsd) {
  const cents = Math.round((minutes / 60) * hourlyUsd * 100);
  if (cents <= 0) return { ok: true, chargedCents: 0 };
  const bal = await getCreditBalanceCents(userId);
  if (bal < cents) return { ok: false, neededCents: cents, balanceCents: bal };
  await query(`UPDATE learning_user_wallet SET credits_cents = credits_cents - $1, updated_at = NOW() WHERE user_id = $2`, [
    cents,
    userId,
  ]);
  return { ok: true, chargedCents: cents };
}

async function getActiveSubscription(userId) {
  const { rows } = await query(
    `SELECT tier, status, current_period_end FROM learning_subscriptions WHERE user_id = $1 AND status = 'active' ORDER BY current_period_end DESC NULLS LAST LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

async function setSubscriptionActive(userId, tier, stripeCustomerId, stripeSubId, periodEnd) {
  await query(
    `INSERT INTO learning_subscriptions (id, user_id, tier, status, stripe_customer_id, stripe_subscription_id, current_period_end)
     VALUES ($1,$2,$3,'active',$4,$5,$6)
     ON CONFLICT (user_id) DO UPDATE SET
       tier = EXCLUDED.tier,
       status = 'active',
       stripe_customer_id = COALESCE(EXCLUDED.stripe_customer_id, learning_subscriptions.stripe_customer_id),
       stripe_subscription_id = EXCLUDED.stripe_subscription_id,
       current_period_end = EXCLUDED.current_period_end,
       updated_at = NOW()`,
    [newId("sub"), userId, tier, stripeCustomerId, stripeSubId, periodEnd]
  );
}

async function recordTutorEvent(userId, messageLen, xpDelta) {
  await query(
    `INSERT INTO learning_user_wallet (user_id, credits_cents, xp, updated_at)
     VALUES ($1,0,$2,NOW())
     ON CONFLICT (user_id) DO UPDATE SET xp = learning_user_wallet.xp + $2, updated_at = NOW()`,
    [userId, xpDelta]
  );
  await query(
    `INSERT INTO learning_tutor_events (id, user_id, event_type, metadata) VALUES ($1,$2,'message', $3::jsonb)`,
    [newId("tut"), userId, JSON.stringify({ messageLen })]
  );
}

async function analyticsSummary() {
  const s = await query(
    `SELECT
       (SELECT COUNT(*)::int FROM learning_sessions WHERE status = 'live') AS active_sessions,
       (SELECT COALESCE(SUM(total_gross_usd),0) FROM learning_sessions) AS lifetime_gross,
       (SELECT COALESCE(SUM(total_platform_usd),0) FROM learning_sessions) AS lifetime_platform,
       (SELECT COUNT(*)::int FROM learning_revenue_ledger) AS ledger_rows`
  );
  return s.rows[0];
}

async function userLearningProfile(userId) {
  const w = await query(`SELECT credits_cents, xp FROM learning_user_wallet WHERE user_id = $1`, [userId]);
  const sub = await getActiveSubscription(userId);
  const parts = await query(
    `SELECT p.session_id, p.watch_minutes, p.last_seen_at, s.title FROM learning_participation p
     JOIN learning_sessions s ON s.id = p.session_id WHERE p.user_id = $1 ORDER BY p.last_seen_at DESC LIMIT 20`,
    [userId]
  );
  return {
    userId,
    creditsCents: w.rows[0] ? Number(w.rows[0].credits_cents) : 0,
    xp: w.rows[0] ? Number(w.rows[0].xp) : 0,
    subscription: sub,
    recentSessions: parts.rows.map((r) => ({
      sessionId: r.session_id,
      title: r.title,
      watchMinutes: r.watch_minutes,
      lastSeenAt: r.last_seen_at,
    })),
  };
}

async function markSessionRevenueClosed(streamRoomId) {
  if (!usePostgres()) return;
  await query(
    `UPDATE learning_sessions SET revenue_closed = TRUE, status = 'finished', ended_at = COALESCE(ended_at, NOW()) WHERE stream_room_id = $1`,
    [streamRoomId]
  );
}

async function listLiveSessionsWithStreamIds() {
  if (!usePostgres()) return [];
  const { rows } = await query(
    `SELECT id, stream_room_id, title, status, hourly_rate_usd, platform_fee_percent, total_gross_usd, total_platform_usd, started_at
     FROM learning_sessions WHERE status = 'live' ORDER BY started_at DESC LIMIT 50`,
    []
  );
  return rows;
}

async function listRecentLedger(limit = 50) {
  if (!usePostgres()) return [];
  const { rows } = await query(
    `SELECT l.id, l.session_id, l.user_id, l.watch_minutes, l.gross_usd, l.platform_usd, l.creator_usd, l.created_at, s.title AS session_title, s.stream_room_id
     FROM learning_revenue_ledger l
     JOIN learning_sessions s ON s.id = l.session_id
     ORDER BY l.created_at DESC LIMIT $1`,
    [Math.min(200, Math.max(1, limit))]
  );
  return rows;
}

async function getLearningSessionDetail(streamRoomId) {
  if (!usePostgres()) return null;
  const sess = await getSessionByStreamRoomId(streamRoomId);
  if (!sess) return null;
  const { rows: ledger } = await query(
    `SELECT user_id, watch_minutes, gross_usd, platform_usd, creator_usd, created_at FROM learning_revenue_ledger WHERE session_id = $1 ORDER BY created_at DESC`,
    [sess.id]
  );
  return { session: sess, ledger: ledger };
}

module.exports = {
  usePostgres,
  money,
  upsertSessionFromStreamRoom,
  getSessionByStreamRoomId,
  markSessionFinished,
  createPendingAccess,
  activateAccessByCheckoutSession,
  userHasActiveAccess,
  consumeAccessHours,
  upsertParticipation,
  finalizeSessionRevenue,
  addCredits,
  getCreditBalanceCents,
  debitCreditsForMinutes,
  getActiveSubscription,
  setSubscriptionActive,
  recordTutorEvent,
  analyticsSummary,
  userLearningProfile,
  attachCheckoutSessionToAccess,
  markSessionRevenueClosed,
  listLiveSessionsWithStreamIds,
  listRecentLedger,
  getLearningSessionDetail,
};
