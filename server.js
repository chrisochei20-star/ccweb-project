const crypto = require("crypto");
const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const { URL } = require("url");
const cryptoSafety = require("./cryptoSafety");
const { createIntelligenceApp } = require("./intelligenceExpress");
const { createDeveloperApp } = require("./developerExpress");
const developerPlatform = require("./developerPlatform");
const { isValidEvmAddress } = require("./developerWeb3");
const authEngine = require("./auth/authEngine");
const { createAuthApp } = require("./auth/authExpress");
const { createGrowthApp } = require("./growthExpress");
const telemetryHub = require("./telemetryHub");
const communityPg = require("./db/persistenceCommunity");
const { getPool } = require("./db/pool");
const pgGrowth = require("./db/persistenceGrowth");
const learningPg = require("./db/persistenceLearning");
const { migrate } = require("./db/migrate");
const { logger } = require("./logging/logger");
const { checkApiRateLimit } = require("./security/apiRateLimit");
const { createSocialApp } = require("./social/socialRouter");
const { handleStripeWebhook } = require("./payments/stripeWebhook");
const { handleStripeCheckoutEscrow } = require("./payments/stripeCheckout");
const { handleLearningStripeCheckout } = require("./payments/learningStripeCheckout");

function useCommunityPg() {
  return Boolean(getPool());
}

const socialApp = createSocialApp();

/** In-memory transcript for CCWEB SSE learning channel (per stream room). */
const learningChannelMessages = new Map();
const learningStreamSseClients = new Map();

function learningBroadcast(roomId, event) {
  const set = learningStreamSseClients.get(roomId);
  if (!set || !set.size) return;
  const payload = JSON.stringify({ ts: new Date().toISOString(), ...event });
  for (const clientRes of set) {
    try {
      clientRes.write(`data: ${payload}\n\n`);
    } catch {
      /* ignore broken pipe */
    }
  }
}

function appendLearningChannelMessage(roomId, msg) {
  const list = learningChannelMessages.get(roomId) || [];
  list.push(msg);
  while (list.length > 200) list.shift();
  learningChannelMessages.set(roomId, list);
}

const PORT = Number(process.env.PORT || 3000);
const CCWEB_ADMIN_KEY = (process.env.CCWEB_ADMIN_KEY || "").trim();
const intelligenceApp = createIntelligenceApp();
const growthApp = createGrowthApp();
const PLATFORM_FEE_RATE = 0.08;

const deals = new Map();
const applicants = new Map();
const streamRooms = new Map();
const streamPayouts = new Map();
const streamDistributions = new Map();
const streamAttendances = new Map();
const ccwebUsers = new Map();
const notifications = new Map();
const notificationInbox = new Map();
const communityPosts = new Map();
const communityComments = new Map();
const communityChats = new Map();
const communityReactions = new Map();
const communityBugReports = new Map();
const aiBlogs = new Map();
const dappDeployments = new Map();
const dappPayments = new Map();
const dappTransactions = new Map();
const processedIdempotencyKeys = new Map();
let nextDappTransactionId = 1;
let nextDealId = 1;
let nextStreamRoomId = 1;
let nextStreamPayoutId = 1;
let nextStreamDistributionId = 1;
let nextNotificationId = 1;
let nextCommunityPostId = 1;
let nextCommunityCommentId = 1;
let nextCommunityChatId = 1;
let nextCommunityReactionId = 1;
let nextCommunityBugReportId = 1;
let nextAiBlogId = 1;
let nextDappDeploymentId = 1;
let nextDappPaymentId = 1;

const sampleBusinesses = [
  {
    id: "biz-ldn-1",
    name: "Bluebird Dental Studio",
    city: "London",
    country: "UK",
    category: "Dental Clinic",
    rating: 4.1,
    reviewCount: 214,
    responseRate: 42,
    missingDirectories: 2,
    averageReplyHours: 14,
    websiteScore: 66,
    website: "https://bluebirddental.example",
  },
  {
    id: "biz-syd-1",
    name: "Harborview Fitness",
    city: "Sydney",
    country: "Australia",
    category: "Gym",
    rating: 3.8,
    reviewCount: 189,
    responseRate: 31,
    missingDirectories: 4,
    averageReplyHours: 19,
    websiteScore: 55,
    website: "https://harborviewfitness.example",
  },
  {
    id: "biz-tor-1",
    name: "Nova Skin & Laser",
    city: "Toronto",
    country: "Canada",
    category: "Med Spa",
    rating: 4.0,
    reviewCount: 132,
    responseRate: 37,
    missingDirectories: 3,
    averageReplyHours: 20,
    websiteScore: 59,
    website: "https://novaskinlaser.example",
  },
  {
    id: "biz-nyc-1",
    name: "Alta Family Law",
    city: "New York",
    country: "USA",
    category: "Law Firm",
    rating: 3.7,
    reviewCount: 90,
    responseRate: 26,
    missingDirectories: 4,
    averageReplyHours: 26,
    websiteScore: 49,
    website: "https://altafamilylaw.example",
  },
  {
    id: "biz-ber-1",
    name: "Greenfield Vet Care",
    city: "Berlin",
    country: "Germany",
    category: "Veterinary Clinic",
    rating: 4.4,
    reviewCount: 166,
    responseRate: 52,
    missingDirectories: 1,
    averageReplyHours: 9,
    websiteScore: 72,
    website: "https://greenfieldvet.example",
  },
  {
    id: "biz-dxb-1",
    name: "Cedar & Spice Bistro",
    city: "Dubai",
    country: "UAE",
    category: "Restaurant",
    rating: 3.9,
    reviewCount: 248,
    responseRate: 33,
    missingDirectories: 3,
    averageReplyHours: 17,
    websiteScore: 57,
    website: "https://cedarspice.example",
  },
  {
    id: "biz-jhb-1",
    name: "Orbit Auto Repair",
    city: "Johannesburg",
    country: "South Africa",
    category: "Auto Service",
    rating: 3.6,
    reviewCount: 121,
    responseRate: 28,
    missingDirectories: 4,
    averageReplyHours: 28,
    websiteScore: 51,
    website: "https://orbitautorepair.example",
  },
  {
    id: "biz-tyo-1",
    name: "Sakura Smile Studio",
    city: "Tokyo",
    country: "Japan",
    category: "Dental Clinic",
    rating: 4.3,
    reviewCount: 304,
    responseRate: 49,
    missingDirectories: 2,
    averageReplyHours: 11,
    websiteScore: 70,
    website: "https://sakurasmile.example",
  },
];

const categorySkillMap = {
  "dental clinic": ["local seo", "review management", "conversion copy", "google maps"],
  gym: ["lead generation", "social media", "crm", "landing pages"],
  "med spa": ["paid ads", "funnel optimization", "booking automation", "review management"],
  "law firm": ["content strategy", "seo", "lead qualification", "intake automation"],
  "veterinary clinic": ["local seo", "sms campaigns", "customer retention"],
  restaurant: ["reputation management", "menu optimization", "maps seo"],
  "auto service": ["google maps", "call tracking", "follow-up automation"],
};

const curriculumTracks = [
  "AI Foundations",
  "Machine Learning",
  "Blockchain Fundamentals",
  "Smart Contracts",
  "Web3 Product Development",
  "Crypto Markets",
  "Digital Business Systems",
  "Financial Literacy & Human Development",
];

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatMoney(value) {
  return Number(value.toFixed(2));
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function tokenHint(token) {
  if (!token || token.length < 8) {
    return "***";
  }
  return `${token.slice(0, 4)}...${token.slice(-2)}`;
}

function generateReleaseToken() {
  return crypto.randomBytes(16).toString("hex");
}

function generateLivekitToken() {
  return crypto.randomBytes(24).toString("hex");
}

function buildUserProfile(input, existing = null) {
  const now = new Date().toISOString();
  const fallbackId = existing?.id || `user-${crypto.randomUUID().slice(0, 8)}`;
  const id = (input.id || input.userId || fallbackId).toString().trim();
  const displayName = (input.displayName || existing?.displayName || id).toString().trim();
  const email = (input.email !== undefined ? input.email : existing?.email) || null;
  return {
    id,
    email: email ? String(email).trim().toLowerCase() : null,
    displayName,
    isOrganic: input.isOrganic === undefined ? existing?.isOrganic ?? true : Boolean(input.isOrganic),
    roles: Array.isArray(input.roles) && input.roles.length ? input.roles : existing?.roles || ["member"],
    pushEnabled: input.pushEnabled === undefined ? existing?.pushEnabled ?? true : Boolean(input.pushEnabled),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
}

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email || null,
    displayName: user.displayName,
    isOrganic: user.isOrganic,
    roles: user.roles,
    pushEnabled: user.pushEnabled,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

const authApp = createAuthApp({ ccwebUsers, buildUserProfile, sanitizeUser });

function ensureUser(userId, options = {}) {
  const normalizedId = (userId || "").toString().trim();
  if (!normalizedId) {
    return null;
  }
  const existing = ccwebUsers.get(normalizedId);
  if (existing) {
    const hasUpdates =
      options.displayName !== undefined ||
      options.isOrganic !== undefined ||
      options.roles !== undefined ||
      options.pushEnabled !== undefined;
    if (!hasUpdates) {
      return existing;
    }
    const updated = buildUserProfile(
      {
        userId: normalizedId,
        displayName: options.displayName ?? existing.displayName,
        isOrganic: options.isOrganic ?? existing.isOrganic,
        roles: options.roles ?? existing.roles,
        pushEnabled: options.pushEnabled ?? existing.pushEnabled,
      },
      existing
    );
    ccwebUsers.set(normalizedId, updated);
    if (!notificationInbox.has(normalizedId)) {
      notificationInbox.set(normalizedId, []);
    }
    return updated;
  }
  const seeded = buildUserProfile(
    {
      userId: normalizedId,
      displayName: options.displayName || normalizedId,
      isOrganic: options.isOrganic === undefined ? true : options.isOrganic,
      roles: options.roles || ["member"],
      pushEnabled: options.pushEnabled === undefined ? true : options.pushEnabled,
    },
    null
  );
  ccwebUsers.set(normalizedId, seeded);
  if (!notificationInbox.has(normalizedId)) {
    notificationInbox.set(normalizedId, []);
  }
  return seeded;
}

function buildNotificationRecord(input, recipients) {
  const now = new Date().toISOString();
  const id = `notif-${String(nextNotificationId++).padStart(5, "0")}`;
  return {
    id,
    type: (input.type || "platform_event").toString().trim(),
    title: (input.title || "CCWEB notification").toString().trim(),
    message: (input.message || "").toString().trim(),
    channels: Array.isArray(input.channels) && input.channels.length ? input.channels : ["in_app", "push"],
    metadata: input.metadata && typeof input.metadata === "object" ? input.metadata : {},
    recipients,
    createdAt: now,
  };
}

function createNotification(input = {}) {
  let targetUserIds = Array.isArray(input.targetUserIds) ? input.targetUserIds : [];
  if (input.broadcast === true) {
    targetUserIds = Array.from(ccwebUsers.keys());
  }
  const recipients = [...new Set(targetUserIds.map((value) => value.toString().trim()).filter(Boolean))];
  if (!recipients.length) {
    return null;
  }

  recipients.forEach((userId) => ensureUser(userId));
  const record = buildNotificationRecord(input, recipients);
  notifications.set(record.id, record);

  recipients.forEach((userId) => {
    if (!notificationInbox.has(userId)) {
      notificationInbox.set(userId, []);
    }
    notificationInbox.get(userId).push({
      notificationId: record.id,
      read: false,
      deliveredAt: record.createdAt,
    });
  });

  return record;
}

function buildNotificationEnvelope(userId, inboxEntry) {
  const notification = notifications.get(inboxEntry.notificationId);
  if (!notification) {
    return null;
  }
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    channels: notification.channels,
    metadata: notification.metadata,
    createdAt: notification.createdAt,
    read: Boolean(inboxEntry.read),
    deliveredAt: inboxEntry.deliveredAt,
    recipientUserId: userId,
  };
}

function summarizeAttendanceForRoom(roomId) {
  const attendees = streamAttendances.get(roomId);
  if (!attendees) {
    return { activeAttenders: 0, activeOrganicAttenders: 0, totalTrackedAttenders: 0 };
  }
  const values = Array.from(attendees.values());
  return {
    activeAttenders: values.filter((entry) => entry.isActive).length,
    activeOrganicAttenders: values.filter((entry) => entry.isActive && entry.isOrganic).length,
    totalTrackedAttenders: values.length,
  };
}

function isRoomFinished(room) {
  return Boolean(room && room.status === "finished");
}

function updateRoomMetricsFromAttendance(room) {
  const summary = summarizeAttendanceForRoom(room.id);
  room.metrics.activeAttenders = summary.activeAttenders;
  room.metrics.activeOrganicAttenders = summary.activeOrganicAttenders;
  room.metrics.totalTrackedAttenders = summary.totalTrackedAttenders;
  room.metrics.concurrentViewers = summary.activeAttenders;
  room.updatedAt = new Date().toISOString();
}

function getUserActiveStream(userId, options = {}) {
  const normalizedUserId = (userId || "").toString().trim();
  if (!normalizedUserId) {
    return null;
  }
  const excludeRoomId = (options.excludeRoomId || "").toString().trim();

  for (const [roomId, attendeesMap] of streamAttendances.entries()) {
    if (excludeRoomId && roomId === excludeRoomId) {
      continue;
    }
    const attendance = attendeesMap.get(normalizedUserId);
    if (!attendance || !attendance.isActive) {
      continue;
    }
    const room = streamRooms.get(roomId);
    if (!room || isRoomFinished(room)) {
      continue;
    }
    return { room, attendance };
  }

  return null;
}

function closeRoomAttendances(roomId, reason = "room_finished") {
  const attendeesMap = streamAttendances.get(roomId);
  if (!attendeesMap) {
    return [];
  }
  const now = new Date().toISOString();
  const changed = [];
  attendeesMap.forEach((entry, userId) => {
    if (!entry.isActive) {
      return;
    }
    const updated = {
      ...entry,
      isActive: false,
      leftReason: reason,
      updatedAt: now,
    };
    attendeesMap.set(userId, updated);
    changed.push(updated);
  });
  streamAttendances.set(roomId, attendeesMap);
  return changed;
}

async function finalizeLearningRevenueForRoom(roomId) {
  if (!learningPg.usePostgres()) return;
  const sess = await learningPg.getSessionByStreamRoomId(roomId);
  if (!sess || sess.revenue_closed) return;
  const attendeesMap = streamAttendances.get(roomId) || new Map();
  const all = Array.from(attendeesMap.values());
  await learningPg.finalizeSessionRevenue(roomId, all);
  for (const a of all) {
    const sub = await learningPg.getActiveSubscription(a.userId);
    if (!sub) {
      await learningPg.consumeAccessHours(sess.id, a.userId, (Number(a.watchMinutes) || 0) / 60);
    }
  }
  await learningPg.markSessionRevenueClosed(roomId);
}

function checkLearningAdmin(req) {
  const key = (req.headers["x-ccweb-admin"] || "").toString().trim();
  return Boolean(CCWEB_ADMIN_KEY && key && key === CCWEB_ADMIN_KEY);
}

function generateTutorReply(userText) {
  const t = userText.toLowerCase();
  if (t.includes("web3")) {
    return "Web3 is the read–write–own web: users control assets and identity via wallets and open protocols. Want a concrete example (DeFi, NFTs, or identity)?";
  }
  if (t.includes("defi") || t.includes("yield")) {
    return "DeFi uses smart contracts for lending, trading, and liquidity. Always verify contract risk, audits, and liquidity before interacting with real funds.";
  }
  if (t.includes("blockchain") || t.includes("chain")) {
    return "A blockchain is a replicated ledger secured by consensus. Transactions are grouped into blocks and linked cryptographically.";
  }
  return "Here is a concise answer based on your message. For deeper dives, pick a track (AI, Blockchain, Web3, Crypto, Business) and I will structure a mini-lesson with checkpoints.";
}

async function handleLearningAccessQuote(requestUrl, res) {
  const streamRoomId = (requestUrl.searchParams.get("streamRoomId") || "").trim();
  const hours = Math.max(0.25, Math.min(24, Number(requestUrl.searchParams.get("hours") || 1)));
  if (!streamRoomId) {
    sendJson(res, 400, { error: "streamRoomId required." });
    return;
  }
  const room = streamRooms.get(streamRoomId);
  if (!room) {
    sendJson(res, 404, { error: "Stream room not found." });
    return;
  }
  if (!learningPg.usePostgres()) {
    const hourly = Number(process.env.CCWEB_LEARNING_HOURLY_USD || 4.99);
    const pct = Number(room.platformRevenueSharePercent || 25);
    const gross = +(hours * hourly).toFixed(2);
    const platform = +((gross * pct) / 100).toFixed(2);
    sendJson(res, 200, {
      postgres: false,
      streamRoomId,
      hours,
      hourlyRateUsd: hourly,
      platformFeePercent: pct,
      estimatedTotalUsd: gross,
      estimatedPlatformUsd: platform,
      estimatedCreatorUsd: +(gross - platform).toFixed(2),
      note: "Set DATABASE_URL for Stripe paywall and revenue ledger.",
    });
    return;
  }
  const sess = await learningPg.getSessionByStreamRoomId(streamRoomId);
  if (!sess) {
    sendJson(res, 404, { error: "Learning session not synced yet. Open the room once after creation." });
    return;
  }
  const hourly = learningPg.money(sess.hourly_rate_usd);
  const platformPct = learningPg.money(sess.platform_fee_percent);
  const gross = learningPg.money(hours * hourly);
  const platform = learningPg.money((gross * platformPct) / 100);
  const creator = learningPg.money(gross - platform);
  sendJson(res, 200, {
    postgres: true,
    streamRoomId,
    sessionId: sess.id,
    hours,
    hourlyRateUsd: hourly,
    platformFeePercent: platformPct,
    estimatedTotalUsd: gross,
    estimatedPlatformUsd: platform,
    estimatedCreatorUsd: creator,
  });
}

async function handleLearningMe(requestUrl, res) {
  const userId = (requestUrl.searchParams.get("userId") || "").trim();
  if (!userId) {
    sendJson(res, 400, { error: "userId required." });
    return;
  }
  if (!learningPg.usePostgres()) {
    sendJson(res, 200, { postgres: false, profile: null });
    return;
  }
  const profile = await learningPg.userLearningProfile(userId);
  sendJson(res, 200, { postgres: true, profile });
}

async function handleLearningAdminAnalytics(req, res) {
  if (!checkLearningAdmin(req)) {
    sendJson(res, 403, { error: "Admin key required (X-CCWEB-Admin)." });
    return;
  }
  if (!learningPg.usePostgres()) {
    sendJson(res, 503, { error: "PostgreSQL required for learning analytics." });
    return;
  }
  const summary = await learningPg.analyticsSummary();
  const live = await learningPg.listLiveSessionsWithStreamIds();
  const recentLedger = await learningPg.listRecentLedger(40);
  sendJson(res, 200, { summary, liveSessions: live, recentLedger });
}

async function handleLearningSessionDetail(streamRoomId, res) {
  if (!learningPg.usePostgres()) {
    sendJson(res, 503, { error: "PostgreSQL required." });
    return;
  }
  const detail = await learningPg.getLearningSessionDetail(streamRoomId);
  if (!detail) {
    sendJson(res, 404, { error: "Learning session not found." });
    return;
  }
  sendJson(res, 200, detail);
}

async function handleLearningChannelPost(req, res, streamRoomId) {
  if (!streamRooms.has(streamRoomId)) {
    sendJson(res, 404, { error: "Stream room not found." });
    return;
  }
  let body = {};
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }
  const text = (body.message || "").toString().trim().slice(0, 2000);
  const userId = (body.userId || "").toString().trim();
  const displayName = (body.displayName || "").toString().trim() || userId;
  if (!text || !userId) {
    sendJson(res, 400, { error: "userId and message required." });
    return;
  }
  const msg = {
    id: `lch_${crypto.randomBytes(6).toString("hex")}`,
    streamRoomId,
    userId,
    displayName,
    message: text,
    type: (body.type || "chat").toString().slice(0, 32),
    at: new Date().toISOString(),
  };
  appendLearningChannelMessage(streamRoomId, msg);
  learningBroadcast(streamRoomId, { type: "channel_message", message: msg });
  sendJson(res, 201, msg);
}

