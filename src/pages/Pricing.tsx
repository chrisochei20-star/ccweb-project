import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";

type Plan = {
  name: string;
  tagline: string;
  monthly: number;
  yearly: number;
  features: string[];
  cta: string;
  highlight?: boolean;
};

const plans: Plan[] = [
  {
    name: "Free",
    tagline: "Explore the library",
    monthly: 0,
    yearly: 0,
    features: [
      "All free guides",
      "Community forum access",
      "Preview the first lesson of any course",
    ],
    cta: "Get started",
  },
  {
    name: "Pro",
    tagline: "Self-paced, unlimited",
    monthly: 29,
    yearly: 290,
    features: [
      "Unlimited course access",
      "Project reviews (async)",
      "Certificates on completion",
      "Private community channels",
    ],
    cta: "Start Pro",
    highlight: true,
  },
  {
    name: "Cohort",
    tagline: "Live, mentor-led",
    monthly: 79,
    yearly: 790,
    features: [
      "Everything in Pro",
      "Live cohort with mentors",
      "Weekly office hours",
      "Career support & referrals",
    ],
    cta: "Join a cohort",
  },
];

export default function Pricing() {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="container-page py-16">
      <SectionHeading
        align="center"
        eyebrow="Pricing"
        title="Fair pricing. No nonsense."
        description="Start free. Upgrade when you're ready. Cancel anytime."
      />

      <div className="mt-8 flex justify-center">
        <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1 text-sm">
          {[
            { label: "Monthly", value: false },
            { label: "Yearly · save 17%", value: true },
          ].map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => setYearly(opt.value)}
              className={cn(
                "rounded-full px-4 py-1.5 transition-colors",
                yearly === opt.value
                  ? "bg-white/[0.08] text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-3">
        {plans.map((p) => {
          const price = yearly ? p.yearly : p.monthly;
          const suffix = price === 0 ? "" : yearly ? "/yr" : "/mo";
          return (
            <div
              key={p.name}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card/60 p-6",
                p.highlight
                  ? "border-primary/40 shadow-[0_0_0_1px_hsl(var(--primary)/0.2)]"
                  : "border-white/10"
              )}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full border border-primary/40 bg-background px-3 py-0.5 text-xs font-medium text-primary">
                  <Sparkles className="h-3 w-3" />
                  Most popular
                </span>
              )}
              <h3 className="font-display text-xl font-semibold">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-4xl font-semibold">
                  ${price}
                </span>
                <span className="text-sm text-muted-foreground">{suffix}</span>
              </div>
              <ul className="mt-6 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-secondary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/contact"
                className={cn(
                  "mt-8",
                  p.highlight ? "btn-primary" : "btn-outline"
                )}
              >
                {p.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          );
        })}
      </div>

      <section className="mx-auto mt-20 max-w-3xl rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
        <h2 className="font-display text-2xl font-semibold">
          Scholarships & team plans
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          We offer need-based scholarships and discounts for teams of 5+.
          Reach out and we'll find something that works.
        </p>
        <Link to="/contact" className="btn-outline mt-6">
          Contact us
        </Link>
      </section>
    </div>
  );
}
