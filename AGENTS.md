# AGENTS.md

## Cursor Cloud specific instructions

### Overview
This is a React 19 + Vite 7 frontend with a Node.js backend (`server.js`). Core app state remains in-memory. **Optional:** MongoDB for persisted tracked wallets (`MONGODB_URI`), and explorer API keys for live contract checks (`ETHERSCAN_API_KEY`).

### Running the development environment
Two processes are needed for development:
1. **API server** (port 3000): `npm run dev:api`
2. **Vite dev server** (port 5173): `npm run dev`

The Vite config proxies `/api`, `/v1`, and `/auth` to `http://127.0.0.1:3000`. Start the API server first, then Vite.

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
- **Developer onboarding:** `/developers/onboarding` (guided ~5 min) · **Quick start:** [docs/DEVELOPER_QUICKSTART.md](https://github.com/chrisochei20-star/ccweb-project/blob/main/docs/DEVELOPER_QUICKSTART.md) and static `/docs/DEVELOPER_QUICKSTART.md` when served

- **Security architecture:** [docs/BACKEND_SECURITY_ARCHITECTURE.md](./docs/BACKEND_SECURITY_ARCHITECTURE.md) (gateway, services, checklist)

### Gotchas
- The `GET /api/streaming/curriculum` endpoint documented in the README returns 404; the curriculum data is embedded in the room creation response instead.
- The backend serves both API routes and static files from `/public`. In production mode (`npm start`), it serves the built `dist/` folder.
- The in-memory data resets on every server restart.
- Without `MONGODB_URI`, auth users and refresh bindings fall back to **in-memory** (lost on restart). Set `AUTH_JWT_SECRET` (32+ chars) in production.
- Without `MONGODB_URI`, tracked wallets and tracked tokens are not persisted for intelligence features (API may still return sample market data).
