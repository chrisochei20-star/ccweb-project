/**
 * Lightweight input helpers — use with Zod/Joi at route boundaries in production.
 */

function stripControlChars(s) {
  return String(s || "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

function truncate(s, max = 8192) {
  const t = stripControlChars(s);
  return t.length > max ? t.slice(0, max) : t;
}

/** Shallow trim strings on a plain object (does not recurse). */
function trimBodyStrings(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;
  const out = { ...obj };
  for (const k of Object.keys(out)) {
    if (typeof out[k] === "string") out[k] = stripControlChars(out[k]).trim();
  }
  return out;
}

module.exports = { stripControlChars, truncate, trimBodyStrings };
