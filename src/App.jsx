import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  Boxes,
  BrainCircuit,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clapperboard,
  Coins,
  Command,
  Flame,
  Globe2,
  GraduationCap,
  LayoutDashboard,
  Lock,
  Menu,
  Moon,
  Play,
  Radio,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";
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
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { AutomationHubPage } from "./pages/AutomationHubPage.jsx";
import { BillingDashboardPage } from "./pages/BillingDashboardPage.jsx";
import { LeadGenPage } from "./pages/LeadGenPage.jsx";
import { PlatformHubPage } from "./pages/PlatformHubPage.jsx";

const navItems = [
  { label: "Platform", to: "/platform" },
  { label: "Home", to: "/" },
  { label: "Automation", to: "/automation" },
  { label: "Lead Gen", to: "/lead-gen" },
  { label: "Billing", to: "/billing" },
  { label: "Courses", to: "/courses" },
  { label: "AI Tutor", to: "/ai-tutor" },
  { label: "Streaming", to: "/ai-streaming" },
  { label: "Pricing", to: "/pricing" },
  { label: "Tokens", to: "/tokens" },
  { label: "Community", to: "/community" },
  { label: "Blog", to: "/blog" },
];

const courses = [
  {
    id: 1,
    category: "Crypto",
    title: "Blockchain Fundamentals",
    level: "Beginner",
    duration: "6h",
    students: "12.4K",
    rating: "4.9",
    gradient: "from-cyan-400 to-blue-500",
  },
  {
    id: 2,
    category: "Web3",
    title: "Smart Contract Development",
    level: "Intermediate",
    duration: "10h",
    students: "8.2K",
    rating: "4.8",
    gradient: "from-violet-400 to-fuchsia-500",
  },
  {
    id: 3,
    category: "DeFi",
    title: "DeFi Masterclass",
    level: "Advanced",
    duration: "12h",
    students: "5.1K",
    rating: "4.9",
    gradient: "from-emerald-400 to-cyan-500",
  },
  {
    id: 4,
    category: "AI",
    title: "AI and Machine Learning Basics",
    level: "Beginner",
    duration: "8h",
    students: "15.6K",
    rating: "4.7",
    gradient: "from-amber-300 to-orange-500",
  },
];

const streamBlueprints = [
  "Adaptive curriculum planning",
  "Live AI host with room context",
  "Organic attendance weighting",
  "Creator payout forecasting",
];

