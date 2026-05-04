# CCWEB repository layout

This document maps **logical** areas to **physical** paths. The app is intentionally a **single Node package** with Vite + React at the repo root so `npm run build`, Capacitor (`webDir: dist`), and `npm start` keep working without a multi-package migration.

## Logical → physical

| Area | Role | Location |
|------|------|----------|
| **Frontend** | React 19 + Tailwind (Vite) | `src/`, `index.html`, `vite.config.js`, `src/main.jsx` |
| **Backend** | HTTP API + static `public/` + production `dist/` | `server.js`, `public/` |
| **API modules** | Mounted routers / shared logic | `*_Express.js`, `auth/`, `cryptoSafety.js`, `intelligenceDb.js`, … |
| **Security** | Cross-cutting controls | `security/` (Helmet + CORS defaults), rate limits in `auth/`, API key limits in `developerPlatform.js` |
| **Developer ecosystem** | Public `/v1`, console `/api/developer` | `developerExpress.js`, `developerPlatform.js`, `developerWeb3.js` |
| **Agents / automation (SDK)** | Published-style packages (not npm-linked by default) | `packages/ccweb-sdk/`, `packages/ccweb-cli/` |
| **Docs** | Architecture, DX, store | `docs/`, `AGENTS.md`, `README.md` |
| **E2E / QA** | Playwright | `e2e/`, `playwright.config.*` |
| **Mobile** | Capacitor | `android/`, `capacitor.config.json` |

## What stays out of Git

See root `.gitignore`: `node_modules/`, `dist/`, `.env*`, Playwright artifacts, logs, coverage, editor noise. **Never commit** secrets or local `.env` files.

## Dev vs production

- **Dev:** `npm run dev:api` (port 3000) + `npm run dev` (Vite 5173). Vite proxies `/api` and `/v1` to the API so the same `fetch("/v1/...")` calls work as in production.
- **Production-style:** `npm run build && npm start` — one process serves API and built SPA from `dist/`.

## Optional future split

If you later move to `/frontend` and `/backend`, update **in lockstep**: `package.json` scripts, Vite `root`/`build.outDir`, Capacitor `webDir`, CI, and any path assumptions in `server.js` for static files.
