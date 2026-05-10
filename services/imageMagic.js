/**
 * Basic image magic-byte validation (jpeg / png / webp / gif).
 */

function detectImageType(buffer) {
  if (!buffer || buffer.length < 12) return null;
  const b0 = buffer[0];
  const b1 = buffer[1];
  if (b0 === 0xff && b1 === 0xd8 && buffer[2] === 0xff) return "jpeg";
  if (b0 === 0x89 && b1 === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return "png";
  if (b0 === 0x47 && b1 === 0x49 && buffer[2] === 0x46 && (buffer[3] === 0x38 || buffer[3] === 0x39)) return "gif";
  if (
    b0 === 0x52 &&
    b1 === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "webp";
  }
  return null;
}

const ALLOWED = new Set(["jpeg", "png", "gif", "webp"]);

function validateImageBuffer(buffer) {
  const t = detectImageType(buffer);
  if (!t || !ALLOWED.has(t)) {
    return { ok: false, error: "Unsupported or corrupted image file." };
  }
  return { ok: true, type: t };
}

module.exports = { validateImageBuffer, detectImageType };
