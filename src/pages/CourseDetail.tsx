import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Clock, Layers, User } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { getCourse, tracks } from "@/data/courses";

export default function CourseDetail() {
  const { slug = "" } = useParams();
  const course = getCourse(slug);

  if (!course) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="font-display text-3xl font-semibold">Course not found</h1>
        <p className="mt-4 text-muted-foreground">
          The course you're looking for doesn't exist.
        </p>
        <Link to="/courses" className="btn-primary mt-8">
          Back to courses
        </Link>
      </div>
    );
  }

  const t = tracks[course.track];
  const variant =
    course.track === "web3"
      ? "primary"
      : course.track === "crypto"
      ? "secondary"
      : "accent";

  return (
    <div className="container-page py-16">
      <Link
        to="/courses"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All courses
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={variant}>{t.label}</Badge>
            <Badge>{course.level}</Badge>
            {course.featured && <Badge variant="outline">Featured</Badge>}
          </div>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            {course.title}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">{course.tagline}</p>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            {course.description}
          </p>

          <section className="mt-10">
            <h2 className="font-display text-2xl font-semibold">
              What you'll learn
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {course.outcomes.map((o) => (
                <li key={o} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 text-secondary" />
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="font-display text-2xl font-semibold">Curriculum</h2>
            <ol className="mt-4 space-y-3">
              {course.modules.map((m, i) => (
                <li
                  key={m.title}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06] text-xs font-semibold">
                      {i + 1}
                    </span>
                    <h3 className="font-display text-lg font-semibold">
                      {m.title}
                    </h3>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5 pl-10">
                    {m.topics.map((topic) => (
                      <span key={topic} className="chip">
                        {topic}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-10">
            <h2 className="font-display text-2xl font-semibold">Instructor</h2>
            <div className="mt-4 flex items-start gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06]">
                <User className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold">{course.instructor.name}</div>
                <div className="text-sm text-muted-foreground">
                  {course.instructor.title}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {course.instructor.bio}
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="lg:col-span-1">
          <div className="sticky top-24 card-surface">
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Duration
                </span>
                <span className="font-medium">{course.duration}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <Layers className="h-4 w-4" />
                  Lessons
                </span>
                <span className="font-medium">{course.lessons}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Level</span>
                <span className="font-medium">{course.level}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Track</span>
                <span className="font-medium">{t.label}</span>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <Link to="/pricing" className="btn-primary w-full">
                Enroll now
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/contact" className="btn-outline w-full">
                Ask a question
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {course.tags.map((tag) => (
                <span key={tag} className="chip">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
