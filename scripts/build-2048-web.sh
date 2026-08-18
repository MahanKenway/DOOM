#!/usr/bin/env bash
# Package the original 2048 HTML5 implementation as a local MIT runtime.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CACHE_DIR="${RETRO2048_CACHE_DIR:-$ROOT_DIR/.cache/2048-web}"
SOURCE_DIR="$CACHE_DIR/2048"
OUT_DIR="$ROOT_DIR/dist/2048"
GAME_REPO="https://github.com/gabrielecirulli/2048.git"
GAME_COMMIT="478b6ec346e3787f589e4af751378d06ded4cbbc"

mkdir -p "$CACHE_DIR"
if [[ ! -d "$SOURCE_DIR/.git" ]]; then
  rm -rf "$SOURCE_DIR"
  timeout 180 git clone --filter=blob:none "$GAME_REPO" "$SOURCE_DIR"
fi

git -C "$SOURCE_DIR" fetch --depth=1 origin "$GAME_COMMIT"
git -C "$SOURCE_DIR" checkout --detach "$GAME_COMMIT"
test "$(git -C "$SOURCE_DIR" rev-parse HEAD)" = "$GAME_COMMIT"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"
cp -a "$SOURCE_DIR"/. "$OUT_DIR"/
rm -rf "$OUT_DIR/.git" "$OUT_DIR/.github" "$OUT_DIR/.gitignore" "$OUT_DIR/README.md" "$OUT_DIR/CONTRIBUTING.md" "$OUT_DIR/Rakefile" "$OUT_DIR/style/main.scss" "$OUT_DIR/style/helpers.scss"

# The original footer points to stores and external sites. Attribution and legal
# information remain in the included MIT license and source notice instead.
sed -i '79,85c\    <p class="game-explanation">RetroPlay bundles this free browser version locally. Use arrow keys, a swipe or the PSP controls outside the play area.</p>' "$OUT_DIR/index.html"
cp "$SOURCE_DIR/LICENSE.txt" "$OUT_DIR/2048-MIT.txt"
cat > "$OUT_DIR/SOURCE-NOTICE.txt" <<NOTICE
2048 runtime packaged for RetroPlay

Upstream repository: https://github.com/gabrielecirulli/2048
Pinned revision: $GAME_COMMIT
Upstream project: https://gabrielecirulli.github.io/2048/

2048 is licensed under MIT. The full upstream license is included at
2048-MIT.txt. The corresponding source is available from the repository above;
RetroPlay's packaging script is scripts/build-2048-web.sh.

The package keeps all upstream HTML, JavaScript, Clear Sans webfonts and mobile
swipe input local. External promotional/store links in the upstream footer were
removed; score and game state stay in browser local storage.
NOTICE

if grep -RInE 'https?://' "$OUT_DIR/index.html" "$OUT_DIR/js" "$OUT_DIR/style/main.css"; then
  echo 'FATAL: 2048 runtime still references a remote service.' >&2
  exit 1
fi
for required in index.html js/application.js js/keyboard_input_manager.js style/main.css style/fonts/ClearSans-Regular-webfont.woff 2048-MIT.txt SOURCE-NOTICE.txt; do
  test -e "$OUT_DIR/$required" || { echo "FATAL: 2048 asset missing: $required" >&2; exit 1; }
done

echo '2048 static runtime packaged:'
du -sh "$OUT_DIR"
