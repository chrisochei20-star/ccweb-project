const crypto = require("crypto");
const { logger } = require("../logging/logger");
const pgGrowth = require("../db/persistenceGrowth");
const learningPg = require("../db/persistenceLearning");
const revenuePg = require("../db/persistenceRevenue");
const { verifyTransactionByTxRef } = require("./flutterwaveClient");
const { flutterwaveCheckoutOperational, flutterwaveDisabledPayload } = require("./flutterwaveConfig");
const { buildPaymentEntitlements } = require("./flutterwaveEntitlements");

const STANDARD_USD = Number(process.env.CCWEB_SUBSCRIPTION_STANDARD_USD || 19);
const PREMIUM_USD = Number(process.env.CCWEB_SUBSCRIPTION_PREMIUM_USD || 49);
const CREDIT_PACK_USD = Number(process.env.CCWEB_CREDIT_PACK_USD || 25);

function closeUsd(a, b) {
  return Math.abs(Number(a) - Number(b)) < 0.02;
}

function newTxRef(prefix) {
  return `ccweb_${prefix}_${Date.now()}_${crypto.randomBytes(5).toString("hex")}`;
}

async function expressReadBody(req) {
  return req.body && typeof req.body === "object" ? req.body : {};
}

function expressSendJson(res, statusCode, payload) {
  res.status(statusCode).json(payload);
}

/**
 * Resolve payer from pending checkout rows (webhook + verify).
 * @param {string} txRef
 * @returns {Promise<string|null>}
 */
async function resolveUserIdForTxRef(txRef) {
  const ref = String(txRef || "").trim();
  if (!ref) return null;

  const order = await pgGrowth.findPendingOrderByTxRef(ref);
  if (order?.buyerId) return String(order.buyerId);

  const access = await learningPg.findPendingAccessByTxRef(ref);
  if (access?.user_id) return String(access.user_id);

  const pend = await revenuePg.findPendingFlutterwaveCharge(ref);
  if (pend) {
    const meta = typeof pend.metadata === "object" && pend.metadata ? pend.metadata : JSON.parse(pend.metadata || "{}");
    const uid = String(meta.userId || "").trim();
    if (uid) return uid;
  }

  return null;
}

/**
 * Escrow: create pending order + tx_ref for Flutterwave Standard (v1 /payments/create).
 */
async function expressFlutterwaveEscrowPrepare(req, res) {
  const body = await expressReadBody(req);
  try {
    if (!flutterwaveCheckoutOperational()) {
      expressSendJson(res, 503, flutterwaveDisabledPayload);
      return;
    }
    if (!pgGrowth.usePostgres()) {
      expressSendJson(res, 503, { error: "PostgreSQL required for marketplace escrow." });
      return;
    }
    const { listingId, buyerId, buyerName } = body || {};
    if (!listingId) {
      expressSendJson(res, 400, { error: "listingId required." });
      return;
    }
    const listing = await pgGrowth.getListing(listingId);
    if (!listing) {
      expressSendJson(res, 404, { error: "Listing not found." });
      return;
    }
    const order = await pgGrowth.createOrder({
      listingId,
      buyerId: buyerId || "buyer-anon",
      buyerName: buyerName || "Customer",
    });
    if (order.error) {
      expressSendJson(res, 400, order);
      return;
    }
    const txRef = newTxRef("esc");
    await pgGrowth.setOrderPaymentTxRef(order.id, txRef);
    logger.info({
      msg: "flutterwave_escrow_prepare_ok",
      orderId: order.id,
      listingId,
      buyerId: buyerId || "buyer-anon",
      txRef,
      amountUsd: Number(order.amountUsd),
    });
    expressSendJson(res, 200, {
      txRef,
      amountUsd: Number(order.amountUsd),
      orderId: order.id,
      narration: `Escrow: ${listing.title}`,
    });
  } catch (e) {
    logger.error({ msg: "flutterwave_escrow_prepare_fail", err: e.message });
    expressSendJson(res, 500, { error: e.message || "Flutterwave prepare failed" });
  }
}

/**
 * Learning: return tx_ref + amount for Flutterwave (replaces Stripe Checkout redirect).
 */
