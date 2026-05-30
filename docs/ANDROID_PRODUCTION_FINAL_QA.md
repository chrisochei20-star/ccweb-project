# CCWEB Android Production Finalization QA

Internal Play Store testing and production readiness checklist for `io.chrisccweb.app` (Capacitor 7, Railway API, Vercel web).

**Release track:** `versionCode 4` / `versionName 1.2.1` — internal testing build after PWA brand alignment and release infrastructure phases.

---

## Pre-release commands (required)

```bash
npm test
npm run build
npm run mobile:sync
npm run validate:android
npm run validate:android-release
cd android && ./gradlew assembleRelease
cd android && ./gradlew bundleRelease
```

Optional device smoke:

```bash
adb shell am start -a android.intent.action.VIEW -d "io.chrisccweb.app://app/community"
adb shell am start -a android.intent.action.VIEW -d "https://ccweb-project-b4jq.vercel.app/messages"
```

---

## 1. Firebase production integration

| Item | Status | Verification |
|------|--------|--------------|
| `google-services.json` | **Requires ops** | Copy from Firebase Console → `android/app/google-services.json` (gitignored). Template: `google-services.json.example` |
| Gradle plugin | Conditional | Applied only when `google-services.json` exists (`android/app/build.gradle`) |
| FCM token registration | Done | `nativePush.js` → `POST /api/v1/notifications/device-token` with retry (3 attempts) |
| Token refresh on resume | Done | `useAppResumeSync` + `refreshNativePushRegistration` |
| API sync guard | Done | `apiSynced` in diagnostics; re-posts when token changes |
| Logout revoke | Done | `session.js` → `DELETE /api/v1/notifications/device-token` |
| Foreground handling | Done | `useNativePushRouting` → toast + store tick |
| Background tap routing | Done | `pushNotificationRouter.js` + `data.route` from Railway dispatch |
| Android 13+ permission UX | Done | `ensureNotificationPermission` + Settings → permission rationale + re-check button |
| Notification channels | Done | `ccweb_messages`, `ccweb_social`, `ccweb_ai`, `ccweb_alerts` (MainActivity + server `resolveAndroidChannel`) |
| Server FCM | **Requires ops** | Railway `FIREBASE_SERVICE_ACCOUNT_JSON`, optional `PUSH_TOKEN_ENCRYPTION_KEY` |

**No fake push:** When Firebase is unset, server returns `fcm_not_configured` and client shows diagnostics — never simulated delivery.

---

## 2. Android production polish

| Item | Status | Notes |
|------|--------|-------|
| Splash transition | Improved | Android 12+ `SplashScreen.installSplashScreen`, `postSplashScreenTheme`, hide on `ccweb:shell-ready` + 3.2s fallback, 420ms fade |
| Keyboard | Done | Capacitor Keyboard plugin + `--ccweb-keyboard-inset` CSS + dock adjustment |
| Back button | Done | `nativeBackStack` LIFO → history → minimize |
| Lifecycle recovery | Done | Debounced 650ms resume; socket reconnect; soft-resume event |
| Offline recovery | Done | `OfflineBanner` + `online` event + `offline_to_online` analytics |
| Push on resume after offline | Done | `refreshNativePushRegistration` when foreground |

---

## 3. Play Store compliance preparation

| Permission | Required? | Rationale in app |
|------------|-----------|------------------|
| `INTERNET` | Yes | API + realtime |
| `ACCESS_NETWORK_STATE` | Yes | Connectivity awareness |
| `POST_NOTIFICATIONS` | Yes (13+) | FCM — explained in Settings |
| `READ_MEDIA_IMAGES` | Yes | Gallery picker |
| `READ_EXTERNAL_STORAGE` | Legacy ≤32 | Scoped to maxSdk 32 |
| `CAMERA` | Optional feature | Chat/profile capture |

**Removed / not requested:** location, contacts, SMS, phone, microphone (unless added later with new rationale).

| Item | Status |
|------|--------|
| `targetSdk` / `compileSdk` 35 | Done (`variables.gradle`) |
| Cleartext disabled | Done (`usesCleartextTraffic=false`, `network_security_config.xml`) |
| Mixed content | Disabled (`capacitor.config.json`) |
| R8 / ProGuard | `minifyEnabled false` — rules in `proguard-rules.pro` for future enablement |
| WebView debugging | Disabled in release Capacitor config |

---

## 4. Deep linking verification

