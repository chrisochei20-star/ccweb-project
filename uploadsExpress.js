/**
 * Authenticated image uploads (profiles) — multer memory + Cloudinary or local disk.
 */

const express = require("express");
const multer = require("multer");
const pgUserProfile = require("./db/pgUserProfile");
const { validateImageBuffer } = require("./services/imageMagic");
const { saveUploadedImage } = require("./services/imageStorage");

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
      res.json({ ok: true, url: saved.url, storage: saved.storage, user: sanitizeUser(merged) });
    } catch (e) {
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
      res.json({ ok: true, url: saved.url, storage: saved.storage, user: sanitizeUser(merged) });
    } catch (e) {
      next(e);
    }
  });

  router.post("/community/image", authJwtMiddleware, upload.single("file"), async (req, res, next) => {
    try {
      if (!req.file?.buffer) return res.status(400).json({ error: "Image file required (field name: file)." });
      const v = validateImageBuffer(req.file.buffer);
      if (!v.ok) return res.status(400).json({ error: v.error });
      const saved = await saveUploadedImage(req.file.buffer, {
        mimetype: req.file.mimetype,
        originalName: req.file.originalname,
        userId: req.ccwebUserId,
        kind: "community",
      });
      res.json({ ok: true, url: saved.url, storage: saved.storage });
    } catch (e) {
      next(e);
    }
  });

  const videoMulter = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: Math.min(MAX_BYTES * 6, 70 * 1024 * 1024) },
    fileFilter(req, file, cb) {
      cb(null, /^video\/(mp4|webm|quicktime)$/i.test(file.mimetype));
    },
  });

  router.post("/community/video", authJwtMiddleware, videoMulter.single("file"), async (req, res, next) => {
    try {
      const { isCloudinaryConfigured, uploadVideoBuffer } = require("./services/cloudinaryUpload");
      if (!isCloudinaryConfigured()) {
        return res.status(503).json({ error: "Cloudinary is required for community video uploads.", code: "NO_CLOUDINARY" });
      }
      if (!req.file?.buffer) return res.status(400).json({ error: "Video file required (field name: file)." });
      const uid = String(req.ccwebUserId || "anon").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
      const folder = `ccweb/community/${uid}/video`;
      const out = await uploadVideoBuffer(req.file.buffer, {
        folder,
        filenameHint: (req.file.originalname || "clip").toString().slice(0, 80),
      });
      res.json({ ok: true, url: out.secure_url, storage: "cloudinary" });
    } catch (e) {
      next(e);
    }
  });

  router.post("/marketplace/image", authJwtMiddleware, upload.single("file"), async (req, res, next) => {
    try {
      if (!req.file?.buffer) return res.status(400).json({ error: "Image file required (field name: file)." });
      const v = validateImageBuffer(req.file.buffer);
      if (!v.ok) return res.status(400).json({ error: v.error });
      const saved = await saveUploadedImage(req.file.buffer, {
        mimetype: req.file.mimetype,
        originalName: req.file.originalname,
        userId: req.ccwebUserId,
        kind: "marketplace",
      });
      res.json({ ok: true, url: saved.url, storage: saved.storage });
    } catch (e) {
      next(e);
    }
  });

  return router;
}

module.exports = { createUploadsRouter, imageMulter, MAX_BYTES };
