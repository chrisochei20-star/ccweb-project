# Deployment notes: Render (API) + Vercel (frontend)

Use after merging **notifications + stabilization** to `main`. Replace example URLs with your production hosts.

## Render (Node API + static option)

### Service type

- **Web service** running `server.js` (Express + raw HTTP handlers + Socket.IO).
- **Runtime**: Node **20.x** (match `engines` in `package.json` and CI).

### Build and start

Typical Render settings:

| Field | Suggested value |
|--------|------------------|
| **Build command** | `npm ci && npm run build` (builds Vite `dist/` if you serve the SPA from the same service) |
| **Start command** | `npm start` → `node server.js` |
| **Health check path** | `/` with `Accept: application/json` or your documented `/health` path |

If the API does **not** need to serve the built SPA, you can use a minimal build (e.g. `npm ci` only). This repo’s production mode often serves `dist/` from the same process; keep `npm run build` if that matches your deployment.

### Database and migrations

- Set **`DATABASE_URL`** to the Render PostgreSQL connection string.
- Migrations run on boot unless **`CCWEB_SKIP_MIGRATIONS=1`** (see `AGENTS.md`).
- Ensure incremental files under `db/migrations/` have run; new release includes **`010_ccweb_notifications_actor_group.sql`** for notification grouping columns.

### Auth and CORS (critical for Vercel split)

| Variable | Purpose |
|----------|---------|
| **`AUTH_JWT_SECRET`** | 32+ random characters; required in production. |
| **`PUBLIC_APP_URL`** | Canonical **frontend** URL (e.g. `https://your-app.vercel.app`). Merged into CORS allowlist when supported. |
| **`CCWEB_ALLOWED_ORIGINS`** | Comma-separated origins allowed for credentialed API calls; **must include** the exact Vercel production URL (and preview URLs if you use previews). |
| **`TRUST_PROXY`** | Set to `1` behind Render’s proxy so secure cookies and client IPs behave correctly. |

### Realtime (chat + notifications)

- Socket.IO shares the same origin as the HTTP server on Render.
- The browser client must connect to **`VITE_API_BASE_URL`** (or equivalent) as the Socket host; ensure **WebSockets** are allowed on Render (default for web services).

### Optional but common

- **`LOG_LEVEL`**: `info` or `warn` in production.
- **`CCWEB_BOOT_WARN_ONLY`**: only for debugging production gate; remove for strict boots.
- Stripe, OAuth, Cloudinary, OpenAI: set per feature; app degrades when unset where designed.

---

## Vercel (Vite static SPA)

### Build

| Field | Suggested value |
|--------|------------------|
| **Framework** | Vite (or Other → Vite) |
| **Build command** | `npm ci && npm run build` |
| **Output directory** | `dist` |
| **Install command** | `npm ci` |

### Environment variables (production + preview)

| Variable | Required | Notes |
|----------|----------|--------|
| **`VITE_API_BASE_URL`** | Yes | Full URL of the Render API, **no trailing slash**, e.g. `https://your-service.onrender.com`. All browser API and Socket traffic should target this. |
| **`VITE_WALLETCONNECT_PROJECT_ID`** | If using WalletConnect | From Reown (WalletConnect Cloud). |
| **`VITE_APP_ENV`** | Optional | e.g. `production` for logging/behavior toggles. |

**Previews:** either set `VITE_API_BASE_URL` to a staging API or the same production API; ensure **`CCWEB_ALLOWED_ORIGINS`** on Render includes each Vercel preview origin you use, or use a single staging API with fixed preview domain patterns.

### After deploy

1. Open the Vercel URL → home loads without “Cannot reach API”.
2. Sign up / login → JWT stored; `/api/auth/me` succeeds.
3. Open **Community**, **Notifications**, **Messages** → no CORS errors in devtools.
4. Confirm **`GET /`** to the API with `Accept: application/json` returns healthy JSON.

---

## Quick verification commands (replace URLs)

```bash
curl -sS -H "Accept: application/json" "https://YOUR-RENDER.onrender.com/"
npm test && npm run build
```

For a fuller gate before tagging a release, use **`docs/POST_MERGE_VERIFICATION.md`** and **`docs/QA_RELEASE_CHECKLIST.md`**.
