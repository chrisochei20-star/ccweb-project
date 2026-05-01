# CCWEB — Unified Platform Architecture

Production-oriented blueprint for the CCWEB monorepo: **learn**, **earn**, **automate**, and **analyze** through modular services exposed under consistent `/api` prefixes.

## Vision

| Capability | Module path (code) | REST prefix |
|------------|-------------------|-------------|
| Live AI streaming + attendance + payouts | Legacy handlers in `server.js` | `/api/streaming/*` |
| AI Teaching Brain (tutor / co-host) | `lib/teachingBrain/` | `/api/v1/teaching-brain/*` |
| Engagement scoring & payout fairness | `lib/engagement/` | `/api/v1/engagement/*` |
| Crypto intelligence (scanner + signals) | `lib/cryptoIntelligence/` | `/api/v1/crypto/*` |
| Business Automation Hub (agents, billing, lead gen) | `lib/automation/` | `/api/automation/*` |
| Community (posts, chats, blogs) | Handlers in `server.js` | `/api/community/*`, `/api/blogs/*` |
| Platform discovery | `lib/platform/` | `/api/v1/platform/manifest` |

## Folder structure (salient)

```
server.js                 # HTTP server, legacy route tree, static `public/`
lib/
  ccweb/http.js           # Shared sendJson / readJsonBody
  platform/manifest.js    # PLATFORM_MANIFEST — modules metadata
  realtime/hub.js         # WebSocket `/ws` (ws library)
  teachingBrain/          # Session tutoring MVP
  engagement/               # Weighted engagement score + payout preview
  cryptoIntelligence/      # Token scanner MVP + signals list
  automation/             # Agent Operator, billing, lead gen (existing)
```

Frontend: `src/` — React + Tailwind v4; unified shell in `App.jsx`; pages under `src/pages/`.

## Realtime

- **WebSocket URL**: `ws://localhost:<PORT>/ws` (query: `roomId`, `userId`).
- Vite dev proxy: `/ws` → backend WebSocket (see `vite.config.js`).
- MVP relays JSON messages; production should use **Redis pub/sub** per room and auth.

## Example flows

### 1. User joins session → AI interacts → engagement → earnings

1. **Join**: `POST /api/streaming/rooms/:roomId/attendance` with `userId`, `watchMinutes`, `isOrganic`, etc.
2. **Realtime**: Browser connects to `ws://…/ws?roomId=…&userId=…` for chat/events.
3. **Teaching Brain**: `POST /api/v1/teaching-brain/answer` with `roomId`, `userId`, `question`, optional `curriculumTracks`.
4. **Engagement**: `POST /api/v1/engagement/score` with attendance-shaped payload (`watchMinutes`, `chatMessageCount`, `reactionCount`, `interactionScore`).
5. **Payout**: Existing streaming payout + distribute endpoints compute creator pool; engagement weights align with `lib/engagement/scoring.js` for previews (`POST /api/v1/engagement/payout-preview`).

### 2. Developer discovers APIs

`GET /api/v1/platform/manifest` returns module list, API prefixes, and rollout priorities.

### 3. Crypto scan

`POST /api/v1/crypto/scan` body: `{ "chain": "ethereum", "tokenAddress": "0x…", "symbol": "ABC" }`  
`GET /api/v1/crypto/scans/:id` — retrieve scan  
`GET /api/v1/crypto/signals` — narrative / smart-money style dashboard stub

## Scaling checklist

- Replace in-memory Maps in `server.js` and feature libs with **PostgreSQL** or **MongoDB**.
- Add **Redis** for sessions, WebSocket rooms, rate limits.
- Split route modules gradually: extract streaming/community into `lib/streaming/` without breaking URLs.
- Authenticate WebSockets (JWT query or upgrade handshake).

## UI theme

Glassmorphism preserved; **dark blue gradient** shell (`App.jsx`) aligned with CCWEB brand. Primary navigation adds **Platform** hub at `/platform`.

## Dependencies

Run `npm install` and add **`ws`** (`npm install ws`) to enable WebSocket `/ws`. If `ws` is not installed, HTTP APIs still work; the hub is skipped until the package is present.
