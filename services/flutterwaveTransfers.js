/**
 * Flutterwave Transfers (beneficiaries + transfers + account resolve).
 * https://developer.flutterwave.com/docs/transfers
 */

const axios = require("axios");
const { authHeaders } = require("./flutterwaveClient");

const BASE = "https://api.flutterwave.com/v3";

/**
 * Resolve account name (NGN and supported corridors).
 * @param {{ accountNumber: string, accountBank: string }} p
 */
async function resolveBankAccount({ accountNumber, accountBank }) {
  const res = await axios.get(`${BASE}/accounts/resolve`, {
    params: { account_number: String(accountNumber).trim(), account_bank: String(accountBank).trim() },
    headers: authHeaders(),
  });
  return res.data;
}

/**
 * @param {object} body Flutterwave beneficiary payload (currency, account_bank, account_number, beneficiary_name, …)
 */
async function createBeneficiary(body) {
  const res = await axios.post(`${BASE}/beneficiaries`, body, {
    headers: { ...authHeaders(), "Content-Type": "application/json" },
  });
  return res.data;
}

/**
 * @param {object} body amount (number), currency, reference, narration, beneficiary (id) OR inline bank fields
 */
async function createTransfer(body) {
  const res = await axios.post(`${BASE}/transfers`, body, {
    headers: { ...authHeaders(), "Content-Type": "application/json" },
  });
  return res.data;
}

async function getTransfer(id) {
  const res = await axios.get(`${BASE}/transfers/${encodeURIComponent(String(id))}`, { headers: authHeaders() });
  return res.data;
}

module.exports = {
  resolveBankAccount,
  createBeneficiary,
  createTransfer,
  getTransfer,
};
