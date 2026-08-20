#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE="$ROOT/third_party/backdooms"
OUTPUT="$ROOT/backdooms"

for required in LICENSE README.md THE-BACKDOOMS.html SANITIZATION-NOTICE.md; do
  test -f "$SOURCE/$required" || { echo "FATAL: missing Backdooms source file: $required" >&2; exit 1; }
done

rm -rf "$OUTPUT"
mkdir -p "$OUTPUT"
cp "$SOURCE/THE-BACKDOOMS.html" "$OUTPUT/index.html"
cp "$SOURCE/LICENSE" "$OUTPUT/BACKDOOMS-MIT-LICENSE.md"
cp "$SOURCE/README.md" "$OUTPUT/UPSTREAM-README.md"

# The upstream project's public page adds Google Analytics and ships an
# attribution note identifying its bundled music as an 8-bit Undertale track.
# RetroPlay deliberately distributes neither. All visual/gameplay elements are
# procedural Canvas code already present in THE-BACKDOOMS.html.
perl -0pi -e 's@\s*<!-- Google tag \(gtag\.js\) -->\s*<script[^>]*googletagmanager[^>]*></script>\s*<script>\s*window\.dataLayer\b.*?</script>@@s' "$OUTPUT/index.html"
# The upstream native touch branch continuously overwrites keyboard state on
# touch-capable browsers. RetroPlay replaces it with its shared PSP controls.
perl -0pi -e 's@\s*/\* Mobile controls styles - fixed version \*/.*?\@media \(pointer:coarse\) and \(hover:none\)\{\.m\{display:flex\}\.j\{display:block\}\}@@s' "$OUTPUT/index.html"
perl -0pi -e 's@\s*<!-- Mobile controls HTML - fixed version -->.*?(?=\s*<script>)@@s' "$OUTPUT/index.html"
perl -0pi -e 's@\s*// Define mobile variables.*?(?=\s*// Click/tap handler)@@s' "$OUTPUT/index.html"
perl -0pi -e 's@\s*// Mobile controls setup - fixed version.*?(?=\s*// Start the game loop)@@s' "$OUTPUT/index.html"
sed -i \
  -e '/    <audio id="bgm">/d' \
  -e "/document.addEventListener('click'.*bgm.*$/d" \
  -e '/    \/\/ BGM loop playback rate drop/d' \
  -e '/    var bgm=.*$/d' \
  -e '/    bgm.addEventListener.*$/d' \
  -e '/document.getElementById('\''bgm'\'').playbackRate=0.3/d' \
  -e 's/h\.fillText("Press F5",160,130),$/h.fillText("Press F5",160,130))/' \
  "$OUTPUT/index.html"

cat > "$OUTPUT/SOURCE-NOTICE.txt" <<'NOTICE'
Backdooms runtime provenance
=============================

Upstream project: https://github.com/Kuberwastaken/backdooms
Pinned upstream commit: ed2dd50c8ad09d1ae521f2b7b8931cd339fbc513
Upstream copyright: Copyright (c) 2025 Kuber Mehta
License: MIT (see BACKDOOMS-MIT-LICENSE.md)

RetroPlay packaging changes:
- Retained the self-contained procedural Canvas raycasting game code.
- Removed Google Analytics markup and calls.
- Removed the upstream audio element and all BGM playback code.
- Did not copy Game-Music.mp3, Game-Music.WAV, the upstream favicon, or any
  other media asset. The packaged runtime has no remote fetches and no audio.
- Removed the upstream native mobile-control overlay because its touch branch
  overwrites keyboard state every frame on touch-capable browsers. The separate
  RetroPlay wrapper supplies PSP-style touch controls, standard gamepad mapping,
  runtime status, and fullscreen resizing.
NOTICE

# The shipped game document must be local-only. Do not treat this check as a
# license audit for accompanying attribution text: it applies only to code the
# player opens.
if grep -nE 'https?://|<audio|Game-Music|gtag' "$OUTPUT/index.html"; then
  echo "FATAL: remote or excluded media reference remained in Backdooms runtime" >&2
  exit 1
fi
if grep -q "bgm" "$OUTPUT/index.html"; then
  echo "FATAL: excluded audio logic remained in Backdooms runtime" >&2
  exit 1
fi
CHECK_FILE="$(mktemp --suffix=.js)"
trap 'rm -f "$CHECK_FILE"' EXIT
awk '/<script>/{capture=1; next} /<\/script>/{capture=0; next} capture {print}' "$OUTPUT/index.html" > "$CHECK_FILE"
node --check "$CHECK_FILE" || {
  echo "FATAL: sanitised Backdooms gameplay script is not valid JavaScript" >&2
  exit 1
}

test -s "$OUTPUT/index.html"
test -s "$OUTPUT/BACKDOOMS-MIT-LICENSE.md"
test -s "$OUTPUT/SOURCE-NOTICE.txt"
printf 'Backdooms package: %s\n' "$OUTPUT"
