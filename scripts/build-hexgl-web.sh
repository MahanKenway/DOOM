#!/usr/bin/env bash
# Package the browser-native HexGL runtime with all playable assets local.
# The selected revision is a verified MIT-code source snapshot. Individual
# files with a different licence (notably ShipControls.js) are retained with
# their upstream notices; RetroPlay deploys this runtime non-commercially.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CACHE_DIR="${HEXGL_CACHE_DIR:-$ROOT_DIR/.cache/hexgl-web}"
SOURCE_DIR="$CACHE_DIR/HexGL"
OUT_DIR="$ROOT_DIR/dist/hexgl"
HEXGL_REPO="https://github.com/BKcore/HexGL.git"
HEXGL_COMMIT="6addc95a2fce3bf05f4d751823cc054c61a16d68"

mkdir -p "$CACHE_DIR"

if [[ ! -d "$SOURCE_DIR/.git" ]]; then
  rm -rf "$SOURCE_DIR"
  timeout 180 git clone --filter=blob:none "$HEXGL_REPO" "$SOURCE_DIR"
fi

git -C "$SOURCE_DIR" fetch --depth=1 origin "$HEXGL_COMMIT"
git -C "$SOURCE_DIR" checkout --detach "$HEXGL_COMMIT"
test "$(git -C "$SOURCE_DIR" rev-parse HEAD)" = "$HEXGL_COMMIT"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"
cp -a "$SOURCE_DIR"/. "$OUT_DIR"/
rm -rf "$OUT_DIR/.git" "$OUT_DIR/package.zip"

# Make the bundled copy completely local-only. The game itself needs no remote
# resource: the old public release merely added analytics and remote icons.
sed -i \
  -e '/^[[:space:]]*<link rel="icon" href="http:\/\/hexgl\.bkcore\.com\/favicon\.png"/d' \
  -e '/^[[:space:]]*<link rel="shortcut icon" href="http:\/\/hexgl\.bkcore\.com\/favicon\.png"/d' \
  -e '/^[[:space:]]*<script type="text\/javascript">/,/^[[:space:]]*<\/script>/d' \
  -e '/^[[:space:]]*<meta property="og:image"/d' \
  -e 's#http://hexgl\\.bkcore\\.com/#https://mahankenway.github.io/RetroPlay/hexgl.html#g' \
  "$OUT_DIR/index.html"
sed -i "s#window.location.href = 'http://get.webgl.org/';#console.warn('WebGL unavailable');#g" "$OUT_DIR/launch.js"

cat > "$OUT_DIR/retroplay-loader.js" <<'LOADER'
// RetroPlay integration: a runtime path starts the bundled race directly.
// This file does not download assets or contact external services.
(function () {
  if (new URLSearchParams(location.search).get('autostart') !== '1') return;
  window.addEventListener('load', function () {
    window.setTimeout(function () {
      var start = document.getElementById('start');
      var continueButton = document.getElementById('step-2');
      if (!start || !continueButton || !start.onclick) return;
      start.click();
      window.setTimeout(function () { continueButton.click(); }, 0);
    }, 80);
  });
}());
LOADER
sed -i '/<script src="launch.js"><\/script>/a\    <script src="retroplay-loader.js"></script>' "$OUT_DIR/index.html"

# Full-text source and licence notices stay beside the independently runnable
# game so the static deployment fulfils the package attribution requirements.
cp "$SOURCE_DIR/LICENSE" "$OUT_DIR/HEXGL-MIT-LICENSE.txt"
cp "$SOURCE_DIR/audio/LICENSE" "$OUT_DIR/HEXGL-AUDIO-LICENSE.txt"
cat > "$OUT_DIR/SOURCE-NOTICE.txt" <<NOTICE
HexGL runtime packaged for RetroPlay

Upstream repository: https://github.com/BKcore/HexGL
Pinned revision: $HEXGL_COMMIT
Upstream project: https://hexgl.bkcore.com/

The upstream root LICENSE is MIT. Some individual files retain their own
upstream notices, including bkcore/hexgl/ShipControls.js (CC BY-NC 3.0) and
the audio attribution terms in HEXGL-AUDIO-LICENSE.txt. RetroPlay distributes
this runtime on a non-commercial basis and retains these files verbatim.

Packaging changes: no gameplay files are fetched from third parties at runtime;
the legacy Google Analytics loader and remote favicon references were removed
from the copied index.html. HexGL's game assets, scripts and audio are all
served from this directory.
NOTICE

# Fail closed if the only two legacy remote loads were not removed.
if grep -nE 'google-analytics\\.com|hexgl\\.bkcore\\.com/favicon\\.png|get\\.webgl\\.org' "$OUT_DIR/index.html" "$OUT_DIR/launch.js"; then
  echo 'FATAL: HexGL still contains a legacy external load.' >&2
  exit 1
fi
for required in index.html launch.js retroplay-loader.js LICENSE HEXGL-MIT-LICENSE.txt HEXGL-AUDIO-LICENSE.txt SOURCE-NOTICE.txt textures geometries audio; do
  test -e "$OUT_DIR/$required" || { echo "FATAL: HexGL asset missing: $required" >&2; exit 1; }
done

echo 'HexGL static runtime packaged:'
du -sh "$OUT_DIR"
