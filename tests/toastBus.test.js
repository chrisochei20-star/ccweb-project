import { describe, expect, it, vi } from "vitest";
import { registerToastHandler, toast } from "../src/lib/toastBus.js";

describe("toastBus", () => {
  it("delivers toasts to registered handler", () => {
    const fn = vi.fn();
    const off = registerToastHandler(fn);
    toast.error("Network down");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn.mock.calls[0][0].type).toBe("error");
    expect(fn.mock.calls[0][0].message).toContain("Network");
    off();
    toast.info("after");
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
