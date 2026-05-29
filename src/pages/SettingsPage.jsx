import { ExternalLink, HelpCircle, Scale, Shield, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { NotificationPreferencesPanel } from "../components/notifications/NotificationPreferencesPanel";
import { isCapacitorNative } from "../lib/capacitorPlatform";
import { fetchPushDiagnosticsFromApi, getNativePushDiagnostics } from "../lib/nativePush";
import { useAppShellContext } from "../hooks/useAppShellContext";

const APP_VERSION = "1.2.0";
const VERSION_CODE = 3;

const SUPPORT_EMAIL = "support@chrisccweb.com";
const PRIVACY_URL = "/privacy";
const TERMS_URL = "/terms";

export function SettingsPage() {
  const { user, authHydrated } = useAppShellContext();
  const [pushDiag, setPushDiag] = useState(null);
  const native = isCapacitorNative();
  const buildId = import.meta.env.VITE_CCWEB_BUILD_ID || "dev";

  useEffect(() => {
    if (!native || !user) return;
    fetchPushDiagnosticsFromApi().then(setPushDiag).catch(() => {});
  }, [native, user?.id]);

  const localPush = getNativePushDiagnostics();

  return (
    <div className="ccweb-page-enter mx-auto max-w-2xl space-y-5 px-3 pb-28 pt-4 md:pb-10">
      <header>
        <p className="ccweb-kicker text-xs font-semibold uppercase tracking-widest text-ccweb-cyan">App</p>
        <h1 className="ccweb-display-heading mt-1 text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-ccweb-muted">Notifications, legal, and support for the CCWEB Android app.</p>
      </header>

      {authHydrated && user && <NotificationPreferencesPanel />}

      <section className="ccweb-card-premium space-y-3 rounded-2xl border border-white/10 p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Scale className="h-4 w-4 text-ccweb-violet" aria-hidden />
          Legal &amp; support
        </h2>
        <nav className="grid gap-2">
          <Link to={PRIVACY_URL} className="ccweb-outline-btn flex min-h-[44px] items-center justify-between px-4 py-2 text-sm">
            Privacy policy
            <ExternalLink className="h-4 w-4 opacity-60" aria-hidden />
          </Link>
          <Link to={TERMS_URL} className="ccweb-outline-btn flex min-h-[44px] items-center justify-between px-4 py-2 text-sm">
            Terms of service
            <ExternalLink className="h-4 w-4 opacity-60" aria-hidden />
          </Link>
          <Link to="/contact" className="ccweb-outline-btn flex min-h-[44px] items-center justify-between px-4 py-2 text-sm">
            Contact
            <HelpCircle className="h-4 w-4 opacity-60" aria-hidden />
          </Link>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="ccweb-outline-btn flex min-h-[44px] items-center justify-between px-4 py-2 text-sm"
          >
            Email support
            <span className="text-xs text-ccweb-muted">{SUPPORT_EMAIL}</span>
          </a>
        </nav>
        <p className="text-[11px] leading-relaxed text-ccweb-muted">
          Play Store submission requires counsel-reviewed privacy policy and terms. Draft pages are marked accordingly until legal review is complete.
        </p>
      </section>

      {native && (
        <section className="ccweb-card-premium space-y-2 rounded-2xl border border-white/10 p-4 text-xs text-ccweb-muted">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Smartphone className="h-4 w-4 text-ccweb-cyan" aria-hidden />
            App diagnostics
          </h2>
          <p>Platform: Capacitor Android</p>
          <p>Version: {APP_VERSION} (code {VERSION_CODE})</p>
          <p>Build: {buildId || "(local)"}</p>
          <p>Push token: {localPush.tokenPresent ? localPush.tokenPreview : "not registered"}</p>
          {pushDiag && (
            <>
              <p>FCM server: {pushDiag.fcmConfigured ? "configured" : "not configured"}</p>
              <p>
                Devices: {pushDiag.devices?.length ?? 0} · 24h sent {pushDiag.deliverySummary24h?.sent ?? 0} / skipped{" "}
                {pushDiag.deliverySummary24h?.skipped ?? 0}
              </p>
            </>
          )}
        </section>
      )}

      <section className="ccweb-card-premium rounded-2xl border border-white/10 p-4 text-xs text-ccweb-muted">
        <Shield className="mb-2 h-4 w-4 text-ccweb-green" aria-hidden />
        CCWEB uses Railway for API and Vercel for web. The Android app loads the same production bundle and talks directly to Railway for auth, realtime, uploads, and push token registration.
      </section>
    </div>
  );
}
