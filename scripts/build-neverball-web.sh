#!/usr/bin/env bash
# Build Neverball as a fully bundled WebAssembly runtime for RetroPlay.
# Uses the upstream Emscripten route and packages the official base/easy-set data.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CACHE_DIR="${NEVERBALL_CACHE_DIR:-$ROOT_DIR/.cache/neverball-web}"
SOURCE_DIR="$CACHE_DIR/source"
GL4ES_DIR="$CACHE_DIR/gl4es"
GL4ES_BUILD_DIR="$GL4ES_DIR/build"
PACKAGE_DIR="$CACHE_DIR/packages"
OUT_DIR="${NEVERBALL_OUTPUT_DIR:-$ROOT_DIR/dist/neverball}"

NEVERBALL_REPO="Neverball/neverball"
NEVERBALL_COMMIT="6fd419cfc0896d70d2d1d69c67ef97d827b4bd14"
GL4ES_REPO="ptitSeb/gl4es"
GL4ES_COMMIT="c9895df34cd466c23bc60c2bd3db3d87e98fcbe7"

command -v gh >/dev/null
command -v emcc >/dev/null
command -v emcmake >/dev/null
command -v cmake >/dev/null
command -v make >/dev/null
command -v zip >/dev/null

rm -rf "$CACHE_DIR" "$OUT_DIR"
mkdir -p "$CACHE_DIR" "$PACKAGE_DIR" "$OUT_DIR"

# These packages match the maintained upstream web workflow. The native SOL
# prebuild is needed before compiling Neverball itself to WebAssembly.
timeout 180 sudo apt-get update -qq -o Acquire::Retries=2 -o Acquire::http::Timeout=30 -o Acquire::https::Timeout=30
timeout 300 sudo apt-get install -y -qq libpng-dev libjpeg-dev pkg-config libsdl2-dev libcurl4-openssl-dev ffmpeg
command -v ffmpeg >/dev/null

timeout 180 gh repo clone "$NEVERBALL_REPO" "$SOURCE_DIR" -- --filter=blob:none
(
  cd "$SOURCE_DIR"
  git checkout --detach "$NEVERBALL_COMMIT"
  test "$(git rev-parse HEAD)" = "$NEVERBALL_COMMIT"
)

timeout 180 gh repo clone "$GL4ES_REPO" "$GL4ES_DIR" -- --filter=blob:none
(
  cd "$GL4ES_DIR"
  git checkout --detach "$GL4ES_COMMIT"
  test "$(git rev-parse HEAD)" = "$GL4ES_COMMIT"
)

# Build Neverball's native SOL tools, then the static WebGL translation layer.
make -C "$SOURCE_DIR" -j2 sols
emcmake cmake -S "$GL4ES_DIR" -B "$GL4ES_BUILD_DIR" \
  -DCMAKE_BUILD_TYPE=RelWithDebInfo \
  -DNOX11=ON \
  -DNOEGL=ON \
  -DSTATICLIB=ON
emmake make -C "$GL4ES_BUILD_DIR" -j2

# This creates neverball.js, neverball.wasm and a preloaded data file containing
# the libre base game. The official Easy and Medium level sets are separately
# packaged and copied into browser-local storage at first launch by neverball.html.
make -C "$SOURCE_DIR" -f emscripten/ball.mk BUILD=release GL4ES_DIR="$GL4ES_DIR"
for SET_NAME in easy medium; do
  make -C "$SOURCE_DIR" -f mk/package-levelset.mk \
    ADDON_SET=0 \
    PACKAGE_ID="set-$SET_NAME" \
    SET_FILE="data/set-$SET_NAME.txt" \
    DATA_DIR=data \
    OUTPUT_DIR="$PACKAGE_DIR"
done

cp "$SOURCE_DIR/js/neverball.js" "$OUT_DIR/neverball.js"
cp "$SOURCE_DIR/js/neverball.wasm" "$OUT_DIR/neverball.wasm"
cp "$SOURCE_DIR/js/neverball.data" "$OUT_DIR/neverball.data"
for PACKAGE_ID in set-easy set-medium; do
  SET_ZIP="$(find "$PACKAGE_DIR" -maxdepth 1 -type f -name "$PACKAGE_ID-*.zip" | head -n1)"
  test -n "$SET_ZIP"
  test -s "$SET_ZIP"
  SET_FILENAME="$(basename "$SET_ZIP")"
  cp "$SET_ZIP" "$OUT_DIR/$SET_FILENAME"
  printf '{"filename":"%s"}\n' "$SET_FILENAME" > "$OUT_DIR/$PACKAGE_ID-package.json"
done
cp "$SOURCE_DIR/LICENSE.md" "$OUT_DIR/NEVERBALL-LICENSE.md"
cp -a "$SOURCE_DIR/doc/legal" "$OUT_DIR/LEGAL"
cat > "$OUT_DIR/SOURCE-NOTICE.txt" <<EOF
Neverball WebAssembly runtime for RetroPlay

Engine and game data source: https://github.com/$NEVERBALL_REPO
Pinned source revision: $NEVERBALL_COMMIT
WebGL translation layer: https://github.com/$GL4ES_REPO
Pinned gl4es revision: $GL4ES_COMMIT
Build route: the upstream Emscripten makefile (emscripten/ball.mk).

This distribution bundles Neverball's libre base data plus the official Easy
and Medium level-set packages compiled from the pinned source. It does not
download campaigns, accept add-ons, or request any game data from the player.
Saves and replay state stay in the browser's IndexedDB storage.
EOF

test -s "$OUT_DIR/neverball.js"
test -s "$OUT_DIR/neverball.wasm"
test -s "$OUT_DIR/neverball.data"
for PACKAGE_ID in set-easy set-medium; do
  test -s "$(find "$OUT_DIR" -maxdepth 1 -type f -name "$PACKAGE_ID-*.zip" | head -n1)"
  test -s "$OUT_DIR/$PACKAGE_ID-package.json"
done
test -s "$OUT_DIR/NEVERBALL-LICENSE.md"
test -d "$OUT_DIR/LEGAL"

printf 'Neverball WebAssembly build ready:\n'
ls -lh "$OUT_DIR"/neverball.{js,wasm,data} "$OUT_DIR"/set-{easy,medium}-*.zip "$OUT_DIR"/set-{easy,medium}-package.json
