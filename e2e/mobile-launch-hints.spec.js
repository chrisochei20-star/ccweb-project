// @ts-check
const { test, expect } = require("@playwright/test");

test.describe("Mobile launch hints", () => {
  test("narrow viewport loads shop and config reports push + ops keys", async ({ page, request }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/shop", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();

    const apiPort = process.env.PLAYWRIGHT_API_PORT || "3055";
    const res = await request.get(`http://127.0.0.1:${apiPort}/api/v1/config`);
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json).toHaveProperty("push");
    expect(typeof json.push.fcmConfigured).toBe("boolean");
    expect(json).toHaveProperty("opsAlerts");
    expect(typeof json.opsAlerts.webhookConfigured).toBe("boolean");
  });
});
