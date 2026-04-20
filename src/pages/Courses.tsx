import { useState } from "react";
import {
  BookOpen,
  Brain,
  Clock,
  Code,
  Coins,
  Filter,
  Layers,
  Search,
  Star,
  TrendingUp,
  Users,
  Wallet,
  Sparkles,
  Shield,
  Database,
  Bot,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface Course {
  title: string;
  description: string;
  category: string;
  level: string;
  lessons: number;
  duration: string;
  students: number;
  rating: number;
  icon: LucideIcon;
  gradient: string;
  tags: string[];
}

const allCourses: Course[] = [
  {
    title: "Blockchain Fundamentals",
    description:
      "Understand the core concepts of blockchain technology, consensus mechanisms, and distributed ledger systems.",
    category: "Web3",
    level: "Beginner",
    lessons: 24,
    duration: "8 hours",
    students: 3420,
    rating: 4.9,
    icon: Layers,
    gradient: "from-primary to-violet-500",
    tags: ["Blockchain", "Fundamentals", "Consensus"],
  },
  {
    title: "Smart Contract Development",
    description:
      "Master Solidity programming and build secure, efficient smart contracts on Ethereum and EVM chains.",
    category: "Web3",
    level: "Intermediate",
    lessons: 32,
    duration: "12 hours",
    students: 2180,
    rating: 4.8,
    icon: Code,
    gradient: "from-secondary to-cyan-400",
    tags: ["Solidity", "Smart Contracts", "Ethereum"],
  },
  {
    title: "DeFi Protocols Deep Dive",
    description:
      "Explore decentralized finance protocols including AMMs, lending platforms, and yield optimization.",
    category: "Crypto",
    level: "Advanced",
    lessons: 28,
    duration: "10 hours",
    students: 1560,
    rating: 4.7,
    icon: Coins,
    gradient: "from-amber-500 to-orange-400",
    tags: ["DeFi", "AMMs", "Yield Farming"],
  },
  {
    title: "AI & Machine Learning Basics",
    description:
      "Get started with artificial intelligence and machine learning concepts, algorithms, and practical applications.",
    category: "AI",
    level: "Beginner",
    lessons: 36,
    duration: "14 hours",
    students: 4890,
    rating: 4.9,
    icon: Brain,
    gradient: "from-pink-500 to-rose-400",
    tags: ["AI", "Machine Learning", "Neural Networks"],
  },
  {
    title: "Crypto Trading Strategies",
    description:
      "Learn technical analysis, risk management, and proven trading strategies for cryptocurrency markets.",
    category: "Crypto",
    level: "Intermediate",
    lessons: 20,
    duration: "7 hours",
    students: 2750,
    rating: 4.6,
    icon: TrendingUp,
    gradient: "from-emerald-500 to-green-400",
    tags: ["Trading", "Technical Analysis", "Risk Management"],
  },
  {
    title: "Web3 Wallet Integration",
    description:
      "Build dApps with wallet connections, transaction signing, and multi-chain support using modern frameworks.",
    category: "Web3",
    level: "Intermediate",
    lessons: 18,
    duration: "6 hours",
    students: 1920,
    rating: 4.8,
    icon: Wallet,
    gradient: "from-indigo-500 to-blue-400",
    tags: ["Wallets", "dApps", "Multi-chain"],
  },
  {
    title: "NFT Development & Marketplaces",
    description:
      "Create, deploy, and trade NFTs. Build your own marketplace with ERC-721 and ERC-1155 standards.",
    category: "Web3",
    level: "Intermediate",
    lessons: 22,
    duration: "8 hours",
    students: 2340,
    rating: 4.7,
    icon: Sparkles,
    gradient: "from-purple-500 to-fuchsia-400",
    tags: ["NFTs", "ERC-721", "Marketplace"],
  },
  {
    title: "Blockchain Security & Auditing",
    description:
      "Learn to identify vulnerabilities, conduct security audits, and write exploit-proof smart contracts.",
    category: "Web3",
    level: "Advanced",
    lessons: 26,
    duration: "10 hours",
    students: 980,
    rating: 4.9,
    icon: Shield,
    gradient: "from-red-500 to-orange-400",
    tags: ["Security", "Auditing", "Vulnerabilities"],
  },
  {
    title: "On-Chain Data Analytics",
    description:
      "Analyze blockchain data using tools like Dune Analytics, The Graph, and custom indexers.",
    category: "Crypto",
    level: "Intermediate",
    lessons: 16,
    duration: "6 hours",
    students: 1450,
    rating: 4.5,
    icon: Database,
    gradient: "from-teal-500 to-emerald-400",
    tags: ["Analytics", "Data", "The Graph"],
  },
  {
    title: "Generative AI & LLMs",
    description:
      "Explore large language models, prompt engineering, fine-tuning, and building AI-powered applications.",
    category: "AI",
    level: "Intermediate",
    lessons: 30,
    duration: "11 hours",
    students: 5200,
    rating: 4.8,
    icon: Bot,
    gradient: "from-sky-500 to-blue-400",
    tags: ["LLMs", "Prompt Engineering", "Generative AI"],
  },
  {
    title: "AI Agents & Autonomous Systems",
    description:
      "Build autonomous AI agents that can reason, plan, and execute complex tasks using modern frameworks.",
    category: "AI",
    level: "Advanced",
    lessons: 24,
    duration: "9 hours",
    students: 1870,
    rating: 4.7,
    icon: Brain,
    gradient: "from-violet-500 to-purple-400",
    tags: ["AI Agents", "Autonomous", "ReAct"],
  },
  {
    title: "Tokenomics & Token Design",
    description:
      "Design sustainable token economies, understand vesting schedules, and model token value dynamics.",
    category: "Crypto",
    level: "Advanced",
    lessons: 14,
    duration: "5 hours",
    students: 1120,
    rating: 4.6,
    icon: Coins,
    gradient: "from-yellow-500 to-amber-400",
    tags: ["Tokenomics", "Token Design", "Economics"],
  },
];

const categories = ["All", "Web3", "Crypto", "AI"];
const levels = ["All Levels", "Beginner", "Intermediate", "Advanced"];

export function Courses() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All Levels");

  const filtered = allCourses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(search.toLowerCase()) ||
      course.description.toLowerCase().includes(search.toLowerCase()) ||
      course.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory =
      selectedCategory === "All" || course.category === selectedCategory;
    const matchesLevel =
      selectedLevel === "All Levels" || course.level === selectedLevel;
    return matchesSearch && matchesCategory && matchesLevel;
  });

  return (
    <div className="py-12 md:py-20">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <BookOpen className="w-3 h-3 mr-1" />
            Course Catalog
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Explore Our <span className="gradient-text">Courses</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From blockchain basics to advanced AI systems, find the perfect
            course to advance your skills and career.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 mr-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
            </div>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            {levels.map((level) => (
              <Button
                key={level}
                variant={selectedLevel === level ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedLevel(level)}
              >
                {level}
              </Button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <p className="text-sm text-muted-foreground mb-6">
          Showing {filtered.length} of {allCourses.length} courses
        </p>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course) => (
            <Card
              key={course.title}
              className="group hover:border-primary/30 hover:glow-sm bg-card/50 overflow-hidden flex flex-col"
            >
              <div className={`h-2 bg-gradient-to-r ${course.gradient}`} />
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="secondary">{course.category}</Badge>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-medium">{course.rating}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${course.gradient} flex items-center justify-center shrink-0`}
                  >
                    <course.icon className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors leading-snug">
                    {course.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-sm text-muted-foreground mb-4 flex-1">
                  {course.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {course.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    {course.lessons} lessons
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {course.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {course.students.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No courses found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters to find what you're looking
              for.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
