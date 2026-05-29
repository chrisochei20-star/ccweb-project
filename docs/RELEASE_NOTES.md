# CCWEB Android Release Notes

## 1.2.0 (versionCode 3) — Play Store readiness track

### New
- CCWEB Foundation adaptive launcher icons and branded splash screens
- Native mobile UX polish (pull-to-refresh, back stack, keyboard-aware nav)
- FCM push notifications with category channels and deep-link routing
- Deep link support (custom scheme + HTTPS App Links intent filters)
- Release-safe logging and first-party crash/lifecycle diagnostics
- Settings page with legal links, support, and push diagnostics

### Improvements
- Debounced app resume sync (socket, notifications, push token)
- Offline soft recovery without full reload
- Notification grouping via FCM tag/collapseKey

### Known limitations
- Privacy/Terms pages are draft pending legal review
- FCM requires Firebase `google-services.json` + Railway secrets
- App Links require deployed `assetlinks.json` with release certificate

### Internal testing focus
- Push tap routing, chat realtime, Flutterwave checkout, media uploads
- Physical device back button and keyboard behavior

---

## Template for future releases

### X.Y.Z (versionCode N)

**New**
- 

**Fixed**
- 

**Internal testing focus**
- 
