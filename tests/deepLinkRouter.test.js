import { describe, expect, it } from "vitest";
import {
  invalidAppUrlReason,
  isAuthRedirectUrl,
  isRecognizedAppUrl,
  routeFromAppUrl,
} from "../src/lib/deepLinkRouter.js";

describe("deepLinkRouter", () => {
  it("maps custom scheme URLs to app routes", () => {
    expect(routeFromAppUrl("io.chrisccweb.app://app/community")).toBe("/community");
    expect(routeFromAppUrl("io.chrisccweb.app://app/messages?highlight=abc")).toBe("/messages?highlight=abc");
  });

  it("maps production Vercel URLs to app routes", () => {
    expect(routeFromAppUrl("https://ccweb-project-b4jq.vercel.app/profile")).toBe("/profile");
    expect(routeFromAppUrl("https://ccweb-project-b4jq.vercel.app/invite/beta2025")).toBe("/invite/beta2025");
  });

  it("maps public profile slugs", () => {
    expect(routeFromAppUrl("https://ccweb-project-b4jq.vercel.app/u/creator-slug")).toBe("/u/creator-slug");
  });

  it("rejects unsafe URLs", () => {
    expect(routeFromAppUrl("javascript:alert(1)")).toBeNull();
    expect(routeFromAppUrl("https://evil.example/phish")).toBeNull();
  });

  it("detects auth redirect URLs", () => {
    expect(isAuthRedirectUrl("https://ccweb-project-b4jq.vercel.app/login")).toBe(true);
    expect(isAuthRedirectUrl("https://ccweb-project-b4jq.vercel.app/community")).toBe(false);
  });

  it("classifies invalid links for UX", () => {
    expect(invalidAppUrlReason("https://evil.example/phish")).toBe("untrusted_host");
    expect(invalidAppUrlReason("javascript:alert(1)")).toBe("unsafe_scheme");
    expect(invalidAppUrlReason("https://ccweb-project-b4jq.vercel.app/community")).toBeNull();
  });

  it("recognizes supported URLs", () => {
    expect(isRecognizedAppUrl("io.chrisccweb.app://app/settings")).toBe(true);
    expect(isRecognizedAppUrl("https://phish.bad/link")).toBe(false);
  });
});
