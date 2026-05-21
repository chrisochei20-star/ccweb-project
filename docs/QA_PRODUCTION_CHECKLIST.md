# CCWEB — production QA checklist

**Extended manual matrix:** [CCWEB_PRODUCTION_TESTING_CHECKLIST.md](./CCWEB_PRODUCTION_TESTING_CHECKLIST.md) (auth, profile, community, chat, academy, Web3, payments, mobile, errors).

Run this **after** you have live `PLAYWRIGHT_BASE_URL` (frontend) and `E2E_API_BASE_URL` (API). Automated smoke: `npm run test:e2e:production` (see `e2e/production-smoke.spec.js`).

## Automated (Playwright)

```bash
PLAYWRIGHT_BASE_URL=https://your-app.example.com \
E2E_API_BASE_URL=https://your-api.example.com \
PRODUCTION_E2E=1 \
npm run test:e2e:production
```

Local CI-style (starts API on **3055** + Vite automatically):

```bash
CI=1 npx playwright test e2e/production-smoke.spec.js --project=chromium
```

Optional full auth path (creates user if registration succeeds):

```bash
E2E_TEST_EMAIL=e2e+$(date +%s)@yourdomain.com \
E2E_TEST_PASSWORD='YourLongPassword1!' \
... npm run test:e2e:production
```

## Manual — Auth

- [ ] Signup (email) → lands on home, session visible
- [ ] Refresh → still logged in (`AUTH_REFRESH_IN_BODY` + cookie as configured)
- [ ] Logout → cannot call protected APIs from UI
- [ ] Login wrong password → error, no token
- [ ] Google / wallet (if enabled)

## Manual — Core tabs

- [ ] **Learn** — rooms list / session page loads; SSE if used
- [ ] **Find** — scan / signals (may require API keys on backend)
- [ ] **Build** — developer console / agents page loads
- [ ] **Earn** — dashboard loads (growth may need Postgres)
- [ ] **Community** — posts / chat
- [ ] **Profile** — save display name / beta slug

## Manual — Security

- [ ] Open `/api/v1/users/me` without token → 401
- [ ] CORS: only `CCWEB_ALLOWED_ORIGINS` can call API with credentials from browser
- [ ] Rate limit: repeated failed logins → 429 / lockout (see auth engine)

## Manual — Stripe

- [ ] Test mode checkout completes; webhook received (Stripe Dashboard → events)
- [ ] Idempotent webhook (no duplicate ledger rows)

## Mobile (BrowserStack / real devices)

- [ ] Same smoke as desktop on iOS Safari + Android Chrome
- [ ] Viewport: bottom nav usable; no horizontal overflow on key flows

## Performance (quick)

- [ ] Lighthouse (mobile) on `/` and `/find` — note LCP, TTI
- [ ] API: `/health` & critical GETs &lt; 2s cold (adjust for region)

## Sign-off

Record date, tester, environment URLs, and **blockers** before public launch.
