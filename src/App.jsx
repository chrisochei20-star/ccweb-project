import {
  BrowserRouter,
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
import { getSessionToken, getRefreshToken, setSession } from "./session";
import { reportClientError, trackEvent } from "./telemetry";
import { AppBottomNav, AppHeader, AppShellSidebar, GlassCard, MobileMenuDrawer, PrimaryButtonLink } from "./ui";
import { useAuthStore } from "./store/authStore";
import { api, unwrap } from "./lib/api";
import { TwoFactorLoginPage } from "./pages/TwoFactorLoginPage";
import { Setup2FaPage } from "./pages/Setup2FaPage";
import { WalletConnectPanel } from "./pages/WalletConnectPanel";
import { MarketplacePage, MarketplaceDetailPage } from "./pages/MarketplacePage";

const EarlySignalsDashboard = lazy(() =>
  import("./EarlySignalsDashboard").then((m) => ({ default: m.EarlySignalsDashboard }))
);
const DeveloperOnboardingPage = lazy(() =>
  import("./DeveloperOnboardingPage").then((m) => ({ default: m.DeveloperOnboardingPage }))
);
const DeveloperPlatformPage = lazy(() =>
  import("./DeveloperPlatformPage").then((m) => ({ default: m.DeveloperPlatformPage }))
);
const VisualDappBuilderPage = lazy(() =>
  import("./VisualDappBuilderPage").then((m) => ({ default: m.VisualDappBuilderPage }))
);
const GrowthHubPage = lazy(() => import("./GrowthHubPage").then((m) => ({ default: m.GrowthHubPage })));

function LazyBoundary({ children }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[200px] items-center justify-center text-sm text-ccweb-muted">Loading…</div>
      }
    >
      {children}
    </Suspense>
  );
}

const WELCOME_KEY = "ccweb_welcome_done";

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
          <Route path="welcome" element={<WelcomeOnboardingPage />} />
          <Route path="learn" element={<LearnHubPage />} />
          <Route path="build" element={<BuildHubPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="courses/:id" element={<CourseNotFoundPage />} />
          <Route path="ai-tutor" element={<AiTutorPage />} />
          <Route path="ai-streaming" element={<AiStreamingPage />} />
          <Route path="find" element={<FindPage initialTab="hub" />} />
          <Route path="crypto-scanner" element={<FindPage initialTab="scanner" />} />
          <Route path="crypto/trending" element={<FindPage initialTab="trending" />} />
          <Route path="crypto/early-signals" element={<FindPage initialTab="signals" />} />
          <Route path="crypto/wallets" element={<FindPage initialTab="wallets" />} />
          <Route
            path="early-signals"
            element={
              <LazyBoundary>
                <EarlySignalsDashboard />
              </LazyBoundary>
            }
          />
          <Route path="token/:slug" element={<TokenDetailPage />} />
          <Route
            path="developers"
            element={
              <LazyBoundary>
                <DeveloperPlatformPage />
              </LazyBoundary>
            }
          />
          <Route
            path="developers/onboarding"
            element={
              <LazyBoundary>
                <DeveloperOnboardingPage />
              </LazyBoundary>
            }
          />
          <Route
            path="dapp-builder"
            element={
              <LazyBoundary>
                <VisualDappBuilderPage />
              </LazyBoundary>
            }
          />
          <Route path="dapp-dashboard" element={<DappDashboardPage />} />
          <Route path="ai-agents" element={<AiAgentsPage />} />
          <Route
            path="growth-hub"
            element={
              <LazyBoundary>
                <GrowthHubPage />
              </LazyBoundary>
            }
          />
          <Route path="earn" element={<EarnPage />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="tokens" element={<Navigate to="/earn" replace />} />
          <Route path="affiliates" element={<Navigate to="/earn" replace />} />
          <Route path="community" element={<CommunityPage />} />
          <Route path="marketplace" element={<MarketplacePage />} />
          <Route path="marketplace/:id" element={<MarketplaceDetailPage />} />
          <Route path="blog" element={<BlogPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="faq" element={<FaqPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="login/2fa" element={<TwoFactorLoginPage />} />
          <Route path="signup" element={<SignupPage />} />
          <Route path="setup-2fa" element={<Setup2FaPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function Layout() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const hydrate = useAuthStore((s) => s.hydrate);
  const logoutStore = useAuthStore((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    trackEvent("page_view", { title: document.title }).catch(() => {});
  }, [location.pathname, location.search]);

  useEffect(() => {
    function onErr(ev) {
      const m = ev.error?.message || ev.message || "Unknown error";
      reportClientError(m, { source: "error" });
    }
    function onRej(ev) {
      reportClientError(String(ev.reason || "unhandledrejection"), { source: "rejection" });
    }
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);
    return () => {
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onRej);
    };
  }, []);

  async function handleLogout() {
    await logoutStore();
    setUser(null);
    navigate("/");
  }

  const hideChrome =
    location.pathname === "/login" ||
    location.pathname === "/login/2fa" ||
    location.pathname === "/signup" ||
    location.pathname === "/welcome";

  return (
    <div className="site-shell relative min-h-dvh">
      {!hideChrome && (
        <>
          <div
            className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(56,189,248,0.14),transparent_50%),radial-gradient(ellipse_80%_50%_at_100%_50%,rgba(99,102,241,0.1),transparent_45%),linear-gradient(180deg,#020617_0%,#071422_40%,#0c2744_100%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none fixed inset-0 -z-10 opacity-[0.07]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 Q45 20 30 35 Q15 20 30 5' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3C/svg%3E")`,
              backgroundSize: "48px 48px",
            }}
            aria-hidden
          />
        </>
      )}

      {!hideChrome && <AppHeader user={user} onOpenMenu={() => setMenuOpen(true)} />}
      {!hideChrome && <MobileMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />}

      <main
        className={
          hideChrome
            ? "main-content main-content--flush"
            : "mx-auto w-full max-w-[min(70rem,92vw)] px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 sm:px-5 sm:pt-5 lg:flex lg:gap-6 lg:pb-8 lg:pt-6"
        }
      >
        {!hideChrome && <AppShellSidebar />}
        <div className="min-w-0 flex-1">
          <Outlet context={{ user, setUser }} />
        </div>
      </main>

      {!hideChrome && <AppBottomNav pathname={location.pathname} />}

      {!hideChrome && (
        <footer className="ccweb-footer mx-auto mb-[calc(4.25rem+env(safe-area-inset-bottom))] mt-6 max-w-[min(70rem,92vw)] border-t border-white/[0.08] px-4 py-6 text-center text-xs text-ccweb-muted sm:px-5 lg:mb-6">
          © {new Date().getFullYear()} Chrisccwebfoundation · <Link to="/contact">Contact</Link> ·{" "}
          <Link to="/dashboard">Dashboard</Link> · <Link to="/privacy">Privacy</Link> · <Link to="/terms">Terms</Link>
          {user ? (
            <>
              {" · "}
              <button
                type="button"
                onClick={handleLogout}
                className="border-none bg-transparent p-0 text-inherit underline decoration-white/20 underline-offset-2 hover:text-ccweb-sky-200"
              >
                Log out
              </button>
            </>
          ) : null}
        </footer>
      )}
    </div>
  );
}

function WelcomeOnboardingPage() {
  const navigate = useNavigate();

  function pick(path) {
    try {
      localStorage.setItem(WELCOME_KEY, "1");
    } catch {
      /* ignore */
    }
    trackEvent("welcome_interest", { path }).catch(() => {});
    navigate(path);
  }

  function skip() {
    try {
      localStorage.setItem(WELCOME_KEY, "1");
    } catch {
      /* ignore */
    }
    navigate("/dashboard");
  }

  return (
    <section className="welcome-onboarding">
      <header className="page-header">
        <span className="pill">First-time setup</span>
        <h1 className="section-title">Welcome to CCWEB</h1>
        <p className="muted">
          Pick where you want to start. You can change your mind anytime from the bottom navigation.
        </p>
      </header>
      <div className="welcome-grid">
        <button type="button" className="panel welcome-tile" onClick={() => pick("/learn")}>
          <div className="welcome-tile-icon">🧠</div>
          <h3>Learn</h3>
          <p className="muted">Courses, AI tutor, and live AI streaming.</p>
        </button>
        <button type="button" className="panel welcome-tile" onClick={() => pick("/find")}>
          <div className="welcome-tile-icon">🔍</div>
          <h3>Find</h3>
          <p className="muted">Scanner, early signals, and wallet intelligence.</p>
        </button>
        <button type="button" className="panel welcome-tile" onClick={() => pick("/build")}>
          <div className="welcome-tile-icon">🏗️</div>
          <h3>Build</h3>
          <p className="muted">DApp builder, agents, developers, and growth hub.</p>
        </button>
        <button type="button" className="panel welcome-tile" onClick={() => pick("/earn")}>
          <div className="welcome-tile-icon">💰</div>
          <h3>Earn</h3>
          <p className="muted">Affiliates, streaming revenue, and agent rewards.</p>
        </button>
      </div>
      <p className="muted" style={{ marginTop: "1.25rem" }}>
        <button type="button" className="btn btn-outline" onClick={skip}>
          Skip for now
        </button>
        {" · "}
        <Link to="/">Back to home</Link>
      </p>
    </section>
  );
}

function LearnHubPage() {
  return (
    <section>
      <header className="page-header">
        <span className="pill">LEARN</span>
        <h1 className="section-title">Learn hub</h1>
        <p className="muted">Courses, AI tutoring, and live streaming — one place to start.</p>
      </header>
      <div className="card-grid">
        <Link to="/courses" className="panel pillar-card pillar-learn" style={{ textDecoration: "none" }}>
          <h3>Course library</h3>
          <p className="muted">Structured tracks across crypto, AI, and Web3 product skills.</p>
          <span className="pillar-link">Browse courses →</span>
        </Link>
        <Link to="/ai-tutor" className="panel pillar-card pillar-learn" style={{ textDecoration: "none" }}>
          <h3>AI tutor</h3>
          <p className="muted">Ask questions and get adaptive explanations tied to CCWEB curriculum.</p>
          <span className="pillar-link">Open tutor →</span>
        </Link>
        <Link to="/ai-streaming" className="panel pillar-card pillar-learn" style={{ textDecoration: "none" }}>
          <h3>AI streaming</h3>
          <p className="muted">Host or join live rooms with curriculum-aware AI hosts and session memory.</p>
          <span className="pillar-link">Go live →</span>
        </Link>
      </div>
    </section>
  );
}

function BuildHubPage() {
  return (
    <section>
      <header className="page-header">
        <span className="pill">BUILD</span>
        <h1 className="section-title">Build hub</h1>
        <p className="muted">Ship DApps, wire agents, and plug into the developer platform.</p>
      </header>
      <div className="card-grid">
        <Link to="/dapp-builder" className="panel pillar-card pillar-build" style={{ textDecoration: "none" }}>
          <h3>Visual DApp builder</h3>
          <p className="muted">Drag-and-drop canvas, templates, and simulated multi-chain deploy.</p>
          <span className="pillar-link">Open builder →</span>
        </Link>
        <Link to="/dapp-dashboard" className="panel pillar-card pillar-build" style={{ textDecoration: "none" }}>
          <h3>DApp dashboard</h3>
          <p className="muted">Deployments, transactions, and network breakdown for your builds.</p>
          <span className="pillar-link">View dashboard →</span>
        </Link>
        <Link to="/ai-agents" className="panel pillar-card pillar-build" style={{ textDecoration: "none" }}>
          <h3>AI agents</h3>
          <p className="muted">Research, content, and workflow agents with operator-style orchestration.</p>
          <span className="pillar-link">Explore agents →</span>
        </Link>
        <Link to="/developers" className="panel pillar-card pillar-build" style={{ textDecoration: "none" }}>
          <h3>Developer platform</h3>
          <p className="muted">API keys, public API, webhooks, and usage logs.</p>
          <span className="pillar-link">Open console →</span>
        </Link>
        <Link
          to="/developers/onboarding"
          className="panel pillar-card pillar-build"
          style={{ textDecoration: "none" }}
        >
          <h3>Developer onboarding</h3>
          <p className="muted">Five-minute path: project, API key, sandbox, and CLI quick start.</p>
          <span className="pillar-link">Start onboarding →</span>
        </Link>
        <Link to="/growth-hub" className="panel pillar-card pillar-build" style={{ textDecoration: "none" }}>
          <h3>Growth hub</h3>
          <p className="muted">Marketplace, escrow prototype, campaigns, and lead engine.</p>
          <span className="pillar-link">Open growth hub →</span>
        </Link>
      </div>
    </section>
  );
}

