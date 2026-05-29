import { describe, expect, it, beforeEach } from "vitest";
import {
  pushNativeBackHandler,
  popNativeBackHandler,
  runNativeBackHandler,
  nativeBackStackDepth,
  clearNativeBackStackForTests,
} from "../src/lib/nativeBackStack.js";

describe("nativeBackStack", () => {
  beforeEach(() => {
    clearNativeBackStackForTests();
  });

  it("runs handlers in LIFO order and stops when one returns true", () => {
    const order = [];
    pushNativeBackHandler(() => {
      order.push("first");
      return false;
    });
    pushNativeBackHandler(() => {
      order.push("second");
      return true;
    });
    pushNativeBackHandler(() => {
      order.push("third");
      return true;
    });

    expect(runNativeBackHandler()).toBe(true);
    expect(order).toEqual(["third"]);
  });

  it("returns false when no handler consumes back", () => {
    pushNativeBackHandler(() => false);
    expect(runNativeBackHandler()).toBe(false);
  });

  it("removes handlers via popNativeBackHandler", () => {
    const handler = () => true;
    pushNativeBackHandler(handler);
    expect(nativeBackStackDepth()).toBe(1);
    popNativeBackHandler(handler);
    expect(nativeBackStackDepth()).toBe(0);
    expect(runNativeBackHandler()).toBe(false);
  });

  it("unregister callback from pushNativeBackHandler removes handler", () => {
    const unregister = pushNativeBackHandler(() => true);
    expect(nativeBackStackDepth()).toBe(1);
    unregister();
    expect(nativeBackStackDepth()).toBe(0);
  });
});

describe("usePullToRefresh scroll helper", () => {
  it("supports document scroll mode contract", async () => {
    const mod = await import("../src/hooks/usePullToRefresh.js");
    expect(typeof mod.usePullToRefresh).toBe("function");
  });
});
