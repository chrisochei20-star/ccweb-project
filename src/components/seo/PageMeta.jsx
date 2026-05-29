import { useEffect } from "react";

const DEFAULT = {
  title: "CCWEB — AI Web3 Academy & Business Engine",
  description:
    "Learn crypto and AI. Earn while you learn with courses, AI tutoring, community, and creator tools.",
};

function upsertMeta(attr, key, content) {
  if (!content || typeof document === "undefined") return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/**
 * Sets document title + OG/Twitter meta for SPA routes (production SEO/social sharing).
 */
export function PageMeta({ title, description, path, image }) {
  useEffect(() => {
    const fullTitle = title ? `${title} · CCWEB` : DEFAULT.title;
    const desc = description || DEFAULT.description;
    document.title = fullTitle;
    upsertMeta("name", "description", desc);
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", desc);
    upsertMeta("property", "og:type", "website");
    if (path && typeof window !== "undefined") {
      upsertMeta("property", "og:url", `${window.location.origin}${path}`);
    }
    if (image) upsertMeta("property", "og:image", image);
    upsertMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:description", desc);
    if (image) upsertMeta("name", "twitter:image", image);
  }, [title, description, path, image]);

  return null;
}

export const ROUTE_META = {
  "/": { title: "Home", description: DEFAULT.description },
  "/community": { title: "Community", description: "Live feed and rooms for builders and learners on CCWEB." },
  "/messages": { title: "Messages", description: "Direct messages with realtime delivery on CCWEB." },
  "/notifications": { title: "Notifications", description: "Your CCWEB activity and alerts." },
  "/profile": { title: "Profile", description: "Your CCWEB creator profile and social identity." },
  "/learn": { title: "Learn", description: "Courses, AI tutoring, and learning sessions." },
  "/find": { title: "Discover", description: "Crypto scanner, trending tokens, and early signals." },
  "/ai-tutor": { title: "AI Tutor", description: "Personalized AI tutoring for Web3, startups, and proposals." },
  "/login": { title: "Sign in", description: "Sign in to CCWEB." },
  "/signup": { title: "Join", description: "Create your CCWEB account." },
};