const pricingPlans = [
  {
    name: "Starter",
    price: "$0",
    description: "Explore the academy and join community streams.",
    features: ["3 courses", "Community access", "Basic AI tutor"],
  },
  {
    name: "Pro",
    price: "$10",
    description: "Full CCWEB learning, streaming, and token rewards.",
    featured: true,
    features: ["All courses", "Unlimited AI tutor", "Earn tokens", "Certificates"],
  },
  {
    name: "Studio",
    price: "$35",
    description: "Launch team cohorts and AI-hosted workshops.",
    features: ["Team rooms", "Revenue analytics", "API access"],
  },
];

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="platform" element={<PlatformHubPage />} />
          <Route path="automation" element={<AutomationHubPage />} />
          <Route path="lead-gen" element={<LeadGenPage />} />
          <Route path="billing" element={<BillingDashboardPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="courses/:id" element={<CourseNotFoundPage />} />
          <Route path="ai-tutor" element={<AiTutorPage />} />
          <Route path="ai-streaming" element={<AiStreamingPage />} />
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
  const [theme, setTheme] = useState("dark");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  return (
    <div className="min-h-screen overflow-hidden bg-slate-50 text-slate-950 transition-colors duration-500 dark:bg-gradient-to-b dark:from-[#020617] dark:via-[#0a1628] dark:to-[#030712] dark:text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-cyan-500/25 via-blue-600/15 to-transparent blur-3xl dark:from-blue-500/20 dark:via-cyan-400/10" />
        <div className="absolute right-[-10rem] top-24 h-[30rem] w-[30rem] rounded-full bg-gradient-to-bl from-indigo-600/25 to-transparent blur-3xl dark:from-indigo-500/15" />
        <div className="absolute bottom-[-14rem] left-[-10rem] h-[32rem] w-[32rem] rounded-full bg-gradient-to-tr from-sky-500/20 to-transparent blur-3xl dark:from-blue-900/30" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,.08)_1px,transparent_1px)] bg-[size:72px_72px] opacity-40 dark:bg-[linear-gradient(rgba(148,163,184,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.08)_1px,transparent_1px)]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-slate-900/10 bg-white/75 backdrop-blur-2xl dark:border-white/10 dark:bg-[#030711]/75">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="group flex items-center gap-3" onClick={() => setMenuOpen(false)}>
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-950 text-cyan-300 shadow-lg shadow-cyan-500/20 transition-transform group-hover:scale-105 dark:bg-white dark:text-slate-950">
              <Command className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-black tracking-[0.24em]">CCWEB</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">Unified AI platform</span>
            </span>
          </Link>

          <nav className="hidden items-center rounded-full border border-slate-900/10 bg-white/70 p-1 shadow-sm dark:border-white/10 dark:bg-white/5 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-slate-950 text-white shadow-lg shadow-slate-950/10 dark:bg-white dark:text-slate-950"
                      : "text-slate-600 hover:bg-slate-900/5 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full border border-slate-900/10 bg-white/70 text-slate-700 transition hover:scale-105 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
              onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
              aria-label="Toggle color mode"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link to="/login" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white sm:inline-flex">
              Login
            </Link>
            <Link to="/signup" className="hidden rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white shadow-xl shadow-slate-950/15 transition hover:-translate-y-0.5 hover:shadow-cyan-500/20 dark:bg-white dark:text-slate-950 sm:inline-flex">
              Get started
            </Link>
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full border border-slate-900/10 bg-white/70 dark:border-white/10 dark:bg-white/5 lg:hidden"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Open navigation"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOpen ? (
          <motion.nav
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mb-4 grid gap-2 rounded-3xl border border-slate-900/10 bg-white/95 p-3 shadow-2xl dark:border-white/10 dark:bg-slate-950/95 lg:hidden"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `rounded-2xl px-4 py-3 text-sm font-semibold ${
                    isActive
                      ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                      : "text-slate-600 dark:text-slate-300"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </motion.nav>
        ) : null}
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <Outlet />
      </main>

      <footer className="mx-auto w-full max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-900/10 bg-white/60 p-5 text-sm text-slate-500 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} CCWEB — learn, stream, automate, analyze.</span>
          <div className="flex gap-4">
            <Link to="/contact" className="hover:text-slate-950 dark:hover:text-white">Contact</Link>
            <Link to="/dashboard" className="hover:text-slate-950 dark:hover:text-white">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HomePage() {
  return (
    <div className="space-y-10">
      <section className="grid items-center gap-8 pt-6 lg:grid-cols-[1.05fr_.95fr] lg:pt-10">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Pill icon={Sparkles}>AI native academy and streaming platform</Pill>
          <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight text-slate-950 dark:text-white sm:text-6xl lg:text-7xl">
            Learn, stream, and earn with an AI-powered Web3 campus.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            CCWEB combines adaptive crypto and AI courses, live AI hosts, revenue sharing, and learner communities in one modern operating system.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink to="/platform" variant="primary">
              Explore the platform <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink to="/ai-streaming" variant="secondary">
              Launch stream studio
            </ButtonLink>
            <ButtonLink to="/courses" variant="secondary">
              Browse learning paths
            </ButtonLink>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="relative"
        >
          <div className="absolute inset-4 rounded-[2.5rem] bg-gradient-to-tr from-cyan-400/30 via-violet-500/30 to-emerald-400/30 blur-3xl" />
          <GlassCard className="relative overflow-hidden p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Live cohort</p>
                <h2 className="mt-2 text-2xl font-black">AI Web3 Fundamentals</h2>
              </div>
              <span className="flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-500">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Live
              </span>
            </div>
            <div className="mt-6 aspect-video rounded-[2rem] border border-white/20 bg-slate-950 p-4 shadow-2xl dark:bg-black">
              <div className="flex h-full flex-col justify-between rounded-[1.4rem] bg-[radial-gradient(circle_at_35%_20%,rgba(34,211,238,.35),transparent_30%),radial-gradient(circle_at_80%_30%,rgba(168,85,247,.3),transparent_30%),linear-gradient(135deg,#07111f,#111827)] p-5 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs backdrop-blur">
                    <Radio className="h-3.5 w-3.5 text-cyan-300" /> 1,824 watching
                  </div>
                  <Bot className="h-6 w-6 text-cyan-200" />
                </div>
                <div>
                  <p className="text-sm text-cyan-100">Claude-CCWEB-Host</p>
                  <h3 className="mt-2 text-3xl font-black">Token economics, explained live.</h3>
                </div>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <MiniMetric label="Gross" value="$9.3K" />
              <MiniMetric label="Creator pool" value="$5.9K" />
              <MiniMetric label="Completion" value="92%" />
            </div>
          </GlassCard>
        </motion.div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={Users} label="Students" value="50K+" />
        <MetricCard icon={BookOpen} label="Course modules" value="200+" />
        <MetricCard icon={CircleDollarSign} label="Creator earnings" value="$2M+" />
        <MetricCard icon={Activity} label="Platform uptime" value="99.9%" />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {[
          ["Live AI classrooms", "Spin up AI-hosted rooms with curriculum memory, agenda timing, and attendance logic.", Radio],
          ["Web3 revenue engine", "Forecast platform share, creator pools, and organic participation rewards before launch.", Coins],
          ["Learner command center", "Unify courses, tutoring, live streams, token rewards, and community into one experience.", LayoutDashboard],
        ].map(([title, body, Icon]) => (
          <GlassCard key={title} className="group p-6 transition duration-300 hover:-translate-y-1">
            <Icon className="h-7 w-7 text-cyan-500" />
            <h3 className="mt-5 text-xl font-black">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{body}</p>
          </GlassCard>
        ))}
      </section>
    </div>
  );
}

