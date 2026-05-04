# CCWEB frontend ↔ API integration

This app ships as **Vite + React** (not Next.js). The UI uses **Axios** (`src/lib/api.js`) with JWT + refresh retry, **Zustand** (`src/store/authStore.js`) for auth/session, and **React Router** lazy routes for heavy pages.

## Environment

| Variable | Where | Purpose |
|----------|-------|---------|
| `AUTH_REFRESH_IN_BODY=1` | API `.env` | Return refresh token in JSON for Vite dev (same-origin cookie limits). |
| `VITE_WALLETCONNECT_PROJECT_ID` | **Root** `.env` (Vite) | WalletConnect modal (get a project ID from [Reown Cloud](https://cloud.reown.com/)). |
| `AUTH_JWT_SECRET` | API `.env` | Required for auth in production. |

## Navigation

- **Desktop:** `AppShellSidebar` — Learn, Find, Build, Earn, Community, Marketplace, Profile, Home (dashboard).
- **Mobile:** `AppBottomNav` — Learn, Find, Build, Earn, Community, Profile (six items; Home via sidebar or `/dashboard`).

## Auth flows

| Route | Behavior |
|-------|----------|
| `/login`, `/signup` | Email/password via `authStore.login` / `register`. |
| `/login/2fa` | Shown when login returns `needsTwoFactor`; uses `POST /api/auth/login/2fa`. |
| `/setup-2fa` | Authenticated TOTP setup: `POST /api/auth/2fa/setup` begin + confirm. |
| Profile | **WalletConnectPanel** — MetaMask or WalletConnect → nonce → sign → `POST /api/auth/wallet/connect`. |

## Marketplace & escrow

- **`/marketplace`** — `GET /api/growth/listings`
- **`/marketplace/:id`** — `GET /api/growth/listings/:id`, `POST /api/growth/orders`, deliver/confirm endpoints (simulated ledger; see `docs/GROWTH_HUB.md`).

## Community

- Posts: `GET/POST /api/community/posts`
- Comments: `GET/POST /api/community/posts/:id/comments`
- Single post: `GET /api/community/posts/:id`
- Chat & reactions unchanged.

## Dashboard (real API data)

`/dashboard` aggregates **live** responses from:

- `GET /api/dapp/dashboard`
- `GET /api/build/agents`
- `GET /api/growth/overview`
- `GET /api/streaming/rooms`

## Deployment (public test link)

1. **Full stack:** deploy Node (`npm run build && npm start`) to Railway, Render, Fly.io, etc. Set env vars; your public URL is the test link.
2. **Static only:** Vercel/Netlify can host `dist/` with `vercel.json` SPA rewrites — **API calls will fail** unless `VITE_API_BASE_URL` (future) points to a live API. For now use the Node host for an integrated demo.

## Performance

Lazy-loaded: Early Signals, Developer Platform/Onboarding, Visual DApp Builder, Growth Hub (code-split chunks under `dist/assets/`).
