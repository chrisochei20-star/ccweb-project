/**
 * Apply SQL schema. Safe to run multiple times (IF NOT EXISTS).
 */
const fs = require("fs");
const path = require("path");
const { getPool } = require("./pool");

async function migrate() {
  const pool = getPool();
  if (!pool) {
    console.warn("[migrate] DATABASE_URL not set; skipping PostgreSQL migrations.");
    return;
  }
  const sqlPath = path.join(__dirname, "schema.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("[migrate] PostgreSQL schema applied.");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

module.exports = { migrate };
