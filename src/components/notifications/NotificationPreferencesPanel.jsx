import { Bell, Loader2, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchPushDiagnosticsFromApi, getNativePushDiagnostics } from "../../lib/nativePush";
import { isCapacitorNative } from "../../lib/capacitorPlatform";
import { registerBrowserPushInterest } from "../../lib/pushNotificationPrep";
import { useNotificationsStore } from "../../store/notificationsStore";
import { toast } from "../../lib/toastBus";

const NATIVE_CATEGORIES = [
  { key: "messages", label: "Messages" },
  { key: "mentions", label: "Mentions" },
  { key: "follows", label: "Follows" },
  { key: "reactions", label: "Reactions" },
  { key: "comments", label: "Comments" },
  { key: "aiAlerts", label: "AI alerts" },
];

export function NotificationPreferencesPanel() {
  const prefs = useNotificationsStore((s) => s.prefs);
  const savePreferences = useNotificationsStore((s) => s.savePreferences);
  const [saving, setSaving] = useState(false);
  const [diag, setDiag] = useState(null);

  useEffect(() => {
    if (!isCapacitorNative()) return;
    fetchPushDiagnosticsFromApi().then(setDiag).catch(() => {});
  }, []);

  async function toggleNative(enabled) {
    setSaving(true);
    try {
      await savePreferences({
        nativePush: {
          ...(prefs?.nativePush || {}),
          enabled,
        },
      });
      toast.success(enabled ? "Native push enabled" : "Native push disabled");
    } catch (e) {
      toast.error(e.message || "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function toggleCategory(key, value) {
    setSaving(true);
    try {
      await savePreferences({
        nativePush: {
          ...(prefs?.nativePush || {}),
          [key]: value,
        },
      });
    } catch (e) {
      toast.error(e.message || "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function enableBrowserPush() {
    setSaving(true);
    try {
      const r = await registerBrowserPushInterest();
      if (r.ok) toast.success("Browser notifications enabled");
      else toast.info(r.reason === "unsupported" ? "Not supported on this device" : "Permission not granted");
    } finally {
      setSaving(false);
    }
  }

  const native = prefs?.nativePush || {};
  const localDiag = getNativePushDiagnostics();

  return (
    <section className="ccweb-card-premium space-y-4 rounded-2xl border border-white/10 p-4">
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-ccweb-cyan" aria-hidden />
        <h2 className="text-sm font-semibold text-white">Notification preferences</h2>
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-ccweb-muted" aria-hidden />}
      </div>

      {isCapacitorNative() && (
        <div className="space-y-3 rounded-xl border border-ccweb-cyan/20 bg-slate-950/40 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-ccweb-cyan" aria-hidden />
              <div>
                <p className="text-sm font-medium text-white">Mobile push (FCM)</p>
                <p className="text-xs text-ccweb-muted">Real alerts via Firebase — not simulated.</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={native.enabled === true}
              onChange={(e) => toggleNative(e.target.checked)}
              aria-label="Enable mobile push"
            />
          </div>

          {native.enabled && (
            <div className="grid gap-2 sm:grid-cols-2">
              {NATIVE_CATEGORIES.map(({ key, label }) => (
                <label key={key} className="flex items-center justify-between gap-2 rounded-lg border border-white/5 px-3 py-2 text-xs">
                  <span className="text-ccweb-muted">{label}</span>
                  <input
                    type="checkbox"
                    checked={native[key] !== false}
                    onChange={(e) => toggleCategory(key, e.target.checked)}
                  />
                </label>
              ))}
            </div>
          )}

          <p className="text-[11px] text-ccweb-muted">
            Token: {localDiag.tokenPresent ? localDiag.tokenPreview : "not registered"}
            {diag?.fcmConfigured === false && " · Server FCM not configured"}
            {diag?.deliverySummary24h && (
              <>
                {" "}
                · 24h: {diag.deliverySummary24h.sent} sent, {diag.deliverySummary24h.skipped} skipped
              </>
            )}
          </p>
        </div>
      )}

      {!isCapacitorNative() && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2">
          <div>
            <p className="text-sm text-white">Browser notifications</p>
            <p className="text-xs text-ccweb-muted">Web push (requires service worker + VAPID in a future phase).</p>
          </div>
          <button type="button" className="ccweb-outline-btn px-3 py-1.5 text-xs" onClick={enableBrowserPush}>
            Enable
          </button>
        </div>
      )}
    </section>
  );
}
