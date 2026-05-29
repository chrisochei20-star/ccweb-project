import { X, ZoomIn } from "lucide-react";
import { useCallback, useEffect } from "react";
import { MediaImage } from "../ui/MediaImage";
import { pushNativeBackHandler } from "../../lib/nativeBackStack";

/**
 * Full-screen native-style image viewer (in-app, no external browser).
 */
export function ImageViewerModal({ src, alt = "Image", open, onClose }) {
  const onKey = useCallback(
    (e) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return undefined;
    const pop = pushNativeBackHandler(() => {
      onClose();
      return true;
    });
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      pop();
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onKey]);

  if (!open || !src) return null;

  return (
    <div
      className="fixed inset-0 z-[130] flex flex-col bg-black/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      onClick={onClose}
    >
      <div
        className="flex items-center justify-between px-3 py-3"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ccweb-muted">
          <ZoomIn className="h-4 w-4" aria-hidden />
          Preview
        </span>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white"
          aria-label="Close image viewer"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-auto p-4" onClick={(e) => e.stopPropagation()}>
        <MediaImage
          src={src}
          alt={alt}
          loading="eager"
          wrapperClassName="max-h-[min(78vh,720px)] w-full max-w-3xl rounded-2xl"
          className="max-h-[min(78vh,720px)] w-full object-contain"
        />
      </div>
    </div>
  );
}
