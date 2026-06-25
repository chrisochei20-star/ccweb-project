/** Bottom-nav "Search" highlights for intelligence + crypto routes (not only `/find`). */
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

/**
 * Secondary "More" menu — trimmed to remove duplicates and clutter.
 * Primary tabs (Home, Community, Marketplace, Messages, Notifications, Profile)
 * are in the bottom nav and intentionally excluded here.
 */
export const CCWEB_SECONDARY_NAV = [
  { to: "/earn", label: "Earn", description: "Credits, referrals & leaderboard" },
  { to: "/learn", label: "Learn", description: "Courses, live labs & AI tutor" },
  { to: "/build", label: "Build", description: "DApps, agents & developer tools" },
  { to: "/find", label: "Explore", description: "Search crypto, AI signals & more" },
  { to: "/settings", label: "Settings", description: "Preferences & security" },
  { to: "/about", label: "About CCWeb", description: "Our mission & platform story" },
  { to: "/faq", label: "FAQ", description: "Help & common questions" },
  { to: "/privacy", label: "Privacy", description: "How we handle your data" },
  { to: "/terms", label: "Terms", description: "Platform usage terms" },
  { to: "/contact", label: "Contact", description: "Reach out for support" },
];