function handleLearningChannelGet(streamRoomId, res) {
  if (!streamRooms.has(streamRoomId)) {
    sendJson(res, 404, { error: "Stream room not found." });
    return;
  }
  sendJson(res, 200, { messages: learningChannelMessages.get(streamRoomId) || [] });
}

function handleLearningSse(req, res, streamRoomId) {
  if (!streamRooms.has(streamRoomId)) {
    sendJson(res, 404, { error: "Stream room not found." });
    return;
  }
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });
  res.write(": ccweb-learning-sse\n\n");
  let set = learningStreamSseClients.get(streamRoomId);
  if (!set) {
    set = new Set();
    learningStreamSseClients.set(streamRoomId, set);
  }
  set.add(res);
  const ping = setInterval(() => {
    try {
      res.write(": ping\n\n");
    } catch {
      clearInterval(ping);
    }
  }, 25000);
  req.on("close", () => {
    clearInterval(ping);
    set.delete(res);
    if (!set.size) learningStreamSseClients.delete(streamRoomId);
  });
}

async function handleLearningTutorMessage(req, res) {
  let body = {};
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }
  const userId = (body.userId || "").toString().trim();
  const text = (body.message || "").toString().trim().slice(0, 4000);
  if (!userId || !text) {
    sendJson(res, 400, { error: "userId and message required." });
    return;
  }
  let xpGained = 0;
  if (learningPg.usePostgres()) {
    await learningPg.recordTutorEvent(userId, text.length, 3);
    xpGained = 3;
  }
  const replyText = generateTutorReply(text);
  sendJson(res, 200, {
    user: { role: "user", text, at: new Date().toISOString() },
    assistant: { role: "assistant", text: replyText, at: new Date().toISOString() },
    xpGained,
  });
}

function buildDistributionResponse(distribution) {
  return {
    id: distribution.id,
    payoutId: distribution.payoutId,
    roomId: distribution.roomId,
    source: distribution.source,
    poolAmountUsd: distribution.poolAmountUsd,
    distributedAmountUsd: distribution.distributedAmountUsd,
    undistributedAmountUsd: distribution.undistributedAmountUsd,
    recipientCount: distribution.recipientCount,
    status: distribution.status,
    recipients: distribution.recipients,
    createdAt: distribution.createdAt,
  };
}

function distributeStreamingPoolToOrganicUsers(room, payout, poolOverride = null) {
  const attendeesMap = streamAttendances.get(room.id) || new Map();
  const eligibleOrganic = Array.from(attendeesMap.values())
    .filter((entry) => entry.isActive && entry.isOrganic)
    .sort((a, b) => b.watchMinutes - a.watchMinutes);
  const poolAmountUsd = formatMoney(
    Math.max(0, safeNumber(poolOverride === null ? payout.creatorRevenueUsd : poolOverride, payout.creatorRevenueUsd))
  );
  const createdAt = new Date().toISOString();
  const id = `stream-dist-${String(nextStreamDistributionId++).padStart(4, "0")}`;

  if (!eligibleOrganic.length || poolAmountUsd <= 0) {
    const distribution = {
      id,
      payoutId: payout.id,
      roomId: room.id,
      source: "ai_streaming_creator_pool",
      poolAmountUsd,
      distributedAmountUsd: 0,
      undistributedAmountUsd: poolAmountUsd,
      recipientCount: 0,
      status: "pending_no_organic_attenders",
      recipients: [],
      createdAt,
    };
    streamDistributions.set(id, distribution);
    return distribution;
  }

  const totalWeight = eligibleOrganic.reduce((sum, entry) => {
    const participationScore = Math.max(
      0,
      safeNumber(entry.interactionScore, 0) +
        safeNumber(entry.reactionCount, 0) * 2 +
        safeNumber(entry.chatMessageCount, 0) * 3
    );
    const weight = Math.max(
      1,
      safeNumber(entry.watchMinutes, 0) + Math.round(participationScore * 0.35)
    );
    return sum + weight;
  }, 0);
  let remaining = poolAmountUsd;
  const recipients = eligibleOrganic.map((entry, index) => {
    const participationScore = Math.max(
      0,
      safeNumber(entry.interactionScore, 0) +
        safeNumber(entry.reactionCount, 0) * 2 +
        safeNumber(entry.chatMessageCount, 0) * 3
    );
    const weight = Math.max(
      1,
      safeNumber(entry.watchMinutes, 0) + Math.round(participationScore * 0.35)
    );
    const share =
      index === eligibleOrganic.length - 1 ? remaining : formatMoney((poolAmountUsd * weight) / totalWeight);
    remaining = formatMoney(Math.max(0, remaining - share));
    return {
      userId: entry.userId,
      displayName: entry.displayName,
      watchMinutes: entry.watchMinutes,
      participationScore,
      weight,
      shareUsd: share,
      isOrganic: true,
    };
  });

  const distributedAmountUsd = formatMoney(recipients.reduce((sum, entry) => sum + entry.shareUsd, 0));
  const undistributedAmountUsd = formatMoney(Math.max(0, poolAmountUsd - distributedAmountUsd));
  const distribution = {
    id,
    payoutId: payout.id,
    roomId: room.id,
    source: "ai_streaming_creator_pool",
    poolAmountUsd,
    distributedAmountUsd,
    undistributedAmountUsd,
    recipientCount: recipients.length,
    status: distributedAmountUsd > 0 ? "distributed_to_organic_users" : "pending_no_organic_attenders",
    recipients,
    createdAt,
  };
  streamDistributions.set(id, distribution);
  return distribution;
}

function distributeAndNotifyForPayout(room, payout, poolOverride = null) {
  const distribution = distributeStreamingPoolToOrganicUsers(room, payout, poolOverride);
  if (distribution.recipientCount > 0) {
    distribution.recipients.forEach((recipient) => {
      createNotification({
        type: "ai_streaming_pool_distribution",
        title: "AI streaming revenue share distributed",
        message: `You received $${recipient.shareUsd} from ${room.roomName} organic streaming pool.`,
        targetUserIds: [recipient.userId],
        metadata: {
          roomId: room.id,
          roomName: room.roomName,
          payoutId: payout.id,
          distributionId: distribution.id,
          shareUsd: recipient.shareUsd,
          watchMinutes: recipient.watchMinutes,
        },
      });
    });
  }

  const ownerId = (room.createdBy || "").toString().trim();
  if (ownerId) {
    createNotification({
      type: "ai_streaming_payout_summary",
      title: "Streaming payout completed",
      message: `Payout ${payout.id} distributed to ${distribution.recipientCount} organic attenders from ${room.roomName}.`,
      targetUserIds: [ownerId],
      metadata: {
        roomId: room.id,
        roomName: room.roomName,
        payoutId: payout.id,
        distributionId: distribution.id,
        distributedAmountUsd: distribution.distributedAmountUsd,
        recipientCount: distribution.recipientCount,
      },
    });
  }

  return distribution;
}

function resolveNotificationTargetOwner(targetType, targetId) {
  if (targetType === "community_post") {
    return communityPosts.get(targetId)?.authorUserId || null;
  }
  if (targetType === "community_chat") {
    return communityChats.get(targetId)?.authorUserId || null;
  }
  if (targetType === "ai_blog") {
    return aiBlogs.get(targetId)?.authorUserId || null;
  }
  if (targetType === "stream_room") {
    return streamRooms.get(targetId)?.createdBy || null;
  }
  return null;
}

function ensureInbox(userId) {
  if (!notificationInbox.has(userId)) {
    notificationInbox.set(userId, []);
  }
  return notificationInbox.get(userId);
}

function handleListUsers(res) {
  const users = Array.from(ccwebUsers.values()).map(sanitizeUser);
  sendJson(res, 200, { count: users.length, users });
}

async function handleUpsertUser(req, res) {
  const tokenUserId = authEngine.getUserIdFromAccess(getBearerToken(req));
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }

  const requestedId = (body.id || body.userId || "").toString().trim();
  if (requestedId && tokenUserId && requestedId !== tokenUserId) {
    sendJson(res, 403, { error: "Cannot modify another user's profile." });
    return;
  }

  const existing = requestedId ? ccwebUsers.get(requestedId) : null;
  const profile = buildUserProfile(body, existing);
  ccwebUsers.set(profile.id, profile);
  ensureInbox(profile.id);
  sendJson(res, existing ? 200 : 201, sanitizeUser(profile));
}

function handleListNotifications(req, requestUrl, res) {
  const tokenUserId = authEngine.getUserIdFromAccess(getBearerToken(req));
  const userId = (requestUrl.searchParams.get("userId") || tokenUserId || "").trim();
  if (!userId) {
    sendJson(res, 400, { error: "userId is required or sign in." });
    return;
  }
  if (tokenUserId && userId !== tokenUserId) {
    sendJson(res, 403, { error: "Cannot read another user's notifications." });
    return;
  }
  ensureUser(userId);
  const unreadOnly = requestUrl.searchParams.get("unreadOnly") === "true";
  const inbox = ensureInbox(userId);
  const items = inbox
    .map((entry) => buildNotificationEnvelope(userId, entry))
    .filter(Boolean)
    .filter((entry) => (unreadOnly ? !entry.read : true))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  sendJson(res, 200, {
    userId,
    count: items.length,
    unreadCount: items.filter((entry) => !entry.read).length,
    notifications: items,
  });
}

async function handleMarkNotificationsRead(req, res) {
  const tokenUserId = authEngine.getUserIdFromAccess(getBearerToken(req));
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }

  const userId = (body.userId || tokenUserId || "").toString().trim();
  if (!userId) {
    sendJson(res, 400, { error: "userId is required or sign in." });
    return;
  }
  if (tokenUserId && userId !== tokenUserId) {
    sendJson(res, 403, { error: "Cannot modify another user's notifications." });
    return;
  }
  ensureUser(userId);
  const inbox = ensureInbox(userId);
  const markAll = body.markAll === true;
  const selected = new Set(Array.isArray(body.notificationIds) ? body.notificationIds.map((id) => id.toString()) : []);
  let updated = 0;
  inbox.forEach((entry) => {
    if (!entry.read && (markAll || selected.has(entry.notificationId))) {
      entry.read = true;
      updated += 1;
    }
  });
  sendJson(res, 200, { userId, updated });
}

function handleListCommunityPosts(res) {
  if (useCommunityPg()) {
    communityPg
      .listPosts()
      .then((posts) => sendJson(res, 200, { count: posts.length, posts }))
      .catch((e) => sendJson(res, 500, { error: e.message }));
    return;
  }
  const counts = new Map();
  for (const c of communityComments.values()) {
    counts.set(c.postId, (counts.get(c.postId) || 0) + 1);
  }
  const posts = Array.from(communityPosts.values())
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map((p) => ({ ...p, commentCount: counts.get(p.id) || 0 }));
  sendJson(res, 200, { count: posts.length, posts });
}

async function handleCreateCommunityPost(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }

  const authorUserId = (body.authorUserId || "").toString().trim();
  const title = (body.title || "").toString().trim();
  const content = (body.content || "").toString().trim();
  if (!authorUserId || !title || !content) {
    sendJson(res, 400, { error: "authorUserId, title and content are required." });
    return;
  }

  const author = ensureUser(authorUserId, { displayName: body.authorDisplayName });

  if (useCommunityPg()) {
    try {
      const post = await communityPg.createPost({
        authorUserId: author.id,
        authorDisplayName: author.displayName,
        title,
        content,
        tags: Array.isArray(body.tags) ? body.tags.map((tag) => tag.toString()) : [],
      });
      createNotification({
        type: "community_post_created",
        title: "New community post",
        message: `${author.displayName} posted: ${title}`,
        broadcast: true,
        metadata: { postId: post.id, authorUserId: author.id },
      });
      sendJson(res, 201, post);
    } catch (e) {
      sendJson(res, 500, { error: e.message });
    }
    return;
  }

  const id = `post-${String(nextCommunityPostId++).padStart(4, "0")}`;
  const post = {
    id,
    authorUserId: author.id,
    authorDisplayName: author.displayName,
    title,
    content,
    tags: Array.isArray(body.tags) ? body.tags.map((tag) => tag.toString()) : [],
    createdAt: new Date().toISOString(),
  };
  communityPosts.set(id, post);

  createNotification({
    type: "community_post_created",
    title: "New community post",
    message: `${author.displayName} posted: ${title}`,
    broadcast: true,
    metadata: { postId: id, authorUserId: author.id },
  });

  sendJson(res, 201, post);
}

