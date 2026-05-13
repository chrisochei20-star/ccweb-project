/**
 * Cloudinary uploads — configure via CLOUDINARY_URL or CLOUDINARY_* vars.
 */

const cloudinary = require("cloudinary").v2;

function configureOnce() {
  if (configureOnce._done) return;
  configureOnce._done = true;
  if ((process.env.CLOUDINARY_URL || "").trim()) {
    cloudinary.config(true);
    return;
  }
  const name = (process.env.CLOUDINARY_CLOUD_NAME || "").trim();
  const key = (process.env.CLOUDINARY_API_KEY || "").trim();
  const secret = (process.env.CLOUDINARY_API_SECRET || "").trim();
  if (name && key && secret) {
    cloudinary.config({ cloud_name: name, api_key: key, api_secret: secret });
  }
}

function isCloudinaryConfigured() {
  configureOnce();
  if ((process.env.CLOUDINARY_URL || "").trim()) return true;
  return Boolean(
    (process.env.CLOUDINARY_CLOUD_NAME || "").trim() &&
      (process.env.CLOUDINARY_API_KEY || "").trim() &&
      (process.env.CLOUDINARY_API_SECRET || "").trim()
  );
}

/**
 * Upload raw buffer; applies compression-friendly transforms per kind.
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
async function uploadBuffer(buffer, { folder, filenameHint = "img", transformation } = {}) {
  configureOnce();
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        use_filename: true,
        unique_filename: true,
        filename_override: filenameHint.slice(0, 80),
        resource_type: "image",
        overwrite: false,
        transformation: transformation || [{ quality: "auto", fetch_format: "auto" }],
      },
      (err, result) => {
        if (err) return reject(err);
        if (!result?.secure_url) return reject(new Error("Cloudinary upload failed."));
        resolve({ secure_url: result.secure_url, public_id: result.public_id });
      }
    );
    uploadStream.end(buffer);
  });
}

/**
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
async function uploadVideoBuffer(buffer, { folder, filenameHint = "clip" } = {}) {
  configureOnce();
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "video",
        use_filename: true,
        unique_filename: true,
        filename_override: String(filenameHint || "clip").slice(0, 80),
        overwrite: false,
      },
      (err, result) => {
        if (err) return reject(err);
        if (!result?.secure_url) return reject(new Error("Cloudinary video upload failed."));
        resolve({ secure_url: result.secure_url, public_id: result.public_id });
      }
    );
    uploadStream.end(buffer);
  });
}

module.exports = {
  configureOnce,
  isCloudinaryConfigured,
  uploadBuffer,
  uploadVideoBuffer,
};