function CoursesPage() {
  return (
    <PageShell eyebrow="Course library" title="Structured learning paths for AI, crypto, and Web3." description="Clean tracks, measurable milestones, and cohort-ready lessons built for the streaming studio.">
      <div className="mb-6 flex flex-wrap gap-2">
        {["All", "Crypto", "AI", "Trading", "Web3"].map((tag) => (
          <span key={tag} className="rounded-full border border-slate-900/10 bg-white/60 px-4 py-2 text-sm font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            {tag}
          </span>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {courses.map((course) => (
          <GlassCard key={course.id} className="group overflow-hidden p-5">
            <div className={`h-2 rounded-full bg-gradient-to-r ${course.gradient}`} />
            <div className="mt-5 flex items-center justify-between">
              <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white dark:bg-white dark:text-slate-950">{course.category}</span>
              <span className="flex items-center gap-1 text-sm text-amber-500"><Star className="h-4 w-4 fill-current" /> {course.rating}</span>
            </div>
            <h3 className="mt-5 text-xl font-black">{course.title}</h3>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{course.level} · {course.duration} · {course.students} learners</p>
            <Link to={`/courses/${course.id}`} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-cyan-500">
              View syllabus <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
          </GlassCard>
        ))}
      </div>
    </PageShell>
  );
}

function CourseNotFoundPage() {
  const { id } = useParams();
  return (
    <PageShell eyebrow="Course details" title="This syllabus is still being prepared." description={`Course ${id ? `#${id}` : ""} is not available yet.`}>
      <ButtonLink to="/courses" variant="primary">Back to courses</ButtonLink>
    </PageShell>
  );
}

function AiTutorPage() {
  return (
    <PageShell eyebrow="AI Tutor" title="A personal learning copilot for every student." description="Use guided prompts, quizzes, and contextual explainers across AI, crypto, blockchain, and business systems.">
      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard className="p-6">
          <BrainCircuit className="h-8 w-8 text-violet-500" />
          <h3 className="mt-5 text-xl font-black">Prompt console</h3>
          <div className="mt-5 space-y-3">
            {["Explain proof of stake in simple terms", "Generate a smart contract quiz", "Compare DeFi lending risks"].map((prompt) => (
              <div key={prompt} className="rounded-2xl border border-slate-900/10 bg-slate-100/70 p-4 text-sm dark:border-white/10 dark:bg-white/5">{prompt}</div>
            ))}
          </div>
        </GlassCard>
        <GlassCard className="p-6">
          <Sparkles className="h-8 w-8 text-cyan-500" />
          <h3 className="mt-5 text-xl font-black">Tutor modes</h3>
          <p className="mt-3 text-slate-600 dark:text-slate-300">Switch between chat, quiz generation, curriculum review, and live stream support.</p>
          <ButtonLink to="/login" variant="secondary" className="mt-6">Sign in to save history</ButtonLink>
        </GlassCard>
      </div>
    </PageShell>
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

  const projectedGross = useMemo(
    () => Number(payload.expectedAudience || 0) * Number(payload.expectedArppuUsd || 0),
    [payload.expectedAudience, payload.expectedArppuUsd],
  );
  const platformRevenue = useMemo(
    () => projectedGross * (Number(payload.platformSharePercent || 0) / 100),
    [payload.platformSharePercent, projectedGross],
  );
  const selectedRoom = getSelectedRoom();

  function updateField(field, value) {
    setPayload((prev) => ({ ...prev, [field]: value }));
  }

  function curriculumToTracks(curriculum) {
    const normalized = curriculum.toLowerCase();
    if (normalized === "ai") return ["AI Foundations", "Machine Learning", "Digital Business Systems"];
    if (normalized === "blockchain") return ["Blockchain Fundamentals", "Smart Contracts", "Web3 Product Development"];
    if (normalized === "web3") return ["Web3 Product Development", "Smart Contracts", "Digital Business Systems"];
    if (normalized === "crypto") return ["Crypto Markets", "Blockchain Fundamentals", "Financial Literacy & Human Development"];
    if (normalized === "business") return ["Digital Business Systems", "Financial Literacy & Human Development", "AI Foundations"];
    return ["Financial Literacy & Human Development", "Digital Business Systems", "AI Foundations"];
  }

  function autoDurationForCourseLoad(load) {
    return { foundation: 60, standard: 90, advanced: 120, intensive: 150 }[load] || 180;
  }

  function autoIntervalForCourseLoad(load) {
    return { foundation: 12, standard: 15, advanced: 20, intensive: 25 }[load] || 30;
  }

  function autoAudienceByCapacity(capacity) {
    const safeCapacity = Math.max(20, Number(capacity) || 20);
    return Math.round(safeCapacity * 0.72);
  }

  function autoArppuByCurriculum(curriculum) {
    return { ai: 5.2, blockchain: 5.1, web3: 4.9, crypto: 5.4, business: 4.6 }[curriculum.toLowerCase()] || 4.5;
  }

  async function loadRooms() {
    try {
      const res = await fetch("/api/streaming/rooms");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load rooms.");
      setRooms(data.rooms || []);
      if (!selectedRoomId && data.rooms?.length) setSelectedRoomId(data.rooms[0].id);
    } catch (err) {
      setJoinError(err.message);
    }
  }

  useEffect(() => {
    loadRooms();
  }, []);

  function getSelectedRoom() {
    if (response?.room?.id && response.room.id === selectedRoomId) return response.room;
    return rooms.find((room) => room.id === selectedRoomId) || response?.room || null;
  }

  async function createRoom() {
    setLoading(true);
    setError("");
    try {
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
            { title: `${payload.curriculum} foundations`, durationMinutes: Math.round(Number(payload.expectedSessionMinutes) * 0.45) },
            { title: `${payload.curriculum} practical workshop`, durationMinutes: Math.round(Number(payload.expectedSessionMinutes) * 0.35) },
            { title: "Live Q&A and recap", durationMinutes: Math.round(Number(payload.expectedSessionMinutes) * 0.2) },
          ],
        }),
      });
      const roomData = await res.json();
      if (!res.ok) throw new Error(roomData.error || "Could not create room.");

      const payoutRes = await fetch("/api/streaming/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: roomData.id,
          periodLabel: "Projected first live cycle",
          grossRevenueUsd: projectedGross,
          platformRevenueSharePercent: Number(payload.platformSharePercent),
        }),
      });
      const payoutData = await payoutRes.json();
      if (!payoutRes.ok) throw new Error(payoutData.error || "Could not compute payout.");

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
        if (data.activeSession) setActiveSessionLock(data.activeSession);
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
      if (!res.ok) throw new Error(data.error || "Could not leave this stream.");
      setJoinState(data);
      if (selectedRoomId && activeSessionLock?.roomId === selectedRoomId) setActiveSessionLock(null);
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
        body: JSON.stringify({ finishedBy: "ccweb-stream-studio" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not finish this stream.");
      await loadRooms();
      if (response?.room?.id === selectedRoomId) setResponse((prev) => (prev ? { ...prev, room: data.room } : prev));
      setJoinState((prev) => (prev ? { ...prev, metrics: data.room.metrics, roomId: data.room.id } : prev));
      if (activeSessionLock?.roomId === selectedRoomId) setActiveSessionLock(null);
    } catch (err) {
      setJoinError(err.message);
    } finally {
      setJoinLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <GlassCard className="relative overflow-hidden p-6 sm:p-8">
          <div className="absolute right-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="relative">
            <Pill icon={Radio}>AI streaming command center</Pill>
            <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Launch live AI classrooms with creator-grade revenue intelligence.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
              Configure the AI host, curriculum depth, learner capacity, organic participation, and payout model from one responsive studio.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <MiniMetric label="Projected gross" value={money(projectedGross)} />
              <MiniMetric label="CCWEB share" value={money(platformRevenue)} />
              <MiniMetric label="Creator pool" value={money(projectedGross - platformRevenue)} />
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-6">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Room status</p>
          <div className="mt-5 space-y-4">
            <StatusRow label="API rooms" value={`${rooms.length} loaded`} />
            <StatusRow label="Selected room" value={selectedRoom?.status || "Draft"} />
            <StatusRow label="AI host" value={payload.hostModel} />
          </div>
        </GlassCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
        <GlassCard className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">Live room builder</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Mobile-first setup for curriculum, AI host, and revenue rules.</p>
            </div>
            <Clapperboard className="hidden h-8 w-8 text-cyan-500 sm:block" />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Field label="Room title" id="room-title">
              <Input id="room-title" value={payload.roomTitle} onChange={(event) => updateField("roomTitle", event.target.value)} />
            </Field>
            <Field label="Curriculum" id="curriculum">
              <Select
                id="curriculum"
                value={payload.curriculum}
                onChange={(event) => {
                  const value = event.target.value;
                  updateField("curriculum", value);
                  updateField("expectedArppuUsd", autoArppuByCurriculum(value));
                }}
              >
                {["AI", "Blockchain", "Web3", "Crypto", "Business", "Finance"].map((item) => <option key={item}>{item}</option>)}
              </Select>
            </Field>
            <Field label="Course load" id="course-load">
              <Select
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
              </Select>
            </Field>
            <Field label="Session capacity" id="session-capacity">
              <Input
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
            </Field>
            <Field label="AI host model" id="host-model">
              <Input id="host-model" value={payload.hostModel} onChange={(event) => updateField("hostModel", event.target.value)} />
            </Field>
            <Field label="Host locale" id="host-locale">
              <Input id="host-locale" value={payload.hostLocale} onChange={(event) => updateField("hostLocale", event.target.value)} />
            </Field>
            <Field label="Expected audience" id="expected-audience">
              <Input id="expected-audience" type="number" min="1" value={payload.expectedAudience} onChange={(event) => updateField("expectedAudience", event.target.value)} />
            </Field>
            <Field label="Expected ARPPU (USD)" id="arppu">
              <Input id="arppu" type="number" min="0.1" step="0.1" value={payload.expectedArppuUsd} onChange={(event) => updateField("expectedArppuUsd", event.target.value)} />
            </Field>
            <Field label="Platform share %" id="platform-share">
              <Input id="platform-share" type="number" min="35" max="40" value={payload.platformSharePercent} onChange={(event) => updateField("platformSharePercent", event.target.value)} />
            </Field>
            <Field label="Session minutes" id="expected-session-minutes">
              <Input id="expected-session-minutes" type="number" min="15" max="480" value={payload.expectedSessionMinutes} onChange={(event) => updateField("expectedSessionMinutes", event.target.value)} />
            </Field>
            <Field label="Tutor interval" id="interval-minutes">
              <Input id="interval-minutes" type="number" min="5" max="90" value={payload.tutoringIntervalMinutes} onChange={(event) => updateField("tutoringIntervalMinutes", event.target.value)} />
            </Field>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <ActionButton onClick={createRoom} disabled={loading}>
              {loading ? "Creating room..." : "Create AI live room"} <Rocket className="h-4 w-4" />
            </ActionButton>
            <ActionButton variant="secondary" onClick={loadRooms}>Refresh rooms</ActionButton>
          </div>
          {error ? <Alert tone="error">{error}</Alert> : null}
        </GlassCard>

        <div className="space-y-5">
          <GlassCard className="p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black">Preview and controls</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Room intelligence, payout math, and attendee actions.</p>
              </div>
              <BarChart3 className="h-7 w-7 text-emerald-500" />
            </div>

            {!response ? (
              <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-900/20 bg-slate-100/60 p-6 text-sm text-slate-600 dark:border-white/15 dark:bg-white/[0.03] dark:text-slate-300">
                Create a room to unlock LiveKit details, curriculum coverage, and organic revenue projections.
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                <Field label="Active room" id="active-room">
                  <Select id="active-room" value={selectedRoomId} onChange={(event) => setSelectedRoomId(event.target.value)}>
                    {rooms.length ? null : <option value={response.room.id}>{response.room.roomName}</option>}
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>{room.roomName} ({room.status})</option>
                    ))}
                  </Select>
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoTile label="Room" value={selectedRoom?.roomName || response.room.roomName} />
                  <InfoTile label="Status" value={selectedRoom?.status || response.room.status} />
                  <InfoTile label="LiveKit SID" value={selectedRoom?.livekit?.roomSidHint || response.room.livekit.roomSidHint} />
                  <InfoTile label="AI Host" value={selectedRoom?.aiHost?.displayName || response.room.aiHost.displayName} />
                  <InfoTile label="Gross" value={money(response.payout.grossRevenueUsd)} />
                  <InfoTile label="Creator pool" value={money(response.payout.creatorRevenueUsd)} />
                </div>
              </div>
            )}
          </GlassCard>

          <GlassCard className="p-5 sm:p-6">
            <h3 className="text-xl font-black">Join session</h3>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="User ID" id="join-user-id">
                <Input id="join-user-id" value={joinPayload.userId} onChange={(event) => setJoinPayload((prev) => ({ ...prev, userId: event.target.value }))} />
              </Field>
              <Field label="Display name" id="join-display-name">
                <Input id="join-display-name" value={joinPayload.displayName} onChange={(event) => setJoinPayload((prev) => ({ ...prev, displayName: event.target.value }))} />
              </Field>
              <Field label="Watch minutes" id="join-watch-minutes">
                <Input id="join-watch-minutes" type="number" min="0" value={joinPayload.watchMinutes} onChange={(event) => setJoinPayload((prev) => ({ ...prev, watchMinutes: event.target.value }))} />
              </Field>
              <Field label="Organic user" id="join-is-organic">
                <Select id="join-is-organic" value={joinPayload.isOrganic ? "true" : "false"} onChange={(event) => setJoinPayload((prev) => ({ ...prev, isOrganic: event.target.value === "true" }))}>
                  <option value="true">true</option>
                  <option value="false">false</option>
                </Select>
              </Field>
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <ActionButton onClick={joinRoom} disabled={joinLoading}>{joinLoading ? "Joining..." : "Join stream"}</ActionButton>
              <ActionButton variant="secondary" onClick={leaveRoom} disabled={joinLoading}>Leave</ActionButton>
              <ActionButton variant="secondary" onClick={finishRoom} disabled={joinLoading}>Finish</ActionButton>
            </div>
            {activeSessionLock ? <Alert tone="warning">Active session lock: {activeSessionLock.roomName}. Leave or finish it before joining another room.</Alert> : null}
            {joinError ? <Alert tone="error">{joinError}</Alert> : null}
            {joinState ? (
              <Alert tone="success">
                {joinState.attendance?.isActive ? "User joined" : "User left"} · active attenders {joinState.metrics?.activeAttenders ?? 0}
              </Alert>
            ) : null}
          </GlassCard>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {streamBlueprints.map((item, index) => (
          <GlassCard key={item} className="p-5">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">{index + 1}</span>
            <p className="mt-4 font-bold">{item}</p>
          </GlassCard>
        ))}
      </section>
    </div>
  );
}

