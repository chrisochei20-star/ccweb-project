/**
 * Client-side image compression via canvas (reduces upload size before multer / Cloudinary).
 */

export async function compressImageFile(
  file,
  { maxWidth = 1920, maxHeight = 1920, quality = 0.85, outputType = "image/jpeg" } = {}
) {
  if (!file?.type?.startsWith("image/")) return file;
  /** Re-encoding strips animation; keep original GIF bytes for upload. */
  if (file.type === "image/gif") return file;
  const bitmap = await createImageBitmap(file);
  try {
    const ratio = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
    const w = Math.max(1, Math.round(bitmap.width * ratio));
    const h = Math.max(1, Math.round(bitmap.height * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not encode image"))), outputType, quality);
    });
    const base = file.name.replace(/\.[^.]+$/, "") || "image";
    const ext = outputType.includes("png") ? "png" : "jpg";
    return new File([blob], `${base}-opt.${ext}`, { type: outputType });
  } finally {
    bitmap.close();
  }
}
