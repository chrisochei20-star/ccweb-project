/**
 * Dynamic courses: catalog, progress, quizzes, certificates, bookmarks, recommendations.
 */

const crypto = require("crypto");
const { query } = require("./pool");

function usePostgres() {
  return Boolean((process.env.DATABASE_URL || "").trim());
}

function newId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

async function ensureCcwebUser(userId) {
  if (!usePostgres() || !userId) return;
  await query(`INSERT INTO ccweb_users (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`, [userId]);
}

function parseMeta(val) {
  if (!val) return {};
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch {
    return {};
  }
}

function scoreQuiz(questions, answers) {
  if (!Array.isArray(questions) || !questions.length) return { pct: 100, passed: true };
  let ok = 0;
  for (let i = 0; i < questions.length; i += 1) {
    const q = questions[i];
    const exp = Number(q?.correctIndex);
    const got = Number(answers?.[String(i)] ?? answers?.[i]);
    if (!Number.isNaN(exp) && got === exp) ok += 1;
  }
  const pct = (ok / questions.length) * 100;
  return { pct };
}

function sanitizeQuizQuestions(questions) {
  if (!Array.isArray(questions)) return [];
  return questions.map((q, i) => ({
    index: i,
    prompt: q.prompt,
    choices: Array.isArray(q.choices) ? q.choices : [],
  }));
}

async function listCategories() {
  if (!usePostgres()) return [];
  const { rows } = await query(`SELECT slug, name, sort_order FROM ccweb_course_categories ORDER BY sort_order ASC, name ASC`);
  return rows;
}

async function listCourses({ categorySlug, q, publishedOnly = true } = {}) {
  if (!usePostgres()) return [];
  const params = [];
  let sql = `SELECT c.*, COALESCE(e.cnt, 0)::int AS enrollment_count
    FROM ccweb_courses c
    LEFT JOIN (
      SELECT course_id, COUNT(*)::int AS cnt FROM ccweb_course_enrollment GROUP BY course_id
    ) e ON e.course_id = c.id
    WHERE 1=1`;
  if (publishedOnly) {
    sql += ` AND c.published = TRUE`;
  }
  if (categorySlug) {
    params.push(categorySlug);
    sql += ` AND c.category_slug = $${params.length}`;
  }
  if (q) {
    params.push(`%${String(q).slice(0, 80)}%`);
    sql += ` AND (c.title ILIKE $${params.length} OR c.summary ILIKE $${params.length})`;
  }
  sql += ` ORDER BY c.updated_at DESC NULLS LAST LIMIT 200`;
  const { rows } = await query(sql, params);
  return rows.map(mapCourseRow);
}

function mapCourseRow(r) {
  const meta = parseMeta(r.metadata);
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    summary: r.summary,
    categorySlug: r.category_slug,
    level: r.level,
    published: r.published,
    thumbnailUrl: r.thumbnail_url || meta.thumbnailUrl || null,
    metadata: meta,
    enrollmentCount: Number(r.enrollment_count ?? 0),
    updatedAt: r.updated_at,
    createdAt: r.created_at,
  };
}

async function getCourseBySlug(slug, { includeUnpublished = false } = {}) {
  if (!usePostgres() || !slug) return null;
  const params = [slug];
  let sql = `SELECT * FROM ccweb_courses WHERE slug = $1`;
  if (!includeUnpublished) sql += ` AND published = TRUE`;
  const { rows } = await query(sql, params);
  return rows[0] ? mapCourseRow(rows[0]) : null;
}

async function listLessons(courseId) {
  if (!usePostgres()) return [];
  const { rows } = await query(
    `SELECT id, course_id, position, title, content, metadata, video_url, created_at FROM ccweb_lessons WHERE course_id = $1 ORDER BY position ASC, created_at ASC`,
    [courseId]
  );
  return rows.map((r) => {
    const meta = parseMeta(r.metadata);
    return {
      id: r.id,
      courseId: r.course_id,
      position: r.position,
      title: r.title,
      content: r.content,
      metadata: meta,
      videoUrl: r.video_url || meta.videoUrl || null,
      createdAt: r.created_at,
    };
  });
}

