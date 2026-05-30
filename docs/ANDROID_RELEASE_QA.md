# CCWEB Android Release & Play Store Distribution QA

Production release checklist for `io.chrisccweb.app` (Capacitor 7, Railway API, Vercel web).

**Version strategy:** `versionCode` increments every Play upload; `versionName` follows semver (`1.2.1` / code `4` = internal Play testing track — see [ANDROID_PRODUCTION_FINAL_QA.md](./ANDROID_PRODUCTION_FINAL_QA.md)).

---

## Pre-release commands

```bash
npm run verify:imports
npm test
npm run build
npm run validate:android
npm run validate:android-release
npm run mobile:assets
npm run mobile:sync
cd android && ./gradlew assembleRelease   # APK
cd android && ./gradlew bundleRelease     # AAB (Play Store preferred)
```

---

## 1. Android release infrastructure

| Item | Status | Notes |
|------|--------|-------|
| Release Gradle config | Done | `versionCode 4`, `versionName 1.2.1`, `resConfigs en`, signing template |
| Release signing | Template | `android/keystore.properties.example` — real keystore gitignored |
| ProGuard/R8 | Safe default | `minifyEnabled false` — rules ready in `proguard-rules.pro` |
| Release logging | Done | `src/lib/releaseLog.js` — suppresses console in PROD unless `VITE_CCWEB_DEBUG=1` |
| Permissions audit | Done | INTERNET, NETWORK_STATE, POST_NOTIFICATIONS, CAMERA, READ_MEDIA_IMAGES only |
| APK/AAB scripts | Done | `mobile:android:release`, `mobile:android:bundle` |
| Startup | Done | Splash fade 320ms; WebView loads bundled `dist/` |

---

## 2. Firebase / FCM production

| Item | Status | Notes |
|------|--------|-------|
| FCM client registration | Done | `nativePush.js` → `POST /api/v1/notifications/device-token` |
| Token refresh on resume | Done | `useAppResumeSync` + `refreshNativePushRegistration` |
| Logout token revoke | Done | `session.js` → `DELETE /api/v1/notifications/device-token` |
| Foreground handling | Done | Toast via `useNativePushRouting` |
| Background tap routing | Done | `pushNotificationRouter.js` + `data.route` from server |
| Notification channels | Done | messages, social, ai, alerts (MainActivity + server) |
| Notification grouping | Done | FCM `tag` + `collapseKey` via `groupKey` in dispatch |
| Server diagnostics | Done | `GET /api/v1/notifications/push/diagnostics` |

**Requires production secrets:**
- `android/app/google-services.json`
- Railway: `FIREBASE_SERVICE_ACCOUNT_JSON`, `PUSH_TOKEN_ENCRYPTION_KEY`

See [PUSH_NOTIFICATION_SETUP.md](./PUSH_NOTIFICATION_SETUP.md).

---

## 3. Play Store readiness

| Item | Status | Blocker? |
|------|--------|----------|
| Adaptive icons | Done | CCWEB Foundation bolt via `npm run mobile:assets` |
| Splash screens | Done | Portrait + landscape per density |
| Privacy policy | In-app `/privacy` | **Draft — legal review** |
| Terms | In-app `/terms` | **Draft — legal review** |
| Data Safety form | Not in repo | Play Console manual |
| Content rating | Not in repo | Play Console manual |
| Store screenshots | Not in repo | Play Console manual |
| App Links | Intent filters added | Requires live `assetlinks.json` with release cert SHA256 |
| Exported components | Audited | MainActivity exported (launcher); FileProvider not exported |
| Release notes | [RELEASE_NOTES.md](./RELEASE_NOTES.md) | Template for each track |

---

## 4. Native mobile reliability

| Item | Status |
|------|--------|
| Android back stack | Done — modals first via `nativeBackStack` |
| Resume lifecycle | Done — debounced 650ms `useAppResumeSync` |
| Offline recovery | Done — soft recover, no reload storm |
| Socket reconnect | Done — debounced on resume |
| Duplicate resume fetches | Mitigated — `runningRef` guard in `useAppResumeSync` |
| Keyboard handling | Done — Capacitor Keyboard plugin + CSS dock hide |

---

## 5. Deep linking

| Item | Status |
|------|--------|
| Custom scheme | `io.chrisccweb.app://app/{path}` |
| HTTPS App Links | `https://ccweb-project-b4jq.vercel.app/{path}` |
| Capacitor handlers | `appUrlOpen` + `getLaunchUrl` in `capacitorPlatform.js` |
| Router integration | `useDeepLinkRouting` in `MobileLayout` |
| Invite links | `/invite/:code` |
| Profile links | `/u/:slug` |
| Auth redirects | Detected via `isAuthRedirectUrl` |

**Deploy App Links:** Host `public/.well-known/assetlinks.json` on Vercel with release keystore SHA256.

---

## 6. Observability

| Item | Status |
|------|--------|
| JS error reporting | Done — `clientAnalytics.js` → `/api/v1/beta/event` |
| Native lifecycle events | Done — `nativeCrashReporting.js` |
| Release log guards | Done — `releaseLog.js` |
| Settings diagnostics | Done — Settings → App diagnostics |
| Native crash SDK | **Not integrated** — no Firebase Crashlytics/Sentry |

WebView process death and native JVM crashes are **not** captured by first-party telemetry.

---

## 7. Release QA — physical device checklist

### Core flows
- [ ] Cold start → splash fade → home (no layout jump)
- [ ] Sign in persists across kill/relaunch
- [ ] Bottom nav + back button (modal → history → minimize)
- [ ] Pull-to-refresh on Community / Notifications / Chat list

### Push (Firebase configured)
- [ ] Token registers on login (`Settings → diagnostics`)
- [ ] Background notification received
- [ ] Tap opens correct screen (chat, community, profile)
- [ ] Foreground shows in-app toast
- [ ] Logout revokes token

### Media
- [ ] Gallery picker (Chat)
- [ ] Camera capture
- [ ] Image viewer modal
- [ ] Cloudinary upload progress

### Payments
- [ ] Flutterwave checkout opens in WebView
- [ ] Return to app after payment

### Realtime / AI
- [ ] Chat Socket.IO reconnect after background
- [ ] AI tutor streaming
- [ ] Notifications realtime refresh

### Deep links
- [ ] `adb shell am start -a android.intent.action.VIEW -d "io.chrisccweb.app://app/community"`
- [ ] HTTPS link opens app (after assetlinks verified)

---

## Honest remaining Play Store blockers

1. Counsel-reviewed **Privacy Policy** and **Terms**
2. **Firebase** production credentials on device + Railway
3. **Release keystore** + Play App Signing
4. Play Console **Data Safety**, content rating, listing assets
5. Verified **support@chrisccweb.com**
6. **assetlinks.json** deployed with real release certificate fingerprint

---

## Honest native scalability limitations

- **WebView shell** — performance bound to Chromium WebView version on device
- **No native crash SDK** — JVM/WebView deaths not reported to third-party service
- **R8 disabled** — larger APK; enable only after Capacitor mapping QA
- **PWA icons** not yet aligned with CCWEB Foundation adaptive mark
- **iOS** not in scope
- **Long WebView sessions** — memory pressure on low-RAM devices may reclaim tabs

---

## Production URLs

- Frontend: https://ccweb-project-b4jq.vercel.app
- API: https://ccweb-api-production-a92c.up.railway.app
- Package: `io.chrisccweb.app`