function handleGetCommunityPost(postId, res) {
  if (useCommunityPg()) {
    communityPg
      .getPostWithComments(postId)
      .then((data) => {
        if (!data) {
          sendJson(res, 404, { error: "Post not found." });
          return;
        }
        sendJson(res, 200, data);
      })
      .catch((e) => sendJson(res, 500, { error: e.message }));
    return;
  }
  const post = communityPosts.get(postId);
  if (!post) {
    sendJson(res, 404, { error: "Post not found." });
    return;
  }
  const comments = Array.from(communityComments.values())
    .filter((c) => c.postId === postId)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  sendJson(res, 200, { post, comments });
}

function handleListPostComments(postId, res) {
  if (useCommunityPg()) {
    communityPg
      .getPostWithComments(postId)
      .then((data) => {
        if (!data) sendJson(res, 404, { error: "Post not found." });
        else sendJson(res, 200, { postId, count: data.comments.length, comments: data.comments });
      })
      .catch((e) => sendJson(res, 500, { error: e.message }));
    return;
  }
  if (!communityPosts.has(postId)) {
    sendJson(res, 404, { error: "Post not found." });
    return;
  }
  const comments = Array.from(communityComments.values())
    .filter((c) => c.postId === postId)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  sendJson(res, 200, { postId, count: comments.length, comments });
}

async function handleCreatePostComment(req, res, postId) {
  if (useCommunityPg()) {
    const exists = await communityPg.getPostWithComments(postId);
    if (!exists) {
      sendJson(res, 404, { error: "Post not found." });
      return;
    }
  } else if (!communityPosts.has(postId)) {
    sendJson(res, 404, { error: "Post not found." });
    return;
  }
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }
  const authorUserId = (body.authorUserId || "").toString().trim();
  const text = (body.body || body.content || "").toString().trim();
  if (!authorUserId || !text) {
    sendJson(res, 400, { error: "authorUserId and body (or content) are required." });
    return;
  }
  const author = ensureUser(authorUserId, { displayName: body.authorDisplayName });

  if (useCommunityPg()) {
    try {
      const row = await communityPg.createComment(postId, {
        authorUserId: author.id,
        authorDisplayName: author.displayName,
        body: text.slice(0, 2000),
      });
      const post = (await communityPg.getPostWithComments(postId)).post;
      createNotification({
        type: "community_post_comment",
        title: "New comment on your post",
        message: `${author.displayName} commented on: ${post.title}`,
        targetUserIds: [post.authorUserId].filter((uid) => uid && uid !== author.id),
        metadata: { postId, commentId: row.id },
      });
      sendJson(res, 201, row);
    } catch (e) {
      sendJson(res, 500, { error: e.message });
    }
    return;
  }

  const id = `cmt-${String(nextCommunityCommentId++).padStart(5, "0")}`;
  const row = {
    id,
    postId,
    authorUserId: author.id,
    authorDisplayName: author.displayName,
    body: text.slice(0, 2000),
    createdAt: new Date().toISOString(),
  };
  communityComments.set(id, row);
  const post = communityPosts.get(postId);
  createNotification({
    type: "community_post_comment",
    title: "New comment on your post",
    message: `${author.displayName} commented on: ${post.title}`,
    targetUserIds: [post.authorUserId].filter((uid) => uid && uid !== author.id),
    metadata: { postId, commentId: id },
  });
  sendJson(res, 201, row);
  const channelFilter = (requestUrl.searchParams.get("channel") || "").trim();
  if (useCommunityPg()) {
    communityPg
      .listChats(channelFilter)
      .then((chats) => sendJson(res, 200, { count: chats.length, chats }))
      .catch((e) => sendJson(res, 500, { error: e.message }));
    return;
  }
  const chats = Array.from(communityChats.values())
    .filter((chat) => (channelFilter ? chat.channel === channelFilter : true))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  sendJson(res, 200, { count: chats.length, chats });
}

async function handleCreateCommunityChat(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }

  const authorUserId = (body.authorUserId || "").toString().trim();
  const message = (body.message || "").toString().trim();
  const channel = (body.channel || "general").toString().trim();
  if (!authorUserId || !message) {
    sendJson(res, 400, { error: "authorUserId and message are required." });
    return;
  }

  const author = ensureUser(authorUserId, { displayName: body.authorDisplayName });

  if (useCommunityPg()) {
    try {
      const chat = await communityPg.createChat({
        channel,
        authorUserId: author.id,
        authorDisplayName: author.displayName,
        message,
      });
      createNotification({
        type: "community_chat_message",
        title: `Chat update in #${channel}`,
        message: `${author.displayName}: ${message.slice(0, 120)}`,
        broadcast: true,
        metadata: { chatId: chat.id, channel, authorUserId: author.id },
      });
      sendJson(res, 201, chat);
    } catch (e) {
      sendJson(res, 500, { error: e.message });
    }
    return;
  }

  const id = `chat-${String(nextCommunityChatId++).padStart(5, "0")}`;
  const chat = {
    id,
    channel,
    authorUserId: author.id,
    authorDisplayName: author.displayName,
    message,
    createdAt: new Date().toISOString(),
  };
  communityChats.set(id, chat);

  createNotification({
    type: "community_chat_message",
    title: `Chat update in #${channel}`,
    message: `${author.displayName}: ${message.slice(0, 120)}`,
    broadcast: true,
    metadata: { chatId: id, channel, authorUserId: author.id },
  });

  sendJson(res, 201, chat);
}

function handleListCommunityReactions(requestUrl, res) {
  const targetType = (requestUrl.searchParams.get("targetType") || "").trim();
  const targetId = (requestUrl.searchParams.get("targetId") || "").trim();
  if (useCommunityPg()) {
    communityPg
      .listReactions(targetType, targetId)
      .then((reactions) => sendJson(res, 200, { count: reactions.length, reactions }))
      .catch((e) => sendJson(res, 500, { error: e.message }));
    return;
  }
  const reactions = Array.from(communityReactions.values()).filter((reaction) => {
    if (targetType && reaction.targetType !== targetType) {
      return false;
    }
    if (targetId && reaction.targetId !== targetId) {
      return false;
    }
    return true;
  });
  sendJson(res, 200, { count: reactions.length, reactions });
}

async function handleCreateCommunityReaction(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }

  const authorUserId = (body.authorUserId || "").toString().trim();
  const targetType = (body.targetType || "").toString().trim();
  const targetId = (body.targetId || "").toString().trim();
  const reaction = (body.reaction || "like").toString().trim();
  if (!authorUserId || !targetType || !targetId) {
    sendJson(res, 400, { error: "authorUserId, targetType and targetId are required." });
    return;
  }

  const actor = ensureUser(authorUserId, { displayName: body.authorDisplayName });

  if (useCommunityPg()) {
    try {
      const record = await communityPg.createReaction({
        authorUserId: actor.id,
        authorDisplayName: actor.displayName,
        targetType,
        targetId,
        reaction,
      });
      const ownerId = resolveNotificationTargetOwner(targetType, targetId);
      if (ownerId && ownerId !== actor.id) {
        createNotification({
          type: "community_reaction_received",
          title: "New reaction on your CCWEB content",
          message: `${actor.displayName} reacted with ${reaction}.`,
          targetUserIds: [ownerId],
          metadata: { reactionId: record.id, targetType, targetId, fromUserId: actor.id },
        });
      }
      sendJson(res, 201, record);
    } catch (e) {
      sendJson(res, 500, { error: e.message });
    }
    return;
  }

  const id = `react-${String(nextCommunityReactionId++).padStart(5, "0")}`;
  const record = {
    id,
    authorUserId: actor.id,
    authorDisplayName: actor.displayName,
    targetType,
    targetId,
    reaction,
    createdAt: new Date().toISOString(),
  };
  communityReactions.set(id, record);

  const ownerId = resolveNotificationTargetOwner(targetType, targetId);
  if (ownerId && ownerId !== actor.id) {
    createNotification({
      type: "community_reaction_received",
      title: "New reaction on your CCWEB content",
      message: `${actor.displayName} reacted with ${reaction}.`,
      targetUserIds: [ownerId],
      metadata: { reactionId: id, targetType, targetId, fromUserId: actor.id },
    });
  }

  sendJson(res, 201, record);
}

function handleListBugReports(res) {
  if (useCommunityPg()) {
    communityPg
      .listBugs()
      .then((reports) => sendJson(res, 200, { count: reports.length, reports }))
      .catch((e) => sendJson(res, 500, { error: e.message }));
    return;
  }
  const reports = Array.from(communityBugReports.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  sendJson(res, 200, { count: reports.length, reports });
}

async function handleCreateBugReport(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }

  const reporterUserId = (body.reporterUserId || "").toString().trim();
  const title = (body.title || "").toString().trim();
  const description = (body.description || "").toString().trim();
  const pathStr = (body.path || "").toString().trim();
  if (!title || !description) {
    sendJson(res, 400, { error: "title and description are required." });
    return;
  }

  const reporter = reporterUserId ? ensureUser(reporterUserId, { displayName: body.reporterDisplayName }) : null;

  if (useCommunityPg()) {
    try {
      const record = await communityPg.createBug({
        reporterUserId: reporter?.id || null,
        reporterDisplayName: reporter?.displayName || null,
        title: title.slice(0, 160),
        description: description.slice(0, 4000),
        path: pathStr.slice(0, 400),
        severity: (body.severity || "normal").toString().trim().slice(0, 32),
      });
      telemetryHub.recordEvent({
        name: "bug_report_submitted",
        path: record.path || "/",
        metadata: { bugId: record.id, severity: record.severity },
      });
      sendJson(res, 201, record);
    } catch (e) {
      sendJson(res, 500, { error: e.message });
    }
    return;
  }

  const id = `bug-${String(nextCommunityBugReportId++).padStart(5, "0")}`;
  const record = {
    id,
    reporterUserId: reporter?.id || null,
    reporterDisplayName: reporter?.displayName || null,
    title: title.slice(0, 160),
    description: description.slice(0, 4000),
    path: pathStr.slice(0, 400),
    severity: (body.severity || "normal").toString().trim().slice(0, 32),
    createdAt: new Date().toISOString(),
  };
  communityBugReports.set(id, record);
  telemetryHub.recordEvent({
    name: "bug_report_submitted",
    path: record.path || "/",
    metadata: { bugId: id, severity: record.severity },
  });
  sendJson(res, 201, record);
  const blogs = Array.from(aiBlogs.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  sendJson(res, 200, { count: blogs.length, blogs });
}

async function handleCreateAiBlog(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }

  const authorUserId = (body.authorUserId || "").toString().trim();
  const title = (body.title || "").toString().trim();
  const content = (body.content || "").toString().trim();
  const topic = (body.topic || "AI & Web3").toString().trim();
  if (!authorUserId || !title || !content) {
    sendJson(res, 400, { error: "authorUserId, title and content are required." });
    return;
  }

  const author = ensureUser(authorUserId, { displayName: body.authorDisplayName });
  const id = `blog-${String(nextAiBlogId++).padStart(4, "0")}`;
  const blog = {
    id,
    authorUserId: author.id,
    authorDisplayName: author.displayName,
    title,
    content,
    topic,
    createdAt: new Date().toISOString(),
  };
  aiBlogs.set(id, blog);

  createNotification({
    type: "ai_blog_published",
    title: "New AI blog published",
    message: `${author.displayName} published "${title}" in ${topic}.`,
    broadcast: true,
    metadata: { blogId: id, topic, authorUserId: author.id },
  });

  sendJson(res, 201, blog);
}

function parseRoomIdFromPath(pathname, suffix) {
  const match = pathname.match(new RegExp(`^/api/streaming/rooms/([^/]+)/${suffix}$`));
  return match ? match[1] : null;
}

function handleGetActiveStreamSession(requestUrl, res) {
  const userId = (requestUrl.searchParams.get("userId") || "").trim();
  if (!userId) {
    sendJson(res, 400, { error: "userId is required." });
    return;
  }
  const active = getUserActiveStream(userId);
  if (!active) {
    sendJson(res, 200, { userId, hasActiveStream: false, activeSession: null });
    return;
  }

  sendJson(res, 200, {
    userId,
    hasActiveStream: true,
    activeSession: {
      room: buildStreamRoomResponse(active.room),
      attendance: active.attendance,
    },
  });
}

function handleListStreamAttendance(pathname, res) {
  const roomId = parseRoomIdFromPath(pathname, "attendance");
  if (!roomId) {
    sendJson(res, 404, { error: "Attendance route not found." });
    return;
  }
  const room = streamRooms.get(roomId);
  if (!room) {
    sendJson(res, 404, { error: "Streaming room not found." });
    return;
  }

  const attendeesMap = streamAttendances.get(roomId) || new Map();
  const attendees = Array.from(attendeesMap.values()).sort((a, b) => (a.joinedAt < b.joinedAt ? 1 : -1));
  const summary = summarizeAttendanceForRoom(roomId);
  sendJson(res, 200, { roomId, summary, attendees });
}

async function handleUpsertStreamAttendance(pathname, req, res) {
  const roomId = parseRoomIdFromPath(pathname, "attendance");
  if (!roomId) {
    sendJson(res, 404, { error: "Attendance route not found." });
    return;
  }
  const room = streamRooms.get(roomId);
  if (!room) {
    sendJson(res, 404, { error: "Streaming room not found." });
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }

  const userId = (body.userId || "").toString().trim();
  if (!userId) {
    sendJson(res, 400, { error: "userId is required." });
    return;
  }

  const user = ensureUser(userId, {
    displayName: body.displayName,
    isOrganic: body.isOrganic,
  });
  const attendeesMap = streamAttendances.get(roomId) || new Map();
  const now = new Date().toISOString();
  const existing = attendeesMap.get(user.id);
  const requestedActive = body.isActive === undefined ? existing?.isActive ?? true : Boolean(body.isActive);

  if (requestedActive && isRoomFinished(room)) {
    sendJson(res, 409, {
      error: "This streaming session is finished. Join a live session instead.",
      roomId,
      roomStatus: room.status,
    });
    return;
  }

  if (requestedActive && (!existing || existing.isActive !== true)) {
    const activeStream = getUserActiveStream(user.id, { excludeRoomId: roomId });
    if (activeStream) {
      sendJson(res, 409, {
        error: "User can join only one active stream at a time until that program is finished.",
        activeSession: {
          roomId: activeStream.room.id,
          roomName: activeStream.room.roomName,
          status: activeStream.room.status,
          estimatedEndAt: activeStream.room.tutoringSchedule?.estimatedEndAt || null,
        },
      });
      return;
    }
  }

  if (learningPg.usePostgres() && requestedActive && !isRoomFinished(room)) {
    const sess = await learningPg.getSessionByStreamRoomId(roomId);
    if (sess) {
      const gate = await learningPg.userHasActiveAccess(sess.id, user.id);
      if (!gate.ok) {
        sendJson(res, 402, {
          error: "Payment or subscription required to join this paid session.",
          code: "LEARNING_PAYWALL",
          streamRoomId: roomId,
        });
        return;
      }
      if (gate.via === "credits") {
        const prevMin = Number(existing?.watchMinutes || 0);
        const nextMin = Math.max(0, safeNumber(body.watchMinutes, prevMin));
        const delta = nextMin - prevMin;
        if (delta > 0) {
          const debit = await learningPg.debitCreditsForMinutes(user.id, delta, Number(sess.hourly_rate_usd));
          if (!debit.ok) {
            sendJson(res, 402, {
              error: "Insufficient learning credits for additional watch time.",
              code: "LEARNING_CREDITS",
              neededCents: debit.neededCents,
              balanceCents: debit.balanceCents,
            });
            return;
          }
        }
      }
    }
  }

  const watchMinutes = Math.max(0, safeNumber(body.watchMinutes, existing?.watchMinutes || 0));
  const interactionScore = Math.max(
    0,
    safeNumber(body.interactionScore, existing?.interactionScore || 0)
  );
  const reactionCount = Math.max(
    0,
    Math.round(safeNumber(body.reactionCount, existing?.reactionCount || 0))
  );
  const chatMessageCount = Math.max(
    0,
    Math.round(safeNumber(body.chatMessageCount, existing?.chatMessageCount || 0))
  );
  const entry = {
    roomId,
    userId: user.id,
    displayName: user.displayName,
    isOrganic: user.isOrganic,
    watchMinutes,
    interactionScore,
    reactionCount,
    chatMessageCount,
    isActive: requestedActive,
    joinedAt: existing?.joinedAt || now,
    updatedAt: now,
  };

  attendeesMap.set(user.id, entry);
  streamAttendances.set(roomId, attendeesMap);
  updateRoomMetricsFromAttendance(room);
  streamRooms.set(roomId, room);

  if (learningPg.usePostgres()) {
    const sess = await learningPg.getSessionByStreamRoomId(roomId);
    if (sess) {
      await learningPg.upsertParticipation(sess.id, roomId, user.id, watchMinutes, interactionScore);
    }
  }

  learningBroadcast(roomId, {
    type: "attendance",
    attendance: entry,
    metrics: room.metrics,
  });

  const ownerId = (room.createdBy || "").toString().trim();
  if (ownerId) {
    createNotification({
      type: "ai_streaming_attendance_update",
      title: "Streaming attendance updated",
      message: `${room.metrics.activeAttenders} active attenders in ${room.roomName}.`,
      targetUserIds: [ownerId],
      metadata: {
        roomId,
        actorUserId: user.id,
        activeAttenders: room.metrics.activeAttenders,
        activeOrganicAttenders: room.metrics.activeOrganicAttenders,
      },
    });
  }

  sendJson(res, existing ? 200 : 201, { roomId, attendance: entry, metrics: room.metrics });
}

