import { cn } from "../../lib/cn";

export const PROFILE_TABS = [
  { id: "posts", label: "Posts" },
  { id: "pinned", label: "Pinned" },
  { id: "replies", label: "Replies" },
  { id: "media", label: "Media" },
  { id: "likes", label: "Likes", selfOnly: true },
];

export function ProfileTabs({ active, onChange, isSelf, sticky = true }) {
  const tabs = PROFILE_TABS.filter((t) => !t.selfOnly || isSelf);

  return (
    <div
      className={cn(
        "z-20 -mx-3 border-b border-white/10 bg-[#070b14]/90 backdrop-blur-md md:-mx-0 md:rounded-2xl md:border md:border-white/10",
        sticky && "sticky top-0"
      )}
      style={{ top: sticky ? "max(0px, env(safe-area-inset-top, 0px))" : undefined }}
    >
      <div className="flex overflow-x-auto overscroll-x-contain" role="tablist" aria-label="Profile">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            className={cn(
              "min-h-[var(--ccweb-touch-min,44px)] shrink-0 flex-1 px-4 py-3 text-sm font-semibold transition",
              active === tab.id
                ? "border-b-2 border-ccweb-cyan text-white"
                : "text-ccweb-muted hover:bg-white/5 hover:text-white"
            )}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
