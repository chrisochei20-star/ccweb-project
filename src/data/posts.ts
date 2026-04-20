export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  category: "Web3" | "Crypto" | "AI" | "Careers";
  readTime: string;
  date: string;
  author: string;
  content: string[];
};

export const posts: Post[] = [
  {
    slug: "self-custody-in-2026",
    title: "Self-custody in 2026: a practical guide",
    excerpt:
      "Hardware wallets, passkeys, and multisig — what actually makes sense for most people today.",
    category: "Crypto",
    readTime: "8 min",
    date: "2026-03-14",
    author: "Marc Dubois",
    content: [
      "Self-custody isn't all-or-nothing. The right setup depends on how much you hold, how often you transact, and how much operational overhead you can absorb.",
      "For small amounts, a mobile wallet protected by a strong device passcode and biometric unlock is usually fine. For larger holdings, a hardware wallet paired with a clearly-documented recovery process is the baseline.",
      "Multisig and smart-contract wallets have become dramatically easier to use. If you have significant exposure, they're worth the extra configuration — especially if you want to share custody with a co-signer or recovery service.",
      "Whatever you choose, write the playbook before you need it. Your future self — or your family — will thank you.",
    ],
  },
  {
    slug: "what-actually-matters-in-evaluating-llms",
    title: "What actually matters when evaluating LLMs",
    excerpt:
      "Benchmarks are fine, but product evals are what ship. Here's how we build ours.",
    category: "AI",
    readTime: "10 min",
    date: "2026-02-27",
    author: "Dr. Rhea Menon",
    content: [
      "Academic benchmarks are a useful signal, but they rarely tell you whether a model will succeed inside your product. The moment you wire a model into a real workflow, the distribution of inputs, the tolerance for errors, and the cost of failure all change.",
      "The most valuable thing a team can build is a small, focused eval dataset drawn from real traffic. Score it with a mix of programmatic checks and rubric-style judgments. Run it on every change.",
      "Model choice becomes boring — and that's the goal. Boring is shippable.",
    ],
  },
  {
    slug: "how-amms-really-work",
    title: "How AMMs really work (with worked examples)",
    excerpt:
      "A no-nonsense walkthrough of constant-product and concentrated-liquidity AMMs.",
    category: "Web3",
    readTime: "12 min",
    date: "2026-02-05",
    author: "Priya Iyer",
    content: [
      "Automated market makers replaced order books for on-chain trading because they are simpler to implement and more capital-efficient at small scale. But the mental model most people carry is incomplete.",
      "We start with the constant-product formula, then work through concrete examples of slippage, impermanent loss, and fees. From there, we look at concentrated liquidity and why it changes the risk profile for LPs.",
      "By the end, you'll be able to read a pool's state and form a reasoned view — without hand-waving.",
    ],
  },
  {
    slug: "breaking-into-web3-engineering",
    title: "Breaking into Web3 engineering",
    excerpt:
      "What to build, what to study, and what hiring managers actually want to see.",
    category: "Careers",
    readTime: "7 min",
    date: "2026-01-19",
    author: "Ayo Bakare",
    content: [
      "The good news: most Web3 teams desperately want to hire engineers who can ship. The bad news: the signal-to-noise ratio in applications is low.",
      "You don't need a five-year DeFi résumé. You do need a public portfolio — a couple of small, well-documented projects that you can explain in depth.",
      "Your interviews will go much better if you can walk through one contract end-to-end: the design, the trade-offs, the tests, and what you'd do differently next time.",
    ],
  },
];

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}
