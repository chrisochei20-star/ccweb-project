import { Link } from "react-router-dom";
import { ArrowRight, Heart, Sparkles, Target } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";

const values = [
  {
    icon: Target,
    title: "Ship something real",
    copy: "Every module ends with a project you can point to. If you can't show it, you haven't learned it.",
  },
  {
    icon: Heart,
    title: "Respect your time",
    copy: "We cut filler aggressively. Dense material, clear paths, and fast feedback.",
  },
  {
    icon: Sparkles,
    title: "Taught by practitioners",
    copy: "Our instructors are engineers and researchers doing the work. Not professional course-makers.",
  },
];

const team = [
  { name: "Ayo Bakare", role: "Smart Contract Engineer" },
  { name: "Dr. Rhea Menon", role: "Applied AI Lead" },
  { name: "Priya Iyer", role: "DeFi Researcher" },
  { name: "Owen Park", role: "ML Engineer" },
  { name: "Noa Levi", role: "Full-stack Web3 Engineer" },
  { name: "Sofia Alvarez", role: "AI Engineer" },
];

export default function About() {
  return (
    <div className="container-page py-16">
      <SectionHeading
        eyebrow="About ChainCraft"
        title="A school for people who want to build"
        description="We started ChainCraft because the courses we wanted didn't exist. Most were either hand-wavy intros or research papers with no connection to shipping. We made the middle."
      />

      <section className="mt-14">
        <h2 className="font-display text-2xl font-semibold">What we believe</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {values.map((v) => (
            <div key={v.title} className="card-surface">
              <div className="rounded-lg bg-white/5 p-2 w-fit">
                <v.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">
                {v.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{v.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-2xl font-semibold">The team</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A rotating cast of instructors pulled from the trenches of Web3,
          crypto, and AI.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {team.map((m) => (
            <div
              key={m.name}
              className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary/60 to-secondary/60 font-display text-sm font-semibold">
                {m.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div>
                <div className="text-sm font-semibold">{m.name}</div>
                <div className="text-xs text-muted-foreground">{m.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="policies" className="mt-16 grid gap-5 md:grid-cols-2">
        <div className="card-surface">
          <h3 className="font-display text-lg font-semibold">Privacy</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            We collect only what we need to run the service. We never sell your
            data. Full details in our privacy policy.
          </p>
        </div>
        <div className="card-surface">
          <h3 className="font-display text-lg font-semibold">Terms</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Fair, plain-language terms. Refund-friendly within the first 14
            days of a cohort, no questions asked.
          </p>
        </div>
      </section>

      <section className="mt-16 rounded-3xl border border-white/10 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 p-10 text-center">
        <h2 className="font-display text-3xl font-semibold">Come build with us</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          Whether you're starting out or leveling up, there's a path for you.
        </p>
        <Link to="/courses" className="btn-primary mt-6">
          Browse courses
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
