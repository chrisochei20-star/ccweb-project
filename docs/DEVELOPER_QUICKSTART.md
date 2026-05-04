# CCWEB Developer Quick Start (~5 minutes)

This guide matches the in-app flow at **Developers → Start here** (`/developers/onboarding`).

## 0. Prerequisites

- Node.js 20+
- API server on port 3000: `npm run dev:api`
- (Optional) Vite on 5173: `npm run dev` — the app proxies `/api` and `/v1` to the API

## 1. Sign up

Create a CCWEB account from **Sign up** so we can label your first project. You can still try API keys locally without signing in.

## 2. Create a project

Projects scope API keys, usage metering, and webhooks.

```bash
curl -s -X POST http://127.0.0.1:3000/api/developer/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"My integration","ownerUserId":"you@example.com"}'
```

## 3. Generate an API key

```bash
curl -s -X POST http://127.0.0.1:3000/api/developer/keys \
  -H "Content-Type: application/json" \
  -d '{"name":"Production","projectId":"<PROJECT_ID>","roles":["developer","viewer","admin"]}'
```

Save the `secret` once; it is not shown again.

## 4. First authenticated call

```bash
export CCWEB_API_KEY='ccweb_live_...'
curl -s http://127.0.0.1:3000/v1/analytics \
  -H "CCWEB-API-Key: $CCWEB_API_KEY"
```

## 5. Sandbox (no key)

```bash
curl -s -X POST http://127.0.0.1:3000/api/developer/sandbox/echo \
  -H "Content-Type: application/json" \
  -d '{"hello":"ccweb"}'
```

## 6. CLI

From the repo root (use `node` until the package is published):

```bash
node packages/ccweb-cli/bin.mjs init "My project"
node packages/ccweb-cli/bin.mjs test
CCWEB_API_KEY=... node packages/ccweb-cli/bin.mjs deploy
```

## 7. Choose your path

| Goal | Where to go |
|------|-------------|
| DApps | `/dapp-builder` — visual layout + simulated deploy |
| Agents | `/ai-agents` — product UI; API: `POST /v1/agents` |
| Raw API | `/developers` — keys, logs, webhooks, OpenAPI |

## Reference

- OpenAPI UI: `GET /api/developer/docs`
- Full architecture: [DEVELOPER_ECOSYSTEM.md](./DEVELOPER_ECOSYSTEM.md)

**Prototype note:** `/api/developer/*` console routes are open without login. Lock them behind auth before production.
