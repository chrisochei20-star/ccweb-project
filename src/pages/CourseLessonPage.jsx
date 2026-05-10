import { ArrowLeft, CheckCircle2, Loader2, Send, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import {
  fetchCourseDetail,
  fetchLessonQuiz,
  postLessonComplete,
  postQuizSubmit,
  streamTutor,
} from "../api/coursesApi";

export function CourseLessonPage() {
  const { slug, lessonId } = useParams();
  const navigate = useNavigate();
  const { user } = useOutletContext() || {};
  const [course, setCourse] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [completed, setCompleted] = useState(new Set());
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [tutorMsg, setTutorMsg] = useState("");
  const [tutorOut, setTutorOut] = useState("");
  const [tutorBusy, setTutorBusy] = useState(false);

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

  async function markComplete() {
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
    if (!tutorMsg.trim()) return;
    setTutorBusy(true);
    setTutorOut("");
    setErr(null);
    try {
      await streamTutor({
        message: tutorMsg,
        courseSlug: slug,
        lessonId,
        onDelta: (_d, full) => setTutorOut(full),
      });
    } catch (e) {
      setErr(e.message);
    } finally {
      setTutorBusy(false);
    }
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
          AI tutor (streaming)
        </h2>
        <p className="mt-1 text-xs text-ccweb-muted">
          Answers use your course &amp; lesson context. Configure <code className="text-ccweb-cyan">OPENAI_API_KEY</code> on the API for live output.
        </p>
        {!user && <p className="mt-2 text-sm text-amber-200">Sign in to use the tutor.</p>}
        {user && (
          <>
            <textarea
              className="ccweb-input mt-3 min-h-[88px] text-sm"
              placeholder="Ask a question about this lesson…"
              value={tutorMsg}
              onChange={(e) => setTutorMsg(e.target.value)}
            />
            <button
              type="button"
              disabled={tutorBusy}
              className="mt-2 flex items-center gap-2 ccweb-gradient-btn text-sm"
              onClick={runTutorStream}
            >
              {tutorBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Stream answer
            </button>
            {tutorOut && (
              <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-4 text-sm whitespace-pre-wrap text-white/95">
                {tutorOut}
              </div>
            )}
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
