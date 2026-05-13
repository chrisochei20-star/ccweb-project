import { BookOpen, GraduationCap, Radio } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { fetchMyCertificates, fetchMyProgress } from "../api/coursesApi";
import { LearningHubPage } from "../learning/LearningHubPage";
import { CourseCatalogPage } from "./CourseCatalogPage";
import { Skeleton } from "../components/ui/Skeleton";
import { toast } from "../lib/toastBus";

export function LearnShellPage() {
  const { user } = useOutletContext() || {};
  const [tab, setTab] = useState("live");
  const [progress, setProgress] = useState([]);
  const [certs, setCerts] = useState([]);
  const [loadingProg, setLoadingProg] = useState(false);

  useEffect(() => {
    if (tab !== "progress" || !user) return;
    let c = false;
    setLoadingProg(true);
    Promise.all([fetchMyProgress(), fetchMyCertificates()])
      .then(([p, cert]) => {
        if (!c) {
          setProgress(p);
          setCerts(cert);
        }
      })
      .catch((e) => {
        if (!c) toast.error(e.message || "Could not load progress");
      })
      .finally(() => {
        if (!c) setLoadingProg(false);
      });
    return () => {
      c = true;
    };
  }, [tab, user]);

  return (
    <div className="mx-auto max-w-3xl px-3 pb-6 pt-3 md:max-w-5xl">
      <header className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-ccweb-cyan">Learn</p>
        <h1 className="mt-1 text-2xl font-bold text-white md:text-3xl">AI Academy</h1>
        <p className="mt-1 max-w-2xl text-sm text-ccweb-muted">
          Live sessions, structured courses with enrollments and saved progress, certificates when you finish — backed by
          PostgreSQL.
        </p>
      </header>

      <div className="mb-5 flex gap-2 rounded-2xl border border-white/10 bg-black/25 p-1">
        <button
          type="button"
          onClick={() => setTab("live")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
            tab === "live"
              ? "bg-gradient-to-r from-ccweb-cyan/30 to-ccweb-violet/25 text-white"
              : "text-ccweb-muted hover:text-white/90"
          }`}
        >
          <Radio className="h-4 w-4" aria-hidden />
          Live &amp; tutor
        </button>
        <button
          type="button"
          onClick={() => setTab("courses")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
            tab === "courses"
              ? "bg-gradient-to-r from-ccweb-cyan/30 to-ccweb-violet/25 text-white"
              : "text-ccweb-muted hover:text-white/90"
          }`}
        >
          <BookOpen className="h-4 w-4" aria-hidden />
          Courses
        </button>
        <button
          type="button"
          onClick={() => setTab("progress")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
            tab === "progress"
              ? "bg-gradient-to-r from-ccweb-cyan/30 to-ccweb-violet/25 text-white"
              : "text-ccweb-muted hover:text-white/90"
          }`}
        >
          <GraduationCap className="h-4 w-4" aria-hidden />
          Progress
        </button>
      </div>

      {tab === "live" && <LearningHubPage compact />}

      {tab === "courses" && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-white">Course catalog</h2>
            <Link to="/courses" className="text-xs font-medium text-ccweb-cyan hover:underline">
              Full catalog →
            </Link>
          </div>
          <CourseCatalogPage compact />
        </section>
      )}

      {tab === "progress" && (
        <section className="space-y-5">
          {!user && (
            <div className="ccweb-glass rounded-2xl p-5 text-sm text-ccweb-muted">
              <Link to="/login" className="font-medium text-ccweb-cyan underline">
                Sign in
              </Link>{" "}
              to see enrollments, lesson progress, and certificates.
            </div>
          )}
          {user && loadingProg && (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          )}
          {user && !loadingProg && (
            <>
              <div className="ccweb-glass rounded-2xl p-5">
                <h2 className="text-lg font-semibold text-white">Enrolled courses</h2>
                <p className="mt-1 text-xs text-ccweb-muted">
                  Saved in your enrollment row and refreshed when you complete lessons.
                </p>
                {progress.length === 0 ? (
                  <p className="mt-4 text-sm text-ccweb-muted">
                    No enrollments yet. Open a course and tap <strong className="text-white">Enroll</strong>, then complete lessons from the
                    lesson player.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {progress.map((p) => (
                      <li key={p.courseId} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                        <div>
                          <p className="font-medium text-white">{p.title}</p>
                          <p className="text-xs text-ccweb-muted">{p.categorySlug}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-emerald-200">{Math.round(p.progressPct || 0)}%</p>
                          <Link to={`/courses/${encodeURIComponent(p.slug)}`} className="text-xs text-ccweb-cyan hover:underline">
                            Continue
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="ccweb-glass rounded-2xl p-5">
                <h2 className="text-lg font-semibold text-white">Certificates</h2>
                <p className="mt-1 text-xs text-ccweb-muted">Issued automatically when course progress reaches 100%.</p>
                {certs.length === 0 ? (
                  <p className="mt-4 text-sm text-ccweb-muted">No certificates yet — finish a full course path.</p>
                ) : (
                  <ul className="mt-4 space-y-2 text-sm">
                    {certs.map((c) => (
                      <li key={c.id} className="flex flex-wrap justify-between gap-2 rounded-lg border border-white/10 bg-black/25 px-3 py-2">
                        <span className="text-white/90">{c.title}</span>
                        <code className="text-xs text-ccweb-cyan">{c.code}</code>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