function HomePage() {
  return (
    <div className="space-y-6 pb-8">
      <GlassCard className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-gradient-to-br from-ccweb-cyan-400/25 to-ccweb-indigo-500/20 blur-3xl"
          aria-hidden
        />
        <div className="relative">
          <span className="inline-block rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-ccweb-sky-200 sm:text-[11px]">
            Web3 + AI campus
          </span>
          <h1 className="mt-4 max-w-[18ch] text-3xl font-bold leading-tight tracking-tight text-ccweb-text sm:text-4xl md:text-5xl">
            Learn smarter.{" "}
            <span className="bg-gradient-to-r from-ccweb-sky-200 via-ccweb-cyan-300 to-ccweb-indigo-300 bg-clip-text text-transparent">
              Ship faster.
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-ccweb-muted sm:text-base">
            One glass shell for courses, on-chain intelligence, builders, and revenue — signals over hype, built for
            mobile-first teams.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <PrimaryButtonLink to="/signup">Get started free</PrimaryButtonLink>
            <Link
              to="/find"
              className="inline-flex min-h-[44px] items-center justify-center rounded-[14px] border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-ccweb-sky-100 shadow-ccweb-glow backdrop-blur-sm transition hover:border-ccweb-sky-400/30 hover:bg-white/[0.08]"
            >
              Explore intelligence
            </Link>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard value="50K+" label="Learners" />
        <StatCard value="200+" label="AI paths" />
        <StatCard value="8" label="DApp templates" />
        <StatCard value="99.9%" label="Target uptime" />
      </div>

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-ccweb-muted">Pillars</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Link to="/learn" className="group block no-underline">
            <GlassCard className="h-full transition group-hover:border-ccweb-cyan-400/25 group-hover:shadow-ccweb-glow">
              <div className="text-2xl">🧠</div>
              <h3 className="mt-2 text-lg font-bold text-ccweb-text">Learn</h3>
              <p className="mt-1 text-sm text-ccweb-muted">
                Streaming, tutor, and structured tracks — session memory included.
              </p>
              <span className="mt-3 inline-block text-sm font-semibold text-ccweb-sky-300">Open hub →</span>
            </GlassCard>
          </Link>
          <Link to="/find" className="group block no-underline">
            <GlassCard className="h-full transition group-hover:border-ccweb-cyan-400/25 group-hover:shadow-ccweb-glow">
              <div className="text-2xl">🔍</div>
              <h3 className="mt-2 text-lg font-bold text-ccweb-text">Find</h3>
              <p className="mt-1 text-sm text-ccweb-muted">Scanner, early signals, and wallet context — probabilities, not promises.</p>
              <span className="mt-3 inline-block text-sm font-semibold text-ccweb-sky-300">View hub →</span>
            </GlassCard>
          </Link>
          <Link to="/build" className="group block no-underline">
            <GlassCard className="h-full transition group-hover:border-ccweb-cyan-400/25 group-hover:shadow-ccweb-glow">
              <div className="text-2xl">🏗️</div>
              <h3 className="mt-2 text-lg font-bold text-ccweb-text">Build</h3>
              <p className="mt-1 text-sm text-ccweb-muted">Visual DApp builder, agents, developer API, and growth workspace.</p>
              <span className="mt-3 inline-block text-sm font-semibold text-ccweb-sky-300">Start building →</span>
            </GlassCard>
          </Link>
          <Link to="/growth-hub" className="group block no-underline sm:col-span-2 xl:col-span-1">
            <GlassCard className="h-full border-dashed border-white/20 transition group-hover:border-ccweb-indigo-400/35">
              <div className="text-2xl">🌍</div>
              <h3 className="mt-2 text-lg font-bold text-ccweb-text">Growth hub</h3>
              <p className="mt-1 text-sm text-ccweb-muted">Marketplace + escrow prototype for organic-first GTM plays.</p>
              <span className="mt-3 inline-block text-sm font-semibold text-ccweb-indigo-300">Open workspace →</span>
            </GlassCard>
          </Link>
          <Link to="/earn" className="group block no-underline sm:col-span-2 xl:col-span-2">
            <GlassCard className="h-full bg-gradient-to-br from-white/[0.06] to-transparent transition group-hover:border-ccweb-cyan-400/20">
              <div className="text-2xl">💰</div>
              <h3 className="mt-2 text-lg font-bold text-ccweb-text">Earn</h3>
              <p className="mt-1 text-sm text-ccweb-muted max-w-prose">
                Affiliates, streaming splits, and agent-linked outcomes — external settlement, no platform-token gimmicks.
              </p>
              <span className="mt-3 inline-block text-sm font-semibold text-ccweb-green-400">View earn hub →</span>
            </GlassCard>
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ value, label }) {
  return (
    <GlassCard padding="p-4 sm:p-5" className="text-center sm:text-left">
      <div className="bg-gradient-to-r from-ccweb-sky-200 to-ccweb-cyan-300 bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-3xl">
        {value}
      </div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wide text-ccweb-muted">{label}</div>
    </GlassCard>
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

function AiStreamingPage() {
  const [payload, setPayload] = useState({
    roomTitle: "AI Web3 Fundamentals Live",
    curriculum: "AI",
    courseLoad: "standard",
    sessionCapacity: 250,
    hostModel: "Claude-CCWEB-Host",
    hostLocale: "English",
    expectedAudience: 1800,
    expectedArppuUsd: 4.5,
    platformSharePercent: 37,
    expectedSessionMinutes: 120,
    tutoringIntervalMinutes: 20,
  });
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [response, setResponse] = useState(null);
  const [joinPayload, setJoinPayload] = useState({
    userId: "user-organic-001",
    displayName: "Maya Organic Learner",
    watchMinutes: 15,
    isOrganic: true,
  });
  const [joinState, setJoinState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [error, setError] = useState("");
  const [joinError, setJoinError] = useState("");
  const [activeSessionLock, setActiveSessionLock] = useState(null);

  function updateField(field, value) {
    setPayload((prev) => ({ ...prev, [field]: value }));
  }

  function curriculumToTracks(curriculum) {
    const normalized = curriculum.toLowerCase();
    if (normalized === "ai") {
      return ["AI Foundations", "Machine Learning", "Digital Business Systems"];
    }
    if (normalized === "blockchain") {
      return ["Blockchain Fundamentals", "Smart Contracts", "Web3 Product Development"];
    }
    if (normalized === "web3") {
      return ["Web3 Product Development", "Smart Contracts", "Digital Business Systems"];
    }
    if (normalized === "crypto") {
      return ["Crypto Markets", "Blockchain Fundamentals", "Financial Literacy & Human Development"];
    }
    if (normalized === "business") {
      return ["Digital Business Systems", "Financial Literacy & Human Development", "AI Foundations"];
    }
    return ["Financial Literacy & Human Development", "Digital Business Systems", "AI Foundations"];
  }

  function autoDurationForCourseLoad(load) {
    if (load === "foundation") {
      return 60;
    }
    if (load === "standard") {
      return 90;
    }
    if (load === "advanced") {
      return 120;
    }
    if (load === "intensive") {
      return 150;
    }
    return 180;
  }

  function autoIntervalForCourseLoad(load) {
    if (load === "foundation") {
      return 12;
    }
    if (load === "standard") {
      return 15;
    }
    if (load === "advanced") {
      return 20;
    }
    if (load === "intensive") {
      return 25;
    }
    return 30;
  }

  function autoAudienceByCapacity(capacity) {
    const safeCapacity = Math.max(20, Number(capacity) || 20);
    return Math.round(safeCapacity * 0.72);
  }

  function autoArppuByCurriculum(curriculum) {
    const key = curriculum.toLowerCase();
    if (key === "ai") {
      return 5.2;
    }
    if (key === "blockchain") {
      return 5.1;
    }
    if (key === "web3") {
      return 4.9;
    }
    if (key === "crypto") {
      return 5.4;
    }
    if (key === "business") {
      return 4.6;
    }
    return 4.5;
  }

  async function loadRooms() {
    try {
      const res = await fetch("/api/streaming/rooms");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not load rooms.");
      }
      setRooms(data.rooms || []);
      if (!selectedRoomId && data.rooms?.length) {
        setSelectedRoomId(data.rooms[0].id);
      }
    } catch (err) {
      setJoinError(err.message);
    }
  }

  useEffect(() => {
    loadRooms();
  }, []);

  function getSelectedRoom() {
    if (response?.room?.id && response.room.id === selectedRoomId) {
      return response.room;
    }
    return rooms.find((room) => room.id === selectedRoomId) || response?.room || null;
  }

  async function createRoom() {
    setLoading(true);
    setError("");
    try {
      const expectedGross = Number(payload.expectedAudience) * Number(payload.expectedArppuUsd);
      const res = await fetch("/api/streaming/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomName: payload.roomTitle,
          topic: `${payload.curriculum} live masterclass`,
          city: "Global",
          region: payload.hostLocale,
          createdBy: "ccweb-stream-studio",
          aiHostName: payload.hostModel,
          curriculumTracks: curriculumToTracks(payload.curriculum),
          platformRevenueSharePercent: Number(payload.platformSharePercent),
          courseLoad: payload.courseLoad,
          sessionCapacity: Number(payload.sessionCapacity),
          expectedSessionMinutes: Number(payload.expectedSessionMinutes),
          tutoringIntervalMinutes: Number(payload.tutoringIntervalMinutes),
          agenda: [
            {
              title: `${payload.curriculum} foundations`,
              durationMinutes: Math.round(Number(payload.expectedSessionMinutes) * 0.45),
            },
            {
              title: `${payload.curriculum} practical workshop`,
              durationMinutes: Math.round(Number(payload.expectedSessionMinutes) * 0.35),
            },
            {
              title: "Live Q&A and recap",
              durationMinutes: Math.round(Number(payload.expectedSessionMinutes) * 0.2),
            },
          ],
        }),
      });

      const roomData = await res.json();
      if (!res.ok) {
        throw new Error(roomData.error || "Could not create room.");
      }

      const payoutRes = await fetch("/api/streaming/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: roomData.id,
          periodLabel: "Projected first live cycle",
          grossRevenueUsd: expectedGross,
          platformRevenueSharePercent: Number(payload.platformSharePercent),
        }),
      });
      const payoutData = await payoutRes.json();
      if (!payoutRes.ok) {
        throw new Error(payoutData.error || "Could not compute payout.");
      }

      setResponse({ room: roomData, payout: payoutData });
      setSelectedRoomId(roomData.id);
      await loadRooms();
      setJoinState(null);
      setActiveSessionLock(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function joinRoom() {
    if (!selectedRoomId) {
      setJoinError("Select a room before joining.");
      return;
    }
    setJoinLoading(true);
    setJoinError("");
    try {
      const res = await fetch(`/api/streaming/rooms/${selectedRoomId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: joinPayload.userId,
          displayName: joinPayload.displayName,
          watchMinutes: Number(joinPayload.watchMinutes),
          isOrganic: Boolean(joinPayload.isOrganic),
          isActive: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.activeSession) {
          setActiveSessionLock(data.activeSession);
        }
        throw new Error(data.error || "Could not join this stream.");
      }
      setJoinState(data);
      setActiveSessionLock(null);
      await loadRooms();
    } catch (err) {
      setJoinError(err.message);
    } finally {
      setJoinLoading(false);
    }
  }

  async function leaveRoom() {
    if (!selectedRoomId) {
      setJoinError("Select a room before leaving.");
      return;
    }
    setJoinLoading(true);
    setJoinError("");
    try {
      const res = await fetch(`/api/streaming/rooms/${selectedRoomId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: joinPayload.userId,
          displayName: joinPayload.displayName,
          watchMinutes: Number(joinPayload.watchMinutes),
          isOrganic: Boolean(joinPayload.isOrganic),
          isActive: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not leave this stream.");
      }
      setJoinState(data);
      if (selectedRoomId && activeSessionLock?.roomId === selectedRoomId) {
        setActiveSessionLock(null);
      }
      await loadRooms();
    } catch (err) {
      setJoinError(err.message);
    } finally {
      setJoinLoading(false);
    }
  }

  async function finishRoom() {
    if (!selectedRoomId) {
      setJoinError("Select a room before finishing.");
      return;
    }
    setJoinLoading(true);
    setJoinError("");
    try {
      const res = await fetch(`/api/streaming/rooms/${selectedRoomId}/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          finishedBy: "ccweb-stream-studio",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not finish this stream.");
      }
      await loadRooms();
      if (response?.room?.id === selectedRoomId) {
        setResponse((prev) => (prev ? { ...prev, room: data.room } : prev));
      }
      setJoinState((prev) =>
        prev ? { ...prev, metrics: data.room.metrics, roomId: data.room.id } : prev
      );
      if (activeSessionLock?.roomId === selectedRoomId) {
        setActiveSessionLock(null);
      }
    } catch (err) {
      setJoinError(err.message);
    } finally {
      setJoinLoading(false);
    }
  }

  const selectedRoom = getSelectedRoom();

  return (
    <section>
      <header className="page-header">
        <h1 className="section-title">AI Web Streaming</h1>
        <p className="muted">
          LiveKit-powered rooms with AI hosts that can tutor across AI, Blockchain, Web3,
          Crypto, Business, and Finance curricula.
        </p>
      </header>

      <div className="card-grid">
        <article className="panel">
          <h3>Live room configuration</h3>
          <div className="auth-row">
            <label htmlFor="room-title">Room title</label>
            <input
              id="room-title"
              value={payload.roomTitle}
              onChange={(event) => updateField("roomTitle", event.target.value)}
            />
          </div>
          <div className="auth-row">
            <label htmlFor="curriculum">Curriculum</label>
            <select
              id="curriculum"
              value={payload.curriculum}
              onChange={(event) => {
                const value = event.target.value;
                updateField("curriculum", value);
                updateField("expectedArppuUsd", autoArppuByCurriculum(value));
              }}
            >
              <option>AI</option>
              <option>Blockchain</option>
              <option>Web3</option>
              <option>Crypto</option>
              <option>Business</option>
              <option>Finance</option>
            </select>
          </div>
          <div className="auth-row">
            <label htmlFor="course-load">Course load template</label>
            <select
              id="course-load"
              value={payload.courseLoad}
              onChange={(event) => {
                const value = event.target.value;
                updateField("courseLoad", value);
                updateField("expectedSessionMinutes", autoDurationForCourseLoad(value));
                updateField("tutoringIntervalMinutes", autoIntervalForCourseLoad(value));
              }}
            >
              <option value="foundation">Foundation load</option>
              <option value="standard">Standard load</option>
              <option value="advanced">Advanced load</option>
              <option value="intensive">Intensive load</option>
              <option value="marathon">Marathon load</option>
            </select>
          </div>
          <div className="auth-row">
            <label htmlFor="session-capacity">Session capacity</label>
            <input
              id="session-capacity"
              type="number"
              min="20"
              max="10000"
              value={payload.sessionCapacity}
              onChange={(event) => {
                const nextCapacity = event.target.value;
                updateField("sessionCapacity", nextCapacity);
                updateField("expectedAudience", autoAudienceByCapacity(nextCapacity));
              }}
            />
          </div>
          <div className="auth-row">
            <label htmlFor="host-model">AI host model</label>
            <input
              id="host-model"
              value={payload.hostModel}
              onChange={(event) => updateField("hostModel", event.target.value)}
            />
          </div>
          <div className="auth-row">
            <label htmlFor="host-locale">Host locale</label>
            <input
              id="host-locale"
              value={payload.hostLocale}
              onChange={(event) => updateField("hostLocale", event.target.value)}
            />
          </div>
          <div className="auth-row">
            <label htmlFor="expected-audience">Expected audience</label>
            <input
              id="expected-audience"
              type="number"
              min="1"
              value={payload.expectedAudience}
              onChange={(event) => updateField("expectedAudience", event.target.value)}
            />
          </div>
          <div className="auth-row">
            <label htmlFor="arppu">Expected ARPPU (USD)</label>
            <input
              id="arppu"
              type="number"
              min="0.1"
              step="0.1"
              value={payload.expectedArppuUsd}
              onChange={(event) => updateField("expectedArppuUsd", event.target.value)}
            />
          </div>
          <div className="auth-row">
            <label htmlFor="platform-share">CCWEB platform share % (35-40)</label>
            <input
              id="platform-share"
              type="number"
              min="35"
              max="40"
              value={payload.platformSharePercent}
              onChange={(event) => updateField("platformSharePercent", event.target.value)}
            />
          </div>
          <div className="auth-row">
            <label htmlFor="expected-session-minutes">Expected full session (minutes)</label>
            <input
              id="expected-session-minutes"
              type="number"
              min="15"
              max="480"
              value={payload.expectedSessionMinutes}
              onChange={(event) => updateField("expectedSessionMinutes", event.target.value)}
            />
          </div>
          <div className="auth-row">
            <label htmlFor="interval-minutes">Tutor round interval (minutes)</label>
            <input
              id="interval-minutes"
              type="number"
              min="5"
              max="90"
              value={payload.tutoringIntervalMinutes}
              onChange={(event) => updateField("tutoringIntervalMinutes", event.target.value)}
            />
          </div>
          <button type="button" className="btn btn-primary" onClick={createRoom} disabled={loading}>
            {loading ? "Creating..." : "Create AI Live Room"}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={loadRooms}
            style={{ marginLeft: "0.5rem" }}
          >
            Refresh rooms
          </button>
          {error ? <p className="muted" style={{ color: "#ff8c8c" }}>{error}</p> : null}
        </article>

        <article className="panel">
          <h3>Revenue and capability preview</h3>
          {!response ? (
            <p className="muted">
              Create a room to preview LiveKit session details, curriculum coverage,
              and organic revenue projections.
            </p>
          ) : (
            <>
              <div className="auth-row">
                <label htmlFor="active-room">Select active room</label>
                <select
                  id="active-room"
                  value={selectedRoomId}
                  onChange={(event) => setSelectedRoomId(event.target.value)}
                >
                  {rooms.length ? null : (
                    <option value={response.room.id}>{response.room.roomName}</option>
                  )}
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.roomName} ({room.status})
                    </option>
                  ))}
                </select>
              </div>
              <p><strong>Room:</strong> {selectedRoom?.roomName || response.room.roomName}</p>
              <p><strong>LiveKit SID hint:</strong> {selectedRoom?.livekit?.roomSidHint || response.room.livekit.roomSidHint}</p>
              <p><strong>Status:</strong> {selectedRoom?.status || response.room.status}</p>
              <p><strong>Topic:</strong> {selectedRoom?.topic || response.room.topic}</p>
              <p><strong>AI Host:</strong> {selectedRoom?.aiHost?.displayName || response.room.aiHost.displayName}</p>
              <p><strong>Course load:</strong> {selectedRoom?.configuration?.courseLoad || "standard"}</p>
              <p><strong>Session capacity:</strong> {selectedRoom?.configuration?.sessionCapacity || payload.sessionCapacity}</p>
              <p><strong>Starts at:</strong> {selectedRoom?.tutoringSchedule?.startedAt || "TBD"}</p>
              <p><strong>Estimated end:</strong> {selectedRoom?.tutoringSchedule?.estimatedEndAt || "TBD"}</p>
              <p>
                <strong>Expected session:</strong> {selectedRoom?.tutoringSchedule?.expectedSessionMinutes || 0} minutes
                {" · "}
                <strong>Tutor interval:</strong> {selectedRoom?.tutoringSchedule?.tutoringIntervalMinutes || 0} minutes
              </p>
              <p>
                <strong>Estimated teaching rounds:</strong>{" "}
                {selectedRoom?.tutoringSchedule?.estimatedSegments || 0}
              </p>
              <p><strong>Platform share:</strong> {response.payout.platformRevenueSharePercent}%</p>
              <p><strong>Estimated gross:</strong> ${response.payout.grossRevenueUsd}</p>
              <p><strong>CCWEB revenue:</strong> ${response.payout.platformRevenueUsd}</p>
              <p><strong>Creator pool:</strong> ${response.payout.creatorRevenueUsd}</p>
              <p>
                <strong>Auto capacity utilization:</strong>{" "}
                {selectedRoom?.monetization?.autoCapacityUtilizationPercent ?? "n/a"}%
              </p>
              <p>
                <strong>Participation weighting:</strong>{" "}
                {selectedRoom?.monetization?.organicDistributionModel || "watch_minutes_weighted"}
              </p>
              <h4 style={{ marginBottom: "0.4rem", marginTop: "1rem" }}>Join/leave session</h4>
              <div className="auth-row">
                <label htmlFor="join-user-id">User ID</label>
                <input
                  id="join-user-id"
                  value={joinPayload.userId}
                  onChange={(event) =>
                    setJoinPayload((prev) => ({ ...prev, userId: event.target.value }))
                  }
                />
              </div>
              <div className="auth-row">
                <label htmlFor="join-display-name">Display name</label>
                <input
                  id="join-display-name"
                  value={joinPayload.displayName}
                  onChange={(event) =>
                    setJoinPayload((prev) => ({ ...prev, displayName: event.target.value }))
                  }
                />
              </div>
              <div className="auth-row">
                <label htmlFor="join-watch-minutes">Watch minutes</label>
                <input
                  id="join-watch-minutes"
                  type="number"
                  min="0"
                  value={joinPayload.watchMinutes}
                  onChange={(event) =>
                    setJoinPayload((prev) => ({ ...prev, watchMinutes: event.target.value }))
                  }
                />
              </div>
              <div className="auth-row">
                <label htmlFor="join-is-organic">Organic user</label>
                <select
                  id="join-is-organic"
                  value={joinPayload.isOrganic ? "true" : "false"}
                  onChange={(event) =>
                    setJoinPayload((prev) => ({
                      ...prev,
                      isOrganic: event.target.value === "true",
                    }))
                  }
                >
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                <button type="button" className="btn btn-primary" onClick={joinRoom} disabled={joinLoading}>
                  {joinLoading ? "Joining..." : "Join stream"}
                </button>
                <button type="button" className="btn btn-outline" onClick={leaveRoom} disabled={joinLoading}>
                  Leave stream
                </button>
                <button type="button" className="btn btn-outline" onClick={finishRoom} disabled={joinLoading}>
                  Finish selected room
                </button>
              </div>
              {activeSessionLock ? (
                <div className="stream-lock-box">
                  <p><strong>Active session lock:</strong> {activeSessionLock.roomName}</p>
                  <p>
                    You must leave or finish that session before joining another one.
                  </p>
                  <p className="muted">
                    Estimated end: {activeSessionLock.estimatedEndAt || "Not available"}
                  </p>
                </div>
              ) : null}
              {joinError ? <p className="muted" style={{ color: "#ff8c8c" }}>{joinError}</p> : null}
              {joinState ? (
                <div className="stream-session-box">
                  <p><strong>Session room:</strong> {joinState.roomId}</p>
                  <p><strong>User active:</strong> {joinState.attendance?.isActive ? "yes" : "no"}</p>
                  <p><strong>Active attenders:</strong> {joinState.metrics?.activeAttenders ?? 0}</p>
                  <p><strong>Active organic attenders:</strong> {joinState.metrics?.activeOrganicAttenders ?? 0}</p>
                </div>
              ) : null}
              <h4 style={{ marginBottom: "0.4rem" }}>AI host curriculum coverage</h4>
              <ul className="list">
                {(selectedRoom?.aiHost?.curriculumCoverage || response.room.aiHost.curriculumCoverage).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          )}
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
  return <Navigate to="/earn" replace />;
}

function AffiliatesPage() {
  return <Navigate to="/earn" replace />;
}

function CommunityPage() {
  const { user } = useOutletContext();
  const [posts, setPosts] = useState([]);
  const [chats, setChats] = useState([]);
  const [channel, setChannel] = useState("general");
  const [chatBody, setChatBody] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [bugTitle, setBugTitle] = useState("");
  const [bugDesc, setBugDesc] = useState("");
  const [bugSev, setBugSev] = useState("normal");
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [expandedPostId, setExpandedPostId] = useState(null);
  const [commentsByPost, setCommentsByPost] = useState({});
  const [commentDraft, setCommentDraft] = useState({});

  async function loadPosts() {
    try {
      const data = await unwrap(api.get("/api/community/posts"));
      setPosts(data.posts || []);
    } catch {
      setPosts([]);
    }
  }

  async function loadChats() {
    try {
      const data = await unwrap(api.get(`/api/community/chats?channel=${encodeURIComponent(channel)}`));
      setChats(data.chats || []);
    } catch {
      setChats([]);
    }
  }

  async function loadComments(postId) {
    try {
      const data = await unwrap(api.get(`/api/community/posts/${postId}/comments`));
      setCommentsByPost((prev) => ({ ...prev, [postId]: data.comments || [] }));
    } catch {
      setCommentsByPost((prev) => ({ ...prev, [postId]: [] }));
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    loadChats();
  }, [channel]);

  useEffect(() => {
    if (expandedPostId) loadComments(expandedPostId);
  }, [expandedPostId]);

  async function submitPost(e) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (!user) {
      setErr("Sign in to post.");
      return;
    }
    try {
      const data = await unwrap(
        api.post("/api/community/posts", {
          authorUserId: user.id,
          authorDisplayName: user.displayName,
          title: postTitle.trim(),
          content: postContent.trim(),
        })
      );
      setPostTitle("");
      setPostContent("");
      setMsg("Post published.");
      loadPosts();
      trackEvent("community_post", { postId: data.id }).catch(() => {});
    } catch (e) {
      setErr(e.message);
    }
  }

  async function submitChat(e) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (!user) {
      setErr("Sign in to chat.");
      return;
    }
    try {
      await unwrap(
        api.post("/api/community/chats", {
          authorUserId: user.id,
          authorDisplayName: user.displayName,
          channel,
          message: chatBody.trim(),
        })
      );
      setChatBody("");
      setMsg("Message sent.");
      loadChats();
      trackEvent("community_chat", { channel }).catch(() => {});
    } catch (e) {
      setErr(e.message);
    }
  }

  async function submitBug(e) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    try {
      const data = await unwrap(
        api.post("/api/community/bugs", {
          reporterUserId: user?.id,
          reporterDisplayName: user?.displayName,
          title: bugTitle.trim(),
          description: bugDesc.trim(),
          path: window.location.pathname,
          severity: bugSev,
        })
      );
      setBugTitle("");
      setBugDesc("");
      setMsg(`Thanks — tracked as ${data.id}.`);
    } catch (e) {
      setErr(e.message);
    }
  }

  async function submitComment(postId, e) {
    e.preventDefault();
    setErr(null);
    if (!user) {
      setErr("Sign in to comment.");
      return;
    }
    const body = (commentDraft[postId] || "").trim();
    if (!body) return;
    try {
      await unwrap(
        api.post(`/api/community/posts/${postId}/comments`, {
          authorUserId: user.id,
          authorDisplayName: user.displayName,
          body,
        })
      );
      setCommentDraft((d) => ({ ...d, [postId]: "" }));
      loadComments(postId);
      loadPosts();
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <section>
      <header className="page-header">
        <span className="pill">COMMUNITY</span>
        <h1 className="section-title">Community</h1>
        <p className="muted">
          Posts, comments, and chat use the live API (in-memory on the server until a database is connected).
        </p>
      </header>

      {err && <p style={{ color: "#ff6b6b", marginBottom: "0.75rem" }}>{err}</p>}
      {msg && <p className="muted" style={{ marginBottom: "0.75rem" }}>{msg}</p>}

      <div className="card-grid">
        <article className="panel">
          <h3>Channels</h3>
          <p className="muted">Pick a channel for the live chat below.</p>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
            {["general", "crypto", "builders"].map((c) => (
              <button
                key={c}
                type="button"
                className={`btn btn-outline${channel === c ? " btn-primary" : ""}`}
                style={{ fontSize: "0.85rem", padding: "0.45rem 0.7rem" }}
                onClick={() => setChannel(c)}
              >
                #{c}
              </button>
            ))}
          </div>
        </article>
        <article className="panel">
          <h3>Report a bug</h3>
          <p className="muted">Helps us prioritize fixes during early access.</p>
          <form onSubmit={submitBug} style={{ marginTop: "0.75rem" }}>
            <div className="auth-row">
              <label htmlFor="bug-title">Title</label>
              <input id="bug-title" value={bugTitle} onChange={(e) => setBugTitle(e.target.value)} required />
            </div>
            <div className="auth-row">
              <label htmlFor="bug-sev">Severity</label>
              <select id="bug-sev" value={bugSev} onChange={(e) => setBugSev(e.target.value)}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="auth-row">
              <label htmlFor="bug-desc">What happened?</label>
              <textarea
                id="bug-desc"
                rows={4}
                value={bugDesc}
                onChange={(e) => setBugDesc(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Submit report
            </button>
          </form>
        </article>
      </div>

      <div className="card-grid" style={{ marginTop: "1rem" }}>
        <article className="panel community-chat-panel">
          <h3>Live chat · #{channel}</h3>
          <div className="community-chat-scroll">
            {chats.length === 0 ? (
              <p className="muted">No messages yet. Say hello.</p>
            ) : (
              chats
                .slice()
                .reverse()
                .map((c) => (
                  <div key={c.id} className="community-chat-row">
                    <strong>{c.authorDisplayName}</strong>
                    <span className="muted" style={{ marginLeft: "0.35rem", fontSize: "0.8rem" }}>
                      {new Date(c.createdAt).toLocaleString()}
                    </span>
                    <p style={{ margin: "0.25rem 0 0" }}>{c.message}</p>
                  </div>
                ))
            )}
          </div>
          <form onSubmit={submitChat} style={{ marginTop: "0.75rem" }}>
            <div className="auth-row">
              <label htmlFor="chat-msg">Message</label>
              <input
                id="chat-msg"
                value={chatBody}
                onChange={(e) => setChatBody(e.target.value)}
                placeholder={user ? "Write a message…" : "Sign in to chat"}
                disabled={!user}
              />
            </div>
            <button type="submit" className="btn btn-outline" disabled={!user}>
              Send
            </button>
          </form>
        </article>

        <article className="panel">
          <h3>New post</h3>
          {!user ? <p className="muted">Sign in to create a post.</p> : null}
          <form onSubmit={submitPost} style={{ marginTop: "0.5rem" }}>
            <div className="auth-row">
              <label htmlFor="post-title">Title</label>
              <input
                id="post-title"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                disabled={!user}
                required
              />
            </div>
            <div className="auth-row">
              <label htmlFor="post-body">Body</label>
              <textarea
                id="post-body"
                rows={4}
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                disabled={!user}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={!user}>
              Publish
            </button>
          </form>
        </article>
      </div>

      <section className="panel" style={{ marginTop: "1rem" }}>
        <h3>Posts &amp; comments</h3>
        {posts.length === 0 ? (
          <p className="muted">No posts yet.</p>
        ) : (
          <ul className="list" style={{ marginTop: "0.5rem" }}>
            {posts.slice(0, 12).map((p) => (
              <li key={p.id} style={{ marginBottom: "1rem" }}>
                <strong>{p.title}</strong> · <span className="muted">{p.authorDisplayName}</span>
                {typeof p.commentCount === "number" ? (
                  <span className="muted" style={{ marginLeft: "0.35rem" }}>
                    · {p.commentCount} comment{p.commentCount === 1 ? "" : "s"}
                  </span>
                ) : null}
                <p className="muted" style={{ margin: "0.25rem 0 0", fontSize: "0.9rem" }}>
                  {p.content.slice(0, 220)}
                  {p.content.length > 220 ? "…" : ""}
                </p>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ marginTop: "0.4rem", fontSize: "0.8rem", padding: "0.35rem 0.6rem" }}
                  onClick={() => setExpandedPostId((id) => (id === p.id ? null : p.id))}
                >
                  {expandedPostId === p.id ? "Hide thread" : "View / comment"}
                </button>
                {expandedPostId === p.id ? (
                  <div style={{ marginTop: "0.6rem", paddingLeft: "0.5rem", borderLeft: "2px solid rgba(117,160,214,0.25)" }}>
                    <ul className="list" style={{ fontSize: "0.88rem" }}>
                      {(commentsByPost[p.id] || []).map((cm) => (
                        <li key={cm.id} style={{ marginBottom: "0.35rem" }}>
                          <strong>{cm.authorDisplayName}</strong>
                          <span className="muted" style={{ marginLeft: "0.35rem", fontSize: "0.75rem" }}>
                            {new Date(cm.createdAt).toLocaleString()}
                          </span>
                          <p className="muted" style={{ margin: "0.15rem 0 0" }}>
                            {cm.body}
                          </p>
                        </li>
                      ))}
                    </ul>
                    {user ? (
                      <form onSubmit={(ev) => submitComment(p.id, ev)} style={{ marginTop: "0.5rem" }}>
                        <textarea
                          rows={2}
                          value={commentDraft[p.id] || ""}
                          onChange={(e) => setCommentDraft((d) => ({ ...d, [p.id]: e.target.value }))}
                          placeholder="Write a comment…"
                          style={{ width: "100%", marginBottom: "0.35rem" }}
                        />
                        <button type="submit" className="btn btn-primary btn-sm">
                          Post comment
                        </button>
                      </form>
                    ) : (
                      <p className="muted" style={{ marginTop: "0.35rem", fontSize: "0.85rem" }}>
                        Sign in to comment.
                      </p>
                    )}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
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
  const { setUser } = useOutletContext();
  return (
    <AuthPage
      mode="login"
      title="Welcome Back"
      subtitle="Sign in to continue learning"
      action="Sign In"
      prompt="Don't have an account?"
      promptHref="/signup"
      promptLabel="Sign Up"
      setUser={setUser}
    />
  );
}

function SignupPage() {
  const { setUser } = useOutletContext();
  return (
    <AuthPage
      mode="signup"
      title="Create Account"
      subtitle="Start learning and earning today"
      action="Create Account"
      prompt="Already have an account?"
      promptHref="/login"
      promptLabel="Sign In"
      setUser={setUser}
    />
  );
}

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [pw, setPw] = useState("");
  const [step, setStep] = useState("request");
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  async function requestReset() {
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/auth/password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setMsg(data.message);
      if (data.debugToken) setMsg(`${data.message} (dev token: ${data.debugToken})`);
      setStep("reset");
    } catch (e) {
      setErr(e.message);
    }
  }

  async function doReset() {
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, newPassword: pw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");
      setMsg("Password updated. You can sign in now.");
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <section className="auth-card">
      <h1 className="section-title">Reset password</h1>
      <p className="muted">
        Prototype flow: request a reset, then complete with the token (set{" "}
        <code>AUTH_DEBUG=1</code> on the API to return a dev token in the response).
      </p>
      <div className="auth-row">
        <label htmlFor="re-email">Email</label>
        <input
          id="re-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      {step === "request" && (
        <button type="button" className="btn btn-primary" onClick={requestReset}>
          Send reset link (prototype)
        </button>
      )}
      {step === "reset" && (
        <>
          <div className="auth-row">
            <label htmlFor="re-token">Reset token</label>
            <input id="re-token" value={token} onChange={(e) => setToken(e.target.value)} placeholder="paste token" />
          </div>
          <div className="auth-row">
            <label htmlFor="re-pw">New password</label>
            <input
              id="re-pw"
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="min 8 characters"
            />
          </div>
          <button type="button" className="btn btn-primary" onClick={doReset}>
            Update password
          </button>
        </>
      )}
      {msg && <p className="muted" style={{ marginTop: "1rem" }}>{msg}</p>}
      {err && <p style={{ marginTop: "1rem", color: "#ff6b6b" }}>{err}</p>}
      <p className="muted" style={{ marginTop: "1rem" }}>
        <Link to="/login">Back to login</Link>
      </p>
    </section>
  );
}

function AuthPage({ mode, title, subtitle, action, prompt, promptHref, promptLabel, setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        await register({ email, password, displayName });
      }
      const result = await login(email, password);
      if (result?.needsTwoFactor) {
        navigate("/login/2fa", { replace: true });
        return;
      }
      setUser(result.user);
      try {
        if (!localStorage.getItem(WELCOME_KEY)) {
          navigate("/welcome");
        } else {
          navigate("/dashboard");
        }
      } catch {
        navigate("/dashboard");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-card">
      <h1 className="section-title">{title}</h1>
      <p className="muted">{subtitle}</p>
      {mode === "signup" && (
        <div className="auth-row">
          <label htmlFor="displayName">Display name</label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
          />
        </div>
      )}
      <div className="auth-row">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <div className="auth-row">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="min 8 characters"
        />
      </div>
      {error && <p style={{ color: "#ff6b6b", marginBottom: "0.75rem" }}>{error}</p>}
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        <button type="button" className="btn btn-primary" disabled={loading} onClick={submit}>
          {loading ? "Please wait…" : action}
        </button>
        <button type="button" className="btn btn-outline" disabled>
          Continue with Google (coming soon)
        </button>
      </div>
      <p className="muted" style={{ marginTop: "1rem" }}>
        {prompt} <Link to={promptHref}>{promptLabel}</Link>
        {mode === "login" && (
          <>
            {" · "}
            <Link to="/forgot-password">Forgot password?</Link>
          </>
        )}
      </p>
      <p className="muted" style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
        JWT access tokens (bcrypt passwords, optional 2FA, wallet sign-in). Set <code>AUTH_JWT_SECRET</code> (32+ chars)
        in production. Refresh token is httpOnly cookie when same-origin; for SPA dev from Vite use{" "}
        <code>AUTH_REFRESH_IN_BODY=1</code>.
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
  const { user } = useOutletContext();
  const [dash, setDash] = useState(null);
  const [agents, setAgents] = useState(null);
  const [growth, setGrowth] = useState(null);
  const [rooms, setRooms] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!user) return;
    let c = true;
    Promise.all([
      unwrap(api.get("/api/dapp/dashboard")),
      unwrap(api.get("/api/build/agents")),
      unwrap(api.get("/api/growth/overview")),
      unwrap(api.get("/api/streaming/rooms")),
    ])
      .then(([d, a, g, r]) => {
        if (!c) return;
        setDash(d);
        setAgents(a);
        setGrowth(g);
        setRooms(r);
      })
      .catch((e) => {
        if (c) setErr(e.message);
      });
    return () => {
      c = false;
    };
  }, [user]);

  if (!user) {
    return (
      <section>
        <header className="page-header">
          <h1 className="section-title">Dashboard</h1>
          <p className="muted">Sign in to see your personalized overview.</p>
        </header>
        <Link to="/login" className="btn btn-primary">
          Sign in
        </Link>
      </section>
    );
  }

  const ov = dash?.overview;
  const agentCount = agents?.count ?? 0;

  return (
    <section className="space-y-6">
      <header className="page-header">
        <h1 className="section-title">Dashboard</h1>
        <p className="muted">
          Welcome back, <strong>{user.displayName}</strong>. Data below is loaded from the live API (
          <code className="text-xs">/api/dapp/dashboard</code>, <code className="text-xs">/api/build/agents</code>,{" "}
          <code className="text-xs">/api/growth/overview</code>, <code className="text-xs">/api/streaming/rooms</code>
          ).
        </p>
      </header>
      {err ? <p className="text-sm text-red-400">{err}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <GlassCard padding="p-4">
          <h3 className="text-sm font-semibold text-ccweb-muted">DApp deployments</h3>
          <p className="mt-2 text-2xl font-bold text-ccweb-sky-200">{ov?.totalDeployments ?? "—"}</p>
          <p className="text-xs text-ccweb-muted">Active: {ov?.activeDeployments ?? 0}</p>
        </GlassCard>
        <GlassCard padding="p-4">
          <h3 className="text-sm font-semibold text-ccweb-muted">Spend (DApp)</h3>
          <p className="mt-2 text-2xl font-bold text-ccweb-sky-200">${ov?.totalSpentUsd ?? 0}</p>
          <p className="text-xs text-ccweb-muted">Tx count: {ov?.totalTransactions ?? 0}</p>
        </GlassCard>
        <GlassCard padding="p-4">
          <h3 className="text-sm font-semibold text-ccweb-muted">AI agents (catalog)</h3>
          <p className="mt-2 text-2xl font-bold text-ccweb-sky-200">{agentCount}</p>
          <p className="text-xs text-ccweb-muted">From /api/build/agents</p>
        </GlassCard>
        <GlassCard padding="p-4">
          <h3 className="text-sm font-semibold text-ccweb-muted">Growth hub</h3>
          <p className="mt-2 text-2xl font-bold text-ccweb-sky-200">{growth?.listingsCount ?? 0}</p>
          <p className="text-xs text-ccweb-muted">Open orders: {growth?.openOrders ?? 0}</p>
        </GlassCard>
      </div>

      <GlassCard>
        <h3 className="text-lg font-semibold text-ccweb-text">Live rooms</h3>
        <p className="mt-1 text-sm text-ccweb-muted">
          {rooms?.rooms?.length ? `${rooms.rooms.length} room(s) from /api/streaming/rooms` : "No rooms yet — create one from AI streaming."}
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          {(rooms?.rooms || []).slice(0, 5).map((room) => (
            <li key={room.id} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
              <strong>{room.roomName}</strong>{" "}
              <span className="text-ccweb-muted">· {room.status || "active"}</span>
            </li>
          ))}
        </ul>
      </GlassCard>

      <GlassCard>
        <h3 className="text-lg font-semibold text-ccweb-text">Quick actions</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/learn" className="btn btn-outline">
            Learn
          </Link>
          <Link to="/find" className="btn btn-outline">
            Find
          </Link>
          <Link to="/build" className="btn btn-outline">
            Build
          </Link>
          <Link to="/earn" className="btn btn-outline">
            Earn
          </Link>
          <Link to="/ai-streaming" className="btn btn-primary">
            AI Streaming
          </Link>
          <Link to="/marketplace" className="btn btn-outline">
            Marketplace
          </Link>
        </div>
      </GlassCard>
    </section>
  );
}

function ProfilePage() {
  const { user, setUser } = useOutletContext();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [pushEnabled, setPushEnabled] = useState(user?.pushEnabled !== false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setPushEnabled(user.pushEnabled !== false);
    }
  }, [user]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  async function save() {
    setErr(null);
    setMsg(null);
    const token = getSessionToken();
    try {
      const data = await unwrap(
        api.post("/api/users", {
          userId: user.id,
          displayName: displayName.trim(),
          pushEnabled,
        })
      );
      setUser(data);
      setSession(token, data, getRefreshToken());
      setMsg("Profile saved.");
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <section className="space-y-6">
      <header className="page-header">
        <h1 className="section-title">Profile</h1>
        <p className="muted">Signed in as {user.email || user.id}</p>
        <div style={{ marginTop: "0.6rem" }} className="flex flex-wrap gap-2">
          <Link to="/dashboard" className="btn btn-outline btn-sm">
            Dashboard
          </Link>
          <Link to="/setup-2fa" className="btn btn-outline btn-sm">
            Set up 2FA
          </Link>
        </div>
      </header>

      <WalletConnectPanel />

      <article className="panel" style={{ maxWidth: 480 }}>
        <div className="auth-row">
          <label htmlFor="p-name">Display name</label>
          <input
            id="p-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <div className="auth-row" style={{ alignItems: "center" }}>
          <label htmlFor="p-push">Push notifications</label>
          <input
            id="p-push"
            type="checkbox"
            checked={pushEnabled}
            onChange={(e) => setPushEnabled(e.target.checked)}
          />
        </div>
        {err && <p style={{ color: "#ff6b6b" }}>{err}</p>}
        {msg && <p className="muted">{msg}</p>}
        <button type="button" className="btn btn-primary" style={{ marginTop: "0.75rem" }} onClick={save}>
          Save changes
        </button>
      </article>
    </section>
  );
}

function PrivacyPage() {
  return (
    <section>
      <header className="page-header">
        <h1 className="section-title">Privacy policy (draft)</h1>
        <p className="muted">Replace with counsel-reviewed policy before store submission.</p>
      </header>
      <article className="panel">
        <p className="muted">
          This prototype may process email and usage data in memory on the server you control. For production, document
          data categories, retention, subprocessors, and user rights (access, deletion, portability) per GDPR/CCPA and
          store guidelines.
        </p>
      </article>
    </section>
  );
}

function TermsPage() {
  return (
    <section>
      <header className="page-header">
        <h1 className="section-title">Terms of service (draft)</h1>
        <p className="muted">Replace with counsel-reviewed terms before store submission.</p>
      </header>
      <article className="panel">
        <p className="muted">
          CCWEB provides educational and tooling prototypes. Crypto and AI features output signals, not financial or
          legal advice. Users accept risks of volatile markets and experimental software.
        </p>
      </article>
    </section>
  );
}

function FindPage({ initialTab = "hub" }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const validTabs = ["hub", "scanner", "signals", "trending", "wallets", "alerts"];
  const initial = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : initialTab;
  const [tab, setTab] = useState(initial);

  useEffect(() => {
    if (tabFromUrl && validTabs.includes(tabFromUrl)) setTab(tabFromUrl);
  }, [tabFromUrl]);

  const [scanSymbol, setScanSymbol] = useState("");
  const [scanAddress, setScanAddress] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [signals, setSignals] = useState([]);
  const [smartMoney, setSmartMoney] = useState(null);
  const [discover, setDiscover] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [walletInput, setWalletInput] = useState("");
  const [walletScan, setWalletScan] = useState(null);
  const [walletTrackMsg, setWalletTrackMsg] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [loadingSignals, setLoadingSignals] = useState(false);
  const [loadingSm, setLoadingSm] = useState(false);
  const [loadingDiscover, setLoadingDiscover] = useState(false);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [smDisclosure, setSmDisclosure] = useState(false);

  function goTab(next) {
    setTab(next);
    setSearchParams(next === "scanner" || next === "hub" ? {} : { tab: next });
  }

  async function doScan() {
    if (!scanSymbol.trim() && !scanAddress.trim()) return;
    setScanning(true);
    setScanResult(null);
    try {
      const params = new URLSearchParams();
      if (scanSymbol.trim()) params.set("token", scanSymbol.trim().toUpperCase());
      if (scanAddress.trim()) params.set("address", scanAddress.trim());
      const res = await fetch(`/api/scan-token?${params.toString()}`);
      const data = await res.json();
      setScanResult(data);
    } catch {
      /* ignore */
    }
    setScanning(false);
  }

  async function loadSignals() {
    setLoadingSignals(true);
    try {
      const res = await fetch("/api/find/signals");
      const data = await res.json();
      setSignals(data.signals || []);
    } catch {
      /* ignore */
    }
    setLoadingSignals(false);
  }

  async function loadSmartMoney() {
    setLoadingSm(true);
    try {
      const res = await fetch("/api/find/smart-money");
      const data = await res.json();
      setSmartMoney(data);
    } catch {
      /* ignore */
    }
    setLoadingSm(false);
  }

  async function loadDiscover() {
    setLoadingDiscover(true);
    try {
      const res = await fetch("/api/discover-tokens");
      const data = await res.json();
      setDiscover(data);
    } catch {
      /* ignore */
    }
    setLoadingDiscover(false);
  }

  async function loadAlerts() {
    setLoadingAlerts(true);
    try {
      const res = await fetch("/api/crypto/alerts");
      const data = await res.json();
      setAlerts(data);
    } catch {
      /* ignore */
    }
    setLoadingAlerts(false);
  }

  async function scanWallet() {
    if (!walletInput.trim()) return;
    setWalletLoading(true);
    setWalletScan(null);
    setWalletTrackMsg(null);
    try {
      const res = await fetch(
        `/api/scan-wallet?address=${encodeURIComponent(walletInput.trim())}`
      );
      const data = await res.json();
      setWalletScan(data.error ? null : data);
    } catch {
      /* ignore */
    }
    setWalletLoading(false);
  }

  async function trackWallet() {
    if (!walletInput.trim()) return;
    setWalletTrackMsg(null);
    try {
      const res = await fetch("/api/track-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: walletInput.trim(),
          action: "register",
          alertsEnabled: true,
        }),
      });
      const data = await res.json();
      setWalletTrackMsg(data.error || data.note || "Tracking updated.");
    } catch {
      setWalletTrackMsg("Request failed.");
    }
  }

  useEffect(() => {
    if (tab === "signals" && !signals.length) loadSignals();
    if (tab === "trending" && !smartMoney) loadSmartMoney();
    if (tab === "trending" && !discover) loadDiscover();
    if (tab === "wallets" && !smartMoney) loadSmartMoney();
    if (tab === "alerts" && !alerts) loadAlerts();
  }, [tab]);

  const scoreColor = (score) =>
    score >= 70 ? "find-score-safe" : score >= 40 ? "find-score-warn" : "find-score-danger";

  const mod = scanResult?.modules;
  const sec = mod?.security;
  const ai = mod?.aiInsightEngine;
  const onChain = mod?.onChainIntelligence;
  const early = mod?.earlyDiscovery;

  return (
    <section className="find-page find-hub">
      <header className="page-header find-hub-header">
        <span className="pill">FIND — Safety Scanner &amp; Alpha Engine</span>
        <h1 className="section-title">Crypto Intelligence Hub</h1>
        <p className="muted">
          On-chain signals, narrative velocity, and risk heuristics — framed as probabilities, not promises.
          Volatility is extreme; verify everything independently.
        </p>
      </header>

      <div className="dash-tabs find-hub-tabs">
        {[
          ["hub", "Hub"],
          ["scanner", "Token Scanner"],
          ["signals", "Early Signals"],
          ["trending", "Trending & Discovery"],
          ["wallets", "Wallets & Smart Money"],
          ["alerts", "Alerts"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`dash-tab ${tab === key ? "active" : ""}`}
            onClick={() => goTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "hub" && (
        <div className="card-grid" style={{ marginTop: "1rem" }}>
          <Link to="/crypto-scanner" className="panel find-hub-card">
            <h3>Token scanner</h3>
            <p className="muted">Safety heuristics, contract context, and risk/opportunity framing.</p>
            <span className="pillar-link">Open scanner →</span>
          </Link>
          <Link to="/early-signals" className="panel find-hub-card">
            <h3>Early Signals dashboard</h3>
            <p className="muted">Aggregated feed with narrative and momentum cues (signals, not guarantees).</p>
            <span className="pillar-link">View dashboard →</span>
          </Link>
          <Link to="/find?tab=signals" className="panel find-hub-card">
            <h3>Hub: Early signals</h3>
            <p className="muted">In-app signal list tied to the same scoring model as the scanner.</p>
            <span className="pillar-link">Browse signals →</span>
          </Link>
          <Link to="/find?tab=wallets" className="panel find-hub-card">
            <h3>Smart money &amp; wallets</h3>
            <p className="muted">Track large-wallet behavior and register alerts for follow-up.</p>
            <span className="pillar-link">Track wallets →</span>
          </Link>
        </div>
      )}

      {tab === "scanner" && (
        <div className="find-scanner find-scanner-wide">
          <div className="panel glass-panel find-scan-input-panel">
            <h3>Token safety &amp; alpha snapshot</h3>
            <p className="muted">
              Contract verification, liquidity lock, ownership, mint or burn paths, estimated transfer friction,
              rug-pattern heuristics, and a synthesized opportunity score. Demo data unless wired to your indexer
              and explorer keys.
            </p>
            <div className="find-scan-form find-scan-form-stack">
              <input
                type="text"
                value={scanSymbol}
                onChange={(e) => setScanSymbol(e.target.value)}
                placeholder="Token symbol (e.g. ETH, SHIB)"
                onKeyDown={(e) => e.key === "Enter" && doScan()}
              />
              <input
                type="text"
                value={scanAddress}
                onChange={(e) => setScanAddress(e.target.value)}
                placeholder="Optional contract address (0x…)"
                onKeyDown={(e) => e.key === "Enter" && doScan()}
              />
              <button className="btn btn-primary" type="button" onClick={doScan} disabled={scanning}>
                {scanning ? "Scanning…" : "Run scan"}
              </button>
            </div>
            <p className="find-legal-note">
              Scores are model outputs, not audits. High opportunity scores can still coincide with scams.
            </p>
          </div>

          {scanResult && (
            <div className="find-scan-results-grid">
              <div className="find-scan-result panel glass-panel">
                <div className="find-scan-header">
                  <div>
                    <h3 style={{ margin: 0 }}>
                      {scanResult.name}{" "}
                      <span className="muted">({scanResult.token})</span>
                    </h3>
                    {scanResult.contractAddress && (
                      <p className="muted find-mono">{scanResult.contractAddress}</p>
                    )}
                  </div>
                  <div className="find-score-row">
                    <div className="find-score-pair">
                      <span className="muted">Risk</span>
                      <div className={`find-score-badge ${scoreColor(scanResult.score)}`}>
                        {scanResult.score}/100
                      </div>
                    </div>
                    {ai && (
                      <div className="find-score-pair">
                        <span className="muted">Opportunity</span>
                        <div className={`find-score-badge ${scoreColor(ai.opportunityScore)}`}>
                          {ai.opportunityScore}/100
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <p className="muted find-band-label">
                  Risk tier: <strong>{sec?.riskBand || "—"}</strong>
                  {ai && (
                    <>
                      {" "}
                      · Risk vs reward (heuristic): <strong>{ai.riskVsReward?.replace(/_/g, " ")}</strong>
                    </>
                  )}
                </p>
                <div className="find-scan-grid">
                  <div className="find-check-item">
                    <span className={scanResult.contractVerified ? "check-pass" : "check-fail"}>
                      {scanResult.contractVerified ? "✓" : "✗"}
                    </span>{" "}
                    Contract verified
                  </div>
                  <div className="find-check-item">
                    <span className={scanResult.liquidityLocked ? "check-pass" : "check-fail"}>
                      {scanResult.liquidityLocked ? "✓" : "✗"}
                    </span>{" "}
                    Liquidity lock
                  </div>
                  <div className="find-check-item">
                    <span className={scanResult.ownershipRenounced ? "check-pass" : "check-fail"}>
                      {scanResult.ownershipRenounced ? "✓" : "✗"}
                    </span>{" "}
                    Ownership renounced
                  </div>
                  <div className="find-check-item">
                    <span>Mint / burn:</span>{" "}
                    <strong>{sec?.mintBurnFunctions || "—"}</strong>
                  </div>
                  <div className="find-check-item">
                    <span>Hidden tax (est.):</span>{" "}
                    <strong>{sec?.hiddenTaxEstimatePercent ?? 0}%</strong>
                  </div>
                  <div className="find-check-item">
                    <span>Honeypot risk:</span>{" "}
                    <strong
                      className={
                        scanResult.honeypotRisk === "none" || scanResult.honeypotRisk === "low"
                          ? "check-pass"
                          : "check-fail"
                      }
                    >
                      {scanResult.honeypotRisk}
                    </strong>
                  </div>
                  <div className="find-check-item">
                    <span>Rug pull risk:</span>{" "}
                    <strong
                      className={
                        scanResult.rugPullRisk === "very_low" || scanResult.rugPullRisk === "low"
                          ? "check-pass"
                          : "check-fail"
                      }
                    >
                      {scanResult.rugPullRisk}
                    </strong>
                  </div>
                  <div className="find-check-item">
                    <span>Network:</span> <strong>{scanResult.network}</strong>
                  </div>
                </div>
                {scanResult.flags?.length > 0 && (
                  <div className="find-flags">
                    <strong>Flags:</strong>{" "}
                    <div className="pill-row">
                      {scanResult.flags.map((f) => (
                        <span key={f} className="tiny-pill find-flag-pill">
                          {f.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {sec && (
                <div className="panel glass-panel find-module-card">
                  <h4>Rug-pattern signals</h4>
                  <ul className="find-bullet-list">
                    {sec.rugPullSignals?.map((r) => (
                      <li key={r.type}>
                        <strong>{r.type.replace(/_/g, " ")}</strong> — {r.note}{" "}
                        <span className="muted">(p ≈ {(r.confidence * 100).toFixed(0)}%)</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {onChain && (
                <div className="panel glass-panel find-module-card">
                  <h4>On-chain intelligence (sample)</h4>
                  <p className="muted small-print">{onChain.smartMoney?.note}</p>
                  <ul className="find-bullet-list">
                    <li>
                      Smart wallets with early overlap:{" "}
                      <strong>{onChain.smartMoney?.walletsBuyingEarly}</strong>
                    </li>
                    <li>
                      Large buys / sells (24h):{" "}
                      <strong>{onChain.whaleActivity?.largeBuys24h}</strong> /{" "}
                      <strong>{onChain.whaleActivity?.largeSells24h}</strong>
                    </li>
                    <li>
                      Accumulation probability (model):{" "}
                      <strong>{onChain.whaleActivity?.suddenAccumulationProbability}</strong>
                    </li>
                    <li>
                      Coordinated-activity score:{" "}
                      <strong>{onChain.walletClustering?.coordinatedActivityScore}</strong> / 100
                    </li>
                  </ul>
                  <p className="muted small-print">{onChain.tokenFlow?.note}</p>
                </div>
              )}

              {early && (
                <div className="panel glass-panel find-module-card">
                  <h4>Early discovery signals</h4>
                  <ul className="find-bullet-list">
                    <li>
                      New contract probability:{" "}
                      <strong>{(early.newContractProbability * 100).toFixed(0)}%</strong>
                    </li>
                    <li>
                      Early liquidity score: <strong>{early.earlyLiquidityScore}</strong>/100
                    </li>
                    <li>
                      Volume momentum: <strong>{early.volumeMomentumScore}</strong>/100
                    </li>
                    <li>
                      Holder growth (simulated): <strong>{early.holderGrowthRate}</strong>
                    </li>
                  </ul>
                  <p className="muted small-print">
                    Social: Twitter velocity {early.socialSignals?.twitterX?.mentionVelocity}/100 · Reddit
                    velocity {early.socialSignals?.reddit?.postVelocity}/100
                  </p>
                  <p className="muted small-print">{early.influencerCorrelation?.note}</p>
                </div>
              )}

              {ai && (
                <div className="panel glass-panel find-module-card find-ai-card">
                  <h4>AI insight layer</h4>
                  <ul className="find-insight-list">
                    {ai.insights?.map((ins) => (
                      <li key={ins.id}>
                        {ins.text}{" "}
                        <span className="muted">(confidence {(ins.confidence * 100).toFixed(0)}%)</span>
                      </li>
                    ))}
                  </ul>
                  {scanResult.methodology && (
                    <p className="muted small-print find-mono-small">
                      {scanResult.methodology.riskScoreFormula}
                    </p>
                  )}
                </div>
              )}

              {scanResult.disclaimer && (
                <p className="find-disclaimer glass-panel">{scanResult.disclaimer}</p>
              )}
              <div style={{ marginTop: "1rem" }}>
                <Link
                  className="btn btn-primary"
                  to={
                    scanResult.contractAddress
                      ? `/token/${encodeURIComponent(scanResult.contractAddress)}`
                      : `/token/${encodeURIComponent(scanResult.token)}`
                  }
                >
                  Open full token detail
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "signals" && (
        <div className="find-signals">
          <div className="find-signals-toolbar">
            <h3 style={{ margin: 0 }}>Early Signals feed</h3>
            <button type="button" className="btn btn-outline btn-sm" onClick={loadSignals} disabled={loadingSignals}>
              Refresh
            </button>
          </div>
          {loadingSignals && <p className="muted">Loading signals…</p>}
          <div className="find-signals-grid">
            {signals.map((sig) => (
              <article key={sig.id} className="find-signal-card panel glass-panel">
                <div className="find-signal-header">
                  <span className="badge">{sig.type.replace(/_/g, " ")}</span>
                  <span className="find-confidence">{sig.confidence}% signal</span>
                </div>
                <h4>{sig.title}</h4>
                <p className="muted">{sig.description}</p>
                <div className="pill-row">
                  {sig.tokens.map((t) => (
                    <span key={t} className="tiny-pill">
                      {t}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {tab === "trending" && (
        <div className="find-trending">
          {loadingDiscover && <p className="muted">Loading discovery…</p>}
          {discover?.tokens && (
            <>
              <h3>Alpha discovery (new &amp; early liquidity)</h3>
              <div className="find-discover-grid">
                {discover.tokens.map((t) => (
                  <Link
                    key={t.id}
                    to={`/token/${encodeURIComponent(t.symbol)}`}
                    className="panel glass-panel find-discover-card"
                    style={{ textDecoration: "none", color: "inherit", display: "block" }}
                  >
                    <div className="find-discover-head">
                      <strong>{t.symbol}</strong>
                      <span className="badge">{t.network}</span>
                    </div>
                    <p className="muted" style={{ margin: "0.35rem 0" }}>
                      {t.name}
                    </p>
                    <p className="muted small-print find-mono">{t.contractAddress}</p>
                    <ul className="find-discover-stats">
                      <li>Liquidity ~ ${(t.liquidityUsd / 1e3).toFixed(0)}k</li>
                      <li>Holders ~ {t.holderCount}</li>
                      <li>Deployed ~ {t.deployedHoursAgo}h ago</li>
                      <li>Signal strength {t.signalStrength}/100</li>
                    </ul>
                    <div className="pill-row">
                      {t.narrativeKeywords.map((k) => (
                        <span key={k} className="tiny-pill">
                          {k}
                        </span>
                      ))}
                    </div>
                    <p className="muted small-print">{t.dataSourceNote}</p>
                    <p className="muted small-print" style={{ marginTop: "0.5rem", color: "var(--brand-cyan)" }}>
                      Full detail page →
                    </p>
                  </Link>
                ))}
              </div>
            </>
          )}

          {loadingSm && <p className="muted">Loading whale trends…</p>}
          {smartMoney && (
            <>
              <h3 style={{ marginTop: "1.5rem" }}>Whale flow trends (sample)</h3>
              <div className="find-trends-grid">
                {smartMoney.trends.map((t) => (
                  <div key={t.token} className="find-trend-card panel glass-panel">
                    <strong>{t.token}</strong>
                    <div className={t.direction === "accumulation" ? "find-trend-up" : "find-trend-down"}>
                      {t.direction === "accumulation" ? "↑" : "↓"} ${(t.netFlow / 1e6).toFixed(1)}M
                    </div>
                    <span className="muted">
                      {t.whaleCount} wallets · {t.direction}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {tab === "wallets" && (
        <div className="find-wallets-tab">
          <div className="panel glass-panel find-wallet-scan-panel">
            <h3>Wallet risk scanner</h3>
            <p className="muted">
              Scam-adjacency probabilities, pattern flags, and cluster estimates. Paste any EVM address; try{" "}
              <code className="find-inline-code">0x28c6c06298d538db24363dfa3a7bee9368290a4f</code> or{" "}
              <code className="find-inline-code">0xdead000000000000000000000000000000000001</code> for preset demos.
            </p>
            <div className="find-scan-form">
              <input
                type="text"
                value={walletInput}
                onChange={(e) => setWalletInput(e.target.value)}
                placeholder="0x wallet address"
                onKeyDown={(e) => e.key === "Enter" && scanWallet()}
              />
              <button type="button" className="btn btn-primary" onClick={scanWallet} disabled={walletLoading}>
                {walletLoading ? "Scanning…" : "Scan wallet"}
              </button>
              <button type="button" className="btn btn-outline" onClick={trackWallet}>
                Track (demo)
              </button>
            </div>
            {walletTrackMsg && <p className="muted small-print">{walletTrackMsg}</p>}
            {walletScan && (
              <div className="find-wallet-scan-result">
                <div className="find-scan-header">
                  <div>
                    <strong>{walletScan.label}</strong>
                    <p className="muted find-mono">{walletScan.address}</p>
                  </div>
                  <div className={`find-score-badge ${scoreColor(100 - walletScan.walletRiskScore)}`}>
                    danger {walletScan.walletRiskScore}/100
                  </div>
                </div>
                <p className="muted">
                  Safety tier: <strong>{walletScan.safetyTier}</strong> · Scam-link probability ~{" "}
                  {(walletScan.scamLinkedProbability * 100).toFixed(0)}%
                </p>
                <ul className="find-bullet-list">
                  {walletScan.suspiciousPatterns?.map((p) => (
                    <li key={p.type}>
                      {p.type.replace(/_/g, " ")} — p ≈ {(p.probability * 100).toFixed(0)}%
                    </li>
                  ))}
                </ul>
                <p className="muted small-print">
                  Cluster {walletScan.cluster?.id} · ~{walletScan.cluster?.relatedWalletsEstimate} related wallets
                  (estimate)
                </p>
                {walletScan.disclaimer && <p className="find-disclaimer inline">{walletScan.disclaimer}</p>}
              </div>
            )}
          </div>

          {loadingSm && <p className="muted">Loading smart money panel…</p>}
          {smartMoney && (
            <>
              <div className="find-smart-toolbar">
                <h3 style={{ margin: 0 }}>Smart money &amp; whale panel</h3>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setSmDisclosure((v) => !v)}>
                  {smDisclosure ? "Hide" : "Show"} data disclaimer
                </button>
              </div>
              {smDisclosure && smartMoney.disclaimer && (
                <p className="find-disclaimer glass-panel">{smartMoney.disclaimer}</p>
              )}
              <div className="find-wallets-list">
                {smartMoney.wallets.map((w) => (
                  <div key={w.address} className="find-wallet-card panel glass-panel">
                    <div className="find-wallet-header">
                      <strong>{w.label}</strong>
                      <span className="muted">{w.address}</span>
                    </div>
                    <div className="find-wallet-stats">
                      <span>Win rate (sample): {w.winRate}%</span>
                      <span>Avg return (sample): {w.avgReturn}%</span>
                      <span>Not predictive — labels illustrative</span>
                    </div>
                    <div className="find-wallet-moves">
                      {w.recentMoves.map((m, i) => (
                        <span key={i} className={`find-move ${m.action === "buy" ? "move-buy" : "move-sell"}`}>
                          {m.action.toUpperCase()} {m.token} · ${(m.amountUsd / 1e6).toFixed(1)}M
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {tab === "alerts" && (
        <div className="find-alerts-tab">
          {loadingAlerts && <p className="muted">Loading alerts…</p>}
          {alerts?.alerts && (
            <>
              <h3>Alert stream (sample)</h3>
              <div className="find-alerts-grid">
                {alerts.alerts.map((a) => (
                  <article key={a.id} className={`panel glass-panel find-alert-card sev-${a.severity}`}>
                    <div className="find-alert-head">
                      <span className="badge">{a.type.replace(/_/g, " ")}</span>
                      <span className="muted small-print">{new Date(a.at).toLocaleString()}</span>
                    </div>
                    <h4>{a.title}</h4>
                    <p className="muted small-print">{a.probabilityNote}</p>
                  </article>
                ))}
              </div>
              {alerts.disclaimer && <p className="find-disclaimer glass-panel">{alerts.disclaimer}</p>}
            </>
          )}
        </div>
      )}
    </section>
  );
}

function AiAgentsPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/build/agents").then((r) => r.json()).then((d) => { setAgents(d.agents || []); setLoading(false); });
  }, []);

  return (
    <section>
      <header className="page-header">
        <span className="pill">BUILD — AI Agent Operator</span>
        <h1 className="section-title">AI Agents</h1>
        <p className="muted">
          Autonomous agents that run research loops, execute workflows, automate operations, and replace fragmented SaaS tools.
        </p>
      </header>

      {loading && <p className="muted">Loading agents...</p>}

      <div className="agents-grid">
        {agents.map((agent) => (
          <article key={agent.id} className="agent-card panel">
            <div className="agent-card-header">
              <span className={`agent-status ${agent.status === "active" ? "status-active" : ""}`}>{agent.status}</span>
              <span className="badge">{agent.category}</span>
            </div>
            <h3>{agent.name}</h3>
            <p className="muted">{agent.description}</p>
            <div className="agent-stats">
              <span className="agent-stat">{agent.tasksCompleted.toLocaleString()} tasks completed</span>
            </div>
            <div className="pill-row">
              {agent.capabilities.map((cap) => (<span key={cap} className="dapp-feature-tag">{cap}</span>))}
            </div>
          </article>
        ))}
      </div>

      <section className="panel" style={{ marginTop: "1.5rem" }}>
        <h3>Workflow Operator System</h3>
        <p className="muted">The Agent Operator designs workflows, connects tools and data, translates problems into execution, and monitors performance continuously.</p>
        <div className="card-grid" style={{ marginTop: "0.8rem" }}>
          <div className="panel"><h4>Design</h4><p className="muted">Visual workflow builder for complex multi-step automations.</p></div>
          <div className="panel"><h4>Connect</h4><p className="muted">Integrates APIs, data sources, and external tools seamlessly.</p></div>
          <div className="panel"><h4>Execute</h4><p className="muted">Runs workflows autonomously with error handling and retries.</p></div>
          <div className="panel"><h4>Optimize</h4><p className="muted">Monitors performance metrics and improves over time.</p></div>
        </div>
      </section>
    </section>
  );
}

function EarnPage() {
  return (
    <section>
      <header className="page-header">
        <span className="pill">EARN — Revenue Streams</span>
        <h1 className="section-title">Earn With CCWEB</h1>
        <p className="muted">
          Multiple revenue streams powered by real utility — no platform token required.
          Earn through skills, referrals, and participation.
        </p>
      </header>

      <div className="card-grid">
        <article className="panel">
          <h3>🎓 Affiliate Program</h3>
          <p className="muted">30% recurring commissions on all referred subscriptions. Share your unique link and earn passive income.</p>
          <ul className="list">
            <li>Recurring monthly commissions</li>
            <li>Real-time tracking dashboard</li>
            <li>Payout in USDC or fiat</li>
          </ul>
          <Link to="/signup" className="btn btn-primary" style={{ marginTop: "0.6rem" }}>Become an Affiliate</Link>
        </article>
        <article className="panel">
          <h3>📡 Streaming Revenue</h3>
          <p className="muted">Create AI-powered live learning sessions and earn organic revenue share based on attendance and engagement.</p>
          <ul className="list">
            <li>63% creator revenue share</li>
            <li>Watch-time weighted distribution</li>
            <li>Payout via USDC settlement</li>
          </ul>
          <Link to="/ai-streaming" className="btn btn-outline" style={{ marginTop: "0.6rem" }}>Start Streaming</Link>
        </article>
        <article className="panel">
          <h3>🏗️ Skill-Based Income</h3>
          <p className="muted">Use the Business Engine to match your skills with real client needs. Get paid for completed work through secure escrow.</p>
          <ul className="list">
            <li>AI-matched opportunities</li>
            <li>Secure escrow payments</li>
            <li>Performance-based bonuses</li>
          </ul>
          <Link to="/growth-hub" className="btn btn-primary" style={{ marginTop: "0.6rem" }}>
            Open Growth Hub
          </Link>
        </article>
        <article className="panel">
          <h3>🤖 Agent Rewards</h3>
          <p className="muted">Deploy AI agents that generate value, optimize workflows, and earn based on measurable outcomes.</p>
          <ul className="list">
            <li>Revenue from agent operations</li>
            <li>Performance-linked payouts</li>
            <li>Scalable passive income</li>
          </ul>
          <Link to="/ai-agents" className="btn btn-outline" style={{ marginTop: "0.6rem" }}>Deploy Agents</Link>
        </article>
      </div>

      <section className="panel" style={{ marginTop: "1.5rem" }}>
        <h3>No Platform Token Required</h3>
        <p className="muted">
          All earnings are paid in external tokens (USDC, ETH) or fiat. CCWEB focuses on real utility and
          measurable value — not token speculation. You earn by contributing real skills, content, and referrals.
        </p>
      </section>
    </section>
  );
}

function DappDashboardPage() {
  const [stats, setStats] = useState(null);
  const [deployments, setDeployments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [expandedDeploy, setExpandedDeploy] = useState(null);

  async function loadAll() {
    setLoading(true);
    try {
      const [statsRes, deploymentsRes, txRes] = await Promise.all([
        fetch("/api/dapp/dashboard").then((r) => r.json()),
        fetch("/api/dapp/deployments").then((r) => r.json()),
        fetch("/api/dapp/transactions").then((r) => r.json()),
      ]);
      setStats(statsRes);
      setDeployments(deploymentsRes.deployments || []);
      setTransactions(txRes.transactions || []);
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  const statusColor = (status) => {
    if (status === "deployed" || status === "confirmed") return "dapp-status-green";
    if (status === "failed") return "dapp-status-red";
    return "dapp-status-yellow";
  };

  return (
    <section className="dapp-dashboard">
      <header className="page-header">
        <span className="pill">DApp Dashboard</span>
        <h1 className="section-title">Deployment Dashboard</h1>
        <p className="muted">View deployed DApps, transaction history, and track deployment status.</p>
        <div style={{ marginTop: "0.8rem", display: "flex", gap: "0.6rem" }}>
          <Link to="/dapp-builder" className="btn btn-primary btn-sm">Deploy New DApp</Link>
          <button className="btn btn-outline btn-sm" onClick={loadAll}>Refresh</button>
        </div>
      </header>

      <div className="dash-tabs">
        {["overview", "deployments", "transactions"].map((t) => (
          <button key={t} className={`dash-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t === "overview" ? "Overview" : t === "deployments" ? "Deployed DApps" : "Transactions"}
          </button>
        ))}
      </div>

      {loading && <p className="muted" style={{ textAlign: "center", padding: "2rem" }}>Loading dashboard...</p>}

      {!loading && tab === "overview" && stats && (
        <>
          <div className="dash-kpi-grid">
            <div className="dash-kpi-card">
              <div className="dash-kpi-value">{stats.overview.totalDeployments}</div>
              <div className="muted">Total Deployments</div>
            </div>
            <div className="dash-kpi-card">
              <div className="dash-kpi-value dash-kpi-green">{stats.overview.activeDeployments}</div>
              <div className="muted">Active / Deployed</div>
            </div>
            <div className="dash-kpi-card">
              <div className="dash-kpi-value dash-kpi-red">{stats.overview.failedDeployments}</div>
              <div className="muted">Failed</div>
            </div>
            <div className="dash-kpi-card">
              <div className="dash-kpi-value">${stats.overview.totalSpentUsd}</div>
              <div className="muted">Total Spent</div>
            </div>
            <div className="dash-kpi-card">
              <div className="dash-kpi-value">{stats.overview.totalTransactions}</div>
              <div className="muted">Total Transactions</div>
            </div>
          </div>

          {Object.keys(stats.networkBreakdown).length > 0 && (
            <div className="dash-section">
              <h3>Network Distribution</h3>
              <div className="dash-bar-grid">
                {Object.entries(stats.networkBreakdown).map(([net, count]) => (
                  <div key={net} className="dash-bar-item">
                    <div className="dash-bar-label"><span className="tiny-pill">{net}</span><span>{count} deployment{count !== 1 ? "s" : ""}</span></div>
                    <div className="dash-bar-track"><div className="dash-bar-fill" style={{ width: `${Math.min(100, (count / Math.max(1, stats.overview.totalDeployments)) * 100)}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {Object.keys(stats.tokenSpending).length > 0 && (
            <div className="dash-section">
              <h3>Token Spending</h3>
              <div className="dash-token-spend-grid">
                {Object.entries(stats.tokenSpending).map(([token, info]) => (
                  <div key={token} className="dash-token-spend-card panel">
                    <strong>{token}</strong>
                    <div style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0.3rem 0" }}>{info.totalAmount} {token}</div>
                    <div className="muted">${info.totalUsd} USD · {info.count} tx{info.count !== 1 ? "s" : ""}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.recentDeployments.length > 0 && (
            <div className="dash-section">
              <h3>Recent Deployments</h3>
              <div className="dapp-deploy-list">
                {stats.recentDeployments.map((dep) => (
                  <div key={dep.id} className="dapp-deploy-item">
                    <div className="dapp-deploy-info">
                      <strong>{dep.contractName}</strong>
                      <span className="tiny-pill">{dep.network}</span>
                      <span className={`dapp-deploy-status ${statusColor(dep.status)}`}>{dep.status}</span>
                    </div>
                    <div className="muted" style={{ fontSize: "0.83rem" }}>
                      {dep.contractAddress.slice(0, 20)}... · {dep.payment.amountToken} {dep.payment.token} · {dep.templateName}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!loading && tab === "deployments" && (
        <div className="dash-section">
          <h3>All Deployed DApps ({deployments.length})</h3>
          {deployments.length === 0 ? (
            <div className="panel" style={{ textAlign: "center", padding: "2rem" }}>
              <p className="muted">No deployments yet.</p>
              <Link to="/dapp-builder" className="btn btn-primary">Deploy Your First DApp</Link>
            </div>
          ) : (
            <div className="dash-deploy-table">
              {deployments.map((dep) => (
                <div key={dep.id} className={`dash-deploy-row ${expandedDeploy === dep.id ? "expanded" : ""}`}>
                  <div className="dash-deploy-row-main" onClick={() => setExpandedDeploy(expandedDeploy === dep.id ? null : dep.id)}>
                    <div className="dash-deploy-row-left">
                      <strong>{dep.contractName}</strong>
                      <span className="badge">{dep.category}</span>
                      <span className="tiny-pill">{dep.network}</span>
                      <span className={`dapp-deploy-status ${statusColor(dep.status)}`}>{dep.status}</span>
                    </div>
                    <div className="dash-deploy-row-right muted">
                      {dep.payment.amountToken} {dep.payment.token} · {new Date(dep.deployedAt).toLocaleDateString()}
                    </div>
                  </div>
                  {expandedDeploy === dep.id && (
                    <div className="dash-deploy-expanded">
                      <div className="dapp-detail-row"><span className="muted">Deployment ID</span><code>{dep.id}</code></div>
                      <div className="dapp-detail-row"><span className="muted">Contract</span><code>{dep.contractAddress}</code></div>
                      <div className="dapp-detail-row"><span className="muted">Symbol</span><span>{dep.contractSymbol}</span></div>
                      <div className="dapp-detail-row"><span className="muted">Template</span><span>{dep.templateName}</span></div>
                      <div className="dapp-detail-row"><span className="muted">Payment</span><span>{dep.payment.amountToken} {dep.payment.token} (${dep.payment.amountUsd})</span></div>
                      <div className="dapp-detail-row"><span className="muted">Tx Hash</span><code style={{ fontSize: "0.73rem" }}>{dep.payment.txHash.slice(0, 30)}...</code></div>
                      <div className="dapp-detail-row"><span className="muted">Deployed</span><span>{new Date(dep.deployedAt).toLocaleString()}</span></div>
                      <div className="dapp-detail-row"><span className="muted">Features</span><div className="pill-row">{dep.features.map((f) => (<span key={f} className="dapp-feature-tag">{f}</span>))}</div></div>
                      <div style={{ marginTop: "0.6rem" }}>
                        <a href={dep.explorerUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">View on Explorer</a>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && tab === "transactions" && (
        <div className="dash-section">
          <h3>Transaction History ({transactions.length})</h3>
          {transactions.length === 0 ? (
            <div className="panel" style={{ textAlign: "center", padding: "2rem" }}>
              <p className="muted">No transactions recorded yet.</p>
            </div>
          ) : (
            <div className="dash-tx-list">
              {transactions.map((tx) => (
                <div key={tx.id} className="dash-tx-item">
                  <div className="dash-tx-header">
                    <span className={`dash-tx-type ${tx.type === "payment" ? "type-payment" : tx.type === "deployment" ? "type-deploy" : "type-retry"}`}>{tx.type}</span>
                    <span className={`dapp-deploy-status ${statusColor(tx.status)}`}>{tx.status}</span>
                    <span className="muted" style={{ fontSize: "0.8rem", marginLeft: "auto" }}>{new Date(tx.createdAt).toLocaleString()}</span>
                  </div>
                  <p style={{ margin: "0.3rem 0 0", fontSize: "0.88rem" }}>{tx.description}</p>
                  <div className="muted" style={{ fontSize: "0.8rem", marginTop: "0.2rem" }}>
                    {tx.txHash && <span>Tx: {tx.txHash.slice(0, 18)}... · </span>}
                    {tx.amountToken && <span>{tx.amountToken} {tx.token} · </span>}
                    {tx.network && <span>{tx.network}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default App;
