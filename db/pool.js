const { Pool } = require("pg");

let pool = null;

function getPool() {
  const conn = (process.env.DATABASE_URL || "").trim();
  if (!conn) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: conn,
      max: Number(process.env.PG_POOL_MAX || 20),
      idleTimeoutMillis: 30_000,
      ssl: process.env.PG_SSL === "1" ? { rejectUnauthorized: process.env.PG_SSL_REJECT_UNAUTHORIZED !== "0" } : false,
    });
  }
  return pool;
}

async function query(text, params) {
  const p = getPool();
  if (!p) throw new Error("DATABASE_URL is not configured.");
  return p.query(text, params);
}

module.exports = { getPool, query };
