const { logger } = require("../logging/logger");
const pgGrowth = require("../db/persistenceGrowth");

async function handleStripeCheckoutEscrow(req, res, readJsonBody, sendJson) {
  let body = {};
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }
  try {
    const Stripe = require("stripe");
    const key = (process.env.STRIPE_SECRET_KEY || "").trim();
    if (!key) {
      sendJson(res, 503, { error: "STRIPE_SECRET_KEY not set." });
      return;
    }
    if (!pgGrowth.usePostgres()) {
      sendJson(res, 503, { error: "PostgreSQL required for Stripe escrow checkout." });
      return;
    }
    const stripe = new Stripe(key, { apiVersion: "2024-11-20.acacia" });
    const { listingId, buyerId, buyerName, successUrl, cancelUrl } = body || {};
    if (!listingId) {
      sendJson(res, 400, { error: "listingId required." });
      return;
    }
    const listing = await pgGrowth.getListing(listingId);
    if (!listing) {
      sendJson(res, 404, { error: "Listing not found." });
      return;
    }
    const order = await pgGrowth.createOrder({
      listingId,
      buyerId: buyerId || "buyer-anon",
      buyerName: buyerName || "Customer",
    });
    if (order.error) {
      sendJson(res, 400, order);
      return;
    }
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round(Number(listing.priceUsd) * 100),
            product_data: { name: `Escrow: ${listing.title}` },
          },
          quantity: 1,
        },
      ],
      success_url:
        successUrl ||
        `${process.env.PUBLIC_APP_URL || "http://localhost:5173"}/marketplace/${listingId}?paid=1`,
      cancel_url:
        cancelUrl ||
        `${process.env.PUBLIC_APP_URL || "http://localhost:5173"}/marketplace/${listingId}?cancelled=1`,
      metadata: { orderId: order.id, listingId },
    });
    await pgGrowth.attachStripeToOrder(order.id, session.id, null);
    sendJson(res, 200, { checkoutUrl: session.url, sessionId: session.id, orderId: order.id });
  } catch (e) {
    logger.error({ msg: "stripe_checkout_fail", err: e.message });
    sendJson(res, 500, { error: e.message || "Stripe error" });
  }
}

module.exports = { handleStripeCheckoutEscrow };
