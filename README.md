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

Open **http://localhost:5173**. The Vite dev server proxies `/api` to `http://127.0.0.1:3000`.

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

## Auth (prototype)

Email + password register/login against the API. Sessions use **Bearer** tokens stored in `sessionStorage` on the client and **in-memory** on the server — **data resets when the API restarts**. Replace with a managed identity provider before production.

## Key API areas

- **Applicants & deals:** `GET/POST /api/applicants`, `POST /api/deals`, etc.
- **Streaming:** `GET/POST /api/streaming/rooms`, payouts, attendance
- **Intelligence:** `/api/intelligence/*` (dashboard, token detail, tracked wallets/tokens)
- **Auth:** `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, password reset stubs

## Gotchas

- `GET /api/streaming/curriculum` is **not** implemented; curriculum context is embedded in room creation responses (see AGENTS.md).
- Crypto / intelligence outputs are **signals and probabilities**, not financial advice.
