import { apiFetch } from "../lib/apiClient";
import { apiUrl } from "../config/env";
import { getSessionToken } from "../session";

function authHeaders() {
  const t = getSessionToken();
  const h = { "Content-Type": "application/json" };
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
}

async function parseJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export async function fetchMarketplaceFeatured(limit = 12) {
  const res = await apiFetch(apiUrl(`/api/v1/marketplace/catalog/featured?limit=${limit}`));
  return parseJson(res);
}

export async function fetchMarketplaceTrending(limit = 12) {
  const res = await apiFetch(apiUrl(`/api/v1/marketplace/catalog/trending?limit=${limit}`));
  return parseJson(res);
}

export async function searchMarketplaceListings({ q, category, featured, limit = 30, offset = 0 } = {}) {
  const p = new URLSearchParams();
  if (q) p.set("q", q);
  if (category) p.set("category", category);
  if (featured) p.set("featured", "1");
  p.set("limit", String(limit));
  p.set("offset", String(offset));
  const res = await apiFetch(apiUrl(`/api/v1/marketplace/catalog/search?${p.toString()}`));
  return parseJson(res);
}

export async function fetchMarketplaceStore(slug, limit = 40) {
  const res = await apiFetch(apiUrl(`/api/v1/marketplace/catalog/stores/${encodeURIComponent(slug)}?limit=${limit}`));
  return parseJson(res);
}

export async function fetchMarketplaceListingBundle(slug) {
  const res = await apiFetch(apiUrl(`/api/v1/marketplace/catalog/listings/${encodeURIComponent(slug)}`));
  return parseJson(res);
}

export async function postMarketplaceReview(listingSlug, body) {
  const res = await apiFetch(apiUrl(`/api/v1/marketplace/catalog/listings/${encodeURIComponent(listingSlug)}/reviews`), {
    method: "POST",
    headers: authHeaders(),
    credentials: "include",
    body: JSON.stringify(body),
  });
  return parseJson(res);
}

export async function fetchMyMarketplaceEntitlements(limit = 40) {
  const res = await apiFetch(apiUrl(`/api/v1/marketplace/catalog/me/entitlements?limit=${limit}`), {
    headers: authHeaders(),
    credentials: "include",
  });
  return parseJson(res);
}
