export type Track = "web3" | "crypto" | "ai";
export type Level = "Beginner" | "Intermediate" | "Advanced";

export type Course = {
  slug: string;
  title: string;
  track: Track;
  level: Level;
  duration: string;
  lessons: number;
  tagline: string;
  description: string;
  outcomes: string[];
  modules: { title: string; topics: string[] }[];
  instructor: {
    name: string;
    title: string;
    bio: string;
  };
  tags: string[];
  featured?: boolean;
};

export const tracks: Record<Track, { label: string; blurb: string; color: string }> = {
  web3: {
    label: "Web3",
    blurb: "Smart contracts, dApps, and on-chain product engineering.",
    color: "primary",
  },
  crypto: {
    label: "Crypto",
    blurb: "Markets, tokenomics, DeFi, and responsible self-custody.",
    color: "secondary",
  },
  ai: {
    label: "AI",
    blurb: "Applied ML, LLMs, and production-ready AI systems.",
    color: "accent",
  },
};

export const courses: Course[] = [
  {
    slug: "solidity-foundations",
    title: "Solidity Foundations",
    track: "web3",
    level: "Beginner",
    duration: "6 weeks",
    lessons: 42,
    tagline: "Write, test, and deploy your first production smart contracts.",
    description:
      "A hands-on primer on Solidity, the EVM, and modern tooling. You'll build a token, an NFT collection, and a simple staking protocol — with tests, deployments, and gas analysis at every step.",
    outcomes: [
      "Read and write idiomatic Solidity with confidence",
      "Understand the EVM, storage layout, and gas",
      "Build and ship contracts with Foundry and Hardhat",
      "Write thorough tests, including fuzzing",
    ],
    modules: [
      {
        title: "EVM & Solidity basics",
        topics: ["Accounts & transactions", "Types & storage", "Functions & modifiers"],
      },
      {
        title: "Standards & patterns",
        topics: ["ERC-20", "ERC-721 & ERC-1155", "Access control", "Upgradeability"],
      },
      {
        title: "Tooling & testing",
        topics: ["Foundry", "Hardhat", "Unit tests", "Fuzzing & invariants"],
      },
      {
        title: "Your first protocol",
        topics: ["Design doc", "Staking mechanics", "Deployment", "Verification"],
      },
    ],
    instructor: {
      name: "Ayo Bakare",
      title: "Smart Contract Engineer",
      bio: "Ex-DeFi protocol lead. Shipped contracts handling nine-figure TVL.",
    },
    tags: ["Solidity", "EVM", "Foundry", "Hardhat"],
    featured: true,
  },
  {
    slug: "zero-to-dapp",
    title: "Zero to dApp",
    track: "web3",
    level: "Intermediate",
    duration: "5 weeks",
    lessons: 34,
    tagline: "Ship a full-stack decentralized app with wallet auth, indexing, and tests.",
    description:
      "Bring a smart contract to life with a polished frontend. You'll wire wagmi + viem, handle wallet UX, index events with a subgraph, and deploy to a real testnet.",
    outcomes: [
      "Integrate wallets with wagmi + viem",
      "Query on-chain data with The Graph",
      "Handle transactions and error states gracefully",
      "Deploy a production-grade dApp",
    ],
    modules: [
      { title: "Frontend foundations", topics: ["React + TS", "wagmi", "viem"] },
      { title: "Data & indexing", topics: ["Events", "Subgraphs", "Caching"] },
      { title: "Transactions UX", topics: ["Signing", "Pending states", "Errors"] },
      { title: "Ship it", topics: ["Auditing your UX", "Deployment", "Monitoring"] },
    ],
    instructor: {
      name: "Noa Levi",
      title: "Full-stack Web3 Engineer",
      bio: "Built consumer dApps with 1M+ monthly users.",
    },
    tags: ["React", "wagmi", "viem", "The Graph"],
    featured: true,
  },
  {
    slug: "defi-deep-dive",
    title: "DeFi Deep Dive",
    track: "crypto",
    level: "Intermediate",
    duration: "4 weeks",
    lessons: 28,
    tagline: "AMMs, lending, and derivatives — how they really work.",
    description:
      "Go beyond buzzwords. We dissect the mechanics of top DeFi protocols, run through worked examples, and teach you how to evaluate risk like a professional.",
    outcomes: [
      "Explain AMMs, lending, and perp design choices",
      "Read protocol docs and contracts critically",
      "Evaluate smart contract and economic risk",
      "Build a DeFi strategy with clear assumptions",
    ],
    modules: [
      { title: "AMMs", topics: ["CPMM", "CLMM", "Impermanent loss"] },
      { title: "Lending", topics: ["Interest models", "Liquidations", "Risk parameters"] },
      { title: "Derivatives", topics: ["Perps", "Options", "Funding rates"] },
      { title: "Risk", topics: ["Oracles", "Bridges", "Governance"] },
    ],
    instructor: {
      name: "Priya Iyer",
      title: "DeFi Researcher",
      bio: "Independent researcher covering AMMs and stablecoins.",
    },
    tags: ["DeFi", "AMM", "Lending", "Risk"],
    featured: true,
  },
  {
    slug: "crypto-for-beginners",
    title: "Crypto for Beginners",
    track: "crypto",
    level: "Beginner",
    duration: "3 weeks",
    lessons: 22,
    tagline: "What crypto actually is — and how to use it safely.",
    description:
      "A calm, jargon-light introduction. Wallets, keys, exchanges, stablecoins, and the habits that keep your funds safe.",
    outcomes: [
      "Set up a secure wallet and backups",
      "Understand blockchains, tokens, and stablecoins",
      "Spot common scams and phishing patterns",
      "Make informed choices about self-custody",
    ],
    modules: [
      { title: "Blockchains 101", topics: ["What it is", "Why it matters"] },
      { title: "Wallets & keys", topics: ["Seed phrases", "Hardware wallets"] },
      { title: "Using crypto", topics: ["Stablecoins", "Transfers", "Fees"] },
      { title: "Staying safe", topics: ["Scams", "Approvals", "Backups"] },
    ],
    instructor: {
      name: "Marc Dubois",
      title: "Educator",
      bio: "Helps non-technical users build good crypto habits.",
    },
    tags: ["Wallets", "Security", "Stablecoins"],
  },
  {
    slug: "tokenomics-workshop",
    title: "Tokenomics Workshop",
    track: "crypto",
    level: "Advanced",
    duration: "2 weeks",
    lessons: 14,
    tagline: "Design token systems that don't collapse under their own weight.",
    description:
      "A practical workshop for founders and analysts. You'll model supply, demand, incentives, and governance — then stress-test your design.",
    outcomes: [
      "Model token supply & emissions",
      "Design incentives that align the right behavior",
      "Critique existing tokenomics with rigor",
      "Produce a defensible tokenomics memo",
    ],
    modules: [
      { title: "Supply", topics: ["Emissions", "Vesting", "Buybacks"] },
      { title: "Demand", topics: ["Utility", "Fees", "Sinks"] },
      { title: "Governance", topics: ["Voting", "Delegation", "Attacks"] },
      { title: "Case studies", topics: ["Wins", "Failures", "Postmortems"] },
    ],
    instructor: {
      name: "Lena Fischer",
      title: "Token Designer",
      bio: "Advised 20+ protocols on token design and launch strategy.",
    },
    tags: ["Tokens", "Incentives", "Governance"],
  },
  {
    slug: "prompt-engineering-pro",
    title: "Prompt Engineering Pro",
    track: "ai",
    level: "Beginner",
    duration: "2 weeks",
    lessons: 18,
    tagline: "Get reliable, production-quality outputs from modern LLMs.",
    description:
      "Stop fighting your model. Learn the patterns, evals, and guardrails that turn flaky demos into reliable features.",
    outcomes: [
      "Design prompts that generalize",
      "Build evals you actually trust",
      "Use tools, functions, and structured outputs",
      "Ship LLM features with guardrails",
    ],
    modules: [
      { title: "Foundations", topics: ["Tokens", "Context", "Temperature"] },
      { title: "Patterns", topics: ["Few-shot", "CoT", "Self-critique"] },
      { title: "Tools & structure", topics: ["Functions", "JSON mode", "Agents"] },
      { title: "Quality", topics: ["Evals", "Guardrails", "Red-teaming"] },
    ],
    instructor: {
      name: "Dr. Rhea Menon",
      title: "Applied AI Lead",
      bio: "Built LLM features used by millions.",
    },
    tags: ["LLMs", "Evals", "Agents"],
    featured: true,
  },
  {
    slug: "applied-machine-learning",
    title: "Applied Machine Learning",
    track: "ai",
    level: "Intermediate",
    duration: "8 weeks",
    lessons: 52,
    tagline: "From baseline to production — the ML you actually use at work.",
    description:
      "A rigorous, practical course. You'll build end-to-end ML systems with strong baselines, clean evals, and a bias toward shipping.",
    outcomes: [
      "Frame problems and pick the right model",
      "Build strong baselines before going fancy",
      "Monitor and iterate on ML in production",
      "Communicate results to non-ML stakeholders",
    ],
    modules: [
      { title: "Foundations", topics: ["Supervised", "Unsupervised", "Metrics"] },
      { title: "Classical ML", topics: ["Trees", "Linear models", "Feature engineering"] },
      { title: "Deep learning", topics: ["CNNs", "Transformers", "Finetuning"] },
      { title: "Production", topics: ["Serving", "Monitoring", "Drift"] },
    ],
    instructor: {
      name: "Owen Park",
      title: "ML Engineer",
      bio: "Shipped ML across ads, search, and recommender systems.",
    },
    tags: ["ML", "Python", "PyTorch"],
  },
  {
    slug: "ai-agents-in-production",
    title: "AI Agents in Production",
    track: "ai",
    level: "Advanced",
    duration: "4 weeks",
    lessons: 26,
    tagline: "Build agents that plan, act, and don't go off the rails.",
    description:
      "Design, evaluate, and operate agentic systems. Planning, tools, memory, evals, and the guardrails that keep them useful.",
    outcomes: [
      "Design agent loops that are easy to debug",
      "Integrate tools safely and predictably",
      "Build evals tailored to agent behavior",
      "Deploy and monitor agents in production",
    ],
    modules: [
      { title: "Agent loops", topics: ["ReAct", "Planning", "Reflection"] },
      { title: "Tools & memory", topics: ["Function calling", "Retrieval", "State"] },
      { title: "Evals", topics: ["Trajectories", "Rubrics", "Regression tests"] },
      { title: "Operate", topics: ["Observability", "Safety", "Cost"] },
    ],
    instructor: {
      name: "Sofia Alvarez",
      title: "AI Engineer",
      bio: "Building agent platforms for enterprise workflows.",
    },
    tags: ["Agents", "LLMs", "Evals"],
  },
];

export function getCourse(slug: string): Course | undefined {
  return courses.find((c) => c.slug === slug);
}
