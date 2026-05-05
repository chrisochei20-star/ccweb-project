import { Copy, Share2 } from "lucide-react";

const BASE = typeof window !== "undefined" ? window.location.origin : "";

export function buildShareText(kind, payload = {}) {
  if (kind === "token_scan") {
    const sym = payload.symbol || payload.token || "Token";
    const score = payload.score != null ? ` · Safety ${payload.score}/100` : "";
    return `Checking ${sym} on CCWEB${score}\n${payload.url || BASE}`;
  }
  if (kind === "earn_snapshot") {
    return `Progress on CCWEB — ${payload.headline || "Learn · Earn · Grow"}\n${BASE}/earn`;
  }
  if (kind === "signal") {
    return `${payload.title || "Early signal"} — CCWEB Find\n${BASE}/find?tab=signals`;
  }
  return `${payload.title || "CCWEB"}\n${BASE}`;
}

export function ShareActions({ kind, payload = {}, className = "" }) {
  const text = buildShareText(kind, payload);
  const url = payload.url || BASE;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "CCWEB", text, url });
      } catch {
        /* dismissed */
      }
    } else {
      copy();
    }
  }

  function openTwitter() {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  function wa() {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  function tg() {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <button type="button" className="ccweb-outline-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs" onClick={nativeShare}>
        <Share2 className="h-3.5 w-3.5" /> Share
      </button>
      <button type="button" className="ccweb-outline-btn inline-flex items-center gap-1 px-3 py-1.5 text-xs" onClick={copy}>
        <Copy className="h-3.5 w-3.5" /> Copy
      </button>
      <button type="button" className="rounded-full border border-white/15 px-3 py-1.5 text-[11px] text-ccweb-muted hover:text-white" onClick={openTwitter}>
        X
      </button>
      <button type="button" className="rounded-full border border-white/15 px-3 py-1.5 text-[11px] text-ccweb-muted hover:text-white" onClick={wa}>
        WhatsApp
      </button>
      <button type="button" className="rounded-full border border-white/15 px-3 py-1.5 text-[11px] text-ccweb-muted hover:text-white" onClick={tg}>
        Telegram
      </button>
    </div>
  );
}
