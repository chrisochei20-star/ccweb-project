# ccweb-project

The world's first AI-powered Web3 Academy and Business Engine.

**Pillars:** Learn → Find → Build → Earn.

## Prerequisites

- **Node.js 20+** and npm

## Install

```bash
npm install
```

## Development (two terminals)

1. **API** (port **3000**): `npm run dev:api`
2. **Vite** (port **5173**): `npm run dev`

Open **http://localhost:5173**. The Vite dev server proxies `/api`, `/v1`, and `/auth` to `http://127.0.0.1:3000`.

## Production-style run

```bash
npm run build
npm start
```

`npm start` serves the built `dist/` folder and the same API as dev.

## Tests

```bash
npm test
```

## Mobile (Capacitor)

After `npm run build`:

```bash
npm run mobile:sync
```

Requires `@capacitor/cli` (devDependency). Add iOS with `npx cap add ios` on macOS if needed.

## Documentation

| Doc | Purpose |
|-----|---------|
| [AGENTS.md](./AGENTS.md) | Agent / cloud workspace notes and key endpoints |
| [CHANGELOG.md](./CHANGELOG.md) | Release and milestone notes |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System map and extension points |
| [docs/STORE_RELEASE.md](./docs/STORE_RELEASE.md) | Play / App Store checklist |
| [docs/DEMO_VIDEO_SCRIPT.md](./docs/DEMO_VIDEO_SCRIPT.md) | 2-minute demo shot list |
| [docs/CODE_INVENTORY.md](./docs/CODE_INVENTORY.md) | Refined / changed / outdated snapshot |
| [docs/REPOSITORY_LAYOUT.md](./docs/REPOSITORY_LAYOUT.md) | Where frontend, backend, API, and SDK live in this repo |
| [docs/BACKEND_SECURITY_ARCHITECTURE.md](./docs/BACKEND_SECURITY_ARCHITECTURE.md) | Backend security layers, scaling, checklist |
| [docs/AUTH_API.md](./docs/AUTH_API.md) | JWT, 2FA, wallet sign-in, curl examples |
| [docs/EARLY_USERS.md](./docs/EARLY_USERS.md) | Staging notes, telemetry, admin key, feature status |

## Auth

Email + password with **bcrypt**, **JWT** access + rotating **refresh** (httpOnly cookie; use `AUTH_REFRESH_IN_BODY=1` for Vite dev), optional **TOTP** 2FA, and **wallet** sign-in (EVM / Solana). Configure **`AUTH_JWT_SECRET`** (32+ chars) and **`MONGODB_URI`** for production persistence. See [docs/AUTH_API.md](./docs/AUTH_API.md).

## Early users & staging

Hub navigation (`/learn`, `/find`, `/build`), welcome flow, lightweight telemetry, and admin summaries are documented in [docs/EARLY_USERS.md](./docs/EARLY_USERS.md). **`vercel.json`** provides SPA rewrites for static hosting after `npm run build`.

## Growth Hub

Global marketing workspace, marketplace, and simulated escrow: **`/growth-hub`** in the app, **`/api/growth/*`** on the API. See [docs/GROWTH_HUB.md](./docs/GROWTH_HUB.md).

## Key API areas

- **Applicants & deals:** `GET/POST /api/applicants`, `POST /api/deals`, etc.
- **Streaming:** `GET/POST /api/streaming/rooms`, payouts, attendance
- **Intelligence:** `/api/intelligence/*` (dashboard, token detail, tracked wallets/tokens)
- **Auth:** `/api/auth/*` and `/auth/*` — JWT, 2FA, wallet, refresh (see `docs/AUTH_API.md`)
- **Growth hub:** `/api/growth/*` — marketing campaigns, marketplace, escrow (see `docs/GROWTH_HUB.md`)
- **Telemetry (prototype):** `POST /api/telemetry/event`, `POST /api/telemetry/client-error` — in-memory on the Node process
- **Admin (when `CCWEB_ADMIN_KEY` is set):** `GET /api/admin/telemetry/summary`, `GET /api/admin/users`, `GET /api/admin/community/bugs` — send header `X-CCWEB-Admin`
- **Community bugs:** `POST /api/community/bugs`, `GET /api/community/bugs`

- `GET /api/streaming/curriculum` is **not** implemented; curriculum context is embedded in room creation responses (see AGENTS.md).
- Crypto / intelligence outputs are **signals and probabilities**, not financial advice.
