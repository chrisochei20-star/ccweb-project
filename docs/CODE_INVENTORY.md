# Code inventory — refined vs changed vs outdated

This is a **maintainer snapshot** of the current `main` branch. Use git history (`git log --oneline`) for line-level attribution.

## Refined (improved in place)

| Area | Notes |
|------|--------|
| FIND / intelligence | Modular `cryptoSafety.js`, `earlySignalsEngine.js`, `tokenDetail.js`, Express router `intelligenceExpress.js` |
| UI polish | Tailwind-based Early Signals + Token Detail; glass styling aligned with CCWEB palette |
| README / AGENTS | Corrected dev ports, documented intelligence and auth endpoints |

## Changed (revised from earlier behavior)

| Area | Notes |
|------|--------|
| `/api/find/scan` | Now returns full enriched scan payload (was thinner in early iterations) |
| Notifications | Optional `userId` when authenticated; 403 on cross-user access |
| User model | Optional `email` on profile objects |

## Outdated / do not rely on

| Item | Replacement |
|------|-------------|
| README references to `GET /api/streaming/curriculum` | Curriculum embedded in room creation (see AGENTS.md gotcha) |
| “Continue with Google” without OAuth | Disabled until real OAuth client IDs exist |
| In-memory auth sessions | Managed IdP + persistent user store for production |

## Merge policy (for contributors)

1. One feature per PR; rebase on `main` before merge.
2. Run `npm test` and `npm run build` locally.
3. Update `CHANGELOG.md` under **Unreleased** or the next version section.
