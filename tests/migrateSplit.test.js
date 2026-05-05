import { describe, expect, it } from "vitest";
import { splitSqlStatements } from "../db/migrate.js";

describe("splitSqlStatements", () => {
  it("does not split inside single-quoted strings", () => {
    const sql = `INSERT INTO t (c) VALUES ('a;b');\nSELECT 1;`;
    const stmts = splitSqlStatements(sql);
    expect(stmts.length).toBe(2);
    expect(stmts[0]).toContain("'a;b'");
  });
});
