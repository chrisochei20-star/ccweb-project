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

export async function searchMarketplaceListings({ q, category, tag, featured, limit = 30, offset = 0 } = {}) {
  const p = new URLSearchParams();
  if (q) p.set("q", q);
  if (category) p.set("category", category);
  if (tag) p.set("tag", tag);
  if (featured) p.set("featured", "1");
  p.set("limit", String(limit));
  p.set("offset", String(offset));
  const res = await apiFetch(apiUrl(`/api/v1/marketplace/catalog/search?${p.toString()}`));
  return parseJson(res);
}

export async function fetchMarketplaceCategories(limit = 40) {
  const res = await apiFetch(apiUrl(`/api/v1/marketplace/catalog/categories?limit=${limit}`));
  return parseJson(res);
}

export async function fetchMarketplaceRecommendations(limit = 12) {
  const t = getSessionToken();
  const res = await apiFetch(apiUrl(`/api/v1/marketplace/catalog/recommendations?limit=${limit}`), {
    headers: t ? { Authorization: `Bearer ${t}` } : {},
    credentials: "include",
  });
  return parseJson(res);
}

export async function fetchTrendingCreatorStores(limit = 12) {
  const res = await apiFetch(apiUrl(`/api/v1/marketplace/catalog/stores/trending?limit=${limit}`));
  return parseJson(res);
}

export async function postSaveMarketplaceLibrary(slug) {
  const res = await apiFetch(apiUrl(`/api/v1/marketplace/catalog/me/library/${encodeURIComponent(slug)}`), {
    method: "POST",
    headers: authHeaders(),
    credentials: "include",
  });
  return parseJson(res);
}

export async function deleteMarketplaceLibrary(slug) {
  const res = await apiFetch(apiUrl(`/api/v1/marketplace/catalog/me/library/${encodeURIComponent(slug)}`), {
    method: "DELETE",
    headers: authHeaders(),
    credentials: "include",
  });
  return parseJson(res);
}

export async function fetchMyMarketplaceLibrary(limit = 40) {
  const res = await apiFetch(apiUrl(`/api/v1/marketplace/catalog/me/library?limit=${limit}`), {
    headers: authHeaders(),
    credentials: "include",
  });
  return parseJson(res);
}

export async function fetchCreatorMarketplaceSummary() {
  const res = await apiFetch(apiUrl("/api/v1/marketplace/catalog/creator/me/summary"), {
    headers: authHeaders(),
    credentials: "include",
  });
  return parseJson(res);
}

export async function fetchCreatorMarketplaceListings(limit = 80) {
  const res = await apiFetch(apiUrl(`/api/v1/marketplace/catalog/creator/me/listings?limit=${limit}`), {
    headers: authHeaders(),
    credentials: "include",
  });
  return parseJson(res);
}

export async function fetchCreatorMarketplaceSales(limit = 50) {
  const res = await apiFetch(apiUrl(`/api/v1/marketplace/catalog/creator/me/sales?limit=${limit}`), {
    headers: authHeaders(),
    credentials: "include",
  });
  return parseJson(res);
}

export async function fetchCreatorMarketplaceReviews(limit = 40) {
  const res = await apiFetch(apiUrl(`/api/v1/marketplace/catalog/creator/me/reviews?limit=${limit}`), {
    headers: authHeaders(),
    credentials: "include",
  });
  return parseJson(res);
}

export async function fetchCreatorMarketplacePerformance(limit = 40) {
  const res = await apiFetch(apiUrl(`/api/v1/marketplace/catalog/creator/me/performance?limit=${limit}`), {
    headers: authHeaders(),
    credentials: "include",
  });
  return parseJson(res);
}

export async function fetchMarketplaceListingPrivateBundle(listingId) {
  const res = await apiFetch(apiUrl(`/api/v1/marketplace/catalog/listings/${encodeURIComponent(listingId)}/private`), {
    headers: authHeaders(),
    credentials: "include",
  });
  return parseJson(res);
}

export async function postMarketplaceStoreMe(body) {
  const res = await apiFetch(apiUrl("/api/v1/marketplace/catalog/stores/me"), {
    method: "POST",
    headers: authHeaders(),
    credentials: "include",
    body: JSON.stringify(body || {}),
  });
  return parseJson(res);
}

export async function postMarketplaceListing(body) {
  const res = await apiFetch(apiUrl("/api/v1/marketplace/catalog/listings"), {
    method: "POST",
    headers: authHeaders(),
    credentials: "include",
    body: JSON.stringify(body || {}),
  });
  return parseJson(res);
}

export async function putMarketplaceListing(listingId, body) {
  const res = await apiFetch(apiUrl(`/api/v1/marketplace/catalog/listings/${encodeURIComponent(listingId)}`), {
    method: "PUT",
    headers: authHeaders(),
    credentials: "include",
    body: JSON.stringify(body || {}),
  });
  return parseJson(res);
}

export async function postMarketplaceSku(listingId, body) {
  const res = await apiFetch(apiUrl(`/api/v1/marketplace/catalog/listings/${encodeURIComponent(listingId)}/skus`), {
    method: "POST",
    headers: authHeaders(),
    credentials: "include",
    body: JSON.stringify(body || {}),
  });
  return parseJson(res);
}

export async function postMarketplaceAiVersion(listingId, body) {
  const res = await apiFetch(apiUrl(`/api/v1/marketplace/catalog/listings/${encodeURIComponent(listingId)}/ai-versions`), {
    method: "POST",
    headers: authHeaders(),
    credentials: "include",
    body: JSON.stringify(body || {}),
  });
  return parseJson(res);
}

export async function uploadMarketplaceImage(file) {
  const t = getSessionToken();
  if (!t) throw new Error("Sign in to upload.");
  const fd = new FormData();
  fd.append("file", file);
  const res = await apiFetch(apiUrl("/api/v1/uploads/marketplace/image"), {
    method: "POST",
    headers: { Authorization: `Bearer ${t}` },
    credentials: "include",
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data;
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
