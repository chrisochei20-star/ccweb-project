export function Card({ children, className = "", hover = false, glow = false, ...props }) {
  return (
    <div
      className={`
        rounded-2xl bg-surface-800/80 border border-white/[0.06]
        backdrop-blur-sm shadow-card
        ${hover ? "transition-all duration-200 hover:shadow-card-hover hover:border-white/[0.10] hover:-translate-y-0.5 cursor-pointer" : ""}
        ${glow ? "shadow-glow-sm" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }) {
  return (
    <div className={`px-5 pt-5 pb-4 border-b border-white/[0.05] ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = "" }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = "" }) {
  return (
    <div className={`px-5 pb-5 pt-4 border-t border-white/[0.05] ${className}`}>
      {children}
    </div>
  );
}
