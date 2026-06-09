import { BookOpen, GraduationCap, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchCourseCatalog, fetchCourseCategories, fetchRecommendedCourses } from "../api/coursesApi";
import { assetsUrl } from "../config/env";
import { useStaleLoadingGuard } from "../hooks/useStaleLoadingGuard";

export function CourseCatalogPage({ compact = false }) {
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [filter, setFilter] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const initialLoadStalled = useStaleLoadingGuard(loading && !courses.length && !err);

  useEffect(() => {
    let c = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const [cats, rec] = await Promise.all([
          fetchCourseCategories(),
          fetchRecommendedCourses({}).catch(() => []),
        ]);
        if (!c) setCategories(cats);
        if (!c) setRecommended(rec);
      } catch (e) {
        if (!c) setErr(e.message || String(e));
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  useEffect(() => {
    let c = false;
    const t = setTimeout(() => {
      (async () => {
        try {
          const list = await fetchCourseCatalog({ category: filter || undefined, q: q || undefined });
          if (!c) setCourses(list);
        } catch (e) {
          if (!c) setErr(e.message || String(e));
        }
      })();
    }, filter || q ? 200 : 0);
    return () => {
      c = true;
      clearTimeout(t);
    };
  }, [filter, q]);

  if (initialLoadStalled) {
    return (
      <div className="flex min-h-[30vh] flex-col items-center justify-center gap-2 px-4 text-center text-ccweb-muted">
        <p className="text-rose-200/90">The catalog is taking too long to load.</p>
        <p className="text-sm">Check your network or API URL, then refresh.</p>
      </div>
    );
  }

  if (loading && !courses.length && !err) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center gap-2 text-ccweb-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading catalog…
      </div>
    );
  }

  return (
    <section className={compact ? "space-y-4" : "mx-auto max-w-5xl space-y-6 px-3 pb-12 pt-4"}>
      {!compact && (
        <header>
          <p className="text-xs font-semibold uppercase tracking-widest text-ccweb-cyan">Courses</p>
          <h1 className="mt-1 text-2xl font-bold text-white md:text-3xl">Dynamic AI curriculum</h1>
          <p className="mt-1 max-w-2xl text-sm text-ccweb-muted">
            Categories, progress, quizzes, certificates, AI tutor with streaming — backed by PostgreSQL.
          </p>
        </header>
      )}

      {err && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          {err}{" "}
          <span className="text-ccweb-muted">
            Enable <code className="text-ccweb-cyan">DATABASE_URL</code> and run migrations.
          </span>
        </div>
      )}

      {!compact && recommended.length > 0 && (
        <div>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
            <Sparkles className="h-4 w-4 text-ccweb-violet" />
            Recommended for you
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/courses/${encodeURIComponent(c.slug)}`}
                  className="ccweb-glass block overflow-hidden rounded-2xl transition hover:border-ccweb-cyan/40"
                >
                  {c.thumbnailUrl ? (
                    <div className="aspect-[16/9] w-full overflow-hidden border-b border-white/10">
                      <img
                        src={assetsUrl(c.thumbnailUrl)}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : null}
                  <div className="p-4">
                    <span className="text-[10px] uppercase tracking-wide text-ccweb-muted">{c.categorySlug}</span>
                    <p className="mt-1 font-medium text-white">{c.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-ccweb-muted">{c.summary}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter("")}
          className={`rounded-full px-3 py-1 text-xs font-medium ${!filter ? "bg-white/15 text-white" : "bg-black/30 text-ccweb-muted"}`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.slug}
            type="button"
            onClick={() => setFilter(cat.slug)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filter === cat.slug ? "bg-white/15 text-white" : "bg-black/30 text-ccweb-muted"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <input
        className="ccweb-input max-w-md text-sm"
        placeholder="Search courses…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <ul className="grid gap-3 sm:grid-cols-2">
        {courses.map((c) => (
          <li key={c.id}>
            <Link
              to={`/courses/${encodeURIComponent(c.slug)}`}
              className="ccweb-glass block overflow-hidden rounded-2xl transition hover:border-ccweb-cyan/40"
            >
              {c.thumbnailUrl ? (
                <div className="aspect-[16/9] w-full overflow-hidden border-b border-white/10">
                  <img
                    src={assetsUrl(c.thumbnailUrl)}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ) : null}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {!c.thumbnailUrl ? (
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5">
                        <GraduationCap className="h-5 w-5 text-ccweb-cyan" />
                      </span>
                    ) : null}
                    <div>
                      <p className="font-medium text-white">{c.title}</p>
                      <p className="text-xs text-ccweb-muted">
                        {c.categorySlug} · {c.level}
                      </p>
                    </div>
                  </div>
                  <BookOpen className="h-4 w-4 shrink-0 text-ccweb-muted" />
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-ccweb-muted">{c.summary}</p>
                <p className="mt-2 text-[10px] text-ccweb-muted">
                  {c.enrollmentCount ?? 0} learners enrolled · updated{" "}
                  {c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : "—"}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {!courses.length && !loading && (
        <div
          className={`rounded-2xl border border-white/10 bg-black/20 text-center text-sm text-ccweb-muted ${
            compact ? "px-4 py-8" : "p-10"
          }`}
        >
          <GraduationCap className="mx-auto h-9 w-9 text-ccweb-cyan/50" aria-hidden />
          <p className="mt-3 font-medium text-white/90">No courses match your filters</p>
          <p className="mt-2 text-xs leading-relaxed text-ccweb-muted">
            Clear search or pick another category. With <code className="text-ccweb-cyan">DATABASE_URL</code> the catalog
            syncs from PostgreSQL.
          </p>
        </div>
      )}
    </section>
  );
}
