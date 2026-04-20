import {
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  LockKeyhole,
  Star,
  UserCircle2,
} from "lucide-react";
import type { ReactNode } from "react";
import { NavLink, Outlet, Route, Routes } from "react-router-dom";

import {
  aboutPillars,
  affiliateSteps,
  aiTutorPrompts,
  blogPosts,
  brandName,
  communityChannels,
  courseCategories,
  dashboardCourses,
  dashboardMetrics,
  dashboardPlan,
  dashboardTabs,
  faqItems,
  footerSections,
  heroStats,
  highlights,
  homePricingPlans,
  navigation,
  organizationName,
  popularCourses,
  pricingPlans,
  siteDescription,
  socialContact,
  testimonials,
  tokenStats,
  tokenUtilities,
  type PricingPlan,
} from "./data/siteData";

type SectionHeadingProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  align?: "left" | "center";
};

type PageHeroProps = {
  title: string;
  description: string;
  eyebrow?: string;
  children?: ReactNode;
};

type PageContainerProps = {
  children: ReactNode;
  narrow?: boolean;
};

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
};

type AuthCardProps = {
  title: string;
  subtitle: string;
  primaryLabel: string;
  alternatePrompt: string;
  alternateLabel: string;
  alternateTo: string;
};

function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="courses/:courseId" element={<CourseNotFoundPage />} />
        <Route
          path="courses/:courseId/lesson/:lessonId"
          element={<LessonPlaceholderPage />}
        />
        <Route path="ai-tutor" element={<AiTutorPage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="tokens" element={<TokensPage />} />
        <Route path="affiliates" element={<AffiliatesPage />} />
        <Route path="community" element={<CommunityPage />} />
        <Route path="blog" element={<BlogPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="faq" element={<FaqPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="profile" element={<LoginPage />} />
        <Route path="subscription" element={<SubscriptionPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

function SiteLayout() {
  return (
    <div className="site-shell">
      <div className="site-background" aria-hidden="true">
        <div className="site-glow site-glow-left" />
        <div className="site-glow site-glow-right" />
      </div>
      <Header />
      <main className="page-shell">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <NavLink className="brand" to="/">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-text">{brandName}</span>
        </NavLink>

        <nav className="desktop-nav" aria-label="Primary">
          {navigation.map((item) => (
            <NavLink
              key={item.href}
              className={({ isActive }) =>
                `nav-link${isActive ? " nav-link-active" : ""}`
              }
              end={item.href === "/"}
              to={item.href}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="header-actions">
          <NavLink className="text-link" to="/login">
            Login
          </NavLink>
          <NavLink className="button button-primary" to="/signup">
            Get Started
          </NavLink>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        {footerSections.map((section) => (
          <div key={section.title} className="footer-column">
            <p className="footer-heading">{section.title}</p>
            <div className="footer-links">
              {section.links.map((link) => (
                <NavLink key={`${section.title}-${link.href}`} className="footer-link" to={link.href}>
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="container footer-bottom">
        <p>{`© 2026 ${organizationName}. All rights reserved.`}</p>
      </div>
    </footer>
  );
}

function HomePage() {
  return (
    <>
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">THE FUTURE OF LEARNING</span>
            <h1>Learn Crypto &amp; AI. Earn While You Learn.</h1>
            <p className="hero-description">{siteDescription}</p>

            <div className="hero-actions">
              <NavLink className="button button-primary" to="/signup">
                Start Free
              </NavLink>
              <NavLink className="button button-secondary" to="/courses">
                Browse Courses
              </NavLink>
            </div>

            <div className="hero-stats">
              {heroStats.map((stat) => (
                <div key={stat.label} className="stat-card">
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-panel card">
            <div className="hero-panel-grid">
              {highlights.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.title} className="metric-pill">
                    <Icon className="metric-icon" />
                    <span>{item.title}</span>
                  </div>
                );
              })}
            </div>

            <div className="hero-course-preview">
              <span className="hero-course-badge">Popular right now</span>
              <h2>Smart Contract Development</h2>
              <p>
                Build secure Web3 applications, learn Solidity workflows, and pair
                each lesson with AI tutor support.
              </p>
              <div className="course-meta-row">
                <span>Intermediate</span>
                <span>10h</span>
                <span>8,200 students</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            title={`Why ${organizationName}?`}
            description="A learning ecosystem built around mastery, personal guidance, and real upside for engaged learners."
          />

          <div className="feature-grid">
            {highlights.map((item) => {
              const Icon = item.icon;

              return (
                <article key={item.title} className="card feature-card">
                  <div className="feature-icon-wrap">
                    <Icon className="feature-icon" />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading-row">
            <SectionHeading
              title="Popular Courses"
              description="Start learning today with our top-rated programs."
            />
            <NavLink className="inline-link" to="/courses">
              View all
              <ArrowRight size={16} />
            </NavLink>
          </div>

          <div className="course-grid">
            {popularCourses.map((course) => (
              <NavLink key={course.id} className="card course-card" to={course.href}>
                <span className="pill-tag">{course.category}</span>
                <h3>{course.title}</h3>
                <span className="course-level">{course.level}</span>
                <div className="course-meta">
                  <span>{course.duration}</span>
                  <span>{course.students}</span>
                  <span className="rating-chip">
                    <Star className="rating-icon" />
                    {course.rating}
                  </span>
                </div>
              </NavLink>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            title="Simple Pricing"
            description="Invest in your future. Cancel anytime."
          />
          <PricingGrid plans={homePricingPlans} />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            title="What Our Students Say"
            description="Real results from real learners."
          />

          <div className="testimonial-grid">
            {testimonials.map((testimonial) => (
              <article key={testimonial.name} className="card testimonial-card">
                <p className="testimonial-quote">{testimonial.quote}</p>
                <div className="testimonial-meta">
                  <div className="avatar-circle" aria-hidden="true">
                    {testimonial.initials}
                  </div>
                  <div>
                    <strong>{testimonial.name}</strong>
                    <span>{testimonial.role}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="card cta-card">
            <div>
              <span className="eyebrow">Ready to Build Your Future?</span>
              <h2>Join thousands of learners mastering crypto and AI.</h2>
              <p>
                Join thousands of learners mastering crypto and AI — and earning
                while they do it.
              </p>
            </div>
            <NavLink className="button button-primary" to="/signup">
              Get Started Free
            </NavLink>
          </div>
        </div>
      </section>
    </>
  );
}

function CoursesPage() {
  return (
    <PageContainer>
      <PageHero
        title="Course Library"
        description="Master crypto and AI at your own pace."
      >
        <div className="chip-row">
          {courseCategories.map((category) => (
            <span key={category} className="category-chip">
              {category}
            </span>
          ))}
        </div>
      </PageHero>

      <EmptyState
        title="No courses in this category yet."
        description="New crypto, AI, trading, and Web3 content will appear here as the catalog grows."
      />
    </PageContainer>
  );
}

function CourseNotFoundPage() {
  return (
    <PageContainer narrow>
      <EmptyState
        title="Course Not Found"
        description="This course doesn't exist or has been removed."
        actionLabel="Browse courses"
        actionTo="/courses"
      />
    </PageContainer>
  );
}

function LessonPlaceholderPage() {
  return (
    <PageContainer narrow>
      <section className="lesson-shell card">
        <div className="lesson-topline">
          <span className="lesson-duration">
            <Clock3 className="page-icon" />
            0 min
          </span>
        </div>
        <p className="lesson-copy">
          Explore this lesson to deepen your understanding.
        </p>
        <div className="lesson-actions">
          <NavLink className="button button-secondary" to="/courses">
            Lessons
          </NavLink>
          <NavLink className="button button-secondary" to="/ai-tutor">
            AI Tutor
          </NavLink>
          <button className="button button-primary" type="button">
            Quiz
          </button>
        </div>
      </section>
    </PageContainer>
  );
}

function AiTutorPage() {
  return (
    <PageContainer>
      <PageHero
        eyebrow="Powered by AI • 24/7 learning assistant"
        title="AI Tutor"
        description="Crypto, blockchain, DeFi, AI — your always-on tutor is ready to help you learn."
      />

      <section className="two-column-grid">
        <div className="card">
          <div className="tab-row">
            <span className="tab-pill tab-pill-active">Chat</span>
            <span className="tab-pill">Quiz Generator</span>
          </div>

          <div className="chat-shell">
            <div className="chat-bubble">
              <UserCircle2 className="chat-icon" />
              <div>
                <strong>Ask me anything!</strong>
                <p>Crypto, blockchain, DeFi, AI — I&apos;m here to help you learn.</p>
              </div>
            </div>

            <div className="prompt-list">
              {aiTutorPrompts.map((prompt) => (
                <button key={prompt} className="prompt-card" type="button">
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card info-panel">
          <LockKeyhole className="info-icon" />
          <h2>Sign in to save your chat history and track your learning.</h2>
          <p>
            Unlock persistent tutoring sessions, quiz generation, and learning
            history across crypto and AI topics.
          </p>
          <NavLink className="button button-primary" to="/login">
            Sign in
          </NavLink>
        </div>
      </section>
    </PageContainer>
  );
}

function PricingPage() {
  return (
    <PageContainer>
      <PageHero
        title="Pricing"
        description="Invest in your future. Cancel anytime."
      />
      <PricingGrid plans={pricingPlans} />
    </PageContainer>
  );
}

function TokensPage() {
  return (
    <PageContainer>
      <PageHero
        title="CCWEB Token"
        description="The native utility token powering the Chrisccwebfoundation ecosystem."
      />

      <section className="two-column-grid">
        <div className="card token-gate">
          <SectionHeading
            title="Token Gate"
            description="Connect your wallet or check access manually."
          />

          <div className="token-gate-controls">
            <button className="button button-primary" type="button">
              Connect Wallet
            </button>
            <span className="token-gate-divider">or check manually</span>
            <div className="token-check-row">
              <input
                aria-label="Wallet address"
                className="input-shell"
                placeholder="0x..."
                type="text"
              />
              <button className="button button-secondary" type="button">
                Check
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <SectionHeading
            title="Token Stats"
            description="A quick snapshot of the CCWEB ecosystem."
          />

          <div className="stats-grid">
            {tokenStats.map((stat) => (
              <div key={stat.label} className="stats-card">
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-tight">
        <div className="feature-grid">
          {tokenUtilities.map((utility) => {
            const Icon = utility.icon;

            return (
              <article key={utility.title} className="card feature-card">
                <div className="feature-icon-wrap">
                  <Icon className="feature-icon" />
                </div>
                <h3>{utility.title}</h3>
                <p>{utility.description}</p>
              </article>
            );
          })}
        </div>
      </section>
    </PageContainer>
  );
}

function AffiliatesPage() {
  return (
    <PageContainer>
      <PageHero
        title="Affiliate Program"
        description="Earn passive income by referring students. 30% recurring commissions."
      />

      <div className="feature-grid feature-grid-three">
        {affiliateSteps.map((step) => {
          const Icon = step.icon;

          return (
            <article key={step.title} className="card feature-card">
              <div className="feature-icon-wrap">
                <Icon className="feature-icon" />
              </div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          );
        })}
      </div>

      <section className="section section-tight">
        <div className="card cta-card">
          <div>
            <span className="eyebrow">Become an affiliate</span>
            <h2>Share the platform. Earn recurring commission.</h2>
            <p>
              Refer people who want to learn crypto and AI, and grow a steady
              revenue stream as they stay subscribed.
            </p>
          </div>
          <NavLink className="button button-primary" to="/signup">
            Become an Affiliate
          </NavLink>
        </div>
      </section>
    </PageContainer>
  );
}

function CommunityPage() {
  return (
    <PageContainer>
      <PageHero
        title="Community"
        description="Connect, collaborate, and grow with fellow learners."
      />

      <div className="community-grid">
        {communityChannels.map((channel) => {
          const Icon = channel.icon;

          return (
            <article key={channel.title} className="card community-card">
              <div className="community-icon-wrap">
                <Icon className="community-icon" />
              </div>
              <h3>{channel.title}</h3>
              <div className="community-meta">
                <span>{channel.members} members</span>
                <span>{channel.posts} posts</span>
              </div>
            </article>
          );
        })}
      </div>
    </PageContainer>
  );
}

function BlogPage() {
  return (
    <PageContainer>
      <PageHero
        title="Blog"
        description="Insights on crypto, AI, and the future of learning."
      />

      <div className="blog-grid">
        {blogPosts.map((post) => {
          const Icon = post.icon;

          return (
            <article key={post.title} className="card blog-card">
              <div className="blog-meta">
                <span className="blog-category">{post.category}</span>
                <span>{post.date}</span>
              </div>
              <div className="blog-icon-wrap">
                <Icon className="blog-icon" />
              </div>
              <h2>{post.title}</h2>
              <p>{post.excerpt}</p>
            </article>
          );
        })}
      </div>
    </PageContainer>
  );
}

function AboutPage() {
  return (
    <PageContainer>
      <PageHero
        title="About Us"
        description={`${organizationName} is on a mission to democratize crypto and AI education. We believe everyone deserves access to cutting-edge knowledge — and the opportunity to earn while they learn.`}
      />

      <div className="feature-grid feature-grid-three">
        {aboutPillars.map((pillar) => {
          const Icon = pillar.icon;

          return (
            <article key={pillar.title} className="card feature-card">
              <div className="feature-icon-wrap">
                <Icon className="feature-icon" />
              </div>
              <h3>{pillar.title}</h3>
              <p>{pillar.description}</p>
            </article>
          );
        })}
      </div>
    </PageContainer>
  );
}

function FaqPage() {
  return (
    <PageContainer narrow>
      <PageHero title="FAQ" description="Got questions? We've got answers." />

      <div className="faq-list">
        {faqItems.map((item) => (
          <article key={item.question} className="card faq-card">
            <div>
              <h2>{item.question}</h2>
            </div>
            <ChevronRight className="faq-icon" />
          </article>
        ))}
      </div>
    </PageContainer>
  );
}

function LoginPage() {
  return (
    <PageContainer narrow>
      <AuthCard
        title="Welcome Back"
        subtitle="Sign in to continue learning"
        primaryLabel="Sign In"
        alternatePrompt="Don't have an account?"
        alternateLabel="Sign Up"
        alternateTo="/signup"
      />
    </PageContainer>
  );
}

function SignupPage() {
  return (
    <PageContainer narrow>
      <AuthCard
        title="Create Account"
        subtitle="Start learning and earning today"
        primaryLabel="Create Account"
        alternatePrompt="Already have an account?"
        alternateLabel="Sign In"
        alternateTo="/login"
      />
    </PageContainer>
  );
}

function ContactPage() {
  return (
    <PageContainer>
      <PageHero title="Contact" description="We'd love to hear from you." />

      <section className="contact-grid">
        <div className="social-contact-grid">
          {socialContact.map((item) => (
            <article key={item.label} className="card social-contact-card">
              <span className="contact-label">{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>

        <div className="card contact-form-card">
          <input className="input-shell" placeholder="Your name" type="text" />
          <input className="input-shell" placeholder="Email address" type="email" />
          <textarea className="textarea-shell" placeholder="How can we help?" />
          <button className="button button-primary" type="button">
            Send Message
          </button>
        </div>
      </section>
    </PageContainer>
  );
}

function DashboardPage() {
  const PlanIcon = dashboardPlan.icon;

  return (
    <PageContainer>
      <PageHero
        title="Dashboard"
        description="Welcome back! Here's your learning overview."
      />

      <section className="dashboard-hero">
        <div className="dashboard-plan-card">
          <div className="dashboard-plan-meta">
            <PlanIcon className="dashboard-plan-icon" />
            <div>
              <strong>{dashboardPlan.name}</strong>
              <span className="plan-helper">{dashboardPlan.action}</span>
            </div>
          </div>
          <NavLink className="button button-secondary" to={dashboardPlan.href}>
            {dashboardPlan.action}
          </NavLink>
        </div>

        <div className="dashboard-summary">
          <div>
            <strong>+1 this month</strong>
            <span>Steady learning momentum</span>
          </div>
          <ArrowRight size={18} />
        </div>
      </section>

      <div className="metric-grid">
        {dashboardMetrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <article key={metric.label} className="metric-card">
              <div className="community-meta">
                <span>{metric.delta}</span>
                <Icon className="feature-icon" />
              </div>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </article>
          );
        })}
      </div>

      <section className="section">
        <div className="dashboard-tabs">
          {dashboardTabs.map((tab, index) => (
            <span
              key={tab}
              className={`tab-pill${index === 0 ? " tab-pill-active" : ""}`}
            >
              {tab}
            </span>
          ))}
        </div>

        <SectionHeading
          title="Continue Learning"
          description="Jump back into the courses you were making progress on."
        />

        <div className="dashboard-courses">
          {dashboardCourses.map((course) => (
            <NavLink key={course.href} className="card dashboard-course-card" to={course.href}>
              <div className="dashboard-course-header">
                <h3>{course.title}</h3>
                <span className="status-pill">{course.updated}</span>
              </div>

              <div className="dashboard-course-meta">
                <span>{course.lessons}</span>
                {course.streak ? <span>{course.streak}</span> : null}
                <span>{course.progress}%</span>
              </div>

              <div className="progress-track" aria-hidden="true">
                <div className="progress-fill" style={{ width: `${course.progress}%` }} />
              </div>

              <div className="progress-strip">
                <span>Keep going</span>
                <span>{course.progress}%</span>
              </div>
            </NavLink>
          ))}
        </div>
      </section>
    </PageContainer>
  );
}

function SubscriptionPage() {
  return (
    <PageContainer narrow>
      <section className="subscription-card">
        <div className="subscription-icon-wrap">
          <LockKeyhole className="subscription-icon" />
        </div>
        <p className="subscription-copy">
          Please sign in to manage your subscription.
        </p>
        <NavLink className="button button-primary" to="/login">
          Sign in
        </NavLink>
      </section>
    </PageContainer>
  );
}

function NotFoundPage() {
  return (
    <PageContainer narrow>
      <EmptyState
        title="Page not found"
        description="The page you're looking for doesn't exist or has been moved."
        actionLabel="Go home"
        actionTo="/"
      />
    </PageContainer>
  );
}

function SectionHeading({
  title,
  description,
  eyebrow,
  align = "left",
}: SectionHeadingProps) {
  return (
    <div
      className={`section-heading${
        align === "center" ? " section-heading-center" : ""
      }`}
    >
      {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
      <h2>{title}</h2>
      {description ? <p className="section-description">{description}</p> : null}
    </div>
  );
}

function PageHero({ title, description, eyebrow, children }: PageHeroProps) {
  return (
    <section className="page-hero">
      {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
      <h1>{title}</h1>
      <p>{description}</p>
      {children}
    </section>
  );
}

function PageContainer({ children, narrow = false }: PageContainerProps) {
  return (
    <div className={`container page-container${narrow ? " page-container-narrow" : ""}`}>
      {children}
    </div>
  );
}

function PricingGrid({ plans }: { plans: PricingPlan[] }) {
  return (
    <div className="pricing-grid">
      {plans.map((plan) => (
        <article
          key={`${plan.name}-${plan.price}`}
          className={`card pricing-card${plan.featured ? " featured" : ""}`}
        >
          {plan.featured ? (
            <span className="most-popular-badge">Most Popular</span>
          ) : null}
          <h3>{plan.name}</h3>
          <div className="plan-price">
            <strong>{plan.price}</strong>
            <span>{plan.cadence}</span>
          </div>
          <ul className="price-feature-list">
            {plan.features.map((feature) => (
              <li key={feature} className="feature-check">
                <Check />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <NavLink
            className={`button ${plan.featured ? "button-primary" : "button-secondary"}`}
            to={plan.href}
          >
            {plan.cta}
          </NavLink>
        </article>
      ))}
    </div>
  );
}

function EmptyState({
  title,
  description,
  actionLabel,
  actionTo,
}: EmptyStateProps) {
  return (
    <section className="empty-state">
      <div className="empty-icon-wrap">
        <LockKeyhole className="empty-icon" />
      </div>
      <h1>{title}</h1>
      <p>{description}</p>
      {actionLabel && actionTo ? (
        <NavLink className="button button-primary" to={actionTo}>
          {actionLabel}
        </NavLink>
      ) : null}
    </section>
  );
}

function AuthCard({
  title,
  subtitle,
  primaryLabel,
  alternatePrompt,
  alternateLabel,
  alternateTo,
}: AuthCardProps) {
  return (
    <section className="auth-card">
      <div className="empty-icon-wrap">
        <UserCircle2 className="auth-icon" />
      </div>
      <h1>{title}</h1>
      <p className="auth-subtitle">{subtitle}</p>

      <div className="auth-button-stack">
        <button className="button button-primary" type="button">
          {primaryLabel}
        </button>
        <div className="auth-divider">or</div>
        <button className="button button-secondary" type="button">
          Continue with Google
        </button>
      </div>

      <p className="auth-footnote">
        {alternatePrompt}{" "}
        <NavLink className="inline-link" to={alternateTo}>
          {alternateLabel}
        </NavLink>
      </p>
    </section>
  );
}

export default App;
