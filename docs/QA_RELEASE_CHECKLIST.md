# CCWEB release QA checklist

Use this before tagging a production release or promoting Render/Vercel deployments. Adjust URLs and secrets for your environment.

**See also:** [POST_MERGE_VERIFICATION.md](./POST_MERGE_VERIFICATION.md) (after deploy), [DEPLOYMENT_RENDER_VERCEL.md](./DEPLOYMENT_RENDER_VERCEL.md) (Render + Vercel env).

## Environment and deploy

- [ ] **Render API**: `NODE_VERSION` / Node 20.x, `PORT` bound correctly, `AUTH_JWT_SECRET` (32+ chars), `DATABASE_URL` when Postgres is required.
- [ ] **CORS**: `CCWEB_ALLOWED_ORIGINS` includes the Vercel app origin and `PUBLIC_APP_URL` matches the canonical frontend URL.
- [ ] **Vercel**: `VITE_API_BASE_URL` points at the live API (no `localhost`).
- [ ] **Migrations**: `npm run migrate` (or server boot migrations) completes without SQL errors; `ccweb_notifications` actor/group columns present if using notification grouping.
- [ ] **Health**: `GET /` with `Accept: application/json` returns `{ "status": "ok" }` (or documented health shape); `GET /health` if exposed.

## Auth

- [ ] Register → login → `GET /api/auth/me` (or v1 profile) returns consistent user + display name.
- [ ] Logout clears session client-side and refresh cookie where applicable.
- [ ] Protected routes (`/profile`, `/messages`, learn admin) redirect or gate when unauthenticated.
- [ ] Optional: 2FA setup flow (`/api/auth/2fa/setup`) completes; backup codes shown once.

## Community (JWT-backed)

- [ ] Feed loads (`GET /api/community/posts`); trending tab if used.
- [ ] **Post** with Bearer token succeeds; author is server-derived (no spoofed `authorUserId` in body).
- [ ] **Comment** and **reaction** (like/repost) succeed with token; duplicate reactions handled gracefully.
- [ ] **Channel chat** send with token; messages appear after refresh.
- [ ] `@mentions` in post/comment create notifications for mentioned users when DB + notifications are enabled.

## Chat (DM)

- [ ] Conversation list loads; open thread loads messages.
- [ ] Send text message: optimistic UI optional; on failure message restores and error is visible (banner + toast).
- [ ] Image upload path works when Cloudinary/uploads are configured.
- [ ] Socket reconnect after token refresh does not duplicate rooms (smoke).

## Notifications

- [ ] `GET /api/v1/notifications/summary` returns unread count when authenticated + DB.
- [ ] Full center `/notifications`: list, grouped toggle, mark one read, mark all read, load more cursor.
- [ ] Realtime: `notifications:update` fires after like/chat/learn events when Socket.IO is connected.

## Profiles

- [ ] Profile save (display name, preferences) persists; session/context updates.
- [ ] Avatar/banner upload paths return URLs and render (Cloudinary configured).

## Learn / Build / Find / Earn

- [ ] **Learn**: `/learn` tabs; course catalog loads; empty catalog shows helpful state when DB empty.
- [ ] **Courses**: detail + lesson pages; mark complete triggers learn notification when wired.
- [ ] **Build**: hub links resolve (`/dapp-builder`, `/ai-agents`, onboarding).
- [ ] **Find**: lazy-loaded page opens; scanner/trending tabs do not white-screen on API errors.
- [ ] **Earn**: signed-in analytics + leaderboards; refresh surfaces errors via inline state + toast when API fails.

## Frontend UX

- [ ] **Toasts**: success/error paths fire for community post, profile save, chat send failure (smoke).
- [ ] **Error boundary**: intentional throw in dev route recovers with reload CTA (optional manual test).
- [ ] **Mobile**: bottom nav + notification bell; safe-area padding on toasts.
- [ ] **Theme**: light/dark toggle persists `ccweb-theme` in `localStorage`.

## Capacitor (store readiness)

- [ ] `npm run build` produces `dist/`; `npx cap sync` runs without errors.
- [ ] **Android**: package name matches `appId` in `capacitor.config.json`; signing config prepared (not committed).
- [ ] **iOS**: bundle identifier matches; push capability planned separately (APNs not required for webview-only MVP).
- [ ] Privacy manifest / data safety forms drafted from actual APIs (auth, analytics, uploads).

## Automated checks (CI / local)

- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm run verify:imports` (if configured)
- [ ] Playwright smoke against staging URL when available

## Post-merge verification (notifications branch)

- [ ] Merge notifications + community JWT work together on `main` (or release branch); smoke all sections above on staging before production.

---

**Owners**: record tester, date, environment URLs, and any blockers in the release ticket.
