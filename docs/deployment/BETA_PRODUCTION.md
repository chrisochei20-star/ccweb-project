# CCWEB production beta deployment

This document describes how to run CCWEB on separate **CDN frontend** and **API backend** hosts (no `localhost` in production builds).

## Architecture

- **Frontend**: Static SPA (Vite `dist/`) on **Vercel** or **Netlify** — global CDN.
- **Backend**: Node `server.js` on **Railway**, **Fly.io**, **AWS ECS**, **GCP Cloud Run**, etc.
- **Database**: **PostgreSQL** (Neon, Supabase, RDS, Cloud SQL). Set `DATABASE_URL` and run migrations: `node db/migrate.js`.

## Required environment variables

### API server

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_JWT_SECRET` | Min 32 chars |
| `PUBLIC_APP_URL` | Canonical SPA URL, e.g. `https://beta.ccweb.app` (Stripe return URLs, referral links) |
| `CCWEB_API_PUBLIC_URL` | Public API base, e.g. `https://api.ccweb.app` (optional; exposed via `GET /api/v1/config`) |
| `CCWEB_ALLOWED_ORIGINS` | Comma-separated origins for CORS, e.g. `https://beta.ccweb.app` |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Payments |
| `OPENAI_API_KEY`, `ETHERSCAN_API_KEY`, etc. | Per `productionGate.js` when `NODE_ENV=production` |

### Frontend build (Vite)

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | API origin only, e.g. `https://api.ccweb.app` — **no trailing slash**. Empty = same-origin (monolith). |

Build: `VITE_API_BASE_URL=https://api.example.com npm run build`

## Stripe webhooks

Point Stripe webhook URL to your API:

`https://<api-host>/api/payments/stripe/webhook`

Use the same API host as `VITE_API_BASE_URL`.

## Beta tester links

After deploy and DB migration:

- **Vanity URL**: User sets **Public beta URL slug** on **Profile** → share `https://<PUBLIC_APP_URL>/u/<slug>`
- **User id link**: `https://<PUBLIC_APP_URL>/test/<userId>` — attribution events only
- **Invite**: Admin creates code via `POST /api/v1/beta/invites` with header `X-CCWEB-Admin: <CCWEB_ADMIN_KEY>` → share `https://<PUBLIC_APP_URL>/invite/<code>`
- Client telemetry: `POST /api/v1/beta/event` (called automatically from the SPA on navigation)

## DNS

- `beta.ccweb.app` → CDN (Vercel/Netlify)
- `api.ccweb.app` → API load balancer / PaaS custom domain

We cannot provision `ccweb.app` from this repository; configure DNS at your registrar.

## QA checklist (manual)

1. Health: `GET https://<api>/health`
2. Config: `GET https://<api>/api/v1/config`
3. Signup / login / JWT refresh
4. Stripe test mode checkout (then live keys)
5. Core flows: Learn, Find, Build, Earn, Community

Optional: connect **Sentry** via env in your host (not wired in-repo).