| Route type | Example | Handler |
|------------|---------|---------|
| Custom scheme | `io.chrisccweb.app://app/community` | `routeFromAppUrl` |
| HTTPS App Links | `https://ccweb-project-b4jq.vercel.app/messages` | `autoVerify` intent + router |
| Invalid / untrusted | `https://evil.example/` | Toast + `native_deep_link_rejected` event |
| Cold start | `App.getLaunchUrl` | `pendingDeepLink` + `useDeepLinkRouting` |
| Auth paths | `/login`, `/signup` | `isAuthRedirectUrl` flagged in analytics |

**App Links blocker:** Deploy `public/.well-known/assetlinks.json` on Vercel with **release** keystore SHA-256 (replace placeholder).

---

## 5. Native diagnostics and crash resilience

| Item | Status |
|------|--------|
| JS `window.onerror` | Done — `nativeCrashReporting.js` |
| `unhandledrejection` | Done |
| Lifecycle analytics | `native_app_resume`, `native_soft_resume`, `native_recovery` |
| Safe analytics guards | try/catch around track/report (no throw from telemetry) |
| Error boundary soft recover | `CcwebErrorBoundary` → `ccweb:soft-resume` |
| Settings diagnostics | Version, build, push token, API sync, FCM server status |
| Third-party crash SDK | **Not integrated** |

---

## 6. Production release validation

| Artifact | Command | Expected |
|----------|---------|----------|
| Release APK | `./gradlew assembleRelease` | `android/app/build/outputs/apk/release/` |
| Release AAB | `./gradlew bundleRelease` | `android/app/build/outputs/bundle/release/` |
| Capacitor sync | `npm run mobile:sync` | `dist/` copied to Android assets |
| Validate scripts | `validate:android*` | Exit 0 |

Signing: requires `android/keystore.properties` (see `keystore.properties.example`). Without it, builds succeed but artifacts are **unsigned** for Play upload.

---

## Physical device checklist (internal testing)

### Core
- [ ] Cold start: native splash → branded web shell (no white flash)
- [ ] Auth session survives kill/relaunch
- [ ] Back: modal → route → minimize app

### Firebase (configured)
- [ ] Settings shows FCM token + API sync yes
- [ ] Background notification received
- [ ] Tap opens correct route
- [ ] Foreground toast appears
- [ ] Logout revokes token

### Deep links
- [ ] Custom scheme opens correct tab
- [ ] HTTPS link opens app (after assetlinks live)
- [ ] Invalid link shows friendly toast (no crash)

### Offline
- [ ] Offline banner appears
- [ ] Return online → realtime reconnect + notification refresh

### Monetization / auth (preserve)
- [ ] Flutterwave checkout in WebView
- [ ] Login / refresh token flow unchanged

---

## Honest remaining Play Store blockers

1. **Legal:** Counsel-reviewed Privacy Policy and Terms (in-app pages marked draft)
2. **Firebase:** Production `google-services.json` on build machine + Railway `FIREBASE_SERVICE_ACCOUNT_JSON`
3. **Signing:** Release keystore + Play App Signing enrollment
4. **App Links:** Live `assetlinks.json` with release certificate SHA-256 on Vercel
5. **Play Console:** Data Safety form, content rating, store listing screenshots/video
6. **Support:** Verified `support@chrisccweb.com` for Play listing
7. **Crash reporting:** No Crashlytics/Sentry — Play pre-launch report only

---

## Honest native limitations (future work)

| Limitation | Impact |
|------------|--------|
| WebView shell | Performance varies by device WebView version |
| No native crash SDK | JVM/WebView process death not reported to third party |
| R8 disabled | Larger APK/AAB size |
| Push routing when logged out | Tap routing requires authenticated shell (`useNativePushRouting`) |
| iOS | Not in scope |
| Programmatic icons | PWA/Android icons generated in-repo, not designer exports |
| Community room avatars | Generic gradients, not CCWEB mark |
| OG/Twitter images | No branded social preview image meta |

---

## Architecture preserved

- **Vercel** — SPA + `manifest.webmanifest` + `assetlinks.json`
- **Railway** — Auth, realtime, FCM dispatch, monetization APIs
- **No placeholder push** — real FCM or explicit not-configured state
- **No fake native APIs** — Capacitor plugins only

---

## Production URLs

- Frontend: https://ccweb-project-b4jq.vercel.app
- API: https://ccweb-api-production-a92c.up.railway.app
- Package: `io.chrisccweb.app`

See also: [ANDROID_RELEASE_QA.md](./ANDROID_RELEASE_QA.md), [PUSH_NOTIFICATION_SETUP.md](./PUSH_NOTIFICATION_SETUP.md).
