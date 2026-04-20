import {
  ArrowRight,
  BookOpen,
  Bot,
  Check,
  Clock,
  Coins,
  Menu,
  Quote,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { ReactNode } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import {
  communityActivities,
  communityPerks,
  courseCatalog,
  faqs,
  heroStats,
  pricingPlans,
  siteLinks,
  testimonials,
  whyChooseUs,
} from "./content";

type PageIntroProps = {
  eyebrow: string;
  title: ReactNode;
  description: string;
  actions?: ReactNode;
};

type SectionTitleProps = {
  title: ReactNode;
  description?: string;
  align?: "left" | "center";
};

const footerGroups = [
  {
    title: "LEARN",
    links: [
      { label: "Courses", to: "/courses" },
      { label: "AI Tutor", to: "/ai-tutor" },
      { label: "Blog", to: "/blog" },
    ],
  },
  {
    title: "EARN",
    links: [
      { label: "Tokens", to: "/tokens" },
      { label: "Affiliates", to: "/affiliates" },
      { label: "Pricing", to: "/pricing" },
    ],
  },
  {
    title: "CONNECT",
    links: [
      { label: "Community", to: "/community" },
      { label: "About", to: "/about" },
      { label: "Contact", to: "/contact" },
    ],
  },
  {
    title: "ACCOUNT",
    links: [
      { label: "Dashboard", to: "/dashboard" },
      { label: "Profile", to: "/profile" },
      { label: "FAQ", to: "/faq" },
    ],
  },
];

const featureIcons = [BookOpen, Bot, Coins, Users] as const;

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function App() {
  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/ai-tutor" element={<AiTutorPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/tokens" element={<TokensPage />} />
          <Route path="/affiliates" element={<AffiliatesPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/dashboard" element={<PlaceholderPage title="Dashboard" />} />
          <Route path="/profile" element={<PlaceholderPage title="Profile" />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <NavLink className="brand" to="/">
          <Zap className="brand-icon" />
          <span className="brand-text">CHRISCCWEB</span>
        </NavLink>

        <nav className="desktop-nav" aria-label="Primary">
          {siteLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn("nav-link", isActive && "nav-link-active")
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="header-actions">
          <NavLink className="text-link" to="/login">
            Login
          </NavLink>
          <NavLink className="button button-primary button-small" to="/signup">
            Get Started
          </NavLink>
          <button className="mobile-menu" type="button" aria-label="Open menu">
            <Menu />
          </button>
        </div>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        {footerGroups.map((group) => (
          <div key={group.title}>
            <h4>{group.title}</h4>
            <div className="footer-links">
              {group.links.map((link) => (
                <NavLink key={link.to} to={link.to}>
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="container footer-bottom">
        © 2026 Chrisccwebfoundation. All rights reserved.
      </div>
    </footer>
  );
}

function HomePage() {
  return (
    <>
      <section className="hero-section">
        <div className="hero-overlay" />
        <div className="container hero-content">
          <div className="hero-copy">
            <span className="eyebrow">The Future of Learning</span>
            <h1>
              Learn Crypto &amp; AI. <span className="text-gradient">Earn While You Learn.</span>
            </h1>
            <p>
              Master blockchain and artificial intelligence with AI-powered tutoring
              — and earn through subscriptions, tokens, and affiliates.
            </p>
            <div className="hero-actions">
              <NavLink className="button button-primary" to="/signup">
                Start Free <ArrowRight size={16} />
              </NavLink>
              <NavLink className="button button-secondary" to="/courses">
                Browse Courses
              </NavLink>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="container stats-grid">
          {heroStats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionTitle
            align="center"
            title={
              <>
                Why <span className="text-gradient">Chrisccwebfoundation</span>?
              </>
            }
          />
          <div className="card-grid card-grid-four">
            {whyChooseUs.map((item, index) => {
              const Icon = featureIcons[index];
              return (
                <div key={item.title} className="panel feature-card">
                  <Icon className="feature-icon" />
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section section-border">
        <div className="container">
          <div className="section-heading-row">
            <SectionTitle
              title={
                <>
                  Popular <span className="text-gradient">Courses</span>
                </>
              }
              description="Start learning today with our top-rated programs."
            />
            <NavLink className="inline-link hide-mobile" to="/courses">
              View all <ArrowRight size={14} />
            </NavLink>
          </div>
          <CourseGrid courses={courseCatalog.slice(0, 4)} />
          <NavLink className="inline-link show-mobile" to="/courses">
            View all courses <ArrowRight size={14} />
          </NavLink>
        </div>
      </section>

      <PricingSection />
      <TestimonialsSection />
      <CtaSection />
    </>
  );
}

function CoursesPage() {
  return (
    <PageFrame>
      <PageIntro
        eyebrow="Expert-led tracks"
        title={
          <>
            Explore our <span className="text-gradient">course library</span>
          </>
        }
        description="Structured learning paths in crypto, Web3, DeFi, AI, and automation — designed to take you from beginner to builder."
        actions={
          <>
            <NavLink className="button button-primary" to="/signup">
              Start learning <ArrowRight size={16} />
            </NavLink>
            <NavLink className="button button-secondary" to="/pricing">
              Compare plans
            </NavLink>
          </>
        }
      />
      <CourseGrid courses={courseCatalog} />
    </PageFrame>
  );
}

function AiTutorPage() {
  const tutorFeatures = [
    "24/7 personalized tutoring sessions",
    "Adaptive quizzes and progress summaries",
    "Step-by-step explanations for blockchain and AI topics",
    "Instant course recommendations based on your goals",
  ];

  return (
    <PageFrame>
      <PageIntro
        eyebrow="AI-powered learning"
        title={
          <>
            Meet your <span className="text-gradient">AI Tutor</span>
          </>
        }
        description="Get real-time guidance on DeFi, wallets, smart contracts, prompt engineering, and AI tools with a tutor that adapts to your pace."
        actions={
          <NavLink className="button button-primary" to="/signup">
            Try the AI tutor <ArrowRight size={16} />
          </NavLink>
        }
      />

      <div className="two-column-grid">
        <div className="panel">
          <h3>What it can do</h3>
          <ul className="feature-list">
            {tutorFeatures.map((feature) => (
              <li key={feature}>
                <Check size={16} />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="panel chat-panel">
          <div className="chat-message chat-user">
            How do I understand gas fees without getting lost in the math?
          </div>
          <div className="chat-message chat-bot">
            Start with what affects the fee: network demand, transaction complexity,
            and the priority you choose. I can walk you through each part with a live example.
          </div>
          <div className="chat-message chat-user">
            Great. Show me using an Ethereum swap.
          </div>
          <div className="chat-message chat-bot">
            Perfect. We’ll break the swap into gas limit, base fee, priority fee,
            and timing so you know what to expect before you confirm.
          </div>
        </div>
      </div>
    </PageFrame>
  );
}

function PricingPage() {
  return (
    <PageFrame>
      <PageIntro
        eyebrow="Flexible membership"
        title={
          <>
            Choose your <span className="text-gradient">learning plan</span>
          </>
        }
        description="Start for free, unlock unlimited tutoring with Pro, or equip your whole team with enterprise-grade onboarding and support."
      />
      <PricingSection standalone />
    </PageFrame>
  );
}

function TokensPage() {
  const tokenHighlights = [
    "Earn platform tokens for completing courses and milestones",
    "Redeem rewards for premium lessons, mentorship, and community perks",
    "Track streaks, badges, and token earnings from your dashboard",
    "Unlock gamified challenges to accelerate your learning",
  ];

  return (
    <PageFrame>
      <PageIntro
        eyebrow="Earn while you learn"
        title={
          <>
            Learn. Complete. <span className="text-gradient">Earn tokens.</span>
          </>
        }
        description="Our reward system turns consistent progress into real incentives that keep you motivated through every course and challenge."
      />
      <div className="panel token-hero">
        <Coins className="token-icon" />
        <ul className="feature-list">
          {tokenHighlights.map((feature) => (
            <li key={feature}>
              <Check size={16} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </PageFrame>
  );
}

function AffiliatesPage() {
  const affiliateSteps = [
    {
      title: "Share your link",
      description: "Invite your network with a dedicated referral link and onboarding assets.",
    },
    {
      title: "Track performance",
      description: "Monitor clicks, signups, and recurring revenue from your dashboard.",
    },
    {
      title: "Earn recurring income",
      description: "Get rewarded every time your referrals stay active on the platform.",
    },
  ];

  return (
    <PageFrame>
      <PageIntro
        eyebrow="Recurring commissions"
        title={
          <>
            Grow with our <span className="text-gradient">affiliate program</span>
          </>
        }
        description="Turn your audience into a learning community and earn repeat commissions as they subscribe, learn, and progress."
      />
      <div className="card-grid card-grid-three">
        {affiliateSteps.map((step) => (
          <div key={step.title} className="panel">
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </div>
        ))}
      </div>
    </PageFrame>
  );
}

function CommunityPage() {
  return (
    <PageFrame>
      <PageIntro
        eyebrow="Build together"
        title={
          <>
            Join the <span className="text-gradient">community</span>
          </>
        }
        description="Learn with peers, attend live sessions, share wins, and get feedback from builders, traders, founders, and mentors."
      />
      <div className="two-column-grid">
        <div className="panel">
          <h3>What you get</h3>
          <ul className="feature-list">
            {communityPerks.map((perk) => (
              <li key={perk}>
                <Check size={16} />
                <span>{perk}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="panel">
          <h3>Live community moments</h3>
          <div className="stack-list">
            {communityActivities.map((activity) => (
              <div key={activity.title} className="stack-item">
                <h4>{activity.title}</h4>
                <p>{activity.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageFrame>
  );
}

function BlogPage() {
  const posts = [
    {
      title: "How to start learning blockchain without feeling overwhelmed",
      summary: "A practical first-week roadmap for understanding wallets, chains, and smart contracts.",
    },
    {
      title: "Five AI tools every Web3 learner should know",
      summary: "Use AI to accelerate research, coding, note-taking, and study sessions.",
    },
    {
      title: "What makes recurring affiliate income actually work",
      summary: "Lessons from creators and educators who built consistent revenue with community-first offers.",
    },
  ];

  return (
    <PageFrame>
      <PageIntro
        eyebrow="Fresh insights"
        title={
          <>
            Read the latest from our <span className="text-gradient">blog</span>
          </>
        }
        description="Guides, platform updates, explainers, and strategy posts covering crypto education, AI tools, and creator growth."
      />
      <div className="card-grid card-grid-three">
        {posts.map((post) => (
          <article key={post.title} className="panel">
            <span className="tag">Article</span>
            <h3>{post.title}</h3>
            <p>{post.summary}</p>
          </article>
        ))}
      </div>
    </PageFrame>
  );
}

function AboutPage() {
  return (
    <PageFrame>
      <PageIntro
        eyebrow="About the mission"
        title={
          <>
            Building accessible <span className="text-gradient">Web3 &amp; AI education</span>
          </>
        }
        description="Chrisccwebfoundation exists to make future-facing skills easier to learn, easier to apply, and more rewarding for everyday learners."
      />
      <div className="two-column-grid">
        <div className="panel">
          <h3>What we believe</h3>
          <p>
            Education should be practical, guided, and financially empowering.
            That’s why we combine expert-led courses, AI tutoring, community, and
            a reward model in one ecosystem.
          </p>
        </div>
        <div className="panel">
          <h3>Who we serve</h3>
          <p>
            Builders, creators, students, professionals, and curious newcomers
            who want a clear path into crypto, AI, automation, and online income.
          </p>
        </div>
      </div>
    </PageFrame>
  );
}

function FaqPage() {
  return (
    <PageFrame>
      <PageIntro
        eyebrow="Common questions"
        title={
          <>
            Frequently asked <span className="text-gradient">questions</span>
          </>
        }
        description="Everything you need to know about courses, subscriptions, tokens, the AI tutor, and the affiliate program."
      />
      <div className="faq-list">
        {faqs.map((item) => (
          <details key={item.question} className="panel faq-item" open={item.question === faqs[0].question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </PageFrame>
  );
}

function LoginPage() {
  return (
    <AuthPage
      eyebrow="Welcome back"
      title="Login to continue learning"
      description="Access your courses, AI tutor sessions, token earnings, and affiliate dashboard."
      buttonLabel="Login"
      alternateCopy="New here?"
      alternateLink="/signup"
      alternateLabel="Create an account"
    />
  );
}

function SignupPage() {
  return (
    <AuthPage
      eyebrow="Get started"
      title="Create your account"
      description="Join the learning platform built for crypto, AI, rewards, and recurring opportunities."
      buttonLabel="Get Started"
      alternateCopy="Already have an account?"
      alternateLink="/login"
      alternateLabel="Login"
    />
  );
}

function ContactPage() {
  return (
    <PageFrame>
      <PageIntro
        eyebrow="We'd love to hear from you"
        title={
          <>
            Contact the <span className="text-gradient">team</span>
          </>
        }
        description="Questions about plans, partnerships, team training, or support? Send us a message and we’ll point you in the right direction."
      />
      <div className="two-column-grid">
        <div className="panel">
          <h3>Reach out directly</h3>
          <div className="stack-list">
            <div className="stack-item">
              <h4>Email</h4>
              <p>hello@chrisccwebfoundation.com</p>
            </div>
            <div className="stack-item">
              <h4>Community</h4>
              <p>Join the platform community to connect with mentors and fellow learners.</p>
            </div>
            <div className="stack-item">
              <h4>Partnerships</h4>
              <p>For affiliates, enterprise onboarding, and collaborations, tell us what you’re building.</p>
            </div>
          </div>
        </div>
        <form className="panel contact-form">
          <label>
            Name
            <input type="text" placeholder="Your name" />
          </label>
          <label>
            Email
            <input type="email" placeholder="you@example.com" />
          </label>
          <label>
            Message
            <textarea rows={5} placeholder="How can we help?" />
          </label>
          <button className="button button-primary" type="submit">
            Send message
          </button>
        </form>
      </div>
    </PageFrame>
  );
}

function AuthPage({
  eyebrow,
  title,
  description,
  buttonLabel,
  alternateCopy,
  alternateLink,
  alternateLabel,
}: {
  eyebrow: string;
  title: string;
  description: string;
  buttonLabel: string;
  alternateCopy: string;
  alternateLink: string;
  alternateLabel: string;
}) {
  return (
    <section className="auth-section">
      <div className="auth-card">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        <form className="auth-form">
          <label>
            Email
            <input type="email" placeholder="you@example.com" />
          </label>
          <label>
            Password
            <input type="password" placeholder="••••••••" />
          </label>
          <button className="button button-primary" type="submit">
            {buttonLabel}
          </button>
        </form>
        <p className="auth-alt">
          {alternateCopy} <NavLink to={alternateLink}>{alternateLabel}</NavLink>
        </p>
      </div>
    </section>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <PageFrame>
      <PageIntro
        eyebrow="Coming soon"
        title={
          <>
            {title} <span className="text-gradient">page</span>
          </>
        }
        description="This page doesn't exist yet. Want to build it? Start from the preview-inspired foundation created for this project."
      />
    </PageFrame>
  );
}

function NotFoundPage() {
  return (
    <section className="not-found">
      <div className="container not-found-inner">
        <div className="big-404">404</div>
        <h1>Page not found</h1>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <div className="hero-actions">
          <NavLink className="button button-primary" to="/">
            Go home
          </NavLink>
          <NavLink className="button button-secondary" to="/dashboard">
            Want to build it?
          </NavLink>
        </div>
      </div>
    </section>
  );
}

function PageFrame({ children }: { children: ReactNode }) {
  return <div className="page-frame">{children}</div>;
}

function PageIntro({ eyebrow, title, description, actions }: PageIntroProps) {
  return (
    <section className="page-intro">
      <div className="container">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        {actions ? <div className="hero-actions">{actions}</div> : null}
      </div>
    </section>
  );
}

function SectionTitle({ title, description, align = "left" }: SectionTitleProps) {
  return (
    <div className={cn("section-title", align === "center" && "section-title-center")}>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </div>
  );
}

function CourseGrid({ courses }: { courses: typeof courseCatalog }) {
  return (
    <div className="card-grid card-grid-four">
      {courses.map((course) => (
        <NavLink key={course.id} className="panel course-card" to={`/courses/${course.id}`}>
          <span className="tag">{course.category}</span>
          <h3>{course.title}</h3>
          <p className="course-level">{course.level}</p>
          <div className="course-meta">
            <span>
              <Clock size={13} /> {course.duration}
            </span>
            <span>
              <Users size={13} /> {course.students}
            </span>
            <span>
              <Star size={13} className="accent-icon" /> {course.rating}
            </span>
          </div>
        </NavLink>
      ))}
    </div>
  );
}

function PricingSection({ standalone = false }: { standalone?: boolean }) {
  return (
    <section className={cn("section", !standalone && "section-border")}>
      <div className="container">
        <SectionTitle
          align="center"
          title={
            <>
              Simple <span className="text-gradient">Pricing</span>
            </>
          }
          description="Invest in your future. Cancel anytime."
        />
        <div className="card-grid card-grid-three pricing-grid">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={cn("panel pricing-card", plan.featured && "pricing-card-featured")}
            >
              {plan.featured ? (
                <span className="featured-badge">
                  <Zap size={13} /> Most Popular
                </span>
              ) : null}
              <h3>{plan.name}</h3>
              <div className="price-row">
                <span className="price">{plan.price}</span>
                <span className="price-suffix">{plan.suffix}</span>
              </div>
              <ul className="feature-list">
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <Check size={16} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <NavLink
                className={cn(
                  "button",
                  plan.featured ? "button-primary" : "button-secondary",
                )}
                to="/signup"
              >
                {plan.cta}
              </NavLink>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="section section-border">
      <div className="container">
        <SectionTitle
          align="center"
          title={
            <>
              What Our <span className="text-gradient">Students Say</span>
            </>
          }
          description="Real results from real learners."
        />
        <div className="card-grid card-grid-four">
          {testimonials.map((testimonial) => (
            <div key={testimonial.name} className="panel testimonial-card">
              <Quote className="quote-icon" />
              <p>{testimonial.quote}</p>
              <div className="testimonial-person">
                <div className="avatar">{testimonial.initials}</div>
                <div>
                  <strong>{testimonial.name}</strong>
                  <span>{testimonial.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="section">
      <div className="container">
        <div className="cta-card">
          <h2>Ready to Build Your Future?</h2>
          <p>
            Join thousands of learners mastering crypto and AI — and earning while
            they do it.
          </p>
          <NavLink className="button button-light" to="/signup">
            Get Started Free <Zap size={16} />
          </NavLink>
        </div>
      </div>
    </section>
  );
}

export default App;
