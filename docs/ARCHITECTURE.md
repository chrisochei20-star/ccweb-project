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
  liveSession/              # Socket.io live room: chat, AI, engagement, earnings
  automation/             # Agent Operator, billing, lead gen (existing)
```

Frontend: `src/` — React + Tailwind v4; unified shell in `App.jsx`; pages under `src/pages/`.

## Realtime

- **Socket.io** (primary for live chat + AI in room): path **`/socket.io/`**. Install server dependency `socket.io` (`npm install socket.io`). Install client **`socket.io-client`** for the `/live` UI. Vite proxies **`/socket.io`** to the API (see `vite.config.js`).
- **WebSocket URL** (optional alternative): `ws://localhost:<PORT>/ws` — requires **`ws`** package.
- MVP relays JSON messages; production should use **Redis pub/sub** per room and auth.

### Live session (`/live`)

- **`session:join`** — `{ roomId, userId, displayName, userLevel, topic, poolUsd, curriculumTracks }`
- **`chat:message`** — `{ text, askAi }` or prefix `/ai` / `@brain` for Teaching Brain
- **`engagement:sync`** — `{ watchMinutes }` (client ticks every 15s)
- **`reaction:increment`** — boosts interaction score
- Server emits **`chat:message`**, **`summary:update`**, **`engagement:update`**, **`earnings:update`**, **`ai:nudge`** (idle engagement prompt)

## Example flows

### 1. User joins session → AI interacts → engagement → earnings

**Option A — Full-stack live UI**

1. Open **`/live`** in the browser (Vite + API running).
2. Socket connects and emits **`session:join`**.
3. Chat with **`/ai …`** for Teaching Brain answers (uses topic + recent chat as context).
4. Engagement score + earnings share update live via **`engagement:update`** / **`earnings:update`**.

**Option B — REST-only pieces**

1. **Join** (studio): `POST /api/streaming/rooms/:roomId/attendance` with `userId`, `watchMinutes`, `isOrganic`, etc.
2. **Teaching Brain**: `POST /api/v1/teaching-brain/answer` with optional **`streamContext`**: `{ topic, userLevel, recentHistory }`.
3. **Engagement**: `POST /api/v1/engagement/score` with attendance-shaped payload.
4. **Payout**: Existing streaming payout + distribute endpoints; align weights with `lib/engagement/scoring.js`.

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
