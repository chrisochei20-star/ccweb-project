# Post-merge verification checklist

Run this **after** `main` is deployed to **Render** (API) and **Vercel** (frontend), with production-like env vars. Check each box; note failures with URL, user step, and response status.

**Prereqs:** `VITE_API_BASE_URL` on Vercel points at Render; Render has `AUTH_JWT_SECRET`, `DATABASE_URL` (if using Postgres features), `CCWEB_ALLOWED_ORIGINS` + `PUBLIC_APP_URL` including the Vercel origin.

---

## Auth

- [ ] Register a new account (or use a test account); no “fetch failed” or CORS errors.
- [ ] Login returns access token; session persists across refresh (cookie or body per config).
- [ ] `GET /api/auth/me` (or app “account” UI) shows the same user after hard refresh.
- [ ] Logout clears session; protected routes redirect or show sign-in.
- [ ] Optional: forgot-password / verify-email pages load without console errors (behavior may be placeholder).

## Community

- [ ] Feed loads (`/community`); trending vs latest if both exist.
- [ ] **Authenticated** create post succeeds; post appears with **server-derived** author (not spoofed client id).
- [ ] Comment on a post succeeds when signed in.
- [ ] Like and repost (or reaction) succeed; duplicate reaction handled gracefully (no uncaught errors).
- [ ] Channel chat tab: send message with token; message visible after refresh.
- [ ] Unauthenticated actions show clear UI (sign-in) and/or 401 from API, not silent failure.
- [ ] Error paths show inline message **and/or** toast (stabilization UX).

## Notifications

- [ ] Notification **bell** shows in mobile header when logged in; unread badge updates after activity (may require DB + triggers).
- [ ] `/notifications` page loads; skeleton then list (or empty “caught up” state).
- [ ] **Mark one** and **mark all read** work without 401; list updates.
- [ ] `GET /api/v1/notifications/summary` (via Network tab) returns JSON when Bearer present.
- [ ] Socket **`notifications:update`** received after a triggering event (e.g. chat message to other user) when Socket.IO connected.

## Chat

- [ ] `/messages` loads conversation list when authenticated.
- [ ] Open a thread; messages load; send text → appears in thread.
- [ ] Failed send restores draft and shows error (banner/toast).
- [ ] Optional: image upload in chat when Cloudinary/uploads configured.
- [ ] Typing / presence smoke (no hard crash on reconnect).

## Learn

- [ ] `/learn` loads; tabs (e.g. live vs courses) switch without error.
- [ ] Course catalog (`/courses` or embedded catalog) loads or shows empty state with copy (not infinite spinner).
- [ ] Open a course detail and a lesson when data exists; mark complete if available (may emit learn notification when DB wired).

## Build

- [ ] `/build` hub links work: DApp builder, AI agents, developer onboarding (no 404 from in-app links).
- [ ] At least one “Build” path loads primary UI without white screen (lazy routes).

## Find

- [ ] `/find` (or crypto sub-routes) loads lazy chunk without error boundary.
- [ ] Scanner / trending / signals tabs: switching tabs does not blank the app; API errors show inline or empty state, not crash.

## Earn

- [ ] `/earn` signed-out: CTA to login visible.
- [ ] Signed-in: growth card / snapshot section loads or shows DB-disabled hint; **Refresh** does not white-screen.
- [ ] On intentional API failure, user sees error state and/or **toast** (stabilization).

## Mobile responsiveness

- [ ] **Narrow viewport** (375px): bottom nav usable; no horizontal scroll on main shells (dashboard, community, notifications, profile).
- [ ] **Notification dropdown** / sheet: dismissible overlay; “See all” navigates to `/notifications`.
- [ ] **Toasts** appear above safe area (not clipped by iOS home indicator).
- [ ] Touch targets on primary actions ≥ ~44px effective where possible.

## Capacitor readiness

- [ ] `npm run build` then `npx cap sync` completes without errors.
- [ ] **`webDir`** in `capacitor.config.json` is `dist` and matches Vite output.
- [ ] **Android** `appId` matches store listing intent; release signing not committed to repo.
- [ ] **iOS** bundle identifier matches Apple Developer app record.
- [ ] Document data collection for store privacy forms (auth, analytics, uploads, notifications) from actual endpoints in use.

---

## Sign-off

| Item | Tester | Date | Environment (URLs) |
|------|--------|------|--------------------|
| Completed | | | |

Related: **`docs/QA_RELEASE_CHECKLIST.md`** (pre-release), **`docs/DEPLOYMENT_RENDER_VERCEL.md`** (env deploy).
