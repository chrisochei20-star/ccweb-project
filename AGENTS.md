# AGENTS.md

## Cursor Cloud specific instructions

### Overview
This is a React 19 + Vite 7 frontend with a Node.js backend (`server.js`). **Optional PostgreSQL** (`DATABASE_URL`): when set, the server runs `db/schema.sql` migrations on boot (skip with `CCWEB_SKIP_MIGRATIONS=1`) and persists auth users, growth hub (marketplace/escrow), and community data. Without it, those areas fall back to in-memory (or MongoDB for auth when `MONGODB_URI` is set). **`OPENAI_API_KEY`** / **`ETHERSCAN_API_KEY`** are optional in production: AI agents/workflows use **mock** completions and EVM wallet scans **degrade** to DexScreener-only until keys are set (use **`CCWEB_REQUIRE_OPENAI=1`** to hard-require OpenAI).

### Production-oriented backend
- **Logging:** `pino` via `logging/logger.js` (set `LOG_LEVEL`).
- **Rate limiting:** sliding window on `/api/*` and `/v1/*` (`security/apiRateLimit.js`, tune with `API_RATE_LIMIT_MAX`).
- **Flutterwave:** `POST /api/v1/payments/create` (JWT; JSON: `listingId`, optional `buyerName`) returns `txRef` + `amountUsd` for the Flutterwave modal; `POST /api/v1/payments/flutterwave/verify` with `{ tx_ref }` finalizes escrow after payment. Requires **`FLUTTERWAVE_SECRET_KEY`** on the API and **`VITE_FLUTTERWAVE_PUBLIC_KEY`** on the Vite build. Escrow orders in Postgres use `pending_payment` until verification succeeds.
- **Social posting:** `POST /api/social/publish` — requires `approved: true`, optional `dryRun: true`. X posting needs `TWITTER_ACCESS_TOKEN` (user OAuth2 with `tweet.write`); app-only `TWITTER_BEARER_TOKEN` alone cannot create tweets. Facebook: `FACEBOOK_PAGE_ACCESS_TOKEN`, optional `FACEBOOK_PAGE_ID` (default `me`). LinkedIn: `LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_AUTHOR_URN`.
- **OAuth sign-in:** `POST /api/auth/oauth/google` and `POST /api/auth/oauth/apple` (ID tokens); configure `GOOGLE_CLIENT_ID`, `APPLE_CLIENT_ID` (see `.env.example`).
- **AI Learning monetization (PostgreSQL + Flutterwave):** tables `learning_*` in `db/schema.sql`. **Endpoints:** `GET /api/learning/sessions` (query `status`, `limit`), `GET /api/learning/access/quote`, `GET /api/learning/me?userId=`, `POST /api/v1/learning/payments/flutterwave/prepare` (JWT), `POST /api/v1/payments/flutterwave/verify`, SSE `/api/learning/sessions/:streamRoomId/events`, chat `/api/learning/sessions/:streamRoomId/channel`, `POST /api/learning/tutor/message`, admin `GET /api/learning/admin/analytics` (`X-CCWEB-Admin`). **Frontend:** `/learn`, `/learn/session/:roomId`, `/learn/admin`. Logical folder map: [ccweb/README.md](./ccweb/README.md).
- **REST API v1 (Express Routers):** `GET/POST /api/v1/...` — auth, wallet, users, agents, marketplace, payments, analytics. See [docs/API_V1.md](./docs/API_V1.md).

### Running the development environment
Two processes are needed for development:
1. **API server** (port 3000): `npm run dev:api`
2. **Vite dev server** (port 5173): `npm run dev`

The Vite dev server proxies `/api`, `/v1`, and `/auth` to the URL in **`VITE_DEV_API_PROXY_TARGET`** (default `http://127.0.0.1:3000`). Start the API server first, then Vite.

Playwright E2E starts its own API on **`PORT=3055`** (override with **`PLAYWRIGHT_API_PORT`**) so `npm run test` / CI does not collide with a dev server on 3000. Run smoke: `npx playwright test e2e/production-smoke.spec.js` or `npm run test:e2e:production` for deployed URLs.

### Build
`npm run build` — outputs to `dist/`. Styling uses **Tailwind CSS v4** (`@tailwindcss/vite`) plus legacy `src/styles.css`.

### Test
`npm test` — runs Vitest unit tests (`tests/*.test.js`).

### E2E / live preview recording (real browser capture)
- `npm run record:preview` — Playwright starts API + Vite, drives the UI, and saves video under `test-results/`. Run `./scripts/finish-preview-video.sh ./ccweb-preview.mp4` for H.264 1080p.
- GitHub Actions: workflow **Record CCWEB live preview** (`.github/workflows/record-preview.yml`) uploads `ccweb-preview.mp4` + a 10s GIF as an artifact.

### Key API endpoints for verification
- `GET /api/applicants` — list applicant profiles
- `POST /api/applicants` — create an applicant (requires `fullName` in body)
- `POST /api/streaming/rooms` — create a live room (requires `roomName` in body)
- `GET /api/streaming/rooms` — list active rooms
- `GET /api/intelligence/dashboard` — Early Signals dashboard payload (feed, narratives, risk alerts, smart money)
- `GET /api/intelligence/stream` — SSE heartbeat (~12s) to trigger client refresh
- `GET /api/intelligence/token/:slug` — Token detail payload (symbol, `0x` address, or Solana mint in path)
- `POST /api/auth/register` — Register (email, password); does not auto-login
- `POST /api/auth/login` — JWT access + refresh (cookie or `AUTH_REFRESH_IN_BODY`); optional `needsTwoFactor` + `twoFactorToken`
- `POST /api/auth/login/2fa` — Complete login with TOTP or backup code
- `POST /api/auth/refresh` — Rotate refresh token
- `GET /api/auth/me` — Current user (`Authorization: Bearer <accessToken>`)
- `POST /api/auth/logout` — Revoke refresh
- `POST /api/auth/wallet/nonce` + `POST /api/auth/wallet/connect` — Wallet sign-in (see [docs/AUTH_API.md](./docs/AUTH_API.md))
- `GET /api/growth/overview` — Growth hub KPIs, fees, policy text ([docs/GROWTH_HUB.md](./docs/GROWTH_HUB.md))
- **Developer onboarding:** `/developers/onboarding` (guided ~5 min) · **Quick start:** [docs/DEVELOPER_QUICKSTART.md](https://github.com/chrisochei20-star/ccweb-project/blob/main/docs/DEVELOPER_QUICKSTART.md) and static `/docs/DEVELOPER_QUICKSTART.md` when served

- **Security architecture:** [docs/BACKEND_SECURITY_ARCHITECTURE.md](./docs/BACKEND_SECURITY_ARCHITECTURE.md) (gateway, services, checklist)

### Gotchas
- The `GET /api/streaming/curriculum` endpoint documented in the README returns 404; the curriculum data is embedded in the room creation response instead.
- The backend serves both API routes and static files from `/public`. In production mode (`npm start`), it serves the built `dist/` folder.
- The in-memory data resets on every server restart (including telemetry events and bug reports when not using Postgres).
- Without `DATABASE_URL` and without `MONGODB_URI`, auth users and refresh bindings fall back to **in-memory** (lost on restart). Set `AUTH_JWT_SECRET` (32+ chars) in production.
- Without `MONGODB_URI`, tracked wallets and tracked tokens are not persisted for intelligence features (API may still return sample market data).
