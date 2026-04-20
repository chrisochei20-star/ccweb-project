import {
  Award,
  BadgePercent,
  BookOpen,
  Bot,
  BrainCircuit,
  Briefcase,
  CircleDollarSign,
  Coins,
  Cpu,
  Globe,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
};

export type Stat = {
  value: string;
  label: string;
};

export type Highlight = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export type Course = {
  id: string;
  category: "Crypto" | "AI";
  title: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  students: string;
  rating: string;
  href: string;
};

export type PricingPlan = {
  name: string;
  price: string;
  cadence: string;
  features: string[];
  cta: string;
  href: string;
  featured?: boolean;
};

export type Testimonial = {
  quote: string;
  initials: string;
  name: string;
  role: string;
};

export type FooterSection = {
  title: string;
  links: NavItem[];
};

export type CommunityChannel = {
  title: string;
  members: string;
  posts: string;
  icon: LucideIcon;
};

export type BlogPost = {
  category: string;
  date: string;
  title: string;
  excerpt: string;
  icon: LucideIcon;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type DashboardMetric = {
  label: string;
  value: string;
  delta: string;
  icon: LucideIcon;
};

export type DashboardCourse = {
  title: string;
  updated: string;
  lessons: string;
  streak?: string;
  progress: number;
  href: string;
};

export type TokenUtility = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export const brandName = "CHRISCCWEB";
export const organizationName = "Chrisccwebfoundation";
export const siteDescription =
  "Master blockchain and artificial intelligence with AI-powered tutoring — and earn through subscriptions, tokens, and affiliates.";

export const navigation: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Courses", href: "/courses" },
  { label: "AI Tutor", href: "/ai-tutor" },
  { label: "Pricing", href: "/pricing" },
  { label: "Tokens", href: "/tokens" },
  { label: "Affiliates", href: "/affiliates" },
  { label: "Community", href: "/community" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
  { label: "FAQ", href: "/faq" },
];

export const heroStats: Stat[] = [
  { value: "50K+", label: "Students" },
  { value: "200+", label: "Courses" },
  { value: "$2M+", label: "Earned by Affiliates" },
  { value: "99.9%", label: "Uptime" },
];

export const highlights: Highlight[] = [
  {
    title: "Crypto & AI Courses",
    description:
      "Master blockchain, DeFi, smart contracts, and AI with expert-led courses.",
    icon: BookOpen,
  },
  {
    title: "AI Tutoring",
    description: "24/7 personalized AI tutor that adapts to your learning pace.",
    icon: Bot,
  },
  {
    title: "Earn Tokens",
    description: "Learn and earn — get rewarded with tokens for completing courses.",
    icon: Coins,
  },
  {
    title: "Affiliate Program",
    description: "Refer friends and earn recurring commissions automatically.",
    icon: BadgePercent,
  },
];

export const popularCourses: Course[] = [
  {
    id: "1",
    category: "Crypto",
    title: "Blockchain Fundamentals",
    level: "Beginner",
    duration: "6h",
    students: "12,400",
    rating: "4.9",
    href: "/courses/1",
  },
  {
    id: "2",
    category: "Crypto",
    title: "Smart Contract Development",
    level: "Intermediate",
    duration: "10h",
    students: "8,200",
    rating: "4.8",
    href: "/courses/2",
  },
  {
    id: "3",
    category: "Crypto",
    title: "DeFi Masterclass",
    level: "Advanced",
    duration: "12h",
    students: "5,100",
    rating: "4.9",
    href: "/courses/3",
  },
  {
    id: "4",
    category: "AI",
    title: "AI & Machine Learning Basics",
    level: "Beginner",
    duration: "8h",
    students: "15,600",
    rating: "4.7",
    href: "/courses/4",
  },
];

export const homePricingPlans: PricingPlan[] = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    features: ["3 free courses", "Community access", "Basic AI tutor"],
    cta: "Get Started",
    href: "/signup",
  },
  {
    name: "Pro",
    price: "$29",
    cadence: "/month",
    features: [
      "All courses",
      "Unlimited AI tutor",
      "Earn tokens",
      "Priority support",
      "Certificates",
    ],
    cta: "Subscribe Now",
    href: "/signup",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "$99",
    cadence: "/month",
    features: [
      "Everything in Pro",
      "Team management",
      "Custom courses",
      "API access",
      "Dedicated manager",
    ],
    cta: "Contact Sales",
    href: "/signup",
  },
];

