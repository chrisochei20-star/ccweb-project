# Phase 4D — AI, OpenAI, Scanner & Intelligence QA

Production stabilization pass for CCWEB AI surfaces (Railway API + Vercel SPA). Focus: real reliability, graceful degradation, no fake production AI behavior.

## Scope covered

| Area | Changes |
|------|---------|
| OpenAI core (`services/aiExecute.js`) | Shared `fetchOpenAI` with 60s timeout, retry on 429/502/503/504, abort propagation, structured pino logs, `max_tokens` cap |
| Tutor API (`coursesExpress.js`) | Fixed missing `tutorPrompt` import; client-disconnect abort; skip post-stream DB when disconnected; `X-CCWEB-AI-Provider` headers |
| Tutor client (`coursesApi.js`, pages) | 120s stream timeout, duplicate-stream guard, AbortController, empty-response handling, AI unavailable panel |
| Scanner (`FindPage.jsx`) | Per-tab error/retry/empty states, NaN-safe probability formatting, honest heuristic labeling |
| Intelligence (`EarlySignalsDashboard.jsx`) | Debounced SSE reload (3s), empty feed/narrative/alert states |
| Shared UX | `AiLoadingState`, `AiUnavailablePanel`, `AiSurfaceErrorBoundary`, `aiDiagnostics.js` |
| Routes | AI/scanner/intelligence routes wrapped in `AiSurfaceErrorBoundary` |

## Pre-deploy verification

```bash
npm run verify:imports
npm test
npm run build
```

## Manual QA checklist (Android Chrome + desktop)

### AI Tutor (`/ai-tutor`)

- [ ] Sign in; open tutor; send a message — streaming deltas appear (or mock banner if no `OPENAI_API_KEY`)
- [ ] Send twice quickly — only one stream active; no duplicate assistant bubbles
- [ ] Switch mode while idle — no crash; prior stream aborted if in flight
- [ ] Navigate away mid-stream — no console errors; page unloads cleanly
- [ ] With `CCWEB_REQUIRE_OPENAI=1` and no key — 503 unavailable panel, not blank chat
- [ ] Android Chrome: keyboard opens — composer stays visible (`useKeyboardInset`)
- [ ] Refresh page — conversation list and active thread reload from API

### Lesson tutor (`/courses/:slug/lesson/:id`)

- [ ] Signed-in user sees saved thread for lesson scope
- [ ] Failed stream removes empty assistant bubble (no blank message)
- [ ] Error panel shows retry/dismiss; unavailable state when API returns 503

### FIND / Scanner (`/find`, `/crypto-scanner`)

- [ ] Token scan: valid symbol/address returns modules; invalid shows message (not infinite spinner)
- [ ] Scan timeout (~15s) shows user-facing message
- [ ] Signals / trending / wallets / alerts tabs: loading → data OR empty OR error with Retry
- [ ] Wallet scan: null `scamLinkedProbability` shows `—` not `NaN%`
- [ ] Insight card labeled **Heuristic insight layer** (not live LLM)

### Early Signals (`/early-signals`)

- [ ] Dashboard loads or shows `ApiErrorPanel` with Retry
- [ ] Empty feed shows no-data copy (does not crash)
- [ ] SSE snapshot events do not hammer API (debounced ~3s)
- [ ] Manual Refresh works

### Developer / platform AI (smoke)

- [ ] `POST /api/v1/platform/agents/:id/run` (auth) returns JSON or structured error when OpenAI down
- [ ] No unauthenticated OpenAI proxy endpoints exposed

## Environment variables

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` / `CCWEB_OPENAI_API_KEY` | Live OpenAI |
| `CCWEB_REQUIRE_OPENAI=1` | Fail with 503 instead of mock in production |
| `CCWEB_OPENAI_TIMEOUT_MS` | Override default 60s OpenAI timeout |
| `CCWEB_OPENAI_MAX_RETRIES` | Override default 2 retries |
| `CCWEB_OPENAI_MAX_TOKENS_CAP` | Hard cap on `max_tokens` (default 4096) |
| `VITE_CCWEB_CLIENT_DIAG=1` | Client AI/scanner structured console logs |

## Honest remaining AI scalability risks

1. **OpenAI rate limits & cost** — Retries help transient 429s but sustained traffic needs queueing, per-user quotas, and usage metering not yet implemented.
2. **Streaming through Railway/Vercel proxies** — Long tutor streams may still be cut by intermediary timeouts; consider chunked heartbeats or switching to SSE/WebSocket for tutor if users report truncation.
3. **No centralized AI request deduplication on server** — Client guards duplicate tutor sends; parallel tabs or API clients can still double-spend tokens.
4. **Learner memory extraction** — Extra OpenAI call per tutor turn doubles cost/latency; failures are silent (empty facts) by design.
5. **Scanner/heuristic data quality** — FIND modules use live API + heuristics where configured; without explorer/indexer keys, partial or empty modules are expected — not LLM hallucinations.
6. **Intelligence SSE + full dashboard refetch** — Debounced reload reduces load but still refetches entire payload; large feeds need pagination and delta patches.
7. **Mock mode in staging** — Without `CCWEB_REQUIRE_OPENAI=1`, missing keys return deterministic mock text — ensure production Railway env sets the key and optionally `CCWEB_REQUIRE_OPENAI=1`.
8. **No persistent AI outage circuit breaker** — Repeated OpenAI failures still attempt full timeout per request; a shared circuit breaker would improve UX under outages.
9. **Zustand AI stores** — No dedicated global AI store yet; tutor state is component-local (good for leaks) but cross-route continuity relies on PostgreSQL threads.
10. **E2E coverage** — Vitest covers helpers/mock mode; Playwright does not yet assert live OpenAI streaming in CI (would require secrets and flaky external dependency).

## Production URLs

- Frontend: https://ccweb-project-b4jq.vercel.app
- API: https://ccweb-api-production-a92c.up.railway.app

After deploy, confirm tutor stream headers: `X-CCWEB-AI-Provider`, `X-CCWEB-Conversation-Id`.
