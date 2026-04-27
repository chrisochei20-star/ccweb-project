import { useState, useEffect, useRef } from "react";
import { Radio, Users, Clock, DollarSign, Play, Square, Plus, ChevronRight, Send, Mic, MicOff, Video, VideoOff, Settings, TrendingUp, BookOpen, Zap, RefreshCw, CircleAlert as AlertCircle } from "lucide-react";
import Button from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Input, { Select } from "../components/ui/Input";
import StatCard from "../components/ui/StatCard";
import ProgressBar from "../components/ui/ProgressBar";
import { Tabs, TabPanel } from "../components/ui/Tabs";

const CURRICULUM_OPTIONS = ["AI", "Blockchain", "Web3", "Crypto", "Business", "Finance"];

const COURSE_LOADS = [
  { value: "foundation", label: "Foundation", minutes: 60, interval: 12 },
  { value: "standard", label: "Standard", minutes: 90, interval: 15 },
  { value: "advanced", label: "Advanced", minutes: 120, interval: 20 },
  { value: "intensive", label: "Intensive", minutes: 150, interval: 25 },
  { value: "marathon", label: "Marathon", minutes: 180, interval: 30 },
];

const ARPPU_BY_CURRICULUM = { AI: 5.2, Blockchain: 5.1, Web3: 4.9, Crypto: 5.4, Business: 4.6, Finance: 4.5 };

function curriculumTracks(c) {
  const map = {
    AI: ["AI Foundations", "Machine Learning", "Digital Business Systems"],
    Blockchain: ["Blockchain Fundamentals", "Smart Contracts", "Web3 Product Development"],
    Web3: ["Web3 Product Development", "Smart Contracts", "Digital Business Systems"],
    Crypto: ["Crypto Markets", "Blockchain Fundamentals", "Financial Literacy"],
    Business: ["Digital Business Systems", "Financial Literacy", "AI Foundations"],
    Finance: ["Financial Literacy", "Digital Business Systems", "AI Foundations"],
  };
  return map[c] || map.AI;
}

const mockChatMessages = [
  { id: 1, user: "Maya O.", text: "Love this session! So clear.", time: "2m ago", organic: true },
  { id: 2, user: "Ahmad K.", text: "Can you cover yield farming next?", time: "3m ago", organic: false },
  { id: 3, user: "Priya S.", text: "The AI host explanation was great", time: "5m ago", organic: true },
  { id: 4, user: "System", text: "New participant joined the session", time: "6m ago", system: true },
];

