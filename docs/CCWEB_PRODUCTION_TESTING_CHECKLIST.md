# CCWEB — production testing checklist

Use **after** each production deploy (e.g. Railway API + SPA). Confirm **`VITE_API_BASE_URL`** matches your live API (e.g. `https://ccweb-api-production.up.railway.app`), **`CCWEB_ALLOWED_ORIGINS`** includes the SPA origin, and required secrets are set (`AUTH_JWT_SECRET`, `DATABASE_URL`, API keys as needed).

**Related:** [PRODUCTION_DEPLOY_CHECKLIST.md](./PRODUCTION_DEPLOY_CHECKLIST.md) · [QA_PRODUCTION_CHECKLIST.md](./QA_PRODUCTION_CHECKLIST.md) (Playwright + shorter manual) · [POST_MERGE_VERIFICATION.md](./POST_MERGE_VERIFICATION.md)

---

## AUTH

- [ ] Sign up
- [ ] Login
- [ ] Logout
- [ ] Refresh browser after login
- [ ] Stay logged in after refresh
- [ ] Protected pages open correctly

## PROFILE

- [ ] Profile page loads
- [ ] Edit profile works
- [ ] Save profile works
- [ ] Avatar upload works (Cloudinary)

## COMMUNITY

- [ ] Create post
- [ ] View posts
- [ ] Like/comment
- [ ] Feed refreshes

## CHAT

- [ ] Open chats
- [ ] Send message
- [ ] Receive message
- [ ] Session persists in chats

## AI ACADEMY

- [ ] Create live room
- [ ] Join session
- [ ] Tutor chat works
- [ ] AI responses work (OpenAI key)

## WEB3

- [ ] MetaMask connect
- [ ] Wallet state persists
- [ ] Blockchain/API data loads (Etherscan)

## PAYMENTS

- [ ] Flutterwave payment flow opens
- [ ] Stripe beta/payment flow works (if enabled)

## MOBILE TEST

- [ ] Android Chrome works
- [ ] Navigation tabs work
- [ ] No infinite loading
- [ ] No “Sign in required” after login

## ERROR TEST

- [ ] No Network Error boxes
- [ ] No blank pages
- [ ] No failed API calls in console
- [ ] No redirects back to login unexpectedly

---

## Quick regression notes

- **Auth / “Sign in” after login:** SPA waits for session hydration; if you still see false prompts, hard-refresh once and confirm `VITE_*` was baked at build time.
- **Network errors:** Check CORS, API URL, and that the API process is healthy (`GET /health`).
- **Chat / notifications:** Require valid JWT + (if used) WebSockets to the same API origin.