async function handleFinishStreamRoom(pathname, req, res) {
  const roomId = parseRoomIdFromPath(pathname, "finish");
  if (!roomId) {
    sendJson(res, 404, { error: "Finish route not found." });
    return;
  }
  const room = streamRooms.get(roomId);
  if (!room) {
    sendJson(res, 404, { error: "Streaming room not found." });
    return;
  }

  let body = {};
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }

  if (isRoomFinished(room)) {
    sendJson(res, 200, {
      room: buildStreamRoomResponse(room),
      closedAttendances: 0,
      message: "Room already finished.",
    });
    return;
  }

  const finishedBy = (body.finishedBy || room.createdBy || "system").toString().trim();
  const now = new Date().toISOString();
  room.status = "finished";
  room.finishedAt = now;
  room.updatedAt = now;
  room.tutoringSchedule = {
    ...room.tutoringSchedule,
    actualEndedAt: now,
  };

  const closed = closeRoomAttendances(roomId, "room_finished");
  updateRoomMetricsFromAttendance(room);
  streamRooms.set(roomId, room);
  await finalizeLearningRevenueForRoom(roomId);

  const recipientSet = new Set([
    room.createdBy,
    ...closed.map((entry) => entry.userId),
  ]);
  createNotification({
    type: "ai_streaming_room_finished",
    title: "AI live stream finished",
    message: `${room.roomName} has finished. You can now join another stream.`,
    targetUserIds: Array.from(recipientSet).filter(Boolean),
    metadata: {
      roomId: room.id,
      roomName: room.roomName,
      finishedAt: room.finishedAt,
      finishedBy,
      closedAttendances: closed.length,
    },
  });

  sendJson(res, 200, {
    room: buildStreamRoomResponse(room),
    closedAttendances: closed.length,
    finishedBy,
  });
}

/** For Public API /v1 — returns { error, status } or { room } without writing HTTP. */
async function createStreamingSessionForDeveloperApi(body) {
  const result = createRoomFromPayload(body || {});
  if (result.error) {
    return { error: result.error, status: result.status || 400 };
  }
  const room = result.room;
  const owner = ensureUser(room.createdBy, { displayName: (body || {}).createdByDisplayName });
  if (!streamAttendances.has(room.id)) {
    streamAttendances.set(room.id, new Map());
  }
  updateRoomMetricsFromAttendance(room);
  streamRooms.set(room.id, room);
  try {
    await learningPg.upsertSessionFromStreamRoom(room);
  } catch (e) {
    logger.warn({ msg: "learning_session_upsert_fail", err: e.message });
  }
  if (owner) {
    createNotification({
      type: "ai_streaming_room_created",
      title: "AI live stream activated",
      message: `${room.roomName} is now live with topic: ${room.topic}.`,
      targetUserIds: [owner.id],
      metadata: {
        roomId: room.id,
        roomName: room.roomName,
        topic: room.topic,
        platformRevenueSharePercent: room.platformRevenueSharePercent,
        expectedSessionMinutes: room.tutoringSchedule.expectedSessionMinutes,
        tutoringIntervalMinutes: room.tutoringSchedule.tutoringIntervalMinutes,
        estimatedEndAt: room.tutoringSchedule.estimatedEndAt,
      },
    });
  }
  createNotification({
    type: "ai_streaming_live_alert",
    title: "New CCWEB AI live stream",
    message: `${room.roomName} started: ${room.topic}.`,
    broadcast: true,
    metadata: {
      roomId: room.id,
      roomName: room.roomName,
      topic: room.topic,
      createdBy: room.createdBy,
      expectedSessionMinutes: room.tutoringSchedule.expectedSessionMinutes,
      tutoringIntervalMinutes: room.tutoringSchedule.tutoringIntervalMinutes,
      estimatedEndAt: room.tutoringSchedule.estimatedEndAt,
    },
  });
  return { room: buildStreamRoomResponse(room) };
}

/** For Public API /v1 — finish by room id. */
async function finishStreamingSessionForDeveloperApi(roomId, body) {
  const room = streamRooms.get(roomId);
  if (!room) {
    return { error: "Streaming room not found.", status: 404 };
  }
  const b = body || {};
  if (isRoomFinished(room)) {
    return {
      room: buildStreamRoomResponse(room),
      closedAttendances: 0,
      message: "Room already finished.",
    };
  }
  const finishedBy = (b.finishedBy || room.createdBy || "system").toString().trim();
  const now = new Date().toISOString();
  room.status = "finished";
  room.finishedAt = now;
  room.updatedAt = now;
  room.tutoringSchedule = {
    ...room.tutoringSchedule,
    actualEndedAt: now,
  };
  const closed = closeRoomAttendances(roomId, "room_finished");
  updateRoomMetricsFromAttendance(room);
  streamRooms.set(roomId, room);
  await finalizeLearningRevenueForRoom(roomId);
  const recipientSet = new Set([room.createdBy, ...closed.map((entry) => entry.userId)]);
  createNotification({
    type: "ai_streaming_room_finished",
    title: "AI live stream finished",
    message: `${room.roomName} has finished. You can now join another stream.`,
    targetUserIds: Array.from(recipientSet).filter(Boolean),
    metadata: {
      roomId: room.id,
      roomName: room.roomName,
      finishedAt: room.finishedAt,
      finishedBy,
      closedAttendances: closed.length,
    },
  });
  return {
    room: buildStreamRoomResponse(room),
    closedAttendances: closed.length,
    finishedBy,
  };
}

function handleListStreamDistributions(requestUrl, res) {
  const roomId = (requestUrl.searchParams.get("roomId") || "").trim();
  const payoutId = (requestUrl.searchParams.get("payoutId") || "").trim();
  const distributions = Array.from(streamDistributions.values())
    .filter((distribution) => (roomId ? distribution.roomId === roomId : true))
    .filter((distribution) => (payoutId ? distribution.payoutId === payoutId : true))
    .map(buildDistributionResponse);
  sendJson(res, 200, { count: distributions.length, distributions });
}

async function handleDistributeStreamPayout(pathname, req, res) {
  const match = pathname.match(/^\/api\/streaming\/payouts\/([^/]+)\/distribute$/);
  if (!match) {
    sendJson(res, 404, { error: "Distribution route not found." });
    return;
  }
  const payoutId = match[1];
  const payout = streamPayouts.get(payoutId);
  if (!payout) {
    sendJson(res, 404, { error: "Streaming payout not found." });
    return;
  }

  let body = {};
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }

  const room = streamRooms.get(payout.roomId);
  if (!room) {
    sendJson(res, 404, { error: "Streaming room not found for distribution." });
    return;
  }

  const poolOverride = body.poolAmountUsd === undefined ? null : Math.max(0, safeNumber(body.poolAmountUsd, 0));
  const distribution = distributeAndNotifyForPayout(room, payout, poolOverride);
  sendJson(res, 201, buildDistributionResponse(distribution));
}

async function serveFile(filePath, res) {
  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Internal server error");
  }
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function sendJsonCors(res, statusCode, payload) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  sendJson(res, statusCode, payload);
}

function getBearerToken(req) {
  const h = req.headers && req.headers.authorization;
  if (!h || typeof h !== "string") return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (!chunks.length) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString("utf-8");
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("INVALID_JSON");
  }
}

function buildProblemCards(business) {
  const rating = safeNumber(business.rating, 4.0);
  const reviewCount = safeNumber(business.reviewCount, 100);
  const responseRate = safeNumber(business.responseRate, 35);
  const missingDirectories = safeNumber(business.missingDirectories, 3);
  const averageReplyHours = safeNumber(business.averageReplyHours, 24);
  const websiteScore = safeNumber(business.websiteScore, 58);

  return [
    {
      title: "Review Sentiment Drift",
      finding: `Average rating is ${rating.toFixed(1)} across ${reviewCount} reviews with recurring service-delay complaints.`,
      impact: "Trust drop lowers conversion from local search visitors.",
      fix: "Deploy weekly review-response playbook and escalation tags.",
    },
    {
      title: "Low Owner Response Coverage",
      finding: `Only ${responseRate}% of reviews have owner replies.`,
      impact: "Prospects interpret silence as weak customer care.",
      fix: "Set 24-hour response SLA with AI-assisted drafts.",
    },
    {
      title: "Directory Consistency Gaps",
      finding: `${missingDirectories} high-intent directories show inconsistent profile data.`,
      impact: "Ranking authority and map visibility are diluted.",
      fix: "Publish synchronized NAP and service metadata across listings.",
    },
    {
      title: "Slow Lead Follow-up",
      finding: `Average response time to enquiries is ${averageReplyHours} hours.`,
      impact: "Hot leads convert to competitors before contact.",
      fix: "Trigger automated lead routing with same-day callback queue.",
    },
    {
      title: "Website Conversion Friction",
      finding: `Estimated website conversion score is ${websiteScore}/100 with weak CTA placement.`,
      impact: "Traffic does not convert into booked calls or visits.",
      fix: "Restructure CTA hierarchy and add proof-rich landing sections.",
    },
    {
      title: "Offer Positioning Is Generic",
      finding: "Online messaging lacks differentiated value proposition by audience segment.",
      impact: "Competing providers appear similar on price and quality.",
      fix: "Rebuild service pages around outcomes, guarantees, and niches.",
    },
  ];
}

function getSyntheticBusinesses(city, query) {
  const cleanCity = city || "Global City";
  const cleanQuery = query || "Local Business";
  const citySlug = slugify(cleanCity || "city");
  const querySlug = slugify(cleanQuery || "business");

  return Array.from({ length: 3 }).map((_, index) => {
    const sequence = index + 1;
    const rating = formatMoney(3.7 + sequence * 0.2);
    return {
      id: `biz-${citySlug}-${querySlug}-${sequence}`,
      name: `${cleanCity} ${cleanQuery} Group ${sequence}`,
      city: cleanCity,
      country: "Global",
      category: cleanQuery,
      rating,
      reviewCount: 80 + sequence * 35,
      responseRate: 30 + sequence * 6,
      missingDirectories: Math.max(1, 5 - sequence),
      averageReplyHours: 10 + sequence * 3,
      websiteScore: 54 + sequence * 5,
      website: `https://${querySlug}-${citySlug}-${sequence}.example`,
    };
  });
}

function searchBusinesses(cityInput, queryInput) {
  const city = (cityInput || "").trim().toLowerCase();
  const query = (queryInput || "").trim().toLowerCase();

  const results = sampleBusinesses.filter((business) => {
    const cityMatch = city ? business.city.toLowerCase().includes(city) : true;
    const queryMatch = query
      ? `${business.name} ${business.category}`.toLowerCase().includes(query)
      : true;
    return cityMatch && queryMatch;
  });

  if (results.length > 0) {
    return { city, query, results };
  }

  return {
    city,
    query,
    results: getSyntheticBusinesses(cityInput || "Global City", queryInput || "Local business"),
  };
}

function findBusinessById(businessId) {
  return sampleBusinesses.find((business) => business.id === businessId) || null;
}

function handleSearchResponse(res, cityInput, queryInput) {
  const { city, query, results } = searchBusinesses(cityInput, queryInput);
  createNotification({
    type: "business_finder_results_ready",
    title: "Business finder results ready",
    message: `AI business finder returned ${results.length} results for ${(query || "all")} in ${(city || "any city")}.`,
    broadcast: true,
    metadata: {
      city: city || "any",
      query: query || "any",
      resultCount: results.length,
    },
  });

  sendJson(res, 200, {
    mode: "google-maps-ai-search",
    city: city || "any",
    query: query || "any",
    count: results.length,
    results,
  });
}

function normalizeAnalyzerCard(card) {
  return {
    title: card.title,
    issue: card.finding,
    impact: card.impact,
    recommendation: card.fix,
  };
}

function buildAnalyzeResponse(businessInput) {
  const businessName = (businessInput.name || businessInput.businessName || "Selected business").toString();
  const city = (businessInput.city || "Unknown city").toString();
  const category = (businessInput.category || "Local business").toString();
  const cards = buildProblemCards(businessInput).map(normalizeAnalyzerCard);
  return {
    analyzer: "claude-online-presence-analyzer",
    business: {
      id: businessInput.id || null,
      name: businessName,
      city,
      category,
      rating: safeNumber(businessInput.rating, 4.0),
      reviewCount: safeNumber(businessInput.reviewCount, 100),
      website: businessInput.website || "",
    },
    summary: "6 critical online-growth problems detected.",
    cards,
  };
}

async function handleAnalyze(req, res, businessIdFromPath = null) {
  if (businessIdFromPath) {
    const business = findBusinessById(businessIdFromPath);
    if (!business) {
      sendJson(res, 404, { error: "Business not found." });
      return;
    }

    sendJson(res, 200, buildAnalyzeResponse(business));
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }

  if (body.businessId) {
    const business = findBusinessById(body.businessId.toString());
    if (business) {
      sendJson(res, 200, buildAnalyzeResponse(business));
      return;
    }
  }

  sendJson(res, 200, buildAnalyzeResponse(body));
}

function normalizeSkills(skillsInput) {
  if (!skillsInput) {
    return [];
  }

  const entries = Array.isArray(skillsInput) ? skillsInput : skillsInput.toString().split(",");

  return entries
    .map((entry) => {
      if (typeof entry === "string") {
        const [namePart, capacityPart] = entry.split(":");
        return {
          name: (namePart || "").trim(),
          capacity: clamp(safeNumber(capacityPart, 70), 1, 100),
        };
      }

      return {
        name: (entry.name || "").toString().trim(),
        capacity: clamp(safeNumber(entry.capacity, 70), 1, 100),
      };
    })
    .filter((skill) => Boolean(skill.name));
}

function normalizeCertificates(certsInput) {
  if (!certsInput) {
    return [];
  }

  const entries = Array.isArray(certsInput) ? certsInput : certsInput.toString().split(",");
  return entries.map((entry) => entry.toString().trim()).filter(Boolean);
}

