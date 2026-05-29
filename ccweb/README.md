# CCWEB production layout (logical map)

This repository ships as a **single deployable app**: Node serves `/api` and static/Vite `dist/` on one host (Railway, Fly, VPS). The layout below maps your requested `ccweb/backend` and `ccweb/frontend` modules to **actual paths** in this repo—no duplicate codebase.

| Requested path | Repository location |
|----------------|---------------------|
| `backend/src/server.js` | `server.js` (HTTP router + streaming handlers) |
| `backend/src/modules/auth/` | `auth/` (`authExpress.js`, `authEngine.js`, `authStore.js`) |
| `backend/src/modules/users/` | `auth/` + `db/pgAuthStore.js` |
| `backend/src/modules/wallet/` | Wallet routes inside `auth/` |
| `backend/src/modules/sessions/` | `server.js` (`/api/streaming/*`, `/api/learning/*`) + in-memory `streamRooms` + PostgreSQL `learning_*` tables |
| `backend/src/modules/payments/` | `payments/` (`flutterwaveConfig.js`, `flutterwaveClient.js`, `flutterwavePayments.js`) |
| `backend/src/modules/analytics/` | `learning` persistence analytics + `/api/learning/admin/analytics` |
| `backend/src/middleware/` | `security/expressHardDefaults.js`, `security/apiRateLimit.js`, auth middleware in auth modules |
| `frontend/pages/learn.js` | `src/learning/LearningHubPage.jsx`, `LearningSessionPage.jsx` · routes `/learn`, `/learn/session/:roomId` |
| `frontend/services/` | `src/api/http.js`, `src/api/learningApi.js` |
| `frontend/styles/` | `src/styles.css`, `src/learning/learning.css` |

## Environment (production)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL — learning monetization ledger, paywall, Flutterwave-eligible checkout |
| `FLUTTERWAVE_SECRET_KEY` | Server verify for Flutterwave transactions (growth escrow + learning) |
| `VITE_FLUTTERWAVE_PUBLIC_KEY` | Vite build — public key for the Flutterwave modal |
| `AUTH_JWT_SECRET` | JWT signing |
| `CCWEB_ADMIN_KEY` | `X-CCWEB-Admin` header for `/api/learning/admin/analytics` |
| `CCWEB_LEARNING_HOURLY_USD` | Default hourly rate for participant billing |
| `LIVEKIT_URL` | Optional WebRTC; omit to use SSE (`ccweb_sse`) learning channel |

## Key APIs

- **Sessions (runtime):** `GET/POST /api/streaming/rooms`, attendance, finish  
- **Learning (persistent):** `GET /api/learning/sessions`, `GET /api/learning/access/quote`, `POST /api/v1/learning/payments/flutterwave/prepare`, tutor + SSE channel under `/api/learning/sessions/:streamRoomId/*`

Deploy: build frontend (`npm run build`), run API (`npm start` or `node server.js`), point DNS + HTTPS terminator (Railway/Fly/nginx) at the Node process.

### Build from this folder

From repo root, `npm run build` produces `dist/`. From **`ccweb/`** you can run the same scripts via `ccweb/package.json`:

```bash
cd ccweb && npm run build
```

That delegates to the parent package so CI or docs can use a `ccweb/` working directory without duplicating code.