async function handleFlutterwaveLearningPrepare(req, res, readJsonBody, sendJson, jwtUserId) {
  let body = {};
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }
  if (jwtUserId) {
    body.userId = jwtUserId;
  }
  if (!learningPg.usePostgres()) {
    sendJson(res, 503, { error: "PostgreSQL required for paid learning features." });
    return;
  }
  if (!flutterwaveCheckoutOperational()) {
    sendJson(res, 503, flutterwaveDisabledPayload);
    return;
  }

  const kind = (body.kind || "").toString();
  const userId = (body.userId || "").toString().trim();
  if (!userId) {
    sendJson(res, 400, { error: "userId required." });
    return;
  }

  try {
    if (kind === "session_access") {
      const streamRoomId = (body.streamRoomId || "").toString().trim();
      const hours = Math.max(0.25, Math.min(24, Number(body.hours) || 1));
      if (!streamRoomId) {
        sendJson(res, 400, { error: "streamRoomId required." });
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
      const txRef = newTxRef("lsn");
      const accessId = await learningPg.createPendingAccess({
        sessionId: sessRow.id,
        userId,
        hours,
        amountUsd: gross,
        platformUsd: platform,
        creatorUsd: creator,
        stripeCheckoutSessionId: txRef,
      });
      logger.info({ msg: "flutterwave_learning_prepare_ok", kind, userId, txRef, amountUsd: gross, accessId });
      sendJson(res, 200, {
        txRef,
        amountUsd: gross,
        accessId,
        narration: `CCWEB session access (${hours}h)`,
      });
      return;
    }

    if (kind === "credits") {
      const usd = Math.max(5, Math.min(500, Number(body.amountUsd) || CREDIT_PACK_USD));
      const cents = Math.round(usd * 100);
      const txRef = newTxRef("crd");
      await revenuePg.insertPendingFlutterwave({
        referenceId: txRef,
        amountUsd: usd,
        metadata: { intent: "credits", userId, cents },
      });
      logger.info({ msg: "flutterwave_learning_prepare_ok", kind, userId, txRef, amountUsd: usd });
      sendJson(res, 200, { txRef, amountUsd: usd, narration: "CCWEB learning credits" });
      return;
    }

    if (kind === "subscription") {
      const tier = (body.tier || "standard").toString().toLowerCase() === "premium" ? "premium" : "standard";
      const amountUsd = tier === "premium" ? PREMIUM_USD : STANDARD_USD;
      const txRef = newTxRef("sub");
      await revenuePg.insertPendingFlutterwave({
        referenceId: txRef,
        amountUsd,
        metadata: { intent: "subscription", userId, tier },
      });
      logger.info({ msg: "flutterwave_learning_prepare_ok", kind, userId, txRef, amountUsd, tier });
      sendJson(res, 200, { txRef, amountUsd, narration: `CCWEB ${tier} learning (30-day access)` });
      return;
    }

    sendJson(res, 400, { error: "Unknown kind. Use session_access, credits, or subscription." });
  } catch (e) {
    logger.error({ msg: "flutterwave_learning_prepare_fail", err: e.message, userId });
    sendJson(res, 500, { error: e.message || "Flutterwave prepare failed" });
  }
}

/**
 * Server-side verify against Flutterwave API + idempotent DB fulfillment.
 * @param {string} txRef
 * @param {string} userId
 */
