import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Sparkles, Store, Tag, TrendingUp } from "lucide-react";
import {
  fetchMarketplaceCategories,
  fetchMarketplaceFeatured,
  fetchMarketplaceRecommendations,
  fetchMarketplaceTrending,
  fetchTrendingCreatorStores,
  searchMarketplaceListings,
} from "../../api/marketplaceCatalogApi";
import { Skeleton } from "../../components/ui/Skeleton";

function ListingCard({ item, onTagClick }) {
  const tags = Array.isArray(item.tags) ? item.tags : [];
  return (
    <Link
      to={`/shop/l/${encodeURIComponent(item.slug)}`}
      className="ccweb-glass flex flex-col overflow-hidden rounded-2xl border border-white/5 transition duration-200 hover:-translate-y-0.5 hover:border-ccweb-cyan/35 hover:shadow-lg hover:shadow-ccweb-cyan/5"
    >
      {item.thumbnailUrl ? (
        <img src={item.thumbnailUrl} alt="" className="h-28 w-full object-cover" loading="lazy" />
      ) : (
        <div className="h-28 w-full bg-gradient-to-br from-ccweb-violet/30 to-ccweb-cyan/20" />
      )}
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-ccweb-cyan">{item.kind}</p>
        <h3 className="mt-1 line-clamp-2 text-base font-semibold text-white">{item.title}</h3>
        <p className="mt-1 line-clamp-2 text-xs text-ccweb-muted">{item.subtitle || item.description}</p>
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.slice(0, 4).map((tg) => (
              <button
                key={tg}
                type="button"
                className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase text-ccweb-muted hover:bg-ccweb-cyan/20 hover:text-white"
                onClick={(e) => {
                  e.preventDefault();
                  onTagClick?.(tg);
                }}
              >
                #{tg}
              </button>
            ))}
          </div>
        )}
        <div className="mt-3 flex items-center justify-between text-xs text-ccweb-muted">
          <span>{item.storeTitle || "Store"}</span>
          {item.featured ? <Sparkles className="h-4 w-4 text-ccweb-violet" aria-label="Featured" /> : null}
        </div>
      </div>
    </Link>
  );
}

