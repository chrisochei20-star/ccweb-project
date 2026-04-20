import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Filter } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import Badge from "@/components/ui/Badge";
import { courses, tracks, type Level, type Track } from "@/data/courses";
import { cn } from "@/lib/utils";

const levels: Level[] = ["Beginner", "Intermediate", "Advanced"];

export default function Courses() {
  const [params, setParams] = useSearchParams();

  const track = (params.get("track") as Track | null) ?? null;
  const level = (params.get("level") as Level | null) ?? null;

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      if (track && c.track !== track) return false;
      if (level && c.level !== level) return false;
      return true;
    });
  }, [track, level]);

  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (!value) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  return (
    <div className="container-page py-16">
      <SectionHeading
        eyebrow="Courses"
        title="Pick a course. Ship a project."
        description="All courses include code, tests, and a final project — not just lectures."
      />

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          Filter
        </span>
        <FilterGroup
          label="Track"
          options={[
            { value: null, label: "All" },
            ...(Object.keys(tracks) as Track[]).map((k) => ({
              value: k,
              label: tracks[k].label,
            })),
          ]}
          active={track}
          onChange={(v) => update("track", v)}
        />
        <FilterGroup
          label="Level"
          options={[
            { value: null, label: "Any" },
            ...levels.map((l) => ({ value: l, label: l })),
          ]}
          active={level}
          onChange={(v) => update("level", v)}
        />
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => {
          const t = tracks[c.track];
          const variant =
            c.track === "web3"
              ? "primary"
              : c.track === "crypto"
              ? "secondary"
              : "accent";
          return (
            <Link
              to={`/courses/${c.slug}`}
              key={c.slug}
              className="group flex flex-col rounded-2xl border border-white/10 bg-card/60 p-6 transition-colors hover:border-white/20"
            >
              <div className="flex items-center gap-2">
                <Badge variant={variant}>{t.label}</Badge>
                <Badge>{c.level}</Badge>
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">
                {c.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.tagline}</p>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {c.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="chip">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-auto flex items-center justify-between pt-6 text-xs text-muted-foreground">
                <span>
                  {c.lessons} lessons · {c.duration}
                </span>
                <span className="inline-flex items-center gap-1 text-foreground opacity-80 transition-opacity group-hover:opacity-100">
                  View
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="mt-16 rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center text-sm text-muted-foreground">
          No courses match those filters yet — try widening your selection.
        </div>
      )}
    </div>
  );
}

type Option<T extends string | null> = { value: T; label: string };

function FilterGroup<T extends string | null>({
  label,
  options,
  active,
  onChange,
}: {
  label: string;
  options: Option<T>[];
  active: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}:</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const isActive = active === o.value;
          return (
            <button
              key={o.label}
              type="button"
              onClick={() => onChange(o.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                isActive
                  ? "border-primary/40 bg-primary/15 text-foreground"
                  : "border-white/10 bg-white/[0.03] text-muted-foreground hover:text-foreground"
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
