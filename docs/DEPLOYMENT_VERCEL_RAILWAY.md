# Deployment notes: Railway (API) + Vercel (frontend)

Use after merging to `main`. Replace example URLs with your production hosts if they differ from the defaults below.

## Railway (Node API)

### Service

- **Web service** running `server.js` (Express + Socket.IO).
- **Runtime**: Node **20.x** (match `engines` in `package.json` and CI).

### Build and start

Typical Railway settings:

| Field | Suggested value |
|--------|------------------|
| **Build command** | `npm ci && npm run build` (only if this service also serves the Vite `dist/` bundle) |
| **Start command** | `npm start` → `node server.js` |
| **Health check** | `/health` or `/` with `Accept: application/json` |

If the API does **not** serve the built SPA, you can use `npm ci` (or `npm ci && npm run migrate`) without `npm run build`.

### Database and migrations

- Set **`DATABASE_URL`** to your PostgreSQL connection string.
- Migrations run on boot unless **`CCWEB_SKIP_MIGRATIONS=1`** (see `AGENTS.md`).

### Auth and CORS (critical for Vercel split)

| Variable | Purpose |
|----------|---------|
| **`AUTH_JWT_SECRET`** | 32+ random characters; required in production. |
| **`PUBLIC_APP_URL`** | Canonical **frontend** URL (e.g. `https://your-app.vercel.app`). Merged into CORS allowlist when supported. |
| **`CCWEB_API_PUBLIC_URL`** | Public API base (https, no trailing slash). Used with `PUBLIC_APP_URL` so **`ccweb_refresh`** uses **`SameSite=None`** when the SPA and API are on different sites (Vercel → Railway). |
| **`CCWEB_ALLOWED_ORIGINS`** | Comma-separated browser origins; each entry is normalized to `scheme://host` (trailing paths ignored). **Must match** the `Origin` header the browser sends (exact Vercel host, no trailing slash). |
| **`TRUST_PROXY`** | Set to `1` to trust `X-Forwarded-*` from the load balancer (recommended). If unset, **Railway** is auto-detected via `RAILWAY_ENVIRONMENT` / `RAILWAY_PUBLIC_DOMAIN` and trust proxy is still enabled. Set **`TRUST_PROXY=0`** only for local debugging behind no proxy. |

### Realtime (chat + notifications)

- Socket.IO shares the same HTTP origin as the API on Railway.
- The browser client must connect to **`VITE_API_BASE_URL`** (same host as REST). Ensure **WebSockets** are enabled for the service (Railway supports this for Node web services).

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
|----------|----------|-------|
| **`VITE_API_BASE_URL`** | Yes | Full URL of the production API, **no trailing slash**, e.g. `https://ccweb-api-production.up.railway.app`. All browser API and Socket traffic should target this. |
| **`VITE_CCWEB_API_DEBUG`** | Optional | Set to `1` for one-off builds to log resolved API / auth / Socket hosts in the browser console; omit in normal production. |
| **`VITE_WALLETCONNECT_PROJECT_ID`** | If using WalletConnect | From Reown (WalletConnect Cloud). |
| **`VITE_APP_ENV`** | Optional | e.g. `production` for logging/behavior toggles. |

**Previews:** either set `VITE_API_BASE_URL` to a staging API or the same production API; ensure **`CCWEB_ALLOWED_ORIGINS`** on the API host includes each Vercel preview origin you use.

### After deploy

1. Open the Vercel URL → home loads without “Cannot reach API”.
2. Sign up / login → JWT stored; `/api/auth/me` succeeds.
3. Open **Community**, **Notifications**, **Messages** → no CORS errors in devtools.
4. Confirm **`GET /`** to the API with `Accept: application/json` returns healthy JSON.

If you previously shipped a bundle with a wrong API host, trigger a **fresh production deployment** (empty commit or “Redeploy”) so Vite bakes the current `VITE_API_BASE_URL`. There is **no service worker** in this repo caching API origins.

---

### Split-deploy diagnostics (temporary)

On **Railway**, set **`CCWEB_DIAGNOSTIC_ROUTES=1`**, redeploy, then from a browser (or curl with `-H Origin: https://your-spa.vercel.app`):

- `GET https://<api>/api/debug/cors` — CORS mode, whether your `Origin` is allowlisted, public URLs, trust proxy.
- `GET https://<api>/api/debug/auth` — presence of `Authorization` / `ccweb_refresh` cookie (no secrets echoed).

Set **`CCWEB_AUTH_TRACE=1`** on Railway to log every **OPTIONS** and auth HTTP hit (structured logs).

On **Vercel** build env (then redeploy SPA): **`VITE_CCWEB_API_DEBUG=1`** and/or **`VITE_CCWEB_AUTH_TRACE=1`** for browser console traces. Remove these flags after debugging.

---

## Quick verification commands (replace URLs if needed)

```bash
curl -sS -H "Accept: application/json" "https://<your-railway-api-host>/"
npm test && npm run build
```

For a fuller gate before tagging a release, use **`docs/POST_MERGE_VERIFICATION.md`** and **`docs/QA_RELEASE_CHECKLIST.md`**.

## Optional: other hosts

The repo may still include **`render.yaml`** as an optional blueprint for teams that deploy the API elsewhere. Production CCWEB traffic documented here targets **Railway** for the API and **Vercel** for the SPA.
