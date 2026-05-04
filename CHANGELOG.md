# CCWEB changelog

All notable changes to this repository are documented here. This project is a **prototype**; breaking changes may occur until a 1.0 production freeze.

## [Unreleased]

### Security

- **Auth overhaul:** `auth/` module with **bcrypt** passwords, **JWT** access + rotating refresh (httpOnly cookie + optional `AUTH_REFRESH_IN_BODY`), **TOTP** 2FA with backup codes, **wallet** sign-in (EVM + Solana). **MongoDB** auth persistence when `MONGODB_URI` is set. Rate limits on login and wallet. See [docs/AUTH_API.md](./docs/AUTH_API.md).
- **Backend security architecture:** [docs/BACKEND_SECURITY_ARCHITECTURE.md](./docs/BACKEND_SECURITY_ARCHITECTURE.md) — gateway layers, service boundaries, scaling path, production checklist.
- **Express hardening:** `helmet` + **CORS allowlist** (`CCWEB_ALLOWED_ORIGINS`) on auth, developer, and intelligence Express apps via `security/expressHardDefaults.js`; optional `TRUST_PROXY=1`.

### Added

- **Growth Hub:** Global marketing agent workspace (organic-first content suggestions), marketplace, simulated escrow, lead scoring, CCWEB fee metrics. API `/api/growth/*`, UI `/growth-hub`. [docs/GROWTH_HUB.md](./docs/GROWTH_HUB.md).
- **App shell:** Bottom navigation (Learn / Find / Build / Earn / Community / Profile), compact top nav, pillar **hub** routes (`/learn`, `/build`), Find **Hub** tab, first-time **welcome** flow after signup/login, and [docs/EARLY_USERS.md](./docs/EARLY_USERS.md) (staging, telemetry, admin).
- **Telemetry (prototype):** in-memory `telemetryHub.js` with `POST /api/telemetry/event`, `POST /api/telemetry/client-error`, and admin `GET /api/admin/telemetry/summary` when `CCWEB_ADMIN_KEY` is set.
- **Community testing:** bug report API `POST /api/community/bugs`, admin list `GET /api/admin/community/bugs`, and Community UI for chat, posts, and bug reports.
- **Frontend integration:** Axios client (`src/lib/api.js`) with 401 refresh retry, Zustand auth store, `/login/2fa` and `/setup-2fa` UIs, MetaMask + WalletConnect on Profile, marketplace routes (`/marketplace`, `/marketplace/:id`), dashboard wired to live DApp / agents / growth / streaming APIs, lazy-loaded heavy pages. See [docs/FRONTEND_INTEGRATION.md](./docs/FRONTEND_INTEGRATION.md).
- **Community comments API:** `GET/POST /api/community/posts/:postId/comments`, `GET /api/community/posts/:postId` with post list `commentCount`.

### Fixed

- **Growth hub:** `overview.openOrders` count now filters by explicit order statuses (avoid invalid `startsWith` on non-string).

### Changed

- Registration no longer auto-issues tokens; client registers then logs in.
- Frontend login uses JWT access token + optional refresh in sessionStorage when `AUTH_REFRESH_IN_BODY=1`.
- Home pillar cards and dashboard quick links route through `/learn` and `/build` hubs.

### Removed

- Legacy `authService.js` (scrypt + opaque sessions).

## [1.1.0] — 2026-05-03

### Added

- **Auth API:** JWT access + refresh, bcrypt passwords, TOTP 2FA, wallet connect, email verification token; see `docs/AUTH_API.md`. MongoDB-backed auth users when `MONGODB_URI` is set.
- **Frontend auth:** Wired login and signup to the API; session in `sessionStorage`; navbar shows user / logout; **Profile** page for display name and push toggle; **Forgot password** prototype flow.
- **Dashboard:** Pillar quick links; gated when not signed in.
- **Legal placeholders:** `/privacy` and `/terms` draft pages (replace before store submission).
- **Capacitor:** `capacitor.config.json` and `mobile:sync` script for wrapping the Vite `dist/` build.
- **Tests:** Vitest for `auth/authEngine` (bcrypt, JWT, wallet verify).
- **Documentation:** `docs/ARCHITECTURE.md`, `docs/STORE_RELEASE.md`, `docs/DEMO_VIDEO_SCRIPT.md`, `docs/CODE_INVENTORY.md`.

### Changed

- **Notifications API:** When a Bearer session is present, `userId` can be omitted; cross-user access is blocked when session user does not match `userId`.
- **User profile:** `buildUserProfile` / `sanitizeUser` now support optional `email` field.

### Fixed

- README development instructions (port and dual-process setup).

### Security notes

- **Security:** Set `AUTH_JWT_SECRET` (32+ chars) and HTTPS in production; configure SMTP for email verification links.

## [1.0.0] — prior work (summary)

- FIND pillar: crypto scanner, Early Signals dashboard (Tailwind), token detail page, Express-mounted intelligence APIs, optional MongoDB for tracked wallets/tokens, optional Etherscan enrichment.
- BUILD / EARN: DApp builder, AI agents UI, streaming and community APIs (see `server.js` and earlier commits).
