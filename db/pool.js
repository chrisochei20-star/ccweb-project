const { Pool } = require("pg");
const { logger } = require("../logging/logger");

let pool = null;
let warnedMissingDbUrl = false;

function sslOptionFor(conn) {
  if (process.env.PG_SSL === "0") return false;
  const wantTls =
    process.env.PG_SSL === "1" ||
    /\bsslmode=require\b/i.test(conn) ||
    /\bsslmode=verify-full\b/i.test(conn) ||
    /\.render\.com\b/i.test(conn);
  if (!wantTls) return undefined;
  return { rejectUnauthorized: process.env.PG_SSL_REJECT_UNAUTHORIZED !== "0" };
}

function getPool() {
  const conn = (process.env.DATABASE_URL || "").trim();
  if (!conn) {
    if (process.env.NODE_ENV === "production" && !warnedMissingDbUrl) {
      warnedMissingDbUrl = true;
      logger.warn({ msg: "database_url_missing", detail: "DATABASE_URL is not set; PostgreSQL features are disabled." });
    }
    return null;
  }
  if (!pool) {
    pool = new Pool({
      connectionString: conn,
      max: Number(process.env.PG_POOL_MAX || 20),
      idleTimeoutMillis: 30_000,
      ssl: sslOptionFor(conn),
    });
    pool.on("error", (err) => {
      logger.error({ msg: "pg_pool_error", err: err.message });
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
