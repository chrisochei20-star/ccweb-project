# Environment variables for deployment

Use **`.env.production.example`** as the checklist for real hosts. Copy to `.env` on each machine (API vs build runner). `.env*` is gitignored except `.env.example` and `.env.production.example`.

## Split frontend + API

| Variable | Where | Purpose |
|----------|--------|---------|
| `VITE_API_BASE_URL` | Build-time (Vite) | Browser calls this origin for `/api`, `/v1`, `/auth` |
| `CCWEB_API_PUBLIC_URL` | API server | Public API base in `GET /api/v1/config`; OpenAPI when `Host` missing |
| `PUBLIC_APP_URL` | API server | Stripe return URLs, referral links, beta vanity URLs |
| `CCWEB_ALLOWED_ORIGINS` | API server | CORS allowlist (comma-separated) |

## Production gate (`productionGate.js`)

When `NODE_ENV=production`, the API exits unless: `DATABASE_URL`, `PUBLIC_APP_URL` (https), `CCWEB_ALLOWED_ORIGINS`, `AUTH_JWT_SECRET` (32+), Stripe keys, `OPENAI_API_KEY`, `ETHERSCAN_API_KEY` are set.

## Dev proxy

`vite.config.js` reads **`VITE_DEV_API_PROXY_TARGET`** (default `http://127.0.0.1:3000`) so local dev does not hardcode the API port in source.

## SDK / CLI

- **`@ccweb/sdk`**: pass `baseUrl` or set `CCWEB_API_PUBLIC_URL` / `CCWEB_BASE_URL`.
- **`ccweb` CLI**: requires `CCWEB_BASE_URL` or `CCWEB_API_PUBLIC_URL`.
