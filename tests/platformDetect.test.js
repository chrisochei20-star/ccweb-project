import { describe, expect, it } from "vitest";
import { isCapacitorNative, isCapacitorAndroid } from "../src/lib/platformDetect.js";

describe("platformDetect", () => {
  it("exports native detection helpers", () => {
    expect(typeof isCapacitorNative()).toBe("boolean");
    expect(typeof isCapacitorAndroid()).toBe("boolean");
  });
});
