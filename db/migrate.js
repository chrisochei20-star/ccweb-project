/**
 * Apply SQL schema. Safe to run multiple times (IF NOT EXISTS).
 */
const fs = require("fs");
const path = require("path");
const { getPool } = require("./pool");

function splitSqlStatements(sql) {
  const out = [];
  let cur = "";
  let inStr = false;
  for (let i = 0; i < sql.length; i += 1) {
    const c = sql[i];
    const next = sql[i + 1];
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

async function migrate() {
  const pool = getPool();
  if (!pool) {
    console.warn("[migrate] DATABASE_URL not set; skipping PostgreSQL migrations.");
    return;
  }
  const sqlPath = path.join(__dirname, "schema.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  const statements = splitSqlStatements(sql);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const stmt of statements) {
      await client.query(stmt);
    }
    await client.query("COMMIT");
    console.log(`[migrate] PostgreSQL schema applied (${statements.length} statements).`);
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

module.exports = { migrate, splitSqlStatements };
