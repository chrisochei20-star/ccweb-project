/** Stack of handlers for Android hardware back (modals/sheets close first). */

const stack = [];

export function pushNativeBackHandler(handler) {
  if (typeof handler !== "function") return () => {};
  stack.push(handler);
  return () => popNativeBackHandler(handler);
}

export function popNativeBackHandler(handler) {
  const i = stack.lastIndexOf(handler);
  if (i >= 0) stack.splice(i, 1);
}

/** @returns {boolean} true if a handler consumed the back press */
export function runNativeBackHandler() {
  for (let i = stack.length - 1; i >= 0; i -= 1) {
    try {
      if (stack[i]() === true) return true;
    } catch {
      /* ignore */
    }
  }
  return false;
}

export function nativeBackStackDepth() {
  return stack.length;
}

/** @internal Vitest only */
export function clearNativeBackStackForTests() {
  stack.length = 0;
}
