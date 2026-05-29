import { Camera, ImageIcon, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef } from "react";

/**
 * Mobile camera + gallery picker sheet (profile, chat, community uploads).
 */
export function NativeMediaPicker({
  open,
  onClose,
  onPick,
  accept = "image/*",
  capture,
  title = "Add photo",
}) {
  const galleryId = useId();
  const cameraId = useId();
  const galleryRef = useRef(null);
  const cameraRef = useRef(null);

  const onKey = useCallback(
    (e) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return undefined;
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onKey]);

  function handleFile(file) {
    if (!file) return;
    onPick(file);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[125] flex flex-col justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" aria-label="Close" onClick={onClose} />
      <div
        className="relative z-[126] mx-auto w-full max-w-lg rounded-t-[1.35rem] border border-white/10 bg-slate-950/96 p-4 shadow-2xl backdrop-blur-xl"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">{title}</p>
          <button type="button" className="rounded-xl p-2 text-ccweb-muted hover:bg-white/8" aria-label="Close" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid gap-2">
          <button
            type="button"
            className="flex min-h-[52px] items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 text-left text-sm font-semibold text-white active:scale-[0.99]"
            onClick={() => galleryRef.current?.click()}
          >
            <ImageIcon className="h-5 w-5 text-ccweb-cyan" aria-hidden />
            Choose from gallery
          </button>
          {capture !== false && (
            <button
              type="button"
              className="flex min-h-[52px] items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 text-left text-sm font-semibold text-white active:scale-[0.99]"
              onClick={() => cameraRef.current?.click()}
            >
              <Camera className="h-5 w-5 text-ccweb-violet" aria-hidden />
              Take photo
            </button>
          )}
        </div>
        <input
          id={galleryId}
          ref={galleryRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <input
          id={cameraId}
          ref={cameraRef}
          type="file"
          accept={accept}
          capture={capture || "environment"}
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}