function buildApplicantProfile(body, existing = null) {
  const now = new Date().toISOString();
  const fallbackId = existing?.id || `app-${slugify(body.fullName || "applicant") || crypto.randomUUID().slice(0, 8)}`;
  const id = (body.id || body.applicantId || fallbackId).toString().trim();
  const fullName = (body.fullName || existing?.fullName || "").toString().trim();

  return {
    id,
    fullName,
    headline: (body.headline || existing?.headline || "").toString().trim(),
    city: (body.city || existing?.city || "Global").toString().trim(),
    skills: normalizeSkills(body.skills || existing?.skills || []),
    certificates: normalizeCertificates(body.certificates || existing?.certificates || []),
    capacity: {
      weeklyHours: clamp(safeNumber(body.weeklyHours ?? body.capacity?.weeklyHours ?? existing?.capacity?.weeklyHours, 30), 1, 80),
      maxConcurrentDeals: clamp(
        safeNumber(body.maxConcurrentDeals ?? body.capacity?.maxConcurrentDeals ?? existing?.capacity?.maxConcurrentDeals, 3),
        1,
        20
      ),
      currentActiveDeals: clamp(
        safeNumber(body.currentActiveDeals ?? body.capacity?.currentActiveDeals ?? existing?.capacity?.currentActiveDeals, 0),
        0,
        20
      ),
    },
    stats: {
      jobsCompleted: Math.max(0, safeNumber(body.jobsCompleted ?? body.stats?.jobsCompleted ?? existing?.stats?.jobsCompleted, 0)),
      totalEarningsUsd: Math.max(
        0,
        safeNumber(body.totalEarningsUsd ?? body.stats?.totalEarningsUsd ?? existing?.stats?.totalEarningsUsd, 0)
      ),
      avgRating: clamp(safeNumber(body.avgRating ?? body.stats?.avgRating ?? existing?.stats?.avgRating, 4.2), 1, 5),
      onTimeRate: clamp(safeNumber(body.onTimeRate ?? body.stats?.onTimeRate ?? existing?.stats?.onTimeRate, 92), 0, 100),
    },
    paymentProfile: {
      payoutCurrency: (body.payoutCurrency || existing?.paymentProfile?.payoutCurrency || "USD").toString(),
      payoutCadence: (body.payoutCadence || existing?.paymentProfile?.payoutCadence || "weekly").toString(),
      roles: ["applicant", "client_approver", "platform_admin"],
      securityTier: (body.securityTier || existing?.paymentProfile?.securityTier || "enhanced").toString(),
    },
    updatedAt: now,
    createdAt: existing?.createdAt || now,
  };
}

function sanitizeApplicant(applicant) {
  return {
    ...applicant,
    compatibilityTags: applicant.skills.map((skill) => skill.name.toLowerCase()),
  };
}

function seedApplicants() {
  const initial = buildApplicantProfile({
    applicantId: "app-001",
    fullName: "Amina Growth Ops",
    headline: "Web3 growth operator for local businesses",
    city: "London",
    skills: ["Local SEO:90", "Review Management:88", "Lead Generation:86", "Google Maps:84"],
    certificates: ["Google Business Profile Optimization", "HubSpot Inbound Marketing", "Web3 GTM Strategy"],
    weeklyHours: 35,
    maxConcurrentDeals: 4,
    currentActiveDeals: 0,
    jobsCompleted: 42,
    totalEarningsUsd: 78500,
    avgRating: 4.8,
    onTimeRate: 97,
    securityTier: "enhanced",
  });
  applicants.set(initial.id, initial);
}

function buildMatchReasons(business, applicant) {
  const categoryKey = business.category.toLowerCase();
  const neededSkills = categorySkillMap[categoryKey] || ["local seo", "review management", "lead generation"];
  const applicantSkills = applicant.skills.map((skill) => skill.name.toLowerCase());

  const matchedSkills = neededSkills.filter((needed) =>
    applicantSkills.some((appSkill) => appSkill.includes(needed) || needed.includes(appSkill))
  );

  return {
    neededSkills,
    matchedSkills,
    coveragePercent: formatMoney((matchedSkills.length / neededSkills.length) * 100),
  };
}

function scoreOpportunity(applicant, business) {
  const reasons = buildMatchReasons(business, applicant);
  const capacityRoom = Math.max(0, applicant.capacity.maxConcurrentDeals - applicant.capacity.currentActiveDeals);
  const capacityScore = clamp(capacityRoom * 7, 0, 21);
  const skillScore = clamp((reasons.coveragePercent / 100) * 55, 0, 55);
  const demandScore = clamp((5 - safeNumber(business.rating, 4)) * 10, 5, 20);
  const velocityScore = clamp(safeNumber(business.reviewCount, 100) / 30, 0, 12);

  const totalScore = Math.round(skillScore + capacityScore + demandScore + velocityScore);
  const projectedGrossDeal = formatMoney(600 + totalScore * 15);
  const platformFee = formatMoney(projectedGrossDeal * PLATFORM_FEE_RATE);
  const applicantNet = formatMoney(projectedGrossDeal - platformFee);

  return {
    score: clamp(totalScore, 1, 100),
    reasons,
    projectedIncome: {
      grossDealUsd: projectedGrossDeal,
      platformFeeUsd: platformFee,
      applicantNetUsd: applicantNet,
    },
  };
}

function handleApplicantList(res) {
  const list = Array.from(applicants.values()).map(sanitizeApplicant);
  sendJson(res, 200, { count: list.length, applicants: list });
}

function handleGetApplicant(applicantId, res) {
  const applicant = applicants.get(applicantId);
  if (!applicant) {
    sendJson(res, 404, { error: "Applicant not found." });
    return;
  }

  sendJson(res, 200, sanitizeApplicant(applicant));
}

async function handleUpsertApplicant(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }

  const requestedId = (body.id || body.applicantId || "").toString().trim();
  const existing = requestedId ? applicants.get(requestedId) : null;
  const profile = buildApplicantProfile(body, existing);

  if (!profile.id || !profile.fullName) {
    sendJson(res, 400, { error: "applicantId and fullName are required." });
    return;
  }

  if (profile.capacity.currentActiveDeals > profile.capacity.maxConcurrentDeals) {
    sendJson(res, 400, {
      error: "currentActiveDeals cannot exceed maxConcurrentDeals.",
    });
    return;
  }

  applicants.set(profile.id, profile);
  sendJson(res, existing ? 200 : 201, sanitizeApplicant(profile));
}

function handleEngineMatch(requestUrl, res) {
  const applicantId = (requestUrl.searchParams.get("applicantId") || "").trim();
  if (!applicantId) {
    sendJson(res, 400, { error: "applicantId is required." });
    return;
  }

  const applicant = applicants.get(applicantId);
  if (!applicant) {
    sendJson(res, 404, { error: "Applicant not found." });
    return;
  }

  const city = requestUrl.searchParams.get("city");
  const query = requestUrl.searchParams.get("query");
  const viewerUserId = (requestUrl.searchParams.get("viewerUserId") || "").trim();
  const { results } = searchBusinesses(city, query);

  const ranked = results
    .map((business) => {
      const score = scoreOpportunity(applicant, business);
      return {
        business,
        compatibilityScore: score.score,
        neededSkills: score.reasons.neededSkills,
        matchedSkills: score.reasons.matchedSkills,
        skillCoveragePercent: score.reasons.coveragePercent,
        projectedIncome: score.projectedIncome,
      };
    })
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore);

  const responsePayload = {
    mode: "ai-business-finder-income-engine",
    applicant: sanitizeApplicant(applicant),
    city: city || "any",
    query: query || "any",
    opportunities: ranked,
  };
  sendJson(res, 200, responsePayload);

  if (viewerUserId) {
    const viewer = ensureUser(viewerUserId);
    if (viewer) {
      createNotification({
        type: "business_finder_results_ready",
        title: "AI business finder results ready",
        message: `Found ${ranked.length} compatibility-matched opportunities in ${city || "any city"}.`,
        targetUserIds: [viewer.id],
        metadata: {
          applicantId,
          city: city || "any",
          query: query || "any",
          resultCount: ranked.length,
        },
      });
    }
  }
}

function decrementApplicantLoad(applicantId) {
  if (!applicantId) {
    return;
  }
  const applicant = applicants.get(applicantId);
  if (!applicant) {
    return;
  }
  applicant.capacity.currentActiveDeals = Math.max(0, applicant.capacity.currentActiveDeals - 1);
  applicant.updatedAt = new Date().toISOString();
  applicants.set(applicantId, applicant);
}

function maybeIncrementApplicantLoad(applicantId) {
  if (!applicantId) {
    return { ok: true };
  }

  const applicant = applicants.get(applicantId);
  if (!applicant) {
    return { ok: false, status: 404, error: "Applicant profile not found for deal." };
  }

  if (applicant.capacity.currentActiveDeals >= applicant.capacity.maxConcurrentDeals) {
    return {
      ok: false,
      status: 409,
      error: "Applicant is at capacity; increase maxConcurrentDeals or complete active deals first.",
    };
  }

  applicant.capacity.currentActiveDeals += 1;
  applicant.updatedAt = new Date().toISOString();
  applicants.set(applicantId, applicant);
  return { ok: true };
}

function releaseDeal(deal, role, reason = "") {
  const now = new Date().toISOString();
  const releasePercent = deal.payoutMode === "split_release" ? clamp(deal.splitReleasePercent, 10, 100) : 100;
  const releasedAmount = formatMoney((deal.applicantPayout * releasePercent) / 100);
  const pendingAmount = formatMoney(deal.applicantPayout - releasedAmount);

  deal.releasedAmount = releasedAmount;
  deal.pendingAmount = pendingAmount;
  deal.releasedAt = now;
  deal.updatedAt = now;
  deal.status = pendingAmount > 0 ? "partially_released_to_applicant" : "released_to_applicant";
  deal.auditTrail.push({
    at: now,
    role,
    event: "payout_release_authorized",
    note: reason || "",
  });

  decrementApplicantLoad(deal.applicantId);
}

function buildDealResponse(deal, options = {}) {
  const { includeReleaseToken = false } = options;
  const escrowStatus = deal.status.includes("released")
    ? deal.pendingAmount > 0
      ? "partially_released"
      : "released"
    : "funded";
  const response = {
    deal: {
      id: deal.id,
      businessId: deal.businessId,
      businessName: deal.businessName,
      clientName: deal.clientName,
      applicantId: deal.applicantId,
      applicantName: deal.applicantName,
      proposalText: deal.proposalText,
      feeRatePercent: deal.feeRatePercent,
      status: deal.status,
      payoutMode: deal.payoutMode,
      splitReleasePercent: deal.splitReleasePercent,
      createdAt: deal.createdAt,
      releasedAt: deal.releasedAt,
      updatedAt: deal.updatedAt,
    },
    payout: {
      totalAmount: deal.dealValue,
      platformFee: deal.platformFee,
      applicantPayout: deal.applicantPayout,
      releasedAmount: deal.releasedAmount,
      pendingAmount: deal.pendingAmount,
      escrowStatus,
      autoReleaseEnabled: true,
    },
    security: {
      requiredApproverRole: "client_approver",
      fallbackApproverRole: "platform_admin",
      escrowProtection: "enabled",
      releaseTokenRequired: true,
      releaseTokenHint: tokenHint(deal.releaseToken),
    },
  };

  if (includeReleaseToken) {
    response.security.releaseToken = deal.releaseToken;
  }

  return response;
}

function sanitizeRoomTopic(value) {
  return (value || "")
    .toString()
    .trim()
    .slice(0, 120);
}

function normalizeCurriculumTracks(inputTracks) {
  if (!inputTracks) {
    return curriculumTracks.slice(0, 4);
  }
  const tracks = Array.isArray(inputTracks)
    ? inputTracks
    : inputTracks
        .toString()
        .split(",")
        .map((track) => track.trim());
  const uniqueTracks = [...new Set(tracks.filter(Boolean))];
  return uniqueTracks.length ? uniqueTracks : curriculumTracks.slice(0, 4);
}

function normalizePlatformRevenueSharePercent(value) {
  return clamp(safeNumber(value, 37), 35, 40);
}

const courseLoadProfiles = {
  foundation: {
    expectedSessionMinutes: 60,
    tutoringIntervalMinutes: 12,
    estimatedArppuUsd: 2.8,
    engagementMultiplier: 1.0,
  },
  standard: {
    expectedSessionMinutes: 90,
    tutoringIntervalMinutes: 15,
    estimatedArppuUsd: 3.9,
    engagementMultiplier: 1.08,
  },
  advanced: {
    expectedSessionMinutes: 120,
    tutoringIntervalMinutes: 20,
    estimatedArppuUsd: 4.9,
    engagementMultiplier: 1.15,
  },
  intensive: {
    expectedSessionMinutes: 150,
    tutoringIntervalMinutes: 25,
    estimatedArppuUsd: 5.8,
    engagementMultiplier: 1.24,
  },
  marathon: {
    expectedSessionMinutes: 180,
    tutoringIntervalMinutes: 30,
    estimatedArppuUsd: 6.6,
    engagementMultiplier: 1.32,
  },
};

function normalizeCourseLoad(value) {
  const normalized = (value || "standard").toString().trim().toLowerCase();
  return courseLoadProfiles[normalized] ? normalized : "standard";
}

function normalizeSessionCapacity(value) {
  return clamp(Math.round(safeNumber(value, 1200)), 50, 25000);
}

function deriveStreamingAutoPlan(body, tracks) {
  const courseLoad = normalizeCourseLoad(body.courseLoad);
  const profile = courseLoadProfiles[courseLoad];
  const sessionCapacity = normalizeSessionCapacity(body.sessionCapacity ?? body.expectedAudience);
  const fillRatePercent = clamp(
    safeNumber(body.expectedFillRatePercent, 62),
    15,
    100
  );
  const expectedSessionMinutes = clamp(
    safeNumber(
      body.expectedSessionMinutes ??
        body.estimatedTeachingMinutes ??
        body.intervalMinutes ??
        profile.expectedSessionMinutes,
      profile.expectedSessionMinutes
    ),
    15,
    480
  );
  const tutoringIntervalMinutes = clamp(
    safeNumber(
      body.tutoringIntervalMinutes ??
        body.breakBetweenRoundsMinutes ??
        body.startDelayMinutes ??
        profile.tutoringIntervalMinutes,
      profile.tutoringIntervalMinutes
    ),
    5,
    90
  );
  const trackComplexityBoost = 1 + Math.max(0, tracks.length - 3) * 0.03;
  const projectedActiveAttenders = Math.max(
    1,
    Math.round((sessionCapacity * fillRatePercent) / 100)
  );
  const estimatedArppuUsd = formatMoney(
    Math.max(
      0.5,
      safeNumber(body.estimatedArppuUsd, profile.estimatedArppuUsd) *
        profile.engagementMultiplier *
        trackComplexityBoost
    )
  );
  const estimatedGrossRevenueUsd = formatMoney(
    projectedActiveAttenders * estimatedArppuUsd
  );

  return {
    autoScalingEnabled: body.autoScalingEnabled !== false,
    courseLoad,
    sessionCapacity,
    fillRatePercent: formatMoney(fillRatePercent),
    expectedSessionMinutes,
    tutoringIntervalMinutes,
    projectedActiveAttenders,
    estimatedArppuUsd,
    estimatedGrossRevenueUsd,
  };
}

function buildStreamingAiHost(hostName, tracks) {
  return {
    displayName: hostName || "CCWEB AI Host",
    capabilitySummary:
      "Multilingual AI host capable to tutor all CCWEB curriculum tracks with adaptive live explanations.",
    curriculumCoverage: tracks,
  };
}

function buildStreamRoomResponse(room) {
  const lkUrl = (process.env.LIVEKIT_URL || process.env.LIVEKIT_WS_URL || "").toString().trim();
  const streamingMode = lkUrl ? "livekit-webstream" : "ccweb_sse";
  return {
    id: room.id,
    roomName: room.roomName,
    city: room.city,
    region: room.region,
    topic: room.topic,
    createdBy: room.createdBy,
    status: room.status,
    streamingMode,
    learningChannelUrl: `/api/learning/sessions/${room.id}/channel`,
    learningEventsUrl: `/api/learning/sessions/${room.id}/events`,
    hourlyParticipationUsd: room.hourlyParticipationUsd != null ? Number(room.hourlyParticipationUsd) : undefined,
    livekit: lkUrl
      ? {
          wsUrl: lkUrl,
          token: room.livekitToken,
          roomSidHint: room.roomSidHint,
        }
      : null,
    aiHost: room.aiHost,
    tutoringSchedule: room.tutoringSchedule,
    finishedAt: room.finishedAt || null,
    monetization: {
      mode: room.monetizationMode,
      platformRevenueSharePercent: room.platformRevenueSharePercent,
      creatorRevenueSharePercent: room.creatorRevenueSharePercent,
      autoScalingEnabled: room.autoPlan?.autoScalingEnabled ?? true,
      autoCourseLoad: room.autoPlan?.courseLoad || "standard",
      autoSessionCapacity: room.autoPlan?.sessionCapacity || 0,
      autoCapacityFillRatePercent: room.autoPlan?.fillRatePercent || 0,
      autoProjectedAttenders: room.autoPlan?.projectedActiveAttenders || 0,
      autoEstimatedArppuUsd: room.autoPlan?.estimatedArppuUsd || 0,
      autoEstimatedGrossRevenueUsd: room.autoPlan?.estimatedGrossRevenueUsd || 0,
      autoCapacityUtilizationPercent: room.autoPlan?.fillRatePercent || 0,
      organicDistributionModel: "watch_time_and_participation_weighted",
      target: "organic_revenue_youtube_like",
    },
    configuration: {
      courseLoad: room.autoPlan?.courseLoad || "standard",
      sessionCapacity: room.autoPlan?.sessionCapacity || 0,
      expectedAudience: room.autoPlan?.projectedActiveAttenders || 0,
      estimatedArppuUsd: room.autoPlan?.estimatedArppuUsd || 0,
    },
    metrics: room.metrics,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
  };
}

