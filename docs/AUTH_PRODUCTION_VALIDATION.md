# CCWEB authentication — production validation notes

This document summarizes how auth works today and what automated tests cover. Run **`npm test`** for the Vitest suite (includes `tests/authEngine.test.js`).

## Implemented flows

| Flow | Backend | Notes |
|------|-----------|--------|
| Email signup | `POST /api/auth/register` | bcrypt (12 rounds), duplicate email rejected, min password length 8 |
| Email login | `POST /api/auth/login` | JWT access + refresh; optional 2FA pending token |
| 2FA login | `POST /api/auth/login/2fa` | After TOTP pending JWT |
| Refresh | `POST /api/auth/refresh` | Body `refreshToken` and/or **httpOnly** cookie `ccweb_refresh` |
| Logout | `POST /api/auth/logout` | Revokes refresh server-side; clears cookie |
| Session | `GET /api/auth/me` | Bearer access only; does **not** return new tokens (by design) |
| Password reset | `POST /api/auth/password/request` + `reset` | Rate-limited request; reset rate-limited |
| Email verify | `GET /api/auth/verify-email?token=` | Token in DB |
| Wallet | `POST /api/auth/wallet/nonce` + `connect` | Nonce TTL, rate limit |
| OAuth | `POST /api/auth/oauth/google` \| `apple` | IdP verification |

## Rate limits (per IP, sliding window)

- **Login**: 25 / 15 min (`authEngine.loginPasswordStep`)
- **Register**: 15 / hour (`authExpress` — added for abuse resistance)
- **Wallet**: 40 / 15 min
- **2FA verify**: 30 / 10 min
- **Password request**: 10 / hour
- **Password reset complete**: 20 / hour (`authExpress` — added)

## Security properties

- **Passwords**: Never returned in API JSON; only bcrypt hash in DB.
- **JWT**: HS256; `AUTH_JWT_SECRET` required length ≥32 in production (`jwtTokens.js`).
- **Refresh**: Stored hashed (`refresh_token_hash`); rotation on refresh; logout clears hash.
- **Lockout**: After failed logins (`MAX_LOGIN_FAILS` in `authEngine.js`).
- **Frontend**: Access token in **sessionStorage** (SPA); refresh in **sessionStorage** when `AUTH_REFRESH_IN_BODY=1`, else httpOnly cookie — see `authExpress.sendTokens` and `.env.example`.

## Frontend session bugfix (2026)

`fetchMe()` previously called `setSession(access, user, refresh)` with `refresh` undefined when `/me` returned only `{ user }`, which **cleared** the refresh token from sessionStorage and broke “stay logged in after refresh” when using `AUTH_REFRESH_IN_BODY=1`.

**Fix**: `fetchMe` now preserves the existing refresh token when the response omits it, and on **401** attempts **`POST /api/auth/refresh`** once before clearing the session (`src/session.js`).

## Protected routes

- **Platform API** (`/api/v1/*` JWT routes): `platformExpress.authJwtMiddleware` — 401 without valid access token.
- **Legacy `/api/*`**: varies by route; prefer `/api/v1` for new clients.

## Production checklist

1. Set **`AUTH_JWT_SECRET`** (32+ random chars).
2. Set **`AUTH_COOKIE_SECURE=1`** and **`PUBLIC_APP_URL`** on HTTPS hosts.
3. Set **`CCWEB_ALLOWED_ORIGINS`** to your SPA origin(s).
4. For SPA refresh without cookies cross-site: **`AUTH_REFRESH_IN_BODY=1`** and rely on fixed `fetchMe` + axios interceptor.
5. Configure real email for verification / reset (SMTP or provider) — debug tokens only with **`AUTH_DEBUG=1`**.
