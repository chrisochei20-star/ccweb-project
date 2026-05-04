# CCWEB authentication API

Production-oriented stack: **bcrypt** passwords, **JWT** access + refresh (rotation), **TOTP** 2FA (Google Authenticator), **wallet** sign-in (EVM personal_sign / Solana ed25519). Private keys never touch the server.

## Environment

See `.env.example`. Minimum for production:

- `AUTH_JWT_SECRET` — at least 32 random bytes (e.g. `openssl rand -hex 32`).
- `MONGODB_URI` — recommended for durable users and refresh token binding.

**Vite dev (cross-port):** httpOnly refresh cookies from the API may not reach the browser when using the proxy. Set `AUTH_REFRESH_IN_BODY=1` so `POST /api/auth/login` includes `refreshToken` in JSON; the SPA stores it in `sessionStorage` (see `src/session.js`).

## Endpoints (also under `/auth/*`)

| Method | Path | Description |
|--------|------|---------------|
| POST | `/api/auth/register` | Create account (email + password). Does **not** auto-login. |
| POST | `/api/auth/login` | Email/password; may return `needsTwoFactor` + `twoFactorToken`. |
| POST | `/api/auth/login/2fa` | Body: `{ twoFactorToken, code }` (TOTP or backup code). |
| POST | `/api/auth/refresh` | Body `{ refreshToken }` or `ccweb_refresh` cookie. |
| POST | `/api/auth/logout` | Revokes refresh; optional body `{ refreshToken }`. |
| GET | `/api/auth/me` | `Authorization: Bearer <accessToken>`. |
| GET | `/api/auth/verify-email?token=...` | Confirm email (token from mailer in production). |
| POST | `/api/auth/2fa/setup` | `step: begin` → secret + otpauth URL; `step: confirm` + `code` → backup codes. |
| POST | `/api/auth/2fa/verify` | Validate a TOTP code (authenticated). |
| POST | `/api/auth/wallet/nonce` | Body: `{ address, chainType: "evm" \| "solana" }` → message to sign. |
| POST | `/api/auth/wallet/connect` | Body: `{ address, message, signature, chainType }` (Solana: `publicKeyBase58`, `signature` base64). |
| POST | `/api/auth/password/request` | Reset request (no enumeration). |
| POST | `/api/auth/password/reset` | `{ email, token, newPassword }`. |

## Example: register + login

```bash
curl -s -X POST http://127.0.0.1:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"hunter2long","displayName":"You"}'

curl -s -X POST http://127.0.0.1:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"hunter2long"}'
```

Response includes `accessToken` (and `token` alias), optional `refreshToken` when `AUTH_REFRESH_IN_BODY=1`, and `user`.

## Example: wallet (EVM)

1. `POST /api/auth/wallet/nonce` with `{ "address": "0x...", "chainType": "evm" }`.
2. Sign `message` with MetaMask (`personal_sign`) or WalletConnect.
3. `POST /api/auth/wallet/connect` with `{ "address", "message", "signature", "chainType": "evm" }`.

## Security notes

- Login and wallet routes are **rate-limited** per IP.
- Refresh tokens are **hashed** at rest; rotation on each refresh.
- TOTP secrets are **AES-256-GCM** encrypted at rest (key derived from `AUTH_JWT_SECRET`).
- Configure **HTTPS** and `AUTH_COOKIE_SECURE=1` in production for cookies.

WalletConnect is a **client SDK** concern: obtain the same `message` + `signature` from the connected wallet and POST to `/api/auth/wallet/connect`.