function createRoomFromPayload(body) {
  const roomName = (body.roomName || "").toString().trim();
  const city = (body.city || "").toString().trim() || "Global";
  const region = (body.region || "").toString().trim() || "Worldwide";
  const topic = sanitizeRoomTopic(body.topic || "AI + Web3 live tutorial");
  const createdBy = (body.createdBy || "ccweb-studio").toString().trim();
  const tracks = normalizeCurriculumTracks(body.curriculumTracks);
  const platformRevenueSharePercent = normalizePlatformRevenueSharePercent(
    body.platformRevenueSharePercent
  );
  const creatorRevenueSharePercent = formatMoney(100 - platformRevenueSharePercent);
  const now = new Date().toISOString();
  const autoPlan = deriveStreamingAutoPlan(body, tracks);
  const expectedSessionMinutes = autoPlan.expectedSessionMinutes;
  const tutoringIntervalMinutes = autoPlan.tutoringIntervalMinutes;
  const estimatedEndAt = new Date(Date.parse(now) + expectedSessionMinutes * 60 * 1000).toISOString();

  if (!roomName) {
    return {
      error: "roomName is required.",
      status: 400,
    };
  }

  const id = `stream-${String(nextStreamRoomId++).padStart(4, "0")}`;
  const livekitToken = generateLivekitToken();
  const lkUrl = (process.env.LIVEKIT_URL || process.env.LIVEKIT_WS_URL || "").toString().trim();
  const hourlyParticipationUsd = Math.max(0, safeNumber(body.hourlyParticipationUsd, Number(process.env.CCWEB_LEARNING_HOURLY_USD || 4.99)));
  const room = {
    id,
    roomName,
    city,
    region,
    topic,
    createdBy,
    status: "live",
    finishedAt: null,
    livekitWsUrl: lkUrl || null,
    livekitToken,
    roomSidHint: `${id}-lk`,
    hourlyParticipationUsd,
    aiHost: buildStreamingAiHost((body.aiHostName || "").toString().trim(), tracks),
    autoPlan,
    tutoringSchedule: {
      startedAt: now,
      estimatedEndAt,
      expectedSessionMinutes,
      tutoringIntervalMinutes,
      estimatedSegments: Math.max(1, Math.ceil(expectedSessionMinutes / tutoringIntervalMinutes)),
      curriculumFields: tracks,
    },
    monetizationMode: "organic_revenue_share",
    platformRevenueSharePercent,
    creatorRevenueSharePercent,
    metrics: {
      concurrentViewers: autoPlan.projectedActiveAttenders,
      avgWatchMinutes: 0,
      engagementRatePercent: 0,
      estimatedOrganicRevenueUsd: autoPlan.estimatedGrossRevenueUsd,
    },
    createdAt: now,
    updatedAt: now,
  };

  streamRooms.set(id, room);
  return { room };
}

function buildStreamingPayoutResponse(payout) {
  return {
    id: payout.id,
    roomId: payout.roomId,
    periodLabel: payout.periodLabel,
    grossRevenueUsd: payout.grossRevenueUsd,
    platformRevenueUsd: payout.platformRevenueUsd,
    creatorRevenueUsd: payout.creatorRevenueUsd,
    platformRevenueSharePercent: payout.platformRevenueSharePercent,
    creatorRevenueSharePercent: payout.creatorRevenueSharePercent,
    payoutStatus: payout.payoutStatus,
    payoutMethod: payout.payoutMethod,
    createdAt: payout.createdAt,
  };
}

async function handleCreateStreamRoom(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }

  const out = await createStreamingSessionForDeveloperApi(body);
  if (out.error) {
    sendJson(res, out.status || 400, { error: out.error });
    return;
  }
  sendJson(res, 201, out.room);
}

function handleListStreamRooms(res) {
  const rooms = Array.from(streamRooms.values()).map(buildStreamRoomResponse);
  sendJson(res, 200, { count: rooms.length, rooms });
}

function handleGetStreamRoom(roomId, res) {
  const room = streamRooms.get(roomId);
  if (!room) {
    sendJson(res, 404, { error: "Streaming room not found." });
    return;
  }
  sendJson(res, 200, buildStreamRoomResponse(room));
}

async function handleCreateStreamPayout(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }

  const roomId = (body.roomId || "").toString().trim();
  const room = streamRooms.get(roomId);
  if (!room) {
    sendJson(res, 404, { error: "Streaming room not found for payout." });
    return;
  }

  const grossRevenueUsd = Math.max(0, safeNumber(body.grossRevenueUsd, 0));
  if (grossRevenueUsd <= 0) {
    sendJson(res, 400, { error: "grossRevenueUsd must be greater than 0." });
    return;
  }

  const platformRevenueSharePercent = normalizePlatformRevenueSharePercent(
    body.platformRevenueSharePercent ?? room.platformRevenueSharePercent
  );
  const creatorRevenueSharePercent = formatMoney(100 - platformRevenueSharePercent);
  const platformRevenueUsd = formatMoney((grossRevenueUsd * platformRevenueSharePercent) / 100);
  const creatorRevenueUsd = formatMoney(grossRevenueUsd - platformRevenueUsd);
  const id = `stream-pay-${String(nextStreamPayoutId++).padStart(4, "0")}`;
  const payout = {
    id,
    roomId,
    periodLabel: (body.periodLabel || "Current live session").toString().trim(),
    grossRevenueUsd: formatMoney(grossRevenueUsd),
    platformRevenueUsd,
    creatorRevenueUsd,
    platformRevenueSharePercent,
    creatorRevenueSharePercent,
    payoutStatus: "scheduled",
    payoutMethod: "ccweb-settlement-ledger",
    createdAt: new Date().toISOString(),
  };

  const distribution = distributeAndNotifyForPayout(room, payout);
  payout.payoutStatus = distribution.recipientCount > 0 ? "distributed_to_organic_users" : "pending_organic_distribution";
  streamPayouts.set(id, payout);
  sendJson(res, 201, {
    ...buildStreamingPayoutResponse(payout),
    distribution: buildDistributionResponse(distribution),
  });
}

function handleListStreamPayouts(requestUrl, res) {
  const roomIdFilter = (requestUrl.searchParams.get("roomId") || "").trim();
  const payouts = Array.from(streamPayouts.values())
    .filter((payout) => (roomIdFilter ? payout.roomId === roomIdFilter : true))
    .map(buildStreamingPayoutResponse);
  sendJson(res, 200, { count: payouts.length, payouts });
}

async function handleCreateDeal(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }

  const businessId = (body.businessId || "").toString().trim();
  const business = businessId ? findBusinessById(businessId) : null;
  const applicantId = (body.applicantId || "").toString().trim() || null;
  const applicantProfile = applicantId ? applicants.get(applicantId) : null;
  const clientName = (body.clientName || "").toString().trim();
  const applicantName = (
    body.applicantName ||
    applicantProfile?.fullName ||
    ""
  ).toString().trim();
  const proposalText = (body.proposalText || "").toString().trim();
  const dealValue = safeNumber(body.amount ?? body.dealValue, 0);
  const payoutMode = body.payoutMode === "split_release" ? "split_release" : "single_release";
  const splitReleasePercent = payoutMode === "split_release" ? clamp(safeNumber(body.splitReleasePercent, 70), 10, 100) : 100;

  if (!clientName || !applicantName || !proposalText || dealValue <= 0) {
    sendJson(res, 400, {
      error: "clientName, applicantName, proposalText and positive dealValue are required.",
    });
    return;
  }

  const loadResult = maybeIncrementApplicantLoad(applicantId);
  if (!loadResult.ok) {
    sendJson(res, loadResult.status, { error: loadResult.error });
    return;
  }

  const platformFee = formatMoney(dealValue * PLATFORM_FEE_RATE);
  const applicantPayout = formatMoney(dealValue - platformFee);
  const id = String(nextDealId++);
  const now = new Date().toISOString();
  const releaseToken = generateReleaseToken();

  const deal = {
    id,
    businessId: businessId || null,
    businessName: business?.name || (body.businessName || "Unknown business"),
    clientName,
    applicantId,
    applicantName,
    proposalText,
    dealValue: formatMoney(dealValue),
    platformFee,
    applicantPayout,
    releasedAmount: 0,
    pendingAmount: applicantPayout,
    feeRatePercent: PLATFORM_FEE_RATE * 100,
    status: "funded_in_ccweb_escrow",
    payoutMode,
    splitReleasePercent,
    createdAt: now,
    releasedAt: null,
    updatedAt: now,
    releaseToken,
    auditTrail: [
      { at: now, role: "system", event: "deal_created_in_escrow", note: "Client funded CCWEB escrow." },
    ],
  };

  deals.set(id, deal);
  sendJson(res, 201, buildDealResponse(deal, { includeReleaseToken: true }));
}

async function handleConfirmDeal(urlPath, req, res) {
  const match = urlPath.match(/^\/api\/deals\/([^/]+)\/confirm$/);
  if (!match) {
    sendJson(res, 404, { error: "Deal route not found." });
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }

  const dealId = match[1];
  const deal = deals.get(dealId);

  if (!deal) {
    sendJson(res, 404, { error: "Deal not found." });
    return;
  }

  if (deal.status.includes("released")) {
    sendJson(res, 200, buildDealResponse(deal));
    return;
  }

  const paymentRole = (body.paymentRole || "").toString().trim();
  if (paymentRole !== "client_approver" && paymentRole !== "platform_admin") {
    sendJson(res, 403, {
      error: "paymentRole must be client_approver or platform_admin.",
    });
    return;
  }

  if (paymentRole === "client_approver") {
    const confirmed = body.clientConfirmed === true || body.clientConfirmed === "true";
    if (!confirmed) {
      sendJson(res, 400, { error: "clientConfirmed must be true for client_approver release." });
      return;
    }

    const providedToken = (body.releaseToken || "").toString().trim();
    if (!providedToken || providedToken !== deal.releaseToken) {
      sendJson(res, 403, {
        error: "Invalid release token for secure payout release.",
      });
      return;
    }
  }

  if (paymentRole === "platform_admin" && !(body.adminOverrideReason || "").toString().trim()) {
    sendJson(res, 400, {
      error: "adminOverrideReason is required for platform_admin release.",
    });
    return;
  }

  releaseDeal(deal, paymentRole, (body.adminOverrideReason || "").toString().trim());
  deals.set(dealId, deal);
  sendJson(res, 200, buildDealResponse(deal));
}

function handleGetDeal(urlPath, res) {
  const match = urlPath.match(/^\/api\/deals\/([^/]+)$/);
  if (!match) {
    sendJson(res, 404, { error: "Deal route not found." });
    return;
  }

  const deal = deals.get(match[1]);
  if (!deal) {
    sendJson(res, 404, { error: "Deal not found." });
    return;
  }

  sendJson(res, 200, buildDealResponse(deal));
}

function seedUsers() {
  ensureUser("ccweb-stream-studio", {
    displayName: "CCWEB Stream Studio",
    isOrganic: false,
    roles: ["stream_creator", "platform_admin"],
  });
  ensureUser("user-organic-001", {
    displayName: "Maya Organic Learner",
    isOrganic: true,
    roles: ["member", "organic_attender"],
  });
  ensureUser("user-organic-002", {
    displayName: "Idris Organic Builder",
    isOrganic: true,
    roles: ["member", "organic_attender"],
  });
  ensureUser("user-pro-001", {
    displayName: "Nora Pro Publisher",
    isOrganic: false,
    roles: ["member", "creator"],
  });
}

seedUsers();
seedApplicants();
developerPlatform.ensureDefaultProject();

const DAPP_TEMPLATES = [
  {
    id: "erc20",
    name: "ERC-20 Token",
    description: "Standard fungible token contract with mint, burn, and transfer capabilities.",
    category: "Token",
    networks: ["ethereum", "polygon", "bnb"],
    baseFeeUsd: 25,
    estimatedGas: "1,200,000",
    features: ["Mintable", "Burnable", "Pausable", "Access Control"],
  },
  {
    id: "erc721",
    name: "NFT Collection (ERC-721)",
    description: "Non-fungible token contract with metadata, royalties, and marketplace integration.",
    category: "NFT",
    networks: ["ethereum", "polygon", "bnb"],
    baseFeeUsd: 35,
    estimatedGas: "2,100,000",
    features: ["Metadata URI", "Royalties (EIP-2981)", "Enumerable", "Batch Mint"],
  },
  {
    id: "erc1155",
    name: "Multi-Token (ERC-1155)",
    description: "Semi-fungible token supporting both fungible and non-fungible assets in one contract.",
    category: "NFT",
    networks: ["ethereum", "polygon", "bnb"],
    baseFeeUsd: 40,
    estimatedGas: "2,500,000",
    features: ["Batch Operations", "URI per Token", "Supply Tracking", "Royalties"],
  },
  {
    id: "dao",
    name: "DAO Governance",
    description: "Decentralized governance contract with proposal creation, voting, and execution.",
    category: "Governance",
    networks: ["ethereum", "polygon"],
    baseFeeUsd: 50,
    estimatedGas: "3,400,000",
    features: ["Proposal System", "Weighted Voting", "Timelock", "Quorum Rules"],
  },
  {
    id: "staking",
    name: "Staking Vault",
    description: "Stake tokens and earn yield with configurable lock periods and reward distribution.",
    category: "DeFi",
    networks: ["ethereum", "polygon", "bnb"],
    baseFeeUsd: 30,
    estimatedGas: "1,800,000",
    features: ["Flexible Lock Periods", "Auto-compound", "Emergency Withdraw", "Reward Distribution"],
  },
  {
    id: "marketplace",
    name: "NFT Marketplace",
    description: "Decentralized marketplace for buying, selling, and auctioning NFTs with escrow.",
    category: "Marketplace",
    networks: ["ethereum", "polygon", "bnb"],
    baseFeeUsd: 60,
    estimatedGas: "4,200,000",
    features: ["Fixed Price Listings", "English Auctions", "Escrow", "Platform Fees"],
  },
  {
    id: "spl-token",
    name: "SPL Token (Solana)",
    description: "Solana Program Library token with mint authority and freeze capabilities.",
    category: "Token",
    networks: ["solana"],
    baseFeeUsd: 15,
    estimatedGas: "N/A (rent-exempt)",
    features: ["Mint Authority", "Freeze Authority", "Decimals Config", "Metadata"],
  },
  {
    id: "solana-nft",
    name: "Solana NFT (Metaplex)",
    description: "Solana NFT using Metaplex standard with candy machine deployment.",
    category: "NFT",
    networks: ["solana"],
    baseFeeUsd: 20,
    estimatedGas: "N/A (rent-exempt)",
    features: ["Metaplex Standard", "Candy Machine", "Royalty Enforcement", "Collection Verification"],
  },
];

const TOKEN_PRICES = {
  ETH: { usd: 3245.67, symbol: "ETH", network: "ethereum", decimals: 18 },
  MATIC: { usd: 0.72, symbol: "MATIC", network: "polygon", decimals: 18 },
  USDC: { usd: 1.0, symbol: "USDC", network: "ethereum", decimals: 6 },
  BNB: { usd: 612.34, symbol: "BNB", network: "bnb", decimals: 18 },
  SOL: { usd: 178.92, symbol: "SOL", network: "solana", decimals: 9 },
};

