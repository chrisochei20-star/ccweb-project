import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Compass, Wrench } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";

const sections = [
  {
    title: "Start here",
    icon: Compass,
    items: [
      {
        title: "What is Web3, really?",
        copy: "Strip away the hype. Understand what the tech can and can't do.",
        href: "/blog/how-amms-really-work",
      },
      {
        title: "Your first wallet",
        copy: "Set up a secure wallet you'll actually use — and back it up properly.",
        href: "/blog/self-custody-in-2026",
      },
      {
        title: "LLM literacy",
        copy: "How modern language models work, in plain English.",
        href: "/blog/what-actually-matters-in-evaluating-llms",
      },
    ],
  },
  {
    title: "Toolkits",
    icon: Wrench,
    items: [
      {
        title: "Smart contract dev toolbox",
        copy: "Our opinionated setup: Foundry, Hardhat, and the configs we use in production.",
        href: "/courses/solidity-foundations",
      },
      {
        title: "dApp starter kit",
        copy: "React + wagmi + viem, wired up and ready to ship.",
        href: "/courses/zero-to-dapp",
      },
      {
        title: "LLM app starter",
        copy: "A minimal, production-shaped scaffold for LLM features.",
        href: "/courses/prompt-engineering-pro",
      },
    ],
  },
  {
    title: "Reference",
    icon: BookOpen,
    items: [
      {
        title: "Glossary",
        copy: "A short, honest glossary of Web3, crypto, and AI terms.",
        href: "/faq",
      },
      {
        title: "Security checklist",
        copy: "The 15 things we check before shipping anything to mainnet.",
        href: "/courses/solidity-foundations",
      },
      {
        title: "Eval design patterns",
        copy: "How we design evals that actually predict product quality.",
        href: "/blog/what-actually-matters-in-evaluating-llms",
      },
    ],
  },
];

export default function Learn() {
  return (
    <div className="container-page py-16">
      <SectionHeading
        eyebrow="Free guides"
        title="Learn on your own time"
        description="A growing library of practical, opinionated guides. No email required."
      />

      <div className="mt-12 space-y-14">
        {sections.map((s) => (
          <section key={s.title}>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/5 p-2">
                <s.icon className="h-5 w-5" />
              </div>
              <h2 className="font-display text-2xl font-semibold">{s.title}</h2>
            </div>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {s.items.map((item) => (
                <Link
                  key={item.title}
                  to={item.href}
                  className="group card-surface transition-colors hover:border-white/20"
                >
                  <h3 className="font-display text-lg font-semibold">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.copy}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-1 text-sm text-foreground">
                    Read
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