function PricingPage() {
  const [bizPricing, setBizPricing] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/automation/billing/pricing")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setBizPricing(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const meterRates = bizPricing?.meterRates;

  return (
    <PageShell
      eyebrow="Pricing"
      title="CCWEB: learn, stream, and automate with clear economics."
      description="Academy plans stay approachable. Business Automation adds transparent usage-based billing — start free, scale with metered agents and workflows, and optional fees only on growth you attribute."
    >
      <section className="mb-12 rounded-[2rem] border border-cyan-500/20 bg-cyan-500/5 p-6 dark:bg-cyan-500/10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white dark:bg-white dark:text-slate-950">
              Business Automation Hub
            </span>
            <h2 className="mt-4 text-2xl font-black">Automation & agents — usage you can see</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Pay-as-you-go beyond included quotas: workflow runs, agent actions, API/AI units, and data processing. Pro adds analytics and a{" "}
              {bizPricing?.plans?.find((p) => p.id === "pro")?.performanceFeePercent ?? 5}% performance fee only on revenue you attribute to automation.
              Enterprise lowers fees and adds dedicated integrations — priced with sales.
            </p>
          </div>
          <Link
            to="/billing"
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-black text-white dark:bg-white dark:text-slate-950"
          >
            Open billing dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {(bizPricing?.plans || []).map((plan) => (
            <GlassCard key={plan.id} className={`p-5 ${plan.id === "pro" ? "ring-2 ring-cyan-400/60" : ""}`}>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{plan.name}</p>
              <p className="mt-3 text-3xl font-black">
                {plan.contactSales ? "Custom" : plan.monthlyPriceUsd === 0 ? "$0" : `$${plan.monthlyPriceUsd}`}
                {!plan.contactSales && plan.monthlyPriceUsd > 0 ? <span className="text-base font-semibold text-slate-500">/mo</span> : null}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li>Agents (active): up to {plan.limits?.maxActiveAgents}</li>
                <li>Workflows: up to {plan.limits?.maxActiveWorkflows}</li>
                <li>
                  Included runs / mo: {plan.limits?.includedWorkflowRunsPerMonth?.toLocaleString?.() ?? plan.limits?.includedWorkflowRunsPerMonth}
                </li>
                <li>Performance fee: {plan.performanceFeePercent}% (on attributed growth)</li>
              </ul>
            </GlassCard>
          ))}
        </div>
        {meterRates ? (
          <div className="mt-6 rounded-2xl border border-slate-900/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-black">Meter rates (overage)</p>
            <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <li>Per 1k agent actions: ${meterRates.agentActionsPer1k}</li>
              <li>Per workflow run: ${meterRates.workflowRun}</li>
              <li>Per API / AI unit: ${meterRates.apiUnit}</li>
              <li>Per GB processed: ${meterRates.dataProcessingPerGb}</li>
            </ul>
            <p className="mt-3 text-xs text-slate-500">
              {bizPricing?.performanceFeeNote} Marketplace commission on shared templates: {bizPricing?.marketplace?.ccwebCommissionPercent}%.
            </p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">Start the API server to load live automation pricing.</p>
        )}
      </section>

      <h2 className="mb-6 text-2xl font-black">Academy & streaming</h2>
      <div className="grid gap-4 lg:grid-cols-3">
        {pricingPlans.map((plan) => (
          <GlassCard key={plan.name} className={`p-6 ${plan.featured ? "ring-2 ring-cyan-400" : ""}`}>
            {plan.featured ? <Pill icon={Flame}>Most popular</Pill> : null}
            <h3 className="mt-5 text-2xl font-black">{plan.name}</h3>
            <p className="mt-2 text-slate-600 dark:text-slate-300">{plan.description}</p>
            <p className="mt-6 text-4xl font-black">{plan.price}<span className="text-base text-slate-500">/mo</span></p>
            <ul className="mt-6 space-y-3">
              {plan.features.map((feature) => <CheckItem key={feature}>{feature}</CheckItem>)}
            </ul>
          </GlassCard>
        ))}
      </div>
    </PageShell>
  );
}

