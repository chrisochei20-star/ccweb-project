import { useState } from "react";
import { apiUrl } from "../config/env";

/**
 * Admin tools for categories, courses, lessons, quizzes (requires CCWEB_ADMIN_KEY + X-CCWEB-Admin).
 */
export function CourseAdminDashboard() {
  const [key, setKey] = useState(() => sessionStorage.getItem("ccweb_admin_key") || "");
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const [catSlug, setCatSlug] = useState("defi");
  const [catName, setCatName] = useState("DeFi");

  const [courseSlug, setCourseSlug] = useState("my-course");
  const [courseTitle, setCourseTitle] = useState("My AI Course");
  const [courseSummary, setCourseSummary] = useState("Short summary for catalog.");
  const [courseCategory, setCourseCategory] = useState("crypto");

  const [lessonCourseId, setLessonCourseId] = useState("");
  const [lessonTitle, setLessonTitle] = useState("Lesson 1");
  const [lessonContent, setLessonContent] = useState("# Hello\n\nLesson body (markdown-style plain text).");
  const [lessonPos, setLessonPos] = useState(0);

  const [quizLessonId, setQuizLessonId] = useState("");
  const [quizJson, setQuizJson] = useState(
    JSON.stringify(
      [
        {
          prompt: "Sample question?",
          choices: ["A", "B", "C"],
          correctIndex: 1,
        },
      ],
      null,
      2
    )
  );

  function headers() {
    sessionStorage.setItem("ccweb_admin_key", key);
    return {
      "Content-Type": "application/json",
      "X-CCWEB-Admin": key,
    };
  }

  async function post(path, body) {
    const res = await fetch(apiUrl(path), {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || res.statusText);
    return data;
  }

  async function saveCategory(e) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      await post("/api/v1/courses/admin/category", { slug: catSlug, name: catName });
      setMsg("Category saved.");
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveCourse(e) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const data = await post("/api/v1/courses/admin/course", {
        slug: courseSlug,
        title: courseTitle,
        summary: courseSummary,
        categorySlug: courseCategory,
        level: "beginner",
        published: true,
      });
      setMsg(`Course saved. id: ${data.courseId}`);
      if (data.courseId) setLessonCourseId(data.courseId);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveLesson(e) {
    e.preventDefault();
    if (!lessonCourseId.trim()) {
      setErr("Set course id (save a course first or paste id).");
      return;
    }
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const data = await post("/api/v1/courses/admin/lesson", {
        courseId: lessonCourseId.trim(),
        title: lessonTitle,
        content: lessonContent,
        position: Number(lessonPos) || 0,
      });
      setMsg(`Lesson saved. id: ${data.lessonId}`);
      if (data.lessonId) setQuizLessonId(data.lessonId);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveQuiz(e) {
    e.preventDefault();
    if (!quizLessonId.trim()) {
      setErr("Set lesson id.");
      return;
    }
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      let questions;
      try {
        questions = JSON.parse(quizJson);
      } catch {
        throw new Error("Quiz JSON invalid.");
      }
      const data = await post("/api/v1/courses/admin/quiz", {
        lessonId: quizLessonId.trim(),
        title: "Lesson quiz",
        questions,
        passPct: 70,
      });
      setMsg(`Quiz saved. id: ${data.quizId}`);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="learning-page mx-auto max-w-3xl px-3 pb-24 pt-4">
      <header className="page-header">
        <h1 className="section-title">Course admin</h1>
        <p className="muted">
          Uses <code>X-CCWEB-Admin</code> header matching server <code>CCWEB_ADMIN_KEY</code>. PostgreSQL required.
        </p>
      </header>

      <article className="panel learning-glass mb-6">
        <label className="block text-xs text-ccweb-muted">Admin key</label>
        <input
          className="ccweb-input mt-1 font-mono text-sm"
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          autoComplete="off"
        />
      </article>

      {msg && <p className="mb-3 text-sm text-emerald-300">{msg}</p>}
      {err && <p className="mb-3 text-sm text-rose-300">{err}</p>}

      <div className="space-y-8">
        <form onSubmit={saveCategory} className="panel learning-glass space-y-2">
          <h3 className="text-lg font-semibold text-white">Category</h3>
          <input className="ccweb-input" placeholder="slug" value={catSlug} onChange={(e) => setCatSlug(e.target.value)} />
          <input className="ccweb-input" placeholder="Display name" value={catName} onChange={(e) => setCatName(e.target.value)} />
          <button type="submit" className="btn btn-primary" disabled={busy}>
            Save category
          </button>
        </form>

        <form onSubmit={saveCourse} className="panel learning-glass space-y-2">
          <h3 className="text-lg font-semibold text-white">Course</h3>
          <input className="ccweb-input" placeholder="slug" value={courseSlug} onChange={(e) => setCourseSlug(e.target.value)} />
          <input className="ccweb-input" placeholder="Title" value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} />
          <textarea
            className="ccweb-input min-h-[72px]"
            placeholder="Summary"
            value={courseSummary}
            onChange={(e) => setCourseSummary(e.target.value)}
          />
          <input
            className="ccweb-input"
            placeholder="category slug"
            value={courseCategory}
            onChange={(e) => setCourseCategory(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={busy}>
            Upsert course
          </button>
        </form>

        <form onSubmit={saveLesson} className="panel learning-glass space-y-2">
          <h3 className="text-lg font-semibold text-white">Lesson</h3>
          <input
            className="ccweb-input font-mono text-sm"
            placeholder="course id (from upsert response)"
            value={lessonCourseId}
            onChange={(e) => setLessonCourseId(e.target.value)}
          />
          <input className="ccweb-input" placeholder="Title" value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} />
          <textarea
            className="ccweb-input min-h-[120px] font-mono text-sm"
            placeholder="Content"
            value={lessonContent}
            onChange={(e) => setLessonContent(e.target.value)}
          />
          <input
            type="number"
            className="ccweb-input"
            placeholder="position"
            value={lessonPos}
            onChange={(e) => setLessonPos(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={busy}>
            Upsert lesson
          </button>
        </form>

        <form onSubmit={saveQuiz} className="panel learning-glass space-y-2">
          <h3 className="text-lg font-semibold text-white">Quiz (JSON questions)</h3>
          <input
            className="ccweb-input font-mono text-sm"
            placeholder="lesson id"
            value={quizLessonId}
            onChange={(e) => setQuizLessonId(e.target.value)}
          />
          <textarea
            className="ccweb-input min-h-[160px] font-mono text-xs"
            value={quizJson}
            onChange={(e) => setQuizJson(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={busy}>
            Upsert quiz
          </button>
        </form>
      </div>
    </section>
  );
}