const SUPPORTED_NETWORKS = [
  { id: "ethereum", name: "Ethereum Mainnet", chainId: 1, explorer: "https://etherscan.io", wallet: "metamask" },
  { id: "polygon", name: "Polygon", chainId: 137, explorer: "https://polygonscan.com", wallet: "metamask" },
  { id: "bnb", name: "BNB Chain", chainId: 56, explorer: "https://bscscan.com", wallet: "metamask" },
  { id: "solana", name: "Solana", chainId: null, explorer: "https://solscan.io", wallet: "phantom" },
];

function recordTransaction(type, data) {
  const id = `tx-${String(nextDappTransactionId++).padStart(5, "0")}`;
  const now = new Date().toISOString();
  const tx = { id, type, ...data, createdAt: now };
  dappTransactions.set(id, tx);
  return tx;
}

/**
 * Shared DApp deployment (HTTP + Public API). Returns deployment object.
 * @param {object} body
 * @param {string} [ccwebProjectId]
 */
async function runDappDeployCore(body, ccwebProjectId) {
  const {
    templateId,
    network,
    paymentToken,
    contractName,
    contractSymbol,
    walletAddress,
    parameters,
    idempotencyKey,
  } = body || {};

  if (idempotencyKey) {
    const existing = processedIdempotencyKeys.get(idempotencyKey);
    if (existing) {
      return { ...existing, _idempotent: true };
    }
  }

  if (!templateId) throw Object.assign(new Error("templateId is required."), { status: 400 });
  if (!network) throw Object.assign(new Error("network is required."), { status: 400 });
  if (!paymentToken) throw Object.assign(new Error("paymentToken is required."), { status: 400 });
  if (!walletAddress) throw Object.assign(new Error("walletAddress is required."), { status: 400 });
  if (network === "solana") {
    const s = walletAddress.trim();
    if (s.startsWith("0x")) {
      throw Object.assign(new Error("Use a Solana-style address for Solana deployments, not an EVM 0x address."), {
        status: 400,
      });
    }
    if (s.length < 8) {
      throw Object.assign(new Error("walletAddress is too short for Solana."), { status: 400 });
    }
  } else if (!isValidEvmAddress(walletAddress)) {
    throw Object.assign(new Error("walletAddress must be a valid EVM address (0x…) for this network."), { status: 400 });
  }

  const template = DAPP_TEMPLATES.find((t) => t.id === templateId);
  if (!template) throw Object.assign(new Error(`Template '${templateId}' not found.`), { status: 404 });
  if (!template.networks.includes(network)) {
    throw Object.assign(new Error(`Template '${templateId}' does not support network '${network}'.`), { status: 400 });
  }

  const tokenUpper = paymentToken.toUpperCase();
  if (!TOKEN_PRICES[tokenUpper]) {
    throw Object.assign(new Error(`Unsupported payment token '${paymentToken}'.`), { status: 400 });
  }

  const price = TOKEN_PRICES[tokenUpper];
  const feeUsd = template.baseFeeUsd;
  const feeInToken = formatMoney(feeUsd / price.usd);

  const deploymentId = `deploy-${String(nextDappDeploymentId++).padStart(4, "0")}`;
  const paymentId = `pay-${String(nextDappPaymentId++).padStart(4, "0")}`;
  const txHash = `0x${crypto.randomBytes(32).toString("hex")}`;
  const contractAddress = `0x${crypto.randomBytes(20).toString("hex")}`;
  const now = new Date().toISOString();

  const payment = {
    id: paymentId,
    deploymentId,
    token: tokenUpper,
    network: price.network,
    amountToken: feeInToken,
    amountUsd: feeUsd,
    priceAtTime: price.usd,
    walletAddress,
    txHash,
    status: "confirmed",
    confirmedAt: now,
  };
  dappPayments.set(paymentId, payment);

  const deployment = {
    id: deploymentId,
    ccwebProjectId: ccwebProjectId || null,
    templateId,
    templateName: template.name,
    category: template.category,
    network,
    contractName: contractName || template.name,
    contractSymbol: contractSymbol || templateId.toUpperCase(),
    contractAddress,
    walletAddress,
    parameters: parameters || {},
    payment,
    status: "deployed",
    deployedAt: now,
    explorerUrl: `${SUPPORTED_NETWORKS.find((n) => n.id === network)?.explorer || ""}/address/${contractAddress}`,
    features: template.features,
    estimatedGas: template.estimatedGas,
  };
  dappDeployments.set(deploymentId, deployment);

  recordTransaction("payment", {
    deploymentId,
    paymentId,
    token: tokenUpper,
    amountToken: feeInToken,
    amountUsd: feeUsd,
    walletAddress,
    txHash,
    network,
    status: "confirmed",
    description: `Payment for ${template.name} deployment`,
  });
  recordTransaction("deployment", {
    deploymentId,
    templateId,
    templateName: template.name,
    contractAddress,
    network,
    walletAddress,
    status: "deployed",
    description: `Deployed ${contractName || template.name} to ${network}`,
  });

  if (idempotencyKey) {
    processedIdempotencyKeys.set(idempotencyKey, deployment);
  }

  return deployment;
}

function handleDappTemplates(res) {
  sendJson(res, 200, { count: DAPP_TEMPLATES.length, templates: DAPP_TEMPLATES });
}

function handleDappNetworks(res) {
  sendJson(res, 200, { networks: SUPPORTED_NETWORKS });
}

function handleDappPriceOracle(requestUrl, res) {
  const token = (requestUrl.searchParams.get("token") || "").toUpperCase();
  const amountUsd = safeNumber(requestUrl.searchParams.get("amountUsd"), 0);

  if (token && TOKEN_PRICES[token]) {
    const price = TOKEN_PRICES[token];
    const tokenAmount = amountUsd > 0 ? formatMoney(amountUsd / price.usd) : null;
    sendJson(res, 200, { token, priceUsd: price.usd, amountUsd, tokenAmount, network: price.network, decimals: price.decimals, updatedAt: new Date().toISOString() });
    return;
  }

  const allPrices = {};
  for (const [sym, info] of Object.entries(TOKEN_PRICES)) {
    allPrices[sym] = { priceUsd: info.usd, network: info.network, tokenAmount: amountUsd > 0 ? formatMoney(amountUsd / info.usd) : null };
  }
  sendJson(res, 200, { prices: allPrices, amountUsd, updatedAt: new Date().toISOString() });
}

async function handleDappDeploy(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }

  try {
    const deployment = await runDappDeployCore(body);
    const code = deployment._idempotent ? 200 : 201;
    sendJson(res, code, deployment);
  } catch (e) {
    const code = e.status || 400;
    sendJson(res, code, { error: e.message || "Deploy failed." });
  }
}

function handleDappDeployments(requestUrl, res) {
  const wallet = requestUrl.searchParams.get("wallet");
  const status = requestUrl.searchParams.get("status");
  const network = requestUrl.searchParams.get("network");
  let results = [...dappDeployments.values()];
  if (wallet) {
    results = results.filter((d) => d.walletAddress.toLowerCase() === wallet.toLowerCase());
  }
  if (status) {
    results = results.filter((d) => d.status === status);
  }
  if (network) {
    results = results.filter((d) => d.network === network);
  }
  results.sort((a, b) => new Date(b.deployedAt) - new Date(a.deployedAt));
  sendJson(res, 200, { count: results.length, deployments: results });
}

function handleDappDeploymentById(deploymentId, res) {
  const deployment = dappDeployments.get(deploymentId);
  if (!deployment) { sendJson(res, 404, { error: "Deployment not found." }); return; }
  sendJson(res, 200, deployment);
}

function handleDappTransactions(requestUrl, res) {
  const wallet = requestUrl.searchParams.get("wallet");
  const type = requestUrl.searchParams.get("type");
  const limit = Math.min(100, Math.max(1, safeNumber(requestUrl.searchParams.get("limit"), 50)));
  const offset = Math.max(0, safeNumber(requestUrl.searchParams.get("offset"), 0));
  let results = [...dappTransactions.values()];
  if (wallet) {
    results = results.filter((t) => t.walletAddress && t.walletAddress.toLowerCase() === wallet.toLowerCase());
  }
  if (type) {
    results = results.filter((t) => t.type === type);
  }
  results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const total = results.length;
  results = results.slice(offset, offset + limit);
  sendJson(res, 200, { total, count: results.length, offset, limit, transactions: results });
}

function handleDappDashboardStats(requestUrl, res) {
  const wallet = requestUrl.searchParams.get("wallet");
  let deployments = [...dappDeployments.values()];
  let payments = [...dappPayments.values()];
  let transactions = [...dappTransactions.values()];

  if (wallet) {
    deployments = deployments.filter((d) => d.walletAddress.toLowerCase() === wallet.toLowerCase());
    payments = payments.filter((p) => p.walletAddress.toLowerCase() === wallet.toLowerCase());
    transactions = transactions.filter((t) => t.walletAddress && t.walletAddress.toLowerCase() === wallet.toLowerCase());
  }

  const totalDeployments = deployments.length;
  const activeDeployments = deployments.filter((d) => d.status === "deployed").length;
  const failedDeployments = deployments.filter((d) => d.status === "failed").length;
  const totalSpentUsd = formatMoney(payments.reduce((sum, p) => sum + safeNumber(p.amountUsd, 0), 0));

  const networkBreakdown = {};
  deployments.forEach((d) => {
    networkBreakdown[d.network] = (networkBreakdown[d.network] || 0) + 1;
  });

  const templateBreakdown = {};
  deployments.forEach((d) => {
    templateBreakdown[d.templateName] = (templateBreakdown[d.templateName] || 0) + 1;
  });

  const tokenSpending = {};
  payments.forEach((p) => {
    if (!tokenSpending[p.token]) {
      tokenSpending[p.token] = { totalAmount: 0, totalUsd: 0, count: 0 };
    }
    tokenSpending[p.token].totalAmount = formatMoney(tokenSpending[p.token].totalAmount + safeNumber(p.amountToken, 0));
    tokenSpending[p.token].totalUsd = formatMoney(tokenSpending[p.token].totalUsd + safeNumber(p.amountUsd, 0));
    tokenSpending[p.token].count += 1;
  });

  const recentDeployments = deployments.sort((a, b) => new Date(b.deployedAt) - new Date(a.deployedAt)).slice(0, 5).map((d) => ({
    id: d.id, contractName: d.contractName, network: d.network, status: d.status,
    contractAddress: d.contractAddress, templateName: d.templateName, deployedAt: d.deployedAt,
    payment: { token: d.payment.token, amountToken: d.payment.amountToken, amountUsd: d.payment.amountUsd },
  }));

  sendJson(res, 200, {
    overview: { totalDeployments, activeDeployments, failedDeployments, totalSpentUsd, totalTransactions: transactions.length },
    networkBreakdown,
    templateBreakdown,
    tokenSpending,
    recentDeployments,
    updatedAt: new Date().toISOString(),
  });
}

async function handleDappVerifyPayment(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }

  const { txHash, deploymentId } = body;
  if (!txHash && !deploymentId) { sendJson(res, 400, { error: "txHash or deploymentId is required." }); return; }

  if (deploymentId) {
    const deployment = dappDeployments.get(deploymentId);
    if (!deployment) { sendJson(res, 404, { error: "Deployment not found." }); return; }
    sendJson(res, 200, { verified: true, payment: deployment.payment, deployment: { id: deployment.id, status: deployment.status, contractAddress: deployment.contractAddress } });
    return;
  }

  const payment = [...dappPayments.values()].find((p) => p.txHash === txHash);
  if (!payment) { sendJson(res, 404, { error: "Payment not found for given txHash." }); return; }
  sendJson(res, 200, { verified: true, payment });
}

async function handleDappRetryDeployment(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }

  const { deploymentId } = body;
  if (!deploymentId) { sendJson(res, 400, { error: "deploymentId is required." }); return; }

  const deployment = dappDeployments.get(deploymentId);
  if (!deployment) { sendJson(res, 404, { error: "Deployment not found." }); return; }
  if (deployment.status === "deployed") { sendJson(res, 400, { error: "Deployment already succeeded. No retry needed." }); return; }

  const now = new Date().toISOString();
  const newContractAddress = `0x${crypto.randomBytes(20).toString("hex")}`;
  const newTxHash = `0x${crypto.randomBytes(32).toString("hex")}`;

  deployment.status = "deployed";
  deployment.contractAddress = newContractAddress;
  deployment.deployedAt = now;
  deployment.explorerUrl = `${SUPPORTED_NETWORKS.find((n) => n.id === deployment.network)?.explorer || ""}/address/${newContractAddress}`;
  deployment.payment.txHash = newTxHash;
  deployment.payment.status = "confirmed";
  deployment.payment.confirmedAt = now;
  deployment.retriedAt = now;
  dappDeployments.set(deploymentId, deployment);

  recordTransaction("retry", { deploymentId, contractAddress: newContractAddress, network: deployment.network, walletAddress: deployment.walletAddress, txHash: newTxHash, status: "confirmed", description: `Retried deployment of ${deployment.contractName}` });

  sendJson(res, 200, deployment);
}

// ─── FIND Pillar: Crypto Safety Scanner, Alpha Engine, On-chain Intel ───

function handleCryptoScan(requestUrl, res) {
  const token = (requestUrl.searchParams.get("token") || "").toUpperCase().trim();
  const address = (requestUrl.searchParams.get("address") || "").trim();

  if (!token && !address) {
    sendJson(res, 400, { error: "token or address query parameter is required." });
    return;
  }

  sendJson(res, 200, cryptoSafety.buildTokenScanFromQuery(token, address));
}

function handleEarlySignals(res) {
  const feed = cryptoSafety.getIntelligenceFeed();
  sendJson(res, 200, {
    count: feed.signals.length,
    signals: feed.signals,
    updatedAt: feed.updatedAt,
    disclaimer: feed.disclaimer,
  });
}

function handleSmartMoney(res) {
  const feed = cryptoSafety.getIntelligenceFeed();
  sendJson(res, 200, {
    wallets: feed.smartMoney.wallets,
    trends: feed.smartMoney.trends,
    updatedAt: feed.updatedAt,
    disclaimer: feed.disclaimer,
  });
}

async function handleScanTokenPost(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }

  const token = (body.token || "").toUpperCase().trim();
  const address = (body.address || "").trim();
  if (!token && !address) {
    sendJson(res, 400, { error: "token or address is required in the JSON body." });
    return;
  }

  sendJson(res, 200, cryptoSafety.buildTokenScanFromQuery(token, address));
}

async function handleScanWalletPost(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }

  const address = body.address || body.wallet;
  const result = cryptoSafety.buildWalletScan(address);
  if (result.error) {
    sendJson(res, 400, result);
    return;
  }
  sendJson(res, 200, result);
}

function handleScanWalletGet(requestUrl, res) {
  const address = requestUrl.searchParams.get("address") || requestUrl.searchParams.get("wallet");
  const result = cryptoSafety.buildWalletScan(address);
  if (result.error) {
    sendJson(res, 400, result);
    return;
  }
  sendJson(res, 200, result);
}

function handleDiscoverTokens(requestUrl, res) {
  const chain = requestUrl.searchParams.get("chain") || "";
  const minSignalStrength = requestUrl.searchParams.get("minSignalStrength");
  sendJson(res, 200, cryptoSafety.discoverTokens({ chain, minSignalStrength }));
}

async function handleTrackWallet(req, res) {
  let body = {};
  try {
    body = await readJsonBody(req);
  } catch {
    body = {};
  }

  const address = body.address || body.wallet;
  const action = body.action || "register";
  const result = await cryptoSafety.trackWallet(address, action, body);
  if (result.error) {
    sendJson(res, 400, result);
    return;
  }
  sendJson(res, 200, result);
}

function delegateAuth(req, res) {
  authApp(req, res, () => {
    sendJson(res, 404, { error: "Auth route not found." });
  });
}

function handleCryptoAlerts(res) {
  sendJson(res, 200, cryptoSafety.getAlertsSnapshot());
}

// ─── BUILD Pillar: AI Agents ───