function TokensPage() {
  return <FeaturePage eyebrow="CCWEB Token" title="A utility token for learning, access, rewards, and governance." icon={Wallet} features={["Token-gated cohorts", "Learn and earn quests", "Governance voting", "Staking rewards"]} />;
}

function AffiliatesPage() {
  return <FeaturePage eyebrow="Affiliate program" title="Recurring commissions for creators who grow the CCWEB academy." icon={CircleDollarSign} features={["Instant referral links", "30% recurring commission", "Creator analytics"]} />;
}

function CommunityPage() {
  return <FeaturePage eyebrow="Community" title="A global network of builders, creators, and learners." icon={Globe2} features={["Live peer rooms", "Builder forums", "Weekly AMAs"]} />;
}

function BlogPage() {
  return <FeaturePage eyebrow="AI blog" title="Fresh explainers for AI, crypto, markets, and product systems." icon={BookOpen} features={["Research notes", "Course previews", "Founder essays"]} />;
}

function AboutPage() {
  return <FeaturePage eyebrow="About" title="CCWEB is building a practical AI and Web3 education economy." icon={ShieldCheck} features={["Education first", "Creator owned", "Accessible globally"]} />;
}

function FaqPage() {
  return (
    <PageShell eyebrow="FAQ" title="Answers for learners and stream creators." description="Everything you need before joining the CCWEB platform.">
      <div className="grid gap-4 lg:grid-cols-2">
        {[
          ["Can I start free?", "Yes. Starter access includes sample courses, community previews, and limited AI tutor use."],
          ["Do I need crypto experience?", "No. Beginner tracks explain wallets, tokens, and blockchain concepts step by step."],
          ["How does streaming revenue work?", "The studio forecasts gross revenue, platform share, and creator pools before a room launches."],
          ["Can teams use CCWEB?", "Yes. Studio plans support team cohorts, API access, and custom learning systems."],
        ].map(([question, answer]) => (
          <GlassCard key={question} className="p-6">
            <h3 className="text-lg font-black">{question}</h3>
            <p className="mt-3 text-slate-600 dark:text-slate-300">{answer}</p>
          </GlassCard>
        ))}
      </div>
    </PageShell>
  );
}

