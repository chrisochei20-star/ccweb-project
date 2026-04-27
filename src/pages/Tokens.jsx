import { Zap, TrendingUp, Lock, Vote, Coins } from "lucide-react";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import StatCard from "../components/ui/StatCard";
import ProgressBar from "../components/ui/ProgressBar";

const stakingTiers = [
  { name: "Bronze", min: 100, apy: 8, color: "amber" },
  { name: "Silver", min: 1000, apy: 14, color: "default" },
  { name: "Gold", min: 5000, apy: 22, color: "amber" },
  { name: "Platinum", min: 20000, apy: 35, color: "cyan" },
];

const recentTransactions = [
  { type: "Earned", label: "Course completion", amount: "+120", time: "2h ago", positive: true },
  { type: "Earned", label: "Session participation", amount: "+45", time: "5h ago", positive: true },
  { type: "Staked", label: "Bronze tier", amount: "-500", time: "1d ago", positive: false },
  { type: "Earned", label: "Quiz score 100%", amount: "+30", time: "2d ago", positive: true },
];

export default function Tokens() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Balance" value="1,250" sub="CCWEB" icon={<Zap size={16} />} color="amber" />
        <StatCard label="Staked" value="500" sub="Bronze Tier" icon={<Lock size={16} />} color="cyan" />
        <StatCard label="Earned" value="1,750" sub="All time" trend={12} icon={<TrendingUp size={16} />} color="green" />
        <StatCard label="Voting Power" value="1,750" sub="Governance" icon={<Vote size={16} />} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: staking + actions */}
        <div className="lg:col-span-2 space-y-5">
          {/* Staking tiers */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200">Staking Tiers</h3>
                <Badge variant="amber" dot>Active: Bronze</Badge>
              </div>
            </CardHeader>
            <CardBody className="grid grid-cols-2 gap-3">
              {stakingTiers.map((tier) => (
                <div
                  key={tier.name}
                  className={`p-4 rounded-xl border transition-all ${tier.name === "Bronze" ? "bg-brand-amber/5 border-brand-amber/20" : "bg-surface-900 border-white/[0.05]"}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-200">{tier.name}</span>
                    <Badge variant={tier.color}>{tier.apy}% APY</Badge>
                  </div>
                  <p className="text-xs text-slate-500">Min: {tier.min.toLocaleString()} CCWEB</p>
                  {tier.name === "Bronze" && (
                    <p className="text-xs text-brand-amber mt-1 font-medium">Staking 500</p>
                  )}
                </div>
              ))}
            </CardBody>
          </Card>

          {/* Learn & Earn */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-slate-200">Learn &amp; Earn Missions</h3>
            </CardHeader>
            <CardBody className="space-y-3">
              {[
                { label: "Complete 1 course module", reward: "+50 CCWEB", progress: 80 },
                { label: "Attend a live session", reward: "+30 CCWEB", progress: 100 },
                { label: "Score 90%+ on a quiz", reward: "+75 CCWEB", progress: 40 },
              ].map((mission) => (
                <div key={mission.label} className="flex items-center gap-4 p-3.5 rounded-xl bg-surface-900 border border-white/[0.05]">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="text-xs font-medium text-slate-300">{mission.label}</p>
                      <Badge variant="amber">{mission.reward}</Badge>
                    </div>
                    <ProgressBar value={mission.progress} color="cyan" />
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>

        {/* Right: balance */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-slate-200">Token Balance</h3>
            </CardHeader>
            <CardBody>
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-2xl bg-brand-amber/10 border border-brand-amber/20 flex items-center justify-center mx-auto mb-3">
                  <Zap size={28} className="text-brand-amber" />
                </div>
                <p className="text-3xl font-bold text-brand-amber font-mono">1,250</p>
                <p className="text-xs text-slate-500 mt-1">CCWEB Tokens</p>
                <div className="mt-4 p-3 rounded-xl bg-surface-900 border border-white/[0.05]">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-500">Staked</span>
                    <span className="text-slate-300 font-mono">500</span>
                  </div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-500">Available</span>
                    <span className="text-slate-300 font-mono">750</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Pending reward</span>
                    <span className="text-brand-green font-mono">+12</span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-slate-200">Recent Activity</h3>
            </CardHeader>
            <CardBody className="space-y-0 p-0">
              {recentTransactions.map((tx, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between px-5 py-3 ${i < recentTransactions.length - 1 ? "border-b border-white/[0.04]" : ""}`}
                >
                  <div>
                    <p className="text-xs font-medium text-slate-300">{tx.label}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">{tx.type} · {tx.time}</p>
                  </div>
                  <span className={`text-sm font-semibold font-mono ${tx.positive ? "text-brand-green" : "text-slate-400"}`}>
                    {tx.amount}
                  </span>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
