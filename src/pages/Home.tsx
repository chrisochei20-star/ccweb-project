import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Code,
  Coins,
  Globe,
  GraduationCap,
  Layers,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: BookOpen,
    title: "Expert-Led Courses",
    description:
      "Learn from blockchain developers, AI researchers, and crypto analysts with real-world experience.",
  },
  {
    icon: Code,
    title: "Hands-On Projects",
    description:
      "Build real dApps, smart contracts, and AI models through guided, practical projects.",
  },
  {
    icon: Users,
    title: "Community Learning",
    description:
      "Join a vibrant community of learners, developers, and industry professionals.",
  },
  {
    icon: Shield,
    title: "Industry Certificates",
    description:
      "Earn verifiable on-chain certificates that prove your skills to employers.",
  },
  {
    icon: Zap,
    title: "Live Workshops",
    description:
      "Participate in weekly live sessions with Q&A, code reviews, and collaborative learning.",
  },
  {
    icon: TrendingUp,
    title: "Career Support",
    description:
      "Get access to job boards, portfolio reviews, and mentorship for Web3 and AI careers.",
  },
];

const courses = [
  {
    title: "Blockchain Fundamentals",
    category: "Web3",
    level: "Beginner",
    lessons: 24,
    students: 3420,
    icon: Layers,
    gradient: "from-primary to-violet-500",
  },
  {
    title: "Smart Contract Development",
    category: "Web3",
    level: "Intermediate",
    lessons: 32,
    students: 2180,
    icon: Code,
    gradient: "from-secondary to-cyan-400",
  },
  {
    title: "DeFi Protocols Deep Dive",
    category: "Crypto",
    level: "Advanced",
    lessons: 28,
    students: 1560,
    icon: Coins,
    gradient: "from-amber-500 to-orange-400",
  },
  {
    title: "AI & Machine Learning Basics",
    category: "AI",
    level: "Beginner",
    lessons: 36,
    students: 4890,
    icon: Brain,
    gradient: "from-pink-500 to-rose-400",
  },
  {
    title: "Crypto Trading Strategies",
    category: "Crypto",
    level: "Intermediate",
    lessons: 20,
    students: 2750,
    icon: TrendingUp,
    gradient: "from-emerald-500 to-green-400",
  },
  {
    title: "Web3 Wallet Integration",
    category: "Web3",
    level: "Intermediate",
    lessons: 18,
    students: 1920,
    icon: Wallet,
    gradient: "from-indigo-500 to-blue-400",
  },
];

const stats = [
  { value: "15,000+", label: "Active Learners" },
  { value: "120+", label: "Expert Courses" },
  { value: "50+", label: "Industry Mentors" },
  { value: "95%", label: "Completion Rate" },
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Blockchain Developer",
    company: "Ethereum Foundation",
    content:
      "CCWeb completely transformed my career. I went from zero blockchain knowledge to building production dApps in just 4 months.",
    avatar: "SC",
  },
  {
    name: "Marcus Johnson",
    role: "AI Engineer",
    company: "DeepMind",
    content:
      "The AI courses here go beyond surface-level content. The hands-on projects gave me portfolio pieces that landed me my dream job.",
    avatar: "MJ",
  },
  {
    name: "Aisha Patel",
    role: "DeFi Analyst",
    company: "Aave",
    content:
      "The community aspect sets CCWeb apart. I've made connections with fellow learners who are now colleagues and co-founders.",
    avatar: "AP",
  },
];

export function Home() {
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative py-20 md:py-32">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
        </div>

        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <Badge variant="secondary" className="mb-6 px-4 py-1.5">
              <Sparkles className="w-3 h-3 mr-1" />
              The Future of Education is Here
            </Badge>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Master{" "}
              <span className="gradient-text">Web3, Crypto</span>
              <br />& <span className="gradient-text">AI</span> Today
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of learners building the decentralized future.
              Expert-led courses, hands-on projects, and a thriving community
              to accelerate your journey.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="gradient" size="xl" asChild>
                <Link to="/courses">
                  Explore Courses
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/about">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-border bg-card/30">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Why CCWeb</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to{" "}
              <span className="gradient-text">Succeed</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our platform is designed to take you from curious beginner to
              confident professional in the fastest-growing tech fields.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="group hover:border-primary/30 hover:glow-sm bg-card/50"
              >
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Courses */}
      <section className="py-20 md:py-28 bg-card/30">
        <div className="container">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-4">
            <div>
              <Badge variant="secondary" className="mb-4">Popular Courses</Badge>
              <h2 className="text-3xl md:text-4xl font-bold">
                Start Your{" "}
                <span className="gradient-text">Learning Journey</span>
              </h2>
            </div>
            <Button variant="outline" asChild>
              <Link to="/courses">
                View All Courses
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card
                key={course.title}
                className="group hover:border-primary/30 hover:glow-sm bg-card/50 overflow-hidden"
              >
                <div
                  className={`h-2 bg-gradient-to-r ${course.gradient}`}
                />
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">{course.category}</Badge>
                    <Badge variant="outline">{course.level}</Badge>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {course.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {course.lessons} lessons
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {course.students.toLocaleString()} students
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Testimonials</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Trusted by{" "}
              <span className="gradient-text">Thousands of Learners</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <Card
                key={t.name}
                className="bg-card/50 hover:border-primary/30 transition-all"
              >
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    "{t.content}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-sm font-bold text-white">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.role} at {t.company}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20" />
            <div className="absolute inset-0 bg-card/80" />
            <div className="relative p-8 md:p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-6 animate-float">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Shape the{" "}
                <span className="gradient-text">Future</span>?
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                Join our community of forward-thinking learners and get access
                to cutting-edge courses in Web3, cryptocurrency, and artificial
                intelligence.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button variant="gradient" size="xl" asChild>
                  <Link to="/courses">
                    Start Learning Free
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                No credit card required. Start with free courses today.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-16 border-t border-border">
        <div className="container">
          <p className="text-center text-sm text-muted-foreground mb-8">
            Trusted by teams at leading Web3 and AI organizations
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-50">
            {["Ethereum", "Polygon", "Chainlink", "OpenAI", "Solana", "Aave"].map(
              (name) => (
                <div
                  key={name}
                  className="flex items-center gap-2 text-lg font-semibold text-muted-foreground"
                >
                  <Globe className="w-5 h-5" />
                  {name}
                </div>
              )
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
