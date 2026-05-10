/**
 * /api/v1/courses — catalog, progress, tutor (stream), admin CRUD.
 */

const express = require("express");
const coursesPg = require("./db/persistenceCourses");
const aiExecute = require("./services/aiExecute");

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

  router.post("/tutor/chat", authJwtMiddleware, async (req, res, next) => {
    try {
      const message = (req.body?.message || "").toString().slice(0, 12000);
      if (!message.trim()) return res.status(400).json({ error: "message required." });
      const ctx = await coursesPg.getTutorContext(req.body?.courseSlug, req.body?.lessonId || null);
      const system = buildTutorSystemPrompt(ctx);
      const out = await aiExecute.chatComplete(system, message, { maxTokens: 1800 });
      res.json({
        reply: out.text,
        provider: out.provider,
        model: out.model,
        mock: Boolean(out.mock),
      });
    } catch (e) {
      if (e.code === "AI_NOT_CONFIGURED") return res.status(503).json({ error: e.message, code: e.code });
      next(e);
    }
  });

  router.post("/tutor/stream", authJwtMiddleware, async (req, res, next) => {
    try {
      const message = (req.body?.message || "").toString().slice(0, 12000);
      if (!message.trim()) return res.status(400).json({ error: "message required." });
      const ctx = await coursesPg.getTutorContext(req.body?.courseSlug, req.body?.lessonId || null);
      const system = buildTutorSystemPrompt(ctx);
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("X-Accel-Buffering", "no");
      for await (const chunk of aiExecute.streamChatComplete(system, message, { maxTokens: 2000 })) {
        res.write(chunk);
      }
      res.end();
    } catch (e) {
      if (!res.headersSent) {
        if (e.code === "AI_NOT_CONFIGURED") return res.status(503).json({ error: e.message, code: e.code });
        next(e);
      } else {
        try {
          res.end();
        } catch {
          /* ignore */
        }
      }
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

  return router;
}

function buildTutorSystemPrompt(ctx) {
  const parts = [
    "You are an experienced CCWEB course tutor. Explain clearly, use short sections, and give concrete examples.",
    "Stay grounded in the lesson/course context when provided.",
  ];
  if (ctx.course) {
    parts.push(`Course: ${ctx.course.title}. Summary: ${ctx.course.summary?.slice(0, 1200) || ""}`);
    parts.push(`Level: ${ctx.course.level || "general"} · Category: ${ctx.course.categorySlug || "general"}`);
  }
  if (ctx.lesson) {
    parts.push(`Current lesson: ${ctx.lesson.title}`);
    parts.push(`Lesson content excerpt:\n${(ctx.lesson.content || "").slice(0, 8000)}`);
  }
  return parts.join("\n\n");
}

module.exports = { createCoursesRouter };
