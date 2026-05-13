import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("persistenceNotifications", () => {
  const prev = process.env.DATABASE_URL;

  beforeEach(() => {
    delete process.env.DATABASE_URL;
    vi.resetModules();
  });

  afterEach(() => {
    process.env.DATABASE_URL = prev;
  });

  it("returns empty list when DATABASE_URL is unset", async () => {
    const mod = await import("../db/persistenceNotifications.js");
    expect(mod.enabled()).toBe(false);
    const data = await mod.listForUser("u_test", { limit: 10 });
    expect(data.items).toEqual([]);
    expect(data.unreadCount).toBe(0);
    expect(data.nextCursor).toBeNull();
  });
});
