/**
 * Authenticated image uploads (profiles) — multer memory + Cloudinary or local disk.
 */

const express = require("express");
const multer = require("multer");
const pgUserProfile = require("./db/pgUserProfile");
const { validateImageBuffer } = require("./services/imageMagic");
const { saveUploadedImage } = require("./services/imageStorage");
const { logger } = require("./logging/logger");

const MAX_BYTES = Number(process.env.CCWEB_UPLOAD_MAX_BYTES || 12 * 1024 * 1024);

function imageMulter() {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_BYTES },
    fileFilter(req, file, cb) {
      const ok = /^image\/(jpeg|jpg|pjpeg|png|webp|gif)$/i.test(file.mimetype);
      cb(null, ok);
    },
  });
}

function createUploadsRouter(deps) {
  const { authJwtMiddleware, ccwebUsers, buildUserProfile, sanitizeUser } = deps || {};
  if (typeof authJwtMiddleware !== "function") {
    throw new Error("createUploadsRouter: authJwtMiddleware must be provided and be a function");
  }
  if (typeof buildUserProfile !== "function" || typeof sanitizeUser !== "function") {
    throw new Error("createUploadsRouter: buildUserProfile and sanitizeUser are required");
  }
  if (!ccwebUsers || typeof ccwebUsers.get !== "function") {
    throw new Error("createUploadsRouter: ccwebUsers Map is required");
  }
  const router = express.Router();
  const upload = imageMulter();

  router.post("/profile/avatar", authJwtMiddleware, upload.single("file"), async (req, res, next) => {
    try {
      if (!(process.env.DATABASE_URL || "").trim()) {
        return res.status(503).json({ error: "PostgreSQL required for profile media.", code: "NO_DATABASE" });
      }
      if (!req.file?.buffer) return res.status(400).json({ error: "Image file required (field name: file)." });
      const v = validateImageBuffer(req.file.buffer);
      if (!v.ok) return res.status(400).json({ error: v.error });
      const saved = await saveUploadedImage(req.file.buffer, {
        mimetype: req.file.mimetype,
        originalName: req.file.originalname,
        userId: req.ccwebUserId,
        kind: "avatar",
      });
      await pgUserProfile.patchProfileMedia(req.ccwebUserId, { avatarUrl: saved.url });
      const prev = ccwebUsers.get(req.ccwebUserId);
      const merged = buildUserProfile({ userId: req.ccwebUserId, avatarUrl: saved.url }, prev || null);
      ccwebUsers.set(req.ccwebUserId, merged);
      logger.info({
        msg: "profile_upload_ok",
        kind: "avatar",
        userId: req.ccwebUserId,
        storage: saved.storage,
        bytes: req.file.size,
      });
      res.json({ ok: true, url: saved.url, storage: saved.storage, user: sanitizeUser(merged) });
    } catch (e) {
      logger.warn({
        msg: "profile_upload_failed",
        kind: "avatar",
        userId: req.ccwebUserId,
        err: e.message,
      });
      next(e);
    }
  });

  router.post("/profile/banner", authJwtMiddleware, upload.single("file"), async (req, res, next) => {
    try {
      if (!(process.env.DATABASE_URL || "").trim()) {
        return res.status(503).json({ error: "PostgreSQL required for profile media.", code: "NO_DATABASE" });
      }
      if (!req.file?.buffer) return res.status(400).json({ error: "Image file required (field name: file)." });
      const v = validateImageBuffer(req.file.buffer);
      if (!v.ok) return res.status(400).json({ error: v.error });
      const saved = await saveUploadedImage(req.file.buffer, {
        mimetype: req.file.mimetype,
        originalName: req.file.originalname,
        userId: req.ccwebUserId,
        kind: "banner",
      });
      await pgUserProfile.patchProfileMedia(req.ccwebUserId, { bannerUrl: saved.url });
      const prev = ccwebUsers.get(req.ccwebUserId);
      const merged = buildUserProfile({ userId: req.ccwebUserId, bannerUrl: saved.url }, prev || null);
      ccwebUsers.set(req.ccwebUserId, merged);
      logger.info({
        msg: "profile_upload_ok",
        kind: "banner",
        userId: req.ccwebUserId,
        storage: saved.storage,
        bytes: req.file.size,
      });
      res.json({ ok: true, url: saved.url, storage: saved.storage, user: sanitizeUser(merged) });
    } catch (e) {
      logger.warn({
        msg: "profile_upload_failed",
        kind: "banner",
        userId: req.ccwebUserId,
        err: e.message,
      });
      next(e);
    }
  });

  return router;
}

module.exports = { createUploadsRouter, imageMulter, MAX_BYTES };
