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
import { useEffect, useState } from "react";
import "./styles.css";

const navItems = [
  { label: "Home", to: "/" },
  { label: "Dashboard", to: "/dashboard" },
  { label: "Courses", to: "/courses" },
  { label: "AI Tutor", to: "/ai-tutor" },
  { label: "AI Streaming", to: "/ai-streaming" },
  { label: "Live Session", to: "/live-session" },
  { label: "Revenue", to: "/revenue" },
  { label: "Setup", to: "/session-setup" },
  { label: "Affiliates", to: "/affiliates" },
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

const courseLoads = {
  foundation: {
    label: "Foundation load",
    minutes: 60,
    interval: 12,
    capacity: 180,
    arppu: 3.8,
    focus: "Light onboarding, glossary building, confidence checks",
  },
  standard: {
    label: "Standard load",
    minutes: 90,
    interval: 15,
    capacity: 250,
    arppu: 4.5,
    focus: "Concept walkthrough, guided demos, and learner prompts",
  },
  advanced: {
    label: "Advanced load",
    minutes: 120,
    interval: 20,
    capacity: 420,
    arppu: 5.2,
    focus: "Deeper labs, project critique, and monetization practice",
  },
  intensive: {
    label: "Intensive load",
    minutes: 150,
    interval: 25,
    capacity: 650,
    arppu: 6.1,
    focus: "Cohort sprint, high interaction, and revenue experiments",
  },
};

const learnerProfile = {
  name: "Maya Organic Learner",
  role: "AI + Web3 Builder",
  plan: "Creator Pro",
  streak: 18,
  wallet: "0x9F4...C21",
  notificationEmail: "maya@ccweb.example",
  weeklyGoal: "420 learning minutes",
};

const participationSignals = [
  { label: "Duration of stay", value: 82, detail: "98 of 120 minutes" },
  { label: "Polls and prompts", value: 74, detail: "14 interactions" },
  { label: "Chat contribution", value: 66, detail: "8 helpful messages" },
  { label: "Quiz accuracy", value: 91, detail: "10 of 11 correct" },
];

const activeSessions = [
  {
    id: "room-web3-248",
    title: "AI Web3 Fundamentals Live",
    course: "Blockchain Fundamentals",
    status: "Live",
    progress: 68,
    viewers: 238,
    capacity: 420,
    minutes: 120,
    arppu: 5.2,
    participation: 78,
  },
  {
    id: "room-ai-117",
    title: "AI Automation Lab",
    course: "AI & Machine Learning Basics",
    status: "Starts in 26m",
    progress: 12,
    viewers: 96,
    capacity: 250,
    minutes: 90,
    arppu: 4.8,
    participation: 52,
  },
];

function formatUsd(value) {
  return `$${Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
}

function calculateEstimatedEarnings({ capacity, arppu, minutes, participation }) {
  const expectedAudience = Math.round(Number(capacity) * 0.72);
  const grossRevenue = expectedAudience * Number(arppu);
  const creatorPool = grossRevenue * 0.63;
  const stayWeight = Math.min(Number(minutes) / 120, 1);
  const participationWeight = Number(participation) / 100;
  return creatorPool * (0.55 * stayWeight + 0.45 * participationWeight);
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
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
          <Route path="live-session" element={<LiveSessionPage />} />
          <Route path="revenue" element={<RevenueDashboardPage />} />
          <Route path="session-setup" element={<SessionSetupPage />} />
          <Route path="profile" element={<ProfileSettingsPage />} />
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
            <NavLink to="/profile" className="nav-link">
              Profile
            </NavLink>
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
    <section className="product-page">
      <header className="product-hero">
        <div>
          <span className="pill">AI streaming studio</span>
          <h1 className="section-title">Launch revenue-aware live sessions</h1>
          <p className="muted">
            Configure AI-hosted rooms, auto-balance session load, and preview creator pool economics.
          </p>
        </div>
        <div className="hero-actions compact-actions">
          <Link to="/live-session" className="btn btn-outline">
            Live view
          </Link>
          <Link to="/revenue" className="btn btn-primary">
            Revenue dashboard
          </Link>
        </div>
      </header>

      <div className="studio-layout">
        <article className="panel setup-card">
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

        <article className="panel session-preview-panel">
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

function MetricCard({ label, value, detail }) {
  return (
    <article className="metric-card">
      <span className="eyebrow">{label}</span>
      <strong>{value}</strong>
      <p className="muted">{detail}</p>
    </article>
  );
}

function ProgressBar({ value }) {
  return (
    <div className="progress-track" aria-label={`${value}% complete`}>
      <span style={{ width: `${value}%` }} />
    </div>
  );
}

function DashboardPage() {
  const currentSession = activeSessions[0];
  const estimatedEarnings = calculateEstimatedEarnings(currentSession);

  return (
    <section className="product-page">
      <header className="product-hero">
        <div>
          <span className="pill">User overview</span>
          <h1 className="section-title">Creator dashboard</h1>
          <p className="muted">
            Track learning momentum, live participation, and earnings from one command center.
          </p>
        </div>
        <Link to="/live-session" className="btn btn-primary">
          Join live session
        </Link>
      </header>

      <div className="metric-grid">
        <MetricCard label="Estimated earnings" value={formatUsd(estimatedEarnings)} detail="Auto-calculated from capacity, stay time, and participation." />
        <MetricCard label="Active sessions" value="2" detail="1 live now, 1 starts in 26 minutes." />
        <MetricCard label="Participation score" value="78%" detail="Organic share boosted by prompts and watch time." />
        <MetricCard label="Learning streak" value={`${learnerProfile.streak} days`} detail={learnerProfile.weeklyGoal} />
      </div>

      <div className="dashboard-layout">
        <article className="panel spotlight-panel">
          <span className="badge">{currentSession.status}</span>
          <h3>{currentSession.title}</h3>
          <p className="muted">{currentSession.course}</p>
          <ProgressBar value={currentSession.progress} />
          <div className="session-meta-grid">
            <span>{currentSession.viewers} viewers</span>
            <span>{currentSession.capacity} capacity</span>
            <span>{currentSession.minutes} min</span>
            <span>{currentSession.participation}% participation</span>
          </div>
        </article>

        <article className="panel">
          <h3>Active sessions</h3>
          <div className="stack-list">
            {activeSessions.map((session) => (
              <div className="stack-item" key={session.id}>
                <div>
                  <strong>{session.title}</strong>
                  <p className="muted">{session.status} · {session.viewers}/{session.capacity} seats</p>
                </div>
                <ProgressBar value={session.progress} />
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <h3>Revenue signals</h3>
          <div className="signal-list">
            {participationSignals.map((signal) => (
              <div key={signal.label}>
                <div className="signal-heading">
                  <span>{signal.label}</span>
                  <strong>{signal.value}%</strong>
                </div>
                <ProgressBar value={signal.value} />
                <p className="muted">{signal.detail}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

function LiveSessionPage() {
  return (
    <section className="product-page">
      <header className="product-hero">
        <div>
          <span className="pill">Live session view</span>
          <h1 className="section-title">AI Web3 Fundamentals Live</h1>
          <p className="muted">
            Watch the AI host, ask questions, and track your organic earning score in real time.
          </p>
        </div>
        <span className="live-status">Live now</span>
      </header>

      <div className="live-layout">
        <article className="video-stage">
          <div className="stage-orb">AI</div>
          <h3>Claude-CCWEB-Host is teaching smart contract launch patterns</h3>
          <p className="muted">Segment 3 of 6 · next tutor round in 08:42</p>
          <div className="stage-controls">
            <button type="button" className="btn btn-primary">Ask AI host</button>
            <button type="button" className="btn btn-outline">Raise hand</button>
            <button type="button" className="btn btn-outline">Save clip</button>
          </div>
        </article>

        <aside className="interaction-panel">
          <h3>Chat + interaction</h3>
          <div className="chat-feed">
            <p><strong>Amina:</strong> Can you compare gas fees across chains?</p>
            <p><strong>AI Host:</strong> Yes. Start with finality, congestion, and validator incentives.</p>
            <p><strong>Maya:</strong> I pushed a checklist into my project notes.</p>
          </div>
          <div className="chat-composer">
            <input aria-label="Message" placeholder="Ask a question or share progress" />
            <button type="button" className="btn btn-primary">Send</button>
          </div>
        </aside>

        <article className="panel participation-panel">
          <h3>Participation tracking</h3>
          {participationSignals.map((signal) => (
            <div key={signal.label}>
              <div className="signal-heading">
                <span>{signal.label}</span>
                <strong>{signal.value}%</strong>
              </div>
              <ProgressBar value={signal.value} />
            </div>
          ))}
        </article>
      </div>
    </section>
  );
}

function RevenueDashboardPage() {
  const capacity = 420;
  const expectedAudience = Math.round(capacity * 0.72);
  const grossRevenue = expectedAudience * 5.2;
  const creatorPool = grossRevenue * 0.63;
  const organicShare = creatorPool * 0.78;

  return (
    <section className="product-page">
      <header className="product-hero">
        <div>
          <span className="pill">Revenue dashboard</span>
          <h1 className="section-title">Organic revenue sharing</h1>
          <p className="muted">
            Earnings update from session capacity, expected ARPPU, duration of stay, and participation quality.
          </p>
        </div>
        <Link to="/session-setup" className="btn btn-primary">Plan next session</Link>
      </header>

      <div className="metric-grid">
        <MetricCard label="Expected audience" value={expectedAudience.toLocaleString()} detail={`${capacity} capacity at 72% utilization.`} />
        <MetricCard label="Estimated gross" value={formatUsd(grossRevenue)} detail="$5.20 expected ARPPU." />
        <MetricCard label="Creator pool" value={formatUsd(creatorPool)} detail="63% after CCWEB platform share." />
        <MetricCard label="Your organic share" value={formatUsd(organicShare)} detail="Weighted by stay duration and participation." />
      </div>

      <div className="revenue-layout">
        <article className="panel">
          <h3>Organic share formula</h3>
          <div className="formula-card">
            <strong>Creator pool x (55% stay duration + 45% participation)</strong>
            <p className="muted">
              Duration rewards learners who stay through the lesson. Participation rewards useful chat, polls, prompts, and quiz accuracy.
            </p>
          </div>
        </article>
        <article className="panel">
          <h3>Distribution factors</h3>
          <div className="signal-list">
            {participationSignals.map((signal) => (
              <div key={signal.label}>
                <div className="signal-heading">
                  <span>{signal.label}</span>
                  <strong>{signal.value}%</strong>
                </div>
                <ProgressBar value={signal.value} />
                <p className="muted">{signal.detail}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

function SessionSetupPage() {
  const [load, setLoad] = useState("standard");
  const selectedLoad = courseLoads[load];
  const expectedAudience = Math.round(selectedLoad.capacity * 0.72);
  const estimatedGross = expectedAudience * selectedLoad.arppu;

  return (
    <section className="product-page">
      <header className="product-hero">
        <div>
          <span className="pill">Course/session setup</span>
          <h1 className="section-title">Build an AI streaming session</h1>
          <p className="muted">
            Select a course load and the system auto-adjusts duration, tutor cadence, capacity, and revenue estimates.
          </p>
        </div>
        <Link to="/ai-streaming" className="btn btn-primary">Create via API flow</Link>
      </header>

      <div className="setup-layout">
        <article className="panel">
          <h3>Course load</h3>
          <div className="auth-row">
            <label htmlFor="setup-course">Course</label>
            <select id="setup-course" defaultValue="Blockchain Fundamentals">
              {courses.map((course) => (
                <option key={course.id}>{course.title}</option>
              ))}
            </select>
          </div>
          <div className="auth-row">
            <label htmlFor="setup-load">Course load</label>
            <select id="setup-load" value={load} onChange={(event) => setLoad(event.target.value)}>
              {Object.entries(courseLoads).map(([key, item]) => (
                <option key={key} value={key}>{item.label}</option>
              ))}
            </select>
          </div>
          <p className="muted">{selectedLoad.focus}</p>
        </article>

        <article className="panel setup-preview">
          <h3>Auto-adjusted session</h3>
          <div className="metric-grid compact">
            <MetricCard label="Duration" value={`${selectedLoad.minutes} min`} detail={`Tutor every ${selectedLoad.interval} min.`} />
            <MetricCard label="Capacity" value={selectedLoad.capacity.toLocaleString()} detail={`${expectedAudience} expected audience.`} />
            <MetricCard label="ARPPU" value={`$${selectedLoad.arppu.toFixed(2)}`} detail="Course-load estimate." />
            <MetricCard label="Gross estimate" value={formatUsd(estimatedGross)} detail="Before revenue split." />
          </div>
        </article>
      </div>
    </section>
  );
}

function ProfileSettingsPage() {
  return (
    <section className="product-page">
      <header className="product-hero">
        <div>
          <span className="pill">Profile & settings</span>
          <h1 className="section-title">{learnerProfile.name}</h1>
          <p className="muted">{learnerProfile.role} · {learnerProfile.plan}</p>
        </div>
        <button type="button" className="btn btn-primary">Save settings</button>
      </header>

      <div className="profile-layout">
        <article className="panel">
          <h3>Account</h3>
          <div className="auth-row">
            <label htmlFor="profile-name">Display name</label>
            <input id="profile-name" defaultValue={learnerProfile.name} />
          </div>
          <div className="auth-row">
            <label htmlFor="profile-email">Notification email</label>
            <input id="profile-email" defaultValue={learnerProfile.notificationEmail} />
          </div>
          <div className="auth-row">
            <label htmlFor="profile-goal">Weekly goal</label>
            <input id="profile-goal" defaultValue={learnerProfile.weeklyGoal} />
          </div>
        </article>

        <article className="panel">
          <h3>Revenue profile</h3>
          <p><strong>Wallet:</strong> {learnerProfile.wallet}</p>
          <p><strong>Default share model:</strong> Organic participation weighted</p>
          <p><strong>Payout preference:</strong> Monthly stablecoin settlement</p>
          <div className="pill-row">
            <span className="tiny-pill">Duration tracking</span>
            <span className="tiny-pill">Chat quality</span>
            <span className="tiny-pill">Quiz scoring</span>
          </div>
        </article>
      </div>
    </section>
  );
}

export default App;
