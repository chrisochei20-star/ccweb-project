/**
 * Records a real browser session of the CCWEB app (Playwright video).
 * Run: CI=1 npm run record:preview
 * Output: playwright-report + test-results/**/*.webm → post-process to ccweb-preview.mp4 (see scripts/finish-preview-video.sh)
 */
const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

test("CCWEB live preview recording", async ({ page, context }) => {
  const stamp = Date.now();
  const email = `preview+e2e-${stamp}@ccweb.test`;
  const password = "PreviewTest1!";

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Learn/i })).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(2500);

  await page.getByRole("link", { name: "Get Started" }).first().click();
  await expect(page).toHaveURL(/\/signup/);

  await page.getByPlaceholder("Your name").fill("Preview User");
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("min 8 characters").fill(password);
  await page.getByRole("button", { name: "Create Account" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
  await expect(page.getByText(/Welcome back/i)).toBeVisible();
  await page.waitForTimeout(4000);

  await page.getByRole("link", { name: "Learn" }).click();
  await expect(page.getByRole("heading", { name: /Course Library/i })).toBeVisible();
  await page.waitForTimeout(3500);

  await page.getByRole("link", { name: "AI Streaming" }).click();
  await expect(page.getByRole("heading", { name: /AI Streaming/i })).toBeVisible();
  await page.waitForTimeout(3500);

  await page.getByRole("link", { name: "Find" }).click();
  await expect(page.getByRole("heading", { name: /Crypto Intelligence Hub/i })).toBeVisible();
  await page.getByPlaceholder("Token symbol (e.g. ETH, SHIB)").fill("ETH");
  await page.getByRole("button", { name: "Run scan" }).click();
  await expect(page.getByText(/Ethereum/i).first()).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(4500);

  await page.getByRole("button", { name: "Early Signals" }).click();
  await page.waitForTimeout(3000);

  await page.getByRole("link", { name: "Early Signals" }).click();
  await expect(page.getByText(/Early Signals feed/i)).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(4000);

  await page.getByRole("link", { name: "Build" }).click();
  await expect(page.getByRole("heading", { name: /Deploy Decentralized Applications/i })).toBeVisible();
  await page.waitForTimeout(3500);

  await page.getByRole("link", { name: "AI Agents" }).click();
  await expect(page.getByRole("heading", { name: /AI Agents/i })).toBeVisible();
  await page.waitForTimeout(3500);

  await page.getByRole("link", { name: "Earn" }).click();
  await expect(page.getByRole("heading", { name: /Earn With CCWEB/i })).toBeVisible();
  await page.waitForTimeout(3500);

  await page.getByRole("link", { name: "CHRISCCWEB" }).click();
  await expect(page.getByRole("heading", { name: /Learn/i })).toBeVisible();
  await page.waitForTimeout(3000);
});
