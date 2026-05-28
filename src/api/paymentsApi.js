import { http } from "./http";

export async function verifyFlutterwavePayment(txRef) {
  const { data } = await http.post("/api/v1/payments/flutterwave/verify", { tx_ref: txRef });
  return data;
}

export async function prepareEscrowCheckout(body) {
  const { data } = await http.post("/api/v1/payments/create", body);
  return data;
}

export async function fetchMonetizationStatus() {
  const { data } = await http.get("/api/v1/monetization/status");
  return data;
}

export async function fetchPaymentHistory() {
  const { data } = await http.get("/api/v1/payments/history");
  return data;
}
