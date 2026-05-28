import { Camera, ImagePlus, RefreshCw } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { cn } from "../../lib/cn";
import { compressImageFile } from "../../lib/imageCompress";
import { UploadProgressRing } from "./UploadProgressRing";

/**
 * Full-surface profile media picker — tap entire area, camera/gallery on mobile, drag/drop desktop.
 */
export function ProfileMediaUpload({
  variant = "avatar",
  previewUrl,
  busy,
  progress,
  error,
  onRetry,
  onFile,
  compressOptions,
  className,
  children,
}) {
  const galleryRef = useRef(null);
  const cameraRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [localBusy, setLocalBusy] = useState(false);
  const [previewBlob, setPreviewBlob] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [chooserOpen, setChooserOpen] = useState(false);

  const isAvatar = variant === "avatar";
  const busyUi = busy || localBusy;

  const processFile = useCallback(
    async (file, save = true) => {
      if (!file || !file.type.startsWith("image/")) return;
      setLocalBusy(true);
      try {
        let out = file;
        const skipCompress = file.type === "image/gif";
        if (!skipCompress) {
          try {
            out = await compressImageFile(file, compressOptions || {});
          } catch {
            out = file;
          }
        }
        const blobUrl = URL.createObjectURL(out);
        setPreviewBlob(blobUrl);
        setPendingFile(out);
        if (save) {
          await onFile(out);
          setPendingFile(null);
          setPreviewBlob(null);
        }
      } finally {
        setLocalBusy(false);
      }
    },
    [compressOptions, onFile]
  );

  const handlePick = (fileList) => {
    setChooserOpen(false);
    void processFile(fileList?.[0], true);
  };

  const displayUrl = previewBlob || previewUrl;

  return (
    <div className={cn("relative", className)}>
      <div
        role="button"
        tabIndex={0}
        aria-label={isAvatar ? "Change profile photo" : "Change banner"}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!busyUi) setChooserOpen(true);
          }
        }}
        onClick={() => {
          if (!busyUi) setChooserOpen(true);
        }}
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
          handlePick(e.dataTransfer?.files);
        }}
        className={cn(
          "group relative overflow-hidden transition",
          isAvatar ? "h-full w-full rounded-2xl" : "h-full w-full",
          dragOver && "ring-2 ring-ccweb-cyan/60",
          busyUi && "pointer-events-none"
        )}
      >
        {displayUrl ? (
          <img src={displayUrl} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
        ) : (
          children
        )}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100",
            busyUi && "opacity-100"
          )}
        >
          {busyUi ? (
            <UploadProgressRing progress={typeof progress === "number" ? progress : -1} size={isAvatar ? 48 : 56} />
          ) : (
            <ImagePlus className="h-7 w-7 text-white/90" aria-hidden />
          )}
        </div>
        {!isAvatar && !busyUi && (
          <div className="pointer-events-none absolute bottom-3 right-3 rounded-full border border-white/20 bg-black/55 p-2 opacity-0 transition group-hover:opacity-100">
            <Camera className="h-4 w-4 text-white" aria-hidden />
          </div>
        )}
      </div>

      {isAvatar && !busyUi && (
        <div className="pointer-events-none absolute bottom-0 right-0 flex h-9 w-9 translate-x-1 translate-y-1 items-center justify-center rounded-full border-2 border-[#070b14] bg-ccweb-cyan/90 text-[#070b14] shadow-lg">
          <Camera className="h-4 w-4" aria-hidden />
        </div>
      )}

      <input
        ref={galleryRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          handlePick(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        capture="user"
        className="hidden"
        onChange={(e) => {
          handlePick(e.target.files);
          e.target.value = "";
        }}
      />

      {chooserOpen && !busyUi && (
        <div className="fixed inset-0 z-[80] flex flex-col justify-end sm:justify-center sm:px-4" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-black/55" aria-label="Close" onClick={() => setChooserOpen(false)} />
          <div
            className="relative z-[81] mx-auto w-full max-w-sm rounded-t-[1.35rem] border border-white/10 bg-slate-950/96 p-3 shadow-2xl sm:rounded-3xl"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}
          >
            <p className="px-2 pb-2 text-sm font-semibold text-white">{isAvatar ? "Profile photo" : "Banner image"}</p>
            <button
              type="button"
              className="flex min-h-[var(--ccweb-touch-min,44px)] w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-white hover:bg-white/8"
              onClick={() => cameraRef.current?.click()}
            >
              <Camera className="h-5 w-5 text-ccweb-cyan" />
              Take photo
            </button>
            <button
              type="button"
              className="flex min-h-[var(--ccweb-touch-min,44px)] w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-white hover:bg-white/8"
              onClick={() => galleryRef.current?.click()}
            >
              <ImagePlus className="h-5 w-5 text-ccweb-violet" />
              Choose from gallery
            </button>
            {pendingFile && (
              <button
                type="button"
                className="mt-1 flex min-h-[var(--ccweb-touch-min,44px)] w-full items-center justify-center rounded-2xl bg-gradient-to-r from-ccweb-cyan to-ccweb-violet px-4 text-sm font-semibold text-[#070b14]"
                onClick={() => void processFile(pendingFile, true)}
              >
                Save preview
              </button>
            )}
            <button
              type="button"
              className="mt-1 flex min-h-[var(--ccweb-touch-min,44px)] w-full items-center justify-center rounded-2xl text-sm text-ccweb-muted hover:bg-white/6"
              onClick={() => setChooserOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
          <span className="flex-1">{error}</span>
          {onRetry && (
            <button type="button" className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg hover:bg-white/10" onClick={onRetry} aria-label="Retry upload">
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
