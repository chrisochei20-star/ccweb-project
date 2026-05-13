import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Loader2, Sparkles, TrendingUp } from "lucide-react";
import { fetchMarketplaceFeatured, fetchMarketplaceTrending, searchMarketplaceListings } from "../../api/marketplaceCatalogApi";
import { Skeleton } from "../../components/ui/Skeleton";

function ListingCard({ item }) {
  return (
    <Link
      to={`/shop/l/${encodeURIComponent(item.slug)}`}
      className="ccweb-glass flex flex-col overflow-hidden rounded-2xl border border-white/5 transition hover:border-ccweb-cyan/35"
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
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchBusy, setSearchBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let c = false;
    setLoading(true);
    setErr(null);
    Promise.all([fetchMarketplaceFeatured(12), fetchMarketplaceTrending(12)])
      .then(([f, t]) => {
        if (!c) {
          setFeatured(f.listings || []);
          setTrending(t.listings || []);
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

  async function runSearch() {
    const q = searchQ.trim();
    if (!q) {
      setSearchResults(null);
      return;
    }
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

      {searchResults != null && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">Results</h2>
          {searchResults.length === 0 ? (
            <p className="text-sm text-ccweb-muted">No listings matched.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((item) => (
                <ListingCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>
      )}

      {searchResults == null && (
        <>
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
                  <ListingCard key={item.id} item={item} />
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
                  <ListingCard key={item.id} item={item} />
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
