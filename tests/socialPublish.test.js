import { describe, expect, it, afterEach } from "vitest";
import { createSocialApp } from "../social/socialRouter.js";

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => resolve(server));
    server.on("error", reject);
  });
}

async function postJson(server, path, body) {
  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : addr;
  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { _raw: text };
  }
  return { status: res.status, json };
}

describe("social publish", () => {
  const prev = { ...process.env };

  afterEach(() => {
    process.env = { ...prev };
  });

  it("rejects without human approval", async () => {
    const app = createSocialApp();
    const server = await listen(app);
    try {
      const { status, json } = await postJson(server, "/publish", { message: "hello", approved: false });
      expect(status).toBe(403);
      expect(json.error).toMatch(/approval/i);
    } finally {
      await new Promise((r) => server.close(r));
    }
  });

  it("dryRun succeeds without calling upstream", async () => {
    process.env.TWITTER_BEARER_TOKEN = "dummy";
    const app = createSocialApp();
    const server = await listen(app);
    try {
      const { status, json } = await postJson(server, "/publish", {
        message: "Test post",
        approved: true,
        dryRun: true,
        platforms: ["x"],
      });
      expect(status).toBe(200);
      expect(json.dryRun).toBe(true);
      expect(json.messagePreview).toContain("Test post");
    } finally {
      await new Promise((r) => server.close(r));
    }
  });
});
