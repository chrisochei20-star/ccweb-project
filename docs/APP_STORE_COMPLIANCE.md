# CCWEB mobile store readiness (checklist)

This checklist supports **Google Play** and **Apple App Store** reviews alongside internal QA. It is not legal advice.

## Trust, safety, and moderation

- [ ] User reporting is available for posts, comments, and accounts (`POST /api/v1/trust/report`).
- [ ] Admin operations console is reachable at `/admin/ops` (protected app route; requires `CCWEB_ADMIN_KEY` on the server).
- [ ] Payout execution is gated with `FLUTTERWAVE_PAYOUT_ENABLED=1` only after finance sign-off.
- [ ] Moderation actions are audited (`ccweb_admin_audit_logs`, `ccweb_moderation_actions`).

## Privacy and data handling

- [ ] Privacy policy URL is accurate for data collected (auth profile, community content, device tokens for push prep).
- [ ] Bank details are encrypted at rest (`CCWEB_PAYOUT_ENCRYPTION_KEY`); keys are rotated via re-encryption runbook.
- [ ] Admin access is IP-aware via hashed audit logs (`CCWEB_AUDIT_IP_SALT`).

## Reliability and observability

- [ ] PostgreSQL migrations applied (`npm run db:migrate`) and `verifySchema` passes in CI.
- [ ] Flutterwave webhooks return 200 for verified events; failed jobs are visible in payout status + admin UI.
- [ ] `npm test` and `npm run build` pass on Node 20.x.

## Mobile UX

- [ ] Session persistence strategy chosen (`VITE_SESSION_LOCAL_STORAGE` for Capacitor builds).
- [ ] Media uploads prefer Cloudinary (`CLOUDINARY_*`) with `f_auto,q_auto` transforms.
- [ ] Error surfaces use `ToastViewport` + `CcwebErrorBoundary` without leaking secrets.

## Store-specific

- [ ] **Play**: Data safety form aligned with collected fields; content rating questionnaire completed.
- [ ] **App Store**: Export compliance, account deletion story (manual via support until automated flow ships), encryption disclosure if applicable.

Re-run this checklist before each production release candidate.
