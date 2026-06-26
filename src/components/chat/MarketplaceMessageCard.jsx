import { ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

export default function MarketplaceMessageCard({ product }) {
  if (!product) return null;

  return (
    <div className="max-w-sm rounded-2xl border border-cyan-500/20 bg-slate-900 p-4 shadow-lg">
      <div className="flex items-center gap-2">
        <ShoppingBag className="h-5 w-5 text-cyan-400" />
        <h3 className="font-semibold text-white">{product.name}</h3>
      </div>

      <p className="mt-2 text-lg font-bold text-cyan-300">
        {product.price}
      </p>

      <p className="mt-1 text-xs text-ccweb-muted">
        Sold by {product.seller || "CCWEB"}
      </p>

      <div className="mt-4 flex gap-2">
        <Link
          to={`/marketplace/product/${product.id}`}
          className="flex-1 rounded-xl border border-white/15 py-2 text-center text-sm text-white hover:border-cyan-400"
        >
          View Product
        </Link>

        <button
          type="button"
          className="ccweb-gradient-btn flex-1 py-2 text-sm"
          onClick={() => alert("Secure checkout coming soon")}
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}
