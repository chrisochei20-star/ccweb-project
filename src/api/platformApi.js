import { http } from "./http";

export async function getUserAnalytics() {
  const { data } = await http.get("/api/v1/analytics/user");
  return data;
}

export async function marketplaceList(industry) {
  const q = industry ? `?industry=${encodeURIComponent(industry)}` : "";
  const { data } = await http.get(`/api/v1/marketplace${q}`);
  return data;
}

export async function createListing(body) {
  const { data } = await http.post("/api/v1/marketplace/create", body);
  return data;
}

export async function paymentsHistory() {
  const { data } = await http.get("/api/v1/payments/history");
  return data;
}

export async function paymentsRelease(body) {
  const { data } = await http.post("/api/v1/payments/release", body);
  return data;
}

export async function paymentsCheckoutEscrow(body) {
  const { data } = await http.post("/api/v1/payments/create", body);
  return data;
}

export async function agentsRun(body) {
  const { data } = await http.post("/api/v1/agents/run", body);
  return data;
}
