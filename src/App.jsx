import {
  BrowserRouter,
  Link,
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import "./styles.css";

const navItems = [
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

const courses = [
  {
    id: 1,
    category: "Crypto",
    title: "Blockchain Fundamentals",
    level: "Beginner",
    duration: "6h",
    students: "12,400",
    rating: "4.9",
  },
  {
    id: 2,
    category: "Crypto",
    title: "Smart Contract Development",
    level: "Intermediate",
    duration: "10h",
    students: "8,200",
    rating: "4.8",
  },
  {
    id: 3,
    category: "Crypto",
    title: "DeFi Masterclass",
    level: "Advanced",
    duration: "12h",
    students: "5,100",
    rating: "4.9",
  },
  {
    id: 4,
    category: "AI",
    title: "AI & Machine Learning Basics",
    level: "Beginner",
    duration: "8h",
    students: "15,600",
    rating: "4.7",
  },
];

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="courses/:id" element={<CourseNotFoundPage />} />
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
          <Route path="profile" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function Layout() {
  return (
    <div className="site-shell">
      <header className="navbar">
        <div className="container navbar-content">
          <Link to="/" className="brand">
            <span className="brand-bolt">⚡</span>
            CHRISCCWEB
          </Link>
          <nav className="nav-links">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  `nav-link${isActive ? " active" : ""}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="nav-cta">
            <NavLink to="/login" className="nav-link">
              Login
            </NavLink>
            <Link to="/signup" className="btn btn-primary">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="container">
          <Outlet />
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          © {new Date().getFullYear()} Chrisccwebfoundation ·{" "}
          <Link to="/contact">Contact</Link> · <Link to="/dashboard">Dashboard</Link>
        </div>
      </footer>
    </div>
  );
}

function HomePage() {
  return (
    <section className="hero">
      <span className="pill">The Future of Learning</span>
      <h1 className="hero-title">
        Learn Crypto &amp; AI.
        <br />
        <span className="accent-cyan">Earn</span>{" "}
        <span className="accent-violet">While You</span>
        <br />
        <span className="accent-green">Learn.</span>
      </h1>
      <p className="hero-subtitle">
        Master blockchain and artificial intelligence with AI-powered tutoring
        and earn through subscriptions, tokens, and affiliates.
      </p>
      <div className="hero-actions">
        <Link to="/signup" className="btn btn-primary">
          Start Free
        </Link>
        <Link to="/courses" className="btn btn-outline">
          Browse Courses
        </Link>
      </div>
      <div className="stats-grid">
        <StatCard value="50K+" label="Students" />
        <StatCard value="200+" label="Courses" />
        <StatCard value="$2M+" label="Earned by Affiliates" />
        <StatCard value="99.9%" label="Uptime" />
      </div>
      <section className="panel" style={{ marginTop: "1rem" }}>
        <h3>Why Chrisccwebfoundation?</h3>
        <p className="muted">
          Crypto and AI education in one platform, with AI tutoring, practical
          learning tracks, and a built-in earn model.
        </p>
      </section>
    </section>
  );
}

function StatCard({ value, label }) {
  return (
    <article className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="muted">{label}</div>
    </article>
  );
}

function CoursesPage() {
  return (
    <section>
      <header className="page-header">
        <h1 className="section-title">Course Library</h1>
        <p className="muted">Master crypto and AI at your own pace.</p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {["All", "Crypto", "AI", "Trading", "Web3"].map((tag) => (
            <span key={tag} className="badge">
              {tag}
            </span>
          ))}
        </div>
      </header>
      <div className="course-grid">
        {courses.map((course) => (
          <article key={course.id} className="course-card">
            <span className="badge">{course.category}</span>
            <h3>{course.title}</h3>
            <p className="muted">
              {course.level} · {course.duration}
            </p>
            <p className="muted">
              {course.students} students · {course.rating} rating
            </p>
            <Link to={`/courses/${course.id}`} className="btn btn-outline">
              View Course
            </Link>
          </article>
        ))}
      </div>
      <p className="muted" style={{ marginTop: "1rem" }}>
        No courses in this category yet.
      </p>
    </section>
  );
}

function CourseNotFoundPage() {
  const { id } = useParams();
  return (
    <section className="panel">
      <h1 className="section-title">Course Not Found</h1>
      <p className="muted">
        Course {id ? `#${id}` : ""} doesn&apos;t exist or has been removed.
      </p>
      <Link to="/courses" className="btn btn-primary">
        Browse Courses
      </Link>
    </section>
  );
}

function AiTutorPage() {
  return (
    <section>
      <header className="page-header">
        <h1 className="section-title">AI Tutor</h1>
        <p className="muted">Powered by AI · 24/7 learning assistant</p>
      </header>
      <div className="card-grid">
        <article className="panel">
          <h3>Ask me anything!</h3>
          <p className="muted">
            Crypto, blockchain, DeFi, AI — I&apos;m here to help you learn.
          </p>
          <ul className="list">
            <li>Explain blockchain in simple terms</li>
            <li>What is DeFi and how does it work?</li>
            <li>How do smart contracts work?</li>
            <li>Explain proof of stake vs proof of work</li>
          </ul>
        </article>
        <article className="panel">
          <h3>Modes</h3>
          <p className="muted">Chat · Quiz Generator</p>
          <p className="muted">
            Sign in to save your chat history and learning progress.
          </p>
          <Link to="/login" className="btn btn-outline">
            Sign In
          </Link>
        </article>
      </div>
    </section>
  );
}

function PricingPage() {
  return (
    <section>
      <header className="page-header">
        <h1 className="section-title">Pricing</h1>
        <p className="muted">Invest in your future. Cancel anytime.</p>
      </header>
      <div className="card-grid">
        <article className="panel">
          <h3>Free</h3>
          <p>
            <strong>$0</strong> forever
          </p>
          <ul className="list">
            <li>3 free courses</li>
            <li>Community access</li>
            <li>Basic AI tutor</li>
          </ul>
          <Link to="/signup" className="btn btn-outline">
            Get Started
          </Link>
        </article>
        <article className="panel">
          <span className="badge">Most Popular</span>
          <h3>Pro</h3>
          <p>
            <strong>$10/month</strong>
          </p>
          <ul className="list">
            <li>All courses</li>
            <li>Unlimited AI tutor</li>
            <li>Earn tokens</li>
            <li>Priority support</li>
            <li>Certificate of completion</li>
          </ul>
          <Link to="/signup" className="btn btn-primary">
            Subscribe Now
          </Link>
        </article>
        <article className="panel">
          <h3>Enterprise</h3>
          <p>
            <strong>$35/month</strong>
          </p>
          <ul className="list">
            <li>Everything in Pro</li>
            <li>Team management</li>
            <li>Custom courses</li>
            <li>API access</li>
          </ul>
          <Link to="/signup" className="btn btn-outline">
            Contact Sales
          </Link>
        </article>
      </div>
    </section>
  );
}

function TokensPage() {
  return (
    <section>
      <header className="page-header">
        <h1 className="section-title">CCWEB Token</h1>
        <p className="muted">
          The native utility token powering the Chrisccwebfoundation ecosystem.
        </p>
      </header>
      <div className="card-grid">
        <article className="panel">
          <h3>Token Gate</h3>
          <p className="muted">Connect wallet or check manually.</p>
          <button type="button" className="btn btn-primary">
            Check
          </button>
        </article>
        <article className="panel">
          <h3>Learn &amp; Earn</h3>
          <p className="muted">Complete courses and quizzes to earn CCWEB.</p>
        </article>
        <article className="panel">
          <h3>Staking Rewards</h3>
          <p className="muted">Stake tokens and earn passive income.</p>
        </article>
        <article className="panel">
          <h3>Governance</h3>
          <p className="muted">Vote on key platform decisions.</p>
        </article>
      </div>
    </section>
  );
}

function AffiliatesPage() {
  return (
    <section>
      <header className="page-header">
        <h1 className="section-title">Affiliate Program</h1>
        <p className="muted">
          Earn passive income by referring students. 30% recurring commissions.
        </p>
      </header>
      <div className="card-grid">
        <article className="panel">
          <h3>Sign Up</h3>
          <p className="muted">Create a free affiliate account in seconds.</p>
        </article>
        <article className="panel">
          <h3>Share Your Link</h3>
          <p className="muted">Share your unique referral link with audience.</p>
        </article>
        <article className="panel">
          <h3>Earn Commissions</h3>
          <p className="muted">Get recurring commissions from every referral.</p>
        </article>
      </div>
      <div style={{ marginTop: "1rem" }}>
        <Link to="/signup" className="btn btn-primary">
          Become an Affiliate
        </Link>
      </div>
    </section>
  );
}

function CommunityPage() {
  return (
    <section>
      <header className="page-header">
        <h1 className="section-title">Community</h1>
        <p className="muted">Connect, collaborate, and grow with learners.</p>
      </header>
      <div className="card-grid">
        <article className="panel">
          <h3>General Discussion</h3>
          <p className="muted">8,400 members · 2.1K posts</p>
        </article>
        <article className="panel">
          <h3>Crypto Trading</h3>
          <p className="muted">5,200 members · 3.4K posts</p>
        </article>
        <article className="panel">
          <h3>AI Projects</h3>
          <p className="muted">3,100 members · 890 posts</p>
        </article>
        <article className="panel">
          <h3>Study Groups</h3>
          <p className="muted">2,800 members · 1.2K posts</p>
        </article>
      </div>
    </section>
  );
}

function BlogPage() {
  return (
    <section>
      <header className="page-header">
        <h1 className="section-title">Blog</h1>
        <p className="muted">Insights on crypto, AI, and digital education.</p>
      </header>
      <div className="card-grid">
        <article className="panel">
          <span className="badge">Crypto · Mar 28, 2026</span>
          <h3>Understanding Zero-Knowledge Proofs</h3>
          <p className="muted">
            ZK proofs are revolutionizing privacy on blockchain.
          </p>
        </article>
        <article className="panel">
          <span className="badge">AI · Mar 25, 2026</span>
          <h3>How AI is Transforming Education</h3>
          <p className="muted">
            Adaptive learning and personalized tutors are reshaping learning.
          </p>
        </article>
        <article className="panel">
          <span className="badge">DeFi · Mar 20, 2026</span>
          <h3>What&apos;s Next for Decentralized Finance?</h3>
          <p className="muted">
            DeFi protocols continue to evolve beyond lending and swaps.
          </p>
        </article>
      </div>
    </section>
  );
}

function AboutPage() {
  return (
    <section>
      <header className="page-header">
        <h1 className="section-title">About Us</h1>
        <p className="muted">
          Chrisccwebfoundation is on a mission to democratize crypto and AI
          education.
        </p>
      </header>
      <div className="card-grid">
        <article className="panel">
          <h3>Mission</h3>
          <p className="muted">
            Make crypto and AI education accessible, affordable, and rewarding.
          </p>
        </article>
        <article className="panel">
          <h3>Vision</h3>
          <p className="muted">
            A world where financial and technical literacy unlocks opportunity.
          </p>
        </article>
      </div>
    </section>
  );
}

function FaqPage() {
  const faqs = [
    "What is Chrisccwebfoundation?",
    "How do I earn tokens?",
    "What does the Pro subscription include?",
    "How does the affiliate program work?",
    "Is the AI tutor available 24/7?",
    "Can I cancel my subscription?",
  ];

  return (
    <section>
      <header className="page-header">
        <h1 className="section-title">FAQ</h1>
        <p className="muted">Got questions? We&apos;ve got answers.</p>
      </header>
      <article className="panel">
        <ul className="list">
          {faqs.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>
    </section>
  );
}

function LoginPage() {
  return (
    <AuthPage
      title="Welcome Back"
      subtitle="Sign in to continue learning"
      action="Sign In"
      prompt="Don't have an account?"
      promptHref="/signup"
      promptLabel="Sign Up"
    />
  );
}

function SignupPage() {
  return (
    <AuthPage
      title="Create Account"
      subtitle="Start learning and earning today"
      action="Create Account"
      prompt="Already have an account?"
      promptHref="/login"
      promptLabel="Sign In"
    />
  );
}

function AuthPage({ title, subtitle, action, prompt, promptHref, promptLabel }) {
  return (
    <section className="auth-card">
      <h1 className="section-title">{title}</h1>
      <p className="muted">{subtitle}</p>
      <div className="auth-row">
        <label htmlFor="email">Email</label>
        <input id="email" type="email" placeholder="you@example.com" />
      </div>
      <div className="auth-row">
        <label htmlFor="password">Password</label>
        <input id="password" type="password" placeholder="••••••••" />
      </div>
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        <button type="button" className="btn btn-primary">
          {action}
        </button>
        <button type="button" className="btn btn-outline">
          Continue with Google
        </button>
      </div>
      <p className="muted" style={{ marginTop: "1rem" }}>
        {prompt} <Link to={promptHref}>{promptLabel}</Link>
      </p>
    </section>
  );
}

function ContactPage() {
  return (
    <section>
      <header className="page-header">
        <h1 className="section-title">Contact</h1>
        <p className="muted">We&apos;d love to hear from you.</p>
      </header>
      <div className="card-grid">
        <article className="panel">
          <h3>Email</h3>
          <p className="muted">hello@chrisccweb.io</p>
        </article>
        <article className="panel">
          <h3>Discord</h3>
          <p className="muted">Join Server</p>
        </article>
        <article className="panel">
          <h3>Location</h3>
          <p className="muted">Worldwide</p>
          <button type="button" className="btn btn-primary">
            Send Message
          </button>
        </article>
      </div>
    </section>
  );
}

function DashboardPage() {
  return (
    <section>
      <header className="page-header">
        <h1 className="section-title">Dashboard</h1>
        <p className="muted">Welcome back! Here&apos;s your learning overview.</p>
      </header>
      <div className="card-grid">
        <article className="panel">
          <h3>Plan</h3>
          <p>Free Plan</p>
          <p className="muted">Upgrade now</p>
        </article>
        <article className="panel">
          <h3>Courses Enrolled</h3>
          <p>5</p>
          <p className="muted">+1 this month</p>
        </article>
        <article className="panel">
          <h3>Tokens Earned</h3>
          <p>1,250</p>
          <p className="muted">+180 this week</p>
        </article>
        <article className="panel">
          <h3>Referrals</h3>
          <p>12</p>
          <p className="muted">+3 this month</p>
        </article>
        <article className="panel">
          <h3>Affiliate Revenue</h3>
          <p>$340</p>
          <p className="muted">+$85 this week</p>
        </article>
      </div>
      <section className="panel" style={{ marginTop: "1rem" }}>
        <h3>Continue Learning</h3>
        <p className="muted">Blockchain Fundamentals · 9/12 lessons · 75%</p>
        <p className="muted">AI Basics · 4/10 lessons · 40%</p>
      </section>
    </section>
  );
}

export default App;
