# CCWEB Android Production QA

Internal Play Store testing checklist for the Capacitor Android shell (`io.chrisccweb.app`).

## Architecture (unchanged)

- **Frontend bundle**: Vite build synced into `android/` via Capacitor
- **API**: Railway (`VITE_API_BASE_URL` baked at `npm run mobile:build`)
- **Web deploy**: Vercel (same React bundle; Android loads bundled assets locally)
- **Push**: FCM via `@capacitor/push-notifications` + Railway token registry

## Pre-flight commands

Run from repo root:

```bash
npm run verify:imports
npm test
npm run build
node scripts/validate-android-production.mjs
npm run mobile:sync
cd android && ./gradlew assembleDebug
```

Release candidate (requires keystore):

```bash
# android/keystore.properties + signing key required
npm run mobile:android:release
```

## Native UX polish

| Area | Status | Notes |
|------|--------|-------|
| Page enter animation | Done | `ccweb-page-enter` on native shell |
| Bottom nav ripple / scale | Done | `ccweb-native.css` touch feedback |
| Keyboard hides bottom nav | Done | `ccweb-keyboard-open` class via Capacitor Keyboard plugin |
| Pull-to-refresh | Partial | Chat conversation list, Community feed, Notifications |
| Android back button | Done | Modals/sheets via `nativeBackStack`; history back; minimize at root |
| Splash fade | Done | 320ms fade via SplashScreen plugin |
| Scroll momentum | Done | `-webkit-overflow-scrolling: touch` on native scroll surfaces |
| Viewport stability | Partial | WebView + `adjustResize`; long composer forms may still shift slightly |

## Mobile media UX

| Area | Status | Notes |
|------|--------|-------|
| Gallery picker sheet | Done | `NativeMediaPicker` (Chat) |
| Camera capture | Done | `capture="environment"` hidden input |
| Image viewer modal | Done | `ImageViewerModal` with back-stack close |
| Upload progress | Existing | Profile/chat use existing upload APIs |
| Retry/cancel uploads | Partial | Chat retry on send failure; no global upload queue UI |
| Image caching | Existing | `MediaImage` + Cloudinary transforms |
| Layout shift prevention | Partial | Skeletons on feeds; large images may still reflow |

## Push notifications

| Area | Status | Notes |
|------|--------|-------|
| FCM token registration | Done | `nativePush.js` + `/api/v1/push/device-token` |
| Token refresh on resume | Done | `useAppResumeSync` |
| Deep link routing | Done | `pushNotificationRouter.js` + `useNativePushRouting` |
| Android channels | Done | messages, social, ai, alerts (MainActivity + server dispatch) |
| Notification icon/color | Done | `ic_stat_ccweb.xml`, `@color/ccweb_notification` |
| Foreground handling | Done | Capacitor listeners + in-app toast/route |
| Diagnostics | Done | Settings → App diagnostics + `/api/v1/push/diagnostics` |

**Requires production secrets:**

- `android/app/google-services.json` (gitignored)
- Railway: `FIREBASE_SERVICE_ACCOUNT_JSON`, `PUSH_TOKEN_ENCRYPTION_KEY`

## App lifecycle

| Area | Status | Notes |
|------|--------|-------|
| Resume socket reconnect | Done | Debounced 650ms in `useAppResumeSync` |
| Notification refresh on resume | Done | `scheduleRefresh` |
| Offline banner soft recover | Done | Avoids full reload; dispatches `ccweb:soft-resume` |
| Reconnect storm prevention | Done | Debounce on resume + realtime lifecycle |

## Play Store readiness

| Item | Status | Blocker? |
|------|--------|----------|
| Adaptive launcher icons | Done | CCWEB Foundation bolt via `npm run mobile:assets` |
| Splash assets | Generated | OK for internal testing |
| App ID / name | `io.chrisccweb.app` / CCWEB | OK |
| versionCode 2 / versionName 1.1.0 | Set | Bump before each release |
| Privacy policy link | In-app `/privacy` | **Draft — legal review required** |
| Terms link | In-app `/terms` | **Draft — legal review required** |
| Support email | `support@chrisccweb.com` | Verify mailbox before public listing |
| Release signing | Template in `build.gradle` | **Needs keystore.properties** |
| Data Safety form | Not started | Play Console manual step |
| Store screenshots / feature graphic | Not in repo | Play Console manual step |
| Internal testing track | Ready after signing + policies | — |

## Manual QA script (device)

1. **Cold start**: App opens with splash fade, lands on home without layout jump.
2. **Auth**: Sign in persists across kill/relaunch (Capacitor Preferences storage).
3. **Bottom nav**: Tabs respond with ripple; keyboard open hides dock.
4. **Back**: Open image viewer → back closes modal; at home → minimizes app.
5. **Pull-to-refresh**: Community feed and Notifications refresh at scroll top.
6. **Chat**: Conversation list PTR; send image via gallery/camera; viewer pinch/zoom if supported.
7. **Push** (Firebase configured): Receive notification background + tap routes to correct screen.
8. **Offline**: Airplane mode shows banner; reconnect triggers soft recover without duplicate sockets.
9. **Settings**: Legal links open; diagnostics show token/FCM status when logged in.
10. **Error boundary**: Force a render error in dev → Recover / Home / Reload options work.

## Honest native-app limitations

- **WebView shell**, not native UI widgets — performance and feel depend on Chromium WebView version.
- **No iOS build** in this phase (Android-only polish).
- **Browser push (VAPID)** not implemented; web users rely on in-app notifications only.
- **Pull-to-refresh** not on every list (Learn, Earn, Profile feed use existing refresh patterns).
- **Programmatic launcher icons** — acceptable for internal testing, not final brand assets.
- **Long-session memory** — WebView may reclaim tabs; no native image disk cache beyond Cloudinary URLs.

## Remaining Play Store blockers

1. Counsel-reviewed **Privacy Policy** and **Terms** (current pages marked draft).
2. **Firebase** project + `google-services.json` + Railway FCM secrets for production push.
3. **Release keystore** and Play App Signing enrollment.
4. Play Console **Data Safety**, content rating, and listing assets.
5. Verified **support email** and optional website privacy URL matching store listing.

## Production URLs

- Frontend: https://ccweb-project-b4jq.vercel.app
- API: https://ccweb-api-production-a92c.up.railway.app
