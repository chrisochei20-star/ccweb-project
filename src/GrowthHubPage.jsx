import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "./api/http";
import { useEffect } from "react";

const MOCK_SELLERS = {
  "ochei-christian": { id: "ochei-christian", name: "Ochei Christian", avatar: null, initials: "OC", verified: true, rating: 4.8, reviewCount: 124, totalListings: 18, totalSales: 312, memberSince: "Jan 2024", bio: "Web3 educator, digital marketer & community builder. Helping you earn and learn in the decentralized economy.", location: "Lagos, Nigeria", responseTime: "< 2 hrs", categories: ["Services", "E-Commerce", "Crypto"] },
  seller: { id: "seller", name: "Seller", avatar: null, initials: "SE", verified: false, rating: 4.2, reviewCount: 9, totalListings: 3, totalSales: 27, memberSince: "Mar 2025", bio: "Digital goods and services for the modern marketplace.", location: "Abuja, Nigeria", responseTime: "< 12 hrs", categories: ["Services"] },
};

const MOCK_LISTINGS = [
  { id: 1, title: "Image listing test", price: 50, category: "Services", sellerId: "seller", rating: 0, reviewCount: 0, image: null, icon: "⚡", description: "Test listing for image upload verification.", escrowEnabled: true },
  { id: 2, title: "Coffee ☕", price: 499, category: "Services", sellerId: "ochei-christian", rating: 5, reviewCount: 0, image: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=400&q=80", description: "Premium artisan coffee.", escrowEnabled: true },
  { id: 3, title: "Coffee ☕", price: 499, category: "Services", sellerId: "ochei-christian", rating: 5, reviewCount: 0, image: null, icon: "📦", description: "Premium coffee blend.", escrowEnabled: true },
  { id: 4, title: "Coffee ☕", price: 499, category: "E-Commerce", sellerId: "ochei-christian", rating: 5, reviewCount: 0, image: null, icon: "📦", description: "E-commerce coffee listing.", escrowEnabled: true },
  { id: 5, title: "Coffee ☕", price: 499, category: "E-Commerce", sellerId: "ochei-christian", rating: 5, reviewCount: 0, image: null, icon: "📦", description: "Bulk order coffee.", escrowEnabled: false },
  { id: 6, title: "Coffee ☕", price: 499, category: "E-Commerce", sellerId: "ochei-christian", rating: 5, reviewCount: 0, image: null, icon: "📦", description: "Wholesale coffee.", escrowEnabled: true },
  { id: 7, title: "Coffee ☕", price: 499, category: "E-Commerce", sellerId: "ochei-christian", rating: 5, reviewCount: 0, image: null, icon: "📦", description: "Coffee reseller bundle.", escrowEnabled: false },
  { id: 8, title: "Coffee ☕", price: 499, category: "Services", sellerId: "ochei-christian", rating: 5, reviewCount: 0, image: null, icon: "📦", description: "Service-tier coffee.", escrowEnabled: true },
  { id: 9, title: "Coffee ☕", price: 499, category: "E-Commerce", sellerId: "ochei-christian", rating: 5, reviewCount: 0, image: null, icon: "📦", description: "E-store coffee package.", escrowEnabled: true },
  { id: 10, title: "Product", price: 499, category: "E-Commerce", sellerId: "ochei-christian", rating: 5, reviewCount: 0, image: null, icon: "📦", description: "General product listing.", escrowEnabled: true },
];

const MOCK_TRANSACTIONS = [
  { id: "TXN001", type: "deposit", amount: 5000, status: "completed", date: "2026-06-28", method: "Bank Transfer" },
  { id: "TXN002", type: "withdrawal", amount: 1200, status: "pending", date: "2026-06-27", method: "Bank Transfer" },
  { id: "TXN003", type: "deposit", amount: 10000, status: "completed", date: "2026-06-25", method: "USDT" },
  { id: "TXN004", type: "purchase", amount: 499, status: "completed", date: "2026-06-20", method: "Escrow" },
];

const CAMPAIGNS_DATA = [
  { id: 1, name: "Web3 Awareness Q3", status: "active", reach: 12400, clicks: 892, budget: 50000, spent: 21300, ctr: "7.2%" },
  { id: 2, name: "CCWEB Academy Launch", status: "paused", reach: 8900, clicks: 440, budget: 30000, spent: 30000, ctr: "4.9%" },
  { id: 3, name: "Crypto Basics Nigeria", status: "draft", reach: 0, clicks: 0, budget: 20000, spent: 0, ctr: "—" },
];

const LEADS_DATA = [
  { id: 1, name: "Emeka Okafor", email: "emeka@email.com", source: "Campaign", status: "hot", score: 92, date: "2026-06-29" },
  { id: 2, name: "Amaka Nwosu", email: "amaka@email.com", source: "Marketplace", status: "warm", score: 71, date: "2026-06-28" },
  { id: 3, name: "Biodun Adeyemi", email: "biodun@email.com", source: "Direct", status: "cold", score: 34, date: "2026-06-27" },
  { id: 4, name: "Chidi Eze", email: "chidi@email.com", source: "Campaign", status: "warm", score: 65, date: "2026-06-26" },
];

const ESCROW_DATA = [
  { id: "ESC001", item: "Coffee ☕", buyer: "Emeka Okafor", seller: "Ochei Christian", amount: 499, status: "held", date: "2026-06-28" },
  { id: "ESC002", item: "Web3 Course Bundle", buyer: "Amaka Nwosu", seller: "Ochei Christian", amount: 15000, status: "released", date: "2026-06-20" },
  { id: "ESC003", item: "Product", buyer: "Biodun Adeyemi", seller: "Ochei Christian", amount: 499, status: "disputed", date: "2026-06-15" },
];

const Stars = ({ rating, small }) => (
  <span className={`${small ? "text-xs" : "text-sm"} text-yellow-400`}>
    {"★".repeat(Math.floor(rating))}{"☆".repeat(5 - Math.floor(rating))}
  </span>
);

const Avatar = ({ seller, size = 10 }) => {
  const s = `w-${size} h-${size}`;
  if (seller.avatar) return <img src={seller.avatar} alt={seller.name} className={`${s} rounded-full object-cover`} />;
  return <div className={`${s} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm`}>{seller.initials}</div>;
};

const StatusBadge = ({ status }) => {
  const map = { active: "bg-green-500/20 text-green-400 border-green-500/30", paused: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", draft: "bg-gray-500/20 text-gray-400 border-gray-500/30", hot: "bg-red-500/20 text-red-400 border-red-500/30", warm: "bg-orange-500/20 text-orange-400 border-orange-500/30", cold: "bg-blue-500/20 text-blue-400 border-blue-500/30", held: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", released: "bg-green-500/20 text-green-400 border-green-500/30", disputed: "bg-red-500/20 text-red-400 border-red-500/30", completed: "bg-green-500/20 text-green-400 border-green-500/30", pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
  return <span className={`px-2 py-0.5 rounded-full text-xs border font-medium capitalize ${map[status] || "bg-gray-500/20 text-gray-400"}`}>{status}</span>;
};

const SellerProfileModal = ({ sellerId, onClose, onViewListings }) => {
  const seller = MOCK_SELLERS[sellerId];
  const listings = MOCK_LISTINGS.filter((l) => l.sellerId === sellerId);
  const [contacted, setContacted] = useState(false);
  if (!seller) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0f1117] border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="relative bg-gradient-to-br from-blue-600/30 to-purple-600/20 p-6 rounded-t-2xl">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white text-xl">✕</button>
          <div className="flex items-start gap-4">
            <Avatar seller={seller} size={16} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-white font-bold text-lg">{seller.name}</h2>
                {seller.verified && <span className="bg-blue-500/20 border border-blue-500/40 text-blue-400 text-xs px-2 py-0.5 rounded-full font-medium">✓ Verified</span>}
              </div>
              <p className="text-white/50 text-sm mt-0.5">📍 {seller.location}</p>
              <div className="flex items-center gap-1 mt-1">
                <Stars rating={seller.rating} small />
                <span className="text-white/60 text-xs">{seller.rating} ({seller.reviewCount} reviews)</span>
              </div>
            </div>
          </div>
          <p className="text-white/70 text-sm mt-4 leading-relaxed">{seller.bio}</p>
        </div>
        <div className="grid grid-cols-3 gap-px bg-white/5 border-y border-white/10">
          {[{ label: "Listings", value: seller.totalListings, icon: "📦" }, { label: "Sales", value: seller.totalSales, icon: "💰" }, { label: "Response", value: seller.responseTime, icon: "⚡" }].map((s) => (
            <div key={s.label} className="bg-[#0f1117] p-4 text-center">
              <div className="text-lg mb-0.5">{s.icon}</div>
              <div className="text-white font-bold text-base">{s.value}</div>
              <div className="text-white/40 text-xs">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 space-y-2 border-b border-white/10">
          <div className="flex justify-between text-sm"><span className="text-white/50">Member since</span><span className="text-white/80">{seller.memberSince}</span></div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/50">Categories</span>
            <div className="flex gap-1 flex-wrap justify-end">{seller.categories.map((c) => <span key={c} className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded-full">{c}</span>)}</div>
          </div>
        </div>
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white/80 text-sm font-semibold">Recent Listings</h3>
            <button onClick={() => { onViewListings(sellerId); onClose(); }} className="text-blue-400 text-xs hover:underline">View all →</button>
          </div>
          <div className="space-y-2">
            {listings.slice(0, 3).map((l) => (
              <div key={l.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-2.5">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  {l.image ? <img src={l.image} alt={l.title} className="w-10 h-10 rounded-lg object-cover" /> : <span className="text-lg">{l.icon || "📦"}</span>}
                </div>
                <div className="flex-1 min-w-0"><p className="text-white/90 text-sm font-medium truncate">{l.title}</p><p className="text-white/40 text-xs">{l.category}</p></div>
                <span className="text-green-400 font-bold text-sm">${l.price}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 py-4 flex gap-3">
          <button onClick={() => setContacted(true)} className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${contacted ? "bg-green-600/30 text-green-400 border border-green-500/30" : "bg-blue-600 hover:bg-blue-500 text-white"}`}>
            {contacted ? "✓ Message Sent!" : "💬 Contact Seller"}
          </button>
          <button onClick={() => { onViewListings(sellerId); onClose(); }} className="flex-1 py-3 rounded-xl border border-white/20 text-white/70 hover:bg-white/10 font-semibold text-sm transition-all">📋 All Listings</button>
        </div>
      </div>
    </div>
  );
};

const ListingCard = ({ listing, onSellerClick, liked, onLike }) => {
  const seller = MOCK_SELLERS[listing.sellerId];
  const [escrowOpen, setEscrowOpen] = useState(false);
  const [purchased, setPurchased] = useState(false);

  return (
    <>
      <div className="bg-[#0f1117] border border-white/8 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all group">
        <div className="relative h-40 bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center">
          <span className="absolute top-2 left-2 text-xs bg-black/60 text-white/70 px-2 py-0.5 rounded-full border border-white/10">{listing.category}</span>
          <button onClick={() => onLike(listing.id)} className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center border transition-all ${liked ? "bg-red-500/20 border-red-500/40 text-red-400" : "bg-black/40 border-white/10 text-white/40"}`}>{liked ? "♥" : "♡"}</button>
          {listing.image ? <img src={listing.image} alt={listing.title} className="w-full h-full object-cover absolute inset-0" /> : <span className="text-5xl opacity-40">{listing.icon || "📦"}</span>}
          {listing.escrowEnabled && <span className="absolute bottom-2 right-2 text-xs bg-green-500/20 border border-green-500/30 text-green-400 px-2 py-0.5 rounded-full">🔒 Escrow</span>}
        </div>
        <div className="p-3">
          <h3 className="text-white font-semibold text-sm truncate">{listing.title}</h3>
          <div className="flex items-center gap-1 mt-0.5 mb-2"><Stars rating={listing.rating} small /><span className="text-white/40 text-xs">({listing.reviewCount})</span></div>
          <button onClick={() => onSellerClick(listing.sellerId)} className="flex items-center gap-1.5 w-full text-left hover:opacity-80 transition-opacity">
            {seller && <Avatar seller={seller} size={5} />}
            <span className="text-white/50 text-xs hover:text-blue-400 transition-colors truncate">{seller?.name || listing.sellerId}{seller?.verified && <span className="ml-1 text-blue-400">✓</span>}</span>
          </button>
          <div className="flex items-center justify-between mt-3">
            <span className="text-green-400 font-bold text-base">${listing.price}</span>
            <button onClick={() => listing.escrowEnabled ? setEscrowOpen(true) : setPurchased(true)} className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${purchased ? "bg-green-600/30 text-green-400 border border-green-500/30" : "bg-blue-600 hover:bg-blue-500 text-white"}`}>{purchased ? "✓ Bought" : "Buy Now"}</button>
          </div>
        </div>
      </div>
      {escrowOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setEscrowOpen(false)}>
          <div className="bg-[#0f1117] border border-white/10 rounded-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-bold text-lg mb-1">🔒 Secure Escrow Purchase</h3>
            <p className="text-white/50 text-sm mb-4">Funds held safely until you confirm delivery.</p>
            <div className="bg-white/5 rounded-xl p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-white/50">Item</span><span className="text-white">{listing.title}</span></div>
              <div className="flex justify-between text-sm"><span className="text-white/50">Seller</span><span className="text-white">{seller?.name}</span></div>
              <div className="flex justify-between text-sm font-bold border-t border-white/10 pt-2"><span className="text-white">Total</span><span className="text-green-400">${listing.price}</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEscrowOpen(false)} className="flex-1 py-2.5 rounded-xl border border-white/20 text-white/60 text-sm">Cancel</button>
              <button onClick={() => { setPurchased(true); setEscrowOpen(false); }} className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-semibold">Confirm & Pay</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const OverviewTab = ({ onTabChange }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 gap-3">
      {[{ label: "Active Listings", value: "18", icon: "📦", bg: "bg-blue-500/10 border-blue-500/20" }, { label: "Total Revenue", value: "$8,940", icon: "💰", bg: "bg-green-500/10 border-green-500/20" }, { label: "Campaign Reach", value: "21.3K", icon: "📣", bg: "bg-purple-500/10 border-purple-500/20" }, { label: "Hot Leads", value: "4", icon: "🔥", bg: "bg-red-500/10 border-red-500/20" }].map((s) => (
        <div key={s.label} className={`${s.bg} border rounded-2xl p-4`}><div className="text-2xl mb-1">{s.icon}</div><div className="text-white font-bold text-xl">{s.value}</div><div className="text-white/50 text-xs">{s.label}</div></div>
      ))}
    </div>
    <div>
      <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-2">
        {[{ label: "Add Listing", icon: "➕", tab: "marketplace" }, { label: "New Campaign", icon: "📣", tab: "campaigns" }, { label: "View Escrows", icon: "🔒", tab: "escrow" }, { label: "Manage Leads", icon: "👥", tab: "leads" }].map((a) => (
          <button key={a.label} onClick={() => onTabChange(a.tab)} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 text-sm text-white/70 hover:text-white transition-all text-left"><span>{a.icon}</span>{a.label}</button>
        ))}
      </div>
    </div>
    <div>
      <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">Recent Activity</h3>
      <div className="space-y-2">
        {[{ msg: "New escrow purchase for Coffee ☕", time: "2h ago", icon: "🔒" }, { msg: "Campaign 'Web3 Awareness Q3' is live", time: "1d ago", icon: "📣" }, { msg: "Lead Emeka Okafor marked hot", time: "2d ago", icon: "🔥" }, { msg: "Withdrawal of $1,200 pending", time: "3d ago", icon: "⏳" }].map((a, i) => (
          <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl p-3"><span className="text-lg">{a.icon}</span><div className="flex-1 min-w-0"><p className="text-white/80 text-sm truncate">{a.msg}</p><p className="text-white/30 text-xs">{a.time}</p></div></div>
        ))}
      </div>
    </div>
  </div>
);

const EscrowTab = () => (
  <div className="space-y-4">
    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
      <h3 className="text-white font-semibold text-sm mb-1">🔒 How Escrow Works</h3>
      <p className="text-white/50 text-xs leading-relaxed">Funds locked until buyer confirms delivery. Disputes resolved by CCWEB admins. Zero fees for verified sellers.</p>
    </div>
    <div className="space-y-3">
      {ESCROW_DATA.map((e) => (
        <div key={e.id} className="bg-[#0f1117] border border-white/10 rounded-2xl p-4">
          <div className="flex items-start justify-between mb-3"><div><p className="text-white font-semibold text-sm">{e.item}</p><p className="text-white/40 text-xs">{e.id} · {e.date}</p></div><StatusBadge status={e.status} /></div>
          <div className="grid grid-cols-2 gap-2 text-xs mb-3"><div><span className="text-white/40">Buyer: </span><span className="text-white/70">{e.buyer}</span></div><div><span className="text-white/40">Seller: </span><span className="text-white/70">{e.seller}</span></div></div>
          <div className="flex items-center justify-between">
            <span className="text-green-400 font-bold">${e.amount}</span>
            <div className="flex gap-2">
              {e.status === "held" && <><button className="text-xs px-3 py-1 rounded-lg bg-green-600/20 border border-green-500/30 text-green-400">Release</button><button className="text-xs px-3 py-1 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400">Dispute</button></>}
              {e.status === "disputed" && <button className="text-xs px-3 py-1 rounded-lg bg-yellow-600/20 border border-yellow-500/30 text-yellow-400">Contact Admin</button>}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const CampaignsTab = () => {
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white/70 text-sm font-semibold">Your Campaigns</h3>
        <button onClick={() => setCreating(true)} className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition-all">+ New Campaign</button>
      </div>
      {creating && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
          <h4 className="text-white font-semibold text-sm">Create Campaign</h4>
          <input className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/30 outline-none focus:border-blue-500/50" placeholder="Campaign name..." />
          <div className="grid grid-cols-2 gap-2">
            <input className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/30 outline-none" placeholder="Budget (₦)" />
            <select className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white/70 text-sm outline-none"><option>Social Media</option><option>Email</option><option>Community</option></select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setCreating(false)} className="flex-1 py-2 rounded-xl border border-white/20 text-white/50 text-sm">Cancel</button>
            <button onClick={() => setCreating(false)} className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold">Launch</button>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {CAMPAIGNS_DATA.map((c) => (
          <div key={c.id} className="bg-[#0f1117] border border-white/10 rounded-2xl p-4">
            <div className="flex items-start justify-between mb-3"><p className="text-white font-semibold text-sm">{c.name}</p><StatusBadge status={c.status} /></div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              {[{ label: "Reach", value: c.reach.toLocaleString() }, { label: "Clicks", value: c.clicks.toLocaleString() }, { label: "CTR", value: c.ctr }].map((m) => (
                <div key={m.label} className="text-center"><p className="text-white font-bold text-base">{m.value}</p><p className="text-white/40 text-xs">{m.label}</p></div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-white/40 mb-1"><span>Budget Used</span><span>₦{c.spent.toLocaleString()} / ₦{c.budget.toLocaleString()}</span></div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" style={{ width: `${Math.round((c.spent / c.budget) * 100)}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
};

const LeadsTab = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-3 gap-3">
      {[{ label: "Hot", status: "hot", bg: "bg-red-500/10 border-red-500/20" }, { label: "Warm", status: "warm", bg: "bg-orange-500/10 border-orange-500/20" }, { label: "Cold", status: "cold", bg: "bg-blue-500/10 border-blue-500/20" }].map((s) => (
        <div key={s.label} className={`${s.bg} border rounded-xl p-3 text-center`}><div className="text-white font-bold text-xl">{LEADS_DATA.filter((l) => l.status === s.status).length}</div><div className="text-white/50 text-xs">{s.label}</div></div>
      ))}
    </div>
    <div className="space-y-3">
      {LEADS_DATA.map((l) => (
        <div key={l.id} className="bg-[#0f1117] border border-white/10 rounded-2xl p-4">
          <div className="flex items-start justify-between mb-2"><div><p className="text-white font-semibold text-sm">{l.name}</p><p className="text-white/40 text-xs">{l.email}</p></div><StatusBadge status={l.status} /></div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-white/40"><span>Source: <span className="text-white/60">{l.source}</span></span><span>{l.date}</span></div>
            <div className="flex items-center gap-2"><div className="h-1.5 w-20 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full" style={{ width: `${l.score}%` }} /></div><span className="text-white/60 text-xs font-bold">{l.score}</span></div>
          </div>
          <div className="flex gap-2 mt-3">
            <button className="flex-1 py-1.5 text-xs rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 transition-all">💬 Contact</button>
            <button className="flex-1 py-1.5 text-xs rounded-lg bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-400 transition-all">📋 View Profile</button>
          </div>
        </div>
      ))}
    </div>
  </div>
)

const WalletDashboard = ({ onClose }) => {
  const [tab, setTab] = useState("overview");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [step, setStep] = useState("form");
  const [action, setAction] = useState(null);

const [balance, setBalance] = useState({ ngn: 13800, usdt: 12.4 });
const [transactions, setTransactions] = useState([]);
useEffect(() => {
  http.get("/wallet/balance")
    .then((res) => setBalance(res.data))
    .catch(console.error);
  http.get("/wallet/transactions")
    .then((res) => setTransactions(res.data))
    .catch(console.error);
}, []);
  const handleWalletConfirm = async () => {
    try {
      await http.post(action === "deposit" ? "/api/wallet/deposit" : "/api/wallet/withdraw", {
        amount: Number(action === "deposit" ? depositAmount : withdrawAmount),
        method: paymentMethod,
      });
      setStep("done");
    } catch (err) {
      console.error(err);
      alert("Wallet request failed.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0a0c12] border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/10">
          <h2 className="text-white font-bold text-lg">💳 My Wallet</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xl">✕</button>
        </div>
        <div className="px-6 py-5">
          <div className="bg-gradient-to-br from-blue-600/30 to-purple-600/20 border border-blue-500/20 rounded-2xl p-5">
            <p className="text-white/50 text-xs mb-1">Total Balance</p>
            <p className="text-white font-bold text-3xl">₦{Number(balance?.ngn ?? 0).toLocaleString()}</p>
            <p className="text-white/40 text-sm mt-0.5">≈ {Number(balance?.usdt ?? 0).toFixed(2)} USDT</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setTab("deposit"); setStep("form"); }} className="flex-1 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-semibold transition-all">⬇ Deposit</button>
              <button onClick={() => { setTab("withdraw"); setStep("form"); }} className="flex-1 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-semibold transition-all">⬆ Withdraw</button>
            </div>
          </div>
        </div>
        <div className="flex gap-1 px-6 mb-4">
          {["overview", "deposit", "withdraw", "history"].map((t) => (
            <button key={t} onClick={() => { setTab(t); setStep("form"); }} className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${tab === t ? "bg-blue-600 text-white" : "text-white/40 hover:text-white"}`}>{t}</button>
          ))}
        </div>
        <div className="px-6 pb-6">
          {tab === "overview" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-xl p-3 text-center"><p className="text-white font-bold text-lg">₦28,500</p><p className="text-white/40 text-xs">Total Deposited</p></div>
                <div className="bg-white/5 rounded-xl p-3 text-center"><p className="text-white font-bold text-lg">₦14,700</p><p className="text-white/40 text-xs">Total Withdrawn</p></div>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center"><p className="text-green-400 font-bold text-lg">₦8,940</p><p className="text-white/40 text-xs">Marketplace Earnings</p></div>
            </div>
          )}
          {tab === "deposit" && step === "form" && (
            <div className="space-y-4">
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Amount (₦)</label>
                <input value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-bold placeholder-white/20 outline-none focus:border-blue-500/50" placeholder="0.00" type="number" />
                <div className="flex gap-2 mt-2">{[1000, 5000, 10000, 50000].map((a) => <button key={a} onClick={() => setDepositAmount(String(a))} className="flex-1 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-xs transition-all">₦{a >= 1000 ? `${a / 1000}K` : a}</button>)}</div>
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Payment Method</label>
                <div className="space-y-2">{["Bank Transfer", "USDT (TRC-20)", "Card Payment"].map((m) => <label key={m} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3 cursor-pointer hover:border-blue-500/30 transition-all"><input type="radio" name="method" className="accent-blue-500" checked={paymentMethod === m} onChange={() => setPaymentMethod(m)} /><span className="text-white/70 text-sm">{m}</span></label>)}</div>
              </div>
              <button onClick={() => { setAction("deposit"); setStep("confirm"); }} className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold transition-all">Deposit ₦{depositAmount || "0"}</button>
            </div>
          )}
          {tab === "withdraw" && step === "form" && (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-3 flex justify-between text-sm"><span className="text-white/50">Available</span><span className="text-green-400 font-bold">₦{Number(balance?.ngn ?? 0).toLocaleString()}</span></div>
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Amount (₦)</label>
                <input value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-bold placeholder-white/20 outline-none focus:border-blue-500/50" placeholder="0.00" type="number" />
              </div>
              <input className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 outline-none focus:border-blue-500/50" placeholder="Bank account / wallet address..." />
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-xs text-yellow-400">⚠️ Withdrawals reviewed within 24hrs. Minimum ₦500.</div>
              <button onClick={() => { setAction("withdraw"); setStep("confirm"); }} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all">Request Withdrawal</button>
            </div>
          )}
          {step === "confirm" && (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-2xl p-5 text-center">
                <div className="text-4xl mb-3">{action === "deposit" ? "⬇️" : "⬆️"}</div>
                <p className="text-white/50 text-sm mb-1">You are about to {action}</p>
                <p className="text-white font-bold text-3xl">₦{(action === "deposit" ? depositAmount : withdrawAmount) || "0"}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep("form")} className="flex-1 py-3 rounded-xl border border-white/20 text-white/60 text-sm">Back</button>
                <button onClick={handleWalletConfirm} className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-semibold">Confirm</button>
              </div>
            </div>
          )}
          {step === "done" && (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">✅</div>
              <p className="text-white font-bold text-lg mb-1">{action === "deposit" ? "Deposit Initiated!" : "Withdrawal Requested!"}</p>
              <p className="text-white/50 text-sm">Confirmation notification coming shortly.</p>
              <button onClick={onClose} className="mt-6 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all">Done</button>
            </div>
          )}
          {tab === "history" && step === "form" && (
            <div className="space-y-3">
              {MOCK_TRANSACTIONS.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg ${tx.type === "deposit" ? "bg-green-500/20" : tx.type === "withdrawal" ? "bg-red-500/20" : "bg-blue-500/20"}`}>{tx.type === "deposit" ? "⬇" : tx.type === "withdrawal" ? "⬆" : "🛒"}</div>
                  <div className="flex-1 min-w-0"><p className="text-white/80 text-sm capitalize font-medium">{tx.type}</p><p className="text-white/30 text-xs">{tx.method} · {tx.date}</p></div>
                  <div className="text-right"><p className={`font-bold text-sm ${tx.type === "deposit" ? "text-green-400" : "text-red-400"}`}>{tx.type === "deposit" ? "+" : "-"}₦{Number(tx.amount || 0).toLocaleString()}</p><StatusBadge status={tx.status} /></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function GrowthHubPage() {
  const [activeTab, setActiveTab] = useState("marketplace");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [filterSeller, setFilterSeller] = useState(null);
  const [likedIds, setLikedIds] = useState(new Set());
  const [sellerModal, setSellerModal] = useState(null);
  const [walletOpen, setWalletOpen] = useState(false);
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const categories = ["All Categories", "Services", "E-Commerce", "Crypto", "Education"];
  const filteredListings = MOCK_LISTINGS.filter((l) => {
    const matchSearch = l.title.toLowerCase().includes(search.toLowerCase()) || l.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All Categories" || l.category === category;
    const matchSeller = !filterSeller || l.sellerId === filterSeller;
    return matchSearch && matchCat && matchSeller;
  });
  const toggleLike = useCallback((id) => {
    setLikedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }, []);
  const tabs = [{ id: "overview", label: "Overview" }, { id: "marketplace", label: "Marketplace" }, { id: "escrow", label: "Escrow" }, { id: "campaigns", label: "Campaigns" }, { id: "leads", label: "Leads" }];

  return (
    <div className="min-h-screen bg-[#080a10] text-white">
      <div className="px-4 pt-5 pb-2">
        <div className="flex items-center gap-2 text-xs text-white/40 mb-2 uppercase tracking-wider font-semibold">
          <span>BUILD</span><span className="text-blue-400">·</span><span className="text-blue-400">BUSINESS AUTOMATION</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-xl leading-tight">Global Marketing Agent & Growth Hub</h1>
            <p className="text-white/40 text-xs mt-1 max-w-sm">Organic-first workspace: listings, secure checkout, campaigns, and lead scoring.</p>
          </div>
          <button onClick={() => setWalletOpen(true)} className="flex flex-col items-center bg-gradient-to-br from-blue-600/30 to-purple-600/20 border border-blue-500/30 rounded-xl px-3 py-2 hover:border-blue-400/50 transition-all flex-shrink-0">
            <span className="text-lg">💳</span>
            <span className="text-green-400 text-xs font-bold">₦13.8K</span>
          </button>
        </div>
      </div>
      <div className="flex gap-1 px-4 mt-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {tabs.map((t) => <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === t.id ? "bg-blue-600 text-white" : "bg-white/8 text-white/50 hover:text-white hover:bg-white/15"}`}>{t.label}</button>)}
      </div>
      <div className="px-4 mt-4 pb-24">
        {activeTab === "overview" && <OverviewTab onTabChange={setActiveTab} />}
        {activeTab === "marketplace" && (
          <>
            {filterSeller && (
              <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-3">
                <span className="text-blue-400 text-sm">📋 Showing: <strong>{MOCK_SELLERS[filterSeller]?.name}</strong></span>
                <button onClick={() => setFilterSeller(null)} className="ml-auto text-white/40 hover:text-white text-lg">✕</button>
              </div>
            )}
            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">🔍</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-white text-sm placeholder-white/30 outline-none focus:border-blue-500/40" /></div>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/70 text-sm outline-none flex-shrink-0">{categories.map((c) => <option key={c}>{c}</option>)}</select>
              <button onClick={() => setSellModalOpen(true)} className="flex-shrink-0 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-3 py-2.5 rounded-xl transition-all">+ Sell</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {filteredListings.length > 0 ? filteredListings.map((l) => <ListingCard key={l.id} listing={l} onSellerClick={(id) => setSellerModal(id)} liked={likedIds.has(l.id)} onLike={toggleLike} />) : <div className="col-span-2 text-center py-16 text-white/30"><div className="text-4xl mb-2">🔍</div><p>No listings found</p></div>}
            </div>
          </>
        )}
        {activeTab === "escrow" && <EscrowTab />}
        {activeTab === "campaigns" && <CampaignsTab />}
        {activeTab === "leads" && <LeadsTab />}
      </div>
      {sellerModal && <SellerProfileModal sellerId={sellerModal} onClose={() => setSellerModal(null)} onViewListings={(id) => { setFilterSeller(id); setActiveTab("marketplace"); }} />}
      {walletOpen && <WalletDashboard onClose={() => setWalletOpen(false)} />}
      {sellModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setSellModalOpen(false)}>
          <div className="bg-[#0f1117] border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-bold text-lg mb-4">➕ Create Listing</h3>
            <div className="space-y-3">
              <input className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 outline-none focus:border-blue-500/50" placeholder="Product / Service title..." />
              <textarea className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 outline-none focus:border-blue-500/50 h-24 resize-none" placeholder="Description..." />
              <div className="grid grid-cols-2 gap-2">
                <input className="bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 outline-none" placeholder="Price ($)" type="number" />
                <select className="bg-black/30 border border-white/10 rounded-xl px-3 py-3 text-white/70 text-sm outline-none">{categories.slice(1).map((c) => <option key={c}>{c}</option>)}</select>
              </div>
              <label className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3 cursor-pointer"><input type="checkbox" className="accent-blue-500" defaultChecked /><span className="text-white/70 text-sm">🔒 Enable Escrow Protection</span></label>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setSellModalOpen(false)} className="flex-1 py-3 rounded-xl border border-white/20 text-white/60 text-sm">Cancel</button>
              <button onClick={() => setSellModalOpen(false)} className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold">Publish Listing</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
