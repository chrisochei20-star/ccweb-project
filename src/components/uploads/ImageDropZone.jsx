import { ImagePlus, Loader2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { cn } from "../../lib/cn";
import { compressImageFile } from "../../lib/imageCompress";

/**
 * Drag-and-drop + tap-to-select image upload (mobile-friendly).
 * @param {{ label?: string; hint?: string; disabled?: boolean; busy?: boolean; compress?: boolean; compressOptions?: object; capture?: "user" | "environment"; progress?: number | null; onFile: (file: File) => void | Promise<void>; aspectClass?: string; previewUrl?: string | null; children?: import("react").ReactNode }} props
 */
export function ImageDropZone({
  label,
  hint,
  disabled,
  busy,
  compress = true,
  compressOptions,
  capture,
  progress = null,
  onFile,
  aspectClass = "aspect-[21/9]",
  previewUrl,
  children,
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [localBusy, setLocalBusy] = useState(false);

  const handleFiles = useCallback(
    async (fileList) => {
      const file = fileList?.[0];
      if (!file || !file.type.startsWith("image/")) return;
      setLocalBusy(true);
      try {
        let out = file;
        const skipCompress = !compress || file.type === "image/gif";
        if (!skipCompress) {
          try {
            out = await compressImageFile(file, compressOptions || {});
          } catch {
            out = file;
          }
        }
        await onFile(out);
      } finally {
        setLocalBusy(false);
      }
    },
    [compress, compressOptions, onFile]
  );

  const busyUi = busy || localBusy;
  const showDeterminateProgress = typeof progress === "number" && progress >= 0 && progress < 100;
  const showIndeterminateProgress = progress === -1;

  return (
    <div className="space-y-2">
      {label ? <p className="text-xs font-medium text-ccweb-muted">{label}</p> : null}
      <button
        type="button"
        disabled={disabled || busyUi}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer?.files);
        }}
        className={cn(
          "group relative w-full min-h-[var(--ccweb-touch-min,44px)] overflow-hidden rounded-2xl border border-dashed border-white/20 bg-black/25 text-left transition",
          aspectClass,
          dragOver && "border-ccweb-cyan/60 bg-ccweb-cyan/10",
          (disabled || busyUi) && "cursor-not-allowed opacity-60",
          !disabled && !busyUi && "hover:border-ccweb-cyan/40",
          previewUrl && "border-white/10"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          disabled={disabled || busyUi}
          capture={capture}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        {previewUrl ? (
          <img src={previewUrl} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" decoding="async" />
        ) : null}
        <div
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center",
            previewUrl && "bg-black/55 opacity-0 transition group-hover:opacity-100"
          )}
        >
          {busyUi ? (
            <Loader2 className="h-8 w-8 animate-spin text-ccweb-cyan" aria-hidden />
          ) : (
            <ImagePlus className="h-8 w-8 text-ccweb-cyan/90" aria-hidden />
          )}
          <span className="text-xs font-medium text-white">{children || "Tap or drop an image"}</span>
          {hint ? <span className="text-[11px] text-ccweb-muted">{hint}</span> : null}
        </div>
        {(showDeterminateProgress || showIndeterminateProgress) && (
          <div className="absolute inset-x-0 bottom-0 z-10 h-1.5 bg-black/60">
            {showDeterminateProgress ? (
              <div
                className="h-full bg-gradient-to-r from-ccweb-cyan to-ccweb-violet transition-[width] duration-150 ease-out"
                style={{ width: `${progress}%` }}
              />
            ) : (
              <div className="h-full w-1/3 animate-pulse bg-gradient-to-r from-ccweb-cyan/80 to-ccweb-violet/80" />
            )}
          </div>
        )}
      </button>
    </div>
  );
}
