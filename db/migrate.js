/**
 * Apply SQL schema (baseline + incremental migrations). Safe to run multiple times (IF NOT EXISTS).
 *
 * Baseline: db/schema.sql
 * Incremental: db/migrations/*.sql sorted by filename (001_*.sql, 002_*.sql, …)
 *
 * CLI: node db/migrate.js | npm run db:migrate
 */
const fs = require("fs");
const path = require("path");
const { getPool } = require("./pool");
const { logger } = require("../logging/logger");
const { verifyOrThrow } = require("./verifySchema");

function splitSqlStatements(sql) {
  const out = [];
  let cur = "";
  let inStr = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < sql.length; i += 1) {
    const c = sql[i];
    const next = sql[i + 1];

    if (inBlockComment) {
      if (c === "*" && next === "/") {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }

    if (inLineComment) {
      if (c === "\n") inLineComment = false;
      continue;
    }

    if (!inStr && c === "/" && next === "*") {
      inBlockComment = true;
      i += 1;
      continue;
    }

    if (!inStr && c === "-" && next === "-") {
      inLineComment = true;
      i += 1;
      continue;
    }

    if (c === "'" && inStr && next === "'") {
      cur += "''";
      i += 1;
      continue;
    }
    if (c === "'") {
      inStr = !inStr;
      cur += c;
      continue;
    }

    if (!inStr && c === ";") {
      const s = cur.trim();
      if (s && !s.startsWith("--")) out.push(s);
      cur = "";
      continue;
    }

    cur += c;
  }
  const tail = cur.trim();
  if (tail && !tail.startsWith("--")) out.push(tail);
  return out.filter((s) => s.replace(/;/g, "").trim().length > 0);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isTransientDbError(err) {
  const code = err && err.code;
  return (
    code === "ECONNREFUSED" ||
    code === "ETIMEDOUT" ||
    code === "ENOTFOUND" ||
    code === "ECONNRESET" ||
    code === "EPIPE" ||
    (typeof err?.message === "string" && /timeout|ECONNRESET|connection terminated/i.test(err.message))
  );
}

async function runStatementsInTransaction(pool, statements, label) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const stmt of statements) {
      await client.query(stmt);
    }
    await client.query("COMMIT");
    logger.info({ msg: "migrate_chunk_ok", label, statements: statements.length });
  } catch (e) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore */
    }
    throw e;
  } finally {
    client.release();
  }
}

function listIncrementalMigrationFiles() {
  const dir = path.join(__dirname, "migrations");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql") && !f.startsWith("."))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((f) => path.join(dir, f));
}

async function applySchemaFiles(pool) {
  const sqlPath = path.join(__dirname, "schema.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  const baselineStatements = splitSqlStatements(sql);
  await runStatementsInTransaction(pool, baselineStatements, "schema.sql");

  for (const filePath of listIncrementalMigrationFiles()) {
    const incSql = fs.readFileSync(filePath, "utf8");
    const stmts = splitSqlStatements(incSql).filter((s) => s.replace(/;/g, "").trim().length > 0);
    if (!stmts.length) continue;
    await runStatementsInTransaction(pool, stmts, path.basename(filePath));
  }
}

async function migrate() {
  const pool = getPool();
  if (!pool) {
    console.warn("[migrate] DATABASE_URL not set; skipping PostgreSQL migrations.");
    return;
  }

  const maxAttempts = Math.max(1, Number(process.env.CCWEB_MIGRATE_RETRIES || 5));
  let lastErr;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await applySchemaFiles(pool);
      await verifyOrThrow();
      const baselineCount = splitSqlStatements(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8")).length;
      console.log(`[migrate] PostgreSQL OK — baseline ${baselineCount} statements + incremental migrations verified.`);
      return;
    } catch (e) {
      lastErr = e;
      logger.error({
        msg: "migrate_attempt_failed",
        attempt,
        maxAttempts,
        err: e.message,
        code: e.code,
      });
      const canRetry = attempt < maxAttempts && isTransientDbError(e);
      if (!canRetry) throw e;
      await sleep(Math.min(30_000, 1000 * 2 ** (attempt - 1)));
    }
  }
  throw lastErr;
}

if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

module.exports = { migrate, splitSqlStatements };