function LoginPage() {
  return <AuthPage title="Welcome back" cta="Sign in" linkText="Need an account?" linkTo="/signup" />;
}

function SignupPage() {
  return <AuthPage title="Create your CCWEB account" cta="Create account" linkText="Already registered?" linkTo="/login" />;
}

function ContactPage() {
  return <FeaturePage eyebrow="Contact" title="Talk to the CCWEB team about cohorts, partnerships, and streaming." icon={Users} features={["Partnerships", "Enterprise cohorts", "Creator onboarding"]} />;
}

function DashboardPage() {
  return (
    <PageShell eyebrow="Dashboard" title="Your learner command center." description="Track course momentum, token progress, and live stream participation.">
      <div className="grid gap-4 lg:grid-cols-3">
        <MetricCard icon={GraduationCap} label="Courses active" value="4" />
        <MetricCard icon={Coins} label="Tokens earned" value="1,280" />
        <MetricCard icon={Radio} label="Live sessions" value="2" />
      </div>
    </PageShell>
  );
}

function FeaturePage({ eyebrow, title, icon: Icon, features }) {
  return (
    <PageShell eyebrow={eyebrow} title={title} description="A focused, responsive product surface designed for the next CCWEB release.">
      <div className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
        <GlassCard className="grid min-h-72 place-items-center p-8">
          <div className="grid h-28 w-28 place-items-center rounded-[2rem] bg-gradient-to-br from-cyan-400 to-violet-500 text-white shadow-2xl shadow-cyan-500/20">
            <Icon className="h-12 w-12" />
          </div>
        </GlassCard>
        <GlassCard className="p-6">
          <h3 className="text-2xl font-black">Platform highlights</h3>
          <ul className="mt-6 space-y-4">
            {features.map((feature) => <CheckItem key={feature}>{feature}</CheckItem>)}
          </ul>
        </GlassCard>
      </div>
    </PageShell>
  );
}

