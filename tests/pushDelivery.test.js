import { describe, it, expect } from "vitest";
import { deriveNotificationDeepLink, fcmDataStrings } from "../services/pushDelivery.js";

describe("pushDelivery", () => {
  it("derives chat deep link with chatId", () => {
    const p = deriveNotificationDeepLink("chat", { chatId: "chat_abc" });
    expect(p).toContain("/messages");
    expect(p).toContain("chat_abc");
  });

  it("respects explicit deepLink in payload", () => {
    expect(deriveNotificationDeepLink("earn", { deepLink: "/shop/creator/dashboard" })).toBe("/shop/creator/dashboard");
  });

  it("stringifies FCM data values", () => {
    const d = fcmDataStrings({
      notificationId: "ntf_1",
      kind: "follow",
      path: "/notifications",
      extra: { n: 1 },
    });
    expect(d.ntfId).toBe("ntf_1");
    expect(d.n).toBe("1");
  });
});
