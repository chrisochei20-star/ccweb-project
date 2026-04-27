import { forwardRef } from "react";

const Input = forwardRef(function Input(
  { label, error, hint, leftIcon, rightIcon, className = "", ...props },
  ref
) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide uppercase">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          className={`
            w-full bg-surface-900 border rounded-xl px-4 py-2.5 text-sm text-slate-200
            placeholder-slate-500 transition-all duration-200
            focus:outline-none focus:ring-1
            ${error
              ? "border-brand-red/40 focus:border-brand-red/60 focus:ring-brand-red/20"
              : "border-white/[0.08] focus:border-brand-cyan/40 focus:ring-brand-cyan/20"
            }
            ${leftIcon ? "pl-10" : ""}
            ${rightIcon ? "pr-10" : ""}
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
            {rightIcon}
          </span>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-brand-red">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
});

export default Input;

export const Select = forwardRef(function Select(
  { label, error, children, className = "", ...props },
  ref
) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide uppercase">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={`
          w-full bg-surface-900 border rounded-xl px-4 py-2.5 text-sm text-slate-200
          cursor-pointer appearance-none transition-all duration-200
          focus:outline-none focus:ring-1
          ${error
            ? "border-brand-red/40 focus:border-brand-red/60 focus:ring-brand-red/20"
            : "border-white/[0.08] focus:border-brand-cyan/40 focus:ring-brand-cyan/20"
          }
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-brand-red">{error}</p>}
    </div>
  );
});
