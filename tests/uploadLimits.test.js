import { describe, expect, it } from "vitest";
import { CLIENT_UPLOAD_MAX_BYTES, formatBytes, validateUploadFileSize } from "../src/lib/uploadLimits.js";

describe("uploadLimits", () => {
  it("formatBytes renders human sizes", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(12 * 1024 * 1024)).toContain("MB");
  });

  it("validateUploadFileSize rejects oversize files", () => {
    const big = { size: CLIENT_UPLOAD_MAX_BYTES + 1 };
    expect(validateUploadFileSize(big)).toMatch(/too large/i);
    expect(validateUploadFileSize({ size: 1024 })).toBeNull();
  });

  it("validateUploadFileSize rejects empty files", () => {
    expect(validateUploadFileSize({ size: 0 })).toMatch(/empty/i);
    expect(validateUploadFileSize(null)).toMatch(/No file/i);
  });
});
