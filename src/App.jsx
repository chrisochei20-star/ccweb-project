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

const navItems = [
  { label: "Home", to: "/" },
  { label: "Automation", to: "/automation" },
  { label: "Learn", to: "/courses" },
  { label: "AI Tutor", to: "/ai-tutor" },
  { label: "Streaming", to: "/ai-streaming" },
  { label: "Find", to: "/find" },
  { label: "Build", to: "/dapp-builder" },
  { label: "AI Agents", to: "/ai-agents" },
  { label: "Earn", to: "/earn" },
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
          <Route path="automation" element={<AutomationHubPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="courses/:id" element={<CourseNotFoundPage />} />
          <Route path="ai-tutor" element={<AiTutorPage />} />
          <Route path="ai-streaming" element={<AiStreamingPage />} />
          <Route path="find" element={<FindPage />} />
          <Route path="dapp-builder" element={<DappBuilderPage />} />
          <Route path="dapp-dashboard" element={<DappDashboardPage />} />
          <Route path="ai-agents" element={<AiAgentsPage />} />
          <Route path="earn" element={<EarnPage />} />
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
    <div className="min-h-screen overflow-hidden bg-slate-50 text-slate-950 transition-colors duration-500 dark:bg-[#030711] dark:text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-400/10" />
        <div className="absolute right-[-8rem] top-32 h-[28rem] w-[28rem] rounded-full bg-violet-500/20 blur-3xl dark:bg-violet-500/10" />
        <div className="absolute bottom-[-12rem] left-[-8rem] h-[28rem] w-[28rem] rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-400/10" />
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
              <span className="block text-xs text-slate-500 dark:text-slate-400">AI streaming OS</span>
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
          <span>© {new Date().getFullYear()} Chrisccwebfoundation. Built for live AI learning.</span>
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
            <ButtonLink to="/ai-streaming" variant="primary">
              Launch stream studio <ArrowRight className="h-4 w-4" />
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Learn", "Adaptive courses, AI tutoring, quizzes, and live session memory.", "/courses", BrainCircuit],
          ["Find", "Safety scanning, early signals, smart money, and narrative detection.", "/find", Search],
          ["Build", "DApp templates, AI agents, and workflow automation tools.", "/dapp-builder", Boxes],
          ["Earn", "Affiliate income, streaming revenue, skill payouts, and agent rewards.", "/earn", CircleDollarSign],
        ].map(([title, body, to, Icon]) => (
          <Link key={title} to={to} className="group rounded-[2rem] border border-slate-900/10 bg-white/70 p-6 shadow-xl shadow-slate-950/[0.04] transition duration-300 hover:-translate-y-1 hover:border-cyan-400/50 dark:border-white/10 dark:bg-white/[0.05]">
            <Icon className="h-7 w-7 text-cyan-500" />
            <h3 className="mt-5 text-xl font-black">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{body}</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-cyan-500">Open {title} <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
          </Link>
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
  return (
    <PageShell eyebrow="Pricing" title="Simple plans for learners, creators, and teams." description="Start free, then unlock unlimited tutoring, live rooms, and token rewards.">
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
  return <Navigate to="/earn" replace />;
}

function AffiliatesPage() {
  return <Navigate to="/earn" replace />;
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

function FindPage() {
  const [tab, setTab] = useState("scanner");
  const [scanQuery, setScanQuery] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [signals, setSignals] = useState([]);
  const [smartMoney, setSmartMoney] = useState(null);
  const [loadingSignals, setLoadingSignals] = useState(false);
  const [loadingSm, setLoadingSm] = useState(false);

  async function doScan() {
    if (!scanQuery.trim()) return;
    setScanning(true);
    setScanResult(null);
    try {
      const res = await fetch(`/api/find/scan?token=${encodeURIComponent(scanQuery.trim().toUpperCase())}`);
      const data = await res.json();
      setScanResult(data);
    } catch { /* ignore */ }
    setScanning(false);
  }

  async function loadSignals() {
    setLoadingSignals(true);
    try {
      const res = await fetch("/api/find/signals");
      const data = await res.json();
      setSignals(data.signals || []);
    } catch { /* ignore */ }
    setLoadingSignals(false);
  }

  async function loadSmartMoney() {
    setLoadingSm(true);
    try {
      const res = await fetch("/api/find/smart-money");
      const data = await res.json();
      setSmartMoney(data);
    } catch { /* ignore */ }
    setLoadingSm(false);
  }

  useEffect(() => {
    if (tab === "signals" && !signals.length) loadSignals();
    if (tab === "smart-money" && !smartMoney) loadSmartMoney();
  }, [tab]);

  const scoreColor = (score) => score >= 70 ? "find-score-safe" : score >= 40 ? "find-score-warn" : "find-score-danger";

  return (
    <section className="find-page">
      <header className="page-header">
        <span className="pill">FIND — Discovery &amp; Intelligence</span>
        <h1 className="section-title">Crypto Intelligence Hub</h1>
        <p className="muted">Discover opportunities, insights, and risks — before the crowd.</p>
      </header>

      <div className="dash-tabs">
        {[["scanner", "Safety Scanner"], ["signals", "Early Signals"], ["smart-money", "Smart Money"]].map(([key, label]) => (
          <button key={key} className={`dash-tab ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {tab === "scanner" && (
        <div className="find-scanner">
          <div className="panel" style={{ maxWidth: 600 }}>
            <h3>Crypto Safety Scanner</h3>
            <p className="muted">Analyze any token for honeypot risk, rug pull indicators, contract verification, and liquidity locks.</p>
            <div className="find-scan-form">
              <input type="text" value={scanQuery} onChange={(e) => setScanQuery(e.target.value)} placeholder="Enter token symbol (e.g. ETH, SHIB)" onKeyDown={(e) => e.key === "Enter" && doScan()} />
              <button className="btn btn-primary" onClick={doScan} disabled={scanning}>{scanning ? "Scanning..." : "Scan Token"}</button>
            </div>
          </div>
          {scanResult && (
            <div className="find-scan-result panel">
              <div className="find-scan-header">
                <h3>{scanResult.name} ({scanResult.token})</h3>
                <div className={`find-score-badge ${scoreColor(scanResult.score)}`}>{scanResult.score}/100</div>
              </div>
              <div className="find-scan-grid">
                <div className="find-check-item"><span className={scanResult.contractVerified ? "check-pass" : "check-fail"}>{scanResult.contractVerified ? "✓" : "✗"}</span> Contract Verified</div>
                <div className="find-check-item"><span className={scanResult.liquidityLocked ? "check-pass" : "check-fail"}>{scanResult.liquidityLocked ? "✓" : "✗"}</span> Liquidity Locked</div>
                <div className="find-check-item"><span className={scanResult.ownershipRenounced ? "check-pass" : "check-fail"}>{scanResult.ownershipRenounced ? "✓" : "✗"}</span> Ownership Renounced</div>
                <div className="find-check-item"><span>Honeypot Risk:</span> <strong className={scanResult.honeypotRisk === "none" || scanResult.honeypotRisk === "low" ? "check-pass" : "check-fail"}>{scanResult.honeypotRisk}</strong></div>
                <div className="find-check-item"><span>Rug Pull Risk:</span> <strong className={scanResult.rugPullRisk === "very_low" || scanResult.rugPullRisk === "low" ? "check-pass" : "check-fail"}>{scanResult.rugPullRisk}</strong></div>
                <div className="find-check-item"><span>Network:</span> <strong>{scanResult.network}</strong></div>
              </div>
              {scanResult.flags.length > 0 && (
                <div className="find-flags"><strong>Flags:</strong> <div className="pill-row">{scanResult.flags.map((f) => (<span key={f} className="tiny-pill find-flag-pill">{f.replace(/_/g, " ")}</span>))}</div></div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "signals" && (
        <div className="find-signals">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ margin: 0 }}>Early Signals Dashboard</h3>
            <button className="btn btn-outline btn-sm" onClick={loadSignals} disabled={loadingSignals}>Refresh</button>
          </div>
          {loadingSignals && <p className="muted">Loading signals...</p>}
          <div className="find-signals-grid">
            {signals.map((sig) => (
              <article key={sig.id} className="find-signal-card panel">
                <div className="find-signal-header">
                  <span className="badge">{sig.type.replace(/_/g, " ")}</span>
                  <span className="find-confidence">{sig.confidence}%</span>
                </div>
                <h4>{sig.title}</h4>
                <p className="muted">{sig.description}</p>
                <div className="pill-row">{sig.tokens.map((t) => (<span key={t} className="tiny-pill">{t}</span>))}</div>
              </article>
            ))}
          </div>
        </div>
      )}

      {tab === "smart-money" && (
        <div className="find-smart-money">
          {loadingSm && <p className="muted">Loading smart money data...</p>}
          {smartMoney && (
            <>
              <h3>Whale Trends</h3>
              <div className="find-trends-grid">
                {smartMoney.trends.map((t) => (
                  <div key={t.token} className="find-trend-card panel">
                    <strong>{t.token}</strong>
                    <div className={t.direction === "accumulation" ? "find-trend-up" : "find-trend-down"}>
                      {t.direction === "accumulation" ? "↑" : "↓"} ${(t.netFlow / 1e6).toFixed(1)}M
                    </div>
                    <span className="muted">{t.whaleCount} whales · {t.direction}</span>
                  </div>
                ))}
              </div>
              <h3 style={{ marginTop: "1.5rem" }}>Smart Money Wallets</h3>
              <div className="find-wallets-list">
                {smartMoney.wallets.map((w) => (
                  <div key={w.address} className="find-wallet-card panel">
                    <div className="find-wallet-header">
                      <strong>{w.label}</strong>
                      <span className="muted">{w.address}</span>
                    </div>
                    <div className="find-wallet-stats">
                      <span>Win: {w.winRate}%</span>
                      <span>Avg Return: {w.avgReturn}%</span>
                      <span>Portfolio: ${(w.totalValueUsd / 1e6).toFixed(0)}M</span>
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

function DappBuilderPage() {
  const [templates, setTemplates] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [prices, setPrices] = useState({});
  const [deployments, setDeployments] = useState([]);
  const [step, setStep] = useState("select");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [selectedToken, setSelectedToken] = useState("ETH");
  const [walletAddress, setWalletAddress] = useState("");
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletType, setWalletType] = useState("");
  const [contractName, setContractName] = useState("");
  const [contractSymbol, setContractSymbol] = useState("");
  const [deploying, setDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState(null);
  const [error, setError] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  useEffect(() => {
    fetch("/api/dapp/templates").then((r) => r.json()).then((d) => setTemplates(d.templates || []));
    fetch("/api/dapp/networks").then((r) => r.json()).then((d) => setNetworks(d.networks || []));
    fetch("/api/dapp/prices").then((r) => r.json()).then((d) => setPrices(d.prices || {}));
    fetch("/api/dapp/deployments").then((r) => r.json()).then((d) => setDeployments(d.deployments || []));
  }, []);

  const categories = ["All", ...new Set(templates.map((t) => t.category))];
  const filteredTemplates = filterCategory === "All" ? templates : templates.filter((t) => t.category === filterCategory);

  const availableNetworks = selectedTemplate
    ? networks.filter((n) => selectedTemplate.networks.includes(n.id))
    : networks;

  const currentNetworkInfo = networks.find((n) => n.id === selectedNetwork);
  const feeUsd = selectedTemplate ? selectedTemplate.baseFeeUsd : 0;
  const tokenPrice = prices[selectedToken];
  const feeInToken = tokenPrice ? (feeUsd / tokenPrice.priceUsd).toFixed(6) : "—";

  function connectWallet(type) {
    const mockAddress = type === "phantom"
      ? `${crypto.getRandomValues(new Uint8Array(4)).reduce((s, b) => s + b.toString(16).padStart(2, "0"), "")}...sol`
      : `0x${crypto.getRandomValues(new Uint8Array(20)).reduce((s, b) => s + b.toString(16).padStart(2, "0"), "")}`;
    setWalletAddress(mockAddress);
    setWalletConnected(true);
    setWalletType(type);
  }

  function disconnectWallet() {
    setWalletAddress("");
    setWalletConnected(false);
    setWalletType("");
  }

  function selectTemplate(tmpl) {
    setSelectedTemplate(tmpl);
    setSelectedNetwork(tmpl.networks[0] || "");
    setContractName(tmpl.name);
    setContractSymbol(tmpl.id.toUpperCase().slice(0, 5));
    setStep("configure");
    setError("");
    const net = networks.find((n) => n.id === tmpl.networks[0]);
    if (net) {
      setSelectedToken(net.wallet === "phantom" ? "SOL" : "ETH");
    }
  }

  function handleNetworkChange(networkId) {
    setSelectedNetwork(networkId);
    const net = networks.find((n) => n.id === networkId);
    if (net?.wallet === "phantom") setSelectedToken("SOL");
  }

  async function handleDeploy() {
    if (!walletConnected) { setError("Please connect a wallet first."); return; }
    if (!selectedNetwork) { setError("Please select a network."); return; }
    if (!contractName.trim()) { setError("Contract name is required."); return; }
    if (!contractSymbol.trim()) { setError("Contract symbol is required."); return; }

    setDeploying(true);
    setError("");

    const idempotencyKey = `${walletAddress}-${selectedTemplate.id}-${selectedNetwork}-${Date.now()}`;

    try {
      const resp = await fetch("/api/dapp/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          network: selectedNetwork,
          paymentToken: selectedToken,
          contractName: contractName.trim(),
          contractSymbol: contractSymbol.trim().toUpperCase(),
          walletAddress,
          parameters: {},
          idempotencyKey,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) { setError(data.error || "Deployment failed."); setDeploying(false); return; }
      setDeployResult(data);
      setStep("success");
      setDeployments((prev) => [data, ...prev]);
    } catch {
      setError("Network error. Please try again.");
    }
    setDeploying(false);
  }

  function resetBuilder() {
    setStep("select");
    setSelectedTemplate(null);
    setDeployResult(null);
    setError("");
    setContractName("");
    setContractSymbol("");
  }

  const tokenOptions = currentNetworkInfo?.wallet === "phantom" ? ["SOL"] : ["ETH", "MATIC", "USDC", "BNB"];

  return (
    <section className="dapp-builder">
      <header className="page-header">
        <span className="pill">Native DApp Builder</span>
        <h1 className="section-title">Deploy Decentralized Applications</h1>
        <p className="muted">
          Build and deploy smart contracts with multi-token payments. Supports Ethereum, Polygon, BNB Chain, and Solana.
        </p>
        <div style={{ marginTop: "0.8rem" }}>
          <Link to="/dapp-dashboard" className="btn btn-outline btn-sm">View Dashboard</Link>
        </div>
      </header>

      <div className="dapp-wallet-bar">
        {walletConnected ? (
          <div className="dapp-wallet-connected">
            <span className="dapp-wallet-indicator"></span>
            <span className="dapp-wallet-label">
              {walletType === "phantom" ? "Phantom" : "MetaMask"}: <code>{walletAddress.slice(0, 10)}...{walletAddress.slice(-6)}</code>
            </span>
            <button className="btn btn-outline btn-sm" onClick={disconnectWallet}>Disconnect</button>
          </div>
        ) : (
          <div className="dapp-wallet-buttons">
            <span className="muted" style={{ alignSelf: "center", fontSize: "0.85rem" }}>Connect your wallet to begin:</span>
            <button className="btn btn-outline" onClick={() => connectWallet("metamask")}>
              🦊 MetaMask
            </button>
            <button className="btn btn-outline" onClick={() => connectWallet("phantom")}>
              👻 Phantom
            </button>
          </div>
        )}
      </div>

      {step === "select" && (
        <>
          <div className="dapp-filter-bar">
            <h2 className="dapp-step-title" style={{ margin: 0 }}>Choose a Template</h2>
            <div className="dapp-filter-pills">
              {categories.map((cat) => (
                <button key={cat} className={`dapp-filter-pill ${filterCategory === cat ? "active" : ""}`} onClick={() => setFilterCategory(cat)}>{cat}</button>
              ))}
            </div>
          </div>
          <div className="dapp-template-grid">
            {filteredTemplates.map((tmpl) => (
              <article key={tmpl.id} className="dapp-template-card" onClick={() => selectTemplate(tmpl)}>
                <div className="dapp-template-header">
                  <span className="badge">{tmpl.category}</span>
                  <span className="dapp-fee">${tmpl.baseFeeUsd}</span>
                </div>
                <h3>{tmpl.name}</h3>
                <p className="muted">{tmpl.description}</p>
                <div className="dapp-template-networks">
                  {tmpl.networks.map((n) => (
                    <span key={n} className="tiny-pill">{n}</span>
                  ))}
                </div>
                <div className="dapp-template-features">
                  {tmpl.features.map((f) => (
                    <span key={f} className="dapp-feature-tag">{f}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {step === "configure" && selectedTemplate && (
        <>
          <button className="btn btn-outline btn-sm" onClick={resetBuilder} style={{ marginBottom: "1rem" }}>← Back to Templates</button>
          <h2 className="dapp-step-title">Configure & Deploy: {selectedTemplate.name}</h2>
          <div className="dapp-config-grid">
            <div className="dapp-config-form panel">
              <h3>Contract Configuration</h3>
              <div className="dapp-form-row">
                <label>Contract Name</label>
                <input type="text" value={contractName} onChange={(e) => setContractName(e.target.value)} placeholder="My Token" />
              </div>
              <div className="dapp-form-row">
                <label>Symbol</label>
                <input type="text" value={contractSymbol} onChange={(e) => setContractSymbol(e.target.value.toUpperCase())} placeholder="TKN" maxLength={10} />
              </div>
              <div className="dapp-form-row">
                <label>Network</label>
                <select value={selectedNetwork} onChange={(e) => handleNetworkChange(e.target.value)}>
                  {availableNetworks.map((n) => (<option key={n.id} value={n.id}>{n.name}</option>))}
                </select>
              </div>
              <div className="dapp-form-row">
                <label>Payment Token</label>
                <select value={selectedToken} onChange={(e) => setSelectedToken(e.target.value)}>
                  {tokenOptions.map((t) => (<option key={t} value={t}>{t} — ${prices[t]?.priceUsd || "..."}</option>))}
                </select>
              </div>
              <div className="dapp-fee-summary">
                <div className="dapp-fee-row"><span>Deployment Fee</span><span>${feeUsd} USD</span></div>
                <div className="dapp-fee-row"><span>Pay in {selectedToken}</span><strong>{feeInToken} {selectedToken}</strong></div>
                <div className="dapp-fee-row muted"><span>Estimated Gas</span><span>{selectedTemplate.estimatedGas}</span></div>
              </div>
              {error && <p className="error-text">{error}</p>}
              <button className="btn btn-primary dapp-deploy-btn" onClick={handleDeploy} disabled={deploying || !walletConnected}>
                {deploying ? "Processing Payment..." : !walletConnected ? "Connect Wallet First" : `Deploy & Pay ${feeInToken} ${selectedToken}`}
              </button>
              {!walletConnected && <p className="muted" style={{ textAlign: "center", fontSize: "0.82rem", marginTop: "0.4rem" }}>Wallet connection required before deployment</p>}
            </div>
            <div className="dapp-config-preview panel">
              <h3>Template Details</h3>
              <p className="muted">{selectedTemplate.description}</p>
              <h4>Features</h4>
              <ul className="list">{selectedTemplate.features.map((f) => (<li key={f}>{f}</li>))}</ul>
              <h4>Supported Networks</h4>
              <div className="pill-row">{selectedTemplate.networks.map((n) => (<span key={n} className="tiny-pill">{n}</span>))}</div>
              <h4 style={{ marginTop: "1rem" }}>Payment Tokens</h4>
              <div className="dapp-token-grid">
                {Object.entries(prices).map(([sym, info]) => (
                  <div key={sym} className={`dapp-token-card ${selectedToken === sym ? "active" : ""}`} onClick={() => tokenOptions.includes(sym) && setSelectedToken(sym)}>
                    <strong>{sym}</strong>
                    <span className="muted">${info.priceUsd}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {step === "success" && deployResult && (
        <div className="dapp-success">
          <div className="dapp-success-card panel">
            <div className="dapp-success-icon">✓</div>
            <h2>Deployment Successful!</h2>
            <p className="muted">Your {deployResult.templateName} has been deployed to {deployResult.network}.</p>
            <div className="dapp-success-details">
              <div className="dapp-detail-row"><span className="muted">Contract Address</span><code>{deployResult.contractAddress}</code></div>
              <div className="dapp-detail-row"><span className="muted">Network</span><span>{deployResult.network}</span></div>
              <div className="dapp-detail-row"><span className="muted">Payment</span><span>{deployResult.payment.amountToken} {deployResult.payment.token} (${deployResult.payment.amountUsd})</span></div>
              <div className="dapp-detail-row"><span className="muted">Tx Hash</span><code style={{ fontSize: "0.75rem" }}>{deployResult.payment.txHash.slice(0, 22)}...</code></div>
              <div className="dapp-detail-row"><span className="muted">Status</span><span className="dapp-deploy-status">{deployResult.status}</span></div>
            </div>
            <div className="dapp-success-actions">
              <a href={deployResult.explorerUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">View on Explorer</a>
              <Link to="/dapp-dashboard" className="btn btn-outline">Go to Dashboard</Link>
              <button className="btn btn-primary" onClick={resetBuilder}>Deploy Another</button>
            </div>
          </div>
        </div>
      )}
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
