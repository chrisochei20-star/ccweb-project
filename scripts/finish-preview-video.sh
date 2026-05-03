#!/usr/bin/env bash
# Find latest Playwright test video and transcode to ccweb-preview.mp4 (H.264 1080p, web-optimized).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
shopt -s nullglob
VIDEOS=( test-results/**/*.webm )
if [[ ${#VIDEOS[@]} -eq 0 ]]; then
  echo "No webm found under test-results/. Run: CI=1 npm run record:preview" >&2
  exit 1
fi
# newest file
SRC="$(ls -t "${VIDEOS[@]}" | head -1)"
OUT="${1:-$ROOT/ccweb-preview.mp4}"
echo "Source: $SRC"
echo "Output: $OUT"
ffmpeg -y -i "$SRC" \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \
  -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -movflags +faststart \
  -an \
  "$OUT"
ls -lh "$OUT"
