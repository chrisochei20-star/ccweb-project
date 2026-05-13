import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Loader2, Store } from "lucide-react";
import { fetchMarketplaceStore } from "../../api/marketplaceCatalogApi";
import { Skeleton } from "../../components/ui/Skeleton";

export function MarketplaceStorePage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!slug) return;
    let c = false;
    setLoading(true);
    setErr(null);
    fetchMarketplaceStore(slug)
      .then((d) => {
        if (!c) setData(d);
      })
      .catch((e) => {
        if (!c) setErr(e.message || "Store not found");
      })
      .finally(() => {
        if (!c) setLoading(false);
      });
    return () => {
      c = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-3 py-8">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-8 w-1/2 rounded-lg" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
        </div>
      </div>
    );
  }

  if (err || !data?.store) {
    return (
      <div className="mx-auto max-w-lg px-3 py-16 text-center">
        <p className="text-ccweb-muted">{err || "Store not found."}</p>
        <Link to="/shop" className="mt-4 inline-block text-ccweb-cyan underline">
          Back to shop
        </Link>
      </div>
    );
  }

  const { store, listings } = data;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-3 pb-10 pt-4">
      <div className="ccweb-glass overflow-hidden rounded-2xl">
        {store.bannerUrl ? (
          <img src={store.bannerUrl} alt="" className="h-40 w-full object-cover" />
        ) : (
          <div className="h-40 w-full bg-gradient-to-r from-ccweb-violet/40 to-ccweb-cyan/30" />
        )}
        <div className="flex flex-col gap-2 p-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-ccweb-cyan">
              <Store className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-widest">Storefront</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-white">{store.title}</h1>
            {store.tagline ? <p className="text-sm text-ccweb-muted">{store.tagline}</p> : null}
          </div>
          <Link to="/shop" className="text-sm text-ccweb-cyan hover:underline">
            ← All shops
          </Link>
        </div>
        {store.description ? <p className="border-t border-white/10 px-5 py-4 text-sm text-ccweb-muted">{store.description}</p> : null}
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-white">Listings</h2>
        {(listings || []).length === 0 ? (
          <p className="text-sm text-ccweb-muted">No published listings in this store.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {(listings || []).map((item) => (
              <Link
                key={item.id}
                to={`/shop/l/${encodeURIComponent(item.slug)}`}
                className="ccweb-glass rounded-2xl p-4 transition hover:border-ccweb-cyan/35"
              >
                <p className="text-xs uppercase text-ccweb-violet">{item.kind}</p>
                <h3 className="mt-1 font-semibold text-white">{item.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-ccweb-muted">{item.subtitle || item.description}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
