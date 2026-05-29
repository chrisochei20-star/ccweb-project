import { describe, expect, it } from "vitest";
import { validateImageBuffer } from "../services/imageMagic.js";

describe("imageMagic", () => {
  it("accepts png magic bytes", () => {
    const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    const r = validateImageBuffer(buf);
    expect(r.ok).toBe(true);
  });

  it("rejects random bytes", () => {
    const buf = Buffer.from("hello world");
    const r = validateImageBuffer(buf);
    expect(r.ok).toBe(false);
  });
});
