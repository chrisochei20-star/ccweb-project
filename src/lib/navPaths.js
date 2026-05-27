/** Bottom-nav “Search” highlights for intelligence + crypto routes (not only `/find`). */
export function isSearchNavActive(pathname) {
  const p = pathname || "";
  return (
    p === "/find" ||
    p.startsWith("/crypto-scanner") ||
    p.startsWith("/crypto/") ||
    p === "/early-signals" ||
    p.startsWith("/token/")
  );
}

/** Secondary destinations (More menu) — keep URLs in sync with `App.jsx` routes. */
export const CCWEB_SECONDARY_NAV = [
  { to: "/community", label: "Community", description: "Feed, chat channels, posts" },
  { to: "/learn", label: "Learn", description: "Courses, live labs, AI tutor" },
  { to: "/earn", label: "Earn", description: "Rewards, referrals, analytics" },
  { to: "/build", label: "Build", description: "DApps, agents, developer tools" },
  { to: "/courses", label: "Courses", description: "Catalog & lessons" },
  { to: "/growth-hub", label: "Growth hub", description: "Listings & campaigns" },
  { to: "/marketplace", label: "Marketplace", description: "Escrow & commerce" },
  { to: "/developers", label: "Developers", description: "API keys & console" },
  { to: "/dapp-builder", label: "DApp builder", description: "Visual deploy" },
  { to: "/ai-tutor", label: "AI tutor", description: "Standalone tutor" },
  { to: "/about", label: "About", description: "Product story" },
  { to: "/faq", label: "FAQ", description: "Help & answers" },
];
