export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced'

export type CourseCategory =
  | 'All'
  | 'Blockchain'
  | 'DeFi'
  | 'Smart Contracts'
  | 'AI'
  | 'Trading'
  | 'Security'

export interface Lesson {
  id: string
  title: string
  duration: string
  summary: string
}

export interface QuizQuestion {
  id: string
  prompt: string
  options: string[]
  correctAnswer: string
  explanation: string
}

export interface Course {
  id: string
  title: string
  subtitle: string
  category: Exclude<CourseCategory, 'All'>
  level: CourseLevel
  duration: string
  lessonsCount: number
  students: number
  description: string
  rewardTokens: number
  lessons: Lesson[]
  quiz: QuizQuestion[]
}

export interface PricingPlan {
  id: string
  name: string
  monthlyPrice: number | null
  isPopular?: boolean
  features: string[]
  ctaLabel: string
}

export interface Testimonial {
  id: string
  quote: string
  name: string
  role: string
}

export interface Stat {
  label: string
  value: string
}

export const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Courses', href: '/courses' },
  { label: 'AI Tutor', href: '/ai-tutor' },
] as const

export const platformFeatures = [
  {
    title: 'Crypto & AI Courses',
    description:
      'Master blockchain, DeFi, smart contracts, and AI with expert-led courses.',
  },
  {
    title: 'AI Tutoring',
    description:
      '24/7 personalized AI tutor that adapts to your learning pace and goals.',
  },
  {
    title: 'Earn Tokens',
    description:
      'Learn and earn — get rewarded with platform tokens for each milestone.',
  },
  {
    title: 'Affiliate Program',
    description:
      'Refer friends and earn recurring commissions automatically from subscriptions.',
  },
]

export const stats: Stat[] = [
  { label: 'Active Learners', value: '12,500+' },
  { label: 'Courses', value: '35+' },
  { label: 'Tokens Distributed', value: '2.4M' },
  { label: 'Earned by Affiliates', value: '$415K+' },
]

export const plans: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 0,
    features: ['3 free courses', 'Community access', 'Basic AI tutor'],
    ctaLabel: 'Subscribe Now',
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 29,
    isPopular: true,
    features: ['All courses', 'Unlimited AI tutor', 'Earn tokens', 'Priority support'],
    ctaLabel: 'Subscribe Now',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: null,
    features: [
      'Everything in Pro',
      'Team management',
      'Custom courses',
      'API access',
      'Dedicated manager',
    ],
    ctaLabel: 'Contact Sales',
  },
]

export const testimonials: Testimonial[] = [
  {
    id: 'sarah',
    quote:
      "The AI tutor helped me understand DeFi protocols in days — not weeks. I've already earned back my subscription through token rewards.",
    name: 'Sarah K.',
    role: 'Crypto Trader',
  },
  {
    id: 'james',
    quote:
      "Best crypto education platform I've used. The courses are practical and the affiliate program is genuinely profitable.",
    name: 'James L.',
    role: 'Software Engineer',
  },
  {
    id: 'maria',
    quote:
      "Started with zero blockchain knowledge. Now I'm building smart contracts and earning tokens while learning. Incredible platform.",
    name: 'Maria G.',
    role: 'Web3 Builder',
  },
]

