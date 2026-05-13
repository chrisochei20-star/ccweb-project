/**
 * Imperative toast bus (no React import) so api helpers can surface errors without cycles.
 */

let seq = 0;
/** @type {((t: { id: number; type: string; message: string }) => void) | null} */
let handler = null;

export function registerToastHandler(fn) {
  handler = fn;
  return () => {
    handler = null;
  };
}

function push(type, message) {
  const id = ++seq;
  const text = String(message || "").trim().slice(0, 280) || "Notice";
  try {
    handler?.({ id, type, message: text });
  } catch {
    /* ignore */
  }
}

export const toast = {
  success: (m) => push("success", m),
  error: (m) => push("error", m),
  info: (m) => push("info", m),
};
