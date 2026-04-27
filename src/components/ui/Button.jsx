import { forwardRef } from "react";

const variants = {
  primary:
    "bg-brand-cyan text-surface-950 font-semibold hover:brightness-110 shadow-glow-sm",
  secondary:
    "bg-surface-700 text-slate-200 border border-white/[0.08] hover:bg-surface-600 hover:border-white/[0.14]",
  outline:
    "bg-transparent text-slate-300 border border-white/[0.12] hover:bg-white/[0.05] hover:text-slate-100 hover:border-white/[0.18]",
  ghost:
    "bg-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]",
  danger:
    "bg-brand-red/10 text-brand-red border border-brand-red/20 hover:bg-brand-red/20",
  success:
    "bg-brand-green/10 text-brand-green border border-brand-green/20 hover:bg-brand-green/20",
};

const sizes = {
  xs: "px-2.5 py-1.5 text-xs rounded-lg gap-1.5",
  sm: "px-3.5 py-2 text-sm rounded-xl gap-2",
  md: "px-5 py-2.5 text-sm rounded-xl gap-2",
  lg: "px-6 py-3 text-base rounded-xl gap-2.5",
};

const Button = forwardRef(function Button(
  {
    variant = "primary",
    size = "md",
    className = "",
    disabled,
    loading,
    leftIcon,
    rightIcon,
    children,
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-medium
        transition-all duration-200 cursor-pointer select-none
        disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
        active:scale-[0.98]
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : leftIcon ? (
        <span className="shrink-0">{leftIcon}</span>
      ) : null}
      {children}
      {rightIcon && !loading ? <span className="shrink-0">{rightIcon}</span> : null}
    </button>
  );
});

export default Button;
