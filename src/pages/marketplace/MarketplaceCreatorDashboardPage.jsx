import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, TrendingUp, Wallet } from "lucide-react";
import { fetchFlutterwaveCreatorSummary } from "../../api/flutterwaveApi";
import {
  fetchCreatorMarketplacePerformance,
  fetchCreatorMarketplaceReviews,
  fetchCreatorMarketplaceSales,
  fetchCreatorMarketplaceSummary,
} from "../../api/marketplaceCatalogApi";
import { Skeleton } from "../../components/ui/Skeleton";

export function MarketplaceCreatorDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [mp, setMp] = useState(null);
  const [flw, setFlw] = useState(null);
  const [sales, setSales] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [perf, setPerf] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [a, b, c, d, e] = await Promise.all([
        fetchCreatorMarketplaceSummary(),
        fetchFlutterwaveCreatorSummary().catch(() => null),
        fetchCreatorMarketplaceSales(40),
        fetchCreatorMarketplaceReviews(30),
        fetchCreatorMarketplacePerformance(30),
      ]);
      setMp(a.summary || null);
      setFlw(b);
      setSales(c.sales || []);
      setReviews(d.reviews || []);
      setPerf(e.listings || []);
    } catch (e) {
      setErr(e.message || "Could not load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-3 pb-14 pt-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-ccweb-green">Creators</p>
          <h1 className="text-2xl font-bold text-white md:text-3xl">Marketplace dashboard</h1>
          <p className="mt-1 text-sm text-ccweb-muted">Sales, reviews, listing performance, and Flutterwave wallet/payout signals in one view.</p>
        </div>
        <Link to="/shop/creator/studio" className="text-sm font-medium text-ccweb-cyan hover:underline">
          ← Publishing studio
        </Link>
      </header>

      {err && <p className="text-sm text-rose-300">{err}</p>}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="ccweb-glass rounded-2xl p-4 transition hover:border-ccweb-cyan/30">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-ccweb-muted">
              <BarChart3 className="h-4 w-4 text-ccweb-cyan" />
              Listings
            </div>
            <p className="mt-2 text-2xl font-bold text-white">{mp?.listings?.total ?? 0}</p>
            <p className="text-xs text-ccweb-muted">
              Live {mp?.listings?.live ?? 0} · Pending review {mp?.listings?.pendingReview ?? 0}
            </p>
          </div>
          <div className="ccweb-glass rounded-2xl p-4 transition hover:border-ccweb-violet/30">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-ccweb-muted">
              <Wallet className="h-4 w-4 text-ccweb-violet" />
              Reviews
            </div>
            <p className="mt-2 text-2xl font-bold text-white">{mp?.reviews?.count ?? 0}</p>
            <p className="text-xs text-ccweb-muted">Avg ★ {Number(mp?.reviews?.avgRating || 0).toFixed(1)}</p>
          </div>
          <div className="ccweb-glass rounded-2xl p-4 transition hover:border-ccweb-green/30">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-ccweb-muted">
              <TrendingUp className="h-4 w-4 text-ccweb-green" />
              Sales (30d)
            </div>
            <p className="mt-2 text-2xl font-bold text-white">
              {(mp?.salesLast30dByCurrency || []).reduce((n, r) => n + (r.count || 0), 0)}
            </p>
            <p className="text-xs text-ccweb-muted">Marketplace SKUs · see table</p>
          </div>
        </div>
      )}

      {flw && (
        <section className="ccweb-glass rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-white">Flutterwave creator wallet</h2>
          <p className="mt-1 text-xs text-ccweb-muted">Includes marketplace SKUs, tips, and course share where applicable.</p>
          <pre className="mt-3 max-h-48 overflow-auto rounded-lg bg-black/40 p-3 text-xs text-ccweb-muted">
            {JSON.stringify(flw.summary || {}, null, 2)}
          </pre>
        </section>
      )}

      <section className="ccweb-glass rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-white">Listing performance</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm text-ccweb-muted">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase">
                <th className="py-2 pr-2">Listing</th>
                <th className="py-2">Purchases</th>
                <th className="py-2">Reviews</th>
                <th className="py-2">Moderation</th>
              </tr>
            </thead>
            <tbody>
              {perf.map((row) => (
                <tr key={row.listingId} className="border-b border-white/5">
                  <td className="py-2 pr-2">
                    <Link className="font-medium text-white hover:underline" to={`/shop/l/${encodeURIComponent(row.slug)}`}>
                      {row.title}
                    </Link>
                  </td>
                  <td className="py-2">{row.purchaseCount}</td>
                  <td className="py-2">
                    {row.reviewCount} (★ {Number(row.reviewAvg || 0).toFixed(1)})
                  </td>
                  <td className="py-2 text-xs">{row.moderationStatus}</td>
                </tr>
              ))}
              {perf.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="py-4 text-ccweb-muted">
                    No performance data yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="ccweb-glass rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-white">Recent sales</h2>
          <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm text-ccweb-muted">
            {sales.map((s) => (
              <li key={s.id} className="rounded-lg border border-white/10 px-2 py-1.5">
                <span className="text-white">{s.listingTitle}</span> · {(s.amountMinor / 100).toFixed(2)} {s.currency}
              </li>
            ))}
            {sales.length === 0 && !loading && <li>No marketplace sales yet.</li>}
          </ul>
        </section>
        <section className="ccweb-glass rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-white">Recent reviews</h2>
          <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm text-ccweb-muted">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-lg border border-white/10 px-2 py-1.5">
                <span className="text-white">★ {r.rating}</span> · {r.listingTitle}
                <p className="line-clamp-2 text-xs">{r.body}</p>
              </li>
            ))}
            {reviews.length === 0 && !loading && <li>No reviews yet.</li>}
          </ul>
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
