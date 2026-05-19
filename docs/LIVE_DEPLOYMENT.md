# Deploy CCWEB to production (split frontend + API)

This repo cannot create **your** live URLs. Follow these steps in **Render** (or **Railway**) + **Vercel** (or **Netlify**) + **PostgreSQL** (Neon, Supabase, Render Postgres, RDS, etc.).

## 1. PostgreSQL

1. Create a **production** Postgres instance (TLS connection string).
2. Allow access from your API host (managed providers usually allow `0.0.0.0/0` for testing; tighten later).
3. Copy **`DATABASE_URL`** (e.g. `postgres://user:pass@host:5432/dbname?sslmode=require`).

## 2. Backend API (Render example)

1. **Render** → **New** → **Blueprint** → connect this GitHub repo (or **Web Service** from the same repo).
2. If using the included **`render.yaml`**, apply the Blueprint; Render will prompt for every `sync: false` variable.
3. Otherwise create a **Web Service**:
   - **Runtime:** Node
   - **Build command:** `npm ci`
   - **Pre-deploy command:** `node db/migrate.js` (applies `db/schema.sql`)
   - **Start command:** `npm start`
   - **Health check path:** `/health`
4. Set environment variables (minimum for `NODE_ENV=production` — see **`productionGate.js`**):

| Variable | Example |
|----------|---------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Postgres URL |
| `PUBLIC_APP_URL` | `https://your-app.vercel.app` (HTTPS, no trailing slash) |
| `CCWEB_API_PUBLIC_URL` | `https://ccweb-api-production.up.railway.app` (your API’s public URL) |
| `CCWEB_ALLOWED_ORIGINS` | `https://your-app.vercel.app` (comma-separated if multiple) |
| `AUTH_JWT_SECRET` | 32+ random chars |
| `STRIPE_SECRET_KEY` | Live or test key |
| `STRIPE_WEBHOOK_SECRET` | From Stripe Dashboard |
| `OPENAI_API_KEY` | Required in production gate |
| `ETHERSCAN_API_KEY` | Required in production gate |
| `TRUST_PROXY` | `1` (behind Render/Railway proxy) |
| `AUTH_REFRESH_IN_BODY` | `1` (recommended for SPA + separate API origin) |
| `AUTH_COOKIE_SECURE` | `1` |

5. **Stripe webhook:** URL `https://<your-api-host>/api/payments/stripe/webhook`, signing secret → `STRIPE_WEBHOOK_SECRET`.

6. After deploy, verify:
   - `curl -sS https://<api-host>/health`
   - `curl -sS https://<api-host>/api/v1/config`

**Your live API URL** is shown in your host’s dashboard (e.g. Railway: `https://ccweb-api-production.up.railway.app`) — it is **not** fixed in this repository.

## 3. Frontend (Vercel example)

1. **Vercel** → **Add New** → **Project** → import this repo.
2. **Framework:** Vite  
3. **Build command:** `npm run build`  
4. **Output directory:** `dist`
5. **Environment variables** (Production):

| Variable | Value |
|----------|--------|
| `VITE_API_BASE_URL` | `https://<your-api-host>` (no trailing slash) |
| `VITE_APP_ENV` | `production` |
| `VITE_WALLETCONNECT_PROJECT_ID` | If you use wallet connect |

6. Deploy. **Your live frontend URL** will be `https://<project>.vercel.app` or your custom domain.

## 4. Netlify (alternative)

`netlify.toml` sets `build.command` and `publish = "dist"`. In the Netlify UI, set **`VITE_API_BASE_URL`** the same way as Vercel.

## 5. Post-deploy checks

- [ ] Browser: open SPA, sign up / log in.
- [ ] Network tab: API calls go to `VITE_API_BASE_URL`, not `localhost`.
- [ ] `GET /api/v1/config` returns `publicAppUrl` and `apiPublicUrl` as expected.
- [ ] Stripe test payment in test mode (then switch to live keys when ready).
- [ ] **QA checklist & Playwright:** see [QA_PRODUCTION_CHECKLIST.md](./QA_PRODUCTION_CHECKLIST.md), [QA_REPORT_TEMPLATE.md](./QA_REPORT_TEMPLATE.md), and `npm run test:e2e:production`.

## 6. Custom domains (optional)

Point **DNS** `A`/`CNAME` for `ccweb.app` / `api.ccweb.app` to Vercel and Render; enable HTTPS in each dashboard (automatic on Vercel/Render).

## Global access

Render, Vercel, and major Postgres hosts serve **globally** over the public internet unless you add IP restrictions. No extra “region unlock” is required for a standard public web + API deployment.