async function fulfillFlutterwaveVerify(txRef, userId) {
  const ref = String(txRef || "").trim();
  const uid = String(userId || "").trim();
  if (!ref || !uid) {
    throw new Error("tx_ref and authenticated user required.");
  }

  const data = await verifyTransactionByTxRef(ref);
  const flwId = String(data.id != null ? data.id : "");
  if (!flwId) {
    throw new Error("Invalid Flutterwave transaction payload");
  }
  if (await revenuePg.isFlutterwaveTxnCaptured(flwId)) {
    const entitlements = await buildPaymentEntitlements(uid);
    return { ok: true, duplicate: true, entitlements };
  }

  const paidUsd = Number(data.amount);
  const cur = String(data.currency || "").toUpperCase();
  if (cur && cur !== "USD") {
    throw new Error("Unexpected currency from Flutterwave");
  }

  const order = await pgGrowth.findPendingOrderByBuyerAndTxRef(uid, ref);
  if (order) {
    if (!closeUsd(paidUsd, order.amountUsd)) {
      throw new Error("Paid amount does not match order total");
    }
    await pgGrowth.attachStripeToOrder(order.id, ref, flwId);
    await revenuePg.recordFlutterwaveCapture({
      kind: "growth_escrow",
      referenceId: flwId,
      amountUsd: paidUsd,
      metadata: { tx_ref: ref, orderId: order.id, listingId: order.listingId, buyerId: uid },
    });
    logger.info({ msg: "flutterwave_verify_fulfilled", kind: "growth_escrow", txRef: ref, userId: uid, flwId });
    const entitlements = await buildPaymentEntitlements(uid);
    return { ok: true, kind: "growth_escrow", orderId: order.id, entitlements };
  }

  const access = await learningPg.findPendingAccessByUserAndTxRef(uid, ref);
  if (access) {
    const expected = Number(access.amount_usd);
    if (!closeUsd(paidUsd, expected)) {
      throw new Error("Paid amount does not match access quote");
    }
    await learningPg.activateAccessByCheckoutSession(ref, flwId);
    await revenuePg.recordFlutterwaveCapture({
      kind: "learning_access",
      referenceId: flwId,
      amountUsd: paidUsd,
      metadata: { tx_ref: ref, userId: uid, accessId: access.id },
    });
    logger.info({ msg: "flutterwave_verify_fulfilled", kind: "learning_session_access", txRef: ref, userId: uid, flwId });
    const entitlements = await buildPaymentEntitlements(uid);
    return { ok: true, kind: "learning_session_access", entitlements };
  }

  const pend = await revenuePg.findPendingFlutterwaveCharge(ref);
  if (pend) {
    const meta = typeof pend.metadata === "object" && pend.metadata ? pend.metadata : JSON.parse(pend.metadata || "{}");
    const metaUser = String(meta.userId || "").trim();
    if (!metaUser || metaUser !== uid) {
      throw new Error("Pending payment does not belong to this account");
    }
    const expected = Number(pend.amount_usd);
    if (!closeUsd(paidUsd, expected)) {
      throw new Error("Paid amount does not match checkout quote");
    }
    if (meta.intent === "credits") {
      const cents = Number(meta.cents || 0);
      if (cents <= 0) throw new Error("Invalid credits metadata");
      await learningPg.addCredits(uid, cents, ref);
      await revenuePg.deletePendingFlutterwave(ref);
      await revenuePg.recordFlutterwaveCapture({
        kind: "learning_credits",
        referenceId: flwId,
        amountUsd: paidUsd,
        metadata: { tx_ref: ref, userId: uid, cents },
      });
      logger.info({ msg: "flutterwave_verify_fulfilled", kind: "learning_credits", txRef: ref, userId: uid, flwId });
      const entitlements = await buildPaymentEntitlements(uid);
      return { ok: true, kind: "learning_credits", entitlements };
    }
    if (meta.intent === "subscription") {
      const tier = String(meta.tier || "standard").toLowerCase() === "premium" ? "premium" : "standard";
      const end = new Date(Date.now() + 30 * 864e5).toISOString();
      await learningPg.setSubscriptionActive(uid, tier, `fw_${uid}`, `fw_${flwId}`, end);
      await revenuePg.deletePendingFlutterwave(ref);
      await revenuePg.recordFlutterwaveCapture({
        kind: "learning_subscription",
        referenceId: flwId,
        amountUsd: paidUsd,
        metadata: { tx_ref: ref, userId: uid, tier },
      });
      logger.info({ msg: "flutterwave_verify_fulfilled", kind: "learning_subscription", txRef: ref, userId: uid, flwId, tier });
      const entitlements = await buildPaymentEntitlements(uid);
      return { ok: true, kind: "learning_subscription", tier, entitlements };
    }
  }

  throw new Error("No pending checkout found for this tx_ref and account");
}

async function handleFlutterwaveVerify(req, res, readJsonBody, sendJson, jwtUserId) {
  let body = {};
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }
  const txRef = (body.tx_ref || body.txRef || "").toString().trim();
  if (!txRef) {
    sendJson(res, 400, { error: "tx_ref required." });
    return;
  }
  if (!jwtUserId) {
    sendJson(res, 401, { error: "Sign in required." });
    return;
  }
  if (!flutterwaveCheckoutOperational()) {
    sendJson(res, 503, flutterwaveDisabledPayload);
    return;
  }
  try {
    const out = await fulfillFlutterwaveVerify(txRef, jwtUserId);
    sendJson(res, 200, out);
  } catch (e) {
    logger.warn({ msg: "flutterwave_verify_fail", txRef, userId: jwtUserId, err: e.message });
    sendJson(res, 400, { error: e.message || "Verification failed" });
  }
}

async function expressFlutterwaveVerify(req, res) {
  await handleFlutterwaveVerify(req, res, expressReadBody, expressSendJson, req.ccwebUserId);
}

module.exports = {
  expressFlutterwaveEscrowPrepare,
  handleFlutterwaveLearningPrepare,
  handleFlutterwaveVerify,
  expressFlutterwaveVerify,
  fulfillFlutterwaveVerify,
  resolveUserIdForTxRef,
  STANDARD_USD,
  PREMIUM_USD,
  CREDIT_PACK_USD,
};
