import { useState } from "react";
import { DollarSign, TrendingUp, Users, ChartBar as BarChart2, Download, Clock, Zap } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  LineChart,
} from "recharts";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import ProgressBar from "../components/ui/ProgressBar";
import { Tabs } from "../components/ui/Tabs";

const weeklyData = [
  { day: "Mon", gross: 820, platform: 303, creator: 517 },
  { day: "Tue", gross: 1240, platform: 459, creator: 781 },
  { day: "Wed", gross: 980, platform: 363, creator: 617 },
  { day: "Thu", gross: 1680, platform: 622, creator: 1058 },
  { day: "Fri", gross: 2100, platform: 777, creator: 1323 },
  { day: "Sat", gross: 1460, platform: 540, creator: 920 },
  { day: "Sun", gross: 560, platform: 207, creator: 353 },
];

const topSessions = [
  { title: "Blockchain Masterclass", viewers: 891, revenue: 4012, organic: 72, curriculum: "Blockchain" },
  { title: "AI Foundations Live", viewers: 654, revenue: 3400, organic: 68, curriculum: "AI" },
  { title: "DeFi Deep Dive", viewers: 512, revenue: 2740, organic: 61, curriculum: "Crypto" },
  { title: "Web3 Product Workshop", viewers: 254, revenue: 1320, organic: 55, curriculum: "Web3" },
];

const payoutHistory = [
  { date: "Apr 20", amount: "$1,823", status: "paid", method: "CCWEB Wallet" },
  { date: "Apr 13", amount: "$2,140", status: "paid", method: "CCWEB Wallet" },
  { date: "Apr 6", amount: "$980", status: "paid", method: "Bank Transfer" },
  { date: "Mar 30", amount: "$1,620", status: "paid", method: "CCWEB Wallet" },
];

const organicShareData = [
  { label: "Watch Duration", share: 60, color: "cyan" },
  { label: "Participation Level", share: 25, color: "green" },
  { label: "Repeat Attendance", share: 15, color: "amber" },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-800 border border-white/[0.08] rounded-xl p-3 shadow-lg">
      <p className="text-xs text-slate-400 mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-slate-400 capitalize">{entry.name}:</span>
          <span className="text-slate-100 font-mono">${entry.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

export default function Revenue() {
  const [chartTab, setChartTab] = useState("week");

  const data = chartTab === "week" ? weeklyData : weeklyData.slice(0, 4);
  const xKey = chartTab === "week" ? "day" : "day";

  const totalGross = data.reduce((s, d) => s + d.gross, 0);
  const totalCreator = data.reduce((s, d) => s + d.creator, 0);
  const totalPlatform = data.reduce((s, d) => s + d.platform, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={`$${(totalGross / 1000).toFixed(1)}k`}
          sub={chartTab === "week" ? "This week" : "This month"}
          trend={22}
          icon={<DollarSign size={16} />}
          color="green"
        />
        <StatCard
          label="Creator Pool"
          value={`$${(totalCreator / 1000).toFixed(1)}k`}
          sub="After platform fee"
          trend={18}
          icon={<TrendingUp size={16} />}
          color="cyan"
        />
        <StatCard
          label="Platform Revenue"
          value={`$${(totalPlatform / 1000).toFixed(1)}k`}
          sub="37% of gross"
          icon={<BarChart2 size={16} />}
          color="amber"
        />
        <StatCard
          label="Organic Users"
          value="2,840"
          sub="Active participants"
          trend={9}
          icon={<Users size={16} />}
          color="blue"
        />
      </div>

      {/* Revenue chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Revenue Breakdown</h3>
            <div className="flex items-center gap-3">
              <Tabs
                tabs={[
                  { id: "week", label: "Week" },
                  { id: "month", label: "Month" },
                ]}
                defaultTab={chartTab}
                onChange={setChartTab}
                className="!p-0.5"
              />
              <Button variant="outline" size="xs" leftIcon={<Download size={12} />}>
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10d48e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10d48e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="creatorGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
              <XAxis dataKey={xKey} tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="gross" stroke="#10d48e" strokeWidth={2} fill="url(#grossGrad)" name="gross" />
              <Area type="monotone" dataKey="creator" stroke="#00d4ff" strokeWidth={2} fill="url(#creatorGrad)" name="creator" />
              <Line type="monotone" dataKey="platform" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="platform" />
            </AreaChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top sessions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-slate-200">Top Performing Sessions</h3>
            </CardHeader>
            <CardBody className="space-y-0 p-0">
              {topSessions.map((session, i) => (
                <div
                  key={session.title}
                  className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04] last:border-0 hover:bg-surface-700/30 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-200">{session.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Users size={11} /> {session.viewers.toLocaleString()}</span>
                      <span className="flex items-center gap-1"><Zap size={11} className="text-brand-green" /> {session.organic}% organic</span>
                    </div>
                  </div>
                  <Badge variant="cyan">{session.curriculum}</Badge>
                  <span className="text-sm font-semibold text-brand-green font-mono ml-4">
                    ${session.revenue.toLocaleString()}
                  </span>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Organic share breakdown */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-slate-200">Organic Share Weights</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              {organicShareData.map((item) => (
                <div key={item.label}>
                  <ProgressBar
                    label={item.label}
                    value={item.share}
                    color={item.color}
                    showValue
                  />
                </div>
              ))}
            </CardBody>
          </Card>

          {/* Payout history */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-slate-200">Payout History</h3>
            </CardHeader>
            <CardBody className="space-y-0 p-0">
              {payoutHistory.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04] last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-brand-green font-mono">{item.amount}</p>
                    <p className="text-xs text-slate-500">{item.date} · {item.method}</p>
                  </div>
                  <Badge variant="success">{item.status}</Badge>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
