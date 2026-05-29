# CCWEB Final Production QA & Launch Readiness

Final production audit and PWA hardening pass for public launch and scalable mobile deployment.

**Branch:** `cursor/final-production-audit-pwa-fd0f`  
**Production URLs:**
- Frontend: https://ccweb-project-b4jq.vercel.app
- API: https://ccweb-api-production-a92c.up.railway.app

---

## Production-readiness assessment (honest)

| Area | Status | Notes |
|------|--------|-------|
| Auth & session | **Ready** | JWT + refresh, PostgreSQL profiles, mobile shell hydration |
| Realtime | **Ready** | Single socket/tab, reconnect recovery, cross-tab notification sync |
| Monetization | **Ready** | Flutterwave server verify; no client-side unlock |
| Media | **Ready** | Cloudinary + local fallback; upload retry/cancel |
| Mobile UX | **Ready** | Safe-area, keyboard inset, bottom dock, touch targets |
| Performance | **Ready** | Route splitting, vendor chunks, progressive feed |
| PWA | **Beta-ready** | Manifest + SW + install prompt; offline shell only (API requires network) |
| Analytics | **Ready** | First-party events via `/api/v1/beta/event` (PostgreSQL) |
| SEO/social | **Partial** | Static + per-route meta; no SSR/prerender for public profiles |
| Native apps | **Capacitor scaffold** | `webDir: dist` — store release is separate workflow |

**Overall:** Suitable for **public beta launch** on web (Vercel + Railway). Not yet a full native app store release without additional Capacitor QA and push notification backend.

---

## Pre-merge verification

```bash
node scripts/generate-pwa-icons.mjs
npm run verify:imports
npm test
npm run build
```

---

## 1. PWA / installability

| Check | Steps | Pass |
|-------|-------|------|
| Manifest served | `GET /manifest.webmanifest` → 200, valid JSON | ☐ |
| Icons 192/512 | Lighthouse PWA or Chrome DevTools → Application → Manifest | ☐ |
| Service worker | DevTools → Application → Service workers → `/ccweb-sw.js` active | ☐ |
| Install prompt | Android Chrome → menu or banner “Install CCWEB” | ☐ |
| Standalone display | Installed app opens without browser URL bar | ☐ |
| Offline shell | Airplane mode → navigate → offline page or cached shell | ☐ |
| Shortcuts | Long-press installed icon → Community / Messages / Learn | ☐ |

---

## 2. Monitoring & observability

| Check | Steps | Pass |
|-------|-------|------|
| API health | `GET /api/health` includes `version`, `uptimeSec`, `postgres`, `buildId` | ☐ |
| Client errors | Trigger boundary error → event in `ccweb_beta_events` (`client_error`) | ☐ |
| Route analytics | Navigate routes → `route_view` events persisted | ☐ |
| Perf navigation | Page load → `perf_navigation` with `durationMs` | ☐ |
| PWA events | Install flow → `pwa_install_available` / `pwa_installed` | ☐ |
| Railway logs | Socket connect/disconnect structured logs visible | ☐ |

---

## 3. SEO & social metadata

| Check | Steps | Pass |
|-------|-------|------|
| Default OG tags | View source / share link → title + description | ☐ |
| Route titles | `/community`, `/messages` update `document.title` | ☐ |
| Public profile | `/u/:slug` → PageMeta “Profile” title | ☐ |
| Twitter card | Validator or link preview shows summary | ☐ |

---

## 4. Security

