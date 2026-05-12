# CCWEB production deploy checklist (Vercel + Render)

Use this after changing domains or when “Cannot reach API” / CORS errors appear.

## Frontend (Vercel)

- [ ] **Project → Settings → Environment Variables → Production**
  - [ ] `VITE_API_BASE_URL` = `https://ccweb-render-main.onrender.com` (no trailing slash)
  - [ ] Redeploy after changing env vars (Vite bakes `VITE_*` at build time)
- [ ] Production URL loads (e.g. `https://ccweb-project-hoiy.vercel.app`)
- [ ] Browser devtools → Network: API calls go to the Render host, not `localhost`

## Backend (Render Web Service)

- [ ] **Runtime**
  - [ ] `NODE_VERSION` / engines: **Node 20.x** (see `package.json`, `render.yaml`)
  - [ ] `PORT`: Render injects automatically; app listens on `0.0.0.0` (`HOST=0.0.0.0` in `render.yaml`)
- [ ] **URLs & CORS**
  - [ ] `PUBLIC_APP_URL` = your **Vercel SPA** origin, e.g. `https://ccweb-project-hoiy.vercel.app` (https, no trailing slash)
  - [ ] `CCWEB_ALLOWED_ORIGINS` includes that same origin (comma-separated if several). Using `*` allows any origin (open beta only).
  - [ ] `PUBLIC_APP_URL` is **automatically merged** into the CORS allowlist when `CCWEB_ALLOWED_ORIGINS` is a comma-separated list (see `security/expressHardDefaults.js`).
- [ ] **Auth**
  - [ ] `AUTH_JWT_SECRET` — 32+ characters
  - [ ] `AUTH_REFRESH_IN_BODY=1` if the SPA reads refresh tokens from JSON (matches `render.yaml` default)
- [ ] **Database**
  - [ ] `DATABASE_URL` (PostgreSQL)
  - [ ] Build / pre-deploy runs `npm run migrate` successfully (check Render logs)

## Quick verification (browser or curl)

- [ ] `GET https://ccweb-render-main.onrender.com/health` → JSON with `"status":"ok"`
- [ ] `GET https://ccweb-render-main.onrender.com/` with header `Accept: application/json` (and **without** `text/html`) → JSON health; opening `/` in a **browser tab** still prefers HTML when `text/html` is in `Accept`
- [ ] From the Vercel origin, open devtools → a `POST /api/auth/login` preflight (`OPTIONS`) returns **204** and `Access-Control-Allow-Origin` matches your Vercel origin (not `*` when using cookies / credentials)

## Common failures

| Symptom | Likely cause |
|--------|----------------|
| “Cannot reach https://…” | Render service asleep, crashed on boot (check logs), wrong URL, or DNS |
| CORS error in console | `CCWEB_ALLOWED_ORIGINS` / `PUBLIC_APP_URL` missing or wrong; preflight used to send `Access-Control-Allow-Origin: *` with credentials — fixed in server `writeRawOptions` + Express `cors` |
| 502 / connection reset | App exited on `productionGate` (missing `DATABASE_URL`, `AUTH_JWT_SECRET`, etc.) |

## Legacy hostnames

Replace any old API hosts (e.g. `ccweb-project-1.onrender.com`) with **`https://ccweb-render-main.onrender.com`** in Vercel env, `.env.production`, and documentation.
