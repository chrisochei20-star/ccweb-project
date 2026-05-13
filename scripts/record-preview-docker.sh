#!/usr/bin/env bash
# One-shot: record CCWEB preview inside Playwright Docker image, output ccweb-preview.mp4 to /out on host.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
docker run --rm \
  -v "$ROOT:/work" \
  -w /work \
  -e CI=1 \
  mcr.microsoft.com/playwright:v1.51.0-jammy \
  bash -lc '
    set -e
    cd /work
    npm ci
    npx playwright install chromium
    npm run record:preview
    ./scripts/finish-preview-video.sh /work/ccweb-preview.mp4
    ls -lh /work/ccweb-preview.mp4
  '
echo "Wrote: $ROOT/ccweb-preview.mp4"
