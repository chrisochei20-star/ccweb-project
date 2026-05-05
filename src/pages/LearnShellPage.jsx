import { BookOpen, GraduationCap, Radio } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { LearningHubPage } from "../learning/LearningHubPage";
import { CCWEB_COURSES } from "../data/courses";

export function LearnShellPage() {
  const [tab, setTab] = useState("live");

  return (
    <div className="mx-auto max-w-3xl px-3 pb-6 pt-3 md:max-w-5xl">
      <header className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-ccweb-cyan">Learn</p>
        <h1 className="mt-1 text-2xl font-bold text-white md:text-3xl">AI Academy</h1>
        <p className="mt-1 max-w-2xl text-sm text-ccweb-muted">
          Live AI sessions with tutor chat, structured courses, and progress synced when the database is enabled.
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
      </div>

      {tab === "live" && <LearningHubPage compact />}

      {tab === "courses" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-white">Course catalog</h2>
            <span className="text-xs text-ccweb-muted">Progress ties to your account when signed in</span>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {CCWEB_COURSES.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/courses/${c.id}`}
                  className="ccweb-glass block rounded-2xl p-4 transition hover:border-ccweb-cyan/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5">
                        <GraduationCap className="h-5 w-5 text-ccweb-cyan" />
                      </span>
                      <div>
                        <p className="font-medium text-white">{c.title}</p>
                        <p className="text-xs text-ccweb-muted">
                          {c.category} · {c.level}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-ccweb-green">{c.rating}★</span>
                  </div>
                  <p className="mt-2 text-xs text-ccweb-muted">
                    {c.duration} · {c.students} learners
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
