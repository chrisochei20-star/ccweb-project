# Phase 3 — production stabilization QA

This document tracks **what Phase 3 addressed** in branch `cursor/phase3-production-stabilization-fd0f` and **what still needs manual verification** on Railway + Vercel (split deploy) and Android Chrome.

## Implemented in this pass

### Auth / session UX

- **`MobileLayout`**: After hydration, if a **Bearer token exists but `user` is not ready yet**, the header shows **“Account…”** with a spinner instead of **Sign in / Join** (avoids false logged-out UI).
- **`Outlet` context**: Added **`refreshSession()`** — re-runs `fetchMe()` and completes hydration — used by **`ProtectedLayout`** (session check timeout + **Retry**), **`ProfileShellPage`**, and **`ChatPage`** timeouts.
- **`ProtectedLayout`**: On hydration timeout, users with a token get a **Retry session check** button.
- **False “Sign in” copy**: Tightened gating on **`CourseLessonPage`** (AI tutor block), **`LearningHubPage`** (wallet card), **`MobileDashboardPage`** (hero CTAs), **`EarnShellPage`**, **`GrowthHubPage`** (growth banner + campaign/lead errors), **`NotificationCenterPage`** (guest vs syncing vs signed-in).

### Notifications

- **Zustand store** `src/store/notificationsStore.js`: central **`unreadCount`**, **`socketGeneration`** (tick counter), **`applySummaryPayload`**, **`pullNotificationSummaryIntoStore()`**.
- **`NotificationBell`**: Reads unread from the store; **`notifications:update`** bumps generation and **refetches** summary + preview; initial load unchanged.
- **`NotificationCenterPage`**: After each **`load`**, **`markAllRead`**, and **`markOne`**, pulls summary into the store so the **badge stays in sync** without waiting for a socket event.
- **Logout**: **`MobileLayout`** calls **`useNotificationsStore.getState().reset()`** on log out.

### Chat (mobile)

- **`ChatPage`**: **`visualViewport`** listener adds **dynamic bottom padding** on the composer so the keyboard does not cover the input on mobile browsers.

### Shell / layout

- **`ccweb-shell.css`**: **`overflow-x: clip`** on **`.ccweb-app-root`** to reduce horizontal bleed on small screens.

### API / diagnostics

- **`src/lib/productionDiag.js`**: Gated **`logClientStructured`** when **`VITE_CCWEB_CLIENT_DIAG=1`** or **`VITE_CCWEB_API_DEBUG=1`**.
- **`apiFetch`**: Logs **`http_non_ok`** (path + status) through **`logClientStructured`** when diagnostics are enabled (in addition to existing console warnings when auth trace is on).

### Learning hub fix

- **`LearningHubPage`**: Added missing **`useMemo`** import (was referenced without import — build fix).

---

## Client env (optional)

| Variable | Purpose |
|----------|---------|
| `VITE_CCWEB_CLIENT_DIAG=1` | One-line JSON **`[ccweb-client]`** logs for non-2xx API responses (path + status). |
| `VITE_CCWEB_API_DEBUG=1` | Enables the same structured client logs (and existing fetch diagnostics). |
| `VITE_CCWEB_AUTH_TRACE=1` | Verbose auth trace (already documented elsewhere). |

---

## Manual QA checklist (remaining / not fully automated)

Check each on **desktop Chrome**, **Android Chrome**, and after a **hard refresh** (cache-bust) on Vercel.

### Auth

- [ ] Login → refresh → **`/profile`**, **`/messages`**, **`/notifications`**, **`/community`** still show the signed-in user (no flash of “Sign in”).
- [ ] **`ProtectedLayout`** routes with slow API: timeout UI and **Retry** restores session.
- [ ] Logout clears header, **notification badge store**, and protected routes redirect.

### Community (from prior merge + this pass)

- [ ] Post / comment / like / channel chat; second browser tab receives **feed updates** (`community:update`).
- [ ] Trending vs Latest: new post ordering matches server.

### Chat

- [ ] Only **one** Socket.IO tab (DevTools → WS); reconnect after **airplane mode** toggle.
- [ ] **Join/leave** when switching conversations; unread counts when not in active thread.
- [ ] **Keyboard** does not hide composer (Android).

### Notifications

- [ ] Bell count matches **summary** after mark-read on **Notifications** page.
- [ ] Realtime tick still refreshes when backend emits **`notifications:update`**.

### Profile / Cloudinary

- [ ] Avatar + banner upload, bio save, **`PUT /api/v1/users/update`** persistence after refresh.
- [ ] Followers/following if enabled in your deployment — confirm API + UI (not changed in this pass).

### AI / OpenAI

- [ ] **`/ai-tutor`**, course tutor, Find scanners: with **`OPENAI_API_KEY`** unset, confirm **graceful** messaging (mock/degraded paths per `AGENTS.md`).
- [ ] With key set: streaming works; rate limits show user-visible errors.

### Flutterwave / Growth hub

- [ ] **`VITE_FLUTTERWAVE_PUBLIC_KEY`** + server **`FLUTTERWAVE_SECRET_KEY`**: escrow **prepare → pay → verify**; order status transitions.
- [ ] Without keys: UI explains **503** / disabled checkout (no silent failure).

### API audit (ongoing)

- [ ] Grep frontend for **`apiUrl(`** / **`/api/`** paths and confirm each exists on **`server.js`** or **`/api/v1`** routers (remove dead calls as found).
- [ ] **`docs/API_V1.md`** vs actual routes after server changes.

### Production diagnostics

- [ ] Enable **`VITE_CCWEB_CLIENT_DIAG`** on a staging Vercel build; reproduce a 404/500 and confirm **`[ccweb-client]`** lines in the console (no PII in logs).

---

## Known limitations (not “fake”, but incomplete product scope)

- **Central notification store** does not yet cache full notification **lists** (only summary + socket generation); list pages still fetch their own data.
- **Phase 3** does not replace **server-side** structured logs — use **`LOG_LEVEL`** / **`pino`** on Railway.
- **Multi-instance Socket.IO** without Redis adapter is **not** solved here; scale-out requires infra follow-up.

When closing Phase 3, update this file with **dates**, **commit hashes**, and **sign-off** per environment (staging / production).
