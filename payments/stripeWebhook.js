const { logger } = require("../logging/logger");
const pgGrowth = require("../db/persistenceGrowth");
const learningPg = require("../db/persistenceLearning");

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
    const piId = typeof pi === "string" ? pi : pi?.id;
    if (orderId && pgGrowth.usePostgres()) {
      try {
        await pgGrowth.attachStripeToOrder(orderId, session.id, piId);
      } catch (e) {
        logger.error({ msg: "stripe_attach_order_fail", orderId, err: e.message });
      }
    }
    const kind = session.metadata?.kind;
    if (learningPg.usePostgres()) {
      if (kind === "learning_session_access") {
        try {
          await learningPg.activateAccessByCheckoutSession(session.id, piId);
        } catch (e) {
          logger.error({ msg: "learning_access_activate_fail", err: e.message });
        }
      } else if (kind === "learning_credits") {
        const userId = (session.metadata?.userId || "").toString().trim();
        const cents = Number(session.metadata?.cents || 0);
        if (userId && cents > 0) {
          try {
            await learningPg.addCredits(userId, cents, session.id);
          } catch (e) {
            logger.error({ msg: "learning_credits_fail", err: e.message });
          }
        }
      } else if (kind === "learning_subscription_checkout") {
        const userId = (session.metadata?.userId || "").toString().trim();
        const tier = (session.metadata?.tier || "standard").toString();
        const subRef = session.subscription;
        const subId = typeof subRef === "string" ? subRef : subRef?.id;
        if (userId && subId) {
          try {
            const fullSub = await stripe.subscriptions.retrieve(subId);
            const cust =
              typeof session.customer === "string" ? session.customer : session.customer?.id || fullSub.customer;
            const end = new Date(fullSub.current_period_end * 1000).toISOString();
            await learningPg.setSubscriptionActive(userId, tier, cust, subId, end);
          } catch (e) {
            logger.error({ msg: "learning_subscription_activate_fail", err: e.message });
          }
        }
      }
    }
  } else if (event.type === "invoice.payment_succeeded" && learningPg.usePostgres()) {
    const invoice = event.data.object;
    const subRef = invoice.subscription;
    const subId = typeof subRef === "string" ? subRef : subRef?.id;
    if (subId) {
      try {
        const fullSub = await stripe.subscriptions.retrieve(subId);
        const meta = fullSub.metadata || {};
        const userId = (meta.userId || "").toString().trim();
        const tier = (meta.tier || "standard").toString();
        if (userId) {
          const cust = typeof fullSub.customer === "string" ? fullSub.customer : fullSub.customer?.id;
          const end = new Date(fullSub.current_period_end * 1000).toISOString();
          await learningPg.setSubscriptionActive(userId, tier, cust, subId, end);
        }
      } catch (e) {
        logger.warn({ msg: "invoice_sub_sync_skip", err: e.message });
      }
    }
  }
  res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({ received: true }));
}

module.exports = { handleStripeWebhook };
