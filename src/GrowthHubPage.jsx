import { Link, useOutletContext } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { Loader2, ShoppingBag } from "lucide-react";
import { http } from "./api/http";
import { prepareEscrowCheckout } from "./api/paymentsApi";
import { apiUrl } from "./config/env";
import { apiFetch } from "./lib/apiClient";
import { useFlutterwaveCheckout } from "./hooks/useFlutterwaveCheckout";
import { getSessionToken } from "./session";
import { formatUserFacingError } from "./lib/userFacingError";
import { EmptyState } from "./components/ui/EmptyState";

async function j(path, opts = {}) {
  const res = await apiFetch(apiUrl(`/api/growth${path}`), opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export function GrowthHubPage({ initialTab = "overview" } = {}) {
  const { user } = useOutletContext() || {};
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const [hubLoading, setHubLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [leads, setLeads] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [suggestions, setSuggestions] = useState(null);
  const [err, setErr] = useState(null);
  const [msg, setMsg] = useState(null);
  const [checkoutListingId, setCheckoutListingId] = useState(null);
  const [listingImage, setListingImage] = useState(null);
  const [listingImagePreview, setListingImagePreview] = useState(null);
  const [uploadingListing, setUploadingListing] = useState(false);
  const [newListing, setNewListing] = useState({
    title: "",
    type: "service",
    industry: "services",
    priceUsd: 499,
    description: "",
  });
  const [campaignForm, setCampaignForm] = useState({
    name: "Q3 organic pipeline",
    objective: "leads",
    channels: ["linkedin", "blog"],
    industries: ["consulting"],
  });
  const [leadForm, setLeadForm] = useState({ industry: "consulting", region: "EU" });

  const fwPublicKey = (import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || "").trim();

  const loadOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      return;
    }
    try {
      const { data } = await http.get("/api/growth/orders");
      setOrders(data.orders || []);
    } catch {
      setOrders([]);
    }
  }, [user]);

  const loadAll = useCallback(async () => {
    setErr(null);
    setHubLoading(true);
    try {
      const [o, l, cmp] = await Promise.all([j("/overview"), j("/listings"), j("/campaigns")]);
      setOverview(o);
      setListings(l.listings || []);
      setCampaigns(cmp.campaigns || []);
      await loadOrders();
      if (user?.id) {
        const leadR = await apiFetch(apiUrl(`/api/growth/leads?businessId=${encodeURIComponent(user.id)}`));
        const leadRes = await leadR.json();
        setLeads(leadRes.leads || []);
      } else {
        setLeads([]);
      }
    } catch (e) {
      setErr(formatUserFacingError(e, "Could not load marketplace data."));
    } finally {
      setHubLoading(false);
    }
  }, [user?.id, loadOrders]);

  const fwCheckout = useFlutterwaveCheckout({
    publicKey: fwPublicKey,
    user,
    title: "CCWEB Escrow",
    onVerified: async (result) => {
      setMsg(
        result?.duplicate
          ? "Payment already recorded — escrow status updated."
          : "Payment verified — escrow funded."
      );
      setCheckoutListingId(null);
      await loadAll();
    },
    onCancel: () => setCheckoutListingId(null),
  });

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function createListing() {
    setErr(null);
    setMsg(null);
    if (!user) {
      setErr("Sign in to publish a listing.");
      return;
    }
    if (!newListing.title.trim()) {
      setErr("Title is required.");
      return;
    }
    try {
      let imageUrl = null;
      if (listingImage) {
        setUploadingListing(true);
        const fd = new FormData();
        fd.append("file", listingImage);
        const token = localStorage.getItem("ccweb_session_token") || sessionStorage.getItem("ccweb_session_token");
        const up = await fetch("https://ccweb-api-production-a92c.up.railway.app/api/v1/uploads/media?folder=marketplace", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
        const upData = await up.json();
        imageUrl = upData.url || null;
        setUploadingListing(false);
      }
      await http.post("/api/growth/listings", {
        ...newListing,
        imageUrl,
        sellerName: user.displayName || "Seller",
      });
      setMsg("Listing published.");
      setListingImage(null);
      setListingImagePreview(null);
      loadAll();
    } catch (e) {
      setErr(e.response?.data?.error || e.message || "Failed");
    }
  }

  async function startEscrowCheckout(listingId) {
    setErr(null);
    setMsg(null);
    if (!user) {
      setErr("Sign in to purchase.");
      return;
    }
    if (fwCheckout.isBusy) return;
    setCheckoutListingId(listingId);
    try {
      await fwCheckout.startCheckout(() =>
        prepareEscrowCheckout({
          listingId,
          buyerName: user.displayName || "Customer",
        })
      );
    } catch (e) {
      setErr(fwCheckout.error || e.message || "Checkout failed");
      setCheckoutListingId(null);
    }
  }

  async function deliverOrder(id) {
    setErr(null);
    try {
      await http.post(`/api/growth/orders/${id}/deliver`, {});
      setMsg("Marked delivered — awaiting buyer confirmation.");
      loadAll();
    } catch (e) {
      setErr(e.response?.data?.error || e.message || "Failed");
    }
  }

  async function confirmOrder(id) {
    setErr(null);
    try {
      await http.post(`/api/growth/orders/${id}/confirm`, {});
      setMsg("Payment released (escrow completed).");
      loadAll();
    } catch (e) {
      setErr(e.response?.data?.error || e.message || "Failed");
    }
  }

  async function createLead() {
    if (!user) {
      setErr(getSessionToken() ? "Account is still syncing. Try again in a moment." : "Sign in to generate leads.");
      return;
    }
    await http.post("/api/growth/leads", {
      ...leadForm,
      businessId: user.id,
    });
    loadAll();
  }

  async function createCampaign() {
    if (!user) {
      setErr(getSessionToken() ? "Account is still syncing. Try again in a moment." : "Sign in to create campaigns.");
      return;
    }
    setErr(null);
    try {
      const { data: c } = await http.post("/api/growth/campaigns", {
        ...campaignForm,
        businessId: user.id,
      });
      setMsg(`Campaign ${c.id} created.`);
      loadAll();
      const s = await j(`/campaigns/${c.id}/suggestions`);
      setSuggestions(s);
    } catch (e) {
      setErr(e.response?.data?.error || e.message || "Failed");
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-20 pt-4">
      <header className="rounded-2xl border border-ccweb-border bg-ccweb-card p-6 backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-ccweb-cyan">Build · Business Automation</p>
        <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">Global Marketing Agent &amp; Growth Hub</h1>
        <p className="mt-2 max-w-3xl text-sm text-ccweb-muted">
          Organic-first workspace: listings, secure card checkout, campaigns, and lead scoring.
          Follow each network&apos;s rules — agent outputs need human approval before publish.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {["overview", "marketplace", "escrow", "campaigns", "leads"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${
                tab === t ? "bg-gradient-to-r from-ccweb-cyan to-ccweb-violet text-[#061329]" : "border border-white/15 text-ccweb-muted"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      {!user && getSessionToken() && (
        <p className="flex items-center gap-2 rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-ccweb-muted">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
          Syncing account for payments and listings…
        </p>
      )}

      {!user && !getSessionToken() && (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <Link to="/login" className="font-medium text-ccweb-cyan underline">
            Sign in
          </Link>{" "}
          to publish listings, purchase with card escrow, and manage your orders.
        </p>
      )}

      {err && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {formatUserFacingError(err, "Something went wrong.")}
          <button type="button" className="ml-2 text-ccweb-cyan underline" onClick={() => loadAll()}>
            Retry
          </button>
        </p>
      )}
      {fwCheckout.error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          <p>{fwCheckout.error}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="ccweb-outline-btn min-h-[44px] px-3 text-xs" onClick={() => fwCheckout.retryVerify()}>
              Retry verification
            </button>
            <button type="button" className="ccweb-outline-btn min-h-[44px] px-3 text-xs" onClick={() => fwCheckout.clearPaymentState()}>
              Dismiss
            </button>
          </div>
        </div>
      )}
      {fwCheckout.phase === "verifying" && (
        <p className="flex items-center gap-2 rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-ccweb-muted">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
          Confirming payment with the server…
        </p>
      )}
      {msg && <p className="text-sm text-emerald-300">{msg}</p>}

      {hubLoading && tab === "overview" && (
        <div className="flex min-h-[12rem] items-center justify-center gap-2 text-sm text-ccweb-muted" role="status">
          <Loader2 className="h-5 w-5 animate-spin text-ccweb-cyan" aria-hidden />
          Loading growth hub…
        </div>
      )}

      {tab === "overview" && !hubLoading && overview && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Leads generated", overview.metrics.leadsGenerated],
            ["Leads converted", overview.metrics.leadsConverted],
            ["Sales completed", overview.metrics.salesCompleted],
            ["Gross GMV (USD)", overview.metrics.revenueGrossUsd],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl border border-ccweb-border bg-ccweb-card p-4 backdrop-blur-xl">
              <p className="text-xs text-ccweb-muted">{k}</p>
              <p className="mt-1 text-2xl font-bold text-white">{v}</p>
            </div>
          ))}
          <div className="rounded-2xl border border-ccweb-border bg-ccweb-card p-4 backdrop-blur-xl sm:col-span-2">
            <p className="text-xs text-ccweb-muted">Platform fee</p>
            <p className="text-lg font-semibold text-ccweb-cyan">{overview.platformFeePercent}% on successful sales</p>
            <p className="mt-2 text-xs text-ccweb-muted">Lead fee: ${overview.leadFeeUsd}</p>
            <p className="mt-3 text-xs text-ccweb-muted">{overview.organicPolicy}</p>
          </div>
        </div>
      )}

      {tab === "marketplace" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-ccweb-border bg-ccweb-card p-5 backdrop-blur-xl">
            <h2 className="text-lg font-semibold text-white">Discover</h2>
            <ul className="mt-4 space-y-3">
              {listings.map((l) => (
                <li key={l.id} className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-4 transition hover:border-ccweb-cyan/25">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-white">{l.title}</p>
                      <p className="mt-1 text-xs text-ccweb-muted">
                        {l.type} · {l.industry}
                      </p>
                      <p className="mt-2 text-lg font-bold text-ccweb-cyan">${l.priceUsd}</p>
                      <p className="mt-1 text-xs text-ccweb-muted">by {l.sellerName}</p>
                    </div>
                    <button
                      type="button"
                      disabled={!user || fwCheckout.isBusy || checkoutListingId === l.id || l.sellerId === user?.id}
                      className="rounded-lg bg-ccweb-green/90 px-3 py-1 text-xs font-semibold text-[#061329] disabled:opacity-40 min-h-[44px]"
                      onClick={() => startEscrowCheckout(l.id)}
                      title={l.sellerId === user?.id ? "You cannot buy your own listing" : ""}
                    >
                      {checkoutListingId === l.id || fwCheckout.isBusy ? "Opening checkout…" : "Pay with card"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            {!fwPublicKey && (
              <p className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                Card checkout is not available right now. Browse listings and contact sellers to arrange payment.
              </p>
            )}
            {listings.length === 0 && !hubLoading && (
              <EmptyState
                icon={ShoppingBag}
                title="No listings yet"
                description="Publish your first product or service using the form on the right."
                className="mt-4 border-white/10"
              />
            )}
          </section>
          <section className="rounded-2xl border border-ccweb-border bg-ccweb-card p-5 backdrop-blur-xl">
            <h2 className="text-lg font-semibold text-white">List a product or service</h2>
            <div className="mt-4 space-y-2">
              <input
                className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
                placeholder="Title"
                value={newListing.title}
                onChange={(e) => setNewListing({ ...newListing, title: e.target.value })}
              />
              <select
                className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
                value={newListing.industry}
                onChange={(e) => setNewListing({ ...newListing, industry: e.target.value })}
              >
                {["e-commerce", "real-estate", "services", "consulting", "saas", "local-retail"].map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
                value={newListing.priceUsd}
                onChange={(e) => setNewListing({ ...newListing, priceUsd: Number(e.target.value) })}
              />
              <textarea
                className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
                rows={3}
                placeholder="Description"
                value={newListing.description}
                onChange={(e) => setNewListing({ ...newListing, description: e.target.value })}
              />
              <div className="flex items-center gap-3">
                <label className="cursor-pointer flex items-center gap-1 text-xs text-ccweb-cyan border border-ccweb-cyan/30 rounded-lg px-3 py-2 hover:bg-ccweb-cyan/10">
                  📷 Add photo
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files[0]; if (f) { setListingImage(f); setListingImagePreview(URL.createObjectURL(f)); } }} />
                </label>
                {listingImagePreview && <img src={listingImagePreview} alt="preview" className="h-12 w-12 rounded-lg object-cover border border-white/20" />}
              </div>
              <button
                type="button"
                className="rounded-xl bg-gradient-to-r from-ccweb-cyan to-ccweb-violet px-4 py-2 text-sm font-semibold text-[#061329] disabled:opacity-50"
                onClick={createListing}
                disabled={uploadingListing}
              >
                {uploadingListing ? "Uploading..." : "Publish listing"}
              </button>
            </div>
          </section>
        </div>
      )}

      {tab === "escrow" && (
        <section className="rounded-2xl border border-ccweb-border bg-ccweb-card p-5 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white">Escrow</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-ccweb-muted">
            <li>
              Buyer pays by card → order moves to escrow when payment is verified
            </li>
            <li>Seller delivers → Mark delivered</li>
            <li>Buyer confirms → Release payment (platform fee retained)</li>
          </ol>
          <ul className="mt-6 space-y-3">
            {orders.map((o) => (
              <li key={o.id} className="rounded-xl border border-white/10 bg-black/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-white">{o.listingTitle}</p>
                    <p className="text-xs text-ccweb-muted">
                      {o.id} · ${o.amountUsd} · {o.status}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {o.status === "pending_payment" && <span className="text-xs text-amber-200">Awaiting payment</span>}
                    {o.status === "escrow_funded" && user?.id === o.sellerId && (
                      <button
                        type="button"
                        className="rounded-lg border border-white/20 px-3 py-1 text-xs text-white"
                        onClick={() => deliverOrder(o.id)}
                      >
                        Mark delivered
                      </button>
                    )}
                    {o.status === "delivered_pending_confirm" && user?.id === o.buyerId && (
                      <button
                        type="button"
                        className="rounded-lg bg-ccweb-green/90 px-3 py-1 text-xs font-semibold text-[#061329]"
                        onClick={() => confirmOrder(o.id)}
                      >
                        Confirm &amp; release
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {user && orders.length === 0 && <p className="mt-4 text-sm text-ccweb-muted">No orders yet.</p>}
        </section>
      )}

      {tab === "campaigns" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-ccweb-border bg-ccweb-card p-5 backdrop-blur-xl">
            <h2 className="text-lg font-semibold text-white">Marketing agent campaign</h2>
            <p className="mt-1 text-xs text-ccweb-muted">Channels: X, Facebook, Instagram, LinkedIn — suggestions only.</p>
            <input
              className="mt-3 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
              value={campaignForm.name}
              onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
            />
            <button
              type="button"
              className="mt-3 rounded-xl bg-gradient-to-r from-ccweb-cyan to-ccweb-violet px-4 py-2 text-sm font-semibold text-[#061329]"
              onClick={createCampaign}
            >
              Create &amp; get AI suggestions
            </button>
          </section>
          {suggestions && (
            <section className="rounded-2xl border border-ccweb-border bg-ccweb-card p-5 backdrop-blur-xl">
              <h3 className="font-semibold text-white">Agent output (drafts)</h3>
              <div className="mt-3 max-h-80 space-y-3 overflow-y-auto text-xs text-ccweb-muted">
                {suggestions.posts?.map((p, i) => (
                  <div key={i} className="rounded-lg bg-black/40 p-2">
                    <p className="text-ccweb-cyan">{p.channel}</p>
                    <p className="mt-1 text-white/90">{p.draft}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {tab === "leads" && (
        <section className="rounded-2xl border border-ccweb-border bg-ccweb-card p-5 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white">Lead generation</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="rounded-xl border border-white/20 px-4 py-2 text-sm" onClick={createLead}>
              Generate qualified lead
            </button>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-ccweb-muted">
            {leads.map((l) => (
              <li key={l.id} className="flex justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                <span>
                  {l.id} · score {l.score} · {l.engagementHint}
                </span>
                <span className="text-xs">{l.complianceNote?.slice(0, 40)}…</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-center text-xs text-ccweb-muted">
        <Link to="/earn" className="text-ccweb-cyan underline">
          Open Earn hub
        </Link>
      </p>
    </div>
  );
}
