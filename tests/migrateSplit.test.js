import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { splitSqlStatements } from "../db/migrate.js";

describe("splitSqlStatements", () => {
  it("does not split inside single-quoted strings", () => {
    const sql = `INSERT INTO t (c) VALUES ('a;b');\nSELECT 1;`;
    const stmts = splitSqlStatements(sql);
    expect(stmts.length).toBe(2);
    expect(stmts[0]).toContain("'a;b'");
  });

  it("does not split on semicolons inside -- line comments", () => {
    const sql = `-- Order: first; self-FK note\nCREATE TABLE t (id INT);\n`;
    const stmts = splitSqlStatements(sql);
    expect(stmts.length).toBe(1);
    expect(stmts[0]).toContain("CREATE TABLE t");
    expect(stmts[0]).not.toContain("self-FK");
  });

  it("skips block comments", () => {
    const sql = `/* drop; here */ SELECT 1;`;
    const stmts = splitSqlStatements(sql);
    expect(stmts.length).toBe(1);
    expect(stmts[0].trim()).toBe("SELECT 1");
  });
});

describe("schema.sql ccweb_courses category_slug ordering", () => {
  it("runs ADD COLUMN IF NOT EXISTS before CREATE INDEX on category_slug", () => {
    const sql = fs.readFileSync(path.join(process.cwd(), "db/schema.sql"), "utf8");
    const stmts = splitSqlStatements(sql);
    const createTableIdx = stmts.findIndex((s) =>
      /CREATE TABLE IF NOT EXISTS ccweb_courses\s*\(/i.test(s)
    );
    const alterCategoryIdx = stmts.findIndex((s) =>
      /ALTER TABLE ccweb_courses ADD COLUMN IF NOT EXISTS category_slug/i.test(s)
    );
    const indexCategoryIdx = stmts.findIndex((s) =>
      /CREATE INDEX IF NOT EXISTS ccweb_courses_category\s+ON ccweb_courses\s*\(\s*category_slug\s*\)/i.test(s)
    );
    expect(createTableIdx).toBeGreaterThanOrEqual(0);
    expect(alterCategoryIdx).toBeGreaterThanOrEqual(0);
    expect(indexCategoryIdx).toBeGreaterThanOrEqual(0);
    expect(createTableIdx).toBeLessThan(alterCategoryIdx);
    expect(alterCategoryIdx).toBeLessThan(indexCategoryIdx);
  });
});
