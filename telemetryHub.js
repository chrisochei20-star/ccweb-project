/**
 * In-memory telemetry and lightweight admin aggregates for CCWEB prototype.
 * Replace with OpenTelemetry + persistent store in production.
 */

const MAX_EVENTS = 2500;
const MAX_ERRORS = 400;

const events = [];
const clientErrors = [];

function nowIso() {
  return new Date().toISOString();
}

function trimMeta(meta) {
  if (!meta || typeof meta !== "object") return {};
  const out = {};
  for (const [k, v] of Object.entries(meta)) {
    if (Object.keys(out).length >= 12) break;
    const key = String(k).slice(0, 48);
    if (typeof v === "string") out[key] = v.slice(0, 200);
    else if (typeof v === "number" && Number.isFinite(v)) out[key] = v;
    else if (typeof v === "boolean") out[key] = v;
  }
  return out;
}

function recordEvent(input = {}) {
  const name = (input.name || "unknown").toString().trim().slice(0, 80);
  const row = {
    id: `evt-${events.length + 1}`,
    name,
    path: (input.path || "").toString().slice(0, 200),
    sessionId: (input.sessionId || "").toString().slice(0, 64),
    metadata: trimMeta(input.metadata),
    createdAt: nowIso(),
  };
  events.push(row);
  if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
  return row;
}

function recordClientError(input = {}) {
  const row = {
    id: `err-${clientErrors.length + 1}`,
    message: (input.message || "Error").toString().slice(0, 500),
    path: (input.path || "").toString().slice(0, 200),
    sessionId: (input.sessionId || "").toString().slice(0, 64),
    createdAt: nowIso(),
  };
  clientErrors.push(row);
  if (clientErrors.length > MAX_ERRORS) clientErrors.splice(0, clientErrors.length - MAX_ERRORS);
  return row;
}

function summary() {
  const byName = {};
  const pageViews = {};
  for (const e of events) {
    byName[e.name] = (byName[e.name] || 0) + 1;
    if (e.name === "page_view" && e.path) {
      pageViews[e.path] = (pageViews[e.path] || 0) + 1;
    }
  }
  const recent = events.slice(-80).reverse();
  const recentErrors = clientErrors.slice(-40).reverse();
  return {
    totalEvents: events.length,
    totalClientErrors: clientErrors.length,
    countsByName: byName,
    pageViews,
    recentEvents: recent,
    recentClientErrors: recentErrors,
  };
}

module.exports = {
  recordEvent,
  recordClientError,
  summary,
};
