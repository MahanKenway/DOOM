#!/usr/bin/env bash
# Package JavaScript Tetris as a completely local MIT-licensed HTML5 runtime.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CACHE_DIR="${JSTETRIS_CACHE_DIR:-$ROOT_DIR/.cache/javascript-tetris-web}"
SOURCE_DIR="$CACHE_DIR/javascript-tetris"
OUT_DIR="$ROOT_DIR/dist/javascript-tetris"
JSTETRIS_REPO="https://github.com/jakesgordon/javascript-tetris.git"
JSTETRIS_COMMIT="e5c0c42f7dac0f3514a55eff656c6e22e95d68ed"

mkdir -p "$CACHE_DIR"
if [[ ! -d "$SOURCE_DIR/.git" ]]; then
  rm -rf "$SOURCE_DIR"
  timeout 180 git clone --filter=blob:none "$JSTETRIS_REPO" "$SOURCE_DIR"
fi

git -C "$SOURCE_DIR" fetch --depth=1 origin "$JSTETRIS_COMMIT"
git -C "$SOURCE_DIR" checkout --detach "$JSTETRIS_COMMIT"
test "$(git -C "$SOURCE_DIR" rev-parse HEAD)" = "$JSTETRIS_COMMIT"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"
cp "$SOURCE_DIR/index.html" "$SOURCE_DIR/stats.js" "$SOURCE_DIR/texture.jpg" "$OUT_DIR/"
cp "$SOURCE_DIR/LICENSE" "$OUT_DIR/JAVASCRIPT-TETRIS-MIT.txt"

# The upstream game is fully local. This loader starts a game only when opened
# by the RetroPlay wrapper's Play action; it does not alter game logic or fetch.
cat > "$OUT_DIR/retroplay-loader.js" <<'LOADER'
(function () {
  if (new URLSearchParams(location.search).get('autostart') !== '1') return;
  window.addEventListener('load', function () {
    window.setTimeout(function () {
      if (typeof window.play === 'function') window.play();
    }, 80);
  });
}());
LOADER
sed -i '/<\/body>/i\  <script src="retroplay-loader.js"></script>' "$OUT_DIR/index.html"

cat > "$OUT_DIR/SOURCE-NOTICE.txt" <<NOTICE
JavaScript Tetris runtime packaged for RetroPlay

Upstream repository: https://github.com/jakesgordon/javascript-tetris
Pinned revision: $JSTETRIS_COMMIT
Upstream game: https://jakesgordon.com/games/tetris/

JavaScript Tetris is licensed under MIT. The full upstream license is included
at JAVASCRIPT-TETRIS-MIT.txt. The corresponding source is available from the
upstream repository above; RetroPlay's packaging script is
scripts/build-javascript-tetris-web.sh.

The runtime uses only the upstream HTML, JavaScript and local texture image. The
small RetroPlay loader reads an autostart query flag and calls the upstream
play() function; it makes no network requests and preserves game behavior.
NOTICE

if grep -RInE 'src=[^>]*https?://|href=[^>]*https?://' "$OUT_DIR/index.html" "$OUT_DIR/stats.js" "$OUT_DIR/retroplay-loader.js"; then
  echo 'FATAL: JavaScript Tetris runtime still references a remote service.' >&2
  exit 1
fi
for required in index.html stats.js texture.jpg retroplay-loader.js JAVASCRIPT-TETRIS-MIT.txt SOURCE-NOTICE.txt; do
  test -f "$OUT_DIR/$required" || { echo "FATAL: JavaScript Tetris asset missing: $required" >&2; exit 1; }
done

echo 'JavaScript Tetris static runtime packaged:'
du -sh "$OUT_DIR"
