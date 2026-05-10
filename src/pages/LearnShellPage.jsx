import { BookOpen, Radio } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { LearningHubPage } from "../learning/LearningHubPage";
import { CourseCatalogPage } from "./CourseCatalogPage";

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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-white">Course catalog</h2>
            <Link to="/courses" className="text-xs font-medium text-ccweb-cyan hover:underline">
              Full catalog →
            </Link>
          </div>
          <CourseCatalogPage compact />
        </section>
      )}
    </div>
  );
}
