const { fullTokenScan } = require("./intelligenceEngine");

/** In-memory token intel — replace with chain indexers + ML in production */
const scans = new Map();

function safeNumber(n, f = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : f;
}

function runScan(body) {
  const chain = (body.chain || "ethereum").toString().trim();
  const address = (body.tokenAddress || body.address || "").toString().trim();
  const symbol = (body.symbol || "").toString().trim();
  if (!address || address.length < 8) {
    return { error: "tokenAddress (or address) is required.", status: 400 };
  }
  const result = fullTokenScan(chain, address, symbol || "UNKNOWN");
  scans.set(result.id, result);
  return { scan: result };
}

function getScan(id) {
  return scans.get(id) || null;
}

function listRecent(limit = 20) {
  return Array.from(scans.values())
    .sort((a, b) => (a.scannedAt < b.scannedAt ? 1 : -1))
    .slice(0, safeNumber(limit, 20));
}

module.exports = {
  runScan,
  getScan,
  listRecent,
};
