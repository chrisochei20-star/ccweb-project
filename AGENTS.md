# AGENTS.md

## Cursor Cloud specific instructions

### Overview
This is a React 19 + Vite 7 frontend with a Node.js backend (`server.js`). Core app state remains in-memory. **Optional:** MongoDB for persisted tracked wallets (`MONGODB_URI`), and explorer API keys for live contract checks (`ETHERSCAN_API_KEY`).

### Running the development environment
Two processes are needed for development:
1. **API server** (port 3000): `npm run dev:api`
2. **Vite dev server** (port 5173): `npm run dev`

The Vite config proxies `/api` requests to `http://127.0.0.1:3000`. Start the API server first, then Vite.

### Build
`npm run build` — outputs to `dist/`. Styling uses **Tailwind CSS v4** (`@tailwindcss/vite`) plus legacy `src/styles.css`.

### Lint / Test
No lint or test tooling is currently configured in this project (no ESLint, Prettier, Jest, or Vitest). If lint/test scripts are added later, update this section.

### Key API endpoints for verification
- `GET /api/applicants` — list applicant profiles
- `POST /api/applicants` — create an applicant (requires `fullName` in body)
- `POST /api/streaming/rooms` — create a live room (requires `roomName` in body)
- `GET /api/streaming/rooms` — list active rooms
- `GET /api/intelligence/dashboard` — Early Signals dashboard payload (feed, narratives, risk alerts, smart money)
- `GET /api/intelligence/stream` — SSE heartbeat (~12s) to trigger client refresh

### Gotchas
- The `GET /api/streaming/curriculum` endpoint documented in the README returns 404; the curriculum data is embedded in the room creation response instead.
- The backend serves both API routes and static files from `/public`. In production mode (`npm start`), it serves the built `dist/` folder.
- The in-memory data resets on every server restart.
- Without `MONGODB_URI`, tracked wallets for Early Signals are not persisted (API still returns sample market data).
