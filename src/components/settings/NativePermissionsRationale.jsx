import { Camera, Image, Bell } from "lucide-react";
import { isCapacitorNative } from "../../lib/capacitorPlatform";
import { ensureNotificationPermission, getNativePushDiagnostics } from "../../lib/nativePush";
import { toast } from "../../lib/toastBus";
import { useState } from "react";

const PERMISSIONS = [
  {
    id: "notifications",
    icon: Bell,
    title: "Notifications",
    why: "Delivers real FCM alerts for messages, mentions, and learning updates — not simulated push.",
    android: "POST_NOTIFICATIONS (Android 13+)",
  },
  {
    id: "camera",
    icon: Camera,
    title: "Camera",
    why: "Capture photos in chat and profile uploads. Only used when you tap camera in the app.",
    android: "CAMERA",
  },
  {
    id: "media",
    icon: Image,
    title: "Photos",
    why: "Pick images from your gallery for chat and Cloudinary uploads.",
    android: "READ_MEDIA_IMAGES",
  },
];

/**
 * Play Store–safe permission rationale (shown before system prompts where applicable).
 */
export function NativePermissionsRationale() {
  const [checking, setChecking] = useState(false);
  const native = isCapacitorNative();
  const pushDiag = getNativePushDiagnostics();

  if (!native) return null;

  async function recheckNotifications() {
    setChecking(true);
    try {
      const r = await ensureNotificationPermission();
      if (r.ok) toast.success("Notification permission granted");
      else if (r.permission === "denied") {
        toast.info("Notifications blocked — enable CCWEB in Android Settings → Notifications.");
      } else toast.info("Notification permission not granted yet.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <section className="ccweb-card-premium space-y-3 rounded-2xl border border-white/10 p-4">
      <h2 className="text-sm font-semibold text-white">Android permissions</h2>
      <p className="text-xs leading-relaxed text-ccweb-muted">
        CCWEB requests only what the feature needs. No background location, contacts, or SMS access.
      </p>
      <ul className="space-y-3">
        {PERMISSIONS.map(({ id, icon: Icon, title, why, android }) => (
          <li key={id} className="rounded-xl border border-white/5 bg-slate-950/40 p-3">
            <div className="flex items-start gap-2">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ccweb-cyan" aria-hidden />
              <div>
                <p className="text-sm font-medium text-white">{title}</p>
                <p className="mt-1 text-xs text-ccweb-muted">{why}</p>
                <p className="mt-1 font-mono text-[10px] text-ccweb-muted/80">{android}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-ccweb-muted">
        Push status: {pushDiag.permission || "unknown"}
        {pushDiag.tokenPresent ? " · token registered" : " · no FCM token yet"}
      </p>
      <button
        type="button"
        className="ccweb-outline-btn min-h-[44px] w-full text-sm"
        disabled={checking}
        onClick={() => void recheckNotifications()}
      >
        {checking ? "Checking…" : "Re-check notification permission"}
      </button>
    </section>
  );
}
