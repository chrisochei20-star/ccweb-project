# CCWEB Developer Ecosystem

## Architecture

| Layer | Path | Description |
|-------|------|-------------|
| **Public REST v1** | `/v1/*` | API key auth (`CCWEB-API-Key` or `Authorization: Bearer`), RBAC roles on keys, per-key rate limits |
| **GraphQL-style** | `POST /v1/graphql` | Minimal query gateway; replace with `graphql` package for production |
| **Developer console API** | `/api/developer/*` | No API key — **prototype only**. Create keys, projects, webhooks, marketplace listings, OpenAPI |
| **Sandbox** | `POST /api/developer/sandbox/echo`, `POST /api/developer/sandbox/workflow` | No auth; safe echo + simulated workflow |
| **Interactive docs** | `GET /api/developer/docs` | Swagger UI |
| **OpenAPI** | `GET /api/developer/openapi.json` | Machine-readable spec |
| **Onboarding UI** | `/developers/onboarding` (Vite app) | Five-step guided setup |
| **Quick start doc** | [docs/DEVELOPER_QUICKSTART.md](./DEVELOPER_QUICKSTART.md) | Same flow in Markdown |

## Security (prototype → production)

- API keys are **SHA-256 hashed** at rest; full secret shown only once on creation.
- **Rate limiting** per key + IP (sliding minute window).
- **RBAC**: `viewer`, `developer`, `admin` on keys (`/users` requires `admin`).
- **Input validation**: deploy body validated via existing DApp rules; EVM `walletAddress` must checksum-check via **ethers** when present; add Zod/Joi at edge in production.
- **Webhooks**: HMAC-SHA256 signature header `X-CCWEB-Signature: sha256=<hex>`.

## DApp framework

Templates and networks match `GET /api/dapp/templates` and `SUPPORTED_NETWORKS` in `server.js`.  
`POST /v1/dapp/deploy` uses the same `runDappDeployCore` as the UI builder (gas estimate string on template, simulated deploy). Response includes a `safety` object from a lightweight template/network check.

## Public API surface (`/v1`)

- **Sessions:** `GET/POST /v1/sessions`, `GET /v1/sessions/:id`, `POST .../join`, `POST .../stream`, `POST .../finish` (finish emits `session.ended`).
- **Users:** `GET /v1/users` (requires `admin` on the API key) — returns sanitized in-memory CCWEB users.
- **Revenue:** `GET /v1/revenue` — synthetic ledger sample; emits `revenue.updated` webhook.
- **Agents:** `GET/POST /v1/agents`, `POST /v1/agents/:id/execute` (emits `agent.execution.completed`).
- **Workflows:** `GET/POST /v1/workflows`, `POST /v1/workflows/:id/run` (persisted per project in `developerPlatform`).
- **GraphQL-style:** `POST /v1/graphql` — string-matched subset for `sessions`, `revenue`, `agents`.

## Webhooks

Register `POST /api/developer/webhooks` with `{ url, events?, projectId? }`. Default events include: `session.started`, `session.ended`, `revenue.updated`, `agent.registered`, `agent.execution.completed`, `workflow.created`, `workflow.run.completed`, `dapp.deploy.completed`.

## Billing

`GET /api/developer/billing/tiers` — free / pro / scale limits (RPM + monthly call caps in prototype).

## SDK & CLI

- **SDK:** `packages/ccweb-sdk` — `createClient({ apiKey, baseUrl })` with helpers for `sessions`, `workflows`, `dapp`, `graphql`, plus `createAgentHelpers(client)`.
- **CLI:** `packages/ccweb-cli` — `ccweb init`, `ccweb test` (health + sandbox + optional analytics), `ccweb sandbox`, `ccweb doctor`, `ccweb call <path>`, `ccweb deploy` (env-driven sample deploy).

## Next steps (scale)

1. PostgreSQL for keys, projects, usage metering, webhook deliveries.
2. Stripe for paid tiers and pay-per-call.
3. Separate `developer` service behind API gateway; KMS for key encryption.
4. ethers.js v6 + WalletConnect v2 for real deploy pipeline.
