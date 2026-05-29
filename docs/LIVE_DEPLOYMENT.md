# Deploy CCWEB to production (split frontend + API)

This repo cannot create **your** live URLs. Follow these steps in **Railway** (recommended API host) + **Vercel** (or **Netlify**) + **PostgreSQL** (Neon, Supabase, managed Postgres, RDS, etc.).

## 1. PostgreSQL

1. Create a **production** Postgres instance (TLS connection string).
2. Allow access from your API host (managed providers usually allow `0.0.0.0/0` for testing; tighten later).
3. Copy **`DATABASE_URL`** (e.g. `postgres://user:pass@host:5432/dbname?sslmode=require`).

## 2. Backend API (Railway)

1. **Railway** → **New Project** → deploy from this GitHub repo (or connect an existing repo).
2. Set the **start** command to `npm start` (runs `node server.js`). Use **`npm ci`** (or `npm install`) for install; run **`npm run migrate`** on deploy or rely on server boot migrations per your ops preference.
3. Expose the service publicly; set **health check** to `/health` if the platform supports it.
4. Set environment variables (minimum for `NODE_ENV=production` — see **`productionGate.js`**):

| Variable | Example |
|----------|---------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Postgres URL |
| `PUBLIC_APP_URL` | `https://your-app.vercel.app` (HTTPS, no trailing slash) |
| `CCWEB_API_PUBLIC_URL` | `https://ccweb-api-production-a92c.up.railway.app` (your API’s public URL) |
| `CCWEB_ALLOWED_ORIGINS` | `https://your-app.vercel.app` (comma-separated if multiple) |
| `AUTH_JWT_SECRET` | 32+ random chars |
| `STRIPE_SECRET_KEY` | Live or test key |
| `STRIPE_WEBHOOK_SECRET` | From Stripe Dashboard |
| `OPENAI_API_KEY` | Required in production gate |
| `ETHERSCAN_API_KEY` | Required in production gate |
| `TRUST_PROXY` | `1` (behind Railway / reverse proxy) |
| `AUTH_REFRESH_IN_BODY` | `1` (recommended for SPA + separate API origin) |
| `AUTH_COOKIE_SECURE` | `1` |

5. **Stripe webhook:** URL `https://<your-api-host>/api/payments/stripe/webhook`, signing secret → `STRIPE_WEBHOOK_SECRET`.

6. After deploy, verify:
   - `curl -sS https://<api-host>/health`
   - `curl -sS https://<api-host>/api/v1/config`

**Your live API URL** is shown in your host’s dashboard (e.g. `https://ccweb-api-production-a92c.up.railway.app`) — it is **not** fixed in this repository.

### Optional: other Node hosts

Teams may also run `server.js` on Fly.io, AWS, GCP, etc., using the same env var set. The repo root **`render.yaml`** is an **optional** blueprint for vendors that support that format; it is not required for Railway + Vercel.

## 3. Frontend (Vercel example)

1. **Vercel** → **Add New** → **Project** → import this repo.
2. **Framework:** Vite  
3. **Build command:** `npm run build`  
4. **Output directory:** `dist`
5. **Environment variables** (Production):

| Variable | Value |
|----------|--------|
| `VITE_API_BASE_URL` | `https://<your-api-host>` (no trailing slash); production default in this repo is `https://ccweb-api-production-a92c.up.railway.app` |
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

Point **DNS** `A`/`CNAME` for `ccweb.app` / `api.ccweb.app` to Vercel and your API host; enable HTTPS in each dashboard (automatic on Vercel and most PaaS providers).

## Global access

Vercel, Railway, and major Postgres hosts serve **globally** over the public internet unless you add IP restrictions. No extra “region unlock” is required for a standard public web + API deployment.
