/**
 * Unified REST API under /api/v1 — Express Router composition with JWT middleware.
 */

const { requireBearerJwt: authJwtMiddleware, optionalBearerJwt: optionalJwt } = require("./server/http/middleware/auth");
const { apiRateLimitV1: apiRateShort, getClientIp } = require("./server/http/middleware/expressRateLimit");
const { errorHandler } = require("./server/http/middleware/errors");
const express = require("express");
const crypto = require("crypto");
const { applyExpressSecurity } = require("./security/expressHardDefaults");
const authEngine = require("./auth/authEngine");
const authStore = require("./auth/authStore");
const { mountAt, mountWalletFlat } = require("./auth/authExpress");
const learningPg = require("./db/persistenceLearning");
const dashboardPg = require("./db/persistenceDashboard");
const pgGrowth = require("./db/persistenceGrowth");
const growthEngine = require("./db/persistenceGrowthEngine");
const monPg = require("./db/persistenceMonetization");
const { expressStripeEscrowCheckout } = require("./payments/stripeCheckout");
const aiExecute = require("./services/aiExecute");
const monetizationEngine = require("./services/monetizationEngine");
const betaPg = require("./db/persistenceBeta");
const chatPg = require("./db/persistenceChat");
const { validateImageBuffer } = require("./services/imageMagic");
const { saveUploadedImage } = require("./services/imageStorage");
const { isCloudinaryConfigured } = require("./services/cloudinaryUpload");
const { imageMulter, createUploadsRouter, MAX_BYTES } = require("./uploadsExpress");
const { publicAppBaseUrl, trimOrigin } = require("./services/deploymentOrigins");
const {
  stripeCheckoutOperational,
  stripeWebhookOperational,
} = require("./payments/stripeConfig");
const {
  broadcastChatMessage,
  broadcastInboxRefresh,
  onlineStatusForUserIds,
} = require("./server/realtime/chatSocket");
const { createCoursesRouter } = require("./coursesExpress");

