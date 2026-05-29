import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useOutletContext,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { Suspense, lazy, useEffect, useState } from "react";
import { GrowthHubPage } from "./GrowthHubPage";
import { MobileLayout } from "./layout/MobileLayout";
import { ProtectedLayout } from "./layout/ProtectedLayout";
import { LoginPage, SignupPage } from "./pages/AuthPages";
import { Skeleton } from "./components/ui/Skeleton";
import { CcwebBrandMark } from "./components/brand/CcwebBrandMark";
import { CcwebErrorBoundary } from "./components/CcwebErrorBoundary";
import { AiSurfaceErrorBoundary } from "./components/ai/AiSurfaceErrorBoundary";
import { BetaInvitePage, BetaTestUserPage, BetaUserSlugPage } from "./pages/BetaPages";
import { apiUrl } from "./config/env";
import { apiFetch } from "./lib/apiClient";
import { ApiErrorPanel } from "./components/ui/ApiErrorPanel";
import { useStaleLoadingGuard } from "./hooks/useStaleLoadingGuard";

const CommunityShellPage = lazy(() => import("./pages/CommunityShellPage").then((m) => ({ default: m.CommunityShellPage })));
const ChatPage = lazy(() => import("./pages/ChatPage").then((m) => ({ default: m.ChatPage })));
const ProfileShellPage = lazy(() => import("./pages/ProfileShellPage").then((m) => ({ default: m.ProfileShellPage })));
const AiTutorPage = lazy(() => import("./pages/AiTutorPage").then((m) => ({ default: m.AiTutorPage })));
const BuildHubPage = lazy(() => import("./pages/BuildHubPage").then((m) => ({ default: m.BuildHubPage })));
const EarnShellPage = lazy(() => import("./pages/EarnShellPage").then((m) => ({ default: m.EarnShellPage })));
const LearnShellPage = lazy(() => import("./pages/LearnShellPage").then((m) => ({ default: m.LearnShellPage })));
const MobileDashboardPage = lazy(() => import("./pages/MobileDashboardPage").then((m) => ({ default: m.MobileDashboardPage })));
const NotificationCenterPage = lazy(() =>
  import("./components/notifications/NotificationCenter").then((m) => ({ default: m.NotificationCenterPage }))
);
const SettingsPage = lazy(() => import("./pages/SettingsPage").then((m) => ({ default: m.SettingsPage })));
const CourseAdminDashboard = lazy(() => import("./pages/CourseAdminDashboard").then((m) => ({ default: m.CourseAdminDashboard })));
const CourseCatalogPage = lazy(() => import("./pages/CourseCatalogPage").then((m) => ({ default: m.CourseCatalogPage })));
const CourseDetailPage = lazy(() => import("./pages/CourseDetailPage").then((m) => ({ default: m.CourseDetailPage })));
const CourseLessonPage = lazy(() => import("./pages/CourseLessonPage").then((m) => ({ default: m.CourseLessonPage })));
const LearningAdminPage = lazy(() => import("./learning/LearningAdminPage").then((m) => ({ default: m.LearningAdminPage })));
const LearningSessionPage = lazy(() => import("./learning/LearningSessionPage").then((m) => ({ default: m.LearningSessionPage })));

const FindPage = lazy(() => import("./pages/FindPage").then((m) => ({ default: m.FindPage })));
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
const TokenDetailPage = lazy(() => import("./TokenDetailPage").then((m) => ({ default: m.TokenDetailPage })));

