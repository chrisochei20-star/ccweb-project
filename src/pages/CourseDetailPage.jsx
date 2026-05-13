import { Award, Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import {
  deleteBookmark,
  fetchCourseDetail,
  fetchMyBookmarks,
  postBookmark,
  postEnrollCourseSlug,
} from "../api/coursesApi";
import { assetsUrl } from "../config/env";
import { toast } from "../lib/toastBus";

export function CourseDetailPage() {
  const { slug } = useParams();
  const { user } = useOutletContext() || {};
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    let c = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const d = await fetchCourseDetail(slug);
        if (!c) setData(d);
      } catch (e) {
        if (!c) setErr(e.message || String(e));
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!data?.course || !user) return;
    let c = false;
    (async () => {
      try {
        const bm = await fetchMyBookmarks();
        if (!c) setBookmarked(bm.some((b) => b.id === data.course.id));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      c = true;
    };
  }, [data?.course?.id, user]);

  async function toggleBookmark() {
    if (!user || !data?.course) return;
    try {
      if (bookmarked) {
        await deleteBookmark(data.course.id);
        setBookmarked(false);
      } else {
        await postBookmark(data.course.id);
        setBookmarked(true);
      }
    } catch (e) {
      setErr(e.message);
    }
  }

  async function enroll() {
    if (!user || !slug) return;
    setErr(null);
    try {
      await postEnrollCourseSlug(slug);
      const d = await fetchCourseDetail(slug);
      setData(d);
      toast.success("Enrolled. Complete lessons to earn your certificate.");
    } catch (e) {
      const m = e.message || "Enrollment failed";
      setErr(m);
      toast.error(m);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-ccweb-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading course…
      </div>
    );
  }

  if (err || !data?.course) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center">
        <p className="text-rose-200">{err || "Course not found."}</p>
        <Link to="/courses" className="mt-4 inline-block ccweb-gradient-btn text-sm">
          Back to catalog
        </Link>
      </div>
    );
  }

  const { course, lessons, completedLessonIds, enrollment, recommended } = data;
  const done = new Set(completedLessonIds || []);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-3 pb-20 pt-4">
      {course.thumbnailUrl ? (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <img
            src={assetsUrl(course.thumbnailUrl)}
            alt=""
            className="aspect-[21/9] max-h-56 w-full object-cover md:max-h-72"
          />
        </div>
      ) : null}
      <div className="ccweb-glass rounded-2xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase text-ccweb-cyan">{course.categorySlug} · {course.level}</p>
            <h1 className="mt-1 text-2xl font-bold text-white">{course.title}</h1>
            <p className="mt-2 text-sm text-ccweb-muted">{course.summary}</p>
            {enrollment && (
              <p className="mt-2 text-sm text-emerald-200/90">
                Your progress: {Math.round(enrollment.progressPct || 0)}%
              </p>
            )}
            {!enrollment && user && (
              <button type="button" className="mt-3 ccweb-outline-btn text-sm" onClick={enroll}>
                Enroll in this course
              </button>
            )}
          </div>
          {user && (
            <button
              type="button"
              onClick={toggleBookmark}
              className="flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm text-white hover:bg-white/10"
            >
              {bookmarked ? <BookmarkCheck className="h-4 w-4 text-ccweb-cyan" /> : <Bookmark className="h-4 w-4" />}
              {bookmarked ? "Saved" : "Bookmark"}
            </button>
          )}
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-white">Lessons</h2>
        <ol className="space-y-2">
          {(lessons || []).map((les, i) => (
            <li key={les.id}>
              <Link
                to={`/courses/${encodeURIComponent(course.slug)}/lesson/${encodeURIComponent(les.id)}`}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm hover:border-ccweb-cyan/40"
              >
                <span className="text-white">
                  {i + 1}. {les.title}
                </span>
                {done.has(les.id) ? (
                  <span className="text-xs text-emerald-300">Done</span>
                ) : (
                  <span className="text-xs text-ccweb-muted">Start</span>
                )}
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {user && (
        <section className="rounded-2xl border border-white/10 bg-black/25 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Award className="h-4 w-4 text-amber-300" />
            Certificates
          </h3>
          <p className="mt-1 text-xs text-ccweb-muted">
            Complete all lessons to earn a certificate (auto-issued at ~100% progress).
          </p>
          <Link to="/courses" className="mt-2 inline-block text-xs text-ccweb-cyan hover:underline">
            View catalog
          </Link>
        </section>
      )}

      {recommended?.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-white">More in this track</h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {recommended.map((c) => (
              <li key={c.id}>
                <Link to={`/courses/${encodeURIComponent(c.slug)}`} className="block rounded-xl border border-white/10 px-3 py-2 text-sm text-white hover:bg-white/5">
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
