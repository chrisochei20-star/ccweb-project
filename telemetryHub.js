/**
 * Lightweight telemetry hook (optional persistence can be added later).
 */

const events = [];

function recordEvent(evt) {
  if (!evt || typeof evt !== "object") return;
  events.unshift({ ...evt, at: new Date().toISOString() });
  while (events.length > 500) events.pop();
}

function recent(limit = 50) {
  return events.slice(0, limit);
}

module.exports = { recordEvent, recent };
