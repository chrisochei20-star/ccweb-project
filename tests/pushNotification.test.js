import { describe, expect, it, vi, beforeEach } from "vitest";

describe("pushNotificationRouter", () => {
  it("routes chat push to messages with highlight", async () => {
    const { routeForPushPayload } = await import("../src/lib/pushNotificationRouter.js");
    expect(
      routeForPushPayload({
        data: { kind: "chat", route: "/messages?highlight=ch_abc" },
      })
    ).toBe("/messages?highlight=ch_abc");
  });

  it("derives community route from kind", async () => {
    const { routeForPushPayload } = await import("../src/lib/pushNotificationRouter.js");
    expect(routeForPushPayload({ data: { kind: "mention" } })).toBe("/community");
  });
});

describe("pushNotificationDispatch", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("maps notification kinds to push categories", async () => {
    const { resolvePushCategory } = await import("../services/pushNotificationDispatch.js");
    expect(resolvePushCategory({ kind: "chat" })).toBe("messages");
    expect(resolvePushCategory({ kind: "mention" })).toBe("mentions");
    expect(resolvePushCategory({ kind: "follow" })).toBe("follows");
    expect(resolvePushCategory({ kind: "like" })).toBe("reactions");
    expect(resolvePushCategory({ kind: "reply" })).toBe("comments");
    expect(resolvePushCategory({ kind: "learn" })).toBe("aiAlerts");
    expect(resolvePushCategory({ legacyType: "ai_blog_published" })).toBe("aiAlerts");
  });

  it("builds deep links for chat notifications", async () => {
    const { buildPushRoute } = await import("../services/pushNotificationDispatch.js");
    expect(buildPushRoute({ kind: "chat", payload: { chatId: "ch_1" } })).toBe(
      "/messages?highlight=ch_1"
    );
  });
});

describe("pushTokenCrypto", () => {
  it("hashes tokens consistently", async () => {
    const { hashToken } = await import("../services/pushTokenCrypto.js");
    expect(hashToken("abc")).toBe(hashToken("abc"));
    expect(hashToken("abc")).not.toBe(hashToken("def"));
  });

  it("round-trips encryption when key is set", async () => {
    const key = "a".repeat(64);
    vi.stubEnv("PUSH_TOKEN_ENCRYPTION_KEY", key);
    vi.resetModules();
    const { encryptToken, decryptToken } = await import("../services/pushTokenCrypto.js");
    const { ciphertext, encrypted } = encryptToken("fcm-token-xyz");
    expect(encrypted).toBe(true);
    expect(decryptToken(ciphertext, encrypted)).toBe("fcm-token-xyz");
    vi.unstubAllEnvs();
  });
});

describe("fcmPush", () => {
  it("reports not configured without service account", async () => {
    vi.stubEnv("FIREBASE_SERVICE_ACCOUNT_JSON", "");
    vi.resetModules();
    const { isFcmConfigured, sendMulticast } = await import("../services/fcmPush.js");
    expect(isFcmConfigured()).toBe(false);
    const r = await sendMulticast(["tok"], { title: "Hi", body: "Test" });
    expect(r.sent).toBe(0);
    expect(r.results[0].errorCode).toBe("fcm_not_configured");
    vi.unstubAllEnvs();
  });
});
