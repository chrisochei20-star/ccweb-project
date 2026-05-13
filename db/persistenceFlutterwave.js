/**
 * Flutterwave monetization persistence: transactions, wallets, payouts queue, fulfillment.
 */

const crypto = require("crypto");
const { query } = require("./pool");
const learningPg = require("./persistenceLearning");
const coursesPg = require("./persistenceCourses");

function usePostgres() {
  return Boolean((process.env.DATABASE_URL || "").trim());
}

function newId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

function platformFeeBps() {
  const n = Number(process.env.CCWEB_CREATOR_PLATFORM_FEE_BPS || 1200);
  return Number.isFinite(n) && n >= 0 && n <= 9000 ? n : 1200;
}

function splitCreatorAmount(amountMinor, feeBps) {
  const pf = Math.floor((Number(amountMinor) * feeBps) / 10000);
  const creator = Number(amountMinor) - pf;
  return { platformFeeMinor: pf, creatorMinor: Math.max(0, creator) };
}

async function ensureCcwebUser(userId) {
  if (!usePostgres() || !userId) return;
  await query(`INSERT INTO ccweb_users (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`, [userId]);
}

async function ensureWallet(userId) {
  await ensureCcwebUser(userId);
  await query(
    `INSERT INTO ccweb_internal_wallets (user_id) VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );
}

async function getWallet(userId) {
  if (!usePostgres() || !userId) return null;
  await ensureWallet(userId);
  const { rows } = await query(
    `SELECT balance_usd_cents, balance_ngn, ai_credits_cents, updated_at FROM ccweb_internal_wallets WHERE user_id = $1`,
    [userId]
  );
  const r = rows[0];
  if (!r) return null;
  return {
    balanceUsdCents: Number(r.balance_usd_cents),
    balanceNgn: Number(r.balance_ngn),
    aiCreditsCents: Number(r.ai_credits_cents),
    updatedAt: r.updated_at,
  };
}

async function bumpWallet(userId, { usdCents = 0, ngn = 0, aiCents = 0 } = {}) {
  await ensureWallet(userId);
  await query(
    `UPDATE ccweb_internal_wallets SET
       balance_usd_cents = balance_usd_cents + $2,
       balance_ngn = balance_ngn + $3,
       ai_credits_cents = ai_credits_cents + $4,
       updated_at = NOW()
     WHERE user_id = $1`,
    [userId, usdCents, ngn, aiCents]
  );
}

async function insertPendingTx({
  userId,
  txRef,
  amountMinor,
  currency,
  kind,
  creatorUserId = null,
  metadata = {},
}) {
  if (!usePostgres()) return null;
  await ensureCcwebUser(userId);
  const id = newId("flw");
  await query(
    `INSERT INTO ccweb_flutterwave_transactions (id, user_id, tx_ref, amount_minor, currency, status, kind, creator_user_id, metadata)
     VALUES ($1,$2,$3,$4,$5,'pending',$6,$7,$8::jsonb)`,
    [id, userId, txRef, amountMinor, currency, kind, creatorUserId, JSON.stringify(metadata || {})]
  );
  return id;
}

async function listUserTransactions(userId, limit = 50) {
  if (!usePostgres() || !userId) return [];
  const lim = Math.min(200, Math.max(1, limit));
  const { rows } = await query(
    `SELECT id, user_id, tx_ref, amount_minor, currency, status, kind, flw_tx_id, creator_user_id, metadata, created_at, updated_at
     FROM ccweb_flutterwave_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [userId, lim]
  );
  return rows.map(mapTxRow);
}

async function listCreatorIncoming(creatorUserId, limit = 50) {
  if (!usePostgres() || !creatorUserId) return [];
  const lim = Math.min(200, Math.max(1, limit));
  const { rows } = await query(
    `SELECT id, user_id, tx_ref, amount_minor, currency, status, kind, flw_tx_id, creator_user_id, metadata, created_at, updated_at
     FROM ccweb_flutterwave_transactions
     WHERE creator_user_id = $1 AND status = 'completed' AND kind IN ('course_purchase','creator_tip','ai_tool_unlock')
     ORDER BY created_at DESC LIMIT $2`,
    [creatorUserId, lim]
  );
  return rows.map(mapTxRow);
}

