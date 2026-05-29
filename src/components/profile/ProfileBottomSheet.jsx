import { X } from "lucide-react";
import { useCallback, useEffect } from "react";

export function ProfileBottomSheet({ open, title, onClose, children }) {
  const onKey = useCallback(
    (e) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return undefined;
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onKey]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[75] flex flex-col justify-end sm:justify-center sm:px-4" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" aria-label="Close" onClick={onClose} />
      <div
        className="relative z-[76] mx-auto flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col rounded-t-[1.35rem] border border-white/10 bg-slate-950/96 shadow-[0_-12px_48px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:max-h-[85vh] sm:rounded-3xl"
        style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
          <p className="text-sm font-semibold text-white">{title}</p>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-ccweb-muted transition hover:bg-white/8 hover:text-white"
            aria-label="Close"
            onClick={onClose}
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">{children}</div>
      </div>
    </div>
  );
}