function LiveSessionPanel({ room, onLeave, onFinish, joinLoading }) {
  const [messages, setMessages] = useState(mockChatMessages);
  const [newMsg, setNewMsg] = useState("");
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const chatRef = useRef(null);

  function sendMessage(e) {
    e.preventDefault();
    if (!newMsg.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), user: "You", text: newMsg.trim(), time: "just now" },
    ]);
    setNewMsg("");
    setTimeout(() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" }), 50);
  }

  const metrics = room?.metrics || {};
  const schedule = room?.tutoringSchedule || {};
  const config = room?.configuration || {};

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 animate-fade-in">
      {/* Main stream area */}
      <div className="xl:col-span-2 space-y-4">
        {/* Stream viewer */}
        <div className="relative rounded-2xl bg-surface-900 border border-white/[0.06] overflow-hidden aspect-video flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-surface-800 via-surface-900 to-surface-950" />
          <div className="relative z-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center mx-auto mb-4">
              <Radio size={28} className="text-brand-cyan" />
            </div>
            <p className="text-slate-200 font-semibold">{room?.roomName || "Live Session"}</p>
            <p className="text-sm text-slate-500 mt-1">{room?.aiHost?.displayName || "AI Host"}</p>
          </div>

          {/* Status overlay */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <Badge variant="live" dot>LIVE</Badge>
            <Badge variant="default">
              <Users size={11} className="mr-1" />
              {metrics.activeAttenders || 0} watching
            </Badge>
          </div>

          {/* Controls overlay */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMuted((v) => !v)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${muted ? "bg-brand-red text-white" : "bg-surface-700/90 text-slate-300 hover:bg-surface-600"}`}
            >
              {muted ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            <button
              type="button"
              onClick={() => setVideoOff((v) => !v)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${videoOff ? "bg-brand-red text-white" : "bg-surface-700/90 text-slate-300 hover:bg-surface-600"}`}
            >
              {videoOff ? <VideoOff size={16} /> : <Video size={16} />}
            </button>
            <Button variant="danger" size="sm" leftIcon={<Square size={13} />} onClick={onFinish} loading={joinLoading}>
              End Session
            </Button>
          </div>
        </div>

        {/* Session stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Viewers" value={metrics.activeAttenders || 0} icon={<Users size={14} />} color="cyan" />
          <StatCard label="Organic" value={metrics.activeOrganicAttenders || 0} icon={<TrendingUp size={14} />} color="green" />
          <StatCard label="Duration" value={`${schedule.expectedSessionMinutes || 0}m`} icon={<Clock size={14} />} color="amber" />
          <StatCard label="Rounds" value={schedule.estimatedSegments || 0} icon={<BookOpen size={14} />} color="blue" />
        </div>

        {/* Curriculum coverage */}
        <Card>
          <CardHeader>
            <h4 className="text-sm font-semibold text-slate-200">Curriculum Coverage</h4>
          </CardHeader>
          <CardBody className="space-y-3">
            {(room?.aiHost?.curriculumCoverage || ["AI Foundations", "Machine Learning"]).map((track, i) => (
              <ProgressBar
                key={track}
                label={track}
                value={Math.max(20, 100 - i * 25)}
                color={i === 0 ? "cyan" : i === 1 ? "green" : "blue"}
                showValue
              />
            ))}
          </CardBody>
        </Card>
      </div>

      {/* Chat + interaction */}
      <div className="flex flex-col rounded-2xl bg-surface-800/60 border border-white/[0.06] overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.05] flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-200">Live Chat</h4>
          <Badge variant="cyan">{messages.length}</Badge>
        </div>

        <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" style={{ maxHeight: "400px" }}>
          {messages.map((msg) => (
            <div key={msg.id} className={`${msg.system ? "text-center" : ""}`}>
              {msg.system ? (
                <p className="text-[11px] text-slate-600 bg-surface-900/50 rounded-full px-3 py-1 inline-block">{msg.text}</p>
              ) : (
                <div className="flex gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-cyan/30 to-blue-500/30 border border-brand-cyan/20 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-xs font-semibold ${msg.organic ? "text-brand-cyan" : "text-slate-300"}`}>{msg.user}</span>
                      {msg.organic && <span className="text-[10px] text-brand-green">organic</span>}
                      <span className="text-[11px] text-slate-600">{msg.time}</span>
                    </div>
                    <p className="text-sm text-slate-300 mt-0.5">{msg.text}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <form onSubmit={sendMessage} className="p-3 border-t border-white/[0.05] flex gap-2">
          <input
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            placeholder="Send a message..."
            className="flex-1 bg-surface-900 border border-white/[0.06] rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-cyan/30 transition-all"
          />
          <Button type="submit" variant="primary" size="sm" className="shrink-0">
            <Send size={14} />
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function Streaming() {
  const [tab, setTab] = useState("setup");
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [activeRoom, setActiveRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [error, setError] = useState("");
  const [payout, setPayout] = useState(null);

  const [form, setForm] = useState({
    roomTitle: "AI Web3 Fundamentals Live",
    curriculum: "AI",
    courseLoad: "standard",
    sessionCapacity: 250,
    hostModel: "Claude-CCWEB-Host",
    hostLocale: "English",
    expectedAudience: 180,
    expectedArppuUsd: 5.2,
    platformSharePercent: 37,
    expectedSessionMinutes: 90,
    tutoringIntervalMinutes: 15,
  });

  const selectedLoad = COURSE_LOADS.find((l) => l.value === form.courseLoad) || COURSE_LOADS[1];
  const estimatedGross = (form.expectedAudience * form.expectedArppuUsd).toFixed(2);
  const platformRev = (estimatedGross * (form.platformSharePercent / 100)).toFixed(2);
  const creatorRev = (estimatedGross - platformRev).toFixed(2);

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function loadRooms() {
    try {
      const r = await fetch("/api/streaming/rooms");
      const d = await r.json();
      setRooms(d.rooms || []);
    } catch {}
  }

  useEffect(() => { loadRooms(); }, []);

  async function createRoom() {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/streaming/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomName: form.roomTitle,
          topic: `${form.curriculum} live masterclass`,
          city: "Global",
          region: form.hostLocale,
          createdBy: "ccweb-stream-studio",
          aiHostName: form.hostModel,
          curriculumTracks: curriculumTracks(form.curriculum),
          platformRevenueSharePercent: Number(form.platformSharePercent),
          courseLoad: form.courseLoad,
          sessionCapacity: Number(form.sessionCapacity),
          expectedSessionMinutes: Number(form.expectedSessionMinutes),
          tutoringIntervalMinutes: Number(form.tutoringIntervalMinutes),
          agenda: [
            { title: `${form.curriculum} foundations`, durationMinutes: Math.round(form.expectedSessionMinutes * 0.45) },
            { title: `${form.curriculum} practical`, durationMinutes: Math.round(form.expectedSessionMinutes * 0.35) },
            { title: "Q&A", durationMinutes: Math.round(form.expectedSessionMinutes * 0.2) },
          ],
        }),
      });
      const roomData = await r.json();
      if (!r.ok) throw new Error(roomData.error || "Could not create room.");

      const pr = await fetch("/api/streaming/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: roomData.id,
          periodLabel: "Live cycle",
          grossRevenueUsd: Number(estimatedGross),
          platformRevenueSharePercent: Number(form.platformSharePercent),
        }),
      });
      const payoutData = await pr.json();
      setPayout(payoutData);
      setActiveRoom(roomData);
      setSelectedRoomId(roomData.id);
      await loadRooms();
      setTab("live");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function finishRoom() {
    if (!selectedRoomId) return;
    setJoinLoading(true);
    try {
      const r = await fetch(`/api/streaming/rooms/${selectedRoomId}/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finishedBy: "ccweb-stream-studio" }),
      });
      const d = await r.json();
      if (d.room) setActiveRoom(d.room);
      await loadRooms();
      setTab("rooms");
    } catch (e) {
      setError(e.message);
    } finally {
      setJoinLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">AI Streaming Studio</h2>
          <p className="text-sm text-slate-500 mt-0.5">Create and manage live AI-hosted sessions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" leftIcon={<RefreshCw size={14} />} onClick={loadRooms}>
            Refresh
          </Button>
          {tab !== "live" && (
            <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setTab("setup")}>
              New Session
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: "setup", label: "Setup", icon: <Settings size={14} /> },
          { id: "live", label: "Live Session", icon: <Radio size={14} /> },
          { id: "rooms", label: "All Rooms", badge: rooms.length, icon: <Users size={14} /> },
        ]}
        defaultTab={tab}
        onChange={setTab}
      />

      {/* Setup tab */}
      {tab === "setup" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-slide-up">
          {/* Form */}
          <div className="lg:col-span-3 space-y-5">
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-slate-200">Session Configuration</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <Input
                  label="Room Title"
                  value={form.roomTitle}
                  onChange={(e) => updateForm("roomTitle", e.target.value)}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Curriculum"
                    value={form.curriculum}
                    onChange={(e) => {
                      updateForm("curriculum", e.target.value);
                      updateForm("expectedArppuUsd", ARPPU_BY_CURRICULUM[e.target.value] || 4.5);
                    }}
                  >
                    {CURRICULUM_OPTIONS.map((c) => <option key={c}>{c}</option>)}
                  </Select>
                  <Select
                    label="Course Load"
                    value={form.courseLoad}
                    onChange={(e) => {
                      const load = COURSE_LOADS.find((l) => l.value === e.target.value);
                      updateForm("courseLoad", e.target.value);
                      if (load) {
                        updateForm("expectedSessionMinutes", load.minutes);
                        updateForm("tutoringIntervalMinutes", load.interval);
                      }
                    }}
                  >
                    {COURSE_LOADS.map((l) => <option key={l.value} value={l.value}>{l.label} ({l.minutes}m)</option>)}
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Session Capacity"
                    type="number"
                    min="20"
                    value={form.sessionCapacity}
                    onChange={(e) => {
                      updateForm("sessionCapacity", Number(e.target.value));
                      updateForm("expectedAudience", Math.round(Number(e.target.value) * 0.72));
                    }}
                  />
                  <Input
                    label="Expected Audience"
                    type="number"
                    value={form.expectedAudience}
                    onChange={(e) => updateForm("expectedAudience", Number(e.target.value))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="AI Host Model"
                    value={form.hostModel}
                    onChange={(e) => updateForm("hostModel", e.target.value)}
                  />
                  <Input
                    label="Host Locale"
                    value={form.hostLocale}
                    onChange={(e) => updateForm("hostLocale", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="ARPPU (USD)"
                    type="number"
                    step="0.1"
                    value={form.expectedArppuUsd}
                    onChange={(e) => updateForm("expectedArppuUsd", Number(e.target.value))}
                  />
                  <Input
                    label="Platform Share %"
                    type="number"
                    min="35"
                    max="40"
                    value={form.platformSharePercent}
                    onChange={(e) => updateForm("platformSharePercent", Number(e.target.value))}
                  />
                  <Input
                    label="Tutor Interval (m)"
                    type="number"
                    value={form.tutoringIntervalMinutes}
                    onChange={(e) => updateForm("tutoringIntervalMinutes", Number(e.target.value))}
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-brand-red/10 border border-brand-red/20 text-brand-red text-sm">
                    <AlertCircle size={15} />
                    {error}
                  </div>
                )}

                <Button variant="primary" className="w-full" onClick={createRoom} loading={loading} leftIcon={<Play size={15} />}>
                  Create AI Live Room
                </Button>
              </CardBody>
            </Card>
          </div>

          {/* Revenue preview */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-slate-200">Revenue Preview</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="p-4 rounded-xl bg-surface-900 border border-white/[0.05] space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Estimated Gross</span>
                    <span className="text-slate-100 font-semibold font-mono">${Number(estimatedGross).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Platform ({form.platformSharePercent}%)</span>
                    <span className="text-brand-amber font-mono">-${Number(platformRev).toLocaleString()}</span>
                  </div>
                  <div className="border-t border-white/[0.06] pt-3 flex justify-between text-sm font-semibold">
                    <span className="text-slate-300">Creator Pool</span>
                    <span className="text-brand-green font-mono text-base">${Number(creatorRev).toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Platform revenue</span>
                    <span>{form.platformSharePercent}%</span>
                  </div>
                  <ProgressBar value={form.platformSharePercent} max={100} color="amber" />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Creator pool</span>
                    <span>{100 - form.platformSharePercent}%</span>
                  </div>
                  <ProgressBar value={100 - form.platformSharePercent} max={100} color="green" />
                </div>

                <div className="pt-2 space-y-1.5">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Session Info</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                    <span>Duration: <strong className="text-slate-200">{form.expectedSessionMinutes}m</strong></span>
                    <span>Interval: <strong className="text-slate-200">{form.tutoringIntervalMinutes}m</strong></span>
                    <span>Capacity: <strong className="text-slate-200">{form.sessionCapacity}</strong></span>
                    <span>Expected: <strong className="text-slate-200">{form.expectedAudience}</strong></span>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-2">Curriculum Tracks</p>
                  <div className="flex flex-wrap gap-1.5">
                    {curriculumTracks(form.curriculum).map((t) => (
                      <Badge key={t} variant="cyan">{t}</Badge>
                    ))}
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-start gap-3">
                  <Zap size={16} className="text-brand-amber mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-slate-200 mb-1">Organic Revenue Sharing</p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Revenue is distributed to organic participants based on watch duration and participation level.
                      Longer sessions and active participants earn more.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* Live tab */}
      {tab === "live" && (
        activeRoom ? (
          <LiveSessionPanel
            room={activeRoom}
            onFinish={finishRoom}
            joinLoading={joinLoading}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-surface-800 border border-white/[0.06] flex items-center justify-center mb-4">
              <Radio size={24} className="text-slate-500" />
            </div>
            <p className="text-slate-400 mb-4">No active session. Create one first.</p>
            <Button variant="primary" onClick={() => setTab("setup")} leftIcon={<Plus size={14} />}>
              Create Session
            </Button>
          </div>
        )
      )}

      {/* Rooms tab */}
      {tab === "rooms" && (
        <div className="space-y-3 animate-fade-in">
          {rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-slate-500 mb-4">No rooms yet.</p>
              <Button variant="primary" onClick={() => setTab("setup")} leftIcon={<Plus size={14} />}>Create first room</Button>
            </div>
          ) : (
            rooms.map((room) => (
              <div
                key={room.id}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 hover:border-white/[0.10] cursor-pointer
                  ${room.id === selectedRoomId ? "bg-surface-700/60 border-brand-cyan/20" : "bg-surface-800/50 border-white/[0.05]"}`}
                onClick={() => { setSelectedRoomId(room.id); setActiveRoom(room); setTab("live"); }}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${room.status === "active" ? "bg-brand-green/15" : "bg-surface-700"}`}>
                  <Radio size={17} className={room.status === "active" ? "text-brand-green" : "text-slate-500"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-slate-200 truncate">{room.roomName}</p>
                    <Badge variant={room.status === "active" ? "live" : "default"} dot={room.status === "active"}>
                      {room.status === "active" ? "LIVE" : room.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{room.topic}</span>
                    <span className="flex items-center gap-1"><Users size={11} /> {room.metrics?.activeAttenders || 0}</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-600 shrink-0" />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
