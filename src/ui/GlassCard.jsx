export function GlassCard({ as: Comp = "div", children, className = "", padding = "p-5 sm:p-6", ...rest }) {
  return (
    <Comp
      className={`rounded-[20px] border border-white/[0.12] bg-white/[0.045] shadow-[0_8px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl backdrop-saturate-150 ${padding} ${className}`}
      {...rest}
    >
      {children}
    </Comp>
  );
}