export const pricingPlans: PricingPlan[] = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    features: ["3 free courses", "Community access", "Basic AI tutor"],
    cta: "Get Started",
    href: "/signup",
  },
  {
    name: "Pro",
    price: "$10",
    cadence: "/month",
    features: [
      "All courses",
      "Unlimited AI tutor",
      "Earn tokens",
      "Priority support",
      "Certificate of completion",
    ],
    cta: "Subscribe Now",
    href: "/signup",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "$35",
    cadence: "/month",
    features: [
      "Everything in Pro",
      "Team management",
      "Custom courses",
      "API access",
      "Dedicated account manager",
    ],
    cta: "Contact Sales",
    href: "/signup",
  },
];

export const testimonials: Testimonial[] = [
  {
    quote:
      "The AI tutor helped me understand DeFi protocols in days — not weeks. I've already earned back my subscription through token rewards.",
    initials: "AR",
    name: "Alex R.",
    role: "Crypto Trader",
  },
  {
    quote:
      "Best crypto education platform I've used. The courses are practical and the affiliate program is genuinely profitable.",
    initials: "SK",
    name: "Sarah K.",
    role: "Software Engineer",
  },
  {
    quote:
      "Started with zero blockchain knowledge. Now I'm building smart contracts and earning tokens while learning. Incredible platform.",
    initials: "JL",
    name: "James L.",
    role: "Student",
  },
  {
    quote:
      "The enterprise plan transformed how our team understands Web3. The custom courses feature is a game-changer for onboarding.",
    initials: "MG",
    name: "Maria G.",
    role: "Entrepreneur",
  },
];

