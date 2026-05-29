# CCWEB — production QA report (template)

Fill this after running **`npm run test:e2e:production`** (or `CI=1 npx playwright test e2e/production-smoke.spec.js`) and manual checks from [QA_PRODUCTION_CHECKLIST.md](./QA_PRODUCTION_CHECKLIST.md).

| Field | Value |
|-------|--------|
| Date | |
| Tester | |
| Frontend URL | |
| API URL | |
| DB provider | |

## Automated results

| Suite | Pass / Fail | Notes |
|-------|----------------|-------|
| Vitest (`npm test`) | | |
| Playwright smoke | | |

## Bugs found (this cycle — repo)

| ID | Severity | Description | Status |
|----|-----------|-------------|--------|
| P1 | **High** | `/api/v1/*` routes returned 404: platform router was mounted at `/` while the HTTP layer stripped the `/api/v1` prefix. Fixed by mounting at **`/api/v1`** and passing full `req.url` to Express. | Fixed |
| P2 | **High** | `handleCreateBugReport` sent **two** JSON responses (201 then 200 for blogs), breaking clients. Removed erroneous second `sendJson`. | Fixed |
| P3 | **Blocker** | Missing **`telemetryHub.js`** caused `node server.js` to crash on require. Added minimal stub module. | Fixed |
| P4 | **Test** | Playwright reused port **3000** and hit wrong/stale server. E2E now uses **`PORT=3055`** + Vite `VITE_DEV_API_PROXY_TARGET` to match. | Fixed |

## Security checks

- [ ] JWT invalid token → 401 on `/api/v1/users/me`
- [ ] CORS only allowed origins
- [ ] No secrets in browser bundle (inspect build)

## Performance (sample)

| Page | LCP / notes |
|------|-------------|
| `/` | |
| `/find` | |

## Sign-off

- [ ] No P0/P1 open
- [ ] Ready for wider beta: **Yes / No**
