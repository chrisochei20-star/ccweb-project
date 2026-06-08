import { describe, expect, it, vi, afterEach } from "vitest";
import { formatDateSeparator, formatMessageTime, shouldShowDateSeparator, timeAgo } from "../src/lib/timeFormat.js";

describe("timeFormat", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("timeAgo returns relative labels", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-28T12:00:00.000Z"));
    expect(timeAgo("2026-05-28T11:59:30.000Z")).toBe("now");
    expect(timeAgo("2026-05-28T11:00:00.000Z")).toBe("1h");
    expect(timeAgo("2026-05-27T12:00:00.000Z")).toBe("1d");
  });

  it("formatMessageTime returns localized time", () => {
    const out = formatMessageTime("2026-05-28T14:30:00.000Z");
    expect(out).toMatch(/\d/);
  });

  it("formatDateSeparator labels today and yesterday", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-28T12:00:00.000Z"));
    expect(formatDateSeparator("2026-05-28T08:00:00.000Z")).toBe("Today");
    expect(formatDateSeparator("2026-05-27T08:00:00.000Z")).toBe("Yesterday");
  });

  it("shouldShowDateSeparator compares calendar days", () => {
    expect(shouldShowDateSeparator(null, "2026-05-28T08:00:00.000Z")).toBe(true);
    expect(
      shouldShowDateSeparator("2026-05-28T08:00:00.000Z", "2026-05-28T20:00:00.000Z")
    ).toBe(false);
    expect(
      shouldShowDateSeparator("2026-05-27T08:00:00.000Z", "2026-05-28T08:00:00.000Z")
    ).toBe(true);
  });
});
