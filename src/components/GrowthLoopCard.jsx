import { Flame, Gift, Trophy, Users } from "lucide-react";
import { http } from "../api/http";

export function GrowthLoopCard({
  referralLink,
  referralCode,
  invitedCount,
  convertedCount,
  conversionRate,
  badges,
  streak,
  level,
  xp,
  rewardHint,
}) {
  return (
    <div className="ccweb-glass rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-ccweb-green">Growth loop</p>
          <h3 className="mt-1 text-lg font-semibold text-white">Invite &amp; earn together</h3>
          <p className="mt-1 max-w-xl text-xs text-ccweb-muted">{rewardHint}</p>
        </div>
        {level && (
          <span className="rounded-full border border-ccweb-cyan/40 bg-ccweb-cyan/10 px-3 py-1 text-xs font-medium capitalize text-ccweb-cyan">
            {level} · {xp ?? 0} XP
          </span>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="ccweb-glass-subtle rounded-xl p-4">
          <Users className="h-5 w-5 text-ccweb-cyan" />
          <p className="mt-2 text-xs text-ccweb-muted">Invited</p>
          <p className="text-lg font-bold text-white">{invitedCount ?? 0}</p>
        </div>
        <div className="ccweb-glass-subtle rounded-xl p-4">
          <Gift className="h-5 w-5 text-ccweb-green" />
          <p className="mt-2 text-xs text-ccweb-muted">Activated</p>
          <p className="text-lg font-bold text-white">{convertedCount ?? 0}</p>
        </div>
        <div className="ccweb-glass-subtle rounded-xl p-4">
          <Trophy className="h-5 w-5 text-ccweb-violet" />
          <p className="mt-2 text-xs text-ccweb-muted">Conversion</p>
          <p className="text-lg font-bold text-white">
            {conversionRate != null ? `${Math.round(conversionRate * 100)}%` : "—"}
          </p>
        </div>
      </div>

      {streak && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/95">
          <Flame className="h-5 w-5 shrink-0 text-amber-400" />
          <span>
            Streak: <strong>{streak.current}</strong> day(s) · Best {streak.longest}
          </span>
        </div>
      )}

      <div className="mt-4">
        <p className="text-xs text-ccweb-muted">Your link</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <code className="max-w-full truncate rounded-lg bg-black/40 px-3 py-2 text-[11px] text-ccweb-cyan">{referralLink}</code>
          <button
            type="button"
            className="ccweb-outline-btn px-3 py-1.5 text-xs"
            onClick={() => referralLink && navigator.clipboard.writeText(referralLink)}
          >
            Copy
          </button>
        </div>
        {referralCode && <p className="mt-2 text-[11px] text-ccweb-muted">Code: {referralCode}</p>}
      </div>

      {badges?.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-white">Badges</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {badges.map((b) => (
              <li key={b.id} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] text-ccweb-muted">
                {b.id.replace(/_/g, " ")}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export async function postGrowthClientEvent(type, metadata = {}) {
  try {
    await http.post("/api/v1/growth/events", { type, metadata });
  } catch {
    /* optional */
  }
}
