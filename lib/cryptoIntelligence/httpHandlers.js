const { sendJson, readJsonBody } = require("../ccweb/http");
const { runScan, getScan, listRecent } = require("./scanner");

async function handleCryptoScan(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }
  const result = runScan(body);
  if (result.error) {
    sendJson(res, result.status || 400, { error: result.error });
    return;
  }
  sendJson(res, 200, result.scan);
}

function handleCryptoScanGet(pathname, res) {
  const id = pathname.replace(/^\/api\/v1\/crypto\/scans\//, "").split("/")[0];
  if (!id) {
    sendJson(res, 400, { error: "Scan id required." });
    return;
  }
  const scan = getScan(id);
  if (!scan) {
    sendJson(res, 404, { error: "Scan not found." });
    return;
  }
  sendJson(res, 200, scan);
}

function handleCryptoSignals(res) {
  sendJson(res, 200, {
    windows: ["1h", "4h", "24h", "7d"],
    signals: [
      { id: "sig-1", type: "accumulation", asset: "ETH", strength: 0.72, note: "Smart wallets adding spot exposure." },
      { id: "sig-2", type: "narrative", topic: "AI agents", velocity: 1.4, note: "Social mention spike vs 30d median." },
    ],
    updatedAt: new Date().toISOString(),
  });
}

function handleCryptoScansList(requestUrl, res) {
  const limit = Math.min(100, Math.max(1, parseInt(requestUrl.searchParams.get("limit") || "20", 10) || 20));
  const items = listRecent(limit);
  sendJson(res, 200, { count: items.length, scans: items });
}

module.exports = {
  handleCryptoScan,
  handleCryptoScanGet,
  handleCryptoSignals,
  handleCryptoScansList,
  listRecent,
};
