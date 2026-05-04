const { logger } = require("../logging/logger");
const learningPg = require("../db/persistenceLearning");

const STANDARD_USD = Number(process.env.CCWEB_SUBSCRIPTION_STANDARD_USD || 19);
const PREMIUM_USD = Number(process.env.CCWEB_SUBSCRIPTION_PREMIUM_USD || 49);
const CREDIT_PACK_USD = Number(process.env.CCWEB_CREDIT_PACK_USD || 25);

async function handleLearningStripeCheckout(req, res, readJsonBody, sendJson) {
  let body = {};
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }
  if (!learningPg.usePostgres()) {
    sendJson(res, 503, { error: "PostgreSQL required for paid learning features." });
    return;
  }
  const Stripe = require("stripe");
  const key = (process.env.STRIPE_SECRET_KEY || "").trim();
  if (!key) {
    sendJson(res, 503, { error: "STRIPE_SECRET_KEY not set." });
    return;
  }
  const stripe = new Stripe(key, { apiVersion: "2024-11-20.acacia" });
  const kind = (body.kind || "").toString();
  const userId = (body.userId || "").toString().trim();
  const successUrl =
    body.successUrl || `${process.env.PUBLIC_APP_URL || "http://localhost:5173"}/ai-streaming?paid=1`;
  const cancelUrl = body.cancelUrl || `${process.env.PUBLIC_APP_URL || "http://localhost:5173"}/ai-streaming?cancelled=1`;

  try {
    if (kind === "session_access") {
      const streamRoomId = (body.streamRoomId || "").toString().trim();
      const hours = Math.max(0.25, Math.min(24, Number(body.hours) || 1));
      if (!userId || !streamRoomId) {
        sendJson(res, 400, { error: "userId and streamRoomId required." });
        return;
      }
      const sessRow = await learningPg.getSessionByStreamRoomId(streamRoomId);
      if (!sessRow) {
        sendJson(res, 404, {
          error: "Learning session not found for this room. Create or open the stream first.",
        });
        return;
      }
      const hourly = learningPg.money(sessRow.hourly_rate_usd);
      const platformPct = learningPg.money(sessRow.platform_fee_percent);
      const gross = learningPg.money(hours * hourly);
      const platform = learningPg.money((gross * platformPct) / 100);
      const creator = learningPg.money(gross - platform);
      const accessId = await learningPg.createPendingAccess({
        sessionId: sessRow.id,
        userId,
        hours,
        amountUsd: gross,
        platformUsd: platform,
        creatorUsd: creator,
        stripeCheckoutSessionId: null,
      });
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: Math.round(gross * 100),
              product_data: {
                name: `CCWEB session access (${hours}h)`,
                description: `Room ${streamRoomId} — participant hours`,
              },
            },
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          kind: "learning_session_access",
          accessId,
          userId,
          sessionId: sessRow.id,
          streamRoomId,
        },
      });
      await learningPg.attachCheckoutSessionToAccess(accessId, session.id);
      sendJson(res, 200, { checkoutUrl: session.url, sessionId: session.id, accessId });
      return;
    }

    if (kind === "credits") {
      if (!userId) {
        sendJson(res, 400, { error: "userId required." });
        return;
      }
      const usd = Math.max(5, Math.min(500, Number(body.amountUsd) || CREDIT_PACK_USD));
      const cents = Math.round(usd * 100);
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: cents,
              product_data: { name: "CCWEB learning credits", description: "Redeem for AI tutor minutes" },
            },
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { kind: "learning_credits", userId, cents: String(cents) },
      });
      sendJson(res, 200, { checkoutUrl: session.url, sessionId: session.id });
      return;
    }

    if (kind === "subscription") {
      if (!userId) {
        sendJson(res, 400, { error: "userId required." });
        return;
      }
      const tier = (body.tier || "standard").toString().toLowerCase() === "premium" ? "premium" : "standard";
      const amountUsd = tier === "premium" ? PREMIUM_USD : STANDARD_USD;
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        subscription_data: {
          metadata: { userId, tier },
        },
        line_items: [
          {
            price_data: {
              currency: "usd",
              recurring: { interval: "month" },
              unit_amount: Math.round(amountUsd * 100),
              product_data: {
                name: `CCWEB ${tier} learning`,
                description: "AI streaming + tutor access",
              },
            },
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { kind: "learning_subscription_checkout", userId, tier },
      });
      sendJson(res, 200, { checkoutUrl: session.url, sessionId: session.id });
      return;
    }

    sendJson(res, 400, { error: "Unknown kind. Use session_access, credits, or subscription." });
  } catch (e) {
    logger.error({ msg: "learning_stripe_checkout_fail", err: e.message });
    sendJson(res, 500, { error: e.message || "Stripe error" });
  }
}

module.exports = { handleLearningStripeCheckout, STANDARD_USD, PREMIUM_USD, CREDIT_PACK_USD };
