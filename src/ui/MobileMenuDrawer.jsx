import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { GlassCard } from "./GlassCard";

const links = [
  { to: "/dashboard", label: "Home", sub: "Stats & quick actions" },
  { to: "/learn", label: "Learn", sub: "Courses, tutor, streaming" },
  { to: "/find", label: "Find", sub: "Scanner & signals" },
  { to: "/build", label: "Build", sub: "DApps & agents" },
  { to: "/earn", label: "Earn", sub: "Revenue streams" },
  { to: "/community", label: "Community", sub: "Posts & chat" },
  { to: "/marketplace", label: "Marketplace", sub: "Listings & escrow" },
  { to: "/about", label: "About", sub: "Foundation" },
  { to: "/faq", label: "FAQ", sub: "Help" },
  { to: "/contact", label: "Contact", sub: "Reach us" },
  { to: "/profile", label: "Profile", sub: "Account & settings" },
];

export function MobileMenuDrawer({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end sm:justify-center" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        aria-label="Close menu"
        onClick={onClose}
      />
      <GlassCard
        as="aside"
        className="relative m-3 h-[min(92vh,640px)] w-full max-w-sm overflow-y-auto shadow-2xl sm:m-6"
        padding="p-4"
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ccweb-muted">Menu</p>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-ccweb-text hover:bg-white/10"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
        <nav className="flex flex-col gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={onClose}
              className="rounded-[14px] border border-transparent px-3 py-3 transition hover:border-white/10 hover:bg-white/[0.06]"
            >
              <span className="block font-semibold text-ccweb-text">{l.label}</span>
              <span className="text-xs text-ccweb-muted">{l.sub}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4">
          <Link
            to="/login"
            onClick={onClose}
            className="rounded-[14px] border border-white/12 py-2.5 text-center text-sm font-medium text-ccweb-text hover:bg-white/[0.06]"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            onClick={onClose}
            className="rounded-[14px] bg-gradient-to-r from-ccweb-sky-300 via-ccweb-cyan-400 to-ccweb-indigo-400 py-2.5 text-center text-sm font-semibold text-ccweb-navy-950"
          >
            Get started
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
