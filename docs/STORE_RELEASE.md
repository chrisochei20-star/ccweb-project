# Google Play & App Store — release checklist (CCWEB)

This app is currently a **web-first prototype** wrapped with Capacitor for Android. Treat the following as a **minimum** before submission.

## Technical

- [ ] Replace prototype auth with production identity (OAuth / managed IdP, secure token storage).
- [ ] Serve the SPA over **HTTPS** only; configure API base URL per environment (`VITE_API_URL` if you split frontend hosting).
- [ ] Run `npm run build`, `npm test`, manual QA on **physical** low-end Android and current iOS (add `npx cap add ios` when on macOS).
- [ ] Crash reporting (Sentry or similar) and analytics (privacy-disclosed).

## Legal & policy

- [ ] Replace `/privacy` and `/terms` placeholder copy with counsel-reviewed documents.
- [ ] App Store “privacy nutrition” labels and Play Data safety section completed from real practices.
- [ ] If you collect health, financial, or child data — additional compliance applies (not applicable to default prototype).

## Store assets

- [ ] App icon (adaptive for Android), screenshots (phone + tablet if supported), short/full description, keywords.
- [ ] Support URL and marketing URL (can be the same landing page).
- [ ] Versioning: bump `package.json` version and platform-specific build numbers each submission.

## Video (2-minute demo)

Use `docs/DEMO_VIDEO_SCRIPT.md` as a shot list. Record screen + voiceover; export 1080p, under store size limits.

## What this repo does **not** include

- Automated upload to Play Console / App Store Connect (run from your CI or locally).
- Production push certificates, IAP products, or attestation — add when monetization is defined.
