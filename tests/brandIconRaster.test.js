import { describe, expect, it } from "vitest";
import { pointInPoly, BOLT_POLY_108, scalePoly } from "../scripts/lib/brandIconRaster.mjs";

describe("brandIconRaster", () => {
  it("detects points inside the CCWEB bolt polygon", () => {
    const poly = scalePoly(BOLT_POLY_108, 108, 0.16);
    const cx = 54;
    const cy = 54;
    expect(pointInPoly(cx, cy, poly)).toBe(true);
    expect(pointInPoly(4, 4, poly)).toBe(false);
  });
});
