/**
 * Flutterwave payments under /api/v1/payments/flutterwave
 */

const express = require("express");
const crypto = require("crypto");
const { query } = require("./db/pool");
const flw = require("./services/flutterwaveClient");
const persistenceFlutterwave = require("./db/persistenceFlutterwave");
const coursesPg = require("./db/persistenceCourses");

function normalizeRedirect(url) {
  const u = String(url || "").trim().slice(0, 2000);
  if (!u) return null;
  if (u.startsWith("https://")) return u;
  if (process.env.NODE_ENV !== "production" && (u.startsWith("http://localhost") || u.startsWith("http://127.0.0.1"))) {
    return u;
  }
  return null;
}

async function getAuthEmail(userId) {
  const { rows } = await query(`SELECT email FROM ccweb_auth_users WHERE id = $1`, [userId]);
  return rows[0]?.email ? String(rows[0].email) : null;
}

function newTxRef() {
  const base = `ccweb_${Date.now().toString(36)}_${crypto.randomBytes(5).toString("hex")}`;
  return base.slice(0, 48);
}

function subscriptionMinor(currency) {
  const c = String(currency || "USD").toUpperCase();
  if (c === "NGN") {
    const n = Number(process.env.FLUTTERWAVE_SUBSCRIPTION_NGN || 15000);
    return Math.max(100, Math.round(n * 100));
  }
  const usd = Number(process.env.FLUTTERWAVE_SUBSCRIPTION_USD || 15);
  return Math.max(100, Math.round(usd * 100));
}

function aiPackMinor(pack) {
  const p = String(pack || "small").toLowerCase();
  if (p === "large") return Number(process.env.FLUTTERWAVE_AI_PACK_LARGE_CENTS || 10000);
  if (p === "medium") return Number(process.env.FLUTTERWAVE_AI_PACK_MEDIUM_CENTS || 2500);
  return Number(process.env.FLUTTERWAVE_AI_PACK_SMALL_CENTS || 500);
}

