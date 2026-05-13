import { Link, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Flag, Loader2, ShieldCheck, Wrench, BookmarkPlus, BadgeCheck } from "lucide-react";
import {
  fetchMarketplaceListingBundle,
  fetchMyMarketplaceEntitlements,
  postMarketplaceReview,
  postSaveMarketplaceLibrary,
} from "../../api/marketplaceCatalogApi";
import { initializeFlutterwaveCheckout, verifyFlutterwaveTx } from "../../api/flutterwaveApi";
import { submitTrustReport } from "../../api/trustApi";
import { Skeleton } from "../../components/ui/Skeleton";
import { toast } from "../../lib/toastBus";

export function MarketplaceListingPage() {
  const { slug } = useParams();
  const { user } = useOutletContext() || {};
  const [searchParams, setSearchParams] = useSearchParams();
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [payBusy, setPayBusy] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  const [myEntitlements, setMyEntitlements] = useState([]);
  const [libBusy, setLibBusy] = useState(false);
  const [repBusy, setRepBusy] = useState(false);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setErr(null);
    try {
      const b = await fetchMarketplaceListingBundle(slug);
      setBundle(b);
    } catch (e) {
      setErr(e.message || "Could not load listing");
      setBundle(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!user) {
      setMyEntitlements([]);
      return;
    }
    let c = false;
    fetchMyMarketplaceEntitlements(60)
      .then((d) => {
        if (!c) setMyEntitlements(d.entitlements || []);
      })
      .catch(() => {
        if (!c) setMyEntitlements([]);
      });
    return () => {
      c = true;
    };
  }, [user, slug]);

  useEffect(() => {
    const paid = searchParams.get("paid");
    const txRef = searchParams.get("tx_ref");
    if (paid === "1" && txRef && user) {
      verifyFlutterwaveTx(txRef)
        .then(() => {
          toast.success("Payment verified.");
          return load();
        })
        .catch((e) => toast.error(e.message || "Verify failed"))
        .finally(() => {
          setSearchParams({}, { replace: true });
        });
    }
  }, [searchParams, user, setSearchParams, load]);

  async function paySku(skuId, currency) {
    if (!user || !slug) {
      toast.error("Sign in to purchase.");
      return;
    }
    setPayBusy(true);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const redirectUrl = `${origin}/shop/l/${encodeURIComponent(slug)}?paid=1`;
      const out = await initializeFlutterwaveCheckout({
        kind: "marketplace_sku",
        currency,
        marketplaceSkuId: skuId,
        redirectUrl,
      });
      if (out.checkoutLink) window.location.href = out.checkoutLink;
      else toast.error("No checkout link returned.");
    } catch (e) {
      toast.error(e.message || "Checkout failed");
    } finally {
      setPayBusy(false);
    }
  }

  async function submitReview() {
    if (!user || !slug) {
      toast.error("Sign in to review.");
      return;
    }
    setReviewBusy(true);
    try {
      await postMarketplaceReview(slug, { rating, title: reviewTitle, body: reviewBody });
      toast.success("Review posted.");
      setReviewTitle("");
      setReviewBody("");
      load();
    } catch (e) {
      toast.error(e.message || "Review failed");
    } finally {
      setReviewBusy(false);
    }
  }

  async function handleSaveLibrary() {
    if (!user || !slug) {
      toast.error("Sign in to save.");
      return;
    }
    setLibBusy(true);
    try {
      await postSaveMarketplaceLibrary(slug);
      toast.success("Saved to your library.");
    } catch (e) {
      toast.error(e.message || "Save failed");
    } finally {
      setLibBusy(false);
    }
  }

  async function handleReportListing() {
    if (!user || !bundle?.listing?.id) {
      toast.error("Sign in to report.");
      return;
    }
    setRepBusy(true);
    try {
      await submitTrustReport({
        targetType: "marketplace_listing",
        targetId: bundle.listing.id,
        reasonCode: "spam",
        details: "Marketplace listing report from product page.",
      });
      toast.success("Report submitted. Trust & safety will review.");
    } catch (e) {
      toast.error(e.message || "Report failed");
    } finally {
      setRepBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-3 py-8">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-8 w-2/3 rounded-lg" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (err || !bundle?.listing) {
    return (
      <div className="mx-auto max-w-lg px-3 py-16 text-center">
        <p className="text-ccweb-muted">{err || "Listing not found."}</p>
        <Link to="/shop" className="mt-4 inline-block text-ccweb-cyan underline">
          Back to shop
        </Link>
      </div>
    );
  }

  const { listing, skus, defaultAi, reviews, reviewStats } = bundle;
  const access = myEntitlements.filter((e) => e.listingSlug === slug);
  const tags = Array.isArray(listing.tags) ? listing.tags : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-3 pb-12 pt-4">
      <div className="ccweb-glass overflow-hidden rounded-2xl">
        {listing.thumbnailUrl ? (
          <img src={listing.thumbnailUrl} alt="" className="h-52 w-full object-cover" />
        ) : (
          <div className="h-52 w-full bg-gradient-to-br from-ccweb-violet/35 to-ccweb-cyan/25" />
        )}
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-ccweb-muted">
            <span className="rounded-full bg-white/10 px-2 py-0.5 font-medium text-ccweb-cyan">{listing.kind}</span>
            <Link to={`/shop/store/${encodeURIComponent(listing.storeSlug)}`} className="hover:text-white hover:underline">
              {listing.storeTitle}
            </Link>
            {listing.storeCreatorVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-ccweb-cyan/15 px-2 py-0.5 text-ccweb-cyan">
                <BadgeCheck className="h-3.5 w-3.5" />
                Verified creator
              </span>
            ) : null}
            {reviewStats?.count > 0 ? (
              <span>
                ★ {reviewStats.avgRating.toFixed(1)} · {reviewStats.count} reviews
              </span>
            ) : (
              <span>No reviews yet</span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {user && (
              <button
                type="button"
                disabled={libBusy}
                onClick={handleSaveLibrary}
                className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 disabled:opacity-50"
              >
                <BookmarkPlus className="h-3.5 w-3.5" />
                {libBusy ? "Saving…" : "Save to library"}
              </button>
            )}
            {user && (
              <button
                type="button"
                disabled={repBusy}
                onClick={handleReportListing}
                className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 px-3 py-1.5 text-xs font-medium text-amber-200 hover:bg-amber-500/10 disabled:opacity-50"
              >
                <Flag className="h-3.5 w-3.5" />
                {repBusy ? "…" : "Report listing"}
              </button>
            )}
          </div>
          <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">{listing.title}</h1>
          {listing.subtitle ? <p className="mt-1 text-sm text-ccweb-muted">{listing.subtitle}</p> : null}
          {tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.map((tg) => (
                <span key={tg} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase text-ccweb-muted">
                  #{tg}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <section className="ccweb-glass rounded-2xl p-5">
        <h2 className="font-semibold text-white">About</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm text-ccweb-muted">{listing.description}</p>
      </section>

      {user && access.length > 0 && (
        <section className="ccweb-glass rounded-2xl border border-ccweb-green/25 p-5">
          <h2 className="font-semibold text-ccweb-green">Your access</h2>
          <ul className="mt-2 space-y-1 text-sm text-ccweb-muted">
            {access.map((a) => (
              <li key={a.id}>
                Active entitlement
                {a.validUntil ? ` · renew / review by ${new Date(a.validUntil).toLocaleDateString()}` : " · lifetime access"}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-ccweb-muted">Use Build → AI agents with the published config below while your access is valid.</p>
        </section>
      )}

      <section className="ccweb-glass rounded-2xl p-5">
        <div className="flex items-center gap-2 font-semibold text-white">
          <Wrench className="h-5 w-5 text-ccweb-cyan" />
          Install &amp; use
        </div>
        <p className="mt-2 text-sm text-ccweb-muted">{listing.installHint}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/ai-agents" className="inline-flex items-center gap-1 rounded-xl border border-ccweb-cyan/40 px-4 py-2 text-sm font-medium text-ccweb-cyan hover:bg-ccweb-cyan/10">
            Open AI agents <ExternalLink className="h-4 w-4" />
          </Link>
          <Link to="/learn" className="inline-flex items-center gap-1 rounded-xl border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/5">
            Learn hub
          </Link>
          <Link to="/earn" className="inline-flex items-center gap-1 rounded-xl border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/5">
            Earnings &amp; wallet
          </Link>
        </div>
      </section>

      {defaultAi && (
        <section className="ccweb-glass rounded-2xl p-5">
          <h2 className="flex items-center gap-2 font-semibold text-white">
            <ShieldCheck className="h-5 w-5 text-ccweb-green" />
            Published AI config (v{defaultAi.version})
          </h2>
          <p className="mt-2 text-xs text-ccweb-muted">{defaultAi.changelog || "No changelog."}</p>
          <pre className="mt-3 max-h-48 overflow-auto rounded-lg bg-black/40 p-3 text-xs text-ccweb-muted">
            {JSON.stringify(
              {
                agentConfig: defaultAi.agentConfig,
                executionConfig: defaultAi.executionConfig,
                toolManifest: defaultAi.toolManifest,
              },
              null,
              2
            )}
          </pre>
        </section>
      )}

      <section className="ccweb-glass rounded-2xl p-5">
        <h2 className="font-semibold text-white">Purchase</h2>
        <p className="mt-1 text-xs text-ccweb-muted">
          Secure checkout via Flutterwave. After payment you are redirected back here with{" "}
          <code className="text-ccweb-cyan">?paid=1&amp;tx_ref=…</code> — we verify automatically when you are signed in. Entitlements
          appear under &quot;Your access&quot; and in Earn → wallet activity.
        </p>
        {(skus || []).length === 0 ? (
          <p className="mt-3 text-sm text-ccweb-muted">No SKUs configured for this listing.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {(skus || []).map((s) => (
              <li key={s.id} className="flex flex-col gap-2 rounded-xl border border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-white">{s.label}</p>
                  <p className="text-xs text-ccweb-muted">
                    {s.billing !== "once" ? `${s.billing} · ` : ""}
                    {s.priceUsdCents > 0 ? `$${(s.priceUsdCents / 100).toFixed(2)} USD` : ""}
                    {s.priceUsdCents > 0 && s.priceNgn > 0 ? " · " : ""}
                    {s.priceNgn > 0 ? `₦${s.priceNgn.toLocaleString()} NGN` : ""}
                    {s.entitlementDays ? ` · ${s.entitlementDays}d access` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {s.priceUsdCents > 0 ? (
                    <button
                      type="button"
                      disabled={payBusy}
                      onClick={() => paySku(s.id, "USD")}
                      className="min-h-[40px] rounded-lg bg-ccweb-cyan px-3 text-sm font-semibold text-black disabled:opacity-50"
                    >
                      Pay USD
                    </button>
                  ) : null}
                  {s.priceNgn > 0 ? (
                    <button
                      type="button"
                      disabled={payBusy}
                      onClick={() => paySku(s.id, "NGN")}
                      className="min-h-[40px] rounded-lg border border-ccweb-green/50 px-3 text-sm font-medium text-ccweb-green disabled:opacity-50"
                    >
                      Pay NGN
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
        {payBusy ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-ccweb-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Starting checkout…
          </p>
        ) : null}
      </section>

      <section className="ccweb-glass rounded-2xl p-5">
        <h2 className="font-semibold text-white">Reviews</h2>
        {(reviews || []).length === 0 ? (
          <p className="mt-2 text-sm text-ccweb-muted">No reviews yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {(reviews || []).map((r) => (
              <li key={r.id} className="rounded-xl border border-white/5 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white">★ {r.rating}</span>
                  <span className="text-xs text-ccweb-muted">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                {r.title ? <p className="mt-1 font-medium text-ccweb-cyan">{r.title}</p> : null}
                <p className="mt-1 text-sm text-ccweb-muted">{r.body}</p>
              </li>
            ))}
          </ul>
        )}

        {user ? (
          <div className="mt-6 border-t border-white/10 pt-4">
            <h3 className="text-sm font-semibold text-white">Write a review</h3>
            <label className="mt-2 block text-xs text-ccweb-muted">
              Rating
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm text-white"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <input
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
              placeholder="Title (optional)"
              className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm text-white"
            />
            <textarea
              value={reviewBody}
              onChange={(e) => setReviewBody(e.target.value)}
              placeholder="Share what worked for you…"
              rows={3}
              className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm text-white"
            />
            <button
              type="button"
              disabled={reviewBusy}
              onClick={submitReview}
              className="mt-3 rounded-lg bg-ccweb-violet px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {reviewBusy ? "Posting…" : "Post review"}
            </button>
          </div>
        ) : (
          <p className="mt-4 text-sm text-ccweb-muted">Sign in to leave a review.</p>
        )}
      </section>

      <div className="text-center">
        <Link to="/shop" className="text-sm text-ccweb-cyan hover:underline">
          ← Back to marketplace
        </Link>
      </div>
    </div>
  );
}
