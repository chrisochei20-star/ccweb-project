/**
 * Verify that all expected CCWEB tables exist (information_schema).
 * CLI: node db/verifySchema.js  → exit 0 if ok, 1 if missing tables or error.
 */
const { getPool } = require("./pool");
const { REQUIRED_TABLES } = require("./requiredTables");
const { logger } = require("../logging/logger");

async function verifySchema() {
  const pool = getPool();
  if (!pool) {
    return { ok: true, skipped: true, reason: "DATABASE_URL not set" };
  }
  const { rows } = await pool.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = ANY($1::text[])`,
    [REQUIRED_TABLES]
  );
  const have = new Set(rows.map((r) => r.table_name));
  const missing = REQUIRED_TABLES.filter((t) => !have.has(t));
  return {
    ok: missing.length === 0,
    skipped: false,
    missing,
    presentCount: have.size,
    expectedCount: REQUIRED_TABLES.length,
  };
}

async function verifyOrThrow() {
  const r = await verifySchema();
  if (r.skipped) return r;
  if (!r.ok) {
    throw new Error(
      `PostgreSQL schema incomplete (${r.missing.length} missing): ${r.missing.slice(0, 12).join(", ")}${
        r.missing.length > 12 ? "…" : ""
      }. Run: npm run db:migrate`
    );
  }
  return r;
}

if (require.main === module) {
  verifySchema()
    .then((r) => {
      if (r.skipped) {
        console.log("[verify] Skipped:", r.reason);
        process.exit(0);
      }
      if (r.ok) {
        console.log(`[verify] OK — all ${r.expectedCount} CCWEB tables present.`);
        process.exit(0);
      }
      console.error(`[verify] FAIL — missing ${r.missing.length} table(s):`, r.missing.join(", "));
      process.exit(1);
    })
    .catch((e) => {
      console.error("[verify] ERROR:", e.message);
      process.exit(1);
    });
}

module.exports = { verifySchema, verifyOrThrow };
