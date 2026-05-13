/**
 * Flutterwave monetization persistence: transactions, wallets, payouts queue, fulfillment.
 */

const crypto = require("crypto");
const { query, getPool } = require("./pool");
const learningPg = require("./persistenceLearning");
const coursesPg = require("./persistenceCourses");
const payoutCrypto = require("../services/payoutFieldCrypto");

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
     WHERE creator_user_id = $1 AND status = 'completed' AND kind IN ('course_purchase','creator_tip','ai_tool_unlock','marketplace_sku')
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

function parseJson(val, fallback) {
  if (val && typeof val === "object") return val;
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

async function payoutRiskFlags(creatorUserId, amountMinor, currency, wallet) {
  const flags = [];
  const cur = String(currency || "USD").toUpperCase();
  const minUsd = Number(process.env.CCWEB_PAYOUT_MIN_USD_CENTS || 2000);
  const minNgn = Number(process.env.CCWEB_PAYOUT_MIN_NGN_MINOR || 500000);
  if (cur === "USD" && amountMinor < minUsd) flags.push("below_min_usd");
  if (cur === "NGN" && amountMinor < minNgn) flags.push("below_min_ngn");
  const maxUsd = Number(process.env.CCWEB_PAYOUT_MAX_USD_MINOR || 10_000_000);
  const maxNgn = Number(process.env.CCWEB_PAYOUT_MAX_NGN_MINOR || 1_000_000_000);
  if (cur === "USD" && amountMinor > maxUsd) flags.push("above_max_usd");
  if (cur === "NGN" && amountMinor > maxNgn) flags.push("above_max_ngn");
  const { rows: pc } = await query(
    `SELECT COUNT(*)::int AS c FROM ccweb_payout_requests
     WHERE creator_user_id = $1
       AND status IN ('pending_review','approved','transfer_submitted')
       AND created_at > NOW() - INTERVAL '24 hours'`,
    [creatorUserId]
  );
  const maxP = Number(process.env.CCWEB_PAYOUT_MAX_ACTIVE_PER_24H || 3);
  if (Number(pc[0]?.c || 0) >= maxP) flags.push("velocity_24h");
  const balUsd = wallet?.balanceUsdCents ?? 0;
  const balNgn = wallet?.balanceNgn ?? 0;
  if (cur === "USD" && amountMinor > balUsd) flags.push("insufficient_wallet");
  if (cur === "NGN" && amountMinor > balNgn) flags.push("insufficient_wallet");
  return flags;
}

/**
 * @returns {Promise<{ ok: true, id: string } | { ok: false, code: string, riskFlags?: string[] }>}
 */
async function createPayoutRequest(creatorUserId, amountMinor, currency, bank = {}) {
  if (!usePostgres()) return { ok: false, code: "NO_DATABASE" };
  if (!payoutCrypto.isConfigured()) return { ok: false, code: "encryption_unconfigured" };
  const cur = String(currency || "USD").toUpperCase();
  if (cur !== "USD" && cur !== "NGN") return { ok: false, code: "bad_currency" };
  const minor = Math.round(Number(amountMinor));
  if (!Number.isFinite(minor) || minor <= 0) return { ok: false, code: "bad_amount" };

  const acct = String(bank.account_number || bank.accountNumber || "").replace(/\s/g, "");
  const bankCode = String(bank.account_bank || bank.accountBank || "").trim();
  const beneficiaryName = String(bank.beneficiary_name || bank.beneficiaryName || "").trim();
  if (!acct || !bankCode || !beneficiaryName) return { ok: false, code: "bank_fields_required" };

  await ensureCcwebUser(creatorUserId);
  const wallet = await getWallet(creatorUserId);
  const riskFlags = await payoutRiskFlags(creatorUserId, minor, cur, wallet);
  const blockers = riskFlags;
  if (blockers.length) return { ok: false, code: "risk_check_failed", riskFlags };

  const sensitive = {
    account_number: acct,
    account_bank: bankCode,
    beneficiary_name: beneficiaryName,
    bank_name: bank.bank_name ? String(bank.bank_name).slice(0, 120) : undefined,
    routing_number: bank.routing_number ? String(bank.routing_number).slice(0, 32) : undefined,
  };
  const enc = payoutCrypto.encryptJson(sensitive);
  if (!enc) return { ok: false, code: "encrypt_failed" };
  const hint = payoutCrypto.bankHintFromPayload(sensitive);
  const publicMeta = {
    country: String(bank.country || (cur === "NGN" ? "NG" : "US")).slice(0, 8),
    currency: cur,
  };

  const id = newId("po");
  await query(
    `INSERT INTO ccweb_payout_requests (
       id, creator_user_id, amount_minor, currency, status, bank_meta, risk_flags, encrypted_bank, bank_hint
     ) VALUES ($1,$2,$3,$4,'pending_review',$5::jsonb,$6::jsonb,$7,$8)`,
    [id, creatorUserId, minor, cur, JSON.stringify(publicMeta), JSON.stringify(riskFlags), enc, hint]
  );
  return { ok: true, id, riskFlags };
}

/** @deprecated name — use createPayoutRequest */
async function insertPayoutRequest(creatorUserId, amountMinor, currency, bankMeta = {}) {
  const out = await createPayoutRequest(creatorUserId, amountMinor, currency, bankMeta);
  if (out && out.ok) return out.id;
  const err = new Error(out.code || "payout_rejected");
  err.code = out.code;
  err.riskFlags = out.riskFlags;
  throw err;
}

function mapPayoutRowPublic(r) {
  return {
    id: r.id,
    amountMinor: Number(r.amount_minor),
    currency: r.currency,
    status: r.status,
    bankHint: r.bank_hint || null,
    riskFlags: parseJson(r.risk_flags, []),
    flwTransferId: r.flw_transfer_id,
    transferRef: r.transfer_ref || null,
    reviewedAt: r.reviewed_at || null,
    rejectReason: r.reject_reason || null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

async function listPayoutRequests(creatorUserId, limit = 40) {
  if (!usePostgres() || !creatorUserId) return [];
  const { rows } = await query(
    `SELECT id, amount_minor, currency, status, bank_hint, risk_flags, flw_transfer_id, transfer_ref,
            reviewed_at, reject_reason, created_at, updated_at
     FROM ccweb_payout_requests WHERE creator_user_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [creatorUserId, Math.min(100, Math.max(1, limit))]
  );
  return rows.map(mapPayoutRowPublic);
}

async function listPayoutRequestsAdmin({ status = null, limit = 60 } = {}) {
  if (!usePostgres()) return [];
  const lim = Math.min(200, Math.max(1, limit));
  if (status) {
    const { rows } = await query(
      `SELECT id, creator_user_id, amount_minor, currency, status, bank_hint, risk_flags, flw_transfer_id, transfer_ref,
              reviewed_at, reviewed_by, reject_reason, created_at, updated_at
       FROM ccweb_payout_requests WHERE status = $1 ORDER BY created_at DESC LIMIT $2`,
      [String(status), lim]
    );
    return rows.map((r) => ({ ...mapPayoutRowPublic(r), creatorUserId: r.creator_user_id, reviewedBy: r.reviewed_by }));
  }
  const { rows } = await query(
    `SELECT id, creator_user_id, amount_minor, currency, status, bank_hint, risk_flags, flw_transfer_id, transfer_ref,
            reviewed_at, reviewed_by, reject_reason, created_at, updated_at
     FROM ccweb_payout_requests ORDER BY created_at DESC LIMIT $1`,
    [lim]
  );
  return rows.map((r) => ({ ...mapPayoutRowPublic(r), creatorUserId: r.creator_user_id, reviewedBy: r.reviewed_by }));
}

async function getPayoutRequestById(id) {
  if (!usePostgres() || !id) return null;
  const { rows } = await query(`SELECT * FROM ccweb_payout_requests WHERE id = $1 LIMIT 1`, [id]);
  return rows[0] || null;
}

async function getPayoutByTransferRef(ref) {
  if (!usePostgres() || !ref) return null;
  const { rows } = await query(`SELECT * FROM ccweb_payout_requests WHERE transfer_ref = $1 LIMIT 1`, [String(ref)]);
  return rows[0] || null;
}

async function approvePayoutRequest(id, reviewedBy) {
  const { rows } = await query(
    `UPDATE ccweb_payout_requests SET status = 'approved', reviewed_at = NOW(), reviewed_by = $2, updated_at = NOW()
     WHERE id = $1 AND status = 'pending_review' RETURNING id`,
    [id, String(reviewedBy || "admin").slice(0, 120)]
  );
  return rows[0]?.id || null;
}

async function rejectPayoutRequest(id, reviewedBy, reason) {
  const { rows } = await query(
    `UPDATE ccweb_payout_requests SET status = 'rejected', reviewed_at = NOW(), reviewed_by = $2,
        reject_reason = $3, updated_at = NOW()
     WHERE id = $1 AND status = 'pending_review' RETURNING id`,
    [id, String(reviewedBy || "admin").slice(0, 120), String(reason || "").slice(0, 2000)]
  );
  return rows[0]?.id || null;
}

async function markPayoutTransferSubmitted(id, { flwTransferId, transferRef, meta = {} }) {
  await query(
    `UPDATE ccweb_payout_requests SET status = 'transfer_submitted', flw_transfer_id = $2,
        transfer_ref = COALESCE($3, transfer_ref),
        transfer_meta = COALESCE(transfer_meta, '{}'::jsonb) || $4::jsonb, updated_at = NOW()
     WHERE id = $1 AND status = 'approved'`,
    [id, flwTransferId ? String(flwTransferId) : null, transferRef || null, JSON.stringify(meta)]
  );
}

async function finalizePayoutPaidFromWebhook(payoutRowId) {
  const pool = getPool();
  if (!pool) return { ok: false, reason: "no_pool" };
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(`SELECT * FROM ccweb_payout_requests WHERE id = $1 FOR UPDATE`, [payoutRowId]);
    const pr = rows[0];
    if (!pr) {
      await client.query("ROLLBACK");
      return { ok: false, reason: "missing" };
    }
    if (pr.status === "paid") {
      await client.query("COMMIT");
      return { ok: true, reason: "already_paid" };
    }
    if (pr.status !== "transfer_submitted") {
      await client.query("ROLLBACK");
      return { ok: false, reason: "not_transfer_submitted" };
    }
    const uid = pr.creator_user_id;
    const minor = Number(pr.amount_minor);
    const cur = String(pr.currency).toUpperCase();
    let debit;
    if (cur === "USD") {
      debit = await client.query(
        `UPDATE ccweb_internal_wallets SET balance_usd_cents = balance_usd_cents - $2, updated_at = NOW()
         WHERE user_id = $1 AND balance_usd_cents >= $2 RETURNING user_id`,
        [uid, minor]
      );
    } else {
      debit = await client.query(
        `UPDATE ccweb_internal_wallets SET balance_ngn = balance_ngn - $2, updated_at = NOW()
         WHERE user_id = $1 AND balance_ngn >= $2 RETURNING user_id`,
        [uid, minor]
      );
    }
    if (!debit.rows[0]) {
      await client.query("ROLLBACK");
      return { ok: false, reason: "debit_failed" };
    }
    await client.query(`UPDATE ccweb_payout_requests SET status = 'paid', updated_at = NOW() WHERE id = $1`, [payoutRowId]);
    await client.query("COMMIT");
    return { ok: true };
  } catch (e) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* */
    }
    throw e;
  } finally {
    client.release();
  }
}

async function markPayoutTransferFailed(payoutRowId, reason) {
  await query(
    `UPDATE ccweb_payout_requests SET status = 'failed', reject_reason = COALESCE($2, reject_reason), updated_at = NOW()
     WHERE id = $1 AND status = 'transfer_submitted'`,
    [payoutRowId, reason ? String(reason).slice(0, 2000) : null]
  );
}

/**
 * Flutterwave transfer webhook / poll: move payout to paid and debit internal wallet once.
 * @param {object} data webhook `data` for transfer events
 */
async function applyTransferNotification(data) {
  if (!usePostgres() || !data) return { applied: false, reason: "bad_input" };
  const ref = data.reference != null ? String(data.reference) : "";
  const flwId = data.id != null ? String(data.id) : "";
  let row = ref ? await getPayoutByTransferRef(ref) : null;
  if (!row && flwId) {
    const { rows } = await query(`SELECT * FROM ccweb_payout_requests WHERE flw_transfer_id = $1 LIMIT 1`, [flwId]);
    row = rows[0] || null;
  }
  if (!row) return { applied: false, reason: "payout_not_found" };
  const st = String(data.status || data.transfer_status || "").toLowerCase();
  if (st === "successful" || st === "completed" || st === "success") {
    const out = await finalizePayoutPaidFromWebhook(row.id);
    return out.ok ? { applied: true, payoutId: row.id } : { applied: false, reason: out.reason };
  }
  if (st === "failed" || st === "failure" || st === "error") {
    await markPayoutTransferFailed(row.id, data.complete_message || data.message || "transfer_failed");
    return { applied: true, failed: true, payoutId: row.id };
  }
  return { applied: false, reason: "noop_status", status: st };
}

async function adminFlutterwaveRevenueSnapshot() {
  if (!usePostgres()) return null;
  const { rows: feeRows } = await query(
    `SELECT COALESCE(SUM(amount_usd), 0)::float AS platform_fee_usd
     FROM ccweb_metering_events WHERE kind = 'flutterwave_platform_fee'`,
    []
  );
  const { rows: txRows } = await query(
    `SELECT currency, COUNT(*)::int AS c,
            COALESCE(SUM(amount_minor), 0)::bigint AS volume_minor
     FROM ccweb_flutterwave_transactions WHERE status = 'completed' GROUP BY currency`,
    []
  );
  const { rows: payoutRows } = await query(
    `SELECT status, COUNT(*)::int AS c FROM ccweb_payout_requests GROUP BY status`,
    []
  );
  return {
    platformFeeUsdApprox: Number(feeRows[0]?.platform_fee_usd || 0),
    completedChargesByCurrency: txRows.map((r) => ({
      currency: r.currency,
      count: Number(r.c),
      volumeMinor: Number(r.volume_minor),
    })),
    payoutQueue: payoutRows.map((r) => ({ status: r.status, count: Number(r.c) })),
  };
}

async function creatorEarningsSummary(creatorUserId) {
  if (!usePostgres() || !creatorUserId) return { completedTxCount: 0, estimatedShareUsdCents: 0, estimatedShareNgn: 0, internalWallet: null };
  const fee = platformFeeBps();
  const { rows: cnt } = await query(
    `SELECT COUNT(*)::int AS c FROM ccweb_flutterwave_transactions
     WHERE creator_user_id = $1 AND status = 'completed' AND kind IN ('course_purchase','creator_tip','ai_tool_unlock','marketplace_sku')`,
    [creatorUserId]
  );
  const { rows } = await query(
    `SELECT currency,
            COALESCE(SUM((amount_minor - FLOOR(amount_minor * $2 / 10000.0))::bigint), 0)::bigint AS share_minor
     FROM ccweb_flutterwave_transactions
     WHERE creator_user_id = $1 AND status = 'completed' AND kind IN ('course_purchase','creator_tip','ai_tool_unlock','marketplace_sku')
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
  } else if (kind === "marketplace_sku") {
    const mp = require("./persistenceMarketplace");
    await mp.fulfillMarketplaceSkuFromTx(row);
  }

  if (platformFeeMinor > 0 && kind !== "marketplace_sku") {
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
  createPayoutRequest,
  insertPayoutRequest,
  listPayoutRequests,
  listPayoutRequestsAdmin,
  getPayoutRequestById,
  getPayoutByTransferRef,
  approvePayoutRequest,
  rejectPayoutRequest,
  markPayoutTransferSubmitted,
  finalizePayoutPaidFromWebhook,
  markPayoutTransferFailed,
  applyTransferNotification,
  adminFlutterwaveRevenueSnapshot,
  creatorEarningsSummary,
  applySuccessfulCharge,
  platformFeeBps,
  splitCreatorAmount,
};