function createFlutterwaveRouter({ authJwtMiddleware }) {
  const router = express.Router();

  router.get("/config", (req, res) => {
    res.json({
      configured: flw.isConfigured(),
      publicKey: flw.publicKey() || null,
      currencies: ["USD", "NGN"],
    });
  });

  router.post("/webhook", express.json(), async (req, res) => {
    const sig = flw.verifyWebhookSignature(req.headers);
    if (!sig.ok) {
      return res.status(401).type("text/plain").send("invalid signature");
    }
    const event = req.body?.event;
    const data = req.body?.data;
    try {
      if (event === "charge.completed" && data?.tx_ref) {
        await persistenceFlutterwave.applySuccessfulCharge(String(data.tx_ref), data);
      } else if (String(event || "").toLowerCase().includes("transfer") && (data || req.body?.data)) {
        const td = data || req.body?.data || {};
        await persistenceFlutterwave.applyTransferNotification(td);
      }
    } catch {
      /* avoid retry storms */
    }
    res.status(200).type("text/plain").send("ok");
  });

  router.use((req, res, next) => {
    if (!persistenceFlutterwave.usePostgres()) {
      return res.status(503).json({ error: "Flutterwave billing requires PostgreSQL.", code: "NO_DATABASE" });
    }
    next();
  });

  router.post("/initialize", authJwtMiddleware, async (req, res, next) => {
    try {
      if (!flw.isConfigured()) {
        return res.status(503).json({ error: "Flutterwave is not configured (FLUTTERWAVE_SECRET_KEY).", code: "FLW_NOT_CONFIGURED" });
      }
      const userId = req.ccwebUserId;
      const kind = String(req.body?.kind || "").trim();
      const currency = String(req.body?.currency || "USD").toUpperCase();
      if (currency !== "USD" && currency !== "NGN") {
        return res.status(400).json({ error: "currency must be USD or NGN." });
      }
      const redirectUrl = normalizeRedirect(req.body?.redirectUrl) || normalizeRedirect(`${req.protocol}://${req.get("host")}/earn`);
      if (!redirectUrl) return res.status(400).json({ error: "redirectUrl must be https (or localhost in dev)." });

      const email = (await getAuthEmail(userId)) || String(req.body?.customerEmail || "user@ccweb.local").slice(0, 200);
      const name = String(req.body?.customerName || "CCWEB member").slice(0, 200);
      const phone = String(req.body?.customerPhone || "0000000000").slice(0, 20);

      let amountMinor = 0;
      let creatorUserId = null;
      let meta = { kind };

      if (kind === "course_purchase") {
        const slug = String(req.body?.courseSlug || "").trim();
        const course = slug ? await coursesPg.getCourseBySlug(slug) : null;
        if (!course) return res.status(404).json({ error: "Course not found." });
        if (currency === "USD") amountMinor = course.priceUsdCents || 0;
        else amountMinor = Math.round((course.priceNgn || 0) * 100);
        if (amountMinor <= 0) return res.status(400).json({ error: "Course has no price in the selected currency." });
        creatorUserId = course.creatorUserId || null;
        meta.courseId = course.id;
        meta.courseSlug = course.slug;
      } else if (kind === "creator_tip") {
        creatorUserId = String(req.body?.creatorUserId || "").trim();
        if (!creatorUserId) return res.status(400).json({ error: "creatorUserId required." });
        const major = Number(req.body?.amountMajor);
        if (!Number.isFinite(major) || major <= 0) return res.status(400).json({ error: "amountMajor required." });
        const cap = currency === "USD" ? 5000 : 5000000;
        amountMinor = Math.min(cap, Math.round(major * 100));
        if (amountMinor < (currency === "USD" ? 100 : 10000)) {
          return res.status(400).json({ error: "Amount below minimum for this currency." });
        }
      } else if (kind === "platform_subscription") {
        amountMinor = subscriptionMinor(currency);
        meta.targetTier = String(req.body?.targetTier || "pro").slice(0, 32);
        meta.periodDays = Math.min(365, Math.max(7, Number(req.body?.periodDays) || 30));
      } else if (kind === "ai_credit_pack") {
        amountMinor = aiPackMinor(req.body?.pack);
        meta.creditsCents = amountMinor;
      } else if (kind === "ai_tool_unlock") {
        creatorUserId = String(req.body?.creatorUserId || "").trim();
        const suggested = Number(req.body?.priceUsdCents || process.env.FLUTTERWAVE_AI_TOOL_DEFAULT_CENTS || 299);
        amountMinor = Math.min(500000, Math.max(50, Math.round(suggested)));
        if (currency === "NGN") {
          amountMinor = Math.min(
            50000000,
            Math.max(5000, Math.round(amountMinor * (Number(process.env.FLUTTERWAVE_USD_TO_NGN_RATE || 1500) / 100)))
          );
        }
        meta.agentId = String(req.body?.agentId || "").slice(0, 120);
      } else if (kind === "marketplace_sku") {
        const mp = require("./db/persistenceMarketplace");
        const skuId = String(req.body?.marketplaceSkuId || "").trim();
        if (!skuId) return res.status(400).json({ error: "marketplaceSkuId required." });
        const sku = await mp.getSkuById(skuId);
        if (!sku || !sku.active) return res.status(404).json({ error: "SKU not found or inactive." });
        if (sku.listingStatus !== "published") return res.status(400).json({ error: "Listing is not purchasable." });
        creatorUserId = sku.sellerUserId || null;
        if (currency === "USD") amountMinor = sku.priceUsdCents || 0;
        else amountMinor = Math.round((sku.priceNgn || 0) * 100);
        if (amountMinor <= 0) return res.status(400).json({ error: "SKU has no price in the selected currency." });
        meta.marketplaceSkuId = skuId;
        meta.listingId = sku.listingId;
        meta.skuLabel = sku.label;
      } else {
        return res.status(400).json({ error: "Unsupported kind." });
      }

      const txRef = newTxRef();
      const txId = await persistenceFlutterwave.insertPendingTx({
        userId,
        txRef,
        amountMinor,
        currency,
        kind,
        creatorUserId,
        metadata: meta,
      });
      if (!txId) return res.status(500).json({ error: "Could not create transaction row." });

      const amountMajor = (amountMinor / 100).toFixed(2);
      const payload = {
        tx_ref: txRef,
        amount: amountMajor,
        currency,
        redirect_url: redirectUrl,
        payment_options: "card,ussd,account,banktransfer,mobilemoneyghana",
        customer: { email, phonenumber: phone, name },
        customizations: {
          title: "CCWEB",
          description: `CCWEB · ${kind}`,
          logo: String(process.env.PUBLIC_APP_URL || "").trim() || undefined,
        },
        meta: { userId, kind, txId },
      };

      const { link } = await flw.createHostedPaymentLink(payload);
      res.status(201).json({ checkoutLink: link, txRef, txId, amountMinor, currency, kind });
    } catch (e) {
      if (e.response?.data) e.detail = e.response.data;
      next(e);
    }
  });

  router.get("/verify", authJwtMiddleware, async (req, res, next) => {
    try {
      if (!flw.isConfigured()) return res.status(503).json({ error: "Flutterwave not configured." });
      const txRef = String(req.query.tx_ref || "").trim();
      if (!txRef) return res.status(400).json({ error: "tx_ref required." });
      const remote = await flw.verifyByTxRef(txRef);
      const data = remote?.data;
      if (!data) return res.status(400).json({ error: "Verification failed.", raw: remote });
      const { rows } = await query(`SELECT user_id FROM ccweb_flutterwave_transactions WHERE tx_ref = $1`, [txRef]);
      if (!rows[0] || rows[0].user_id !== req.ccwebUserId) {
        return res.status(403).json({ error: "Transaction not found for this user." });
      }
      const out = await persistenceFlutterwave.applySuccessfulCharge(txRef, data);
      res.json({ ok: true, remoteStatus: data.status, fulfillment: out });
    } catch (e) {
      next(e);
    }
  });

  router.get("/wallet", authJwtMiddleware, async (req, res, next) => {
    try {
      const w = await persistenceFlutterwave.getWallet(req.ccwebUserId);
      res.json({ wallet: w });
    } catch (e) {
      next(e);
    }
  });

  router.get("/transactions", authJwtMiddleware, async (req, res, next) => {
    try {
      const rows = await persistenceFlutterwave.listUserTransactions(req.ccwebUserId, Number(req.query.limit) || 40);
      res.json({ transactions: rows });
    } catch (e) {
      next(e);
    }
  });

  router.get("/creator/summary", authJwtMiddleware, async (req, res, next) => {
    try {
      const s = await persistenceFlutterwave.creatorEarningsSummary(req.ccwebUserId);
      const incoming = await persistenceFlutterwave.listCreatorIncoming(req.ccwebUserId, 30);
      const payouts = await persistenceFlutterwave.listPayoutRequests(req.ccwebUserId, 30);
      res.json({ summary: s, incoming, payouts });
    } catch (e) {
      next(e);
    }
  });

  router.post("/payout-request", authJwtMiddleware, async (req, res, next) => {
    try {
      const currency = String(req.body?.currency || "USD").toUpperCase();
      if (currency !== "USD" && currency !== "NGN") return res.status(400).json({ error: "currency must be USD or NGN." });
      const major = Number(req.body?.amountMajor);
      if (!Number.isFinite(major) || major <= 0) return res.status(400).json({ error: "amountMajor required." });
      const minor = Math.round(major * 100);
      const bank = typeof req.body?.bank === "object" && req.body.bank ? req.body.bank : {};
      const out = await persistenceFlutterwave.createPayoutRequest(req.ccwebUserId, minor, currency, bank);
      if (!out.ok) {
        const code = out.code || "payout_rejected";
        const status = code === "encryption_unconfigured" ? 503 : 400;
        return res.status(status).json({ error: code, code, riskFlags: out.riskFlags || [] });
      }
      res.status(201).json({ ok: true, payoutRequestId: out.id, riskFlags: out.riskFlags || [] });
    } catch (e) {
      next(e);
    }
  });

  return router;
}

module.exports = { createFlutterwaveRouter };
