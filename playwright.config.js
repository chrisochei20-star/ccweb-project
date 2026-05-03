// @ts-check
const { defineConfig, devices } = require("@playwright/test");

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:5173";

module.exports = defineConfig({
  testDir: "e2e",
  timeout: 300_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL,
    trace: "off",
    video: "on",
    viewport: { width: 1920, height: 1080 },
    launchOptions: {
      slowMo: process.env.PW_SLOW_MO ? Number(process.env.PW_SLOW_MO) : 120,
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node server.js",
      url: "http://127.0.0.1:3000/health",
      timeout: 60_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "npx vite --host 127.0.0.1 --port 5173",
      url: "http://127.0.0.1:5173",
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