function AuthPage({ title, cta, linkText, linkTo }) {
  return (
    <div className="mx-auto max-w-md">
      <GlassCard className="p-6 sm:p-8">
        <Pill icon={Lock}>Secure access</Pill>
        <h1 className="mt-6 text-3xl font-black">{title}</h1>
        <div className="mt-6 space-y-4">
          <Field label="Email" id="email"><Input id="email" type="email" placeholder="maya@ccweb.ai" /></Field>
          <Field label="Password" id="password"><Input id="password" type="password" placeholder="••••••••" /></Field>
        </div>
        <ActionButton className="mt-6 w-full">{cta}</ActionButton>
        <Link to={linkTo} className="mt-5 block text-center text-sm font-semibold text-cyan-500">{linkText}</Link>
      </GlassCard>
    </div>
  );
}

function PageShell({ eyebrow, title, description, children }) {
  return (
    <div className="space-y-8">
      <motion.header initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
        <Pill icon={Zap}>{eyebrow}</Pill>
        <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">{description}</p>
      </motion.header>
      {children}
    </div>
  );
}

function GlassCard({ children, className = "" }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className={`rounded-[2rem] border border-slate-900/10 bg-white/75 shadow-xl shadow-slate-950/[0.04] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/20 ${className}`}
    >
      {children}
    </motion.article>
  );
}

