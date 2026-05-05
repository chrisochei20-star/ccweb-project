/**
 * Metering, monthly usage, and revenue-adjacent audit rows for CCWEB monetization.
 */

const crypto = require("crypto");
const { query } = require("./pool");
const learningPg = require("./persistenceLearning");

function usePostgres() {
  return Boolean((process.env.DATABASE_URL || "").trim());
}

function newId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

function monthStart(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

/** Maps learning_subscriptions.tier to monetization tier */
function normalizeMonTier(subRow) {
  if (!subRow || subRow.status !== "active") return "free";
  const t = String(subRow.tier || "").toLowerCase();
  if (t === "premium") return "premium";
  if (t === "standard" || t === "pro") return "pro";
  return "free";
}

async function getEffectiveTier(userId) {
  if (!userId || !usePostgres()) return "free";
  const sub = await learningPg.getActiveSubscription(userId);
  return normalizeMonTier(sub);
}

async function getUsageRow(userId, periodMonth = monthStart()) {
  if (!usePostgres() || !userId) return null;
  const pm = periodMonth.toISOString().slice(0, 10);
  const { rows } = await query(
    `SELECT * FROM ccweb_monetization_usage_monthly WHERE user_id = $1 AND period_month = $2::date`,
    [userId, pm]
  );
  return rows[0] || null;
}

async function bumpUsage(userId, field) {
  if (!usePostgres() || !userId) return;
  const pm = monthStart().toISOString().slice(0, 10);
  const tier = await getEffectiveTier(userId);
  const col =
    field === "scan"
      ? "scan_count"
      : field === "intelligence"
        ? "intelligence_calls"
        : field === "ai_platform"
          ? "ai_platform_runs"
          : field === "hub_agent"
            ? "hub_agent_runs"
            : field === "hub_workflow"
              ? "hub_workflow_runs"
              : null;
  if (!col) return;
  await query(
    `INSERT INTO ccweb_monetization_usage_monthly (user_id, period_month, tier, ${col})
     VALUES ($1, $2::date, $3, 1)
     ON CONFLICT (user_id, period_month) DO UPDATE SET
       tier = EXCLUDED.tier,
       ${col} = ccweb_monetization_usage_monthly.${col} + 1,
       updated_at = NOW()`,
    [userId, pm, tier]
  );
}

async function recordMeteringEvent({ userId, projectId, kind, amountUsd, platformShareUsd, metadata }) {
  if (!usePostgres()) return;
  const meta = typeof metadata === "object" && metadata ? metadata : {};
  await query(
    `INSERT INTO ccweb_metering_events (id, user_id, project_id, kind, amount_usd, platform_share_usd, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)`,
    [
      newId("mtr"),
      userId || null,
      projectId ? String(projectId) : null,
      String(kind || "unknown"),
      Number(amountUsd || 0).toFixed(4),
      Number(platformShareUsd || 0).toFixed(4),
      JSON.stringify(meta),
    ]
  );
}

async function sumMeteringByKind(sinceDays = 90) {
  if (!usePostgres()) return [];
  const d = Math.min(3650, Math.max(1, sinceDays));
  const { rows } = await query(
    `SELECT kind,
            COALESCE(SUM(amount_usd),0)::numeric AS gross,
            COALESCE(SUM(platform_share_usd),0)::numeric AS platform
     FROM ccweb_metering_events
     WHERE created_at >= NOW() - ($1 * INTERVAL '1 day')
     GROUP BY kind
     ORDER BY gross DESC`,
    [d]
  );
  return rows.map((r) => ({
    kind: r.kind,
    grossUsd: Number(r.gross),
    platformUsd: Number(r.platform),
  }));
}

async function topPayingUsersByStripe(limit = 25) {
  if (!usePostgres()) return [];
  const { rows } = await query(
    `SELECT
       COALESCE(metadata->>'userId', '') AS user_id,
       COALESCE(SUM(amount_usd),0)::numeric AS total_usd,
       COUNT(*)::int AS tx_count
     FROM platform_transactions
     WHERE status = 'captured'
       AND amount_usd IS NOT NULL
       AND metadata->>'userId' IS NOT NULL
       AND metadata->>'userId' <> ''
     GROUP BY 1
     ORDER BY total_usd DESC
     LIMIT $1`,
    [Math.min(100, Math.max(1, limit))]
  );
  return rows
    .filter((r) => r.user_id)
    .map((r) => ({
      userId: r.user_id,
      totalUsd: Number(r.total_usd),
      transactionCount: r.tx_count,
    }));
}

async function platformTransactionsByKind() {
  if (!usePostgres()) return [];
  const { rows } = await query(
    `SELECT kind, COALESCE(SUM(amount_usd),0)::numeric AS total, COUNT(*)::int AS cnt
     FROM platform_transactions WHERE status = 'captured' AND amount_usd IS NOT NULL
     GROUP BY kind ORDER BY total DESC`,
    []
  );
  return rows.map((r) => ({ kind: r.kind, amountUsd: Number(r.total), count: r.cnt }));
}

async function stripeRevenueTrend(days = 14) {
  if (!usePostgres()) return [];
  const d = Math.min(730, Math.max(7, days));
  const { rows } = await query(
    `SELECT date_trunc('day', created_at AT TIME ZONE 'UTC')::date AS day,
            COALESCE(SUM(amount_usd),0)::numeric AS total
     FROM platform_transactions
     WHERE status = 'captured' AND amount_usd IS NOT NULL
       AND created_at >= NOW() - ($1 * INTERVAL '1 day')
     GROUP BY 1 ORDER BY 1`,
    [d]
  );
  return rows.map((r) => ({ day: r.day, amountUsd: Number(r.total) }));
}

/**
 * Roll-up for admin dashboard: Stripe captures + metering + learning ledger splits.
 */
async function adminRevenueOverview({ meteringDays = 90, trendDays = 14 } = {}) {
  if (!usePostgres()) return null;
  const { rows: pt } = await query(
    `SELECT COALESCE(SUM(amount_usd),0)::numeric AS gross, COUNT(*)::int AS cnt FROM platform_transactions WHERE status = 'captured' AND amount_usd IS NOT NULL`,
    []
  );
  const { rows: escrow } = await query(
    `SELECT COALESCE(SUM(amount_usd),0)::numeric AS g FROM platform_transactions WHERE status = 'captured' AND kind LIKE '%escrow%'`,
    []
  );
  const { rows: learnStripe } = await query(
    `SELECT COALESCE(SUM(amount_usd),0)::numeric AS g FROM platform_transactions WHERE status = 'captured' AND (kind LIKE 'learning%' OR kind = 'learning_subscription_invoice')`,
    []
  );
  const byKind = await platformTransactionsByKind();
  const metering = await sumMeteringByKind(meteringDays);
  const trend = await stripeRevenueTrend(trendDays);
  const topPayers = await topPayingUsersByStripe(20);

  const { rows: ls } = await query(
    `SELECT COALESCE(SUM(total_gross_usd),0)::numeric AS gross,
            COALESCE(SUM(total_platform_usd),0)::numeric AS platform,
            COALESCE(SUM(total_creator_usd),0)::numeric AS creator
     FROM learning_sessions`,
    []
  );
  const { rows: led } = await query(
    `SELECT COALESCE(SUM(gross_usd),0)::numeric AS g,
            COALESCE(SUM(platform_usd),0)::numeric AS p,
            COALESCE(SUM(creator_usd),0)::numeric AS c
     FROM learning_revenue_ledger`,
    []
  );

  return {
    stripe: {
      capturedGrossUsd: Number(pt[0]?.gross || 0),
      transactionCount: pt[0]?.cnt || 0,
      escrowUsd: Number(escrow[0]?.g || 0),
      learningCheckoutUsd: Number(learnStripe[0]?.g || 0),
      byKind,
      dailyTrend: trend,
    },
    creditMetering: {
      windowDays: meteringDays,
      byKind: metering,
      note: "Estimated platform revenue from wallet credits debited over quota (see ccweb_metering_events).",
    },
    aiStreaming: {
      sessionsLifetimeGrossUsd: Number(ls[0]?.gross || 0),
      sessionsLifetimePlatformUsd: Number(ls[0]?.platform || 0),
      sessionsLifetimeCreatorUsd: Number(ls[0]?.creator || 0),
      ledgerLifetimeGrossUsd: Number(led[0]?.g || 0),
      ledgerLifetimePlatformUsd: Number(led[0]?.p || 0),
      ledgerLifetimeCreatorUsd: Number(led[0]?.c || 0),
    },
    topPayingUsers: topPayers,
  };
}

module.exports = {
  usePostgres,
  monthStart,
  getEffectiveTier,
  normalizeMonTier,
  getUsageRow,
  bumpUsage,
  recordMeteringEvent,
  sumMeteringByKind,
  topPayingUsersByStripe,
  platformTransactionsByKind,
  stripeRevenueTrend,
  adminRevenueOverview,
};
