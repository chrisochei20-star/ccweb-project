/**
 * Optional demo seed for staging/beta. Enable with CCWEB_SEED_DEMO=1.
 */
const fs = require("fs");
const path = require("path");
const { getPool } = require("./pool");
const { splitSqlStatements } = require("./migrate");
const { logger } = require("../logging/logger");

async function runDemoSeed() {
  if (process.env.CCWEB_SEED_DEMO !== "1" && process.env.CCWEB_SEED_DEMO !== "true") {
    return;
  }
  const pool = getPool();
  if (!pool) {
    logger.warn({ msg: "seed_skipped", reason: "DATABASE_URL not set" });
    return;
  }
  const sqlPath = path.join(__dirname, "seed.demo.sql");
  if (!fs.existsSync(sqlPath)) return;
  const sql = fs.readFileSync(sqlPath, "utf8");
  const statements = splitSqlStatements(sql).filter((s) => s.replace(/;/g, "").trim().length > 0);
  if (!statements.length) return;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const stmt of statements) {
      await client.query(stmt);
    }
    await client.query("COMMIT");
    logger.info({ msg: "demo_seed_applied", statements: statements.length });
  } catch (e) {
    await client.query("ROLLBACK");
    logger.error({ msg: "demo_seed_failed", err: e.message });
    throw e;
  } finally {
    client.release();
  }
}

module.exports = { runDemoSeed };
