# CCWEB changelog

All notable changes to this repository are documented here. This project is a **prototype**; breaking changes may occur until a 1.0 production freeze.

## [1.1.0] — 2026-05-03

### Added

- **Auth API (prototype):** `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, password reset request/reset endpoints. Sessions use Bearer tokens; credentials hashed with **scrypt** (in-memory store — not production-grade).
- **Frontend auth:** Wired login and signup to the API; session in `sessionStorage`; navbar shows user / logout; **Profile** page for display name and push toggle; **Forgot password** prototype flow.
- **Dashboard:** Pillar quick links; gated when not signed in.
- **Legal placeholders:** `/privacy` and `/terms` draft pages (replace before store submission).
- **Capacitor:** `capacitor.config.json` and `mobile:sync` script for wrapping the Vite `dist/` build.
- **Tests:** Vitest smoke test for `authService`.
- **Documentation:** `docs/ARCHITECTURE.md`, `docs/STORE_RELEASE.md`, `docs/DEMO_VIDEO_SCRIPT.md`, `docs/CODE_INVENTORY.md`.

### Changed

- **Notifications API:** When a Bearer session is present, `userId` can be omitted; cross-user access is blocked when session user does not match `userId`.
- **User profile:** `buildUserProfile` / `sanitizeUser` now support optional `email` field.

### Fixed

- README development instructions (port and dual-process setup).

### Security notes

- Replace in-memory sessions and passwords with a managed identity provider (Auth0, Clerk, Cognito, Firebase Auth) and HTTPS-only cookies before public app store release.

## [1.0.0] — prior work (summary)

- FIND pillar: crypto scanner, Early Signals dashboard (Tailwind), token detail page, Express-mounted intelligence APIs, optional MongoDB for tracked wallets/tokens, optional Etherscan enrichment.
- BUILD / EARN: DApp builder, AI agents UI, streaming and community APIs (see `server.js` and earlier commits).
