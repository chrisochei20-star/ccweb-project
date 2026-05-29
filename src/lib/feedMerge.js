/**
 * Community feed merge/dedupe helpers for realtime reconciliation.
 */

export function dedupeById(items, idKey = "id") {
  if (!Array.isArray(items)) return [];
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const id = item?.[idKey];
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(item);
  }
  return out;
}

export function mergePostsById(existing, incoming) {
  const map = new Map();
  for (const p of existing || []) {
    if (p?.id) map.set(p.id, p);
  }
  for (const p of incoming || []) {
    if (!p?.id) continue;
    map.set(p.id, { ...map.get(p.id), ...p });
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
}

export function mergeChatsById(existing, incoming) {
  return mergePostsById(existing, incoming).sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
}
