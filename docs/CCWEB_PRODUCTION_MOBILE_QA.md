# CCWEB production & mobile QA checklist

Use this before tagging a release or after infrastructure changes (API URL, auth, DB, Redis, Cloudinary, Flutterwave, OpenAI). Test on **Android Chrome** and **iOS Safari** where possible. All paths assume the production SPA origin and a working API (`VITE_API_BASE_URL` or same-origin proxy).

## Environment & build

- [ ] `npm run verify:imports` passes.
- [ ] `npm test` passes.
- [ ] `npm run build` completes; no missing env vars at build time for required features.
- [ ] Production: `VITE_API_BASE_URL` is HTTPS and not the SPA origin (split deploy).
- [ ] `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` set **only** if Supabase auth is used; otherwise CCWEB JWT in `sessionStorage` is the Bearer source.
- [ ] `PUBLIC_APP_URL`, `CCWEB_ALLOWED_ORIGINS`, `AUTH_JWT_SECRET`, `DATABASE_URL` set per `productionGate` / deployment docs.

## Auth & session hydration

- [ ] Cold load with valid token: user appears without infinite “Session…” in header (8s slow-network hint may appear).
- [ ] `/login` → sign in → redirected; `sessionStorage` has access token; `/api/auth/me` succeeds (Bearer + JSON).
- [ ] `/signup` → account creation path works or shows actionable error.
- [ ] `/verify-email` with token query succeeds or shows clear failure.
- [ ] `/forgot-password` request + reset steps hit `/api/auth/password/*` without auto Bearer (still JSON).
- [ ] Protected routes `/profile`, `/messages`, `/learn/admin`, `/learn/admin/courses`: unauthenticated user is redirected to `/login` with return state.
- [ ] `ProtectedLayout` does not spin forever (8s timeout message if hydration stalls).
- [ ] Logout clears session and navigates to login.

## Core navigation (mobile-first shell)

- [ ] Bottom bar (viewport &lt; lg): **Home**, **Search**, **Alerts** (notifications), **Chats**, **You** — correct active state on `/`, `/find`, `/crypto-*`, `/early-signals`, `/token/:slug`, `/notifications`, `/messages`, `/profile`.
- [ ] **More** opens sheet; every link resolves; backdrop closes sheet; Escape closes; scroll locked while open.
- [ ] Desktop nav (≥ lg): same primary items + **More**; no duplicate broken links.
- [ ] Safe area: content not hidden under iOS home indicator; header clears notch (`viewport-fit=cover`).

## Home (`/`)

- [ ] “Community” feed CTA opens `/community`.
- [ ] Signed-in: analytics snapshot loads or shows Postgres / timeout error with retry.
- [ ] “Explore apps” horizontal scroll on narrow viewports; cards tappable (≥ 44px targets).
- [ ] Optional `POST /api/v1/growth/daily` does not break home if it fails.

## Search & intelligence (`/find` and related)

- [ ] Tab routes under crypto scanner load; scan uses `apiFetch` + Bearer.
- [ ] Timeouts and error strings appear instead of infinite spinners on slow API.

## Notifications

- [ ] `/notifications` loads list; grouped toggle works.
- [ ] Bell popover: summary + preview; “See all” goes to `/notifications`.
- [ ] Socket `notifications:update` triggers refresh when user logged in.

## Messages (chat)

- [ ] `/messages` loads conversations; 8s gate timeout messaging if stuck.
- [ ] Send text, optional image upload (`FormData` without forced JSON Content-Type).
- [ ] Socket connection uses Bearer from `getApiBearerToken()`.

## Profile & uploads

- [ ] Profile loads; banner/avatar upload uses `apiFetch` + multipart.
- [ ] Cloudinary (or fallback) returns URLs that render with `assetsUrl` / API base.

## Community (posting)

- [ ] Feed loads; 8s stall shows retry.
- [ ] Create post (auth): success or clear API error.
- [ ] Comments expand; reactions if enabled.

## Payments (Flutterwave)

- [ ] Growth / escrow flows: `VITE_FLUTTERWAVE_PUBLIC_KEY` and server `FLUTTERWAVE_*` configured.
- [ ] Prepare + verify endpoints return expected errors when misconfigured (no silent blank UI).

## Learn & courses

- [ ] `/learn` hub: rooms list, create room, navigation to session.
- [ ] `/courses` catalog and detail; lesson page; tutor stream receives chunks (Bearer on stream POST).

## AI systems

- [ ] Any feature calling OpenAI or platform agents degrades gracefully when keys missing (503 / message, not white screen).
- [ ] Rate limits or errors surface in UI.

## Realtime

- [ ] Chat + notifications sockets reconnect after backgrounding tab (manual smoke).

## Mobile rendering & responsiveness

- [ ] No horizontal overflow on 320px width on Home, Community, Chat, Notifications, Profile.
- [ ] Primary buttons and nav items meet `--ccweb-touch-min` (44px) where specified.
- [ ] `touch-action: manipulation` — no 300ms tap delay on key controls.
- [ ] Keyboard open (login / chat): primary actions remain reachable or scrollable.

## Regression spot-check (secondary routes from More)

- [ ] `/learn`, `/earn`, `/build`, `/community`, `/courses`, `/growth-hub`, `/marketplace`, `/developers`, `/dapp-builder`, `/ai-tutor`, `/about`, `/faq`.

## Sign-off

- [ ] Product owner sign-off on navigation labels and More menu list.
- [ ] Record test date, build id (`VITE_CCWEB_BUILD_ID` / git SHA), and tester.
