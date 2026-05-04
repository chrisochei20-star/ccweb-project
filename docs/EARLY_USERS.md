# CCWEB early users — staging, telemetry, and admin

This document supports the **stable, testable** iteration of the CCWEB web app: navigation, onboarding, lightweight usage telemetry, and admin inspection.

## Staging (public test URL)

The repository ships a **`vercel.json`** with SPA rewrites so client-side routes work on static hosts.

1. Push this branch to GitHub and import the repo in [Vercel](https://vercel.com/) (or Netlify with equivalent SPA fallback).
2. Configure **environment variables** in the host dashboard so the **serverless API is not required for the first paint**: the static `dist/` loads from the CDN; API calls go to the URL you set in the build or runtime config.
3. For a **full** experience (auth, community, telemetry, growth hub), deploy the **Node server** (`npm start` after `npm run build`) to a platform that runs Node (Railway, Render, Fly.io, etc.) and point the frontend origin at that server, **or** use the default dev setup: API on port 3000 and Vite on 5173 with proxies.

**Working test URL:** set this to your deployed production or preview URL after you connect the host (for example `https://ccweb-preview.vercel.app`). Until then, use `http://localhost:5173` with `npm run dev:api` and `npm run dev`.

## Feature status (high level)

| Area | Status | Notes |
|------|--------|--------|
| Learn hub | Working | `/learn` links to courses, AI tutor, AI streaming. |
| Find hub | Working | `/find` default **Hub** tab; scanner, signals, wallets, alerts. |
| Build hub | Working | `/build` links to DApp builder, dashboard, agents, developers, growth hub. |
| Earn | Working | `/earn` unchanged pillar content. |
| Community | Working (prototype) | Posts + chat + bug reports use in-memory APIs; data resets on server restart. |
| Profile / dashboard | Working | Profile saves with refresh token preserved when present. |
| First-time onboarding | Working | After login/signup, users without `localStorage` `ccweb_welcome_done` go to `/welcome`. |
| Bottom navigation | Working | Learn / Find / Build / Earn / Community / Profile with route-prefix active states. |

## Telemetry (user testing)

The client sends anonymous **`page_view`** events and **`welcome_interest`** when a pillar is chosen on the welcome screen. **Global `error` and `unhandledrejection`** handlers POST a short message to `/api/telemetry/client-error`.

- `POST /api/telemetry/event` — body: `{ name, path?, sessionId?, metadata? }`
- `POST /api/telemetry/client-error` — body: `{ message, path?, sessionId? }`

Events are stored **in memory** on the Node process (suitable for demos; replace with OpenTelemetry + a datastore for production).

## Admin

Set **`CCWEB_ADMIN_KEY`** in the server environment (see `.env.example`). Send header **`X-CCWEB-Admin: <same value>`** on:

- `GET /api/admin/telemetry/summary` — counts, recent events, recent client errors, page view rollup
- `GET /api/admin/users` — same payload as public `GET /api/users` but gated
- `GET /api/admin/community/bugs` — bug reports from `/api/community/bugs`

## Bug reports (community)

Authenticated users can file reports from **Community**. `POST /api/community/bugs` accepts `title`, `description`, optional `reporterUserId`, `path`, `severity`. Public `GET /api/community/bugs` lists all reports (prototype transparency); restrict in production.

## Performance (static build)

Run `npm run build` and inspect Vite output for gzip sizes of `dist/assets/*`. Typical client bundle is on the order of **~100 kB gzip** for the main JS chunk (varies with dependencies). For faster first paint on mobile, prefer the static CDN deployment and keep API on a low-latency region close to users.
