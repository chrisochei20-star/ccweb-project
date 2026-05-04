import { Link } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";

async function j(path, opts = {}) {
  const res = await fetch(`/api/growth${path}`, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export function GrowthHubPage() {
  const [tab, setTab] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [leads, setLeads] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [suggestions, setSuggestions] = useState(null);
  const [err, setErr] = useState(null);
  const [msg, setMsg] = useState(null);

  const [newListing, setNewListing] = useState({ title: "", type: "service", industry: "services", priceUsd: 499, description: "" });
  const [campaignForm, setCampaignForm] = useState({
    name: "Q3 organic pipeline",
    objective: "leads",
    channels: ["linkedin", "blog"],
    industries: ["consulting"],
  });
  const [leadForm, setLeadForm] = useState({ businessId: "biz-demo-1", industry: "consulting", region: "EU" });

  const loadAll = useCallback(async () => {
    setErr(null);
    try {
      const [o, l, ord, cmp] = await Promise.all([
        j("/overview"),
        j("/listings"),
        j("/orders"),
        j("/campaigns"),
      ]);
      setOverview(o);
      setListings(l.listings || []);
      setOrders(ord.orders || []);
      setCampaigns(cmp.campaigns || []);
      const leadRes = await fetch("/api/growth/leads?businessId=biz-demo-1").then((r) => r.json());
      setLeads(leadRes.leads || []);
    } catch (e) {
      setErr(e.message);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function createListing() {
    setErr(null);
    setMsg(null);
    try {
      await j("/listings", { method: "POST", body: JSON.stringify({ ...newListing, sellerId: "biz-demo-1", sellerName: "Demo Co" }) });
      setMsg("Listing created.");
      loadAll();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function fundOrder(listingId) {
    setErr(null);
    try {
      const data = await j("/orders", {
        method: "POST",
        body: JSON.stringify({ listingId, buyerId: "buyer-demo", buyerName: "Alex Buyer" }),
      });
      setMsg(`Order ${data.id} — funds in escrow (simulated).`);
      loadAll();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function deliverOrder(id) {
    await j(`/orders/${id}/deliver`, { method: "POST", body: JSON.stringify({}) });
    setMsg("Marked delivered — awaiting buyer confirm.");
    loadAll();
  }

  async function confirmOrder(id) {
    await j(`/orders/${id}/confirm`, { method: "POST", body: JSON.stringify({}) });
    setMsg("Payment released (simulated).");
    loadAll();
  }

  async function createLead() {
    await j("/leads", { method: "POST", body: JSON.stringify(leadForm) });
    loadAll();
  }

  async function createCampaign() {
    const c = await j("/campaigns", { method: "POST", body: JSON.stringify({ ...campaignForm, businessId: "biz-demo-1" }) });
    setMsg(`Campaign ${c.id} created.`);
    loadAll();
    const s = await j(`/campaigns/${c.id}/suggestions`);
    setSuggestions(s);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-20 pt-4">
      <header className="rounded-2xl border border-ccweb-border bg-ccweb-card p-6 backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-ccweb-cyan">Build · Business Automation</p>
        <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">Global Marketing Agent &amp; Growth Hub</h1>
        <p className="mt-2 max-w-3xl text-sm text-ccweb-muted">
          Organic-first marketing workspace: research, channel suggestions, lead scoring, marketplace listings, and escrow-style
          pay-on-delivery flows. No bulk spam — human approval before publish; follow each network&apos;s rules.
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

      {err && <p className="text-sm text-rose-400">{err}</p>}
      {msg && <p className="text-sm text-emerald-300">{msg}</p>}

      {tab === "overview" && overview && (
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
            <p className="mt-2 text-xs text-ccweb-muted">Lead fee (prototype): ${overview.leadFeeUsd} + fee share on convert</p>
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
                <li key={l.id} className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-white">{l.title}</p>
                      <p className="text-xs text-ccweb-muted">
                        {l.type} · {l.industry} · ${l.priceUsd}
                      </p>
                    </div>
                    <button type="button" className="rounded-lg bg-ccweb-green/90 px-3 py-1 text-xs font-semibold text-[#061329]" onClick={() => fundOrder(l.id)}>
                      Buy (escrow)
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-2xl border border-ccweb-border bg-ccweb-card p-5 backdrop-blur-xl">
            <h2 className="text-lg font-semibold text-white">List a product or service</h2>
            <div className="mt-4 space-y-2">
              <input className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white" placeholder="Title" value={newListing.title} onChange={(e) => setNewListing({ ...newListing, title: e.target.value })} />
              <select className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white" value={newListing.industry} onChange={(e) => setNewListing({ ...newListing, industry: e.target.value })}>
                {["e-commerce", "real-estate", "services", "consulting", "saas", "local-retail"].map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
              <input type="number" className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white" value={newListing.priceUsd} onChange={(e) => setNewListing({ ...newListing, priceUsd: Number(e.target.value) })} />
              <textarea className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white" rows={3} placeholder="Description" value={newListing.description} onChange={(e) => setNewListing({ ...newListing, description: e.target.value })} />
              <button type="button" className="rounded-xl bg-gradient-to-r from-ccweb-cyan to-ccweb-violet px-4 py-2 text-sm font-semibold text-[#061329]" onClick={createListing}>
                Publish listing
              </button>
            </div>
          </section>
        </div>
      )}

      {tab === "escrow" && (
        <section className="rounded-2xl border border-ccweb-border bg-ccweb-card p-5 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white">Escrow flow (simulated)</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-ccweb-muted">
            <li>Customer pays → order status <code className="text-ccweb-cyan">escrow_funded</code></li>
            <li>Business delivers → <strong className="text-white">Mark delivered</strong></li>
            <li>Customer confirms → <strong className="text-white">Release payment</strong> (CCWEB fee deducted)</li>
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
                    {o.status === "escrow_funded" && (
                      <button type="button" className="rounded-lg border border-white/20 px-3 py-1 text-xs text-white" onClick={() => deliverOrder(o.id)}>
                        Mark delivered
                      </button>
                    )}
                    {o.status === "delivered_pending_confirm" && (
                      <button type="button" className="rounded-lg bg-ccweb-green/90 px-3 py-1 text-xs font-semibold text-[#061329]" onClick={() => confirmOrder(o.id)}>
                        Confirm &amp; release
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === "campaigns" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-ccweb-border bg-ccweb-card p-5 backdrop-blur-xl">
            <h2 className="text-lg font-semibold text-white">Marketing agent campaign</h2>
            <p className="mt-1 text-xs text-ccweb-muted">Channels: X, Facebook, Instagram, LinkedIn — suggestions only; comply with each platform.</p>
            <input className="mt-3 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white" value={campaignForm.name} onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })} />
            <button type="button" className="mt-3 rounded-xl bg-gradient-to-r from-ccweb-cyan to-ccweb-violet px-4 py-2 text-sm font-semibold text-[#061329]" onClick={createCampaign}>
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
              Simulate qualified lead
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
        API: <code className="text-ccweb-cyan">/api/growth/*</code> ·{" "}
        <Link to="/earn" className="text-ccweb-cyan underline">
          Earn pillar
        </Link>
      </p>
    </div>
  );
}
