import { describe, expect, it } from "vitest";
import { dedupeById, mergePostsById } from "../src/lib/feedMerge.js";

describe("feedMerge", () => {
  it("dedupeById keeps first occurrence", () => {
    const out = dedupeById([
      { id: "a", title: "1" },
      { id: "a", title: "2" },
      { id: "b", title: "3" },
    ]);
    expect(out).toHaveLength(2);
    expect(out[0].title).toBe("1");
  });

  it("mergePostsById merges fields and sorts by createdAt desc", () => {
    const merged = mergePostsById(
      [{ id: "p1", title: "Old", createdAt: "2026-01-01T00:00:00.000Z", commentCount: 1 }],
      [{ id: "p1", title: "New", createdAt: "2026-01-02T00:00:00.000Z" }, { id: "p2", title: "B", createdAt: "2026-01-03T00:00:00.000Z" }]
    );
    expect(merged[0].id).toBe("p2");
    expect(merged.find((p) => p.id === "p1")?.title).toBe("New");
    expect(merged.find((p) => p.id === "p1")?.commentCount).toBe(1);
  });
});
