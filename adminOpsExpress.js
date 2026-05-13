/**
 * Admin operations: payouts, trust queue, moderation, audit, revenue.
 * All routes require header X-CCWEB-Admin matching CCWEB_ADMIN_KEY.
 */

const express = require("express");
const flwPg = require("../db/persistenceFlutterwave");
const auditPg = require("../db/persistenceAudit");
const trustPg = require("../db/persistenceTrust");
const modPg = require("../db/persistenceModeration");
const { query } = require("../db/pool");
const flwTransfers = require("../services/flutterwaveTransfers");
const flwClient = require("../services/flutterwaveClient");
const payoutCrypto = require("../services/payoutFieldCrypto");
const { getClientIp } = require("../server/http/middleware/expressRateLimit");

function requireAdmin(req, res, next) {
  const key = (req.headers["x-ccweb-admin"] || "").toString().trim();
  const adminKey = (process.env.CCWEB_ADMIN_KEY || "").trim();
  if (!adminKey || key !== adminKey) {
    return res.status(403).json({ error: "Admin key required (X-CCWEB-Admin)." });
  }
  next();
}

function adminLabel(req) {
  return (req.headers["x-ccweb-admin-label"] || "admin").toString().trim().slice(0, 120);
}

function createAdminOpsRouter() {
  const router = express.Router();
  router.use(requireAdmin);

  router.get("/payouts", async (req, res, next) => {
    try {
      if (!flwPg.usePostgres()) return res.status(503).json({ error: "PostgreSQL required." });
      const status = (req.query.status || "").toString().trim() || null;
      const payouts = await flwPg.listPayoutRequestsAdmin({ status, limit: Number(req.query.limit) || 80 });
      res.json({ payouts });
    } catch (e) {
      next(e);
    }
  });

  router.post("/payouts/:id/approve", async (req, res, next) => {
    try {
      if (!flwPg.usePostgres()) return res.status(503).json({ error: "PostgreSQL required." });
      const id = req.params.id;
      const ok = await flwPg.approvePayoutRequest(id, adminLabel(req));
      if (!ok) return res.status(400).json({ error: "Payout not in pending_review or not found." });
      await auditPg.insertAuditLog({
        actorLabel: adminLabel(req),
        action: "payout_approve",
        targetType: "payout_request",
        targetId: id,
        ip: getClientIp(req),
        metadata: {},
      });
      res.json({ ok: true, id });
    } catch (e) {
      next(e);
    }
  });

  router.post("/payouts/:id/reject", async (req, res, next) => {
    try {
      if (!flwPg.usePostgres()) return res.status(503).json({ error: "PostgreSQL required." });
      const id = req.params.id;
      const reason = String(req.body?.reason || "").trim();
      const ok = await flwPg.rejectPayoutRequest(id, adminLabel(req), reason);
      if (!ok) return res.status(400).json({ error: "Payout not in pending_review or not found." });
      await auditPg.insertAuditLog({
        actorLabel: adminLabel(req),
        action: "payout_reject",
        targetType: "payout_request",
        targetId: id,
        ip: getClientIp(req),
        metadata: { reason: reason.slice(0, 500) },
      });
      res.json({ ok: true, id });
    } catch (e) {
      next(e);
    }
  });

  router.post("/payouts/:id/execute-transfer", async (req, res, next) => {
    try {
      if (!flwPg.usePostgres()) return res.status(503).json({ error: "PostgreSQL required." });
      if (String(process.env.FLUTTERWAVE_PAYOUT_ENABLED || "") !== "1") {
        return res.status(403).json({ error: "Live Flutterwave payouts disabled (set FLUTTERWAVE_PAYOUT_ENABLED=1).", code: "PAYOUT_DISABLED" });
      }
      if (!flwClient.isConfigured()) return res.status(503).json({ error: "Flutterwave secret not configured." });
      if (!payoutCrypto.isConfigured()) return res.status(503).json({ error: "Payout encryption key missing (CCWEB_PAYOUT_ENCRYPTION_KEY)." });

      const row = await flwPg.getPayoutRequestById(req.params.id);
      if (!row) return res.status(404).json({ error: "Payout not found." });
      if (row.status !== "approved") return res.status(400).json({ error: "Payout must be approved first.", status: row.status });

      const bank = payoutCrypto.decryptJson(row.encrypted_bank);
      if (!bank) return res.status(500).json({ error: "Could not decrypt bank payload (key rotation?)." });

      const transferRef = `ccweb-po-${row.id}`.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48);
      const cur = String(row.currency).toUpperCase();
      const amountMajor = Number(row.amount_minor) / 100;

      if (cur === "NGN") {
        try {
          await flwTransfers.resolveBankAccount({
            accountNumber: bank.account_number,
            accountBank: bank.account_bank,
          });
        } catch (e) {
          return res.status(400).json({
            error: "Bank resolve failed — verify account number and bank code.",
            detail: e.response?.data || String(e.message),
          });
        }
      }

      let beneficiaryId = row.flw_recipient_id ? String(row.flw_recipient_id) : null;
      if (!beneficiaryId) {
        const country = (row.bank_meta && row.bank_meta.country) || (cur === "NGN" ? "NG" : "US");
        const benRes = await flwTransfers.createBeneficiary({
          account_bank: bank.account_bank,
          account_number: bank.account_number,
          beneficiary_name: bank.beneficiary_name,
          currency: cur,
          country,
        });
        beneficiaryId = benRes?.data?.id != null ? String(benRes.data.id) : null;
        if (!beneficiaryId) {
          return res.status(502).json({ error: "Could not create Flutterwave beneficiary.", raw: benRes });
        }
        await query(`UPDATE ccweb_payout_requests SET flw_recipient_id = $2, updated_at = NOW() WHERE id = $1`, [
          row.id,
          beneficiaryId,
        ]);
      }

      const trRes = await flwTransfers.createTransfer({
        reference: transferRef,
        currency: cur,
        amount: amountMajor,
        narration: `CCWEB payout ${row.id}`.slice(0, 64),
        beneficiary: Number(beneficiaryId),
      });
      const tid = trRes?.data?.id != null ? String(trRes.data.id) : null;
      if (!tid) {
        return res.status(502).json({ error: "Flutterwave did not return transfer id.", raw: trRes });
      }

      await flwPg.markPayoutTransferSubmitted(row.id, {
        flwTransferId: tid,
        transferRef,
        meta: { flutterwaveStatus: trRes.data?.status, raw: trRes },
      });

      await auditPg.insertAuditLog({
        actorLabel: adminLabel(req),
        action: "payout_execute_transfer",
        targetType: "payout_request",
        targetId: row.id,
        ip: getClientIp(req),
        metadata: { transferRef, flwTransferId: tid },
      });

      res.json({ ok: true, payoutId: row.id, transferRef, flwTransferId: tid, flutterwave: trRes.data || trRes });
    } catch (e) {
      if (e.response?.data) e.detail = e.response.data;
      next(e);
    }
  });

  router.post("/payouts/:id/sync-transfer", async (req, res, next) => {
    try {
      if (!flwPg.usePostgres()) return res.status(503).json({ error: "PostgreSQL required." });
      if (!flwClient.isConfigured()) return res.status(503).json({ error: "Flutterwave secret not configured." });
      const row = await flwPg.getPayoutRequestById(req.params.id);
      if (!row?.flw_transfer_id) return res.status(400).json({ error: "No Flutterwave transfer id on this payout." });
      const remote = await flwTransfers.getTransfer(row.flw_transfer_id);
      const d = remote?.data || remote;
      const out = await flwPg.applyTransferNotification({
        id: d.id,
        reference: d.reference || row.transfer_ref,
        status: d.status,
        complete_message: d.complete_message,
        message: d.message,
      });
      await auditPg.insertAuditLog({
        actorLabel: adminLabel(req),
        action: "payout_sync_transfer",
        targetType: "payout_request",
        targetId: row.id,
        ip: getClientIp(req),
        metadata: { remoteStatus: d.status, out },
      });
      res.json({ ok: true, remote: d, result: out });
    } catch (e) {
      next(e);
    }
  });

  router.get("/reports", async (req, res, next) => {
    try {
      if (!flwPg.usePostgres()) return res.status(503).json({ error: "PostgreSQL required." });
      const status = (req.query.status || "").toString().trim() || null;
      const reports = await trustPg.listReportsForAdmin({ status, limit: Number(req.query.limit) || 80 });
      res.json({ reports });
    } catch (e) {
      next(e);
    }
  });

  router.post("/reports/:id/status", async (req, res, next) => {
    try {
      const id = req.params.id;
      const status = String(req.body?.status || "").trim();
      const moderatorNote = req.body?.moderatorNote;
      const out = await trustPg.updateReportStatus(id, { status, moderatorNote, resolved: status !== "open" });
      if (!out.ok) return res.status(400).json({ error: "Invalid status or report not found." });
      await auditPg.insertAuditLog({
        actorLabel: adminLabel(req),
        action: "trust_report_update",
        targetType: "trust_report",
        targetId: id,
        ip: getClientIp(req),
        metadata: { status },
      });
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });

  router.get("/moderation/actions", async (req, res, next) => {
    try {
      const actions = await modPg.listModerationActions(Number(req.query.limit) || 100);
      res.json({ actions });
    } catch (e) {
      next(e);
    }
  });

  router.post("/moderation/hide-post/:postId", async (req, res, next) => {
    try {
      const ok = await modPg.hideCommunityPost(req.params.postId, { actorLabel: adminLabel(req), reason: String(req.body?.reason || ""), ip: getClientIp(req) });
      if (!ok) return res.status(404).json({ error: "Post not found." });
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });

  router.post("/moderation/hide-comment/:commentId", async (req, res, next) => {
    try {
      const ok = await modPg.hideCommunityComment(req.params.commentId, {
        actorLabel: adminLabel(req),
        reason: String(req.body?.reason || ""),
        ip: getClientIp(req),
      });
      if (!ok) return res.status(404).json({ error: "Comment not found." });
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });

  router.post("/moderation/hide-message/:messageId", async (req, res, next) => {
    try {
      const ok = await modPg.hideChatMessage(req.params.messageId, {
        actorLabel: adminLabel(req),
        reason: String(req.body?.reason || ""),
        ip: getClientIp(req),
      });
      if (!ok) return res.status(404).json({ error: "Message not found." });
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });

  router.get("/audit", async (req, res, next) => {
    try {
      const logs = await auditPg.listAuditLogs(Number(req.query.limit) || 120);
      res.json({ logs });
    } catch (e) {
      next(e);
    }
  });

  router.get("/revenue/flutterwave", async (req, res, next) => {
    try {
      const snapshot = await flwPg.adminFlutterwaveRevenueSnapshot();
      res.json({ snapshot });
    } catch (e) {
      next(e);
    }
  });

  router.get("/transactions/flutterwave", async (req, res, next) => {
    try {
      if (!flwPg.usePostgres()) return res.status(503).json({ error: "PostgreSQL required." });
      const lim = Math.min(200, Math.max(1, Number(req.query.limit) || 100));
      const { rows } = await query(
        `SELECT id, user_id, tx_ref, amount_minor, currency, status, kind, flw_tx_id, creator_user_id, created_at
         FROM ccweb_flutterwave_transactions ORDER BY created_at DESC LIMIT $1`,
        [lim]
      );
      res.json({ transactions: rows });
    } catch (e) {
      next(e);
    }
  });

  return router;
}

module.exports = { createAdminOpsRouter };
