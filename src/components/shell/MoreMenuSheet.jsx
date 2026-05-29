import { Menu, X } from "lucide-react";
import { useCallback, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { CCWEB_SECONDARY_NAV } from "../../lib/navPaths";

/**
 * Mobile-first overflow: secondary routes in a bottom sheet (X-style “More” / app drawer).
 */
export function MoreMenuSheet({ open, onClose }) {
  const onKey = useCallback(
    (e) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return undefined;
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onKey]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end sm:justify-center sm:px-4" role="dialog" aria-modal="true" aria-label="More">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        aria-label="Close menu"
        onClick={onClose}
      />
      <div
        className="relative z-[71] mx-auto w-full max-w-lg rounded-t-[1.35rem] border border-white/10 bg-slate-950/96 shadow-[0_-12px_48px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:rounded-3xl sm:border-white/12"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <p className="text-sm font-semibold text-white">Apps &amp; tools</p>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-ccweb-muted transition hover:bg-white/8 hover:text-white"
            aria-label="Close"
            onClick={onClose}
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
        <nav className="max-h-[min(72vh,560px)] overflow-y-auto overscroll-contain px-2 py-2" aria-label="Secondary">
          <ul className="space-y-0.5">
            {CCWEB_SECONDARY_NAV.map(({ to, label, description }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex min-h-[var(--ccweb-touch-min,44px)] flex-col justify-center rounded-2xl px-3 py-2.5 transition active:scale-[0.99] ${
                      isActive ? "bg-white/12 text-white" : "text-ccweb-muted hover:bg-white/6 hover:text-white"
                    }`
                  }
                >
                  <span className="text-sm font-semibold">{label}</span>
                  <span className="text-[11px] leading-snug text-ccweb-muted/90">{description}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}

export function MoreMenuTrigger({ onOpen }) {
  return (
    <button
      type="button"
      className="flex h-11 min-w-[2.75rem] items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 text-xs font-semibold text-ccweb-muted transition hover:border-ccweb-cyan/30 hover:bg-white/10 hover:text-white"
      data-ccweb-e2e="more-menu"
      aria-label="Open apps menu"
      onClick={onOpen}
    >
      <Menu className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
      <span className="hidden sm:inline">More</span>
    </button>
  );
}