async function getLesson(lessonId) {
  if (!usePostgres()) return null;
  const { rows } = await query(`SELECT * FROM ccweb_lessons WHERE id = $1`, [lessonId]);
  const r = rows[0];
  const meta = parseMeta(r.metadata);
  return {
    id: r.id,
    courseId: r.course_id,
    position: r.position,
    title: r.title,
    content: r.content,
    metadata: meta,
    videoUrl: r.video_url || meta.videoUrl || null,
    createdAt: r.created_at,
  };
}

async function getLessonCompletionSet(userId, lessonIds) {
  if (!usePostgres() || !userId || !lessonIds?.length) return new Set();
  const { rows } = await query(`SELECT lesson_id FROM ccweb_lesson_completion WHERE user_id = $1 AND lesson_id = ANY($2::text[])`, [
    userId,
    lessonIds,
  ]);
  return new Set(rows.map((x) => x.lesson_id));
}

async function recalcCourseProgress(userId, courseId) {
  const { rows: tot } = await query(`SELECT COUNT(*)::int AS c FROM ccweb_lessons WHERE course_id = $1`, [courseId]);
  const total = tot[0]?.c || 0;
  const { rows: done } = await query(
    `SELECT COUNT(*)::int AS c FROM ccweb_lesson_completion lc
     JOIN ccweb_lessons l ON l.id = lc.lesson_id
     WHERE l.course_id = $1 AND lc.user_id = $2`,
    [courseId, userId]
  );
  const n = done[0]?.c || 0;
  const pct = total > 0 ? Math.min(100, (n / total) * 100) : 0;
  await query(
    `INSERT INTO ccweb_course_enrollment (user_id, course_id, progress_pct, updated_at)
     VALUES ($1,$2,$3,NOW())
     ON CONFLICT (user_id, course_id) DO UPDATE SET progress_pct = EXCLUDED.progress_pct, updated_at = NOW()`,
    [userId, courseId, pct]
  );
  if (pct >= 99.5) await maybeIssueCertificate(userId, courseId);
  return pct;
}

