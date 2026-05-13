import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ImagePlus, Loader2, Sparkles } from "lucide-react";
import {
  fetchCreatorMarketplaceListings,
  fetchMarketplaceListingPrivateBundle,
  postMarketplaceAiVersion,
  postMarketplaceListing,
  postMarketplaceSku,
  postMarketplaceStoreMe,
  putMarketplaceListing,
  uploadMarketplaceImage,
} from "../../api/marketplaceCatalogApi";
import { toast } from "../../lib/toastBus";

const KINDS = ["tool", "agent", "workflow", "prompt_pack", "bundle", "digital"];

export function MarketplaceCreatorStudioPage() {
  const [onboarded, setOnboarded] = useState(() =>
    typeof localStorage !== "undefined" ? localStorage.getItem("ccweb_mp_studio_onboarded") === "1" : true
  );
  const [busy, setBusy] = useState(false);
  const [listings, setListings] = useState([]);
  const [storeTitle, setStoreTitle] = useState("");
  const [storeSlug, setStoreSlug] = useState("");
  const [storeTagline, setStoreTagline] = useState("");
  const [storeDesc, setStoreDesc] = useState("");

  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newKind, setNewKind] = useState("tool");
  const [newCategory, setNewCategory] = useState("general");
  const [newTags, setNewTags] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [publishNow, setPublishNow] = useState(false);

  const [selId, setSelId] = useState(null);
  const [bundle, setBundle] = useState(null);
  const [skuLabel, setSkuLabel] = useState("Standard");
  const [skuUsd, setSkuUsd] = useState("499");
  const [skuNgn, setSkuNgn] = useState("0");
  const [skuBilling, setSkuBilling] = useState("once");
  const [skuDays, setSkuDays] = useState("");

  const [aiAgentJson, setAiAgentJson] = useState("{}");
  const [aiExecJson, setAiExecJson] = useState("{}");
  const [aiChangelog, setAiChangelog] = useState("");

  const dismissOnboard = useCallback(() => {
    setOnboarded(true);
    try {
      localStorage.setItem("ccweb_mp_studio_onboarded", "1");
    } catch {
      /* */
    }
  }, []);

  const loadListings = useCallback(async () => {
    const data = await fetchCreatorMarketplaceListings(80);
    setListings(data.listings || []);
  }, []);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        await postMarketplaceStoreMe({});
        await loadListings();
      } catch (e) {
        if (!c) toast.error(e.message || "Could not load studio");
      }
    })();
    return () => {
      c = true;
    };
  }, [loadListings]);

  useEffect(() => {
    if (!selId) {
      setBundle(null);
      return;
    }
    let c = false;
    fetchMarketplaceListingPrivateBundle(selId)
      .then((b) => {
        if (!c) setBundle(b);
      })
      .catch((e) => {
        if (!c) toast.error(e.message || "Could not load listing");
      });
    return () => {
      c = true;
    };
  }, [selId]);

  const selected = useMemo(() => listings.find((l) => l.id === selId) || null, [listings, selId]);

  async function saveStore(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await postMarketplaceStoreMe({
        title: storeTitle || undefined,
        slug: storeSlug || undefined,
        tagline: storeTagline || undefined,
        description: storeDesc || undefined,
      });
      toast.success("Storefront saved.");
    } catch (err) {
      toast.error(err.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function onUploadBanner(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    try {
      const { url } = await uploadMarketplaceImage(f);
      await postMarketplaceStoreMe({ bannerUrl: url });
      toast.success("Banner updated.");
    } catch (err) {
      toast.error(err.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function createListing(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const tags = newTags
        .split(/[,#\s]+/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      const out = await postMarketplaceListing({
        title: newTitle,
        slug: newSlug || undefined,
        kind: newKind,
        categorySlug: newCategory,
        tags,
        description: newDesc,
        publish: publishNow,
      });
      toast.success("Listing created.");
      setNewTitle("");
      setNewSlug("");
      setNewTags("");
      setNewDesc("");
      await loadListings();
      if (out.listing?.id) setSelId(out.listing.id);
    } catch (err) {
      toast.error(err.message || "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function addSku(e) {
    e.preventDefault();
    if (!selId) return;
    setBusy(true);
    try {
      await postMarketplaceSku(selId, {
        label: skuLabel,
        priceUsdCents: Math.round(Number(skuUsd || 0) * 100),
        priceNgn: Math.round(Number(skuNgn || 0)),
        billing: skuBilling,
        entitlementDays: skuDays ? Number(skuDays) : undefined,
      });
      toast.success("SKU added.");
      const b = await fetchMarketplaceListingPrivateBundle(selId);
      setBundle(b);
    } catch (err) {
      toast.error(err.message || "SKU failed");
    } finally {
      setBusy(false);
    }
  }

  async function publishListing() {
    if (!selId) return;
    setBusy(true);
    try {
      await putMarketplaceListing(selId, { status: "published" });
      toast.success("Submitted for publication. If review mode is on, it stays pending until approved.");
      await loadListings();
      const b = await fetchMarketplaceListingPrivateBundle(selId);
      setBundle(b);
    } catch (err) {
      toast.error(err.message || "Publish failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveAiVersion(e) {
    e.preventDefault();
    if (!selId) return;
    setBusy(true);
    try {
      let agentConfig = {};
      let executionConfig = {};
      try {
        agentConfig = JSON.parse(aiAgentJson || "{}");
      } catch {
        throw new Error("Agent JSON invalid");
      }
      try {
        executionConfig = JSON.parse(aiExecJson || "{}");
      } catch {
        throw new Error("Execution JSON invalid");
      }
      await postMarketplaceAiVersion(selId, {
        agentConfig,
        executionConfig,
        prompts: [],
        changelog: aiChangelog || "Version update",
      });
      toast.success("AI configuration version saved.");
      const b = await fetchMarketplaceListingPrivateBundle(selId);
      setBundle(b);
    } catch (err) {
      toast.error(err.message || "AI save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-3 pb-14 pt-4 transition-opacity duration-300">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-ccweb-violet">Creators</p>
          <h1 className="text-2xl font-bold text-white md:text-3xl">Publishing studio</h1>
          <p className="mt-1 max-w-2xl text-sm text-ccweb-muted">
            Storefront, listings, SKUs, pricing, and AI execution configs. Set{" "}
            <code className="text-ccweb-cyan">CCWEB_MP_REQUIRE_LISTING_REVIEW=1</code> on the server for admin approval before listings go live.
          </p>
        </div>
        <Link to="/shop/creator/dashboard" className="text-sm font-medium text-ccweb-cyan hover:underline">
          Open analytics dashboard →
        </Link>
      </header>

      {!onboarded && (
        <div className="ccweb-glass flex flex-col gap-3 rounded-2xl border border-ccweb-cyan/25 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <Sparkles className="mt-0.5 h-6 w-6 shrink-0 text-ccweb-cyan" />
            <div>
              <p className="font-semibold text-white">Welcome to the creator studio</p>
              <p className="text-sm text-ccweb-muted">
                Start with your storefront, add a listing, attach a SKU with real prices, then publish an AI configuration buyers can follow in Build → AI agents.
              </p>
            </div>
          </div>
          <button type="button" className="ccweb-gradient-btn shrink-0 px-4 py-2 text-sm" onClick={dismissOnboard}>
            Got it
          </button>
        </div>
      )}

      <section className="ccweb-glass rounded-2xl p-5 transition-transform duration-300">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <CheckCircle2 className="h-5 w-5 text-ccweb-green" />
          Storefront
        </h2>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={saveStore}>
          <label className="block text-xs text-ccweb-muted sm:col-span-2">
            Title
            <input
              className="ccweb-input mt-1 w-full"
              value={storeTitle}
              onChange={(e) => setStoreTitle(e.target.value)}
              placeholder="My CCWEB store"
            />
          </label>
          <label className="block text-xs text-ccweb-muted">
            URL slug
            <input className="ccweb-input mt-1 w-full" value={storeSlug} onChange={(e) => setStoreSlug(e.target.value)} placeholder="acme-labs" />
          </label>
          <label className="block text-xs text-ccweb-muted">
            Tagline
            <input className="ccweb-input mt-1 w-full" value={storeTagline} onChange={(e) => setStoreTagline(e.target.value)} placeholder="Ship AI faster" />
          </label>
          <label className="block text-xs text-ccweb-muted sm:col-span-2">
            Description
            <textarea className="ccweb-input mt-1 min-h-[88px] w-full" value={storeDesc} onChange={(e) => setStoreDesc(e.target.value)} />
          </label>
          <div className="sm:col-span-2">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ccweb-muted">
              <ImagePlus className="h-4 w-4" />
              Banner image
              <input type="file" accept="image/*" className="hidden" onChange={onUploadBanner} />
            </label>
          </div>
          <button type="submit" className="ccweb-gradient-btn mt-2 w-fit px-5 py-2 text-sm sm:col-span-2" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save storefront"}
          </button>
        </form>
      </section>

      <section className="ccweb-glass rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-white">New listing</h2>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={createListing}>
          <label className="block text-xs text-ccweb-muted sm:col-span-2">
            Title
            <input className="ccweb-input mt-1 w-full" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
          </label>
          <label className="block text-xs text-ccweb-muted">
            Slug (optional)
            <input className="ccweb-input mt-1 w-full" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} />
          </label>
          <label className="block text-xs text-ccweb-muted">
            Kind
            <select className="ccweb-input mt-1 w-full" value={newKind} onChange={(e) => setNewKind(e.target.value)}>
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-ccweb-muted">
            Category slug
            <input className="ccweb-input mt-1 w-full" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
          </label>
          <label className="block text-xs text-ccweb-muted sm:col-span-2">
            Tags (comma separated)
            <input className="ccweb-input mt-1 w-full" value={newTags} onChange={(e) => setNewTags(e.target.value)} placeholder="web3, automation, defi" />
          </label>
          <label className="block text-xs text-ccweb-muted sm:col-span-2">
            Description
            <textarea className="ccweb-input mt-1 min-h-[100px] w-full" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} required />
          </label>
          <label className="flex items-center gap-2 text-sm text-ccweb-muted sm:col-span-2">
            <input type="checkbox" checked={publishNow} onChange={(e) => setPublishNow(e.target.checked)} className="rounded border-white/20" />
            Publish immediately (subject to moderation policy)
          </label>
          <button type="submit" className="ccweb-gradient-btn w-fit px-5 py-2 text-sm sm:col-span-2" disabled={busy}>
            Create listing
          </button>
        </form>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="ccweb-glass rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-white">Your listings</h2>
          <ul className="mt-3 max-h-[420px] space-y-2 overflow-y-auto text-sm">
            {listings.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => setSelId(l.id)}
                  className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                    selId === l.id ? "border-ccweb-cyan/50 bg-ccweb-cyan/10" : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <span className="font-medium text-white">{l.title}</span>
                  <span className="ml-2 text-xs text-ccweb-muted">
                    {l.status} · {l.moderationStatus}
                  </span>
                </button>
              </li>
            ))}
            {listings.length === 0 && <li className="text-ccweb-muted">No listings yet.</li>}
          </ul>
        </section>

        <section className="ccweb-glass rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-white">Listing detail</h2>
          {!selected ? (
            <p className="mt-3 text-sm text-ccweb-muted">Select a listing to manage SKUs and AI versions.</p>
          ) : (
            <div className="mt-3 space-y-4 text-sm">
              <p className="text-ccweb-muted">
                <span className="font-semibold text-white">{selected.title}</span> · slug{" "}
                <code className="text-ccweb-cyan">{selected.slug}</code>
              </p>
              {selected.status !== "published" && (
                <button type="button" className="rounded-lg bg-ccweb-green/80 px-3 py-1.5 text-xs font-semibold text-black" onClick={publishListing} disabled={busy}>
                  Mark published
                </button>
              )}
              <form className="space-y-2 border-t border-white/10 pt-3" onSubmit={addSku}>
                <p className="text-xs font-semibold uppercase text-ccweb-muted">Add SKU</p>
                <input className="ccweb-input w-full" placeholder="Label" value={skuLabel} onChange={(e) => setSkuLabel(e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                  <input className="ccweb-input" placeholder="USD price" value={skuUsd} onChange={(e) => setSkuUsd(e.target.value)} />
                  <input className="ccweb-input" placeholder="NGN price (whole)" value={skuNgn} onChange={(e) => setSkuNgn(e.target.value)} />
                </div>
                <select className="ccweb-input w-full" value={skuBilling} onChange={(e) => setSkuBilling(e.target.value)}>
                  <option value="once">One-time</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
                <input className="ccweb-input w-full" placeholder="Entitlement days (optional)" value={skuDays} onChange={(e) => setSkuDays(e.target.value)} />
                <button type="submit" className="ccweb-outline-btn text-xs" disabled={busy}>
                  Add SKU
                </button>
              </form>
              {bundle?.skus?.length > 0 && (
                <ul className="text-xs text-ccweb-muted">
                  {bundle.skus.map((s) => (
                    <li key={s.id}>
                      {s.label} — ${(s.priceUsdCents / 100).toFixed(2)} / ₦{s.priceNgn} ({s.billing})
                    </li>
                  ))}
                </ul>
              )}
              <form className="space-y-2 border-t border-white/10 pt-3" onSubmit={saveAiVersion}>
                <p className="text-xs font-semibold uppercase text-ccweb-muted">AI version (JSON)</p>
                <textarea className="ccweb-input font-mono text-xs" rows={5} value={aiAgentJson} onChange={(e) => setAiAgentJson(e.target.value)} />
                <textarea className="ccweb-input font-mono text-xs" rows={4} value={aiExecJson} onChange={(e) => setAiExecJson(e.target.value)} />
                <input className="ccweb-input w-full" placeholder="Changelog" value={aiChangelog} onChange={(e) => setAiChangelog(e.target.value)} />
                <button type="submit" className="ccweb-gradient-btn text-xs" disabled={busy}>
                  Save AI version
                </button>
              </form>
            </div>
          )}
        </section>
      </div>

      <p className="text-center text-xs text-ccweb-muted">
        <Link to="/shop" className="text-ccweb-cyan hover:underline">
          ← Shop home
        </Link>
      </p>
    </div>
  );
}
