# Phase 5 — API Audit, Performance & Scalability QA

Production hardening pass for CCWEB (Railway API + Vercel SPA). Focus: real scalability, maintainability, and efficiency — no placeholder optimizations.

## Scope covered

### 1. API audit & cleanup
| Change | Detail |
|--------|--------|
| Developer API key header fix | Frontend now sends `CCWEB-API-Key`; backend also accepts `ccweb_api_key` legacy variant |
| Shared `parseApiResponse` / `apiFetchJson` | Standardized JSON error shape (`error`, `code`, `status`) |
| `notificationsApi.js` refactor | Uses shared parser; removed duplicate dead `followUser` export |
| Removed dead `src/api/platformApi.js` | Unused module (endpoints exist on backend but had no callers) |
| Wired `apiJson.js` | Now delegates to `parseApiResponse` (was orphaned) |
| Payment history fix | `/api/v1/payments/history` uses single `listOrdersForParticipant` query instead of double full-table scan |

### 2. Database & backend optimization
| Change | Detail |
|--------|--------|
| Migration `013_performance_indexes.sql` | Indexes on `platform_transactions`, `growth_orders`, `community_posts` |
| Chat N+1 fix | `displayNamesByUserIds()` batch lookup in `persistenceChat.js` for messages + inbox |
| Learning payment idempotency | `activateAccessByCheckoutSession` only activates `pending_payment` rows |
| Flutterwave webhook rate-limit exempt | `isRateLimitExemptPath()` skips IP bucket for webhook retries |

### 3. Frontend performance
| Change | Detail |
|--------|--------|
| `useCachedFetch` in-flight dedup | Parallel mounts share one network request per URL |
| NotificationCenter `useShallow` | Fewer rerenders on multi-field Zustand selectors |
| Cloudinary delivery transforms | `optimizeCloudinaryUrl()` on profile avatar (`f_auto`, `q_auto`, width cap) |
| Lazy loading attrs | Profile avatar `loading="lazy"` + `decoding="async"` |

### 4. Realtime scalability
| Change | Detail |
|--------|--------|
| Chat membership cache per socket | Avoids repeated `verifyMember` DB hits on typing |
| `closeChatSocket()` cleanup | Clears typing timer + in-memory presence/typing maps |
| Reduced noisy socket info logs | Routine broadcast/join logs removed from hot paths |

### 5. Infrastructure cleanup
| Change | Detail |
|--------|--------|
| Removed dead `sendJsonCors()` | Wildcard CORS helper was unused in `server.js` |

### 6. Observability
| Change | Detail |
|--------|--------|
| `getClientDiagnostics()` | Adds optional JS heap snapshot when `performance.memory` available (Chrome) |

## Pre-deploy verification

```bash
npm run verify:imports
npm test
npm run build
```

Apply migration on Railway:

```bash
npm run db:migrate
```

## Manual QA checklist

### API / auth
- [ ] Developer console: paste API key → **Test /v1/analytics** succeeds (was broken with wrong header)
- [ ] Notifications center loads; mark-read still works after `notificationsApi` refactor
- [ ] Payment history (`/api/v1/payments/history`) returns buyer + seller orders without timeout on PG

### Chat / realtime
- [ ] Open DM, send messages — display names still correct (batch lookup)
- [ ] Typing indicator works without extra lag after membership cache
- [ ] Disconnect/reconnect — no duplicate listeners or memory growth over 10+ min session

### Performance (Android Chrome)
- [ ] Profile page avatar loads smaller Cloudinary variant (Network tab: transform segment in URL)
- [ ] Dashboard pages using `useCachedFetch` — no duplicate parallel requests on mount (Network tab)
- [ ] Notification bell opens without jank when unread count updates

### Payments
- [ ] Flutterwave webhook delivery not blocked by 429 (check Railway logs after test payment)
- [ ] Re-verify same learning purchase does not double-activate access row

## Honest remaining scalability limitations

1. **Dual HTTP clients** — `apiFetch` and axios `http` still coexist; growth/learning pages use both. Full consolidation is a larger refactor.
2. **Legacy route duplication** — `/api/growth/*`, `/api/auth/*`, `/api/build/agents` parallel `/api/v1/*`; frontend still calls legacy paths in places.
3. **Dual community schemas** — `community_posts` vs `ccweb_posts` not merged; feeds may diverge.
4. **No Redis Socket.IO adapter** — Multi-instance Railway deploys have split presence/broadcast unless Redis adapter is added.
5. **Global community broadcast** — `broadcastCommunityUpdate` still fans out to all sockets; needs topic rooms at scale.
6. **In-memory developer/marketplace state** — Developer platform projects/keys not fully on Postgres.
7. **Flutterwave fulfillment races** — Idempotent capture index added, but full transactional fulfillment wrapper not yet implemented.
8. **No server-side request coalescing** — Dashboard/intelligence endpoints can still be hit in parallel from multiple tabs.
9. **Bundle size** — Main chunk still >500 kB; further route splitting (ChatPage inline API extraction) needed for major gains.
10. **ChatPage inline API** — Largest remaining duplicate fetch surface (~6 endpoints inline).

## Architectural bottlenecks requiring future redesign

| Bottleneck | Why redesign is needed |
|------------|------------------------|
| Monolithic `server.js` gateway | ~5k lines mixing legacy in-memory routes and Express delegation; hard to scale teams and enforce auth consistently |
| In-memory + Postgres dual-write patterns | Streaming rooms, applicants, legacy users create split-brain between deploy modes |
| Intelligence SSE + full dashboard refetch | Needs delta/event-sourced feed with pagination, not debounced full reload |
| OpenAI tutor streaming through HTTP | Long-lived streams through Railway/proxies need dedicated SSE/WebSocket channel |
| Growth hub triple surface | `/api/growth`, `/api/v1/marketplace`, in-memory `businessGrowthHub` — one commerce domain model required |
| Notification fan-out | Per-recipient insert loops in legacy paths; needs bulk insert + outbox pattern |
| Rate limiting | Three overlapping systems (raw HTTP, Express short, auth-specific) need unified policy engine |
| Media pipeline | Local `/uploads` + Cloudinary without signed transform policy at upload time |

## Production URLs

- Frontend: https://ccweb-project-b4jq.vercel.app
- API: https://ccweb-api-production-a92c.up.railway.app

Enable client diagnostics: `VITE_CCWEB_CLIENT_DIAG=1` on Vite build for structured console logs + heap snapshot via `getClientDiagnostics()`.
