/**
 * EVM address validation for DApp deploy + developer APIs (prototype).
 */
let ethers;
try {
  ethers = require("ethers");
} catch {
  ethers = null;
}

function isValidEvmAddress(addr) {
  if (!addr || typeof addr !== "string") return false;
  if (!ethers) return /^0x[a-fA-F0-9]{40}$/.test(addr.trim());
  try {
    ethers.getAddress(addr.trim());
    return true;
  } catch {
    return false;
  }
}

module.exports = { isValidEvmAddress };
