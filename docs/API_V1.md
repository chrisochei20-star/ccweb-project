# CCWEB REST API v1 (`/api/v1`)

Production Express routes mounted via `platformExpress.js`. Legacy `/auth/*`, `/api/auth/*`, and streaming URLs remain unchanged.

**Base URL:** `https://your-host/api/v1`

**Auth header:** `Authorization: Bearer <accessToken>` (except register, login, wallet nonce/verify, some marketplace GETs).

---

## Auth

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/api/v1/auth/register` | `{ "email", "password", "displayName?" }` | `201` `{ user, message, verifyEmailHint? }` |
| POST | `/api/v1/auth/login` | `{ "email", "password" }` | `200` `{ user, accessToken, token, expiresIn, tokenType }` or `needsTwoFactor` |
| POST | `/api/v1/auth/login/2fa` | `{ "twoFactorToken", "code" }` or backup | `200` tokens |
| POST | `/api/v1/auth/2fa/setup` | Header JWT; `{ "step": "begin" }` or `{ "step": "confirm", "code" }` | TOTP secret or `ok` + backup codes |
| POST | `/api/v1/auth/2fa/verify` | Header JWT; `{ "code" }` | `{ "ok": true }` |
| POST | `/api/v1/auth/logout` | `{ "refreshToken?" }` or cookie | `{ "ok": true }` |
| GET | `/api/v1/auth/me` | Header JWT | `{ "user" }` |

**Example — login**

```http
POST /api/v1/auth/login HTTP/1.1
Content-Type: application/json

{ "email": "a@b.com", "password": "secret12" }
```

```json
{
  "user": { "id": "usr-xxx", "displayName": "A", "email": "a@b.com" },
  "accessToken": "eyJ...",
  "token": "eyJ...",
  "expiresIn": "15m",
  "tokenType": "Bearer"
}
```

---

## Wallet

| Method | Path | Body |
|--------|------|------|
| POST | `/api/v1/wallet/nonce` | `{ "address", "chainId?" }` |
| POST | `/api/v1/wallet/verify` | Same as `/auth/wallet/connect` — signature payload |

Returns tokens on `/verify` when valid.

---

## Users

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/v1/users/me` | JWT required |
| PUT | `/api/v1/users/update` | JWT; `{ "displayName" }` |
| GET | `/api/v1/users/:id` | Optional JWT; others omit `email` from payload |

---

## Agents

| Method | Path |
|--------|------|
| POST | `/api/v1/agents/create` |
| GET | `/api/v1/agents` |
| GET | `/api/v1/agents/:id` |
| POST | `/api/v1/agents/run` |

**Example — run**

```json
POST /api/v1/agents/run
{ "agentId": "agent-001", "input": { "topic": "DeFi" } }
```

---

## Marketplace

| Method | Path |
|--------|------|
| POST | `/api/v1/marketplace/create` | Requires PostgreSQL for persistence |
| GET | `/api/v1/marketplace?industry=` | Public |
| GET | `/api/v1/marketplace/:id` | Public |

---

## Payments (escrow)

| Method | Path |
|--------|------|
| POST | `/api/v1/payments/create` | Stripe Checkout — body same as growth escrow: `listingId`, optional `buyerName`, `successUrl`, `cancelUrl`; buyer defaults to JWT user |
| POST | `/api/v1/payments/release` | `{ "orderId", "action": "confirm" \| "deliver" }` |
| GET | `/api/v1/payments/history` | User’s orders (buyer + seller) |

---

## Analytics

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/v1/analytics/user` | Learning profile + orders when DB enabled |
| GET | `/api/v1/analytics/platform` | Header `X-CCWEB-Admin: <CCWEB_ADMIN_KEY>` |

---

## Security

- **Helmet + CORS** on the platform app (`applyExpressSecurity`).
- **Sliding rate limit** on `/api/v1` (30k-class cap per IP per minute; tune in `platformExpress.js`).
- **PCI:** card data only on Stripe Checkout; never log raw card numbers.

---
See `platformExpress.js` for the full implementation.
