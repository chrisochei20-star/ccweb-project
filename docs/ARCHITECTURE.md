# CCWEB architecture (prototype)

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 7, React Router 7, Tailwind v4 (`@tailwindcss/vite`), legacy CSS (`styles.css`) |
| Backend | Node.js `http` server (`server.js`), Express **sub-app** for `/api/intelligence/*` |
| Optional DB | MongoDB (`MONGODB_URI`) for tracked wallets and tokens |
| Mobile shell | Capacitor 8 (`capacitor.config.json`, Android package present) |

## Pillars → code map

| Pillar | Primary UI | Primary APIs |
|--------|--------------|----------------|
| Learn | `/courses`, `/ai-streaming`, `/ai-tutor` | Streaming rooms under `/api/streaming/*` |
| Find | `/find`, `/early-signals`, `/token/:slug` | `/api/find/*`, `/api/scan-*`, `/api/intelligence/*` |
| Build | `/dapp-builder`, `/ai-agents` | `/api/dapp/*`, `/api/build/agents` |
| Earn | `/earn`, `/dashboard` | Deals, applicants, streaming payouts (see `server.js`) |

## Extension points

1. **Auth:** JWT access + refresh (`auth/`), bcrypt, TOTP 2FA, wallet SIWE-style; see [docs/AUTH_API.md](./AUTH_API.md). Use `MONGODB_URI` for durable auth store.
2. **Intelligence:** Add real indexers in `earlySignalsEngine.js` / `tokenDetail.js`; keep response shape stable for the React dashboards.
3. **Modular routes:** New features can add Express routers mounted from `server.js` (same pattern as `intelligenceExpress.js`).

## Data lifetime

In-memory maps reset on **API server restart**. Mongo persists only tracked wallets/tokens when configured.
