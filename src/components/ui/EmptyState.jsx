import { Link } from "react-router-dom";

/**
 * Consistent empty state: icon + title + optional description + CTA.
 */
export function EmptyState({ icon: Icon, title, description, actionLabel, actionTo, onAction, className = "" }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-10 text-center ${className}`}
      role="status"
    >
      {Icon ? <Icon className="mb-3 h-10 w-10 text-ccweb-muted/50" strokeWidth={1.5} aria-hidden /> : null}
      <p className="text-sm font-semibold text-white">{title}</p>
      {description ? <p className="mt-2 max-w-xs text-xs leading-relaxed text-ccweb-muted">{description}</p> : null}
      {actionLabel && actionTo ? (
        <Link to={actionTo} className="ccweb-gradient-btn mt-4 inline-flex min-h-[44px] items-center px-4 text-sm">
          {actionLabel}
        </Link>
      ) : null}
      {actionLabel && onAction && !actionTo ? (
        <button type="button" className="ccweb-outline-btn mt-4 min-h-[44px] px-4 text-sm" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
