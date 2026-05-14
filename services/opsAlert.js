/**
 * Optional operational webhook for payout/webhook failures and similar signals.
 * Set CCWEB_OPS_ALERT_WEBHOOK_URL to a Slack-compatible incoming webhook or generic HTTPS endpoint.
 */

"use strict";

const axios = require("axios");
const { logger } = require("../logging/logger");

function webhookUrl() {
  return String(process.env.CCWEB_OPS_ALERT_WEBHOOK_URL || "").trim();
}

/**
 * @param {{ type: string, message: string, meta?: object }} payload
 */
async function postOpsAlert(payload) {
  const url = webhookUrl();
  if (!url) return { ok: false, skipped: true };
  const body = {
    text: `[CCWEB ${process.env.NODE_ENV || "dev"}] ${payload.type}: ${payload.message}`,
    ccweb: {
      type: payload.type,
      message: payload.message,
      meta: payload.meta || {},
      ts: new Date().toISOString(),
    },
  };
  try {
    await axios.post(url, body, { timeout: 8000, headers: { "Content-Type": "application/json" } });
    return { ok: true };
  } catch (e) {
    logger.warn({ msg: "ops_alert_webhook_failed", err: e.message });
    return { ok: false, error: e.message };
  }
}

module.exports = { postOpsAlert, webhookUrl };
