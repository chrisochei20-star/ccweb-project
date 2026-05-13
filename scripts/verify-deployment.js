#!/usr/bin/env node
/**
 * Post-deploy smoke checks for Render API + optional Postgres schema verify (when DATABASE_URL is set locally).
 *
 * Before shipping, run locally or in CI: `npm run verify:predeploy` (imports + tests + Vite build).
 * Human checklist: docs/PRODUCTION_DEPLOY_CHECKLIST.md
 *
 * Usage:
 *   DEPLOY_VERIFY_API_URL=https://your-api.onrender.com node scripts/verify-deployment.js
 *   node scripts/verify-deployment.js https://your-api.onrender.com
 *
 * With DATABASE_URL in env (same shell as CI or ops laptop):
 *   DATABASE_URL=... DEPLOY_VERIFY_API_URL=https://api.example.com node scripts/verify-deployment.js
 */

const { spawnSync } = require("child_process");
const path = require("path");

const apiBase = (process.env.DEPLOY_VERIFY_API_URL || process.argv[2] || "").trim().replace(/\/$/, "");

async function fetchJson(url, init = {}) {
  const res = await fetch(url, { redirect: "follow", ...init });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* ignore */
  }
  return { ok: res.ok, status: res.status, json, text };
}

async function main() {
  if (!apiBase) {
    console.error(
      "Usage: DEPLOY_VERIFY_API_URL=https://your-api.onrender.com node scripts/verify-deployment.js\n" +
        "   or: node scripts/verify-deployment.js https://your-api.onrender.com"
    );
    process.exit(1);
  }

  const failures = [];

  const healthUrl = `${apiBase}/health`;
  const h = await fetchJson(healthUrl);
  if (!h.ok || !h.json || h.json.status !== "ok") {
    failures.push(`GET /health failed (${h.status})`);
    console.error("[verify] /health:", h.status, h.text?.slice(0, 200));
  } else {
    console.log("[verify] OK GET /health →", h.json.message || h.json.status);
  }

  const rootH = await fetchJson(`${apiBase}/`, { headers: { Accept: "application/json" } });
  if (!rootH.ok || !rootH.json || rootH.json.status !== "ok") {
    console.warn(
      "[verify] WARN GET / (Accept: application/json) — expected {status:\"ok\"}; redeploy API if you still see 404/HTML here."
    );
    if (process.env.CCWEB_VERIFY_STRICT_ROOT === "1") {
      failures.push(`GET / (Accept: application/json) failed (${rootH.status})`);
      console.error("[verify] GET /:", rootH.status, rootH.text?.slice(0, 200));
    }
  } else {
    console.log("[verify] OK GET / (json) →", rootH.json.status);
  }

  const cfgUrl = `${apiBase}/api/v1/config`;
  const c = await fetchJson(cfgUrl);
  if (!c.ok || !c.json?.environment) {
    failures.push(`GET /api/v1/config failed (${c.status})`);
    console.error("[verify] /api/v1/config:", c.status, c.text?.slice(0, 200));
  } else {
    console.log("[verify] OK GET /api/v1/config → environment:", c.json.environment);
    if (c.json.payments) {
      console.log(
        "       payments:",
        "stripeCheckout=" + c.json.payments.stripeCheckoutEnabled,
        "stripeWebhooks=" + c.json.payments.stripeWebhooksEnabled
      );
    }
  }

  if (process.env.DATABASE_URL && process.env.CCWEB_SKIP_VERIFY_SCHEMA !== "1") {
    const r = spawnSync(process.execPath, [path.join(__dirname, "..", "db", "verifySchema.js")], {
      encoding: "utf8",
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    if (r.status !== 0) {
      failures.push("db/verifySchema.js exited non-zero");
      console.error("[verify] schema:", r.stderr || r.stdout);
    } else {
      console.log("[verify] OK PostgreSQL tables (verifySchema)");
    }
  } else {
    console.log("[verify] skip schema verify (set DATABASE_URL to check tables from this machine)");
  }

  console.log("");
  console.log("Beta-style URLs (frontend origin):");
  console.log("  /invite/<code>   — invite attribution");
  console.log("  /u/<slug>        — public beta profile slug");
  console.log("  /test/<userId>   — tester deep link");

  if (failures.length) {
    console.error("\n[verify] FAILED:", failures.join("; "));
    process.exit(1);
  }
  console.log("\n[verify] All automated checks passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
