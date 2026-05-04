const { logger } = require("../logging/logger");
const pgGrowth = require("../db/persistenceGrowth");

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function handleStripeWebhook(req, res) {
  const Stripe = require("stripe");
  const key = (process.env.STRIPE_SECRET_KEY || "").trim();
  const whSecret = (process.env.STRIPE_WEBHOOK_SECRET || "").trim();
  if (!key || !whSecret) {
    res.writeHead(503, { "Content-Type": "text/plain" });
    res.end("Stripe not configured");
    return;
  }
  const stripe = new Stripe(key, { apiVersion: "2024-11-20.acacia" });
  const sig = req.headers["stripe-signature"];
  let raw;
  try {
    raw = await readRawBody(req);
  } catch {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("Bad body");
    return;
  }
  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, whSecret);
  } catch (err) {
    logger.warn({ msg: "stripe_webhook_verify_fail", err: String(err.message) });
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end(`Webhook Error: ${err.message}`);
    return;
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;
    const pi = session.payment_intent;
    if (orderId && pgGrowth.usePostgres()) {
      try {
        await pgGrowth.attachStripeToOrder(orderId, session.id, typeof pi === "string" ? pi : pi?.id);
      } catch (e) {
        logger.error({ msg: "stripe_attach_order_fail", orderId, err: e.message });
      }
    }
  }
  res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({ received: true }));
}

module.exports = { handleStripeWebhook };
