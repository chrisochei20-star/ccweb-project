/**
 * Shell coverage for marketplace + creator flows (no payment secrets required).
 */

const { test, expect } = require("@playwright/test");

test.describe("Marketplace real-world hardening shell", () => {
  test("shop home and creator surfaces load", async ({ page }) => {
    await page.goto("/shop", { waitUntil: "domcontentloaded" });
    await expect(page.locator("text=Creator marketplace").first()).toBeVisible({ timeout: 30_000 });

    await page.goto("/shop/creator/studio", { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-ccweb-e2e="creator-studio-heading"]')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator("summary", { hasText: "First publish checklist" })).toBeVisible();

    await page.goto("/shop/creator/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page.locator("text=Marketplace dashboard").first()).toBeVisible({ timeout: 30_000 });
  });

  test("notifications shell loads for signed-out users", async ({ page }) => {
    await page.goto("/notifications", { waitUntil: "domcontentloaded" });
    await expect(page.locator("main.ccweb-main-pad, main").first()).toBeVisible({ timeout: 25_000 });
  });
});
