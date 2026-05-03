# CCWEB demo & live preview video

## A) Synthetic slide videos (no real UI)

Small MP4s for instant sharing (title cards only):

| Asset | Direct download |
|-------|-----------------|
| Latest slide walkthrough | https://github.com/chrisochei20-star/ccweb-project/releases/download/ccweb-app-demo-latest-2026-05-03/ccweb-app-demo-latest-1080p.mp4 |
| Earlier slide deck | https://github.com/chrisochei20-star/ccweb-project/releases/download/ccweb-demo-video-2026-05-03/ccweb-demo-2min-1080p.mp4 |

These are **not** screen recordings of the running app.

---

## B) **Real** app recording — `ccweb-preview.mp4` (Playwright)

The repo includes an E2E flow that **records Chromium** while driving the **actual** UI (home → signup → dashboard → Learn → AI Streaming → Find scan → Early Signals → Build → AI Agents → Earn).

### Option 1 — GitHub Actions (recommended, no local Node required)

1. Push this repo to GitHub.
2. Open **Actions** → **“Record CCWEB live preview”** → **Run workflow**.
3. When the job finishes, open the **`ccweb-live-preview`** artifact and download **`ccweb-preview.mp4`** (plus optional **`ccweb-preview-10s.gif`**).

Workflow file: `.github/workflows/record-preview.yml`

### Option 2 — Local (requires Node 20+)

```bash
npm ci
npx playwright install chromium
CI=1 npm run record:preview
./scripts/finish-preview-video.sh ./ccweb-preview.mp4
```

### Option 3 — Docker (if Docker is installed)

```bash
./scripts/record-preview-docker.sh
```

---

## After you have `ccweb-preview.mp4`

Attach it to a **GitHub Release** (or Drive / unlisted YouTube). Example stable download pattern:

`https://github.com/<org>/<repo>/releases/download/<tag>/ccweb-preview.mp4`

**Instructions:** Tap the direct link to watch or download on your phone.

---

## QR for any public MP4 URL

Replace `ENCODED_URL` with URL-encoded link:

`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=ENCODED_URL`
