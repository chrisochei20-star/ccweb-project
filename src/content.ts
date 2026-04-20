export type NavLinkItem = {
  label: string;
  to: string;
};

export type HeroStat = {
  value: string;
  label: string;
};

export type WhyChooseItem = {
  title: string;
  description: string;
};

export type CourseItem = {
  id: number;
  category: "Crypto" | "AI";
  title: string;
  level: string;
  duration: string;
  students: string;
  rating: string;
  description: string;
};

export type PricingPlan = {
  name: string;
  price: string;
  suffix: string;
  featured?: boolean;
  features: string[];
  cta: string;
};

export type TestimonialItem = {
  initials: string;
  name: string;
  role: string;
  quote: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type BlogPost = {
  title: string;
  summary: string;
};

export type CommunityActivity = {
  title: string;
  description: string;
};

export const siteLinks: NavLinkItem[] = [
  { label: "Home", to: "/" },
  { label: "Courses", to: "/courses" },
  { label: "AI Tutor", to: "/ai-tutor" },
  { label: "Pricing", to: "/pricing" },
  { label: "Tokens", to: "/tokens" },
  { label: "Affiliates", to: "/affiliates" },
  { label: "Community", to: "/community" },
  { label: "Blog", to: "/blog" },
  { label: "About", to: "/about" },
  { label: "FAQ", to: "/faq" },
];

export const heroStats: HeroStat[] = [
  { value: "50K+", label: "Students" },
  { value: "200+", label: "Courses" },
  { value: "$2M+", label: "Earned by Affiliates" },
  { value: "99.9%", label: "Uptime" },
];

export const whyChooseUs: WhyChooseItem[] = [
  {
    title: "Crypto & AI Courses",
    description:
      "Master blockchain, DeFi, smart contracts, and AI with expert-led courses.",
  },
  {
    title: "AI Tutoring",
    description: "24/7 personalized AI tutor that adapts to your learning pace.",
  },
  {
    title: "Earn Tokens",
    description: "Learn and earn - get rewarded with tokens for completing courses.",
  },
  {
    title: "Affiliate Program",
    description: "Refer friends and earn recurring commissions automatically.",
  },
];

export const courseCatalog: CourseItem[] = [
  {
    id: 1,
    category: "Crypto",
    title: "Blockchain Fundamentals",
    level: "Beginner",
    duration: "6h",
    students: "12,400",
    rating: "4.9",
    description:
      "Build a strong foundation in wallets, blocks, consensus, and real-world Web3 use cases.",
  },
  {
    id: 2,
    category: "Crypto",
    title: "Smart Contract Development",
    level: "Intermediate",
    duration: "10h",
    students: "8,200",
    rating: "4.8",
    description:
      "Write, test, and deploy Solidity contracts while learning security and audit basics.",
  },
  {
    id: 3,
    category: "Crypto",
    title: "DeFi Masterclass",
    level: "Advanced",
    duration: "12h",
    students: "5,100",
    rating: "4.9",
    description:
      "Understand lending, liquidity, staking, and yield strategies with practical walkthroughs.",
  },
  {
    id: 4,
    category: "AI",
    title: "AI & Machine Learning Basics",
    level: "Beginner",
    duration: "8h",
    students: "15,600",
    rating: "4.7",
    description:
      "Learn prompts, models, automation, and beginner ML concepts with guided exercises.",
  },
  {
    id: 5,
    category: "AI",
    title: "Prompt Engineering for Builders",
    level: "Intermediate",
    duration: "5h",
    students: "6,900",
    rating: "4.8",
    description:
      "Design high-quality prompts, workflows, and evaluation loops for production use.",
  },
  {
    id: 6,
    category: "Crypto",
    title: "Wallet Security & Self Custody",
    level: "Beginner",
    duration: "4h",
    students: "9,300",
    rating: "4.9",
    description:
      "Protect your assets with secure wallet setup, recovery, and risk management practices.",
  },
];

export const pricingPlans: PricingPlan[] = [
  {
    name: "Free",
    price: "$0",
    suffix: "forever",
    features: ["3 free courses", "Community access", "Basic AI tutor"],
    cta: "Get Started",
  },
  {
    name: "Pro",
    price: "$29",
    suffix: "/month",
    featured: true,
    features: [
      "All courses",
      "Unlimited AI tutor",
      "Earn tokens",
      "Priority support",
      "Certificates",
    ],
    cta: "Subscribe Now",
  },
  {
    name: "Enterprise",
    price: "$99",
    suffix: "/month",
    features: [
      "Everything in Pro",
      "Team management",
      "Custom courses",
      "API access",
      "Dedicated manager",
    ],
    cta: "Contact Sales",
  },
];

export const testimonials: TestimonialItem[] = [
  {
    initials: "AR",
    name: "Alex R.",
    role: "Crypto Trader",
    quote:
      "The AI tutor helped me understand DeFi protocols in days - not weeks. I've already earned back my subscription through token rewards.",
  },
  {
    initials: "SK",
    name: "Sarah K.",
    role: "Software Engineer",
    quote:
      "Best crypto education platform I've used. The courses are practical and the affiliate program is genuinely profitable.",
  },
  {
    initials: "JL",
    name: "James L.",
    role: "Student",
    quote:
      "Started with zero blockchain knowledge. Now I'm building smart contracts and earning tokens while learning. Incredible platform.",
  },
  {
    initials: "MG",
    name: "Maria G.",
    role: "Entrepreneur",
    quote:
      "The enterprise plan transformed how our team understands Web3. The custom courses feature is a game-changer for onboarding.",
  },
];

export const faqs: FaqItem[] = [
  {
    question: "What is Chrisccwebfoundation?",
    answer:
      "Chrisccwebfoundation is a learning platform focused on crypto, blockchain, and AI education with built-in monetization through subscriptions, tokens, and referrals.",
  },
  {
    question: "How does the AI tutor work?",
    answer:
      "The AI tutor personalizes lessons, answers questions instantly, suggests next steps, and helps reinforce concepts based on your progress.",
  },
  {
    question: "Can I earn while learning?",
    answer:
      "Yes. Pro learners can unlock token rewards for milestones, and anyone can use the affiliate program to earn recurring commissions.",
  },
  {
    question: "Do you offer certificates?",
    answer:
      "Pro and Enterprise members can generate certificates after completing course paths and capstone assessments.",
  },
  {
    question: "Is the platform beginner friendly?",
    answer:
      "Absolutely. The catalog includes beginner-friendly learning paths for both crypto and AI, along with guided tutoring.",
  },
  {
    question: "Can teams use the platform?",
    answer:
      "Enterprise plans include team access, onboarding support, custom course bundles, and shared progress reporting.",
  },
];

export const communityPerks: string[] = [
  "Live workshops with mentors and operators",
  "Peer accountability and study groups",
  "Builder networking across Web3 and AI",
  "Challenge boards and community rewards",
];

export const communityActivities: CommunityActivity[] = [
  {
    title: "Weekly builder calls",
    description:
      "Break down projects, get feedback, and stay accountable with peers and mentors.",
  },
  {
    title: "Challenge sprints",
    description:
      "Turn learning into action through practical missions focused on crypto and AI workflows.",
  },
  {
    title: "Peer feedback rooms",
    description:
      "Share your dashboards, prompts, automations, and prototypes with the community.",
  },
];

export const blogPosts: BlogPost[] = [
  {
    title: "How to start learning blockchain without feeling overwhelmed",
    summary:
      "A practical first-week roadmap for understanding wallets, chains, and smart contracts.",
  },
  {
    title: "Five AI tools every Web3 learner should know",
    summary:
      "Use AI to accelerate research, coding, note-taking, and study sessions.",
  },
  {
    title: "What makes recurring affiliate income actually work",
    summary:
      "Lessons from creators and educators who built consistent revenue with community-first offers.",
  },
];
