import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { registerToastHandler } from "../../lib/toastBus";

const AUTO_MS = 4800;

export function ToastViewport() {
  const [items, setItems] = useState([]);

  const dismiss = useCallback((id) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  useEffect(() => {
    return registerToastHandler((t) => {
      setItems((prev) => [...prev, t]);
      window.setTimeout(() => dismiss(t.id), AUTO_MS);
    });
  }, [dismiss]);

  return (
    <div
      className="pointer-events-none fixed bottom-0 left-0 right-0 z-[120] flex flex-col items-center gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-end sm:p-6"
      aria-live="polite"
    >
      {items.map((t) => {
        const Icon = t.type === "success" ? CheckCircle2 : t.type === "info" ? Info : AlertCircle;
        const border =
          t.type === "success"
            ? "border-emerald-500/35 bg-emerald-950/90"
            : t.type === "info"
              ? "border-ccweb-cyan/35 bg-slate-950/92"
              : "border-rose-500/40 bg-rose-950/90";
        const iconClass =
          t.type === "success" ? "text-emerald-300" : t.type === "info" ? "text-ccweb-cyan" : "text-rose-200";
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex max-w-[min(100%,420px)] items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-md ${border}`}
            role="status"
          >
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconClass}`} strokeWidth={2} aria-hidden />
            <p className="min-w-0 flex-1 leading-snug text-white/95">{t.message}</p>
            <button
              type="button"
              className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/60 hover:bg-white/10 hover:text-white"
              onClick={() => dismiss(t.id)}
            >
              OK
            </button>
          </div>
        );
      })}
    </div>
  );
}