function mapTxRow(r) {
  return {
    id: r.id,
    txRef: r.tx_ref,
    amountMinor: Number(r.amount_minor),
    currency: r.currency,
    status: r.status,
    kind: r.kind,
    flwTxId: r.flw_tx_id,
    creatorUserId: r.creator_user_id,
    payerUserId: r.user_id,
    metadata: typeof r.metadata === "object" ? r.metadata : {},
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

async function insertPayoutRequest(creatorUserId, amountMinor, currency, bankMeta = {}) {
  if (!usePostgres()) return null;
  await ensureCcwebUser(creatorUserId);
  const id = newId("po");
  await query(
    `INSERT INTO ccweb_payout_requests (id, creator_user_id, amount_minor, currency, status, bank_meta)
     VALUES ($1,$2,$3,$4,'pending',$5::jsonb)`,
    [id, creatorUserId, amountMinor, currency, JSON.stringify(bankMeta || {})]
  );
  return id;
}

async function listPayoutRequests(creatorUserId, limit = 40) {
  if (!usePostgres() || !creatorUserId) return [];
  const { rows } = await query(
    `SELECT id, amount_minor, currency, status, bank_meta, flw_transfer_id, created_at, updated_at
     FROM ccweb_payout_requests WHERE creator_user_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [creatorUserId, Math.min(100, Math.max(1, limit))]
  );
  return rows.map((r) => ({
    id: r.id,
    amountMinor: Number(r.amount_minor),
    currency: r.currency,
    status: r.status,
    bankMeta: typeof r.bank_meta === "object" ? r.bank_meta : {},
    flwTransferId: r.flw_transfer_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

async function creatorEarningsSummary(creatorUserId) {
  if (!usePostgres() || !creatorUserId) return { completedTxCount: 0, estimatedShareUsdCents: 0, estimatedShareNgn: 0, internalWallet: null };
  const fee = platformFeeBps();
  const { rows: cnt } = await query(
    `SELECT COUNT(*)::int AS c FROM ccweb_flutterwave_transactions
     WHERE creator_user_id = $1 AND status = 'completed' AND kind IN ('course_purchase','creator_tip','ai_tool_unlock')`,
    [creatorUserId]
  );
  const { rows } = await query(
    `SELECT currency,
            COALESCE(SUM((amount_minor - FLOOR(amount_minor * $2 / 10000.0))::bigint), 0)::bigint AS share_minor
     FROM ccweb_flutterwave_transactions
     WHERE creator_user_id = $1 AND status = 'completed' AND kind IN ('course_purchase','creator_tip','ai_tool_unlock')
     GROUP BY currency`,
    [creatorUserId, fee]
  );
  let usdCents = 0;
  let ngn = 0;
  for (const r of rows) {
    if (r.currency === "USD") usdCents += Number(r.share_minor || 0);
    if (r.currency === "NGN") ngn += Number(r.share_minor || 0);
  }
  const w = await getWallet(creatorUserId);
  return {
    estimatedShareUsdCents: usdCents,
    estimatedShareNgn: ngn,
    completedTxCount: Number(cnt[0]?.c || 0),
    internalWallet: w,
  };
}

/**
 * Mark tx completed (idempotent) and apply business fulfillment.
 * @param {string} txRef
 * @param {object} data Flutterwave `data` object from webhook or verify response
 */
async function applySuccessfulCharge(txRef, data) {
  if (!usePostgres() || !txRef || !data) return { applied: false, reason: "bad_input" };
  const flwId = data.id != null ? String(data.id) : null;
  const status = (data.status || "").toLowerCase();
  if (status !== "successful") return { applied: false, reason: "not_successful" };

  const charged = Number(data.charged_amount != null ? data.charged_amount : data.amount);
  const currency = String(data.currency || "NGN").toUpperCase().slice(0, 8);
  if (!Number.isFinite(charged) || charged <= 0) return { applied: false, reason: "bad_amount" };

  const minorFromFlw = Math.round(charged * 100);

  const { rows } = await query(
    `UPDATE ccweb_flutterwave_transactions
     SET status = 'completed', flw_tx_id = COALESCE($2, flw_tx_id), updated_at = NOW()
     WHERE tx_ref = $1 AND status = 'pending'
     RETURNING *`,
    [txRef, flwId]
  );
  const row = rows[0];
  if (!row) {
    const { rows: ex } = await query(`SELECT status FROM ccweb_flutterwave_transactions WHERE tx_ref = $1`, [txRef]);
    if (ex[0]?.status === "completed") return { applied: false, reason: "already_completed" };
    return { applied: false, reason: "unknown_tx_ref" };
  }

  if (Number(row.amount_minor) !== minorFromFlw) {
    await query(`UPDATE ccweb_flutterwave_transactions SET status = 'amount_mismatch', updated_at = NOW() WHERE id = $1`, [row.id]);
    return { applied: false, reason: "amount_mismatch" };
  }

  const kind = row.kind;
  const userId = row.user_id;
  const meta = typeof row.metadata === "object" ? row.metadata : {};
  const feeBps = platformFeeBps();
  const { platformFeeMinor, creatorMinor } = splitCreatorAmount(row.amount_minor, feeBps);

  if (kind === "course_purchase" && meta.courseId) {
    await coursesPg.recordCoursePurchase(userId, meta.courseId, row.id);
    const course = await coursesPg.getCourseById(meta.courseId);
    const cid = course?.creatorUserId || row.creator_user_id;
    if (cid && creatorMinor > 0) {
      if (currency === "USD") await bumpWallet(cid, { usdCents: creatorMinor });
      else await bumpWallet(cid, { ngn: creatorMinor });
      await query(
        `INSERT INTO ccweb_earnings (id, user_id, source, amount_usd, currency, reference_type, reference_id, metadata)
         VALUES ($1,$2,'flutterwave_creator_share', $3, $4, 'flutterwave_tx', $5, $6::jsonb)`,
        [
          newId("earn"),
          cid,
          currency === "USD" ? creatorMinor / 100 : 0,
          currency,
          row.id,
          JSON.stringify({ kind, courseId: meta.courseId, platformFeeMinor }),
        ]
      );
    }
  } else if (kind === "creator_tip" && row.creator_user_id) {
    const cid = row.creator_user_id;
    if (creatorMinor > 0) {
      if (currency === "USD") await bumpWallet(cid, { usdCents: creatorMinor });
      else await bumpWallet(cid, { ngn: creatorMinor });
      await query(
        `INSERT INTO ccweb_earnings (id, user_id, source, amount_usd, currency, reference_type, reference_id, metadata)
         VALUES ($1,$2,'flutterwave_tip', $3, $4, 'flutterwave_tx', $5, $6::jsonb)`,
        [newId("earn"), cid, currency === "USD" ? creatorMinor / 100 : 0, currency, row.id, JSON.stringify({ platformFeeMinor })]
      );
    }
  } else if (kind === "platform_subscription") {
    const tier = String(meta.targetTier || "pro").slice(0, 32);
    const days = Number(meta.periodDays || 30) || 30;
    const end = new Date(Date.now() + days * 86400000);
    await learningPg.setSubscriptionActive(userId, tier, null, `flutterwave:${row.id}`, end);
    const bonus = Number(process.env.FLUTTERWAVE_SUB_BONUS_CREDITS_CENTS || 500);
    if (bonus > 0) await learningPg.addCreditsCents(userId, bonus);
  } else if (kind === "ai_credit_pack") {
    const pack = Number(meta.creditsCents || row.amount_minor) || 0;
    if (pack > 0) {
      await bumpWallet(userId, { aiCents: pack });
      await learningPg.addCreditsCents(userId, pack);
    }
  } else if (kind === "ai_tool_unlock" && row.creator_user_id) {
    const cid = row.creator_user_id;
    if (creatorMinor > 0) {
      if (currency === "USD") await bumpWallet(cid, { usdCents: creatorMinor });
      else await bumpWallet(cid, { ngn: creatorMinor });
    }
    await bumpWallet(userId, { aiCents: Math.max(0, Math.floor(row.amount_minor / 10)) });
  }

  if (platformFeeMinor > 0) {
    await query(
      `INSERT INTO ccweb_metering_events (id, user_id, kind, amount_usd, platform_share_usd, metadata)
       VALUES ($1,$2,'flutterwave_platform_fee', $3, $3, $4::jsonb)`,
      [newId("met"), userId, currency === "USD" ? platformFeeMinor / 100 : 0, JSON.stringify({ txRef, currency, platformFeeMinor })]
    );
  }

  return { applied: true, id: row.id, kind };
}

module.exports = {
  usePostgres,
  getWallet,
  bumpWallet,
  insertPendingTx,
  listUserTransactions,
  listCreatorIncoming,
  insertPayoutRequest,
  listPayoutRequests,
  creatorEarningsSummary,
  applySuccessfulCharge,
  platformFeeBps,
};
