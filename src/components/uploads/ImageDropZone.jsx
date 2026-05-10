import { ImagePlus, Loader2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { cn } from "../../lib/cn";
import { compressImageFile } from "../../lib/imageCompress";

/**
 * Drag-and-drop + tap-to-select image upload (mobile-friendly).
 */
export function ImageDropZone({
  label,
  hint,
  disabled,
  busy,
  compress = true,
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
        if (compress) {
          try {
            out = await compressImageFile(file);
          } catch {
            out = file;
          }
        }
        await onFile(out);
      } finally {
        setLocalBusy(false);
      }
    },
    [compress, onFile]
  );

  const busyUi = busy || localBusy;

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
          "group relative w-full overflow-hidden rounded-2xl border border-dashed border-white/20 bg-black/25 text-left transition",
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
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        {previewUrl ? (
          <img src={previewUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        <div
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center",
            previewUrl && "bg-black/55 opacity-0 transition group-hover:opacity-100"
          )}
        >
          {busyUi ? (
            <Loader2 className="h-8 w-8 animate-spin text-ccweb-cyan" />
          ) : (
            <ImagePlus className="h-8 w-8 text-ccweb-cyan/90" />
          )}
          <span className="text-xs font-medium text-white">{children || "Tap or drop an image"}</span>
          {hint ? <span className="text-[11px] text-ccweb-muted">{hint}</span> : null}
        </div>
      </button>
    </div>
  );
}
