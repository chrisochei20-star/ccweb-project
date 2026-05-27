import { ArrowLeft, CheckCircle2, Loader2, Send, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import {
  fetchCourseDetail,
  fetchLessonQuiz,
  fetchTutorMessages,
  ensureTutorConversation,
  postLessonComplete,
  postQuizSubmit,
  streamTutor,
} from "../api/coursesApi";
import { getSessionToken } from "../session";
import { useStaleLoadingGuard } from "../hooks/useStaleLoadingGuard";

export function CourseLessonPage() {
  const { slug, lessonId } = useParams();
  const navigate = useNavigate();
  const { user, authHydrated } = useOutletContext() || {};
  const [course, setCourse] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [completed, setCompleted] = useState(new Set());
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const loadStalled = useStaleLoadingGuard(loading);
  const [err, setErr] = useState(null);
  const [tutorMsg, setTutorMsg] = useState("");
  const [tutorBusy, setTutorBusy] = useState(false);
  const [tutorConvId, setTutorConvId] = useState(null);
  const [tutorMessages, setTutorMessages] = useState([]);

  useEffect(() => {
    let c = false;
    (async () => {
      setLoading(true);
      setErr(null);
      setQuiz(null);
      setQuizResult(null);
      setAnswers({});
      try {
        const d = await fetchCourseDetail(slug);
        if (c) return;
        setCourse(d.course);
        setLessons(d.lessons || []);
        setCompleted(new Set(d.completedLessonIds || []));
        const les = (d.lessons || []).find((x) => x.id === lessonId);
        setLesson(les || null);
        if (les) {
          try {
            const qz = await fetchLessonQuiz(les.id);
            if (!c) setQuiz(qz);
          } catch {
            if (!c) setQuiz(null);
          }
        }
      } catch (e) {
        if (!c) setErr(e.message || String(e));
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [slug, lessonId]);

  useEffect(() => {
    if (!authHydrated || !user || !lessonId || !slug) return;
    let c = false;
    (async () => {
      try {
        const conv = await ensureTutorConversation({ mode: "lesson", courseSlug: slug, lessonId });
        if (c) return;
        setTutorConvId(conv.id);
        const data = await fetchTutorMessages(conv.id);
        setTutorMessages(data.messages || []);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      c = true;
    };
  }, [user?.id, slug, lessonId]);

  async function markComplete() {
    if (!authHydrated) return;
    if (!user || !lesson) {
      navigate("/login");
      return;
    }
    try {
      const out = await postLessonComplete(lesson.id);
      setCompleted((prev) => new Set([...prev, lesson.id]));
      if (out.progressPct != null) {
        /* optional toast */
      }
    } catch (e) {
      setErr(e.message);
    }
  }

  async function submitQuiz() {
    if (!user || !quiz) return;
    try {
      const res = await postQuizSubmit(quiz.id, answers);
      setQuizResult(res);
    } catch (e) {
      setErr(e.message);
    }
  }

  async function runTutorStream() {
    if (!tutorMsg.trim() || !user) return;
    setTutorBusy(true);
    setErr(null);
    const replyId = `tmp_${Date.now()}`;
    const userLine = tutorMsg.trim();
    setTutorMsg("");
    setTutorMessages((prev) => [
      ...prev,
      { role: "user", content: userLine, id: `local_${Date.now()}` },
      { role: "assistant", content: "", id: replyId },
    ]);
    try {
      const out = await streamTutor({
        message: userLine,
        courseSlug: slug,
        lessonId,
        mode: "lesson",
        conversationId: tutorConvId,
        onDelta: (_d, full) => {
          setTutorMessages((prev) =>
            prev.map((m) => (m.id === replyId ? { ...m, content: full } : m))
          );
        },
      });
      if (out.conversationId) setTutorConvId(out.conversationId);
      const data = await fetchTutorMessages(out.conversationId || tutorConvId);
      setTutorMessages(data.messages || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setTutorBusy(false);
    }
  }

  if (loading && loadStalled) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 px-4 text-center text-ccweb-muted">
        <p className="text-rose-200/90">This lesson is taking too long to load.</p>
        <Link to="/courses" className="text-ccweb-cyan underline">
          Back to courses
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-ccweb-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading lesson…
      </div>
    );
  }

  if (err && !lesson) {
    return (
      <div className="px-4 py-10 text-center text-rose-200">
        {err}
        <Link to={`/courses/${encodeURIComponent(slug)}`} className="mt-4 block text-ccweb-cyan">
          Back to course
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-3 pb-24 pt-4">
      <Link
        to={`/courses/${encodeURIComponent(slug)}`}
        className="inline-flex items-center gap-2 text-sm text-ccweb-muted hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Course overview
      </Link>

      <header className="ccweb-glass rounded-2xl p-5">
        <h1 className="text-xl font-bold text-white">{lesson?.title || "Lesson"}</h1>
        <p className="mt-1 text-xs text-ccweb-muted">{course?.title}</p>
      </header>

      <article className="ccweb-glass rounded-2xl p-5">
        <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed text-white/90">
          {lesson?.content || ""}
        </div>
        {user && lesson && (
          <button
            type="button"
            className="mt-4 flex items-center gap-2 ccweb-gradient-btn text-sm"
            onClick={markComplete}
          >
            <CheckCircle2 className="h-4 w-4" />
            {completed.has(lesson.id) ? "Marked complete" : "Mark lesson complete"}
          </button>
        )}
      </article>

      {quiz && (
        <section className="ccweb-glass rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-white">{quiz.title}</h2>
          <p className="text-xs text-ccweb-muted">Pass at {quiz.passPct}%</p>
          <div className="mt-4 space-y-4">
            {quiz.questions.map((q) => (
              <div key={q.index}>
                <p className="text-sm font-medium text-white">{q.prompt}</p>
                <div className="mt-2 space-y-1">
                  {q.choices.map((ch, idx) => (
                    <label key={idx} className="flex cursor-pointer items-center gap-2 text-sm text-ccweb-muted">
                      <input
                        type="radio"
                        name={`q-${q.index}`}
                        checked={answers[q.index] === idx}
                        onChange={() => setAnswers((a) => ({ ...a, [q.index]: idx }))}
                      />
                      {ch}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {user && (
            <button type="button" className="mt-4 ccweb-outline-btn text-sm" onClick={submitQuiz}>
              Submit quiz
            </button>
          )}
          {quizResult && (
            <p className={`mt-3 text-sm ${quizResult.passed ? "text-emerald-300" : "text-rose-300"}`}>
              Score: {quizResult.scorePct?.toFixed(0)}% · {quizResult.passed ? "Passed" : "Try again"}
            </p>
          )}
        </section>
      )}

      <section className="ccweb-glass rounded-2xl p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Sparkles className="h-5 w-5 text-ccweb-violet" />
          AI tutor (OpenAI · streaming · saved thread)
        </h2>
        <p className="mt-1 text-xs text-ccweb-muted">
          Full lesson context, your profile, and long-term memory power replies when{" "}
          <code className="text-ccweb-cyan">OPENAI_API_KEY</code> and PostgreSQL are set.
        </p>
        {!authHydrated && getSessionToken() && (
          <p className="mt-2 flex items-center gap-2 text-sm text-ccweb-muted">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
            Checking session…
          </p>
        )}
        {authHydrated && !user && getSessionToken() && (
          <p className="mt-2 flex items-center gap-2 text-sm text-ccweb-muted">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
            Syncing account…
          </p>
        )}
        {authHydrated && !user && !getSessionToken() && (
          <p className="mt-2 text-sm text-amber-200">Sign in to use the tutor.</p>
        )}
        {user && (
          <>
            <div className="mt-4 max-h-64 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-3 text-sm">
              {tutorMessages.length === 0 && (
                <p className="text-xs text-ccweb-muted">No messages yet — ask about this lesson.</p>
              )}
              {tutorMessages.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={
                      "max-w-[92%] rounded-xl px-3 py-2 whitespace-pre-wrap " +
                      (m.role === "user"
                        ? "bg-ccweb-cyan/25 text-white"
                        : "border border-white/10 bg-white/5 text-white/95")
                    }
                  >
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
            <textarea
              className="ccweb-input mt-3 min-h-[88px] text-sm"
              placeholder="Ask a question about this lesson…"
              value={tutorMsg}
              onChange={(e) => setTutorMsg(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  runTutorStream();
                }
              }}
            />
            <button
              type="button"
              disabled={tutorBusy}
              className="mt-2 flex items-center gap-2 ccweb-gradient-btn text-sm"
              onClick={runTutorStream}
            >
              {tutorBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send (stream)
            </button>
          </>
        )}
      </section>

      <nav className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
        {(lessons || []).map((l) => (
          <Link
            key={l.id}
            to={`/courses/${encodeURIComponent(slug)}/lesson/${encodeURIComponent(l.id)}`}
            className={`rounded-lg px-3 py-1.5 text-xs ${
              l.id === lessonId ? "bg-white/15 text-white" : "text-ccweb-muted hover:bg-white/5"
            }`}
          >
            {l.title}
          </Link>
        ))}
      </nav>
    </div>
  );
}
