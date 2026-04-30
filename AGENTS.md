# AGENTS.md

## Cursor Cloud specific instructions

This is a Node.js monolithic prototype (React 19 frontend + vanilla Node.js backend). No external databases or services required — all state is in-memory.

### Services

| Service | Port | Command | Notes |
|---------|------|---------|-------|
| API backend | 3000 | `npm run dev:api` | Vanilla Node.js HTTP server (`server.js`); all data stored in-memory Maps |
| Vite frontend | 5173 | `npm run dev` | React HMR dev server; proxies `/api` → `localhost:3000` |

### Development workflow

1. Start the API backend first: `npm run dev:api` (port 3000)
2. Start Vite dev server: `npm run dev` (port 5173)
3. Access the app at `http://localhost:5173/`

The Vite proxy config in `vite.config.js` forwards all `/api/*` requests to the backend on port 3000.

### Build

`npm run build` — produces `dist/` directory via Vite.

### Key caveats

- There is **no linter or test framework** configured in this project (`package.json` has no `lint` or `test` scripts, no ESLint/Prettier/Jest/Vitest config).
- The backend uses **in-memory data only** — restarting `server.js` resets all state.
- No `.env` file needed; the only configurable value is `PORT` (defaults to 3000).
- The "streaming" endpoints use mocked LiveKit tokens — no real LiveKit server is required.
- `package.json` declares `"engines": {"node": ">=20"}`.
