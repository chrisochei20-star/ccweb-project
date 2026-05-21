# CCWEB — project layout for Railway + Vercel

This repository uses **Option B (single repo)** with a **clear logical split** between frontend and backend assets. It is **not** a nested `client/` + `server/` monorepo; splitting would be a large migration. The layout below matches a typical **Railway API** + **Vercel SPA** split.

## Structure (production-oriented)

| Area | Paths | Role |
|------|--------|------|
| **Backend entry** | `server.js` | Node HTTP server: API routes, auth, static `public/`, optional `dist/` in production |
| **Backend modules** | `auth/`, `db/`, `payments/`, `security/`, `services/`, `platformExpress.js`, … | Express sub-apps mounted from `server.js` |
| **Frontend (Vite)** | `src/`, `index.html`, `vite.config.js` | React SPA → build output **`dist/`** |
| **Frontend config** | `src/config/env.js` | `VITE_API_BASE_URL` for API origin when SPA is on Vercel; legacy hosts rewritten to Railway in production |
| **Static marketing** | `public/` | Served by Node in dev / prod as configured |
| **Infra as code (optional)** | `render.yaml` | Optional blueprint for teams using that vendor; primary production docs use Railway |
| **Vercel** | `vercel.json` | SPA rewrites to `index.html`; build `npm run build`, output `dist` |

## Commands

| Command | Where used |
|---------|------------|
| `npm start` → `node server.js` | **Railway** (API process) or any Node host |
| `npm run build` → `vite build` | **Vercel** (or `npm run build` in CI); produces `dist/` |
| `npm run dev` | Local Vite |
| `npm run dev:api` | Local API |

## Environment variables

| Layer | Variables |
|-------|-----------|
| **Vercel (build + runtime in browser)** | `VITE_API_BASE_URL` (https API origin, no trailing slash), `VITE_APP_ENV`, optional `VITE_WALLETCONNECT_PROJECT_ID`, optional `VITE_CCWEB_API_DEBUG=1` for one-off console diagnostics |
| **Railway (API)** | `DATABASE_URL`, `PUBLIC_APP_URL`, `CCWEB_API_PUBLIC_URL`, `CCWEB_ALLOWED_ORIGINS`, `AUTH_JWT_SECRET`, Stripe, AI, Etherscan — see `productionGate.js` and `.env.production.example` |

Note: JWT signing uses **`AUTH_JWT_SECRET`** (not `JWT_SECRET`).

## Why not `client/` + `server/` folders yet?

Moving `server.js` and all `require()` paths would touch hundreds of imports and break every open PR. The current layout is **already deployable**: Railway runs the repo root; Vercel builds the same root with `build` → `dist`. A future refactor can introduce `packages/api` + `packages/web` with workspace tooling if needed.
