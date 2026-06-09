import { describe, expect, it } from "vitest";
import { discoverTokens } from "../intel/liveCryptoIntel.js";

describe("Phase 4 runtime repairs", () => {
  it("discoverTokens maps DexScreener token-boost entries with readable symbols", async () => {
    const originalFetch = global.fetch;
    global.fetch = async (url) => {
      if (String(url).includes("token-boosts")) {
        return {
          ok: true,
          json: async () => [
            {
              chainId: "solana",
              tokenAddress: "2sDCRhLKeUF7c1dG2cqQFuY2VZQqPVrZRSGxqy8Gpump",
              description: "TRILLION is the richest joke on Solana.",
              url: "https://dexscreener.com/solana/example",
            },
          ],
        };
      }
      throw new Error(`unexpected fetch: ${url}`);
    };

    try {
      const out = await discoverTokens({});
      expect(out.tokens.length).toBeGreaterThan(0);
      expect(out.tokens[0].symbol).toBe("TRILLION");
      expect(out.tokens[0].symbol).not.toBe("?");
      expect(out.tokens[0].contractAddress).toContain("2sDCR");
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("CourseCatalogPage TDZ pattern: err must be declared before stale guard", async () => {
    const src = await import("fs/promises").then((fs) =>
      fs.readFile(new URL("../src/pages/CourseCatalogPage.jsx", import.meta.url), "utf8")
    );
    expect(src).toMatch(
      /const \[err, setErr\] = useState\(null\);\s*\n\s*const initialLoadStalled = useStaleLoadingGuard/
    );
  });

  it("ChatPage declares mediaPickerOpen state", async () => {
    const src = await import("fs/promises").then((fs) =>
      fs.readFile(new URL("../src/pages/ChatPage.jsx", import.meta.url), "utf8")
    );
    expect(src).toMatch(/\[mediaPickerOpen,\s*setMediaPickerOpen\]/);
  });
});
