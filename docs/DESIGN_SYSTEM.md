# CCWEB design system

This document describes the **UI shell** and **Tailwind-first tokens** introduced for a premium Web3 + AI look. Legacy `styles.css` still applies to older screens; new shell and home use composable primitives under `src/ui/`.

## Brand colors (logo-derived)

| Token | Hex | Usage |
|-------|-----|--------|
| Navy 950 | `#020617` | Page background base |
| Navy 900 | `#071422` | Gradient mid |
| Navy 800 | `#0c2744` | Gradient low |
| Sky 200–400 | `#bae6fd` → `#38bdf8` | Highlights, active nav |
| Cyan 300–400 | `#67e8f9` → `#22d3ee` | Gradient buttons, glow |
| Indigo 300–500 | `#a5b4fc` → `#6366f1` | Gradient end, depth |
| Text | `#e8f4ff` | Primary copy |
| Muted | `#8ca3c4` | Secondary copy |

Defined in `src/index.css` under `@theme` as `--color-ccweb-*`.

## Layout shell

1. **Background** — Full-viewport layered gradient + subtle SVG curve pattern (`App.jsx` shell).
2. **Header** — `AppHeader`: logo wordmark, hamburger (mobile), notifications bell (signed-in), optional sign-in link (desktop).
3. **Body** — `DesktopNav` (md+) + main column (`max-width: min(70rem, 92vw)`).
4. **Bottom nav** — `AppBottomNav`: **Home · Sessions · Community · Profile** (44px touch targets, safe-area padding).
5. **Footer** — Compact legal links + log out when signed in.

## Glass cards

- **Component:** `GlassCard` (`src/ui/GlassCard.jsx`)
- **Radius:** `20px` (`rounded-[20px]`)
- **Border:** `border-white/[0.12]`
- **Fill:** `bg-white/[0.045]` + `backdrop-blur-xl`
- **Shadow:** `shadow-[0_8px_40px_rgba(0,0,0,0.28)]`

## Buttons and inputs

- **Primary:** `PrimaryButton` / `PrimaryButtonLink` — gradient `sky-300 → cyan-400 → indigo-400`, min height 44px, `rounded-[14px]`.
- **Ghost input:** `GhostInput` — transparent field, border, focus ring on cyan.

## Logo asset

`CcwebLogoMark` is an **inline SVG** inspired by curved ribbon + electric accent. To use your official file: add `public/ccweb-logo.svg` and replace the mark in `CcwebLogo.jsx` with `<img src="/ccweb-logo.svg" alt="CCWEB" className={className} />`.

## Typography

- **Font:** Inter (variable), loaded from Google Fonts in `index.html`.
- **Scale:** Use Tailwind `text-sm`–`text-5xl` with `font-semibold` / `font-bold` for hierarchy.

## Spacing

- Page horizontal padding: `px-4 sm:px-5`
- Section gaps: `space-y-6`, grid `gap-4`
- Bottom padding reserves space for fixed nav: `pb-[calc(5.5rem+env(safe-area-inset-bottom))]`

## Icons

**Lucide React** (`lucide-react`) — minimal stroke icons for nav and chrome.

## Example screen

See **`HomePage`** in `src/App.jsx`: hero `GlassCard`, stat row, pillar grid — all using the tokens above.
