import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  variant?: "default" | "primary" | "secondary" | "accent" | "outline";
  className?: string;
};

const variants: Record<NonNullable<Props["variant"]>, string> = {
  default:
    "border border-white/10 bg-white/[0.04] text-muted-foreground",
  primary: "border border-primary/30 bg-primary/15 text-primary",
  secondary: "border border-secondary/30 bg-secondary/15 text-secondary",
  accent: "border border-accent/30 bg-accent/15 text-accent",
  outline: "border border-white/20 text-foreground",
};

export default function Badge({ children, variant = "default", className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
