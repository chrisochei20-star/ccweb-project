/**
 * /api/v1/courses — catalog, progress, tutor (stream), admin CRUD.
 */

const express = require("express");
const coursesPg = require("./db/persistenceCourses");
const tutorPg = require("./db/persistenceAiTutor");
const pgUserProfile = require("./db/pgUserProfile");
const aiExecute = require("./services/aiExecute");
const { buildTutorSystemPrompt, normalizeMode } = require("./services/tutorPrompt");
const { logger } = require("./logging/logger");
const { validateImageBuffer } = require("./services/imageMagic");
const { saveUploadedImage } = require("./services/imageStorage");
const { imageMulter } = require("./uploadsExpress");
const persistenceNotifications = require("./db/persistenceNotifications");
const { broadcastNotificationUpdate } = require("./server/realtime/chatSocket");

function requireAdmin(req, res, next) {
  const key = (req.headers["x-ccweb-admin"] || "").toString().trim();
  const adminKey = (process.env.CCWEB_ADMIN_KEY || "").trim();
  if (!adminKey || key !== adminKey) {
    return res.status(403).json({ error: "Admin key required (X-CCWEB-Admin)." });
  }
  next();
}

function createCoursesRouter({ authJwtMiddleware, optionalJwt }) {
  const router = express.Router();

  router.use((req, res, next) => {
    if (!coursesPg.usePostgres()) {
      return res.status(503).json({ error: "Course catalog requires PostgreSQL.", code: "NO_DATABASE" });
    }
    next();
  });

  router.get("/catalog/categories", async (req, res, next) => {
    try {
      res.json({ categories: await coursesPg.listCategories() });
    } catch (e) {
      next(e);
    }
  });

  router.get("/catalog/courses", async (req, res, next) => {
    try {
      const categorySlug = req.query.category ? String(req.query.category) : undefined;
      const q = req.query.q ? String(req.query.q) : undefined;
      const courses = await coursesPg.listCourses({ categorySlug, q, publishedOnly: true });
      res.json({ courses });
    } catch (e) {
      next(e);
    }
  });

  router.get("/catalog/recommended", optionalJwt, async (req, res, next) => {
    try {
      const categorySlug = req.query.category ? String(req.query.category) : undefined;
      const excludeCourseId = req.query.exclude ? String(req.query.exclude) : undefined;
      const courses = await coursesPg.listRecommended(req.ccwebUserId, {
        categorySlug,
        excludeCourseId,
        limit: Number(req.query.limit) || 8,
      });
      res.json({ courses });
    } catch (e) {
      next(e);
    }
  });

  router.get("/catalog/lessons/:lessonId/quiz", optionalJwt, async (req, res, next) => {
    try {
      const quiz = await coursesPg.getQuizByLessonId(req.params.lessonId);
      if (!quiz) return res.status(404).json({ error: "No quiz for this lesson." });
      res.json({
        quiz: {
          id: quiz.id,
          lessonId: quiz.lessonId,
          title: quiz.title,
          passPct: quiz.passPct,
          questions: coursesPg.sanitizeQuizQuestions(quiz.questions),
        },
      });
    } catch (e) {
      next(e);
    }
  });

  router.get("/catalog/:slug", optionalJwt, async (req, res, next) => {
    try {
      const course = await coursesPg.getCourseBySlug(req.params.slug);
      if (!course) return res.status(404).json({ error: "Course not found." });
      const lessons = await coursesPg.listLessons(course.id);
      let completedLessonIds = [];
      let enrollment = null;
      if (req.ccwebUserId) {
        const set = await coursesPg.getLessonCompletionSet(
          req.ccwebUserId,
          lessons.map((l) => l.id)
        );
        completedLessonIds = [...set];
        enrollment = await coursesPg.getEnrollment(req.ccwebUserId, course.id);
      }
      const recommended = await coursesPg.listRecommended(req.ccwebUserId, {
        categorySlug: course.categorySlug,
        excludeCourseId: course.id,
        limit: 4,
      });
      res.json({ course, lessons, completedLessonIds, enrollment, recommended });
    } catch (e) {
      next(e);
    }
  });

  router.get("/me/progress", authJwtMiddleware, async (req, res, next) => {
    try {
      const progress = await coursesPg.listProgress(req.ccwebUserId);
      res.json({ progress });
    } catch (e) {
      next(e);
    }
  });

  router.get("/me/bookmarks", authJwtMiddleware, async (req, res, next) => {
    try {
      const bookmarks = await coursesPg.listBookmarks(req.ccwebUserId);
      res.json({ bookmarks });
    } catch (e) {
      next(e);
    }
  });

  router.post("/me/bookmarks/:courseId", authJwtMiddleware, async (req, res, next) => {
    try {
      await coursesPg.addBookmark(req.ccwebUserId, req.params.courseId);
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });

  router.delete("/me/bookmarks/:courseId", authJwtMiddleware, async (req, res, next) => {
    try {
      await coursesPg.removeBookmark(req.ccwebUserId, req.params.courseId);
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });

  router.get("/me/certificates", authJwtMiddleware, async (req, res, next) => {
    try {
      const certificates = await coursesPg.listCertificates(req.ccwebUserId);
      res.json({ certificates });
    } catch (e) {
      next(e);
    }
  });

  router.post("/me/lessons/:lessonId/complete", authJwtMiddleware, async (req, res, next) => {
    try {
      const out = await coursesPg.markLessonComplete(req.ccwebUserId, req.params.lessonId);
      if (!out) return res.status(404).json({ error: "Lesson not found." });
      if (persistenceNotifications.enabled()) {
        try {
          const body =
            out.lessonTitle && out.courseTitle
              ? `${out.lessonTitle} · ${out.courseTitle}`
              : "You completed a lesson.";
          await persistenceNotifications.createLearnProgressNotification({
            userId: req.ccwebUserId,
            title: "Lesson complete",
            body,
            payload: {
              courseSlug: out.courseSlug,
              lessonId: out.lessonId,
              progressPct: out.progressPct,
            },
          });
          broadcastNotificationUpdate(req.ccwebUserId, { kind: "learn" });
        } catch {
          /* ignore */
        }
      }
      res.json(out);
    } catch (e) {
      next(e);
    }
  });

  router.post("/me/quiz/:quizId/submit", authJwtMiddleware, async (req, res, next) => {
    try {
      const result = await coursesPg.submitQuizAttempt(req.ccwebUserId, req.params.quizId, req.body?.answers || {});
      if (!result) return res.status(404).json({ error: "Quiz not found." });
      res.json(result);
    } catch (e) {
      next(e);
    }
  });

  router.get("/tutor/conversations", authJwtMiddleware, async (req, res, next) => {
    try {
      const conversations = await tutorPg.listConversations(req.ccwebUserId, {
        limit: Number(req.query.limit) || 40,
      });
      res.json({ conversations });
    } catch (e) {
      next(e);
    }
  });

  router.post("/tutor/conversations", authJwtMiddleware, async (req, res, next) => {
    try {
      if (req.body?.forceNew === true) {
        const mode = normalizeMode(req.body?.mode);
        const conv = await tutorPg.createConversation(req.ccwebUserId, {
          title: String(req.body?.title || `Chat · ${mode}`).slice(0, 200),
          metadata: {
            mode,
            courseSlug: req.body?.courseSlug ? String(req.body.courseSlug) : "",
            lessonId: req.body?.lessonId ? String(req.body.lessonId) : "",
          },
        });
        return res.status(201).json({ conversation: conv });
      }
      const conv = await resolveConversation(req.ccwebUserId, req.body);
      res.json({ conversation: conv });
    } catch (e) {
      next(e);
    }
  });

  router.get("/tutor/conversations/:conversationId/messages", authJwtMiddleware, async (req, res, next) => {
    try {
      const conv = await tutorPg.findConversationById(req.ccwebUserId, req.params.conversationId);
      if (!conv) return res.status(404).json({ error: "Conversation not found." });
      const messages = await tutorPg.listMessages(conv.id, { limit: Number(req.query.limit) || 80 });
      res.json({ conversation: conv, messages });
    } catch (e) {
      next(e);
    }
  });

  router.delete("/tutor/conversations/:conversationId", authJwtMiddleware, async (req, res, next) => {
    try {
      const ok = await tutorPg.deleteConversation(req.ccwebUserId, req.params.conversationId);
      if (!ok) return res.status(404).json({ error: "Not found." });
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });

  router.get("/tutor/memory", authJwtMiddleware, async (req, res, next) => {
    try {
      const memory = await tutorPg.getUserMemory(req.ccwebUserId);
      res.json({ memory });
    } catch (e) {
      next(e);
    }
  });

  router.put("/tutor/memory", authJwtMiddleware, async (req, res, next) => {
    try {
      await tutorPg.setUserMemory(req.ccwebUserId, {
        summary: req.body?.summary,
        facts: req.body?.facts,
      });
      const memory = await tutorPg.getUserMemory(req.ccwebUserId);
      res.json({ ok: true, memory });
    } catch (e) {
      next(e);
    }
  });

  router.post("/tutor/chat", authJwtMiddleware, async (req, res, next) => {
    try {
      const message = (req.body?.message || "").toString().slice(0, 12000);
      if (!message.trim()) return res.status(400).json({ error: "message required." });
      const userId = req.ccwebUserId;
      const ctx = await coursesPg.getTutorContext(req.body?.courseSlug, req.body?.lessonId || null);
      const profile = await pgUserProfile.findByUserId(userId);
      const memory = await tutorPg.getUserMemory(userId);
      const mode = normalizeMode(req.body?.mode);
      const conv = await resolveConversation(userId, req.body);
      const system = buildTutorSystemPrompt({
        mode,
        ctx,
        profile: mapProfileRow(profile),
        memory,
      });
      const history = await tutorPg.listMessages(conv.id, { limit: 24 });
      const histMsgs = history.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }));
      const messages = [{ role: "system", content: system }, ...histMsgs, { role: "user", content: message }];
      await tutorPg.appendMessage(conv.id, "user", message, { mode });
      const out = await aiExecute.chatCompleteMessages(messages, { maxTokens: 2200 });
      await tutorPg.appendMessage(conv.id, "assistant", out.text, { mode });
      const facts = await aiExecute.extractLearnerFactsFromExchange(message, out.text);
      if (facts.length) await tutorPg.appendMemoryFacts(userId, facts);
      if (out.text.length > 80 && ((history?.length || 0) + 2) % 4 === 0) {
        await tutorPg.mergeRollingAssistantSnippet(userId, out.text);
      }
      if (out.mock) res.setHeader("X-CCWEB-AI-Mock", "1");
      if (out.degradedReason) res.setHeader("X-CCWEB-AI-Degraded", out.degradedReason);
      res.json({
        reply: out.text,
        conversationId: conv.id,
        provider: out.provider,
        model: out.model,
        mock: Boolean(out.mock),
        degradedReason: out.degradedReason || null,
      });
    } catch (e) {
      if (e.code === "AI_NOT_CONFIGURED") return res.status(503).json({ error: e.message, code: e.code });
      if (e.status === 404) return res.status(404).json({ error: e.message });
      next(e);
    }
  });

  router.post("/tutor/stream", authJwtMiddleware, async (req, res, next) => {
    let clientDisconnected = false;
    const abortCtrl = new AbortController();
    const onClose = () => {
      clientDisconnected = true;
      abortCtrl.abort();
    };
    req.on("close", onClose);

    try {
      const message = (req.body?.message || "").toString().slice(0, 12000);
      if (!message.trim()) return res.status(400).json({ error: "message required." });
      const userId = req.ccwebUserId;
      const ctx = await coursesPg.getTutorContext(req.body?.courseSlug, req.body?.lessonId || null);
      const profile = await pgUserProfile.findByUserId(userId);
      const memory = await tutorPg.getUserMemory(userId);
      const mode = normalizeMode(req.body?.mode);
      const conv = await resolveConversation(userId, req.body);
      const system = buildTutorSystemPrompt({
        mode,
        ctx,
        profile: mapProfileRow(profile),
        memory,
      });
      const history = await tutorPg.listMessages(conv.id, { limit: 24 });
      const histMsgs = history.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }));
      const messages = [{ role: "system", content: system }, ...histMsgs, { role: "user", content: message }];
      await tutorPg.appendMessage(conv.id, "user", message, { mode });

      const provider = aiExecute.getApiKey() ? "openai" : "mock";
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("X-Accel-Buffering", "no");
      res.setHeader("X-CCWEB-Conversation-Id", conv.id);
      res.setHeader("X-CCWEB-AI-Provider", provider);
      if (provider === "mock") res.setHeader("X-CCWEB-AI-Mock", "1");

      let full = "";
      for await (const chunk of aiExecute.streamChatCompleteMessages(messages, {
        maxTokens: 2200,
        signal: abortCtrl.signal,
      })) {
        if (clientDisconnected) break;
        full += chunk;
        res.write(chunk);
      }
      if (!clientDisconnected) res.end();

      if (clientDisconnected) {
        logger.info({
          msg: "tutor_stream_client_disconnect",
          conversationId: conv.id,
          userId,
          chars: full.length,
        });
        return;
      }

      if (full.trim()) {
        await tutorPg.appendMessage(conv.id, "assistant", full, { mode });
        const facts = await aiExecute.extractLearnerFactsFromExchange(message, full, { signal: abortCtrl.signal });
        if (facts.length) await tutorPg.appendMemoryFacts(userId, facts);
        if (full.length > 80 && ((history?.length || 0) + 2) % 4 === 0) {
          await tutorPg.mergeRollingAssistantSnippet(userId, full);
        }
      }
    } catch (e) {
      if (!res.headersSent) {
        if (e.code === "AI_NOT_CONFIGURED") return res.status(503).json({ error: e.message, code: e.code });
        if (e.code === "AI_TIMEOUT") return res.status(504).json({ error: e.message, code: e.code });
        if (e.code === "AI_ABORTED") return res.status(499).json({ error: e.message, code: e.code });
        if (e.status === 404) return res.status(404).json({ error: e.message });
        next(e);
      } else {
        try {
          res.end();
        } catch {
          /* ignore */
        }
      }
    } finally {
      req.off("close", onClose);
    }
  });

  router.post("/admin/category", requireAdmin, async (req, res, next) => {
    try {
      await coursesPg.adminUpsertCategory(req.body?.slug, req.body?.name, Number(req.body?.sortOrder) || 0);
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });

  router.post("/admin/course", requireAdmin, async (req, res, next) => {
    try {
      const id = await coursesPg.adminUpsertCourse(req.body || {});
      res.status(201).json({ ok: true, courseId: id });
    } catch (e) {
      next(e);
    }
  });

  router.post("/admin/lesson", requireAdmin, async (req, res, next) => {
    try {
      const id = await coursesPg.adminUpsertLesson(req.body || {});
      res.status(201).json({ ok: true, lessonId: id });
    } catch (e) {
      next(e);
    }
  });

  router.post("/admin/quiz", requireAdmin, async (req, res, next) => {
    try {
      const id = await coursesPg.adminUpsertQuiz(req.body || {});
      res.status(201).json({ ok: true, quizId: id });
    } catch (e) {
      next(e);
    }
  });

  const courseThumbUpload = imageMulter();
  router.post(
    "/admin/courses/:courseId/thumbnail",
    requireAdmin,
    courseThumbUpload.single("file"),
    async (req, res, next) => {
      try {
        if (!req.file?.buffer) return res.status(400).json({ error: "Image file required (field name: file)." });
        const courseId = req.params.courseId;
        const course = await coursesPg.getCourseById(courseId);
        if (!course) return res.status(404).json({ error: "Course not found." });
        const v = validateImageBuffer(req.file.buffer);
        if (!v.ok) return res.status(400).json({ error: v.error });
        const saved = await saveUploadedImage(req.file.buffer, {
          mimetype: req.file.mimetype,
          originalName: req.file.originalname,
          userId: "course",
          kind: "course_thumb",
        });
        const ok = await coursesPg.updateCourseThumbnail(courseId, saved.url);
        if (!ok) return res.status(500).json({ error: "Could not save thumbnail." });
        res.json({ ok: true, thumbnailUrl: saved.url, storage: saved.storage, courseId });
      } catch (e) {
        next(e);
      }
    }
  );

  return router;
}

function mapProfileRow(row) {
  if (!row) return null;
  return {
    displayName: row.display_name || "",
    roles: pgUserProfile.parseRoles(row.roles),
  };
}

async function resolveConversation(userId, body) {
  const cid = body?.conversationId ? String(body.conversationId).trim() : "";
  if (cid) {
    const conv = await tutorPg.findConversationById(userId, cid);
    if (!conv) {
      const err = new Error("Conversation not found.");
      err.status = 404;
      throw err;
    }
    return conv;
  }
  const mode = normalizeMode(body?.mode);
  const courseSlug = body?.courseSlug ? String(body.courseSlug) : "";
  const lessonId = body?.lessonId ? String(body.lessonId) : "";
  const ctx = await coursesPg.getTutorContext(courseSlug || null, lessonId || null);
  const titleHint =
    ctx.course?.title && ctx.lesson?.title
      ? `${ctx.course.title} · ${ctx.lesson.title}`
      : ctx.course?.title || `CCWEB · ${mode}`;
  return tutorPg.getOrCreateScopedConversation(userId, {
    courseSlug,
    lessonId,
    mode,
    titleHint,
    extraMeta: {},
  });
}

module.exports = { createCoursesRouter };