| Check | Steps | Pass |
|-------|-------|------|
| Vercel headers | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` | ☐ |
| API CORS | SPA origin only in production (`CCWEB_ALLOWED_ORIGINS`) | ☐ |
| Auth on uploads | Upload without token → 401 | ☐ |
| Rate limits | Auth/register endpoints rate-limited | ☐ |
| SW scope | SW does not cache `/api/*` or `/socket.io/*` | ☐ |

---

## 5. UX consistency

| Check | Steps | Pass |
|-------|-------|------|
| Offline banner | Toggle offline → top banner with Retry | ☐ |
| Error boundary | Recoverable crash UI with Reload + Try again | ☐ |
| ApiErrorPanel | AI / Early Signals errors show retry | ☐ |
| Toast consistency | Success/error toasts same viewport | ☐ |

---

## 6. Accessibility

| Check | Steps | Pass |
|-------|-------|------|
| Skip link | Tab on load → “Skip to main content” visible | ☐ |
| Focus visible | Keyboard tab → cyan focus ring on controls | ☐ |
| Touch targets | Primary actions ≥ 44px | ☐ |
| aria-label | Floating dock icons have labels | ☐ |
| Live regions | Offline banner `aria-live="polite"` | ☐ |

---

## 7. Deployment / runtime audit

| Check | Steps | Pass |
|-------|-------|------|
| Vercel build | `generate-pwa-icons` + verify + build in pipeline | ☐ |
| Railway migrate | Boot runs migrations; health `postgres: configured` | ☐ |
| Env vars | `PUBLIC_APP_URL`, `CCWEB_ALLOWED_ORIGINS`, `DATABASE_URL` set | ☐ |
| API base meta | SPA `ccweb-api-base-url` points to Railway | ☐ |
| Capacitor sync | `npm run mobile:sync` produces valid `dist/` | ☐ |

---

## 8. Offline / error recovery

| Check | Steps | Pass |
|-------|-------|------|
| `/offline.html` | Direct URL loads retry UI | ☐ |
| Chat reconnect | Offline → online → reconnect banner clears | ☐ |
| Session recovery | Slow auth → Retry session button | ☐ |
| Upload retry | Failed profile upload shows retry message | ☐ |

---

## 9. Production analytics (first-party)

Events stored in PostgreSQL `ccweb_beta_events` via `POST /api/v1/beta/event`:

| Event type | Purpose |
|------------|---------|
| `route_view` | Navigation |
| `client_error` | JS errors / boundary |
| `client_unhandledrejection` | Promise rejections |
| `perf_navigation` | Load timing |
| `pwa_install_*` | Install funnel |

No third-party mock analytics. Query via admin dashboard beta summary endpoint.

---

## 10. Android Chrome polish

| Check | Steps | Pass |
|-------|-------|------|
| Keyboard compose | Community + Chat + AI tutor composers above keyboard | ☐ |
| Install + standalone | Add to Home screen → full-screen shell | ☐ |
| theme-color | Status bar matches dark shell | ☐ |
| Pull refresh | No accidental full-page reload on overscroll | ☐ |
| Banner upload | Profile banner upload on Android Chrome | ☐ |

---

## Launch-readiness checklist

### Must pass before public launch

- [ ] All auth flows (signup, login, logout, refresh) on production
- [ ] Flutterwave payment verify on production with test transaction
- [ ] Realtime chat + notifications on two devices
- [ ] Profile upload (avatar + banner) on Android Chrome
- [ ] PWA install on Android Chrome
- [ ] `npm run verify:predeploy` green on `main`
- [ ] Railway migrations applied (012+)
- [ ] CORS + `PUBLIC_APP_URL` aligned with Vercel URL

### Should pass before marketing push

- [ ] Lighthouse Performance ≥ 70 on mobile
- [ ] Lighthouse PWA installable = yes
- [ ] Public profile `/u/:slug` share preview acceptable
- [ ] Error events monitored in beta analytics
- [ ] Load test community feed with 100+ posts

### Post-launch monitoring

- [ ] Daily check `/api/health` uptime + `postgres`
- [ ] Weekly review `ccweb_beta_events` error rates
- [ ] Railway log alerts for `migrate_failed`, `socket_connect_error`

---

## Remaining scalability risks

1. **No SSR/prerender** — Public profiles and marketing pages are client-rendered; crawlers see minimal content until JS runs.
2. **Service worker cache** — Static asset cache is versioned manually (`v2`); breaking changes require SW bump.
3. **Global community socket broadcast** — All clients receive community events; consider scoped rooms at high concurrency.
4. **Beta events table growth** — `ccweb_beta_events` unbounded; add retention/archival job for long-term scale.
5. **Single-region Railway** — No multi-region failover; plan RTO/RPO for database.
6. **Capacitor native push** — Browser push interest only; FCM/APNs not wired.
7. **CSP not enforced** — Security headers omit strict Content-Security-Policy to avoid breaking Vite chunks and Cloudinary; tighten incrementally.
8. **Feed virtualization** — Progressive slice only; very large feeds may stress low-end devices.

---

## Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| Engineering | | | |
| Mobile QA (Android Chrome) | | | |
| Security review | | | |
| Launch approval | | | |