function handleAiAgents(res) {
  const agents = [
    { id: "agent-001", name: "Research Loop Agent", description: "Continuously monitors crypto narratives, analyzes on-chain data, and produces daily intelligence briefs.", status: "active", tasksCompleted: 1247, category: "research", capabilities: ["On-chain analysis", "Social sentiment", "Narrative detection", "Report generation"] },
    { id: "agent-002", name: "DeFi Yield Optimizer", description: "Scans yield opportunities across chains, calculates risk-adjusted returns, and recommends optimal allocations.", status: "active", tasksCompleted: 892, category: "defi", capabilities: ["Yield farming", "Risk assessment", "Cross-chain", "Auto-rebalance"] },
    { id: "agent-003", name: "Content Automation Agent", description: "Generates educational content, quizzes, and summaries from live streaming sessions and course material.", status: "active", tasksCompleted: 3401, category: "content", capabilities: ["Content generation", "Quiz creation", "Session summaries", "Adaptive learning"] },
    { id: "agent-004", name: "Business Intelligence Agent", description: "Monitors competitor activity, tracks market trends, and generates actionable business insights.", status: "active", tasksCompleted: 567, category: "business", capabilities: ["Market monitoring", "Competitor analysis", "Trend reports", "Alert system"] },
    { id: "agent-005", name: "Workflow Operator", description: "Designs and executes automated workflows, connects tools and data sources, and optimizes operational efficiency.", status: "active", tasksCompleted: 2105, category: "operations", capabilities: ["Workflow design", "Tool integration", "Process automation", "Performance monitoring"] },
  ];
  sendJson(res, 200, { count: agents.length, agents });
}

function delegateIntelligence(req, res) {
  const origUrl = req.url || "/";
  const stripped = origUrl.startsWith("/api/intelligence")
    ? origUrl.slice("/api/intelligence".length) || "/"
    : origUrl;
  req.url = stripped;
  intelligenceApp(req, res, () => {
    req.url = origUrl;
    sendJson(res, 404, { error: "Intelligence route not found." });
  });
}

function delegateGrowth(req, res) {
  const origUrl = req.url || "/";
  const stripped = origUrl.startsWith("/api/growth") ? origUrl.slice("/api/growth".length) || "/" : origUrl;
  req.url = stripped;
  growthApp(req, res, () => {
    req.url = origUrl;
    sendJson(res, 404, { error: "Growth hub route not found." });
  });
}

function delegateSocial(req, res) {
  const origUrl = req.url || "/";
  const stripped = origUrl.startsWith("/api/social") ? origUrl.slice("/api/social".length) || "/" : origUrl;
  req.url = stripped;
  socialApp(req, res, () => {
    req.url = origUrl;
    sendJson(res, 404, { error: "Social route not found." });
  });
}

const developerApp = createDeveloperApp({
  streamRoomsGetter: () => Array.from(streamRooms.values()).map(buildStreamRoomResponse),
  createStreamingSession: createStreamingSessionForDeveloperApi,
  finishStreamingSession: finishStreamingSessionForDeveloperApi,
  dappTemplatesGetter: () => ({ count: DAPP_TEMPLATES.length, templates: DAPP_TEMPLATES }),
  dappDeployHandler: (body, projectId) => runDappDeployCore(body, projectId),
  listUsersForAdmin: () => Array.from(ccwebUsers.values()).map(sanitizeUser),
});

function delegateDeveloper(req, res) {
  developerApp(req, res, () => {
    sendJson(res, 404, { error: "Developer route not found." });
  });
}

const server = http.createServer(async (req, res) => {
  const reqStart = Date.now();
  res.on("finish", () => {
    logger.info({
      msg: "http_request",
      method: req.method,
      path: (req.url || "").split("?")[0],
      status: res.statusCode,
      durationMs: Date.now() - reqStart,
    });
  });

  if (!req.url) {
    sendJson(res, 400, { error: "Invalid request URL." });
    return;
  }

  const requestUrl = new URL(req.url, `http://localhost:${PORT}`);
  const { pathname } = requestUrl;

  if (
    (pathname.startsWith("/api") || pathname.startsWith("/v1")) &&
    pathname !== "/api/payments/stripe/webhook"
  ) {
    const rl = checkApiRateLimit(req);
    if (!rl.ok) {
      res.setHeader("Retry-After", String(rl.retryAfterSec));
      sendJson(res, 429, { error: "Too many requests", retryAfterSec: rl.retryAfterSec });
      return;
    }
  }

  if (pathname === "/api/payments/stripe/webhook" && req.method === "POST") {
    await handleStripeWebhook(req, res);
    return;
  }

  if (pathname === "/api/payments/stripe/checkout/escrow" && req.method === "POST") {
    await handleStripeCheckoutEscrow(req, res, readJsonBody, sendJson);
    return;
  }

  if (pathname === "/api/payments/stripe/checkout/learning" && req.method === "POST") {
    await handleLearningStripeCheckout(req, res, readJsonBody, sendJson);
    return;
  }

  if (pathname === "/api/learning/access/quote" && req.method === "GET") {
    handleLearningAccessQuote(requestUrl, res);
    return;
  }

  if (pathname === "/api/learning/me" && req.method === "GET") {
    await handleLearningMe(requestUrl, res);
    return;
  }

  if (pathname === "/api/learning/admin/analytics" && req.method === "GET") {
    await handleLearningAdminAnalytics(req, res);
    return;
  }

  if (pathname === "/api/learning/tutor/message" && req.method === "POST") {
    await handleLearningTutorMessage(req, res);
    return;
  }

  const learnSseMatch = pathname.match(/^\/api\/learning\/sessions\/([^/]+)\/events$/);
  if (learnSseMatch && req.method === "GET") {
    handleLearningSse(req, res, learnSseMatch[1]);
    return;
  }

  const learnChMatch = pathname.match(/^\/api\/learning\/sessions\/([^/]+)\/channel$/);
  if (learnChMatch && req.method === "GET") {
    handleLearningChannelGet(learnChMatch[1], res);
    return;
  }
  if (learnChMatch && req.method === "POST") {
    await handleLearningChannelPost(req, res, learnChMatch[1]);
    return;
  }

  const learnDetailMatch = pathname.match(/^\/api\/learning\/sessions\/([^/]+)\/detail$/);
  if (learnDetailMatch && req.method === "GET") {
    await handleLearningSessionDetail(learnDetailMatch[1], res);
    return;
  }

  if (pathname.startsWith("/api/intelligence") && ["GET", "POST", "DELETE", "OPTIONS"].includes(req.method || "GET")) {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      });
      res.end();
      return;
    }
    delegateIntelligence(req, res);
    return;
  }

  if (pathname.startsWith("/api/growth") && ["GET", "POST", "OPTIONS"].includes(req.method || "GET")) {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      });
      res.end();
      return;
    }
    delegateGrowth(req, res);
    return;
  }

  if (pathname.startsWith("/api/social") && ["GET", "POST", "OPTIONS"].includes(req.method || "GET")) {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      });
      res.end();
      return;
    }
    delegateSocial(req, res);
    return;
  }

  if (
    (pathname.startsWith("/v1") || pathname.startsWith("/api/developer")) &&
    ["GET", "POST", "DELETE", "PUT", "PATCH", "OPTIONS"].includes(req.method || "GET")
  ) {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, PUT, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, CCWEB-API-Key",
      });
      res.end();
      return;
    }
    delegateDeveloper(req, res);
    return;
  }

  if (
    (pathname.startsWith("/api/auth") || pathname.startsWith("/auth")) &&
    ["GET", "POST", "OPTIONS"].includes(req.method || "GET")
  ) {
    delegateAuth(req, res);
    return;
  }

  if (pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (pathname === "/api/maps-search" && req.method === "GET") {
    handleSearchResponse(
      res,
      requestUrl.searchParams.get("city"),
      requestUrl.searchParams.get("query")
    );
    return;
  }

  if (pathname === "/api/search" && req.method === "GET") {
    handleSearchResponse(
      res,
      requestUrl.searchParams.get("city"),
      requestUrl.searchParams.get("query")
    );
    return;
  }

  if (pathname === "/api/search" && req.method === "POST") {
    let body;
    try {
      body = await readJsonBody(req);
    } catch {
      sendJson(res, 400, { error: "Body must be valid JSON." });
      return;
    }

    handleSearchResponse(res, body.city, body.query);
    return;
  }

  if (pathname === "/api/analyze" && req.method === "POST") {
    await handleAnalyze(req, res);
    return;
  }

  if (pathname.match(/^\/api\/analyze\/[^/]+$/) && req.method === "GET") {
    const businessId = pathname.split("/").pop();
    await handleAnalyze(req, res, businessId);
    return;
  }

  if (pathname === "/api/applicants" && req.method === "GET") {
    handleApplicantList(res);
    return;
  }

  if (pathname === "/api/users" && req.method === "GET") {
    handleListUsers(res);
    return;
  }

  if (pathname === "/api/users" && req.method === "POST") {
    await handleUpsertUser(req, res);
    return;
  }

  if (pathname === "/api/notifications" && req.method === "GET") {
    handleListNotifications(req, requestUrl, res);
    return;
  }

  if (pathname === "/api/notifications/read" && req.method === "POST") {
    await handleMarkNotificationsRead(req, res);
    return;
  }

  if (pathname === "/api/community/posts" && req.method === "GET") {
    handleListCommunityPosts(res);
    return;
  }

  if (pathname === "/api/community/posts" && req.method === "POST") {
    await handleCreateCommunityPost(req, res);
    return;
  }

  if (pathname === "/api/community/chats" && req.method === "GET") {
    handleListCommunityChats(requestUrl, res);
    return;
  }

  if (pathname === "/api/community/chats" && req.method === "POST") {
    await handleCreateCommunityChat(req, res);
    return;
  }

  if (pathname === "/api/community/reactions" && req.method === "GET") {
    handleListCommunityReactions(requestUrl, res);
    return;
  }

  if (pathname === "/api/community/reactions" && req.method === "POST") {
    await handleCreateCommunityReaction(req, res);
    return;
  }

  if (pathname === "/api/blogs" && req.method === "GET") {
    handleListAiBlogs(res);
    return;
  }

  if (pathname === "/api/blogs" && req.method === "POST") {
    await handleCreateAiBlog(req, res);
    return;
  }

  if (pathname === "/api/applicants" && req.method === "POST") {
    await handleUpsertApplicant(req, res);
    return;
  }

  if (pathname.match(/^\/api\/applicants\/[^/]+$/) && req.method === "GET") {
    const applicantId = pathname.split("/").pop();
    handleGetApplicant(applicantId, res);
    return;
  }

  if (pathname === "/api/engine/match" && req.method === "GET") {
    handleEngineMatch(requestUrl, res);
    return;
  }

  if (pathname === "/api/deals" && req.method === "POST") {
    await handleCreateDeal(req, res);
    return;
  }

  if (pathname === "/api/streaming/rooms" && req.method === "POST") {
    await handleCreateStreamRoom(req, res);
    return;
  }

  if (pathname === "/api/streaming/rooms" && req.method === "GET") {
    handleListStreamRooms(res);
    return;
  }

  if (pathname === "/api/streaming/active-session" && req.method === "GET") {
    handleGetActiveStreamSession(requestUrl, res);
    return;
  }

  if (pathname.match(/^\/api\/streaming\/rooms\/[^/]+$/) && req.method === "GET") {
    const roomId = pathname.split("/").pop();
    handleGetStreamRoom(roomId, res);
    return;
  }

  if (pathname.match(/^\/api\/streaming\/rooms\/[^/]+\/attendance$/) && req.method === "GET") {
    handleListStreamAttendance(pathname, res);
    return;
  }

  if (pathname.match(/^\/api\/streaming\/rooms\/[^/]+\/attendance$/) && req.method === "POST") {
    await handleUpsertStreamAttendance(pathname, req, res);
    return;
  }

  if (pathname.match(/^\/api\/streaming\/rooms\/[^/]+\/finish$/) && req.method === "POST") {
    await handleFinishStreamRoom(pathname, req, res);
    return;
  }

  if (pathname === "/api/streaming/payouts" && req.method === "POST") {
    await handleCreateStreamPayout(req, res);
    return;
  }

  if (pathname === "/api/streaming/payouts" && req.method === "GET") {
    handleListStreamPayouts(requestUrl, res);
    return;
  }

  if (pathname.match(/^\/api\/streaming\/payouts\/[^/]+\/distribute$/) && req.method === "POST") {
    await handleDistributeStreamPayout(pathname, req, res);
    return;
  }

  if (pathname === "/api/streaming/distributions" && req.method === "GET") {
    handleListStreamDistributions(requestUrl, res);
    return;
  }

  if (pathname.match(/^\/api\/deals\/[^/]+\/confirm$/) && req.method === "POST") {
    await handleConfirmDeal(pathname, req, res);
    return;
  }

  if (pathname.match(/^\/api\/deals\/[^/]+$/) && req.method === "GET") {
    handleGetDeal(pathname, res);
    return;
  }

  if (pathname === "/api/dapp/templates" && req.method === "GET") {
    handleDappTemplates(res);
    return;
  }

  if (pathname === "/api/dapp/networks" && req.method === "GET") {
    handleDappNetworks(res);
    return;
  }

  if (pathname === "/api/dapp/prices" && req.method === "GET") {
    handleDappPriceOracle(requestUrl, res);
    return;
  }

  if (pathname === "/api/dapp/deploy" && req.method === "POST") {
    await handleDappDeploy(req, res);
    return;
  }

  if (pathname === "/api/dapp/deployments" && req.method === "GET") {
    handleDappDeployments(requestUrl, res);
    return;
  }

  if (pathname.match(/^\/api\/dapp\/deployments\/[^/]+$/) && req.method === "GET") {
    const deploymentId = pathname.split("/").pop();
    handleDappDeploymentById(deploymentId, res);
    return;
  }

  if (pathname === "/api/dapp/verify-payment" && req.method === "POST") {
    await handleDappVerifyPayment(req, res);
    return;
  }

  if (pathname === "/api/dapp/transactions" && req.method === "GET") {
    handleDappTransactions(requestUrl, res);
    return;
  }

  if (pathname === "/api/dapp/dashboard" && req.method === "GET") {
    handleDappDashboardStats(requestUrl, res);
    return;
  }

  if (pathname === "/api/dapp/retry" && req.method === "POST") {
    await handleDappRetryDeployment(req, res);
    return;
  }

  if (pathname === "/api/find/scan" && req.method === "GET") {
    handleCryptoScan(requestUrl, res);
    return;
  }

  if (pathname === "/api/find/signals" && req.method === "GET") {
    handleEarlySignals(res);
    return;
  }

  if (pathname === "/api/find/smart-money" && req.method === "GET") {
    handleSmartMoney(res);
    return;
  }

  if (pathname === "/api/scan-token" && req.method === "POST") {
    await handleScanTokenPost(req, res);
    return;
  }

  if (pathname === "/api/scan-token" && req.method === "GET") {
    handleCryptoScan(requestUrl, res);
    return;
  }

  if (pathname === "/api/scan-wallet" && req.method === "POST") {
    await handleScanWalletPost(req, res);
    return;
  }

  if (pathname === "/api/scan-wallet" && req.method === "GET") {
    handleScanWalletGet(requestUrl, res);
    return;
  }

  if (pathname === "/api/discover-tokens" && req.method === "GET") {
    handleDiscoverTokens(requestUrl, res);
    return;
  }

  if (pathname === "/api/track-wallet" && req.method === "POST") {
    await handleTrackWallet(req, res);
    return;
  }

  if (pathname === "/api/crypto/alerts" && req.method === "GET") {
    handleCryptoAlerts(res);
    return;
  }

  if (pathname === "/api/build/agents" && req.method === "GET") {
    handleAiAgents(res);
    return;
  }

  const urlPath =
    pathname === "/"
      ? "/index.html"
      : pathname === "/about"
      ? "/about.html"
      : pathname === "/system"
      ? "/system.html"
      : pathname;
  const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(__dirname, "public", safePath);
  await serveFile(filePath, res);
});

server.listen(PORT, () => {
  console.log(`ccweb-project app running on http://localhost:${PORT}`);
  if (getPool() && process.env.CCWEB_SKIP_MIGRATIONS !== "1") {
    migrate().catch((e) => logger.error({ msg: "migrate_failed", err: e.message }));
  }
});
