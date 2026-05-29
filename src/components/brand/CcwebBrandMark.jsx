import { useId } from "react";
import { cn } from "../../lib/cn";

/** Canonical CCWEB Foundation lightning bolt (matches assets/brand/ccweb-foundation-logo.svg). */
export function CcwebBrandBolt({ size = 24, className, showGlow = false, title = "CCWEB" }) {
  const uid = useId().replace(/:/g, "");
  const gradId = `ccweb-bolt-grad-${uid}`;
  const glowId = `ccweb-bolt-glow-${uid}`;

  return (
    <svg
      viewBox="0 0 108 108"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={title}
    >
      <defs>
        <linearGradient id={gradId} x1="32" y1="18" x2="76" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.45" stopColor="#22D3EE" />
          <stop offset="1" stopColor="#2563EB" />
        </linearGradient>
        {showGlow ? (
          <radialGradient id={glowId} cx="54" cy="54" r="42" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#22D3EE" stopOpacity="0.35" />
            <stop offset="1" stopColor="#22D3EE" stopOpacity="0" />
          </radialGradient>
        ) : null}
      </defs>
      {showGlow ? <circle cx="54" cy="54" r="38" fill={`url(#${glowId})`} /> : null}
      <path
        fill={`url(#${gradId})`}
        d="M58.5 22 L38 58 H52 L49.5 86 L70 50 H56 L58.5 22 Z"
      />
    </svg>
  );
}

/** Framed brand mark for headers, install prompts, and loading states. */
export function CcwebBrandMark({ size = 36, className, showGlow = false, framed = true }) {
  const inner = Math.round(size * 0.58);
  if (!framed) {
    return <CcwebBrandBolt size={size} className={className} showGlow={showGlow} />;
  }
  return (
    <span
      className={cn("ccweb-brand-mark inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <CcwebBrandBolt size={inner} showGlow={showGlow} />
    </span>
  );
}

/** Profile / chat avatar fallback with optional initials over brand gradient. */
export function CcwebBrandAvatarFallback({ name, size = 48, className, showInitials = true }) {
  const initials = (name || "?").trim().slice(0, 2).toUpperCase();
  const showLetters = showInitials && initials !== "?" && initials.length > 0;

  return (
    <div
      className={cn(
        "ccweb-brand-avatar-fallback relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-ccweb-cyan/35 to-ccweb-violet/30",
        className
      )}
      style={{ width: size, height: size }}
    >
      <CcwebBrandBolt
        size={Math.round(size * 0.52)}
        className="absolute opacity-40"
        aria-hidden
      />
      {showLetters ? (
        <span className="relative z-[1] text-sm font-bold text-white">{initials}</span>
      ) : (
        <CcwebBrandBolt size={Math.round(size * 0.48)} className="relative z-[1]" aria-hidden />
      )}
    </div>
  );
}