export const footerSections: FooterSection[] = [
  {
    title: "LEARN",
    links: [
      { label: "Courses", href: "/courses" },
      { label: "AI Tutor", href: "/ai-tutor" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "EARN",
    links: [
      { label: "Tokens", href: "/tokens" },
      { label: "Affiliates", href: "/affiliates" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "CONNECT",
    links: [
      { label: "Community", href: "/community" },
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "ACCOUNT",
    links: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Profile", href: "/profile" },
      { label: "FAQ", href: "/faq" },
    ],
  },
];

export const courseCategories = ["All", "Crypto", "AI", "Trading", "Web3"] as const;

export const aiTutorPrompts = [
  "Explain blockchain in simple terms",
  "What is DeFi and how does it work?",
  "How do smart contracts work?",
  "Explain proof of stake vs proof of work",
];

export const tokenUtilities: TokenUtility[] = [
  {
    title: "Learn & Earn",
    description: "Complete courses and quizzes to earn CCWEB tokens.",
    icon: GraduationCap,
  },
  {
    title: "Staking Rewards",
    description: "Stake your tokens and earn passive income.",
    icon: Wallet,
  },
  {
    title: "Governance",
    description: "Vote on platform decisions with your tokens.",
    icon: ShieldCheck,
  },
  {
    title: "Marketplace",
    description: "Use tokens to unlock premium content and features.",
    icon: Sparkles,
  },
];

export const tokenStats: Stat[] = [
  { value: "100M", label: "Total Supply" },
  { value: "$0.42", label: "Price" },
  { value: "24.5M", label: "Circulating" },
];

export const affiliateSteps = [
  {
    title: "Sign Up",
    description: "Create a free affiliate account in seconds.",
    icon: Users,
  },
  {
    title: "Share Your Link",
    description: "Share your unique referral link with your audience.",
    icon: Globe,
  },
  {
    title: "Earn Commissions",
    description: "Get 30% recurring commission on every referral.",
    icon: CircleDollarSign,
  },
];

export const communityChannels: CommunityChannel[] = [
  {
    title: "General Discussion",
    members: "8,400",
    posts: "2.1K",
    icon: MessageSquare,
  },
  {
    title: "Crypto Trading",
    members: "5,200",
    posts: "3.4K",
    icon: Briefcase,
  },
  {
    title: "AI Projects",
    members: "3,100",
    posts: "890",
    icon: BrainCircuit,
  },
  {
    title: "Study Groups",
    members: "2,800",
    posts: "1.2K",
    icon: Users,
  },
];

export const blogPosts: BlogPost[] = [
  {
    category: "Crypto",
    date: "Mar 28, 2026",
    title: "Understanding Zero-Knowledge Proofs",
    excerpt:
      "ZK proofs are revolutionizing privacy on blockchain. Here's what you need to know.",
    icon: ShieldCheck,
  },
  {
    category: "AI",
    date: "Mar 25, 2026",
    title: "How AI is Transforming Education",
    excerpt:
      "Adaptive learning, personalized tutors — AI is reshaping how we learn.",
    icon: Bot,
  },
  {
    category: "DeFi",
    date: "Mar 22, 2026",
    title: "Top 5 DeFi Protocols in 2026",
    excerpt:
      "A look at the most innovative DeFi protocols this year.",
    icon: Coins,
  },
  {
    category: "Tutorial",
    date: "Mar 18, 2026",
    title: "Building Your First Smart Contract",
    excerpt:
      "Step-by-step guide to deploying on Ethereum with Solidity.",
    icon: Cpu,
  },
];

export const faqItems: FaqItem[] = [
  {
    question: "What is Chrisccwebfoundation?",
    answer:
      "Chrisccwebfoundation is a crypto and AI learning platform that combines expert-led content, AI tutoring, and learn-to-earn incentives.",
  },
  {
    question: "How do I earn tokens?",
    answer:
      "Complete courses, quizzes, and engagement milestones to unlock CCWEB token rewards.",
  },
  {
    question: "What does the Pro subscription include?",
    answer:
      "Pro unlocks the full course catalog, unlimited AI tutor usage, token rewards, priority support, and completion certificates.",
  },
  {
    question: "How does the affiliate program work?",
    answer:
      "You receive a referral link and earn recurring commissions when your audience subscribes through it.",
  },
  {
    question: "Is the AI tutor available 24/7?",
    answer:
      "Yes. The AI tutor is designed as an always-on learning assistant for crypto, AI, and Web3 topics.",
  },
  {
    question: "Can I cancel my subscription?",
    answer:
      "Yes. Plans can be changed or canceled anytime from your subscription settings.",
  },
];

export const aboutPillars = [
  {
    title: "Mission",
    description:
      "Make crypto and AI education accessible, affordable, and rewarding for everyone worldwide.",
    icon: Zap,
  },
  {
    title: "Vision",
    description:
      "A world where financial literacy and technical skills are universal, powered by blockchain and AI.",
    icon: Globe,
  },
  {
    title: "Values",
    description:
      "Innovation, transparency, community-first, and continuous learning drive everything we do.",
    icon: Award,
  },
];

export const dashboardMetrics: DashboardMetric[] = [
  {
    label: "Courses Enrolled",
    value: "5",
    delta: "+1 this month",
    icon: BookOpen,
  },
  {
    label: "Tokens Earned",
    value: "1,250",
    delta: "+180 this week",
    icon: Coins,
  },
  {
    label: "Referrals",
    value: "12",
    delta: "+3 this month",
    icon: Users,
  },
  {
    label: "Affiliate Revenue",
    value: "$340",
    delta: "+$85 this week",
    icon: CircleDollarSign,
  },
];

export const dashboardTabs = ["Progress", "Wallet", "Certificates"] as const;

export const dashboardCourses: DashboardCourse[] = [
  {
    title: "Blockchain Fundamentals",
    updated: "2h ago",
    lessons: "9/12 lessons",
    streak: "5 day streak",
    progress: 75,
    href: "/courses/1/lesson/10",
  },
  {
    title: "AI & Machine Learning Basics",
    updated: "1d ago",
    lessons: "6/15 lessons",
    streak: "3 day streak",
    progress: 40,
    href: "/courses/4/lesson/7",
  },
  {
    title: "DeFi Masterclass",
    updated: "3d ago",
    lessons: "2/20 lessons",
    progress: 10,
    href: "/courses/3/lesson/3",
  },
];

export const authCardBullets = [
  "Learn faster with personalized AI support",
  "Track token rewards and affiliate activity",
  "Save progress across crypto and AI courses",
];

export const socialContact = [
  { label: "Email", value: "hello@chrisccweb.io" },
  { label: "Discord", value: "Join Server" },
  { label: "Location", value: "Worldwide" },
];

export const dashboardPlan = {
  name: "Free Plan",
  action: "Upgrade now",
  href: "/subscription",
  icon: LayoutDashboard,
};
