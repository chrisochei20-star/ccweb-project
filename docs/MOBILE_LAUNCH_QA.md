# CCWEB mobile launch QA checklist

Use this list before Play Store / App Store submission or a major native release. It complements `docs/QA_PRODUCTION_CHECKLIST.md` with a mobile-first focus.

## Build and packaging

- [ ] `npm run build` succeeds; `npm run mobile:sync` (or `mobile:android`) completes without Capacitor drift warnings.
- [ ] Android: release signing config, `versionCode` bump, Proguard/R8 rules verified for WebView + Capacitor.
- [ ] iOS: Xcode archive on release configuration; push capability enabled if using FCM through Firebase; associated domains for universal links if used.

## Push (FCM / APNs)

- [ ] Server: `FCM_SERVICE_ACCOUNT_JSON` (or `FCM_PROJECT_ID` + `FCM_CLIENT_EMAIL` + `FCM_PRIVATE_KEY`) set; `GET /api/v1/config` reports `push.fcmConfigured: true`.
- [ ] Android: `google-services.json` in the native project (Firebase console); cold start after install registers token; `POST /api/v1/devices/push-token` returns 200 when logged in.
- [ ] iOS: APNs key uploaded in Firebase; push permission prompt appears once; background presentation matches policy (`capacitor.config.json` PushNotifications plugin).
- [ ] Tapping a notification opens the in-app route (`path` / `deepLink` in FCM data payload).

## Permissions and privacy

- [ ] App store listings disclose camera/photos/microphone (if used), notifications, and network usage.
- [ ] In-app copy explains why notifications are requested (creator wizard step + system dialog).

## Resilience (manual)

- [ ] Low-end Android: cold start, scroll marketplace and community feeds, open chat.
- [ ] Airplane mode toggle: app returns to a sane state; session refresh after reconnect.
- [ ] Background 5+ minutes: resume preserves auth; sockets reconnect (chat + notification bell).
- [ ] Large image upload to marketplace or chat: completes or surfaces a clear error with retry.

## Monitoring

- [ ] `VITE_SENTRY_DSN` set in the web/native build pipeline; verify a test error appears in Sentry with stack traces.
- [ ] Optional: `CCWEB_OPS_ALERT_WEBHOOK_URL` receives a test payload; Flutterwave webhook failures alert when processing throws.

## Payments

- [ ] Marketplace checkout happy path still fulfills entitlements after native shell changes.
- [ ] Payout / transfer webhooks: verify ledger updates; confirm ops alert on forced failure in staging.

## Regression smoke

- [ ] `npm test` and `npm run test:e2e:marketplace` pass in CI.
- [ ] `npm run test:e2e:mobile-launch` passes (viewport + config sanity).
