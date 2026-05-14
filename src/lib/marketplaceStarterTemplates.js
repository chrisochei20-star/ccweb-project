/** Preset listing drafts for creator activation (studio wizard). */

export const MARKETPLACE_STARTER_TEMPLATES = [
  {
    id: "ai-research-pack",
    label: "AI research assistant",
    title: "AI research workflow pack",
    kind: "workflow",
    categorySlug: "ai",
    tags: ["ai", "research", "automation"],
    description:
      "A structured workflow buyers can run in Build: gather sources, summarize risks, and export a one-page brief. Replace this text with your real deliverable and pricing.",
  },
  {
    id: "defi-safety-checklist",
    label: "DeFi safety checklist",
    title: "Token safety review checklist (editable)",
    kind: "prompt_pack",
    categorySlug: "defi",
    tags: ["defi", "safety", "checklist"],
    description:
      "Step-by-step prompts for reviewing liquidity, holders, and contract red flags. Great as a low-friction first SKU—tune questions to your niche.",
  },
  {
    id: "creator-onboarding-call",
    label: "1:1 onboarding session",
    title: "30-minute creator onboarding call",
    kind: "digital",
    categorySlug: "coaching",
    tags: ["coaching", "onboarding", "live"],
    description:
      "Bookable digital product: walk new buyers through installing your asset and using it in CCWEB. Pair with a higher-ticket AI bundle later.",
  },
];
