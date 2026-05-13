import { describe, expect, it } from "vitest";
import { AppError, errorHandler } from "../server/http/middleware/errors.js";

describe("server/http middleware", () => {
  it("AppError carries status and code", () => {
    const e = new AppError("bad", 422, "UNPROCESSABLE");
    expect(e.statusCode).toBe(422);
    expect(e.code).toBe("UNPROCESSABLE");
  });

  it("errorHandler sends status and JSON body", () => {
    const req = { path: "/x", originalUrl: "/x", method: "GET" };
    const calls = [];
    const res = {
      headersSent: false,
      status(code) {
        calls.push(["status", code]);
        return this;
      },
      json(body) {
        calls.push(["json", body]);
      },
    };
    errorHandler(new AppError("nope", 418, "TEAPOT"), req, res, () => {});
    expect(calls[0]).toEqual(["status", 418]);
    expect(calls[1][1]).toMatchObject({ code: "TEAPOT", error: "nope" });
  });
});
