import { describe, it, expect } from "vitest";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { resolveSymbolToAddress, CANONICAL_SYMBOLS } = require("../intel/liveCryptoIntel.js");

describe("resolveSymbolToAddress", () => {
  it("resolves major symbols from canonical map without network", async () => {
    await expect(resolveSymbolToAddress("ETH")).resolves.toBe(CANONICAL_SYMBOLS.ETH.address);
    await expect(resolveSymbolToAddress("btc")).resolves.toBe(CANONICAL_SYMBOLS.BTC.address);
    await expect(resolveSymbolToAddress("SOL")).resolves.toBe(CANONICAL_SYMBOLS.SOL.solMint);
  });

  it("returns null for empty symbol", async () => {
    await expect(resolveSymbolToAddress("")).resolves.toBeNull();
  });
});
