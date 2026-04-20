import { Link } from "react-router-dom";
import {
  ArrowRight,
  Blocks,
  Bot,
  Check,
  Coins,
  Cpu,
  LineChart,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import Badge from "@/components/ui/Badge";
import { courses, tracks } from "@/data/courses";

const featured = courses.filter((c) => c.featured);

const stats = [
  { value: "35k+", label: "Learners worldwide" },
  { value: "120+", label: "Lessons & projects" },
  { value: "4.9/5", label: "Average rating" },
  { value: "92%", label: "Course completion" },
];

const features = [
  {
    icon: Blocks,
    title: "Project-first curriculum",
    copy: "Every module ends with something you've built — smart contracts, dApps, models, or agents.",
  },
  {
    icon: ShieldCheck,
    title: "Production-grade habits",
    copy: "We teach testing, security, and operations alongside the fun parts. You'll ship confidently.",
  },
  {
    icon: Users,
    title: "Mentor-led cohorts",
    copy: "Learn with working engineers and researchers who review your work and answer your questions.",
  },
  {
    icon: LineChart,
    title: "Career-ready portfolio",
    copy: "Finish each track with projects and writeups that make hiring managers say yes.",
  },
];

export default function Home() {
  return (
    <div>
      <Hero />
      <Stats />
      <Tracks />
      <FeaturedCourses />
      <Features />
      <Testimonials />
      <CTA />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-grid-slate bg-[size:40px_40px] opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px] bg-glow-primary"
      />

      <div className="container-page pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="mx-auto max-w-3xl text-center">
          <span className="chip animate-fade-in-up">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            New cohort starting May 2026
          </span>
          <h1 className="mt-6 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-6xl animate-fade-in-up">
            Learn <span className="gradient-text">Web3, crypto, and AI</span>
            <br className="hidden sm:block" /> the way builders actually learn.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg animate-fade-in-up">
            ChainCraft is a focused education platform for people who want to
            ship real things. Cohort-based, project-first, and taught by the
            engineers doing the work.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 animate-fade-in-up">
            <Link to="/courses" className="btn-primary">
              Explore courses
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/learn" className="btn-outline">
              Free guides
            </Link>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            No spam. Cancel anytime. Free resources always free.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-5xl">
          <HeroCard />
        </div>
      </div>
    </section>
  );
}

function HeroCard() {
  return (
    <div className="relative">
      <div className="card-surface">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Blocks,
              title: "Web3",
              copy: "Smart contracts, dApps, and on-chain product.",
              tint: "from-primary/30 to-primary/0",
            },
            {
              icon: Coins,
              title: "Crypto",
              copy: "Markets, DeFi, tokenomics, and safe self-custody.",
              tint: "from-secondary/30 to-secondary/0",
            },
            {
              icon: Bot,
              title: "AI",
              copy: "LLMs, evals, agents, and applied ML.",
              tint: "from-accent/30 to-accent/0",
            },
          ].map((t) => (
            <div
              key={t.title}
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div
                aria-hidden
                className={`pointer-events-none absolute -inset-16 bg-gradient-to-br ${t.tint} opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100`}
              />
              <div className="relative">
                <t.icon className="h-6 w-6 text-foreground" />
                <h3 className="mt-3 font-display text-lg font-semibold">
                  {t.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{t.copy}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stats() {
  return (
    <section className="container-page">
      <div className="grid gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:grid-cols-2 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className="font-display text-3xl font-semibold">{s.value}</div>
            <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Tracks() {
  return (
    <section className="container-page mt-24">
      <SectionHeading
        eyebrow="Three tracks, one goal"
        title="Pick your path. Ship something real."
        description="Every track blends fundamentals with projects you can show. Mix and match modules to fit where you are."
      />
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {(Object.keys(tracks) as Array<keyof typeof tracks>).map((k) => {
          const t = tracks[k];
          const icon = k === "web3" ? Blocks : k === "crypto" ? Coins : Cpu;
          const Icon = icon;
          return (
            <Link
              key={k}
              to={`/courses?track=${k}`}
              className="group card-surface transition-colors hover:border-white/20"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-white/5 p-2">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-xl font-semibold">
                    {t.label}
                  </h3>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{t.blurb}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function FeaturedCourses() {
  return (
    <section className="container-page mt-24">
      <div className="flex items-end justify-between gap-6">
        <SectionHeading
          eyebrow="Featured courses"
          title="Start where you'll make the most progress"
        />
        <Link to="/courses" className="hidden items-center gap-1 text-sm text-muted-foreground hover:text-foreground sm:inline-flex">
          Browse all courses
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {featured.map((c) => {
          const t = tracks[c.track];
          const variant =
            c.track === "web3" ? "primary" : c.track === "crypto" ? "secondary" : "accent";
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
    </section>
  );
}

function Features() {
  return (
    <section className="container-page mt-24">
      <SectionHeading
        eyebrow="Why ChainCraft"
        title="Learning that respects your time"
        description="We strip away the fluff. No 12-hour intros, no filler lectures — just focused work you can apply immediately."
      />
      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div key={f.title} className="card-surface">
            <div className="rounded-lg bg-white/5 p-2 w-fit">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">
              {f.title}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">{f.copy}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    {
      quote:
        "The Solidity track was exactly what I needed. I shipped a staking contract to mainnet within a month of finishing.",
      name: "Diego R.",
      role: "Smart Contract Engineer",
    },
    {
      quote:
        "I finally understand how DeFi actually works — not just the buzzwords. Worth every minute.",
      name: "Amara J.",
      role: "Product Manager",
    },
    {
      quote:
        "The AI agents course reshaped how our team ships LLM features. Evals changed everything.",
      name: "Kenji T.",
      role: "Engineering Lead",
    },
  ];

  return (
    <section className="container-page mt-24">
      <SectionHeading
        eyebrow="Loved by builders"
        title="Graduates working at serious teams"
      />
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {items.map((t) => (
          <figure key={t.name} className="card-surface">
            <blockquote className="text-sm leading-relaxed text-muted-foreground">
              “{t.quote}”
            </blockquote>
            <figcaption className="mt-5 text-sm">
              <div className="font-medium">{t.name}</div>
              <div className="text-muted-foreground">{t.role}</div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  const bullets = [
    "Cohort-based accountability",
    "Real projects in your portfolio",
    "Mentor review on your work",
    "Career support when you're ready",
  ];
  return (
    <section className="container-page mt-24 mb-8">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-primary/15 via-secondary/10 to-accent/15 p-10 sm:p-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 right-0 h-72 w-72 rounded-full bg-primary/30 blur-3xl"
        />
        <div className="relative grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">
              Ready to stop lurking and start building?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Join the next cohort. We'll help you pick the right track and
              set a pace that fits your life.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/pricing" className="btn-primary">
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/contact" className="btn-outline">
                Talk to us
              </Link>
            </div>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 text-secondary" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
