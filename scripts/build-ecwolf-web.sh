#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CACHE_DIR="$ROOT_DIR/.cache/ecwolf-web"
SOURCE_DIR="$CACHE_DIR/source"
BUILD_DIR="$CACHE_DIR/build"
OUT_DIR="$ROOT_DIR/dist/ecwolf"
ECWOLF_REPO="54ac/ecwolf-js"
ECWOLF_COMMIT="7a635c89225686bab870513e3c4441f07585b473"

command -v emcmake >/dev/null
command -v emmake >/dev/null
command -v gh >/dev/null
command -v zip >/dev/null

rm -rf "$CACHE_DIR" "$OUT_DIR"
mkdir -p "$CACHE_DIR" "$OUT_DIR"

gh repo clone "$ECWOLF_REPO" "$SOURCE_DIR" -- --filter=blob:none
(
  cd "$SOURCE_DIR"
  git checkout --detach "$ECWOLF_COMMIT"
  test "$(git rev-parse HEAD)" = "$ECWOLF_COMMIT"
)

# Custom frontend mode exports a module factory; RetroPlay mounts the GPL engine PK3
# and a player-supplied lawful IWAD in its own browser VFS before calling main().
emcmake cmake -S "$SOURCE_DIR" -B "$BUILD_DIR" \
  -DEMSCRIPTEN_DEFAULT_FRONTEND=OFF \
  -DEMSCRIPTEN_DEBUG=OFF
emmake make -C "$BUILD_DIR" -j2

test -s "$BUILD_DIR/ecwolf.js"
test -s "$BUILD_DIR/ecwolf.wasm"

cp "$BUILD_DIR/ecwolf.js" "$OUT_DIR/ecwolf.js"
cp "$BUILD_DIR/ecwolf.wasm" "$OUT_DIR/ecwolf.wasm"
(
  cd "$SOURCE_DIR/wadsrc/static"
  zip -X -q -r "$OUT_DIR/ecwolf.pk3" .
)
cp "$SOURCE_DIR/docs/copyright" "$OUT_DIR/ECWOLF-COPYING.txt"
cat > "$OUT_DIR/SOURCE-NOTICE.txt" <<EOF
ECWolf WebAssembly runtime

Engine source: https://github.com/54ac/ecwolf-js
Pinned revision: $ECWOLF_COMMIT
Engine lineage: ECWolf / Wolf4SDL, GPL build configuration.

This distribution intentionally contains no Wolfenstein 3D, Spear of Destiny,
or other commercial/shareware game data. The browser page accepts only files
selected locally by a player who lawfully owns the compatible game data.
EOF

printf 'ECWolf WebAssembly build ready:\n'
ls -lh "$OUT_DIR"/ecwolf.{js,wasm,pk3}
