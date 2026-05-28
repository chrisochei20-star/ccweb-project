/**
 * Assemble public / self profile payloads from auth + ccweb_user_profiles + social graph.
 */

const authStore = require("../auth/authStore");
const authEngine = require("../auth/authEngine");
const betaPg = require("../db/persistenceBeta");
const profileSocial = require("../db/profileSocial");
const monPg = require("../db/persistenceMonetization");
const learningPg = require("../db/persistenceLearning");
const { trimOrigin } = require("./deploymentOrigins");

function parseSocialLinks(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const label = String(item.label || item.platform || "").trim().slice(0, 40);
        const url = String(item.url || "").trim().slice(0, 512);
        if (!url) return null;
        return { label: label || "Link", url };
      })
      .filter(Boolean)
      .slice(0, 8);
  }
  try {
    const j = typeof raw === "string" ? JSON.parse(raw) : raw;
    return parseSocialLinks(j);
  } catch {
    return [];
  }
}

function isVerifiedUser(user) {
  if (!user) return false;
  if (user.verifiedAt) return true;
  const roles = Array.isArray(user.roles) ? user.roles : [];
  return roles.includes("verified") || roles.includes("admin");
}

function creatorFromUser(user, tier) {
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const isCreator = roles.includes("creator") || roles.includes("admin") || (tier && tier !== "free");
  if (!isCreator) return null;
  return {
    tier: tier || "free",
    badge: roles.includes("creator") ? "creator" : tier && tier !== "free" ? "premium" : null,
  };
}

function truncateWallet(addr) {
  if (!addr || typeof addr !== "string") return null;
  const s = addr.trim();
  if (s.length <= 12) return s;
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}

async function loadAuthWallet(userId) {
  try {
    const row = await authStore.findById(userId);
    if (!row) return { walletEvm: null, walletSol: null };
    return {
      walletEvm: row.walletEvm || row.wallet_evm || null,
      walletSol: row.walletSol || row.wallet_sol || null,
    };
  } catch {
    return { walletEvm: null, walletSol: null };
  }
}

async function buildProfileBundle({ ccwebUsers, buildUserProfile, sanitizeUser, userId, viewerId = null }) {
  const user = await authEngine.ensureUserProfile(ccwebUsers, buildUserProfile, userId);
  if (!user) return null;

  const isSelf = viewerId && viewerId === userId;
  const publicUser = sanitizeUser(user);
  if (!isSelf) delete publicUser.email;

  let betaSlug = null;
  try {
    betaSlug = await betaPg.getSlugForUser(userId);
  } catch {
    /* ignore */
  }
  const base = trimOrigin(process.env.PUBLIC_APP_URL) || null;
  const betaPublicUrl = betaSlug && base ? `${base}/u/${betaSlug}` : null;

  const socialCounts = await profileSocial.getFollowCounts(userId);
  let isFollowing = false;
  if (viewerId && viewerId !== userId) {
    isFollowing = await profileSocial.isFollowing(viewerId, userId);
  }

  const wallets = await loadAuthWallet(userId);
  const walletAddress = wallets.walletEvm || wallets.walletSol || null;

  let monetization = null;
  if (isSelf && learningPg.usePostgres()) {
    try {
      const tier = await monPg.getEffectiveTier(userId);
      const profile = await learningPg.userLearningProfile(userId);
      monetization = {
        tier,
        subscription: profile?.subscription ?? null,
        creditsCents: profile?.creditsCents ?? 0,
      };
    } catch {
      /* ignore */
    }
  } else if (learningPg.usePostgres()) {
    try {
      const tier = await monPg.getEffectiveTier(userId);
      if (tier && tier !== "free") {
        monetization = { tier, subscription: null, creditsCents: null };
      }
    } catch {
      /* ignore */
    }
  }

  const creator = creatorFromUser(user, monetization?.tier);

  return {
    user: {
      ...publicUser,
      verified: isVerifiedUser(user),
      walletAddress: isSelf ? walletAddress : truncateWallet(walletAddress),
      walletEvm: isSelf ? wallets.walletEvm : truncateWallet(wallets.walletEvm),
    },
    betaSlug,
    betaPublicUrl,
    social: { followers: socialCounts.followers, following: socialCounts.following, isFollowing },
    creator,
    monetization: isSelf ? monetization : monetization ? { tier: monetization.tier } : null,
  };
}

module.exports = {
  buildProfileBundle,
  parseSocialLinks,
  isVerifiedUser,
  creatorFromUser,
};
