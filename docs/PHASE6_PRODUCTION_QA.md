# PHASE 6B — Production QA Checklist

Realtime scalability, mobile-native UX polish, and production performance hardening.

**Branch:** `cursor/phase6-realtime-performance-hardening-fd0f`  
**Production URLs:**
- Frontend: https://ccweb-project-b4jq.vercel.app
- API: https://ccweb-api-production-a92c.up.railway.app

---

## Pre-deploy verification (local)

Run on the feature branch before merge:

```bash
npm run verify:imports
npm test
npm run build
```

---

## 1. Realtime infrastructure

| Check | Steps | Pass |
|-------|-------|------|
| Single socket per tab | DevTools → Network → WS; one `/socket.io` connection while browsing Community + Chat + Notifications | ☐ |
| No duplicate cross-tab events | Open two tabs; mark notification read in tab A; badge updates in tab B without double-fetch storms | ☐ |
| Reconnect after offline | Airplane mode 10s → restore; chat banner shows reconnecting then clears | ☐ |
| Reconnect failed recovery | (Optional) block socket.io 25+ times; failed banner + Retry button appears | ☐ |
| Logout disconnects socket | Sign out; no authenticated socket reconnect attempts until login | ☐ |
| Foreground recovery | Background app 30s → foreground; socket reconnects if dropped | ☐ |
| Community realtime | Post from another account/session; feed refreshes (debounced, no duplicates) | ☐ |
| Chat join on reconnect | Active chat reloads messages after reconnect | ☐ |

---

## 2. Mobile-native UX (Android Chrome)

| Check | Steps | Pass |
|-------|-------|------|
| Community compose keyboard | Focus compose fields; sticky bar stays above keyboard | ☐ |
| Chat composer keyboard | Same on `/messages` thread view | ☐ |
| AI tutor keyboard | Focus tutor textarea; composer not hidden | ☐ |
| Tap feedback | Buttons show subtle tap highlight | ☐ |
| Momentum scroll | Feed and chat lists scroll smoothly | ☐ |
| Safe area | Bottom nav + compose respect notch/home indicator | ☐ |
| Bottom sheets | Profile edit / more menu open/close without layout jump | ☐ |

---

## 3. Feed & performance

| Check | Steps | Pass |
|-------|-------|------|
| Progressive feed render | Community feed loads 12 posts first; sentinel loads more | ☐ |
| Community API limit | `GET /api/community/posts?limit=80` returns bounded list | ☐ |
| Route code splitting | Network tab shows separate chunks for `/community`, `/messages`, `/profile` | ☐ |
| Profile store renders | Profile page does not flash multiple skeleton passes on hydrate | ☐ |

---

## 4. Media uploads

| Check | Steps | Pass |
|-------|-------|------|
| Size pre-check | Select >12MB image; friendly error before upload starts | ☐ |
| Profile avatar/banner | Upload succeeds; retry on failure | ☐ |
| Chat image cancel | Start upload → Cancel; progress clears | ☐ |
| Broken image fallback | Invalid image URL shows placeholder, no layout break | ☐ |

---

## 5. Notifications & messaging

| Check | Steps | Pass |
|-------|-------|------|
| Badge sync cross-tab | Unread count matches between tabs after read | ☐ |
| Bell preview on open | Bell socket tick updates count; preview loads when dropdown opens | ☐ |
| Optimistic chat send | Pending → sent; failed shows Retry | ☐ |
| Notification prefs cross-tab | Change prefs in tab A; tab B reflects after save | ☐ |

---

## 6. Creator & monetization

| Check | Steps | Pass |
|-------|-------|------|
| Creator stats card | Profile shows real post count + followers (from API) | ☐ |
| Premium tier visible | Paid tier shown on own profile when entitled | ☐ |
| Flutterwave unlock | Successful payment → profile/tier refreshes without full reload | ☐ |

---

## 7. AI surfaces

| Check | Steps | Pass |
|-------|-------|------|
| AI tutor errors | Failed stream shows error panel; empty assistant bubble removed | ☐ |
| Early signals retry | Force API error; Retry reloads dashboard | ☐ |
| AI agents retry | `/ai-agents` error shows retry panel | ☐ |

---

## 8. Diagnostics

Enable client diag: `VITE_CCWEB_CLIENT_DIAG=1` at build time.

| Check | Steps | Pass |
|-------|-------|------|
| Structured client logs | Console shows `[ccweb-client]` JSON on realtime state changes | ☐ |
| Heartbeat logs | After 60s connected, heartbeat log with subscriber counts | ☐ |

---

## Remaining production risks (honest)

1. **Community feed scale** — Progressive DOM reveal helps, but full `@tanstack/react-virtual` windowing is not yet integrated; very large feeds (>200 posts) may still stress low-end devices.
2. **Global `community:update` broadcast** — All connected clients receive community events; consider scoped rooms at high concurrency.
3. **Multi-tab sockets** — Each tab maintains its own Socket.IO connection (by design); server connection count scales with tabs × users.
4. **Local disk uploads** — Without Cloudinary, Railway multi-instance uploads are not shared across nodes.
5. **AI timeout UX** — Long tutor streams lack explicit client-side timeout banner (server may still complete).
6. **App.jsx inline pages** — Marketing/build inline routes remain in main bundle; further splitting would reduce initial load.
7. **Native push** — Browser push interest only; no FCM/APNs delivery yet.
8. **Reaction N+1** — Community cards may fetch reactions per post when expanded; batch API would help at scale.

---

## Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| Engineering | | | |
| Mobile QA (Android Chrome) | | | |
| Production deploy | | | |
