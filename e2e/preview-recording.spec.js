/**
 * Records a real browser session of the CCWEB app (Playwright video).
 * Run: CI=1 npm run record:preview
 * Output: test-results (webm) then scripts/finish-preview-video.sh -> ccweb-preview.mp4
 */
const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

test("CCWEB live preview recording", async ({ page, context }) => {
  const stamp = Date.now();
  const email = `preview+e2e-${stamp}@ccweb.test`;
  const password = "PreviewTest1!";

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Learn\.\s*Find\./i })).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(8000);

  await page.getByRole("link", { name: "Get Started" }).first().click();
  await expect(page).toHaveURL(/\/signup/);

  await page.getByPlaceholder("Your name").fill("Preview User");
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("min 8 characters").fill(password);
  await page.waitForTimeout(4000);
  await page.getByRole("button", { name: "Create Account" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
  await expect(page.getByText(/Welcome back/i)).toBeVisible();
  await page.waitForTimeout(10000);

  const nav = page.locator("header nav.nav-links");

  await nav.getByRole("link", { name: "Learn", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Course Library/i })).toBeVisible();
  await page.waitForTimeout(9000);

  await nav.getByRole("link", { name: "AI Streaming", exact: true }).click();
  await expect(page.getByRole("heading", { name: /AI Web Streaming/i })).toBeVisible();
  await page.waitForTimeout(9000);

  await nav.getByRole("link", { name: "Find", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Crypto Intelligence Hub/i })).toBeVisible();
  await page.waitForTimeout(5000);
  await page.getByPlaceholder("Token symbol (e.g. ETH, SHIB)").fill("ETH");
  await page.getByRole("button", { name: "Run scan" }).click();
  await expect(page.getByText(/Ethereum/i).first()).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(12000);

  await page.getByRole("button", { name: "Early Signals" }).click();
  await page.waitForTimeout(8000);

  await nav.getByRole("link", { name: "Early Signals", exact: true }).click();
  await expect(page.getByText(/Early Signals feed/i)).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(10000);

  await page.getByRole("link", { name: /Open token detail/i }).first().click();
  await expect(page).toHaveURL(/\/token\//, { timeout: 25_000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 25_000 });
  await page.waitForTimeout(10000);

  await nav.getByRole("link", { name: "Build", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Deploy Decentralized Applications/i })).toBeVisible();
  await page.waitForTimeout(9000);

  await nav.getByRole("link", { name: "AI Agents", exact: true }).click();
  await expect(page.getByRole("heading", { name: /AI Agents/i })).toBeVisible();
  await page.waitForTimeout(9000);

  await nav.getByRole("link", { name: "Earn", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Earn With CCWEB/i })).toBeVisible();
  await page.waitForTimeout(9000);

  await nav.getByRole("link", { name: "Community", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Community/i })).toBeVisible();
  await page.waitForTimeout(8000);

  await page.getByRole("link", { name: "CHRISCCWEB" }).click();
  await expect(page.getByRole("heading", { name: /Learn\.\s*Find\./i })).toBeVisible();
  await page.waitForTimeout(8000);
});
