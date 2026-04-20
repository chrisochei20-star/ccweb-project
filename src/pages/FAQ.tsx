import { useState } from "react";
import { ChevronDown } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "Do I need a technical background?",
    a: "For the beginner tracks, no. We assume curiosity and basic comfort with the command line. Intermediate and advanced courses list any prerequisites up front.",
  },
  {
    q: "Are the courses self-paced or cohort-based?",
    a: "Both. Every course is available self-paced with our Pro plan. Several run as live, mentor-led cohorts on our Cohort plan, with weekly office hours and project reviews.",
  },
  {
    q: "Do I get a certificate?",
    a: "Yes. You'll receive a verifiable certificate upon completing the final project of each course.",
  },
  {
    q: "What about refunds?",
    a: "We offer a full refund within the first 14 days of any cohort, no questions asked. For Pro subscriptions, you can cancel anytime.",
  },
  {
    q: "Do you offer scholarships?",
    a: "Yes. We reserve a fixed number of need-based scholarship seats for each cohort. Reach out via the contact form to apply.",
  },
  {
    q: "Can I enroll my team?",
    a: "Absolutely. We offer team discounts for groups of 5 or more, plus optional custom content for engineering orgs. Let's talk.",
  },
];

export default function FAQ() {
  return (
    <div className="container-page py-16">
      <SectionHeading
        eyebrow="Frequently asked questions"
        title="Everything you might be wondering"
        description="Can't find what you're looking for? Reach out — a human will answer."
      />

      <div className="mx-auto mt-12 max-w-3xl space-y-3">
        {faqs.map((f, i) => (
          <FAQItem key={i} {...f} />
        ))}
      </div>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 p-5 text-left"
      >
        <span className="font-medium">{q}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="border-t border-white/10 px-5 py-4 text-sm leading-relaxed text-muted-foreground">
          {a}
        </div>
      )}
    </div>
  );
}
