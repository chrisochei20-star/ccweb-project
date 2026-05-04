#!/usr/bin/env node
import { createClient } from "../ccweb-sdk/index.mjs";

const [cmd, ...rest] = process.argv.slice(2);
const baseUrl = process.env.CCWEB_BASE_URL || "http://127.0.0.1:3000";
const apiKey = process.env.CCWEB_API_KEY;

function help() {
  console.log(`CCWEB CLI (prototype)
Usage:
  ccweb init <project-name>               # POST /api/developer/projects
  ccweb test                              # health + sandbox + optional API (CCWEB_API_KEY)
  ccweb sandbox                           # POST sandbox echo (no key)
  CCWEB_API_KEY=... ccweb doctor          # health + analytics
  CCWEB_API_KEY=... ccweb call /v1/sessions
  CCWEB_API_KEY=... ccweb deploy          # minimal dapp deploy (env overrides)
`);
}

async function main() {
  if (!cmd || cmd === "help" || cmd === "-h") {
    help();
    process.exit(0);
  }
  if (cmd === "init") {
    const name = rest.join(" ") || "My Project";
    const res = await fetch(`${baseUrl}/api/developer/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    console.log(JSON.stringify(await res.json(), null, 2));
    return;
  }
  if (cmd === "sandbox") {
    const res = await fetch(`${baseUrl}/api/developer/sandbox/echo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ping: true, at: new Date().toISOString() }),
    });
    console.log(JSON.stringify(await res.json(), null, 2));
    return;
  }
  if (cmd === "test") {
    const h = await fetch(`${baseUrl}/health`);
    console.log("1) health:", JSON.stringify(await h.json()));
    const sb = await fetch(`${baseUrl}/api/developer/sandbox/echo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cli: "ccweb test", at: new Date().toISOString() }),
    });
    console.log("2) sandbox:", JSON.stringify(await sb.json()));
    if (apiKey) {
      const client = createClient({ apiKey, baseUrl });
      console.log("3) analytics:", JSON.stringify(await client.analytics(), null, 2));
    } else {
      console.log("3) (skip) Set CCWEB_API_KEY to also run GET /v1/analytics");
    }
    return;
  }
  if (!apiKey) {
    console.error("Set CCWEB_API_KEY for this command.");
    process.exit(1);
  }
  const client = createClient({ apiKey, baseUrl });
  if (cmd === "doctor") {
    const h = await fetch(`${baseUrl}/health`);
    console.log("health:", await h.json());
    console.log("analytics:", await client.analytics());
    return;
  }
  if (cmd === "call") {
    const path = rest[0];
    if (!path) {
      console.error("Usage: ccweb call /v1/...");
      process.exit(1);
    }
    console.log(JSON.stringify(await client.get(path), null, 2));
    return;
  }
  if (cmd === "deploy") {
    const wallet = process.env.CCWEB_WALLET || "0x0000000000000000000000000000000000000000";
    const body = {
      templateId: process.env.CCWEB_TEMPLATE || "erc20",
      network: process.env.CCWEB_NETWORK || "polygon",
      paymentToken: process.env.CCWEB_PAY_TOKEN || "MATIC",
      contractName: process.env.CCWEB_CONTRACT_NAME || "CLI Token",
      contractSymbol: process.env.CCWEB_SYMBOL || "CLI",
      walletAddress: wallet,
      idempotencyKey: `cli-${Date.now()}`,
    };
    console.log(JSON.stringify(await client.dapp.deploy(body), null, 2));
    return;
  }
  help();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