export const courses: Course[] = [
  {
    id: 'blockchain-fundamentals',
    title: 'Blockchain Fundamentals',
    subtitle: 'Understand how decentralized networks work from first principles.',
    category: 'Blockchain',
    level: 'Beginner',
    duration: '6h 20m',
    lessonsCount: 12,
    students: 4200,
    description:
      'Build confidence in blockchain concepts: consensus, immutability, wallets, and transaction lifecycle.',
    rewardTokens: 250,
    lessons: [
      {
        id: 'consensus',
        title: 'Consensus Mechanisms',
        duration: '28m',
        summary:
          'Compare Proof of Work and Proof of Stake to understand distributed trust.',
      },
      {
        id: 'hashing',
        title: 'Cryptographic Hashing',
        duration: '22m',
        summary:
          'Learn why hash functions are deterministic, one-way, and tamper-evident.',
      },
      {
        id: 'immutability',
        title: 'Immutability and Block History',
        duration: '31m',
        summary:
          'Explore why historical ledger data is so difficult to alter retroactively.',
      },
    ],
    quiz: [
      {
        id: 'q1',
        prompt:
          'What is the primary purpose of a consensus mechanism in blockchain?',
        options: [
          'To encrypt user data',
          'To agree on the state of the ledger without a central authority',
          'To increase transaction speed',
          'To reduce gas fees',
        ],
        correctAnswer:
          'To agree on the state of the ledger without a central authority',
        explanation:
          'Consensus mechanisms allow distributed nodes to agree on valid state changes without relying on a trusted third party.',
      },
      {
        id: 'q2',
        prompt:
          'Which of the following is NOT a property of a cryptographic hash function?',
        options: [
          'Deterministic output',
          'Reversible computation',
          'Avalanche effect',
          'Fixed-length output',
        ],
        correctAnswer: 'Reversible computation',
        explanation:
          'Cryptographic hash functions are intentionally one-way; you cannot reverse a hash to recover the original input.',
      },
      {
        id: 'q3',
        prompt: "What does 'immutability' mean in blockchain?",
        options: [
          'Transactions are free',
          'Data once written cannot be altered',
          'Anyone can write to the chain',
          'The network never goes offline',
        ],
        correctAnswer: 'Data once written cannot be altered',
        explanation:
          'Immutability means that once a block is accepted, changing that data requires infeasible amounts of coordinated work.',
      },
    ],
  },
  {
    id: 'defi-masterclass',
    title: 'DeFi Masterclass',
    subtitle: 'Navigate lending, AMMs, yield strategies, and protocol risk.',
    category: 'DeFi',
    level: 'Intermediate',
    duration: '8h 45m',
    lessonsCount: 16,
    students: 3100,
    description:
      'Go beyond basic DeFi concepts and evaluate protocol design, tokenomics, and risk controls.',
    rewardTokens: 420,
    lessons: [
      {
        id: 'amm',
        title: 'Automated Market Makers',
        duration: '33m',
        summary:
          'Understand liquidity pools, slippage, and impermanent loss with practical examples.',
      },
      {
        id: 'lending',
        title: 'Overcollateralized Lending',
        duration: '30m',
        summary:
          'Learn how collateral factors and liquidation mechanics protect lenders.',
      },
      {
        id: 'risk',
        title: 'DeFi Risk Framework',
        duration: '35m',
        summary:
          'Build a checklist for smart contract, oracle, governance, and market risk.',
      },
    ],
    quiz: [
      {
        id: 'd1',
        prompt: 'What mainly causes impermanent loss?',
        options: [
          'Gas fees only',
          'Price divergence between pooled assets',
          'Low wallet balance',
          'Network congestion',
        ],
        correctAnswer: 'Price divergence between pooled assets',
        explanation:
          'Impermanent loss is driven by relative price movement between assets in an AMM pool.',
      },
      {
        id: 'd2',
        prompt:
          'Why do lending protocols use collateral requirements above 100%?',
        options: [
          'To reduce UX complexity',
          'To account for market volatility and protect lenders',
          'To increase token supply',
          'To eliminate smart contract bugs',
        ],
        correctAnswer: 'To account for market volatility and protect lenders',
        explanation:
          'Overcollateralization buffers against rapid market moves and liquidations.',
      },
      {
        id: 'd3',
        prompt: 'Which risk is unique to protocols relying on external price feeds?',
        options: ['Oracle manipulation risk', 'Frontend caching risk', 'DNS risk', 'CDN risk'],
        correctAnswer: 'Oracle manipulation risk',
        explanation:
          'If an attacker manipulates an oracle feed, protocol decisions can become unsafe.',
      },
    ],
  },
  {
    id: 'smart-contract-development',
    title: 'Smart Contract Development',
    subtitle: 'Design, build, and secure contracts ready for production.',
    category: 'Smart Contracts',
    level: 'Advanced',
    duration: '10h 10m',
    lessonsCount: 18,
    students: 2200,
    description:
      'Develop Solidity skills with secure coding practices, testing strategies, and deployment workflows.',
    rewardTokens: 560,
    lessons: [
      {
        id: 'solidity-basics',
        title: 'Solidity Building Blocks',
        duration: '38m',
        summary:
          'Cover data locations, visibility, inheritance, and common EVM patterns.',
      },
      {
        id: 'testing',
        title: 'Contract Testing Strategy',
        duration: '40m',
        summary:
          'Write meaningful unit and integration tests for happy paths and adversarial flows.',
      },
      {
        id: 'auditing',
        title: 'Security Review Checklist',
        duration: '42m',
        summary:
          'Spot reentrancy, authorization, and overflow issues before deployment.',
      },
    ],
    quiz: [
      {
        id: 's1',
        prompt: 'What is the main reason to use checks-effects-interactions?',
        options: [
          'To reduce deployment size',
          'To mitigate reentrancy vulnerabilities',
          'To improve wallet UX',
          'To avoid writing tests',
        ],
        correctAnswer: 'To mitigate reentrancy vulnerabilities',
        explanation:
          'Updating internal state before external calls reduces attack surface for reentrant callbacks.',
      },
      {
        id: 's2',
        prompt: 'Which test type best validates multiple contracts working together?',
        options: ['Unit tests', 'Snapshot tests', 'Integration tests', 'Lint checks'],
        correctAnswer: 'Integration tests',
        explanation:
          'Integration tests exercise contract interactions under realistic end-to-end scenarios.',
      },
      {
        id: 's3',
        prompt: 'Why use role-based access control in smart contracts?',
        options: [
          'To randomize gas usage',
          'To restrict privileged actions to approved actors',
          'To speed up block production',
          'To bypass audits',
        ],
        correctAnswer: 'To restrict privileged actions to approved actors',
        explanation:
          'RBAC enforces least privilege and prevents unauthorized state changes.',
      },
    ],
  },
  {
    id: 'ai-ml-basics',
    title: 'AI & Machine Learning Basics',
    subtitle: 'Learn practical AI foundations and real-world model thinking.',
    category: 'AI',
    level: 'Beginner',
    duration: '5h 10m',
    lessonsCount: 10,
    students: 5300,
    description:
      'Understand modern AI workflows, from data preparation to model evaluation and deployment tradeoffs.',
    rewardTokens: 210,
    lessons: [
      {
        id: 'ml-lifecycle',
        title: 'ML Lifecycle Overview',
        duration: '24m',
        summary:
          'See the full pipeline: problem framing, training, validation, and iteration.',
      },
      {
        id: 'evaluation',
        title: 'Model Evaluation',
        duration: '26m',
        summary:
          'Interpret precision, recall, F1 score, and baseline performance correctly.',
      },
      {
        id: 'prompting',
        title: 'Prompt Design Fundamentals',
        duration: '27m',
        summary:
          'Use structured prompting to produce more reliable large language model outputs.',
      },
    ],
    quiz: [
      {
        id: 'a1',
        prompt: 'Why is a validation split important?',
        options: [
          'It increases training speed only',
          'It helps estimate generalization on unseen data',
          'It removes the need for test sets',
          'It guarantees no bias',
        ],
        correctAnswer: 'It helps estimate generalization on unseen data',
        explanation:
          'Validation data provides a realistic signal of how a model may perform outside training data.',
      },
      {
        id: 'a2',
        prompt: 'Which metric is best when false negatives are very costly?',
        options: ['Accuracy only', 'Precision only', 'Recall-focused metrics', 'Model size'],
        correctAnswer: 'Recall-focused metrics',
        explanation:
          'Recall emphasizes catching as many true positives as possible, reducing misses.',
      },
      {
        id: 'a3',
        prompt: 'What is a practical goal of prompt engineering?',
        options: [
          'Compress model weights',
          'Improve response quality and consistency',
          'Bypass token limits',
          'Train new hardware',
        ],
        correctAnswer: 'Improve response quality and consistency',
        explanation:
          'Clear structure and constraints in prompts help models produce more reliable outputs.',
      },
    ],
  },
]

export const categories: CourseCategory[] = [
  'All',
  'Blockchain',
  'DeFi',
  'Smart Contracts',
  'AI',
  'Trading',
  'Security',
]

export const tutorSuggestions = [
  'Explain blockchain in simple terms',
  'What is DeFi and how does it work?',
  'How do smart contracts work?',
  'Explain proof of stake vs proof of work',
] as const

export const QUICK_QUESTIONS = tutorSuggestions

export const TOPICS = [
  'Blockchain Basics',
  'DeFi Protocols',
  'Crypto Trading',
  'Smart Contracts',
  'Web3 Security',
  'AI & Machine Learning',
] as const

export const FEATURES = platformFeatures

export const topCourses = courses.slice(0, 3)

