/**
 * Server-side Flutterwave REST verify (Standard / tx_ref).
 */

async function verifyTransactionByTxRef(txRef) {
  const secret = (process.env.FLUTTERWAVE_SECRET_KEY || "").trim();
  if (!secret) throw new Error("Flutterwave secret not configured");
  const url = `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${secret}` } });
  const json = await r.json().catch(() => ({}));
  if (!r.ok || String(json.status || "").toLowerCase() !== "success") {
    throw new Error(json.message || json.data?.processor_response || `Flutterwave verify failed (${r.status})`);
  }
  const data = json.data;
  if (!data || String(data.status || "").toLowerCase() !== "successful") {
    throw new Error("Flutterwave payment not successful");
  }
  return data;
}

module.exports = { verifyTransactionByTxRef };
