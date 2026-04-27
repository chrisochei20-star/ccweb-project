import { useState, useEffect } from "react";
import { ChartBar as BarChart3, TrendingUp, Users, Radio, BookOpen, Zap, ArrowRight, Clock, Star, DollarSign, Activity, CirclePlay as PlayCircle } from "lucide-react";
import { Link } from "react-router-dom";
import StatCard from "../components/ui/StatCard";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import ProgressBar from "../components/ui/ProgressBar";

const recentSessions = [
  { id: 1, title: "AI Foundations Live", status: "live", viewers: 342, duration: "1h 23m", revenue: "$1,540", curriculum: "AI" },
  { id: 2, title: "Blockchain Masterclass", status: "completed", viewers: 891, duration: "2h 10m", revenue: "$4,012", curriculum: "Blockchain" },
  { id: 3, title: "Web3 Product Workshop", status: "completed", viewers: 254, duration: "45m", revenue: "$842", curriculum: "Web3" },
  { id: 4, title: "Crypto Markets Analysis", status: "scheduled", viewers: 0, duration: "Scheduled", revenue: "—", curriculum: "Crypto" },
];

const enrolledCourses = [
  { id: 1, title: "Blockchain Fundamentals", progress: 75, lessons: "9/12", nextLesson: "Smart Contract Security" },
  { id: 2, title: "AI & Machine Learning Basics", progress: 40, lessons: "4/10", nextLesson: "Neural Networks" },
  { id: 3, title: "DeFi Masterclass", progress: 20, lessons: "2/10", nextLesson: "Liquidity Pools" },
];

const activityFeed = [
  { icon: "🎓", text: "Completed lesson: Proof of Stake", time: "2h ago" },
  { icon: "💰", text: "Earned 180 CCWEB tokens", time: "5h ago" },
  { icon: "📡", text: "Joined AI Foundations Live", time: "Yesterday" },
  { icon: "⭐", text: "Rated Blockchain Fundamentals 5 stars", time: "2d ago" },
];

const statusStyles = {
  live: { label: "LIVE", variant: "live", dot: true },
  completed: { label: "Completed", variant: "default" },
  scheduled: { label: "Scheduled", variant: "amber" },
};

export default function Dashboard() {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    fetch("/api/streaming/rooms")
      .then((r) => r.json())
      .then((d) => setRooms(d.rooms || []))
      .catch(() => {});
  }, []);

  const liveRooms = rooms.filter((r) => r.status === "active");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-700 via-surface-800 to-surface-900 border border-white/[0.07] p-6">
        <div className="absolute inset-0 bg-glow-cyan opacity-50 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs text-brand-cyan font-semibold tracking-widest uppercase mb-1">Welcome back</p>
            <h2 className="text-2xl font-bold text-slate-100">Demo User</h2>
            <p className="text-slate-400 text-sm mt-1">
              {liveRooms.length > 0
                ? `${liveRooms.length} session${liveRooms.length > 1 ? "s" : ""} live right now`
                : "No live sessions — start one now"}
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link to="/streaming">
              <Button variant="primary" leftIcon={<Radio size={15} />}>
                Start Streaming
              </Button>
            </Link>
            <Link to="/courses">
              <Button variant="outline" leftIcon={<BookOpen size={15} />}>
                My Courses
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Earned"
          value="$12,840"
          sub="All time"
          trend={18}
          icon={<DollarSign size={16} />}
          color="green"
        />
        <StatCard
          label="Active Sessions"
          value={liveRooms.length || "0"}
          sub="Right now"
          icon={<Activity size={16} />}
          color="cyan"
        />
        <StatCard
          label="Total Viewers"
          value="50K+"
          sub="Across all sessions"
          trend={12}
          icon={<Users size={16} />}
          color="blue"
        />
        <StatCard
          label="CCWEB Tokens"
          value="1,250"
          sub="+180 this week"
          trend={7}
          icon={<Zap size={16} />}
          color="amber"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sessions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Recent Sessions</h3>
            <Link to="/streaming" className="text-xs text-brand-cyan hover:text-brand-cyan/80 flex items-center gap-1 transition-colors">
              View all <ArrowRight size={12} />
            </Link>
          </div>

          <div className="space-y-3">
            {recentSessions.map((session) => {
              const st = statusStyles[session.status];
              return (
                <div
                  key={session.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-surface-800/60 border border-white/[0.05] hover:border-white/[0.09] hover:bg-surface-700/50 transition-all duration-200 group"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${session.status === "live" ? "bg-brand-green/15" : "bg-surface-700"}`}>
                    <Radio size={16} className={session.status === "live" ? "text-brand-green" : "text-slate-500"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-slate-200 truncate">{session.title}</p>
                      <Badge variant={st.variant} dot={st.dot}>{st.label}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Users size={11} /> {session.viewers.toLocaleString()}</span>
                      <span className="flex items-center gap-1"><Clock size={11} /> {session.duration}</span>
                      <span className="text-brand-green font-medium">{session.revenue}</span>
                    </div>
                  </div>
                  {session.status === "live" && (
                    <Link to="/streaming">
                      <Button variant="success" size="xs" leftIcon={<PlayCircle size={13} />}>Join</Button>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Courses in progress */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200">Continue Learning</h3>
                <Link to="/courses" className="text-xs text-brand-cyan">View all</Link>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              {enrolledCourses.map((course) => (
                <div key={course.id}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-xs font-medium text-slate-300">{course.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{course.lessons} · Next: {course.nextLesson}</p>
                    </div>
                    <span className="text-xs text-brand-cyan font-mono shrink-0 ml-2">{course.progress}%</span>
                  </div>
                  <ProgressBar value={course.progress} color="cyan" />
                </div>
              ))}
            </CardBody>
          </Card>

          {/* Activity feed */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-slate-200">Recent Activity</h3>
            </CardHeader>
            <CardBody className="space-y-3">
              {activityFeed.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-base leading-none mt-0.5">{item.icon}</span>
                  <div>
                    <p className="text-xs text-slate-300">{item.text}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
