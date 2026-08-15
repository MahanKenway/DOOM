#!/usr/bin/env bash
# Build LibreQuake Lite on the Qwasm Quake engine as an isolated browser runtime for RIFTWAD.
# Engine: GMH-Code/Qwasm (GPL-2.0-or-later lineage). Game data: LibreQuake v0.09-beta Lite (free content).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK_DIR="${LIBREQUAKE_WORK_DIR:-$ROOT_DIR/.cache/librequake-web}"
OUTPUT_DIR="${LIBREQUAKE_OUTPUT_DIR:-$ROOT_DIR/dist/librequake}"
QWASM_REPO="GMH-Code/Qwasm"
LIBREQUAKE_REPO="lavenderdotpet/LibreQuake"
LIBREQUAKE_TAG="v0.09-beta"

SOURCE_DIR="$WORK_DIR/qwasm"
DATA_DIR="$WORK_DIR/data"

command -v emcc >/dev/null
command -v gh >/dev/null
command -v make >/dev/null
command -v unzip >/dev/null

rm -rf "$WORK_DIR" "$OUTPUT_DIR"
mkdir -p "$WORK_DIR" "$DATA_DIR" "$OUTPUT_DIR"

gh repo clone "$QWASM_REPO" "$SOURCE_DIR" -- --depth 1
gh release download "$LIBREQUAKE_TAG" --repo "$LIBREQUAKE_REPO" --pattern lite.zip --dir "$DATA_DIR"
unzip -q "$DATA_DIR/lite.zip" -d "$DATA_DIR"

test -f "$SOURCE_DIR/WinQuake/COPYING"
test -f "$DATA_DIR/lite/id1/pak0.pak"
test -f "$DATA_DIR/lite/id1/pak1.pak"
test -f "$DATA_DIR/lite/id1/docs/COPYING"
test -f "$DATA_DIR/lite/id1/docs/CREDITS"

# Qwasm expects all Quake-compatible content in WinQuake/id1 and packages it as index.data.
# The SDL window title otherwise changes the browser tab to the generic engine title.
sed -i 's/"Quake"/"LibreQuake"/g' "$SOURCE_DIR/WinQuake/vid_sdl.c"
sed -i 's/Cbuf_InsertText ("exec quake.rc\\n");/Cbuf_InsertText ("exec riftwad.cfg\\n");/' "$SOURCE_DIR/WinQuake/host.c"
rm -rf "$SOURCE_DIR/WinQuake/id1"
cp -a "$DATA_DIR/lite/id1" "$SOURCE_DIR/WinQuake/id1"
cat > "$SOURCE_DIR/WinQuake/id1/riftwad.cfg" <<'EOF'
// RIFTWAD browser profile: use only commands implemented by Qwasm/WinQuake.
name "RIFTWAD"
bind "ESCAPE" "togglemenu"
bind "`" "toggleconsole"
bind "UPARROW" "+forward"
bind "DOWNARROW" "+back"
bind "LEFTARROW" "+left"
bind "RIGHTARROW" "+right"
bind "CTRL" "+attack"
bind "ALT" "+strafe"
bind "SPACE" "+jump"
bind "]" "impulse 10"
bind "[" "impulse 12"
sensitivity "3"
volume "0.7"
skill "1"
map lq_e0m1
EOF

(
  cd "$SOURCE_DIR/WinQuake"
  make -f Makefile.emscripten
)

for artifact in index.js index.wasm index.data; do
  test -s "$SOURCE_DIR/WinQuake/$artifact"
  cp "$SOURCE_DIR/WinQuake/$artifact" "$OUTPUT_DIR/$artifact"
done

cp "$SOURCE_DIR/WinQuake/COPYING" "$OUTPUT_DIR/ENGINE-COPYING.txt"
cp "$DATA_DIR/lite/id1/docs/COPYING" "$OUTPUT_DIR/DATA-COPYING.txt"
cp "$DATA_DIR/lite/id1/docs/CREDITS" "$OUTPUT_DIR/DATA-CREDITS.txt"
cp "$DATA_DIR/lite/id1/docs/README.md" "$OUTPUT_DIR/DATA-README.md"
cat > "$OUTPUT_DIR/SOURCE-NOTICE.txt" <<EOF
Qwasm source: https://github.com/$QWASM_REPO
LibreQuake data: https://github.com/$LIBREQUAKE_REPO/releases/tag/$LIBREQUAKE_TAG
Runtime data profile: LibreQuake Lite (complete shorter, simplified free game data release)
EOF

for artifact in index.js index.wasm index.data ENGINE-COPYING.txt DATA-COPYING.txt DATA-CREDITS.txt DATA-README.md SOURCE-NOTICE.txt; do
  test -s "$OUTPUT_DIR/$artifact"
done
ls -lh "$OUTPUT_DIR"/index.{js,wasm,data}
