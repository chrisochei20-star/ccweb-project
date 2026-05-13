/**
 * Flutterwave v3 REST (https://developer.flutterwave.com/docs).
 * Uses axios; amounts are major units (string) in API payloads.
 */

const axios = require("axios");

const BASE = "https://api.flutterwave.com/v3";

function secretKey() {
  return (process.env.FLUTTERWAVE_SECRET_KEY || "").trim();
}

function publicKey() {
  return (process.env.FLUTTERWAVE_PUBLIC_KEY || "").trim();
}

function secretHash() {
  return (process.env.FLUTTERWAVE_SECRET_HASH || "").trim();
}

function isConfigured() {
  return Boolean(secretKey());
}

function authHeaders() {
  return { Authorization: `Bearer ${secretKey()}` };
}

/**
 * @param {object} body Flutterwave /payments payload
 */
async function createHostedPaymentLink(body) {
  const res = await axios.post(`${BASE}/payments`, body, { headers: { ...authHeaders(), "Content-Type": "application/json" } });
  const d = res.data && res.data.data;
  const link = d && (d.link || d.checkout_url);
  if (!link) {
    const err = new Error((res.data && res.data.message) || "Flutterwave did not return checkout link.");
    err.code = "FLW_NO_LINK";
    err.raw = res.data;
    throw err;
  }
  return { link, raw: res.data };
}

async function verifyByTxRef(txRef) {
  const res = await axios.get(`${BASE}/transactions/verify_by_reference`, {
    params: { tx_ref: txRef },
    headers: authHeaders(),
  });
  return res.data;
}

function verifyWebhookSignature(headers) {
  const expected = secretHash();
  if (!expected) return { ok: false, reason: "missing_secret_hash" };
  const got = (headers["verif-hash"] || headers["verif_hash"] || "").toString();
  if (!got || got !== expected) return { ok: false, reason: "hash_mismatch" };
  return { ok: true };
}

module.exports = {
  isConfigured,
  publicKey,
  secretHash,
  createHostedPaymentLink,
  verifyByTxRef,
  verifyWebhookSignature,
};