function createPlatformApp(deps) {
  const app = express();
  applyExpressSecurity(app);
  app.locals.ccwebAuth = deps;

  app.use(express.json({ limit: "512kb" }));
  const cookieParser = require("cookie-parser");
  app.use(cookieParser());

  const v1 = express.Router();

  v1.get("/config", (req, res) => {
    const publicApp = trimOrigin(process.env.PUBLIC_APP_URL) || null;
    const apiPublic = trimOrigin(process.env.CCWEB_API_PUBLIC_URL) || null;
    res.json({
      publicAppUrl: publicApp || null,
      apiPublicUrl: apiPublic || null,
      environment: process.env.NODE_ENV === "production" ? "production" : "development",
      realtime: {
        socketPath: "/socket.io",
        transports: ["websocket", "polling"],
      },
      payments: {
        stripeCheckoutEnabled: stripeCheckoutOperational(),
        stripeWebhooksEnabled: stripeWebhookOperational(),
      },
      uploads: {
        cloudinary: isCloudinaryConfigured(),
        maxBytes: MAX_BYTES,
        profile: true,
        chat: true,
        courseThumbnail: Boolean((process.env.CCWEB_ADMIN_KEY || "").trim()),
      },
    });
  });
  const authRouter = express.Router();
  mountAt(authRouter, "");
  mountWalletFlat(authRouter);

  v1.use("/auth", apiRateShort, authRouter);

  const walletRouter = express.Router();
  mountWalletFlat(walletRouter, { verifyPath: "/verify" });

  v1.use("/wallet", apiRateShort, walletRouter);

  const usersRouter = express.Router();

  usersRouter.get("/me", authJwtMiddleware, async (req, res, next) => {
    try {
      const { ccwebUsers, sanitizeUser, buildUserProfile } = deps;
      const user = await authEngine.ensureUserProfile(ccwebUsers, buildUserProfile, req.ccwebUserId);
      if (!user) return res.status(401).json({ error: "Session invalid.", code: "USER_NOT_FOUND" });
      let betaSlug = null;
      try {
        betaSlug = await betaPg.getSlugForUser(req.ccwebUserId);
      } catch {
        /* ignore */
      }
      const base = trimOrigin(process.env.PUBLIC_APP_URL) || null;
      res.json({
        user: sanitizeUser(user),
        betaSlug,
        betaPublicUrl: betaSlug && base ? `${base}/u/${betaSlug}` : null,
      });
    } catch (e) {
      next(e);
    }
  });

  usersRouter.put("/update", authJwtMiddleware, async (req, res, next) => {
    try {
      const { ccwebUsers, sanitizeUser, buildUserProfile } = deps;
      const row = await authStore.findById(req.ccwebUserId);
      if (!row) return res.status(404).json({ error: "User not found." });
      const displayName = (req.body?.displayName || "").toString().trim();
      if (!displayName || displayName.length > 120) {
        return res.status(400).json({ error: "displayName required (max 120 chars)." });
      }
      const pushEnabled = req.body?.pushEnabled !== false;
      const existingInMem = ccwebUsers.get(req.ccwebUserId);
      const merged = buildUserProfile(
        {
          userId: req.ccwebUserId,
          displayName,
          email: row.email || existingInMem?.email,
          roles: existingInMem?.roles || ["member"],
          pushEnabled,
          isOrganic: existingInMem?.isOrganic ?? true,
        },
        existingInMem || null
      );
      ccwebUsers.set(req.ccwebUserId, merged);
      await authEngine.persistNewUserProfile(req.ccwebUserId, merged);
      await authStore.saveUser({
        ...row,
        email: row.email || merged.email || null,
      });
      const slugRaw = (req.body?.betaSlug || req.body?.usernameSlug || "").toString();
      if (slugRaw.trim()) {
        const bs = await betaPg.setMySlug(req.ccwebUserId, slugRaw);
        if (!bs.ok && bs.error === "slug_taken") {
          return res.status(409).json({ error: "That public URL is already taken.", code: bs.error });
        }
      }
      let betaSlugOut = null;
      try {
        betaSlugOut = await betaPg.getSlugForUser(req.ccwebUserId);
      } catch {
        /* ignore */
      }
      const base = trimOrigin(process.env.PUBLIC_APP_URL) || null;
      res.json({
        user: sanitizeUser(merged),
        betaSlug: betaSlugOut,
        betaPublicUrl: betaSlugOut && base ? `${base}/u/${betaSlugOut}` : null,
      });
    } catch (e) {
      next(e);
    }
  });

  usersRouter.get("/:id", optionalJwt, async (req, res, next) => {
    try {
      const { sanitizeUser } = deps;
      const id = req.params.id;
      const row = await authStore.findById(id);
      if (!row) return res.status(404).json({ error: "Not found." });
      const u = deps.ccwebUsers.get(id) || {
        id: row.id,
        email: row.email,
        displayName: id.slice(0, 8),
        roles: ["member"],
        isOrganic: true,
        pushEnabled: true,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
      const publicUser = sanitizeUser(u);
      if (req.ccwebUserId !== id) {
        delete publicUser.email;
      }
      res.json({ user: publicUser });
    } catch (e) {
      next(e);
    }
  });

  v1.use("/users", usersRouter);

  v1.use("/uploads", apiRateShort, createUploadsRouter(deps));

  const chatImageUpload = imageMulter();

  const chatRouter = express.Router();

  chatRouter.use((req, res, next) => {
    if (!chatPg.usePostgres()) {
      return res.status(503).json({ error: "Chat requires PostgreSQL.", code: "NO_DATABASE" });
    }
    next();
  });

  chatRouter.get("/conversations", authJwtMiddleware, async (req, res, next) => {
    try {
      const conversations = await chatPg.listConversations(req.ccwebUserId);
      res.json({ conversations });
    } catch (e) {
      next(e);
    }
  });

  chatRouter.get("/presence", authJwtMiddleware, async (req, res, next) => {
    try {
      const raw = (req.query.ids || "").toString().trim();
      const ids = raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 200);
      const presence = onlineStatusForUserIds(ids);
      res.json({ presence });
    } catch (e) {
      next(e);
    }
  });

  chatRouter.post("/direct", authJwtMiddleware, async (req, res, next) => {
    try {
      const otherUserId = (req.body?.otherUserId || "").toString().trim();
      if (!otherUserId) return res.status(400).json({ error: "otherUserId required." });
      const chatId = await chatPg.getOrCreateDirectChat(req.ccwebUserId, otherUserId);
      if (!chatId) return res.status(400).json({ error: "Cannot open chat." });
      res.status(201).json({ chatId });
    } catch (e) {
      next(e);
    }
  });

  chatRouter.get("/:chatId/messages", authJwtMiddleware, async (req, res, next) => {
    try {
      const limit = Math.min(100, Number(req.query.limit) || 50);
      const before = req.query.before ? String(req.query.before) : undefined;
      const messages = await chatPg.getMessages(req.params.chatId, req.ccwebUserId, { limit, before });
      if (!messages) return res.status(403).json({ error: "Forbidden." });
      res.json({ messages });
    } catch (e) {
      next(e);
    }
  });

  chatRouter.post("/:chatId/messages", authJwtMiddleware, async (req, res, next) => {
    try {
      const body = (req.body?.body ?? "").toString();
      if (!body.trim()) return res.status(400).json({ error: "body required." });
      const chatId = req.params.chatId;
      const ok = await chatPg.verifyMember(chatId, req.ccwebUserId);
      if (!ok) return res.status(403).json({ error: "Forbidden." });
      const message = await chatPg.appendMessage(chatId, req.ccwebUserId, body.slice(0, 8000), req.body?.metadata || {});
      broadcastChatMessage(chatId, message);
      broadcastInboxRefresh(req.ccwebUserId, chatId);
      const other = await chatPg.getOtherMember(chatId, req.ccwebUserId);
      if (other) broadcastInboxRefresh(other, chatId);
      res.status(201).json({ message });
    } catch (e) {
      next(e);
    }
  });

  chatRouter.post("/:chatId/read", authJwtMiddleware, async (req, res, next) => {
    try {
      const ok = await chatPg.markRead(req.params.chatId, req.ccwebUserId);
      if (!ok) return res.status(403).json({ error: "Forbidden." });
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });

  chatRouter.post("/:chatId/upload", authJwtMiddleware, chatImageUpload.single("file"), async (req, res, next) => {
    try {
      if (!req.file?.buffer) return res.status(400).json({ error: "Image file required (field name: file)." });
      const chatId = req.params.chatId;
      const ok = await chatPg.verifyMember(chatId, req.ccwebUserId);
      if (!ok) return res.status(403).json({ error: "Forbidden." });
      const v = validateImageBuffer(req.file.buffer);
      if (!v.ok) return res.status(400).json({ error: v.error });
      const saved = await saveUploadedImage(req.file.buffer, {
        mimetype: req.file.mimetype,
        originalName: req.file.originalname,
        userId: req.ccwebUserId,
        kind: "chat",
      });
      const imageUrl = saved.url;
      const message = await chatPg.appendMessage(chatId, req.ccwebUserId, "📷", {
        type: "image",
        url: imageUrl,
      });
      broadcastChatMessage(chatId, message);
      broadcastInboxRefresh(req.ccwebUserId, chatId);
      const other = await chatPg.getOtherMember(chatId, req.ccwebUserId);
      if (other) broadcastInboxRefresh(other, chatId);
      res.status(201).json({ message, url: imageUrl, storage: saved.storage });
    } catch (e) {
      next(e);
    }
  });

  v1.use("/chat", apiRateShort, chatRouter);

  const coursesRouter = createCoursesRouter({ authJwtMiddleware, optionalJwt });
  v1.use("/courses", apiRateShort, coursesRouter);

  const agentRuns = [];
  const catalogAgents = [
    {
      id: "agent-001",
      name: "Research Loop Agent",
      description: "Monitors narratives and on-chain signals.",
      category: "research",
      capabilities: ["On-chain analysis", "Reports"],
    },
    {
      id: "agent-002",
      name: "Workflow Operator",
      description: "Runs multi-step automation workflows.",
      category: "operations",
      capabilities: ["Workflow design", "Integrations"],
    },
  ];

  const agentsRouter = express.Router();

  agentsRouter.post("/create", authJwtMiddleware, async (req, res, next) => {
    try {
      const name = (req.body?.name || "Custom Agent").toString().slice(0, 120);
      const category = (req.body?.category || "general").toString().slice(0, 64);
      const agent = {
        id: `agent-custom-${crypto.randomBytes(6).toString("hex")}`,
        name,
        category,
        ownerUserId: req.ccwebUserId,
        description: (req.body?.description || "").toString().slice(0, 500),
        capabilities: Array.isArray(req.body?.capabilities) ? req.body.capabilities.map(String).slice(0, 12) : [],
        createdAt: new Date().toISOString(),
      };
      catalogAgents.push(agent);
      res.status(201).json({ agent });
    } catch (e) {
      next(e);
    }
  });

  agentsRouter.get("/", authJwtMiddleware, async (req, res) => {
    res.json({ count: catalogAgents.length, agents: catalogAgents });
  });

  agentsRouter.get("/:id", authJwtMiddleware, async (req, res) => {
    const a = catalogAgents.find((x) => x.id === req.params.id);
    if (!a) return res.status(404).json({ error: "Agent not found." });
    res.json({ agent: a });
  });

  agentsRouter.post("/run", authJwtMiddleware, async (req, res, next) => {
    try {
      const gate = await monetizationEngine.enforcePaywall(req.ccwebUserId, "ai_platform");
      if (!gate.ok) {
        return res.status(402).json({
          error: "AI agent run limit reached for your plan.",
          code: "MON_LIMIT",
          monetization: gate,
        });
      }
      const agentId = (req.body?.agentId || "").toString().trim();
      const input = req.body?.input || {};
      const agent = catalogAgents.find((x) => x.id === agentId);
      if (!agent) return res.status(404).json({ error: "Agent not found." });
      const runId = `run_${crypto.randomBytes(8).toString("hex")}`;
      const ai = await aiExecute.runAgent(agent, input);
      await monetizationEngine.afterSuccessfulUse(req.ccwebUserId, "ai_platform");
      if (learningPg.usePostgres()) {
        try {
          await learningPg.addXpDelta(req.ccwebUserId, 12);
          await growthEngine.recordEvent(req.ccwebUserId, "ai_tool_used", { agentId });
        } catch {
          /* ignore */
        }
      }
      const result = {
        runId,
        agentId,
        status: "completed",
        summary: ai.text.slice(0, 400),
        outputPreview: ai.text.slice(0, 800),
        provider: ai.provider,
        model: ai.model,
        usage: ai.usage,
        mock: Boolean(ai.mock),
        monetization: gate.payPerUse ? { chargedCreditsCents: gate.chargedCreditsCents } : { included: true },
        finishedAt: new Date().toISOString(),
      };
      agentRuns.unshift({ ...result, userId: req.ccwebUserId });
      if (agentRuns.length > 500) agentRuns.pop();
      res.status(200).json(result);
    } catch (e) {
      if (e.code === "AI_NOT_CONFIGURED") return res.status(503).json({ error: e.message, code: e.code });
      next(e);
    }
  });

  v1.use("/agents", agentsRouter);

  const growthRouter = express.Router();

  growthRouter.get("/me", authJwtMiddleware, async (req, res, next) => {
    try {
      if (!learningPg.usePostgres()) {
        return res.status(503).json({ error: "PostgreSQL required for growth features.", code: "NO_DATABASE" });
      }
      const code = await growthEngine.ensureReferralCode(req.ccwebUserId);
      const stats = await growthEngine.referralStats(req.ccwebUserId);
      const badges = await growthEngine.listBadges(req.ccwebUserId);
      const { query } = require("./db/pool");
      const { rows: sr } = await query(`SELECT current_streak, longest_streak FROM ccweb_login_streaks WHERE user_id = $1`, [
        req.ccwebUserId,
      ]);
      const streak = sr[0]
        ? { current: sr[0].current_streak, longest: sr[0].longest_streak }
        : { current: 0, longest: 0 };
      const base = publicAppBaseUrl();
      const profile = await learningPg.userLearningProfile(req.ccwebUserId);
      const xp = profile?.xp ?? 0;
      const level =
        xp >= 5000 ? "elite" : xp >= 1500 ? "pro" : xp >= 400 ? "builder" : "beginner";
      res.json({
        referralLink: `${base}/signup?ref=${code}`,
        referralCode: code,
        ...stats,
        badges,
        streak,
        level,
        xp,
        rewardHint: `When someone you invite attends a session or runs AI tools, you both earn credits (see server limits).`,
      });
    } catch (e) {
      next(e);
    }
  });

  growthRouter.get("/leaderboards", authJwtMiddleware, async (req, res, next) => {
    try {
      const lb = await growthEngine.leaderboards(Number(req.query.limit) || 25);
      res.json(lb);
    } catch (e) {
      next(e);
    }
  });

  growthRouter.post("/events", authJwtMiddleware, async (req, res, next) => {
    try {
      const type = String(req.body?.type || "").trim();
      const allowed = ["share", "milestone", "scan_completed"];
      if (!allowed.includes(type)) return res.status(400).json({ error: "Invalid event type." });
      await growthEngine.recordEvent(req.ccwebUserId, `client_${type}`, req.body?.metadata || {});
      if (learningPg.usePostgres() && type === "share") await learningPg.addXpDelta(req.ccwebUserId, 8);
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });

  growthRouter.post("/daily", authJwtMiddleware, async (req, res, next) => {
    try {
      const streak = await growthEngine.onUserLogin(req.ccwebUserId);
      res.json(streak);
    } catch (e) {
      next(e);
    }
  });

  v1.use("/growth", apiRateShort, growthRouter);

  const monetizationRouter = express.Router();

  monetizationRouter.get("/status", authJwtMiddleware, async (req, res, next) => {
    try {
      if (!learningPg.usePostgres()) {
        return res.json({
          postgres: false,
          note: "DATABASE_URL enables metering and credit wallets.",
        });
      }
      const tier = await monPg.getEffectiveTier(req.ccwebUserId);
      const limits = monetizationEngine.tierLimits(tier);
      const usageRow = await monPg.getUsageRow(req.ccwebUserId);
      const profile = await learningPg.userLearningProfile(req.ccwebUserId);
      const scans = usageRow?.scan_count ?? 0;
      const intel = usageRow?.intelligence_calls ?? 0;
      const aiRuns = usageRow?.ai_platform_runs ?? 0;
      const scanQuote = await monetizationEngine.quotePayPerUse("scan");
      const intelQuote = await monetizationEngine.quotePayPerUse("intelligence");
      const aiQuote = await monetizationEngine.quotePayPerUse("ai_platform");
      res.json({
        tier,
        limits,
        usageThisMonth: {
          scans,
          intelligenceCalls: intel,
          aiPlatformRuns: aiRuns,
          hubAgentRuns: usageRow?.hub_agent_runs ?? 0,
          hubWorkflowRuns: usageRow?.hub_workflow_runs ?? 0,
        },
        wallet: { creditsCents: profile?.creditsCents ?? 0 },
        subscription: profile?.subscription ?? null,
        quotes: {
          demandMultiplier: scanQuote.multiplier,
          scanOverageCreditsCents: monetizationEngine.creditCentsFor("scan"),
          intelligenceOverageCreditsCents: monetizationEngine.creditCentsFor("intelligence"),
          aiPlatformOverageCreditsCents: monetizationEngine.creditCentsFor("ai_platform"),
          indicativeUsd: {
            scan: scanQuote.priceUsd,
            intelligence: intelQuote.priceUsd,
            aiPlatform: aiQuote.priceUsd,
          },
        },
      });
    } catch (e) {
      next(e);
    }
  });

  v1.use("/monetization", apiRateShort, monetizationRouter);

  const betaRouter = express.Router();

  betaRouter.get("/user/:userId", async (req, res, next) => {
    try {
      const id = (req.params.userId || "").trim();
      if (!id) return res.status(400).json({ error: "userId required." });
      const { ccwebUsers, sanitizeUser } = deps;
      const u = ccwebUsers.get(id);
      if (!u) {
        return res.json({
          userId: id,
          displayName: null,
          note: "No live session profile for this id (sign in at least once on this deployment for full name).",
        });
      }
      const pub = sanitizeUser(u);
      delete pub.email;
      res.json({ ...pub, userId: id });
    } catch (e) {
      next(e);
    }
  });

  betaRouter.get("/profile/:slug", async (req, res, next) => {
    try {
      if (!betaPg.usePostgres()) {
        return res.status(503).json({ error: "PostgreSQL required for beta profile URLs.", code: "NO_DATABASE" });
      }
      const row = await betaPg.resolveSlug(req.params.slug);
      if (!row) return res.status(404).json({ error: "Profile not found." });
      const { ccwebUsers, sanitizeUser } = deps;
      const u = ccwebUsers.get(row.userId);
      if (!u) {
        return res.json({
          userId: row.userId,
          slug: row.slug,
          displayName: row.userId.slice(0, 8),
          note: "Profile hydration pending login sync.",
        });
      }
      const publicUser = sanitizeUser(u);
      delete publicUser.email;
      res.json({ ...publicUser, slug: row.slug, userId: row.userId });
    } catch (e) {
      next(e);
    }
  });

  betaRouter.put("/profile", authJwtMiddleware, async (req, res, next) => {
    try {
      const slug = (req.body?.slug || req.body?.username || "").toString();
      const out = await betaPg.setMySlug(req.ccwebUserId, slug);
      if (!out.ok) {
        const map = {
          slug_too_short: [400, "Slug must be at least 3 characters after normalization."],
          invalid_slug: [400, "Use letters, numbers, and hyphens only."],
          reserved: [400, "That slug is reserved."],
          slug_taken: [409, "That URL is already taken."],
          no_database: [503, "PostgreSQL required."],
        };
        const [st, msg] = map[out.error] || [400, "Could not save slug."];
        return res.status(st).json({ error: msg, code: out.error });
      }
      const base = publicAppBaseUrl();
      res.json({ slug: out.slug, publicUrl: `${base}/u/${out.slug}` });
    } catch (e) {
      next(e);
    }
  });

  betaRouter.get("/invite/:code", async (req, res, next) => {
    try {
      if (!betaPg.usePostgres()) {
        return res.json({ valid: false, reason: "no_database", note: "Invite validation requires PostgreSQL." });
      }
      const inv = await betaPg.getInvite(req.params.code);
      if (!inv) return res.status(404).json({ valid: false, error: "Unknown invite code." });
      if (inv.expired) return res.status(410).json({ valid: false, error: "Invite expired." });
      res.json({ valid: true, code: inv.code, label: inv.label });
    } catch (e) {
      next(e);
    }
  });

  betaRouter.post("/event", optionalJwt, async (req, res, next) => {
    try {
      const meta = req.body?.metadata && typeof req.body.metadata === "object" ? req.body.metadata : {};
      if (req.body?.error || req.body?.durationMs != null) {
        meta.clientError = req.body?.error;
        meta.durationMs = req.body?.durationMs;
      }
      await betaPg.recordBetaEvent({
        userId: req.ccwebUserId,
        inviteCode: req.body?.inviteCode,
        slug: req.body?.slug,
        eventType: (req.body?.eventType || "page_view").toString().slice(0, 64),
        path: req.body?.path,
        featureKey: req.body?.featureKey,
        userAgent: req.headers["user-agent"],
        clientIp: getClientIp(req),
        metadata: meta,
      });
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });

  betaRouter.post("/invites", async (req, res, next) => {
    try {
      const key = (req.headers["x-ccweb-admin"] || "").toString().trim();
      const adminKey = (process.env.CCWEB_ADMIN_KEY || "").trim();
      if (!adminKey || key !== adminKey) {
        return res.status(403).json({ error: "Admin key required (X-CCWEB-Admin)." });
      }
      const out = await betaPg.createInvite({
        code: req.body?.code,
        label: req.body?.label,
        expiresAt: req.body?.expiresAt,
      });
      if (!out.ok) {
        return res.status(out.error === "invalid_code" ? 400 : 503).json({ error: out.error });
      }
      const base = trimOrigin(process.env.PUBLIC_APP_URL) || "";
      res.status(201).json({
        ...out,
        inviteUrl: base ? `${base}/invite/${out.code}` : null,
      });
    } catch (e) {
      next(e);
    }
  });

  v1.use("/beta", apiRateShort, betaRouter);

  const marketplaceRouter = express.Router();

  marketplaceRouter.post("/create", authJwtMiddleware, async (req, res, next) => {
    try {
      if (!pgGrowth.usePostgres()) {
        return res.status(503).json({ error: "PostgreSQL required for marketplace listings." });
      }
      const row = await pgGrowth.createListing({
        ...req.body,
        sellerId: req.body?.sellerId || req.ccwebUserId,
      });
      res.status(201).json(row);
    } catch (e) {
      next(e);
    }
  });

  marketplaceRouter.get("/", async (req, res, next) => {
    try {
      const industry = (req.query.industry || "").toString();
      const hub = require("./businessGrowthHub");
      const list = pgGrowth.usePostgres()
        ? await pgGrowth.listListings(industry)
        : (hub.seedIfEmpty(), [...hub.listings.values()].filter((l) => !industry || l.industry === industry));
      res.json({ count: list.length, listings: list });
    } catch (e) {
      next(e);
    }
  });

  marketplaceRouter.get("/:id", async (req, res, next) => {
    try {
      const hub = require("./businessGrowthHub");
      const row = pgGrowth.usePostgres()
        ? await pgGrowth.getListing(req.params.id)
        : (hub.seedIfEmpty(), hub.listings.get(req.params.id));
      if (!row) return res.status(404).json({ error: "Not found." });
      res.json(row);
    } catch (e) {
      next(e);
    }
  });

  v1.use("/marketplace", marketplaceRouter);

  const paymentsRouter = express.Router();

  paymentsRouter.post("/create", authJwtMiddleware, async (req, res, next) => {
    try {
      req.body = {
        ...req.body,
        buyerId: req.body?.buyerId || req.ccwebUserId,
      };
      await expressStripeEscrowCheckout(req, res);
      if (!res.headersSent) next();
    } catch (e) {
      next(e);
    }
  });

  paymentsRouter.post("/release", authJwtMiddleware, async (req, res, next) => {
    try {
      if (!pgGrowth.usePostgres()) {
        return res.status(503).json({ error: "PostgreSQL required." });
      }
      const orderId = (req.body?.orderId || "").toString().trim();
      const action = (req.body?.action || "confirm").toString().toLowerCase();
      if (!orderId) return res.status(400).json({ error: "orderId required." });
      let out;
      if (action === "deliver" || action === "mark_delivered") {
        out = await pgGrowth.markDelivered(orderId);
      } else {
        out = await pgGrowth.confirmOrder(orderId);
      }
      if (out.error) return res.status(400).json(out);
      res.json(out);
    } catch (e) {
      next(e);
    }
  });

  paymentsRouter.get("/history", authJwtMiddleware, async (req, res, next) => {
    try {
      if (!pgGrowth.usePostgres()) {
        const hub = require("./businessGrowthHub");
        hub.seedIfEmpty();
        const mine = [...hub.orders.values()].filter((o) => o.buyerId === req.ccwebUserId || o.sellerId === req.ccwebUserId);
        return res.json({ count: mine.length, orders: mine });
      }
      const asSeller = await pgGrowth.listOrders(req.ccwebUserId);
      const asBuyer = await pgGrowth.listOrders(null);
      const buyerFiltered = asBuyer.filter((o) => o.buyerId === req.ccwebUserId);
      const map = new Map();
      [...asSeller, ...buyerFiltered].forEach((o) => map.set(o.id, o));
      const merged = Array.from(map.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      res.json({ count: merged.length, orders: merged });
    } catch (e) {
      next(e);
    }
  });

  v1.use("/payments", paymentsRouter);

  const analyticsRouter = express.Router();

  analyticsRouter.get("/user", authJwtMiddleware, async (req, res, next) => {
    try {
      if (!learningPg.usePostgres()) {
        return res.json({
          postgres: false,
          profile: null,
          ordersSample: [],
          dashboard: null,
          note: "Enable DATABASE_URL for full analytics.",
        });
      }
      const profile = await learningPg.userLearningProfile(req.ccwebUserId);
      let orders = [];
      if (pgGrowth.usePostgres()) {
        const seller = await pgGrowth.listOrders(req.ccwebUserId);
        const all = await pgGrowth.listOrders(null);
        orders = [...seller, ...all.filter((o) => o.buyerId === req.ccwebUserId)];
      }
      let growth = null;
      if (learningPg.usePostgres()) {
        try {
          const { query } = require("./db/pool");
          const code = await growthEngine.ensureReferralCode(req.ccwebUserId);
          const stats = await growthEngine.referralStats(req.ccwebUserId);
          const badges = await growthEngine.listBadges(req.ccwebUserId);
          const { rows: sr } = await query(`SELECT current_streak, longest_streak FROM ccweb_login_streaks WHERE user_id = $1`, [
            req.ccwebUserId,
          ]);
          const streak = sr[0]
            ? { current: sr[0].current_streak, longest: sr[0].longest_streak }
            : { current: 0, longest: 0 };
          const base = publicAppBaseUrl();
          const xpVal = profile?.xp ?? 0;
          const level = xpVal >= 5000 ? "elite" : xpVal >= 1500 ? "pro" : xpVal >= 400 ? "builder" : "beginner";
          growth = {
            referralLink: `${base}/signup?ref=${code}`,
            referralCode: code,
            ...stats,
            badges,
            streak,
            level,
            profileXp: xpVal,
            rewardHint: `Invite friends — you both earn about $${(growthEngine.REF_CREDIT_CENTS / 100).toFixed(2)} in learning credits when they attend a session or run AI tools (first activation).`,
          };
        } catch {
          growth = null;
        }
      }
      let dashboard = null;
      try {
        dashboard = await dashboardPg.getDashboardBundle(req.ccwebUserId);
      } catch {
        dashboard = null;
      }
      res.json({ postgres: true, profile, orders: orders.slice(0, 25), growth, dashboard });
    } catch (e) {
      next(e);
    }
  });

  analyticsRouter.get("/platform", authJwtMiddleware, async (req, res, next) => {
    try {
      const key = (req.headers["x-ccweb-admin"] || "").toString().trim();
      const adminKey = (process.env.CCWEB_ADMIN_KEY || "").trim();
      if (!adminKey || key !== adminKey) {
        return res.status(403).json({ error: "Admin key required (X-CCWEB-Admin)." });
      }
      if (!learningPg.usePostgres()) {
        return res.status(503).json({ error: "PostgreSQL required for platform analytics." });
      }
      const summary = await learningPg.analyticsSummary();
      const growthOverview = pgGrowth.usePostgres() ? await pgGrowth.overview() : null;
      const growthViral = await growthEngine.growthAnalyticsSummary();
      const leaderboards = await growthEngine.leaderboards(30);
      const monPg = require("./db/persistenceMonetization");
      const revenueOverview = await monPg.adminRevenueOverview({
        meteringDays: Number(req.query.meteringDays) || 90,
        trendDays: Number(req.query.trendDays) || 14,
      });
      const pricing = await monetizationEngine.quotePayPerUse("scan");
      const betaTesting = await betaPg.betaAnalyticsSummary(Number(req.query.betaDays) || 30);
      res.json({
        learning: summary,
        growthHub: growthOverview,
        growthViral,
        leaderboards,
        monetization: {
          revenueOverview,
          dynamicPricingSample: pricing,
          tierDefaults: monetizationEngine.tierLimits("free"),
        },
        betaTesting,
      });
    } catch (e) {
      next(e);
    }
  });

  v1.use("/analytics", analyticsRouter);

  app.use("/api/v1", v1);

  app.use(errorHandler);

  return app;
}

module.exports = { createPlatformApp, authJwtMiddleware, apiRateShort, errorHandler };
