/** Server default from CCWEB_UPLOAD_MAX_BYTES (12 MiB). */
export const CLIENT_UPLOAD_MAX_BYTES = 12 * 1024 * 1024;

export function formatBytes(n) {
  const v = Number(n) || 0;
  if (v >= 1024 * 1024) return `${(v / (1024 * 1024)).toFixed(1)} MB`;
  if (v >= 1024) return `${Math.round(v / 1024)} KB`;
  return `${v} B`;
}

/**
 * @param {File | Blob | null | undefined} file
 * @param {number} [maxBytes]
 * @returns {string | null} user-facing error or null if OK
 */
export function validateUploadFileSize(file, maxBytes = CLIENT_UPLOAD_MAX_BYTES) {
  if (!file) return "No file selected.";
  const size = file.size ?? 0;
  if (size <= 0) return "File is empty.";
  if (size > maxBytes) {
    return `Image is too large (${formatBytes(size)}). Maximum is ${formatBytes(maxBytes)}.`;
  }
  return null;
}
