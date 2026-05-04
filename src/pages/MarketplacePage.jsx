import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { GlassCard } from "../ui/GlassCard";
import { PrimaryButton } from "../ui/PrimaryButton";
import { GhostInput } from "../ui/GhostInput";
import { api, unwrap } from "../lib/api";

export function MarketplacePage() {
  const [listings, setListings] = useState([]);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let c = true;
    unwrap(api.get("/api/growth/listings"))
      .then((d) => {
        if (c) setListings(d.listings || []);
      })
      .catch((e) => {
        if (c) setErr(e.message);
      });
    return () => {
      c = false;
    };
  }, []);

  return (
    <div className="space-y-6 pb-8">
      <header>
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ccweb-cyan">Marketplace</span>
        <h1 className="mt-1 text-2xl font-bold text-ccweb-text">Business listings</h1>
        <p className="mt-2 max-w-2xl text-sm text-ccweb-muted">
          Live data from <code className="text-ccweb-sky-300">/api/growth/listings</code>. Open a listing to start the
          escrow purchase flow (simulated).
        </p>
      </header>
      {err ? <p className="text-sm text-red-400">{err}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {listings.map((l) => (
          <Link key={l.id} to={`/marketplace/${l.id}`} className="no-underline">
            <GlassCard className="h-full transition hover:border-ccweb-cyan-400/30">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-semibold text-ccweb-text">{l.title}</h2>
                <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-xs text-ccweb-muted">
                  {l.type}
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-ccweb-muted">{l.description}</p>
              <p className="mt-3 text-sm font-semibold text-ccweb-sky-200">${l.priceUsd} USD</p>
              <span className="mt-2 inline-block text-sm text-ccweb-sky-300">View &amp; buy →</span>
            </GlassCard>
          </Link>
        ))}
      </div>
      {listings.length === 0 && !err ? (
        <GlassCard>
          <p className="text-sm text-ccweb-muted">No listings yet. Create one from the Growth Hub.</p>
          <Link to="/growth-hub" className="mt-3 inline-block text-sm font-medium text-ccweb-sky-300 hover:underline">
            Open Growth Hub
          </Link>
        </GlassCard>
      ) : null}
    </div>
  );
}

export function MarketplaceDetailPage() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [orders, setOrders] = useState([]);
  const [err, setErr] = useState(null);
  const [msg, setMsg] = useState(null);
  const [buyerId, setBuyerId] = useState("buyer-demo");
  const [buyerName, setBuyerName] = useState("Alex Buyer");

  useEffect(() => {
    if (!id) return;
    let c = true;
    Promise.all([unwrap(api.get(`/api/growth/listings/${id}`)), unwrap(api.get("/api/growth/orders"))])
      .then(([l, o]) => {
        if (!c) return;
        setListing(l);
        setOrders((o.orders || []).filter((x) => x.listingId === id));
      })
      .catch((e) => {
        if (c) setErr(e.message);
      });
    return () => {
      c = false;
    };
  }, [id]);

  async function fund() {
    setErr(null);
    setMsg(null);
    try {
      const data = await unwrap(
        api.post("/api/growth/orders", {
          listingId: id,
          buyerId: buyerId.trim(),
          buyerName: buyerName.trim(),
        })
      );
      setMsg(`Order ${data.id} — status: ${data.status || "escrow_funded"}`);
      const o = await unwrap(api.get("/api/growth/orders"));
      setOrders((o.orders || []).filter((x) => x.listingId === id));
    } catch (e) {
      setErr(e.message);
    }
  }

  async function deliver(orderId) {
    await unwrap(api.post(`/api/growth/orders/${orderId}/deliver`, {}));
    setMsg("Marked delivered.");
    const o = await unwrap(api.get("/api/growth/orders"));
    setOrders((o.orders || []).filter((x) => x.listingId === id));
  }

  async function confirm(orderId) {
    await unwrap(api.post(`/api/growth/orders/${orderId}/confirm`, {}));
    setMsg("Payment released.");
    const o = await unwrap(api.get("/api/growth/orders"));
    setOrders((o.orders || []).filter((x) => x.listingId === id));
  }

  if (err && !listing) {
    return (
      <GlassCard>
        <p className="text-red-400">{err}</p>
        <Link to="/marketplace" className="mt-3 inline-block text-ccweb-sky-300">
          ← Back
        </Link>
      </GlassCard>
    );
  }

  if (!listing) {
    return <p className="text-ccweb-muted">Loading…</p>;
  }

  return (
    <div className="space-y-6 pb-8">
      <Link to="/marketplace" className="text-sm text-ccweb-sky-300 hover:underline">
        ← All listings
      </Link>
      <GlassCard>
        <h1 className="text-2xl font-bold text-ccweb-text">{listing.title}</h1>
        <p className="mt-2 text-sm text-ccweb-muted">{listing.description}</p>
        <p className="mt-4 text-xl font-semibold text-ccweb-sky-200">${listing.priceUsd} USD</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs text-ccweb-muted">Buyer ID</label>
            <GhostInput value={buyerId} onChange={(e) => setBuyerId(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-xs text-ccweb-muted">Buyer name</label>
            <GhostInput value={buyerName} onChange={(e) => setBuyerName(e.target.value)} className="mt-1" />
          </div>
        </div>
        <PrimaryButton type="button" className="mt-4" onClick={fund}>
          Pay into escrow (simulated)
        </PrimaryButton>
      </GlassCard>

      {msg ? <p className="text-sm text-ccweb-green-400">{msg}</p> : null}
      {err ? <p className="text-sm text-red-400">{err}</p> : null}

      <GlassCard>
        <h2 className="text-lg font-semibold text-ccweb-text">Orders &amp; escrow</h2>
        <p className="mt-1 text-xs text-ccweb-muted">
          Status flow: <strong>pending</strong> (funded) → <strong>delivered</strong> → <strong>released</strong> after
          buyer confirm.
        </p>
        <ul className="mt-4 space-y-3">
          {orders.length === 0 ? (
            <li className="text-sm text-ccweb-muted">No orders for this listing yet.</li>
          ) : (
            orders.map((o) => (
              <li
                key={o.id}
                className="rounded-[14px] border border-white/10 bg-white/[0.03] p-3 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs text-ccweb-sky-200">{o.id}</span>
                  <span className="rounded-full border border-ccweb-cyan-400/30 px-2 py-0.5 text-xs uppercase text-ccweb-sky-100">
                    {o.status === "completed"
                      ? "released"
                      : o.status === "delivered_pending_confirm"
                        ? "delivered"
                        : o.status === "escrow_funded"
                          ? "pending"
                          : o.status}
                  </span>
                </div>
                <p className="mt-1 text-ccweb-muted">
                  Buyer: {o.buyerName} · ${o.amountUsd ?? listing.priceUsd} USD
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {o.status === "escrow_funded" && (
                    <button
                      type="button"
                      onClick={() => deliver(o.id)}
                      className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-ccweb-text hover:bg-white/[0.06]"
                    >
                      Mark delivered (seller)
                    </button>
                  )}
                  {o.status === "delivered_pending_confirm" && (
                    <button
                      type="button"
                      onClick={() => confirm(o.id)}
                      className="rounded-lg border border-ccweb-green-400/30 px-3 py-1.5 text-xs font-medium text-ccweb-green-300 hover:bg-white/[0.06]"
                    >
                      Confirm &amp; release (buyer)
                    </button>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      </GlassCard>
    </div>
  );
}
