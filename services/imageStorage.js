/**
 * Persist uploaded images: Cloudinary when configured, else local disk under /public/uploads.
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { isCloudinaryConfigured, uploadBuffer, uploadVideoBuffer } = require("./cloudinaryUpload");

/** @typedef {'avatar'|'banner'|'chat'|'course_thumb'|'community'} UploadKind */

function transformationForKind(kind) {
  switch (kind) {
    case "avatar":
      return [{ width: 512, height: 512, crop: "fill", gravity: "face", quality: "auto", fetch_format: "auto" }];
    case "banner":
      return [{ width: 1600, height: 480, crop: "fill", gravity: "auto", quality: "auto", fetch_format: "auto" }];
    case "course_thumb":
      return [{ width: 1200, height: 675, crop: "limit", quality: "auto", fetch_format: "auto" }];
    case "community":
      return [{ width: 1600, height: 1600, crop: "limit", quality: "auto", fetch_format: "auto" }];
    case "chat":
    default:
      return [{ width: 1600, height: 1600, crop: "limit", quality: "auto", fetch_format: "auto" }];
  }
}

function folderForKind(kind, userId) {
  const uid = String(userId || "anon").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  switch (kind) {
    case "avatar":
      return `ccweb/profiles/${uid}/avatar`;
    case "banner":
      return `ccweb/profiles/${uid}/banner`;
    case "chat":
      return `ccweb/chat/${uid}`;
    case "course_thumb":
      return "ccweb/courses/thumbnails";
    case "community":
      return `ccweb/community/${uid}`;
    default:
      return `ccweb/misc/${uid}`;
  }
}

function diskDirForKind(kind, userId) {
  const uid = String(userId || "misc").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  switch (kind) {
    case "avatar":
      return path.join(__dirname, "..", "public", "uploads", "profiles", uid);
    case "banner":
      return path.join(__dirname, "..", "public", "uploads", "profiles", uid);
    case "chat":
      return path.join(__dirname, "..", "public", "uploads", "chat", uid);
    case "course_thumb":
      return path.join(__dirname, "..", "public", "uploads", "courses");
    case "community":
      return path.join(__dirname, "..", "public", "uploads", "community", uid);
    default:
      return path.join(__dirname, "..", "public", "uploads", "misc", uid);
  }
}

function extForMime(mimetype) {
  const m = (mimetype || "").toLowerCase();
  if (m.includes("png")) return ".png";
  if (m.includes("webp")) return ".webp";
  if (m.includes("gif")) return ".gif";
  if (m.includes("pdf")) return ".pdf";
  return ".jpg";
}

/**
 * @returns {Promise<{ url: string, storage: 'cloudinary'|'local' }>}
 */
async function saveUploadedImage(buffer, { mimetype, originalName, userId, kind }) {
  const hint = path.basename(originalName || "upload").replace(/[^\w.-]/g, "") || "upload";
  const ext = extForMime(mimetype);

  if (isCloudinaryConfigured()) {
    const folder = folderForKind(kind, userId);
    const tf = transformationForKind(kind);
    const out = await uploadBuffer(buffer, {
      folder,
      filenameHint: `${kind}-${hint}`,
      transformation: tf,
    });
    return { url: out.secure_url, storage: "cloudinary" };
  }

  const dir = diskDirForKind(kind, userId);
  fs.mkdirSync(dir, { recursive: true });
  const name = `${kind}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`;
  const full = path.join(dir, name);
  fs.writeFileSync(full, buffer);

  const rel = path.relative(path.join(__dirname, "..", "public"), full).split(path.sep).join("/");
  return { url: `/${rel}`, storage: "local" };
}

/**
 * Chat attachment: image (local/Cloudinary), video (Cloudinary only), or PDF (local disk).
 * @returns {Promise<{ url: string, storage: 'cloudinary'|'local', attachmentType: 'image'|'video'|'file' }>}
 */
async function saveChatAttachment(buffer, { mimetype, originalName, userId }) {
  const m = (mimetype || "").toLowerCase();
  if (m.startsWith("image/")) {
    const r = await saveUploadedImage(buffer, { mimetype, originalName, userId, kind: "chat" });
    return { ...r, attachmentType: "image" };
  }
  if (m.startsWith("video/")) {
    if (!isCloudinaryConfigured()) {
      throw new Error("Video attachments require Cloudinary (set CLOUDINARY_URL or CLOUDINARY_*).");
    }
    const folder = folderForKind("chat", userId);
    const hint = path.basename(originalName || "clip").replace(/[^\w.-]/g, "") || "clip";
    const out = await uploadVideoBuffer(buffer, { folder, filenameHint: hint });
    return { url: out.secure_url, storage: "cloudinary", attachmentType: "video" };
  }
  if (m === "application/pdf") {
    const uid = String(userId || "misc").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
    const dir = path.join(__dirname, "..", "public", "uploads", "chat-files", uid);
    fs.mkdirSync(dir, { recursive: true });
    const name = `doc-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.pdf`;
    const full = path.join(dir, name);
    fs.writeFileSync(full, buffer);
    const rel = path.relative(path.join(__dirname, "..", "public"), full).split(path.sep).join("/");
    return { url: `/${rel}`, storage: "local", attachmentType: "file" };
  }
  throw new Error("Unsupported attachment type (use image, MP4/WebM video with Cloudinary, or PDF).");
}

module.exports = { saveUploadedImage, saveChatAttachment, folderForKind, transformationForKind };
