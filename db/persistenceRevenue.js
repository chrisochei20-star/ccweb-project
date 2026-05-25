/**
 * Revenue aggregates from platform_transactions (payment captures and similar).
 */

const { query } = require("./pool");

function usePostgres() {
  return Boolean((process.env.DATABASE_URL || "").trim());
}

/**
 * Sum captured USD attributed to a developer project (JSON metadata).
 */
async function sumCapturedForProject(projectId) {
  if (!usePostgres()) return null;
  const pid = String(projectId || "").trim();
  if (!pid) return { grossUsd: 0, netUsd: 0, platformFeeUsd: 0, count: 0, byKind: [] };

  const { rows: sumRow } = await query(
    `SELECT COALESCE(SUM(amount_usd), 0)::numeric AS gross,
            COUNT(*)::int AS cnt
     FROM platform_transactions
     WHERE status = 'captured'
       AND amount_usd IS NOT NULL
       AND (
         metadata->>'projectId' = $1
         OR metadata->>'ccwebProjectId' = $1
       )`,
    [pid]
  );

  const { rows: byKind } = await query(
    `SELECT kind, COALESCE(SUM(amount_usd), 0)::numeric AS total
     FROM platform_transactions
     WHERE status = 'captured'
       AND (
         metadata->>'projectId' = $1
         OR metadata->>'ccwebProjectId' = $1
       )
     GROUP BY kind
     ORDER BY total DESC`,
    [pid]
  );

  const grossUsd = Number(sumRow[0]?.gross || 0);
  const feePct = Number(process.env.CCWEB_PLATFORM_REVENUE_SHARE_PCT || 8);
  const platformFeeUsd = +((grossUsd * feePct) / 100).toFixed(2);
  const netUsd = +(grossUsd - platformFeeUsd).toFixed(2);

  return {
    grossUsd,
    netUsd,
    platformFeeUsd,
    platformFeePercent: feePct,
    count: sumRow[0]?.cnt || 0,
    byKind: byKind.map((r) => ({ kind: r.kind, amountUsd: Number(r.total) })),
  };
}

async function sumAllCaptured() {
  if (!usePostgres()) return null;
  const { rows } = await query(
    `SELECT COALESCE(SUM(amount_usd), 0)::numeric AS gross, COUNT(*)::int AS cnt
     FROM platform_transactions WHERE status = 'captured' AND amount_usd IS NOT NULL`,
    []
  );
  return { grossUsd: Number(rows[0]?.gross || 0), count: rows[0]?.cnt || 0 };
}

/**
 * Idempotent insert for legacy Stripe checkout captures (unique reference_id per session).
 */
async function recordStripeCheckoutCapture({
  kind,
  referenceId,
  amountUsd,
  metadata = {},
}) {
  if (!usePostgres()) return { skipped: true };
  const ref = String(referenceId || "").trim();
  if (!ref || amountUsd == null || Number(amountUsd) <= 0) return { skipped: true };
  const exists = await query(`SELECT 1 FROM platform_transactions WHERE reference_id = $1 AND provider = 'stripe' LIMIT 1`, [
    ref,
  ]);
  if (exists.rows.length) return { skipped: true, duplicate: true };
  await query(
    `INSERT INTO platform_transactions (kind, reference_id, provider, amount_usd, currency, status, metadata)
     VALUES ($1, $2, 'stripe', $3, 'USD', 'captured', $4::jsonb)`,
    [kind, ref, Number(amountUsd).toFixed(2), JSON.stringify(metadata)]
  );
  return { ok: true };
}

async function insertPendingFlutterwave({ referenceId, amountUsd, metadata }) {
  if (!usePostgres()) return { skipped: true };
  await query(
    `INSERT INTO platform_transactions (kind, reference_id, provider, amount_usd, currency, status, metadata)
     VALUES ('flutterwave_pending', $1, 'flutterwave', $2, 'USD', 'pending', $3::jsonb)`,
    [String(referenceId), Number(amountUsd).toFixed(2), JSON.stringify(metadata || {})]
  );
  return { ok: true };
}

async function deletePendingFlutterwave(referenceId) {
  if (!usePostgres()) return;
  await query(
    `DELETE FROM platform_transactions WHERE reference_id = $1 AND provider = 'flutterwave' AND status = 'pending'`,
    [String(referenceId)]
  );
}

/**
 * Idempotent insert for Flutterwave-verified captures (reference_id = Flutterwave transaction id).
 */
async function recordFlutterwaveCapture({ kind, referenceId, amountUsd, metadata = {} }) {
  if (!usePostgres()) return { skipped: true };
  const ref = String(referenceId || "").trim();
  if (!ref || amountUsd == null || Number(amountUsd) <= 0) return { skipped: true };
  const exists = await query(
    `SELECT 1 FROM platform_transactions WHERE reference_id = $1 AND provider = 'flutterwave' AND status = 'captured' LIMIT 1`,
    [ref]
  );
  if (exists.rows.length) return { skipped: true, duplicate: true };
  await query(
    `INSERT INTO platform_transactions (kind, reference_id, provider, amount_usd, currency, status, metadata)
     VALUES ($1, $2, 'flutterwave', $3, 'USD', 'captured', $4::jsonb)`,
    [kind, ref, Number(amountUsd).toFixed(2), JSON.stringify(metadata)]
  );
  return { ok: true };
}

async function isFlutterwaveTxnCaptured(flwTransactionId) {
  if (!usePostgres()) return false;
  const { rows } = await query(
    `SELECT 1 FROM platform_transactions WHERE provider = 'flutterwave' AND status = 'captured' AND reference_id = $1 LIMIT 1`,
    [String(flwTransactionId)]
  );
  return rows.length > 0;
}

async function findPendingFlutterwaveCharge(txRef) {
  if (!usePostgres()) return null;
  const { rows } = await query(
    `SELECT * FROM platform_transactions
     WHERE reference_id = $1 AND provider = 'flutterwave' AND status = 'pending' LIMIT 1`,
    [String(txRef)]
  );
  return rows[0] || null;
}

module.exports = {
  usePostgres,
  sumCapturedForProject,
  sumAllCaptured,
  recordStripeCheckoutCapture,
  insertPendingFlutterwave,
  deletePendingFlutterwave,
  recordFlutterwaveCapture,
  isFlutterwaveTxnCaptured,
  findPendingFlutterwaveCharge,
};
