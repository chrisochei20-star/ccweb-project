// @ts-check
const { defineConfig, devices } = require("@playwright/test");

const baseURL = process.env.PLAYWRIGHT_BASE_URL || process.env.VITE_DEV_SPA_ORIGIN || "http://127.0.0.1:5173";
const productionE2E = process.env.PRODUCTION_E2E === "1" || process.env.PRODUCTION_E2E === "true";
const e2eApiPort = process.env.PLAYWRIGHT_API_PORT || "3055";

/** @type {import('@playwright/test').WebServerConfig[]} */
const webServer = productionE2E
  ? []
  : [
      {
        command: `PORT=${e2eApiPort} node server.js`,
        url: `http://127.0.0.1:${e2eApiPort}/health`,
        timeout: 60_000,
        reuseExistingServer: !process.env.CI,
      },
      {
        command: `VITE_DEV_API_PROXY_TARGET=http://127.0.0.1:${e2eApiPort} npx vite --host 127.0.0.1 --port 5173`,
        url: "http://127.0.0.1:5173",
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
      },
    ];

module.exports = defineConfig({
  testDir: "e2e",
  timeout: 300_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: productionE2E ? 1 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL,
    trace: "off",
    video: productionE2E ? "off" : "on",
    viewport: { width: 1920, height: 1080 },
    launchOptions: {
      slowMo: process.env.PW_SLOW_MO ? Number(process.env.PW_SLOW_MO) : productionE2E ? 0 : 120,
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer,
});
