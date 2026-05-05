/**
 * Smoke tests against a deployed CCWEB (or local preview).
 *
 * Usage (production / staging):
 *   PLAYWRIGHT_BASE_URL=https://your-app.vercel.app \
 *   E2E_API_BASE_URL=https://your-api.onrender.com \
 *   PRODUCTION_E2E=1 \
 *   npm run test:e2e:production
 *
 * Optional: E2E_TEST_EMAIL / E2E_TEST_PASSWORD — if set, runs signup+login flow (creates user).
 */

const { test, expect } = require("@playwright/test");

const productionE2E = process.env.PRODUCTION_E2E === "1" || process.env.PRODUCTION_E2E === "true";
const apiBase = (
  process.env.E2E_API_BASE_URL ||
  (productionE2E ? "" : `http://127.0.0.1:${process.env.PLAYWRIGHT_API_PORT || "3055"}`)
).replace(/\/$/, "");

test.describe("Production smoke", () => {
  test("home loads", async ({ page }) => {
    const t0 = Date.now();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("text=CCWEB").first()).toBeVisible({ timeout: 30_000 });
    const ms = Date.now() - t0;
    expect(ms).toBeLessThan(60_000);
  });

  test("API health (direct)", async ({ request }) => {
    test.skip(!apiBase, "Set E2E_API_BASE_URL for API checks");
    const res = await request.get(`${apiBase}/health`);
    expect(res.ok()).toBeTruthy();
    const j = await res.json();
    expect(j.status).toBe("ok");
  });

  test("API config (direct)", async ({ request }) => {
    test.skip(!apiBase, "Set E2E_API_BASE_URL for API checks");
    const res = await request.get(`${apiBase}/api/v1/config`);
    expect(res.ok()).toBeTruthy();
    const j = await res.json();
    expect(j).toHaveProperty("environment");
  });

  test("protected API rejects anonymous", async ({ request }) => {
    test.skip(!apiBase, "Set E2E_API_BASE_URL for API checks");
    const res = await request.get(`${apiBase}/api/v1/users/me`, {
      headers: { Authorization: "Bearer invalid-token" },
    });
    expect(res.status()).toBe(401);
  });

  test("core navigation shells load", async ({ page }) => {
    for (const path of ["/find", "/learn", "/build", "/earn", "/community", "/profile"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page.locator("main.ccweb-main-pad, main").first()).toBeVisible({ timeout: 25_000 });
    }
  });

  test("optional: email signup + login", async ({ page }) => {
    const email = process.env.E2E_TEST_EMAIL;
    const password = process.env.E2E_TEST_PASSWORD;
    test.skip(!email || !password, "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD to run auth E2E");

    await page.goto("/signup", { waitUntil: "domcontentloaded" });
    await page.locator('[data-ccweb-e2e="signup-display-name"]').fill("E2E User");
    await page.locator('[data-ccweb-e2e="auth-email"]').fill(email);
    await page.locator('[data-ccweb-e2e="auth-password"]').fill(password);
    await page.locator('[data-ccweb-e2e="auth-submit"]').click();
    await expect(page.locator('[data-ccweb-e2e="logout"]')).toBeVisible({ timeout: 60_000 });

    await page.locator('[data-ccweb-e2e="logout"]').click();
    await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });

    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.locator('[data-ccweb-e2e="auth-email"]').fill(email);
    await page.locator('[data-ccweb-e2e="auth-password"]').fill(password);
    await page.locator('[data-ccweb-e2e="auth-submit"]').click();
    await expect(page.locator('[data-ccweb-e2e="logout"]')).toBeVisible({ timeout: 60_000 });
  });
});
