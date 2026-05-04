import { Link } from "react-router-dom";

const base =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[14px] px-5 py-2.5 text-sm font-semibold text-ccweb-navy-950 shadow-[0_4px_24px_rgba(56,189,248,0.25)] transition hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

const grad = "bg-gradient-to-r from-ccweb-sky-300 via-ccweb-cyan-400 to-ccweb-indigo-400";

export function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button type="button" className={`${base} ${grad} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function PrimaryButtonLink({ to, children, className = "", ...props }) {
  return (
    <Link to={to} className={`${base} ${grad} ${className}`} {...props}>
      {children}
    </Link>
  );
}
