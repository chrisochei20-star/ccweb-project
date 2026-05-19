import { describe, it, expect } from "vitest";
import { apiUrl, getSupabaseConfig } from "../src/config/env.js";

describe("apiUrl", () => {
  it("returns relative path when base is unset", () => {
    expect(apiUrl("/api/courses", {})).toBe("/api/courses");
    expect(apiUrl("api/courses", {})).toBe("/api/courses");
  });

  it("joins HTTPS base without double slash", () => {
    const env = { VITE_API_BASE_URL: "https://ccweb-api-production.up.railway.app" };
    expect(apiUrl("/api/courses", env)).toBe("https://ccweb-api-production.up.railway.app/api/courses");
    expect(apiUrl("/api/courses", { VITE_API_BASE_URL: "https://api.example.com/" })).toBe(
      "https://api.example.com/api/courses"
    );
  });
});

describe("getSupabaseConfig", () => {
  it("reads optional keys", () => {
    expect(
      getSupabaseConfig({
        VITE_SUPABASE_URL: "https://abc.supabase.co",
        VITE_SUPABASE_ANON_KEY: "anon-test",
      })
    ).toEqual({ url: "https://abc.supabase.co", anonKey: "anon-test" });
  });
});
