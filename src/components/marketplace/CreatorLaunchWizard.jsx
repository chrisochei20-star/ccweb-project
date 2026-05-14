import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, BookOpen, ChevronRight, Rocket, Sparkles, Store } from "lucide-react";
import { MARKETPLACE_STARTER_TEMPLATES } from "../../lib/marketplaceStarterTemplates";

const STEPS = ["Welcome", "Templates", "Publish", "First sale", "Stay connected"];

/**
 * Guided activation for marketplace creators (templates + tutorials + push opt-in).
 */
export function CreatorLaunchWizard({ open, onClose, onApplyTemplate }) {
  const [step, setStep] = useState(0);
  const [pushBusy, setPushBusy] = useState(false);

  const title = useMemo(() => STEPS[step] || STEPS[0], [step]);

  if (!open) return null;

  function next() {
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  function prev() {
    setStep((s) => Math.max(0, s - 1));
  }

  async function tryEnablePush() {
    setPushBusy(true);
    try {
      const m = await import("../../native/deepLinksAndPush");
      await m.registerNativePushFlow();
    } finally {
      setPushBusy(false);
    }
    onClose?.();
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-3 sm:items-center" role="dialog" aria-modal="true">
      <div className="ccweb-glass max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/15 p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-ccweb-violet">Creator launch</p>
            <h2 className="mt-1 text-xl font-bold text-white">{title}</h2>
            <p className="mt-1 text-xs text-ccweb-muted">
              Step {step + 1} of {STEPS.length}
            </p>
          </div>
          <button type="button" className="rounded-full px-3 py-1 text-xs text-ccweb-muted hover:bg-white/10" onClick={() => onClose?.()}>
            Close
          </button>
        </div>

        <div className="mt-4 flex gap-1">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-ccweb-cyan" : "bg-white/10"}`} />
          ))}
        </div>

        {step === 0 && (
          <div className="mt-5 space-y-3 text-sm text-ccweb-muted">
            <div className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-ccweb-cyan" />
              <p>
                This short walkthrough helps you publish faster: starter listing copy, a sane publish checklist, first-sale guidance, and optional
                mobile push for buyer alerts.
              </p>
            </div>
            <p className="text-xs">You can reopen this anytime from the studio header.</p>
          </div>
        )}

        {step === 1 && (
          <div className="mt-5 space-y-3">
            <p className="text-sm text-ccweb-muted">Pick a template to pre-fill your new listing form. Edit everything before publishing.</p>
            <ul className="space-y-2">
              {MARKETPLACE_STARTER_TEMPLATES.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-left text-sm text-white hover:border-ccweb-cyan/40"
                    onClick={() => {
                      onApplyTemplate?.(t);
                      next();
                    }}
                  >
                    <span>
                      <span className="font-semibold">{t.label}</span>
                      <span className="mt-0.5 block text-xs text-ccweb-muted">{t.title}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-ccweb-muted" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {step === 2 && (
          <ul className="mt-5 list-decimal space-y-2 pl-5 text-sm text-ccweb-muted">
            <li>Fill storefront title, slug, and banner — mobile shoppers see this first.</li>
            <li>Create a listing, add tags for discovery, then attach a SKU with real USD and/or NGN pricing.</li>
            <li>
              Use “Mark published”. If <code className="text-ccweb-cyan">CCWEB_MP_REQUIRE_LISTING_REVIEW=1</code> is enabled, approve in Admin Ops →
              marketplace.
            </li>
            <li>
              AI publishing: under your listing, paste valid agent + execution JSON, then save a version so buyers can follow the asset in Build.
            </li>
          </ul>
        )}

        {step === 3 && (
          <div className="mt-5 space-y-3 text-sm text-ccweb-muted">
            <p>
              After your first checkout completes, the buyer receives an entitlement on the listing page. You earn to your Flutterwave wallet balance;
              cash-out stays under Earn → payouts.
            </p>
            <p className="rounded-2xl border border-ccweb-green/25 bg-ccweb-green/5 p-3 text-xs text-ccweb-muted">
              When review mode is on, buyers only see listings marked visible in moderation. Keep SKUs active and prices aligned with what you ship.
            </p>
            <Link to="/shop/creator/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-ccweb-cyan hover:underline">
              <Rocket className="h-4 w-4" aria-hidden />
              Open sales dashboard
            </Link>
          </div>
        )}

        {step === 4 && (
          <div className="mt-5 space-y-4 text-sm text-ccweb-muted">
            <p className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <Bell className="mt-0.5 h-5 w-5 shrink-0 text-ccweb-cyan" />
              <span>
                On the native app, allow notifications to get marketplace sale pings and DM alerts when you are away. Web users still get the in-app
                notification center in real time.
              </span>
            </p>
            <button
              type="button"
              className="ccweb-gradient-btn w-full px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
              disabled={pushBusy}
              onClick={tryEnablePush}
            >
              {pushBusy ? "Requesting…" : "Enable mobile push (native)"}
            </button>
            <p className="text-xs">On web browsers this button safely no-ops. Requires Firebase/APNs setup on the server.</p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4">
          <button type="button" className="rounded-full px-4 py-2 text-sm text-ccweb-muted hover:bg-white/10" onClick={prev} disabled={step === 0}>
            Back
          </button>
          <div className="flex gap-2">
            {step < STEPS.length - 1 ? (
              <button type="button" className="ccweb-gradient-btn px-4 py-2 text-sm font-semibold" onClick={next}>
                Continue
              </button>
            ) : (
              <button type="button" className="rounded-full border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10" onClick={() => onClose?.()}>
                Done
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-xs text-ccweb-muted">
          <span className="inline-flex items-center gap-1">
            <Store className="h-3.5 w-3.5" aria-hidden /> Studio
          </span>
          <span className="inline-flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" aria-hidden /> Help: checklist above
          </span>
        </div>
      </div>
    </div>
  );
}
