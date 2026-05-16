#!/usr/bin/env bash
# Generate ~120s 1920x1080 H.264 MP4 for CCWEB demo (title cards).
set -euo pipefail
FONT="${FONT:-/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf}"
OUT="${1:-/tmp/ccweb-app-demo-1080p.mp4}"
WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

# duration per slide (seconds) — 20 × 6 = 120s
DUR=6
declare -a SLIDES=(
  "CCWEB — Latest build demo"
  "1 · Login & sign-up"
  "Email + password · Bearer sessions"
  "2 · Profile & dashboard"
  "Your overview & pillar shortcuts"
  "3 · Learn — Courses & AI tutor"
  "4 · AI Streaming — Live rooms"
  "5 · Find — Crypto intelligence"
  "Scanner · Early Signals · Alerts"
  "6 · Token detail page"
  "Scores · chart · smart money"
  "7 · Build — DApp builder"
  "8 · AI Agents hub"
  "9 · Earn — affiliates & revenue"
  "10 · Community & notifications"
  "11 · Mobile — Capacitor ready"
  "12 · APIs — auth & intelligence"
  "Signals only — not financial advice"
  "github.com/chrisochei20-star/ccweb-project"
  "Tap link on phone to download MP4"
)

i=0
for txt in "${SLIDES[@]}"; do
  esc=$(printf '%s' "$txt" | sed "s/'/'\\\\\\''/g")
  ffmpeg -y -f lavfi -i "color=c=0x040a1a:s=1920x1080:d=${DUR}" \
    -vf "drawtext=fontfile=${FONT}:text='${esc}':fontsize=52:fontcolor=0x11d4ff:x=(w-text_w)/2:y=(h-text_h)/2-40:box=1:boxcolor=0x000000@0.6:boxborderw=20,\
drawtext=fontfile=${FONT}:text='CCWEB — Learn · Find · Build · Earn':fontsize=28:fontcolor=0x8ca3c4:x=(w-text_w)/2:y=h-120" \
    -c:v libx264 -pix_fmt yuv420p -preset medium -crf 24 -r 30 -movflags +faststart \
    "$WORKDIR/s$(printf '%02d' "$i").mp4" 2>/dev/null
  i=$((i + 1))
done

printf "file '%s'\n" "$WORKDIR"/s*.mp4 > "$WORKDIR/list.txt"
ffmpeg -y -f concat -safe 0 -i "$WORKDIR/list.txt" -c copy "$OUT"
ls -lh "$OUT"
ffprobe -v error -show_entries format=duration,size -of default=nw=1:nk=1 "$OUT" | paste - - | awk '{printf "duration_sec=%s size_bytes=%s\n",$1,$2}'
