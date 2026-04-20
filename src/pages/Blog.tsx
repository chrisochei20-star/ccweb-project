import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  Search,
  Tag,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const posts = [
  {
    title: "Understanding Zero-Knowledge Proofs: A Beginner's Guide",
    excerpt:
      "Zero-knowledge proofs are revolutionizing blockchain privacy. Learn how ZKPs work and why they matter for the future of Web3.",
    category: "Web3",
    author: "Alex Rivera",
    date: "Apr 15, 2026",
    readTime: "8 min read",
    featured: true,
    gradient: "from-primary to-violet-500",
  },
  {
    title: "Top 10 AI Tools Every Developer Should Know in 2026",
    excerpt:
      "From code assistants to autonomous agents, these AI tools are transforming how developers build software.",
    category: "AI",
    author: "Dr. Maya Patel",
    date: "Apr 12, 2026",
    readTime: "6 min read",
    featured: true,
    gradient: "from-pink-500 to-rose-400",
  },
  {
    title: "The Rise of Real-World Assets (RWAs) in DeFi",
    excerpt:
      "How tokenization of real-world assets is bridging traditional finance and DeFi, creating new opportunities.",
    category: "Crypto",
    author: "Jordan Kim",
    date: "Apr 8, 2026",
    readTime: "7 min read",
    featured: false,
    gradient: "from-amber-500 to-orange-400",
  },
  {
    title: "Building Your First AI Agent: A Step-by-Step Tutorial",
    excerpt:
      "A practical guide to building an autonomous AI agent using modern frameworks and LLM APIs.",
    category: "AI",
    author: "Dr. Maya Patel",
    date: "Apr 5, 2026",
    readTime: "12 min read",
    featured: false,
    gradient: "from-secondary to-cyan-400",
  },
  {
    title: "Layer 2 Scaling Solutions Compared: 2026 Edition",
    excerpt:
      "An in-depth comparison of Optimism, Arbitrum, zkSync, and StarkNet — which L2 is right for your project?",
    category: "Web3",
    author: "Alex Rivera",
    date: "Mar 28, 2026",
    readTime: "10 min read",
    featured: false,
    gradient: "from-emerald-500 to-green-400",
  },
  {
    title: "How to Read a Crypto Whitepaper Effectively",
    excerpt:
      "A framework for evaluating cryptocurrency whitepapers, identifying red flags, and assessing project viability.",
    category: "Crypto",
    author: "Jordan Kim",
    date: "Mar 22, 2026",
    readTime: "5 min read",
    featured: false,
    gradient: "from-indigo-500 to-blue-400",
  },
  {
    title: "Prompt Engineering Best Practices for Developers",
    excerpt:
      "Master the art of crafting effective prompts to get the most out of LLMs in your development workflow.",
    category: "AI",
    author: "Dr. Maya Patel",
    date: "Mar 18, 2026",
    readTime: "9 min read",
    featured: false,
    gradient: "from-purple-500 to-fuchsia-400",
  },
  {
    title: "DAO Governance Models: What Works and What Doesn't",
    excerpt:
      "Lessons from the most successful DAOs on governance structures, voting mechanisms, and community engagement.",
    category: "Web3",
    author: "Sarah Okonkwo",
    date: "Mar 12, 2026",
    readTime: "7 min read",
    featured: false,
    gradient: "from-red-500 to-orange-400",
  },
  {
    title: "Navigating Crypto Regulations in 2026",
    excerpt:
      "A comprehensive overview of the latest cryptocurrency regulations across major jurisdictions worldwide.",
    category: "Crypto",
    author: "Jordan Kim",
    date: "Mar 5, 2026",
    readTime: "8 min read",
    featured: false,
    gradient: "from-teal-500 to-emerald-400",
  },
];

const categories = ["All", "Web3", "Crypto", "AI"];

export function Blog() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filtered = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPosts = filtered.filter((p) => p.featured);
  const regularPosts = filtered.filter((p) => !p.featured);

  return (
    <div className="py-12 md:py-20">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <BookOpen className="w-3 h-3 mr-1" />
            Blog & Insights
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Latest <span className="gradient-text">Articles</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Stay updated with the latest trends, tutorials, and insights in
            Web3, cryptocurrency, and artificial intelligence.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
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
        </div>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {featuredPosts.map((post) => (
              <Card
                key={post.title}
                className="group bg-card/50 hover:border-primary/30 hover:glow-sm overflow-hidden"
              >
                <div className={`h-48 bg-gradient-to-br ${post.gradient} p-6 flex flex-col justify-end`}>
                  <Badge className="w-fit mb-2 bg-white/20 text-white border-white/30">
                    Featured
                  </Badge>
                  <h2 className="text-xl font-bold text-white group-hover:text-white/90 transition-colors">
                    {post.title}
                  </h2>
                </div>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {post.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {post.date}
                      </span>
                    </div>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {post.readTime}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Regular Posts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regularPosts.map((post) => (
            <Card
              key={post.title}
              className="group bg-card/50 hover:border-primary/30 hover:glow-sm overflow-hidden flex flex-col"
            >
              <div className={`h-2 bg-gradient-to-r ${post.gradient}`} />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary">
                    <Tag className="w-3 h-3 mr-1" />
                    {post.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {post.readTime}
                  </span>
                </div>
                <CardTitle className="text-lg group-hover:text-primary transition-colors leading-snug">
                  {post.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-sm text-muted-foreground mb-4 flex-1">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {post.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {post.date}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No articles found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or category filter.
            </p>
          </div>
        )}

        {/* Newsletter CTA */}
        <Card className="mt-16 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Stay <span className="gradient-text">Informed</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-6">
              Get the latest articles, tutorials, and industry insights
              delivered to your inbox weekly.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input placeholder="Enter your email" className="flex-1" />
              <Button variant="gradient">
                Subscribe
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
