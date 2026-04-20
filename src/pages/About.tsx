import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  Globe,
  Heart,
  Lightbulb,
  Rocket,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const values = [
  {
    icon: Lightbulb,
    title: "Innovation First",
    description:
      "We stay at the cutting edge, continuously updating our curriculum to reflect the latest industry developments.",
  },
  {
    icon: Users,
    title: "Community Driven",
    description:
      "Learning is better together. Our community of learners, mentors, and industry experts supports every student.",
  },
  {
    icon: Target,
    title: "Practical Skills",
    description:
      "Theory meets practice. Every course includes hands-on projects and real-world applications.",
  },
  {
    icon: Heart,
    title: "Inclusive Access",
    description:
      "We believe education should be accessible to everyone, regardless of background or experience level.",
  },
];

const team = [
  {
    name: "Alex Rivera",
    role: "Founder & CEO",
    bio: "Former Ethereum core developer with 10+ years in distributed systems.",
    initials: "AR",
    gradient: "from-primary to-violet-500",
  },
  {
    name: "Dr. Maya Patel",
    role: "Head of AI Curriculum",
    bio: "AI researcher with publications at NeurIPS and ICML. PhD from Stanford.",
    initials: "MP",
    gradient: "from-secondary to-cyan-400",
  },
  {
    name: "Jordan Kim",
    role: "Head of Web3 Education",
    bio: "Built DeFi protocols with $2B+ TVL. Passionate about making Web3 accessible.",
    initials: "JK",
    gradient: "from-amber-500 to-orange-400",
  },
  {
    name: "Sarah Okonkwo",
    role: "Community Lead",
    bio: "Community builder who grew crypto communities from 0 to 100K+ members.",
    initials: "SO",
    gradient: "from-pink-500 to-rose-400",
  },
];

const milestones = [
  { year: "2021", event: "CCWeb founded with a vision to democratize Web3 education" },
  { year: "2022", event: "Launched first 20 courses, reached 5,000 students" },
  { year: "2023", event: "Added AI curriculum, partnered with leading protocols" },
  { year: "2024", event: "15,000+ active learners, 120+ courses, on-chain certificates" },
  { year: "2025", event: "Expanded to AI agents curriculum and enterprise training" },
];

export function About() {
  return (
    <div className="py-12 md:py-20">
      {/* Hero */}
      <section className="container mb-20">
        <div className="max-w-3xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            <Globe className="w-3 h-3 mr-1" />
            About CCWeb
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Building the Future of{" "}
            <span className="gradient-text">Tech Education</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            We're on a mission to make cutting-edge technology education
            accessible, practical, and community-driven. From blockchain to AI,
            we empower the next generation of innovators.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="container mb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-card/50 hover:border-primary/30 transition-all">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4">
                <Rocket className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Our Mission</h3>
              <p className="text-muted-foreground">
                To provide world-class education in Web3, cryptocurrency, and
                artificial intelligence, making these transformative technologies
                accessible to everyone through expert-led, hands-on learning
                experiences.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 hover:border-primary/30 transition-all">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Our Vision</h3>
              <p className="text-muted-foreground">
                A world where anyone can participate in the decentralized economy
                and leverage AI to solve meaningful problems — equipped with the
                skills, knowledge, and community support to thrive.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-card/30">
        <div className="container">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Our Values</Badge>
            <h2 className="text-3xl md:text-4xl font-bold">
              What <span className="gradient-text">Drives Us</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => (
              <Card
                key={v.title}
                className="bg-card/50 hover:border-primary/30 transition-all text-center"
              >
                <CardContent className="pt-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto mb-4">
                    <v.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2">{v.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {v.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Our Journey</Badge>
            <h2 className="text-3xl md:text-4xl font-bold">
              Key <span className="gradient-text">Milestones</span>
            </h2>
          </div>
          <div className="max-w-2xl mx-auto">
            {milestones.map((m, i) => (
              <div key={m.year} className="flex gap-6 mb-8 last:mb-0">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {m.year}
                  </div>
                  {i < milestones.length - 1 && (
                    <div className="w-px h-full bg-border mt-2" />
                  )}
                </div>
                <div className="pt-3 pb-8">
                  <p className="text-muted-foreground">{m.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-card/30">
        <div className="container">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Our Team</Badge>
            <h2 className="text-3xl md:text-4xl font-bold">
              Meet the <span className="gradient-text">Experts</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mt-4">
              Our team brings decades of combined experience in blockchain, AI,
              and education.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member) => (
              <Card
                key={member.name}
                className="bg-card/50 hover:border-primary/30 transition-all text-center"
              >
                <CardContent className="pt-8 pb-6">
                  <div
                    className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${member.gradient} flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white`}
                  >
                    {member.initials}
                  </div>
                  <h3 className="font-bold mb-1">{member.name}</h3>
                  <p className="text-sm text-primary mb-3">{member.role}</p>
                  <p className="text-xs text-muted-foreground">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Users, value: "15,000+", label: "Active Learners" },
              { icon: Award, value: "120+", label: "Expert Courses" },
              { icon: Globe, value: "90+", label: "Countries" },
              { icon: Heart, value: "4.8/5", label: "Avg Rating" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="text-3xl font-bold gradient-text mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-20">
        <div className="container">
          <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">
                Join Our <span className="gradient-text">Mission</span>
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto mb-6">
                Whether you want to learn, teach, or partner with us, we'd love
                to have you on board.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="gradient" size="lg" asChild>
                  <Link to="/courses">
                    Start Learning
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/contact">Contact Us</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
