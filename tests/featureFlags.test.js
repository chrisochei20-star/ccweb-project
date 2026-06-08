import { describe, expect, it } from "vitest";
import { showAiStreamingDemo, showBuilderBetaPanels } from "../src/lib/featureFlags.js";

describe("featureFlags", () => {
  it("builder beta panels off by default", () => {
    expect(showBuilderBetaPanels()).toBe(false);
  });

  it("ai streaming demo off by default", () => {
    expect(showAiStreamingDemo()).toBe(false);
  });
});
