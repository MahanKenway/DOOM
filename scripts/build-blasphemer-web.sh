#!/usr/bin/env bash
# Build Chocolate Heretic + Blasphemer as a fully bundled WebAssembly runtime.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CACHE_DIR="${BLASPHEMER_CACHE_DIR:-$ROOT_DIR/.cache/blasphemer-web}"
SOURCE_DIR="$CACHE_DIR/chocolate-doom"
RELEASE_DIR="$CACHE_DIR/release"
OUT_DIR="${BLASPHEMER_OUTPUT_DIR:-$ROOT_DIR/dist/blasphemer}"
PATCH_FILE="$ROOT_DIR/scripts/patches/chocolate-heretic-retroplay.patch"

CHOCOLATE_REPO="chocolate-doom/chocolate-doom"
CHOCOLATE_COMMIT="353cf5001dfd5777c13327010fa58acb57b913b2"
BLASPHEMER_REPO="Blasphemer/blasphemer"
BLASPHEMER_TAG="v0.1.8"
BLASPHEMER_ARCHIVE="blasphem-0.1.8.zip"
BLASPHEMER_WAD_SHA256="e9ed3f53cb011f1ae897b66fcfe46692c8c2d73e147bbe1e36a9bf1f79a4cc63"

command -v gh >/dev/null
command -v emcc >/dev/null
command -v emconfigure >/dev/null
command -v emmake >/dev/null
command -v autoreconf >/dev/null
command -v unzip >/dev/null
command -v sha256sum >/dev/null

test -f "$PATCH_FILE"
# The local sandbox uses a writable Emscripten cache configuration; GitHub
# Actions has the standard SDK cache and leaves EM_CONFIG unset.
if [[ -z "${EM_CONFIG:-}" && -f "$HOME/emscripten-hyper.config" ]]; then
  export EM_CONFIG="$HOME/emscripten-hyper.config"
fi
rm -rf "$CACHE_DIR" "$OUT_DIR"
mkdir -p "$CACHE_DIR" "$RELEASE_DIR" "$OUT_DIR"

gh repo clone "$CHOCOLATE_REPO" "$SOURCE_DIR" -- --filter=blob:none
(
  cd "$SOURCE_DIR"
  git checkout --detach "$CHOCOLATE_COMMIT"
  test "$(git rev-parse HEAD)" = "$CHOCOLATE_COMMIT"
  git apply --check "$PATCH_FILE"
  git apply "$PATCH_FILE"
  autoreconf -fiv
  ac_cv_exeext=.html LDFLAGS='-sINVOKE_RUN=1' \
    emconfigure ./configure --host=none-none-none --enable-emscripten

  # Build only the libraries and game target required by Chocolate Heretic.
  emmake make -C textscreen -j2
  emmake make -C pcsound -j2
  emmake make -C opl -j2
  emmake make -C src/heretic -j2
  emmake make -C src -j2 chocolate-heretic.html
)

curl -fsSL --retry 3 --retry-all-errors \
  "https://github.com/Blasphemer/blasphemer/releases/download/$BLASPHEMER_TAG/$BLASPHEMER_ARCHIVE" \
  -o "$RELEASE_DIR/$BLASPHEMER_ARCHIVE"
test -s "$RELEASE_DIR/$BLASPHEMER_ARCHIVE"
unzip -p "$RELEASE_DIR/$BLASPHEMER_ARCHIVE" blasphem.wad > "$OUT_DIR/heretic.wad"
test -s "$OUT_DIR/heretic.wad"

if [[ -n "$BLASPHEMER_WAD_SHA256" ]]; then
  printf '%s  %s\n' "$BLASPHEMER_WAD_SHA256" "$OUT_DIR/heretic.wad" | sha256sum -c -
fi

cp "$SOURCE_DIR/src/chocolate-heretic.js" "$OUT_DIR/chocolate-heretic.js"
cp "$SOURCE_DIR/src/chocolate-heretic.wasm" "$OUT_DIR/chocolate-heretic.wasm"
cp "$SOURCE_DIR/COPYING.md" "$OUT_DIR/CHOCOLATE-DOOM-COPYING.txt"
curl -fsSL --retry 2 "https://raw.githubusercontent.com/Blasphemer/blasphemer/$BLASPHEMER_TAG/COPYING.md" \
  -o "$OUT_DIR/BLASPHEMER-COPYING.txt"
curl -fsSL --retry 2 "https://raw.githubusercontent.com/Blasphemer/blasphemer/$BLASPHEMER_TAG/CREDITS.md" \
  -o "$OUT_DIR/BLASPHEMER-CREDITS.md"

cat > "$OUT_DIR/SOURCE-NOTICE.txt" <<EOF
Blasphemer WebAssembly runtime for RetroPlay

Engine: Chocolate Heretic from https://github.com/$CHOCOLATE_REPO
Pinned engine commit: $CHOCOLATE_COMMIT
Bundled game data: Blasphemer $BLASPHEMER_TAG from https://github.com/$BLASPHEMER_REPO
Release archive: $BLASPHEMER_ARCHIVE

The engine and bundled Blasphemer data are distributed under GPL-2.0-or-later.
RetroPlay packages a browser-specific build patch that starts the first-load
session silently for mobile compatibility and runs the native frame loop through
Emscripten. No original Heretic data, uploads, external level downloads or
player-supplied files are included or required.
EOF

test -s "$OUT_DIR/chocolate-heretic.js"
test -s "$OUT_DIR/chocolate-heretic.wasm"
test -s "$OUT_DIR/heretic.wad"
test -s "$OUT_DIR/CHOCOLATE-DOOM-COPYING.txt"
test -s "$OUT_DIR/BLASPHEMER-COPYING.txt"
test -s "$OUT_DIR/BLASPHEMER-CREDITS.md"
test -s "$OUT_DIR/SOURCE-NOTICE.txt"

printf 'Blasphemer WebAssembly build ready:\n'
ls -lh "$OUT_DIR"/{chocolate-heretic.js,chocolate-heretic.wasm,heretic.wad,CHOCOLATE-DOOM-COPYING.txt,BLASPHEMER-COPYING.txt,BLASPHEMER-CREDITS.md,SOURCE-NOTICE.txt}
