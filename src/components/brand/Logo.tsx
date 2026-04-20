import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
};

export default function Logo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("block", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="cc-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(262 83% 68%)" />
          <stop offset="100%" stopColor="hsl(189 94% 55%)" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#cc-logo)" />
      <path
        d="M20 40 L32 16 L44 40 M24 34 H40"
        stroke="white"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
