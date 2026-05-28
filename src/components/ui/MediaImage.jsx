import { ImageOff } from "lucide-react";
import { useState } from "react";
import { cn } from "../../lib/cn";

/**
 * Lazy-loaded image with broken-layout prevention and fallback placeholder.
 */
export function MediaImage({ src, alt = "", className, wrapperClassName, loading = "lazy", ...props }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-white/5 text-ccweb-muted",
          wrapperClassName || className
        )}
        aria-hidden={!alt}
      >
        <ImageOff className="h-6 w-6 opacity-50" />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden bg-white/5", wrapperClassName)}>
      {!loaded ? <div className="absolute inset-0 animate-pulse bg-white/8" aria-hidden /> : null}
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        className={cn("h-full w-full object-cover", className, !loaded && "opacity-0")}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        {...props}
      />
    </div>
  );
}