export function MarketplaceBrowsePage() {
  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [trendStores, setTrendStores] = useState([]);
  const [activeTag, setActiveTag] = useState(null);
  const [tagHits, setTagHits] = useState(null);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchBusy, setSearchBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let c = false;
    setLoading(true);
    setErr(null);
    Promise.all([
      fetchMarketplaceFeatured(12),
      fetchMarketplaceTrending(12),
      fetchMarketplaceCategories(32).catch(() => ({ categories: [] })),
      fetchMarketplaceRecommendations(10).catch(() => ({ listings: [] })),
      fetchTrendingCreatorStores(8).catch(() => ({ stores: [] })),
    ])
      .then(([f, t, cat, rec, st]) => {
        if (!c) {
          setFeatured(f.listings || []);
          setTrending(t.listings || []);
          setCategories(cat.categories || []);
          setRecommendations(rec.listings || []);
          setTrendStores(st.stores || []);
        }
      })
      .catch((e) => {
        if (!c) setErr(e.message || "Catalog unavailable");
      })
      .finally(() => {
        if (!c) setLoading(false);
      });
    return () => {
      c = true;
    };
  }, []);

  useEffect(() => {
    if (!activeTag) {
      setTagHits(null);
      return;
    }
    setTagHits(null);
    let c = false;
    searchMarketplaceListings({ tag: activeTag, limit: 18 })
      .then((d) => {
        if (!c) setTagHits(d.listings || []);
      })
      .catch(() => {
        if (!c) setTagHits([]);
      });
    return () => {
      c = true;
    };
  }, [activeTag]);

  const popularTags = useMemo(() => {
    const s = new Set();
    for (const l of [...featured, ...trending]) {
      for (const t of Array.isArray(l.tags) ? l.tags : []) s.add(t);
    }
    return [...s].slice(0, 14);
  }, [featured, trending]);

  const handleTag = (tg) => {
    setSearchResults(null);
    setSearchQ("");
    setActiveTag(tg);
  };

  async function runSearch() {
    const q = searchQ.trim();
    if (!q) {
      setSearchResults(null);
      return;
    }
    setActiveTag(null);
    setSearchBusy(true);
    setErr(null);
    try {
      const data = await searchMarketplaceListings({ q, limit: 24 });
      setSearchResults(data.listings || []);
    } catch (e) {
      setErr(e.message || "Search failed");
      setSearchResults([]);
    } finally {
      setSearchBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-3 pb-10 pt-4">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-ccweb-cyan">Shop</p>
        <h1 className="mt-1 text-2xl font-bold text-white md:text-3xl">Creator marketplace</h1>
        <p className="mt-1 max-w-2xl text-sm text-ccweb-muted">
          AI agents, workflows, tools, and digital goods with Flutterwave checkout, entitlements, and storefronts tied to Learn, Build, and Earn.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            to="/shop/creator/studio"
            className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-ccweb-cyan/40 hover:text-ccweb-cyan"
          >
            Creator studio
          </Link>
          <Link
            to="/shop/creator/dashboard"
            className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-ccweb-violet/40 hover:text-ccweb-violet"
          >
            Creator dashboard
          </Link>
        </div>
      </header>

      {err && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {err}
        </div>
      )}

      <div className="ccweb-glass flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center">
        <input
          type="search"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runSearch()}
          placeholder="Search listings…"
          className="min-h-[44px] flex-1 rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white placeholder:text-ccweb-muted"
        />
        <button
          type="button"
          onClick={runSearch}
          disabled={searchBusy}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-ccweb-cyan px-5 text-sm font-semibold text-black disabled:opacity-50"
        >
          {searchBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </button>
      </div>

      {categories.length > 0 && (
        <section className="ccweb-glass rounded-2xl p-4">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
            <Tag className="h-4 w-4 text-ccweb-cyan" />
            Browse categories
          </h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c.slug}
                type="button"
                className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-ccweb-muted transition hover:bg-ccweb-cyan/15 hover:text-white"
                onClick={() => {
                  setActiveTag(null);
                  setSearchResults(null);
                  setSearchQ("");
                  searchMarketplaceListings({ category: c.slug, limit: 24 }).then((d) => setSearchResults(d.listings || []));
                }}
              >
                {c.slug} · {c.listingCount}
              </button>
            ))}
          </div>
        </section>
      )}

      {popularTags.length > 0 && (
        <section className="ccweb-glass rounded-2xl p-4">
          <h2 className="mb-2 text-sm font-semibold text-white">Popular tags</h2>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tg) => (
              <button
                key={tg}
                type="button"
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  activeTag === tg ? "bg-ccweb-cyan/25 text-white" : "bg-white/5 text-ccweb-muted hover:bg-white/10"
                }`}
                onClick={() => handleTag(tg)}
              >
                #{tg}
              </button>
            ))}
          </div>
        </section>
      )}

      {activeTag && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Tag #{activeTag}</h2>
            <button type="button" className="text-xs text-ccweb-cyan hover:underline" onClick={() => setActiveTag(null)}>
              Clear
            </button>
          </div>
          {tagHits == null ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-52 rounded-2xl" />
              ))}
            </div>
          ) : tagHits.length === 0 ? (
            <p className="text-sm text-ccweb-muted">No listings for this tag.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tagHits.map((item) => (
                <ListingCard key={item.id} item={item} onTagClick={handleTag} />
              ))}
            </div>
          )}
        </section>
      )}

      {searchResults != null && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">Results</h2>
          {searchResults.length === 0 ? (
            <p className="text-sm text-ccweb-muted">No listings matched.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((item) => (
                <ListingCard key={item.id} item={item} onTagClick={handleTag} />
              ))}
            </div>
          )}
        </section>
      )}

      {searchResults == null && (
        <>
          {recommendations.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-white">Recommended for you</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recommendations.map((item) => (
                  <ListingCard key={item.id} item={item} onTagClick={handleTag} />
                ))}
              </div>
            </section>
          )}

          {trendStores.length > 0 && (
            <section className="ccweb-glass rounded-2xl p-4">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <Store className="h-4 w-4 text-ccweb-green" />
                Trending creators
              </h2>
              <div className="flex flex-wrap gap-2">
                {trendStores.map((st) => (
                  <Link
                    key={st.id}
                    to={`/shop/store/${encodeURIComponent(st.slug)}`}
                    className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white transition hover:border-ccweb-cyan/35"
                  >
                    <span className="font-semibold">{st.title}</span>
                    <span className="ml-2 text-ccweb-muted">{st.salesCount30d} sales · </span>
                    {st.creatorVerified ? <span className="text-ccweb-cyan">verified</span> : null}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
              <Sparkles className="h-5 w-5 text-ccweb-violet" />
              Featured
            </h2>
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-52 rounded-2xl" />
                ))}
              </div>
            ) : featured.length === 0 ? (
              <p className="text-sm text-ccweb-muted">No featured listings yet. Creators can publish from the API.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((item) => (
                  <ListingCard key={item.id} item={item} onTagClick={handleTag} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
              <TrendingUp className="h-5 w-5 text-ccweb-green" />
              Trending (14d purchases)
            </h2>
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-52 rounded-2xl" />
                ))}
              </div>
            ) : trending.length === 0 ? (
              <p className="text-sm text-ccweb-muted">No purchase velocity yet.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {trending.map((item) => (
                  <ListingCard key={item.id} item={item} onTagClick={handleTag} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <p className="text-center text-xs text-ccweb-muted">
        Growth Hub escrow listings remain at{" "}
        <Link to="/marketplace" className="text-ccweb-cyan underline">
          /marketplace
        </Link>
        .
      </p>
    </div>
  );
}