async function maybeIssueCertificate(userId, courseId) {
  const code = `CCWEB-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
  const id = newId("cert");
  await query(
    `INSERT INTO ccweb_certificates (id, user_id, course_id, code, metadata)
     VALUES ($1,$2,$3,$4,$5::jsonb)
     ON CONFLICT (user_id, course_id) DO NOTHING`,
    [id, userId, courseId, code, JSON.stringify({ tier: "completion", issuedAt: new Date().toISOString() })]
  );
}

async function markLessonComplete(userId, lessonId) {
  if (!usePostgres()) return null;
  await ensureCcwebUser(userId);
  const lesson = await getLesson(lessonId);
  if (!lesson) return null;
  await query(
    `INSERT INTO ccweb_lesson_completion (user_id, lesson_id) VALUES ($1,$2)
     ON CONFLICT (user_id, lesson_id) DO UPDATE SET completed_at = NOW()`,
    [userId, lessonId]
  );
  await query(`UPDATE ccweb_course_enrollment SET last_lesson_id = $3, updated_at = NOW() WHERE user_id = $1 AND course_id = $2`, [
    userId,
    lesson.courseId,
    lessonId,
  ]);
  const pct = await recalcCourseProgress(userId, lesson.courseId);
  const course = await getCourseById(lesson.courseId);
  return {
    lessonId,
    courseId: lesson.courseId,
    courseSlug: course?.slug || null,
    courseTitle: course?.title || null,
    lessonTitle: lesson.title,
    progressPct: pct,
  };
}

async function enrollUser(userId, courseId) {
  if (!usePostgres() || !userId || !courseId) return null;
  await ensureCcwebUser(userId);
  const course = await getCourseById(courseId);
  if (!course || !course.published) return null;
  await query(
    `INSERT INTO ccweb_course_enrollment (user_id, course_id, progress_pct, updated_at)
     VALUES ($1,$2,0,NOW())
     ON CONFLICT (user_id, course_id) DO NOTHING`,
    [userId, courseId]
  );
  return getEnrollment(userId, courseId);
}

async function getEnrollment(userId, courseId) {
  if (!usePostgres() || !userId || !courseId) return null;
  const { rows } = await query(`SELECT * FROM ccweb_course_enrollment WHERE user_id = $1 AND course_id = $2`, [userId, courseId]);
  const r = rows[0];
  if (!r) return null;
  return {
    progressPct: Number(r.progress_pct),
    lastLessonId: r.last_lesson_id,
    updatedAt: r.updated_at,
  };
}

async function listProgress(userId) {
  if (!usePostgres() || !userId) return [];
  await ensureCcwebUser(userId);
  const { rows } = await query(
    `SELECT e.*, c.slug, c.title, c.category_slug
     FROM ccweb_course_enrollment e
     JOIN ccweb_courses c ON c.id = e.course_id
     WHERE e.user_id = $1
     ORDER BY e.updated_at DESC`,
    [userId]
  );
  return rows.map((r) => ({
    courseId: r.course_id,
    slug: r.slug,
    title: r.title,
    categorySlug: r.category_slug,
    progressPct: Number(r.progress_pct),
    lastLessonId: r.last_lesson_id,
    updatedAt: r.updated_at,
  }));
}

async function getQuizByLessonId(lessonId) {
  if (!usePostgres()) return null;
  const { rows } = await query(`SELECT * FROM ccweb_quizzes WHERE lesson_id = $1 LIMIT 1`, [lessonId]);
  const r = rows[0];
  if (!r) return null;
  let questions = r.questions;
  if (typeof questions === "string") questions = JSON.parse(questions);
  return {
    id: r.id,
    lessonId: r.lesson_id,
    title: r.title,
    questions: Array.isArray(questions) ? questions : [],
    passPct: Number(r.pass_pct),
  };
}

async function submitQuizAttempt(userId, quizId, answers) {
  if (!usePostgres()) return null;
  await ensureCcwebUser(userId);
  const { rows } = await query(`SELECT * FROM ccweb_quizzes WHERE id = $1`, [quizId]);
  const r = rows[0];
  if (!r) return null;
  let questions = r.questions;
  if (typeof questions === "string") questions = JSON.parse(questions);
  const passPct = Number(r.pass_pct || 70);
  const { pct } = scoreQuiz(questions, answers);
  const passed = pct >= passPct;
  const id = newId("qta");
  await query(
    `INSERT INTO ccweb_quiz_attempts (id, quiz_id, user_id, score_pct, passed, answers)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb)`,
    [id, quizId, userId, pct, passed, JSON.stringify(answers || {})]
  );
  return { attemptId: id, scorePct: pct, passed, passThreshold: passPct };
}

async function listBookmarks(userId) {
  if (!usePostgres() || !userId) return [];
  await ensureCcwebUser(userId);
  const { rows } = await query(
    `SELECT c.*, b.created_at AS bookmarked_at
     FROM ccweb_course_bookmarks b
     JOIN ccweb_courses c ON c.id = b.course_id
     WHERE b.user_id = $1 AND c.published = TRUE
     ORDER BY b.created_at DESC`,
    [userId]
  );
  return rows.map((r) => ({ ...mapCourseRow(r), bookmarkedAt: r.bookmarked_at }));
}

async function addBookmark(userId, courseId) {
  if (!usePostgres()) return false;
  await ensureCcwebUser(userId);
  await query(
    `INSERT INTO ccweb_course_bookmarks (user_id, course_id) VALUES ($1,$2)
     ON CONFLICT DO NOTHING`,
    [userId, courseId]
  );
  return true;
}

async function removeBookmark(userId, courseId) {
  if (!usePostgres()) return false;
  await query(`DELETE FROM ccweb_course_bookmarks WHERE user_id = $1 AND course_id = $2`, [userId, courseId]);
  return true;
}

async function listCertificates(userId) {
  if (!usePostgres() || !userId) return [];
  const { rows } = await query(
    `SELECT cert.*, c.slug, c.title
     FROM ccweb_certificates cert
     JOIN ccweb_courses c ON c.id = cert.course_id
     WHERE cert.user_id = $1
     ORDER BY cert.created_at DESC`,
    [userId]
  );
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    courseId: r.course_id,
    slug: r.slug,
    title: r.title,
    createdAt: r.created_at,
    metadata: parseMeta(r.metadata),
  }));
}

async function listRecommended(userId, { categorySlug, excludeCourseId, limit = 6 } = {}) {
  if (!usePostgres()) return [];
  const params = [];
  let sql = `SELECT c.*, COALESCE(e.cnt, 0)::int AS enrollment_count
    FROM ccweb_courses c
    LEFT JOIN (SELECT course_id, COUNT(*)::int AS cnt FROM ccweb_course_enrollment GROUP BY course_id) e ON e.course_id = c.id
    WHERE c.published = TRUE`;
  if (categorySlug) {
    params.push(categorySlug);
    sql += ` AND c.category_slug = $${params.length}`;
  }
  if (excludeCourseId) {
    params.push(excludeCourseId);
    sql += ` AND c.id <> $${params.length}`;
  }
  sql += ` ORDER BY enrollment_count DESC, c.updated_at DESC LIMIT ${Math.min(24, Math.max(1, limit))}`;
  const { rows } = await query(sql, params);
  return rows.map(mapCourseRow);
}

async function getTutorContext(courseSlug, lessonId) {
  let course = null;
  let lesson = null;
  if (courseSlug) course = await getCourseBySlug(courseSlug);
  if (lessonId) lesson = await getLesson(lessonId);
  if (lesson && !course) course = await getCourseById(lesson.courseId);
  return { course, lesson };
}

async function getCourseById(id) {
  const { rows } = await query(`SELECT * FROM ccweb_courses WHERE id = $1`, [id]);
  return rows[0] ? mapCourseRow(rows[0]) : null;
}

async function adminUpsertCourse(payload) {
  const id = (payload.id || newId("crs")).toString().slice(0, 64);
  const slug = normalizeSlug(payload.slug || payload.title || id);
  const title = String(payload.title || "Untitled").slice(0, 300);
  const summary = String(payload.summary || "").slice(0, 4000);
  const categorySlug = String(payload.categorySlug || "general").slice(0, 64);
  const level = String(payload.level || "beginner").slice(0, 32);
  const published = payload.published !== false;
  const meta = typeof payload.metadata === "object" ? payload.metadata : {};
  const thumb =
    payload.thumbnailUrl != null && String(payload.thumbnailUrl).trim()
      ? String(payload.thumbnailUrl).trim().slice(0, 2000)
      : null;
  await query(
    `INSERT INTO ccweb_courses (id, slug, title, summary, metadata, category_slug, level, published, thumbnail_url, updated_at)
     VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,NOW())
     ON CONFLICT (slug) DO UPDATE SET
       title = EXCLUDED.title,
       summary = EXCLUDED.summary,
       metadata = EXCLUDED.metadata,
       category_slug = EXCLUDED.category_slug,
       level = EXCLUDED.level,
       published = EXCLUDED.published,
       thumbnail_url = COALESCE(EXCLUDED.thumbnail_url, ccweb_courses.thumbnail_url),
       updated_at = NOW()
     RETURNING id`,
    [id, slug, title, summary, JSON.stringify(meta), categorySlug, level, published, thumb]
  );
  const { rows } = await query(`SELECT id FROM ccweb_courses WHERE slug = $1`, [slug]);
  return rows[0]?.id || id;
}

async function updateCourseThumbnail(courseId, thumbnailUrl) {
  if (!usePostgres() || !courseId) return false;
  const url = String(thumbnailUrl || "").trim().slice(0, 2000);
  if (!url) return false;
  const { rowCount } = await query(
    `UPDATE ccweb_courses SET thumbnail_url = $2, updated_at = NOW() WHERE id = $1`,
    [courseId, url]
  );
  return rowCount > 0;
}

function normalizeSlug(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `course-${Date.now()}`;
}

async function adminUpsertLesson(payload) {
  const courseId = payload.courseId;
  if (!courseId) throw new Error("courseId required");
  const id = (payload.id || newId("les")).toString().slice(0, 64);
  const title = String(payload.title || "Lesson").slice(0, 300);
  const content = String(payload.content || "").slice(0, 500000);
  const position = Number(payload.position) || 0;
  const meta = typeof payload.metadata === "object" ? payload.metadata : {};
  const videoUrl =
    payload.videoUrl != null && String(payload.videoUrl).trim()
      ? String(payload.videoUrl).trim().slice(0, 2000)
      : null;
  await query(
    `INSERT INTO ccweb_lessons (id, course_id, position, title, content, metadata, video_url, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,NOW())
     ON CONFLICT (id) DO UPDATE SET
       course_id = EXCLUDED.course_id,
       position = EXCLUDED.position,
       title = EXCLUDED.title,
       content = EXCLUDED.content,
       metadata = EXCLUDED.metadata,
       video_url = COALESCE(EXCLUDED.video_url, ccweb_lessons.video_url),
       updated_at = NOW()`,
    [id, courseId, position, title, content, JSON.stringify(meta), videoUrl]
  );
  return id;
}

async function adminUpsertQuiz(payload) {
  const lessonId = payload.lessonId;
  if (!lessonId) throw new Error("lessonId required");
  const id = (payload.id || newId("qz")).toString().slice(0, 64);
  const title = String(payload.title || "Quiz").slice(0, 200);
  const questions = Array.isArray(payload.questions) ? payload.questions : [];
  const passPct = Number(payload.passPct || 70);
  await query(
    `INSERT INTO ccweb_quizzes (id, lesson_id, title, questions, pass_pct)
     VALUES ($1,$2,$3,$4::jsonb,$5)
     ON CONFLICT (id) DO UPDATE SET
       lesson_id = EXCLUDED.lesson_id,
       title = EXCLUDED.title,
       questions = EXCLUDED.questions,
       pass_pct = EXCLUDED.pass_pct`,
    [id, lessonId, title, JSON.stringify(questions), passPct]
  );
  return id;
}

async function adminUpsertCategory(slug, name, sortOrder = 0) {
  const s = normalizeSlug(slug || name);
  await query(
    `INSERT INTO ccweb_course_categories (slug, name, sort_order) VALUES ($1,$2,$3)
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order`,
    [s, String(name || s).slice(0, 120), sortOrder]
  );
}

module.exports = {
  usePostgres,
  ensureCcwebUser,
  scoreQuiz,
  sanitizeQuizQuestions,
  listCategories,
  listCourses,
  getCourseBySlug,
  getCourseById,
  listLessons,
  getLesson,
  getLessonCompletionSet,
  markLessonComplete,
  listProgress,
  getQuizByLessonId,
  submitQuizAttempt,
  listBookmarks,
  addBookmark,
  removeBookmark,
  listCertificates,
  listRecommended,
  getTutorContext,
  getEnrollment,
  enrollUser,
  adminUpsertCourse,
  adminUpsertLesson,
  adminUpsertQuiz,
  adminUpsertCategory,
  updateCourseThumbnail,
};