function Pill({ children, icon: Icon }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-300">
      <Icon className="h-3.5 w-3.5" /> {children}
    </span>
  );
}

function ButtonLink({ children, to, variant = "primary", className = "" }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black transition duration-300 hover:-translate-y-0.5";
  const styles = variant === "primary"
    ? "bg-slate-950 text-white shadow-xl shadow-slate-950/15 hover:shadow-cyan-500/20 dark:bg-white dark:text-slate-950"
    : "border border-slate-900/10 bg-white/70 text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10";
  return <Link to={to} className={`${base} ${styles} ${className}`}>{children}</Link>;
}

function ActionButton({ children, variant = "primary", className = "", ...props }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black transition duration-300 disabled:cursor-not-allowed disabled:opacity-60";
  const styles = variant === "primary"
    ? "bg-slate-950 text-white shadow-xl shadow-slate-950/15 hover:-translate-y-0.5 dark:bg-white dark:text-slate-950"
    : "border border-slate-900/10 bg-white/70 text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10";
  return <button type="button" className={`${base} ${styles} ${className}`} {...props}>{children}</button>;
}

function MetricCard({ icon: Icon, label, value }) {
  return (
    <GlassCard className="p-5">
      <Icon className="h-6 w-6 text-cyan-500" />
      <p className="mt-5 text-3xl font-black">{value}</p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{label}</p>
    </GlassCard>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-900/10 bg-slate-100/70 p-4 dark:border-white/10 dark:bg-white/5">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}

function Field({ label, id, children }) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">{label}</span>
      {children}
    </label>
  );
}

function Input(props) {
  return <input className="w-full rounded-2xl border border-slate-900/10 bg-white/90 px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 dark:border-white/10 dark:bg-white/5 dark:text-white" {...props} />;
}

function Select(props) {
  return <select className="w-full rounded-2xl border border-slate-900/10 bg-white/90 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 dark:border-white/10 dark:bg-slate-950 dark:text-white" {...props} />;
}

function StatusRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-900/10 bg-slate-100/60 px-4 py-3 dark:border-white/10 dark:bg-white/5">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span className="max-w-[11rem] truncate text-sm font-bold">{value}</span>
    </div>
  );
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-900/10 bg-slate-100/60 p-4 dark:border-white/10 dark:bg-white/5">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 truncate text-sm font-black">{value}</p>
    </div>
  );
}

function Alert({ children, tone = "success" }) {
  const styles = {
    success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    warning: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    error: "border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-300",
  };
  return <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-semibold ${styles[tone]}`}>{children}</div>;
}

function CheckItem({ children }) {
  return (
    <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
      <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500/15 text-emerald-500"><Check className="h-4 w-4" /></span>
      {children}
    </li>
  );
}

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export default App;
