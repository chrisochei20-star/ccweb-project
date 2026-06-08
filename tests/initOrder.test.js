import { describe, expect, it } from "vitest";

describe("init order / TDZ hardening", () => {
  it("session module loads without capacitorPlatform static releaseLog import", async () => {
    const session = await import("../src/session.js");
    expect(typeof session.getSessionToken).toBe("function");
    expect(typeof session.fetchMe).toBe("function");
  });

  it("authStorage loads via platformDetect only", async () => {
    const storage = await import("../src/lib/authStorage.js");
    expect(typeof storage.authStorageGetItem).toBe("function");
  });

  it("capacitorPlatform init does not statically import releaseLog", async () => {
    const src = await import("fs/promises").then((fs) =>
      fs.readFile(new URL("../src/lib/capacitorPlatform.js", import.meta.url), "utf8")
    );
    expect(src).not.toMatch(/import\s+\{[^}]*releaseDiag[^}]*\}\s+from\s+["']\.\/releaseLog/);
  });
});
