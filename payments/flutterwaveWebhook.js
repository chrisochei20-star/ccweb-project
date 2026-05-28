/**
 * Flutterwave webhook — server-side verify + idempotent fulfillment (backup to client verify).
 * Configure FLUTTERWAVE_WEBHOOK_SECRET (dashboard secret hash) on Railway.
 */

const crypto = require("crypto");
const { logger } = require("../logging/logger");
const { flutterwaveCheckoutOperational } = require("./flutterwaveConfig");
const { fulfillFlutterwaveVerify, resolveUserIdForTxRef } = require("./flutterwavePayments");

function webhookSecret() {
  return (process.env.FLUTTERWAVE_WEBHOOK_SECRET || process.env.FLUTTERWAVE_SECRET_HASH || "").trim();
}

function verifyWebhookSignature(rawBody, verifHash) {
  const secret = webhookSecret();
  if (!secret) return { ok: false, reason: "webhook_secret_missing" };
  if (!verifHash) return { ok: false, reason: "missing_verif_hash" };
  const hash = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return { ok: hash === verifHash, reason: hash === verifHash ? null : "signature_mismatch" };
}

function parseWebhookPayload(rawBody) {
  try {
    return JSON.parse(String(rawBody || "{}"));
  } catch {
    return null;
  }
}

function extractTxRef(payload) {
  const data = payload?.data;
  return (
    (data?.tx_ref || data?.txRef || payload?.tx_ref || payload?.txRef || "").toString().trim() || ""
  );
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function handleFlutterwaveWebhook(req, res) {
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(String(req.body || ""), "utf8");
  const verifHash = (req.headers["verif-hash"] || req.headers["verif_hash"] || "").toString();

  const sig = verifyWebhookSignature(rawBody, verifHash);
  if (!sig.ok) {
    logger.warn({
      msg: "flutterwave_webhook_rejected",
      reason: sig.reason,
      hasSecret: Boolean(webhookSecret()),
    });
    return res.status(401).json({ error: "Invalid webhook signature.", code: sig.reason });
  }

  const payload = parseWebhookPayload(rawBody);
  if (!payload) {
    logger.warn({ msg: "flutterwave_webhook_invalid_json" });
    return res.status(400).json({ error: "Invalid JSON body." });
  }

  const event = String(payload.event || payload["event.type"] || "").toLowerCase();
  const txRef = extractTxRef(payload);
  if (!txRef) {
    logger.info({ msg: "flutterwave_webhook_ignored", event, reason: "no_tx_ref" });
    return res.status(200).json({ ok: true, ignored: true });
  }

  if (!flutterwaveCheckoutOperational()) {
    logger.warn({ msg: "flutterwave_webhook_disabled", txRef });
    return res.status(503).json({ error: "Flutterwave not configured." });
  }

  const successEvents = ["charge.completed", "transfer.completed"];
  if (event && !successEvents.includes(event)) {
    logger.info({ msg: "flutterwave_webhook_ignored", event, txRef });
    return res.status(200).json({ ok: true, ignored: true, event });
  }

  try {
    const userId = await resolveUserIdForTxRef(txRef);
    if (!userId) {
      logger.warn({ msg: "flutterwave_webhook_no_pending", txRef, event });
      return res.status(200).json({ ok: true, pending: false, txRef });
    }
    const out = await fulfillFlutterwaveVerify(txRef, userId);
    logger.info({ msg: "flutterwave_webhook_fulfilled", txRef, userId, kind: out.kind, duplicate: Boolean(out.duplicate) });
    return res.status(200).json({ ok: true, ...out });
  } catch (e) {
    logger.error({ msg: "flutterwave_webhook_fulfill_fail", txRef, err: e.message });
    return res.status(400).json({ error: e.message || "Fulfillment failed" });
  }
}

module.exports = {
  handleFlutterwaveWebhook,
  verifyWebhookSignature,
  webhookSecret,
};