function RouteFallback() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-5 px-4 py-16">
      <div className="ccweb-glass ccweb-card-premium w-full max-w-sm rounded-3xl p-8">
        <CcwebBrandMark size={56} className="mx-auto" showGlow />
        <Skeleton className="mx-auto mt-5 h-6 w-44 rounded-lg" />
        <Skeleton className="mx-auto mt-3 h-3 w-full max-w-[220px] rounded-md" />
        <div className="mt-6 space-y-2">
          <Skeleton className="h-3 w-full rounded-md" />
          <Skeleton className="h-3 w-[88%] rounded-md" />
        </div>
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-ccweb-muted">Loading experience…</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <CcwebErrorBoundary>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
        <Route element={<MobileLayout />}>
          <Route path="invite/:code" element={<BetaInvitePage />} />
          <Route path="u/:slug" element={<BetaUserSlugPage />} />
          <Route path="test/:userId" element={<BetaTestUserPage />} />
          <Route index element={<MobileDashboardPage />} />
          <Route path="learn" element={<LearnShellPage />} />
          <Route path="learn/session/:roomId" element={<LearningSessionPage />} />
          <Route path="find" element={<AiSurfaceErrorBoundary><FindPage /></AiSurfaceErrorBoundary>} />
          <Route path="crypto-scanner" element={<AiSurfaceErrorBoundary><FindPage initialTab="scanner" /></AiSurfaceErrorBoundary>} />
          <Route path="crypto/trending" element={<AiSurfaceErrorBoundary><FindPage initialTab="trending" /></AiSurfaceErrorBoundary>} />
          <Route path="crypto/early-signals" element={<AiSurfaceErrorBoundary><FindPage initialTab="signals" /></AiSurfaceErrorBoundary>} />
          <Route path="crypto/wallets" element={<AiSurfaceErrorBoundary><FindPage initialTab="wallets" /></AiSurfaceErrorBoundary>} />
          <Route path="build" element={<BuildHubPage />} />
          <Route path="earn" element={<EarnShellPage />} />
          <Route path="community" element={<CommunityShellPage />} />
          <Route path="notifications" element={<NotificationCenterPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route element={<ProtectedLayout />}>
            <Route path="profile" element={<ProfileShellPage />} />
            <Route path="messages" element={<ChatPage />} />
            <Route path="learn/admin" element={<LearningAdminPage />} />
            <Route path="learn/admin/courses" element={<CourseAdminDashboard />} />
          </Route>
          <Route path="marketplace" element={<GrowthHubPage initialTab="marketplace" />} />
          <Route path="escrow" element={<GrowthHubPage initialTab="escrow" />} />
          <Route path="courses" element={<CourseCatalogPage />} />
          <Route path="courses/:slug/lesson/:lessonId" element={<CourseLessonPage />} />
          <Route path="courses/:slug" element={<CourseDetailPage />} />
          <Route path="ai-tutor" element={<AiSurfaceErrorBoundary><AiTutorPage /></AiSurfaceErrorBoundary>} />
          <Route path="ai-streaming" element={<AiStreamingPage />} />
          <Route path="early-signals" element={<AiSurfaceErrorBoundary><EarlySignalsDashboard /></AiSurfaceErrorBoundary>} />
          <Route path="token/:slug" element={<TokenDetailPage />} />
          <Route path="developers" element={<DeveloperPlatformPage />} />
          <Route path="developers/onboarding" element={<DeveloperOnboardingPage />} />
          <Route path="dapp-builder" element={<VisualDappBuilderPage />} />
          <Route path="dapp-dashboard" element={<DappDashboardPage />} />
          <Route path="ai-agents" element={<AiAgentsPage />} />
          <Route path="growth-hub" element={<GrowthHubPage />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="tokens" element={<Navigate to="/earn" replace />} />
          <Route path="affiliates" element={<Navigate to="/earn" replace />} />
          <Route path="blog" element={<BlogPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="faq" element={<FaqPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="signup" element={<SignupPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="dashboard" element={<Navigate to="/" replace />} />
          <Route path="verify-email" element={<VerifyEmailPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="welcome" element={<HomePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
          </Routes>
        </Suspense>
      </CcwebErrorBoundary>
    </BrowserRouter>
  );
}

function HomePage() {
  return (
    <section className="hero">
      <span className="pill">AI-Powered Web3 Academy &amp; Business Engine</span>
      <h1 className="hero-title">
        <span className="accent-cyan">Learn.</span>{" "}
        <span className="accent-violet">Find.</span>
        <br />
        <span className="accent-green">Build.</span>{" "}
        <span className="accent-cyan">Earn.</span>
      </h1>
      <p className="hero-subtitle">
        CCWEB combines AI-powered education, crypto intelligence, decentralized app
        deployment, and real revenue streams — all in one platform.
      </p>
      <div className="hero-actions">
        <Link to="/signup" className="btn btn-primary">
          Get Started Free
        </Link>
        <Link to="/find" className="btn btn-outline">
          Explore Intelligence
        </Link>
      </div>
      <div className="stats-grid">
        <StatCard value="50K+" label="Learners" />
        <StatCard value="200+" label="AI Courses" />
        <StatCard value="8" label="DApp Templates" />
        <StatCard value="99.9%" label="Uptime" />
      </div>

      <div className="pillars-grid">
        <Link to="/courses" className="pillar-card pillar-learn">
          <div className="pillar-icon">🧠</div>
          <h3>LEARN</h3>
          <p>AI-powered academy with live streaming sessions, adaptive tutoring, quizzes, and session memory.</p>
          <span className="pillar-link">Explore Courses →</span>
        </Link>
        <Link to="/find" className="pillar-card pillar-find">
          <div className="pillar-icon">🔍</div>
          <h3>FIND</h3>
          <p>Crypto Safety Scanner, Early Signals Dashboard, Smart Money Tracking, and narrative detection.</p>
          <span className="pillar-link">View Intelligence →</span>
        </Link>
        <Link to="/build" className="pillar-card pillar-build">
          <div className="pillar-icon">🏗️</div>
          <h3>BUILD</h3>
          <p>DApp Builder, AI Agents, Business Automation Hub, and workflow operator system.</p>
          <span className="pillar-link">Start Building →</span>
        </Link>
        <Link to="/marketplace" className="pillar-card pillar-build" style={{ borderStyle: "dashed", opacity: 0.95 }}>
          <div className="pillar-icon">🌍</div>
          <h3>MARKETPLACE</h3>
          <p>Global marketing agent, business listings, escrow pay-on-delivery, and lead engine — organic-first.</p>
          <span className="pillar-link">Open marketplace →</span>
        </Link>
        <Link to="/earn" className="pillar-card pillar-earn">
          <div className="pillar-icon">💰</div>
          <h3>EARN</h3>
          <p>Affiliate revenue, streaming income, referral commissions, and skill-based payouts.</p>
          <span className="pillar-link">Start Earning →</span>
        </Link>
      </div>
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
      const res = await apiFetch(apiUrl("/api/streaming/rooms"));
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
      const res = await apiFetch(apiUrl("/api/streaming/rooms"), {
        method: "POST",
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

      const payoutRes = await apiFetch(apiUrl("/api/streaming/payouts"), {
        method: "POST",
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
      const res = await apiFetch(apiUrl(`/api/streaming/rooms/${selectedRoomId}/attendance`), {
        method: "POST",
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
      const res = await apiFetch(apiUrl(`/api/streaming/rooms/${selectedRoomId}/attendance`), {
        method: "POST",
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
      const res = await apiFetch(apiUrl(`/api/streaming/rooms/${selectedRoomId}/finish`), {
        method: "POST",
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

function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [pending, setPending] = useState(true);
  const token = searchParams.get("token") || searchParams.get("t");

  useEffect(() => {
    if (!token) {
      setErr("Missing verification token. Open the full link from your email.");
      setPending(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(apiUrl(`/api/auth/verify-email?token=${encodeURIComponent(token)}`));
        const data = await res.json();
        if (cancelled) return;
        if (res.ok) setMsg("Your email is verified. You can continue using the app.");
        else setErr(data.error || "Verification failed.");
      } catch (e) {
        if (!cancelled) setErr(e.message || "Request failed.");
      } finally {
        if (!cancelled) setPending(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <section className="auth-card">
      <h1 className="section-title">Email verification</h1>
      {pending && !err && <p className="muted">Verifying…</p>}
      {msg && <p style={{ color: "#4ade80" }}>{msg}</p>}
      {err && <p style={{ color: "#f87171" }}>{err}</p>}
      <p className="muted" style={{ marginTop: "1rem" }}>
        <Link to="/login">Back to sign in</Link>
      </p>
    </section>
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
      const res = await apiFetch(apiUrl("/api/auth/password/request"), {
        method: "POST",
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
      const res = await apiFetch(apiUrl("/api/auth/password/reset"), {
        method: "POST",
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
        Request a secure reset for your account. If <code>AUTH_DEBUG=1</code> is enabled on the API, the
        response may include a dev token for the next step.
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
          Send reset request
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


function AiAgentsPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadErr(null);
      try {
        const res = await apiFetch(apiUrl("/api/build/agents"), {}, { timeoutMs: 8000 });
        const d = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) throw new Error(d.error || "Could not load agents");
        setAgents(d.agents || []);
      } catch (e) {
        if (!cancelled) {
          setLoadErr(e?.name === "AbortError" ? "Loading timed out. Try again." : e.message || "Could not load agents");
          setAgents([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
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
      {loadErr && !loading && (
        <ApiErrorPanel message={loadErr} onRetry={() => window.location.reload()} className="mb-4" />
      )}

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

function DappDashboardPage() {
  const [stats, setStats] = useState(null);
  const [deployments, setDeployments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const loadStalled = useStaleLoadingGuard(loading);
  const [expandedDeploy, setExpandedDeploy] = useState(null);

  async function loadAll() {
    setLoading(true);
    try {
      const [statsRes, deploymentsRes, txRes] = await Promise.all([
        apiFetch(apiUrl("/api/dapp/dashboard"), {}, { timeoutMs: 8000 }).then((r) => r.json()),
        apiFetch(apiUrl("/api/dapp/deployments"), {}, { timeoutMs: 8000 }).then((r) => r.json()),
        apiFetch(apiUrl("/api/dapp/transactions"), {}, { timeoutMs: 8000 }).then((r) => r.json()),
      ]);
      setStats(statsRes);
      setDeployments(deploymentsRes.deployments || []);
      setTransactions(txRes.transactions || []);
    } catch {
      /* ignore */
    }
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

      {loading && loadStalled && (
        <p className="muted" style={{ textAlign: "center", padding: "2rem", color: "#f87171" }}>
          Dashboard data is taking too long to load. Check your connection and use Refresh.
        </p>
      )}
      {loading && !loadStalled && (
        <p className="muted" style={{ textAlign: "center", padding: "2rem" }}>
          Loading dashboard...
        </p>
      )}

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
