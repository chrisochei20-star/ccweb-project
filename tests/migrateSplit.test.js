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
