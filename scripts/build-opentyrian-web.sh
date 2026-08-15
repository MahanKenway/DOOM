#!/usr/bin/env bash
# Build OpenTyrian2000 as an isolated WebAssembly runtime for RetroPlay.
# Source: aescarcha/opentyrian-wasm (GPLv2-or-later); data: documented freeware Tyrian 2000 archive.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK_DIR="${OPENTYRIAN_WORK_DIR:-$ROOT_DIR/.cache/opentyrian-web}"
OUTPUT_DIR="${OPENTYRIAN_OUTPUT_DIR:-$ROOT_DIR/dist/opentyrian}"
SOURCE_REPO="aescarcha/opentyrian-wasm"
DATA_ARCHIVE="https://www.camanis.net/tyrian/tyrian2000.zip"

SOURCE_DIR="$WORK_DIR/source"
DATA_DIR="$WORK_DIR/data"

command -v emcc >/dev/null
command -v gh >/dev/null
command -v unzip >/dev/null

rm -rf "$WORK_DIR" "$OUTPUT_DIR"
mkdir -p "$WORK_DIR" "$OUTPUT_DIR"

gh repo clone "$SOURCE_REPO" "$SOURCE_DIR" -- --depth 1
curl -fL --retry 2 --connect-timeout 20 "$DATA_ARCHIVE" -o "$WORK_DIR/tyrian2000.zip"
unzip -q "$WORK_DIR/tyrian2000.zip" -d "$DATA_DIR"

test -f "$SOURCE_DIR/COPYING"
test -f "$DATA_DIR/tyrian2000/tyrian1.lvl"
test -f "$DATA_DIR/tyrian2000/tyrian.snd"

# A missing save is normal on first launch. Retain save loading but avoid an engine warning
# before OpenTyrian creates and syncs its initial browser-local state.
sed -i 's/dir_fopen_warn(get_user_directory(), "opentyrian.cfg", "r")/dir_fopen(get_user_directory(), "opentyrian.cfg", "r")/' "$SOURCE_DIR/src/config.c"
sed -i 's/dir_fopen_warn(get_user_directory(), "tyrian.cfg", "rb")/dir_fopen(get_user_directory(), "tyrian.cfg", "rb")/' "$SOURCE_DIR/src/config.c"
sed -i 's/dir_fopen_warn(get_user_directory(), "tyrian.sav", "rb")/dir_fopen(get_user_directory(), "tyrian.sav", "rb")/' "$SOURCE_DIR/src/config.c"
# The default config path is expected during a new browser session; keep defaults but omit the desktop diagnostic.
sed -i '/Invalid or missing TYRIAN.CFG/i #ifndef __EMSCRIPTEN__' "$SOURCE_DIR/src/config.c"
sed -i '/Invalid or missing TYRIAN.CFG/a #endif /* __EMSCRIPTEN__ */' "$SOURCE_DIR/src/config.c"

# The browser fork contains Emscripten-specific virtual data and IndexedDB-save paths.
# Asyncify is required because it waits for the initial IDBFS sync before entering the game loop.
emcc \
  -std=gnu99 -O2 -DNDEBUG -DTARGET_EMSCRIPTEN \
  -sUSE_SDL=2 \
  -sASYNCIFY -sASYNCIFY_STACK_SIZE=262144 -sSTACK_SIZE=1048576 \
  -sINITIAL_MEMORY=67108864 -sALLOW_MEMORY_GROWTH=1 -sALLOW_TABLE_GROWTH=1 \
  -sFORCE_FILESYSTEM=1 -sNO_EXIT_RUNTIME=1 \
  -lidbfs.js \
  --preload-file "$DATA_DIR/tyrian2000@/data" \
  -o "$OUTPUT_DIR/opentyrian.js" \
  "$SOURCE_DIR"/src/*.c

cp "$SOURCE_DIR/COPYING" "$OUTPUT_DIR/ENGINE-COPYING.txt"
cp "$DATA_DIR/tyrian2000/readme.txt" "$OUTPUT_DIR/DATA-README.txt"
printf '%s\n' "Source repository: https://github.com/$SOURCE_REPO" > "$OUTPUT_DIR/SOURCE-NOTICE.txt"
printf '%s\n' "Game data archive: $DATA_ARCHIVE" >> "$OUTPUT_DIR/SOURCE-NOTICE.txt"

for artifact in opentyrian.js opentyrian.wasm opentyrian.data ENGINE-COPYING.txt DATA-README.txt SOURCE-NOTICE.txt; do
  test -s "$OUTPUT_DIR/$artifact"
done
ls -lh "$OUTPUT_DIR"/opentyrian.{js,wasm,data}
