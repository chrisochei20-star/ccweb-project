/**
 * In-memory tracked wallets + rolling alerts (replace with DB + pub/sub in production).
 */

const alerts = [];
const MAX_ALERTS = 300;

const tracked = new Map(); // key chain:address -> record

function walletKey(chain, address) {
  return `${(chain || "ethereum").toLowerCase()}:${(address || "").toLowerCase()}`;
}

function addTrackedWallet(chain, walletAddress, label) {
  const key = walletKey(chain, walletAddress);
  const rec = {
    id: `tw-${key.slice(0, 24)}`,
    chain: chain || "ethereum",
    walletAddress: (walletAddress || "").trim(),
    label: (label || "Tracked wallet").toString().slice(0, 120),
    addedAt: new Date().toISOString(),
  };
  tracked.set(key, rec);
  return rec;
}

function removeTrackedWallet(chain, walletAddress) {
  return tracked.delete(walletKey(chain, walletAddress));
}

function listTracked() {
  return Array.from(tracked.values()).sort((a, b) => (a.addedAt < b.addedAt ? 1 : -1));
}

function pushAlert(payload) {
  const alert = {
    id: `al-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ts: new Date().toISOString(),
    ...payload,
  };
  alerts.unshift(alert);
  if (alerts.length > MAX_ALERTS) alerts.pop();
  return alert;
}

function listAlerts(limit = 50) {
  return alerts.slice(0, Math.min(100, Math.max(1, limit)));
}

function isTracked(chain, walletAddress) {
  return tracked.has(walletKey(chain, walletAddress));
}

module.exports = {
  addTrackedWallet,
  removeTrackedWallet,
  listTracked,
  pushAlert,
  listAlerts,
  walletKey,
  isTracked,
};
