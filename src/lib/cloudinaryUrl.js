/**
 * Cloudinary delivery transforms for production bandwidth savings.
 * Safe no-op for non-Cloudinary URLs.
 */

/**
 * @param {string | null | undefined} url
 * @param {{ width?: number, height?: number, crop?: string }} [opts]
 */
export function optimizeCloudinaryUrl(url, opts = {}) {
  const raw = String(url || "").trim();
  if (!raw || !raw.includes("res.cloudinary.com")) return raw;
  if (raw.includes("/f_auto") || raw.includes("/q_auto")) return raw;

  const width = Number(opts.width) || 0;
  const height = Number(opts.height) || 0;
  const crop = opts.crop || "limit";
  const parts = [];
  if (width > 0) parts.push(`w_${Math.round(width)}`);
  if (height > 0) parts.push(`h_${Math.round(height)}`);
  if (parts.length) parts.push(`c_${crop}`);
  parts.push("f_auto", "q_auto");

  const marker = "/upload/";
  const idx = raw.indexOf(marker);
  if (idx === -1) return raw;
  const prefix = raw.slice(0, idx + marker.length);
  const suffix = raw.slice(idx + marker.length);
  return `${prefix}${parts.join(",")}/${suffix}`;
}
