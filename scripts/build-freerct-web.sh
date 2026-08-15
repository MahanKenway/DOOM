#!/usr/bin/env bash
# Build a fully bundled FreeRCT WebAssembly runtime for RIFTWAD.
# FreeRCT is a GPL-2.0-only, clean-room theme-park strategy game with its own free data.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK_DIR="${FREERCT_WORK_DIR:-$ROOT_DIR/.cache/freerct-web}"
OUTPUT_DIR="${FREERCT_OUTPUT_DIR:-$ROOT_DIR/dist/freerct}"

SOURCE_REPO="https://github.com/freerct/freerct.git"
SOURCE_COMMIT="d532ee693d1a747bb6f89a9044a958d63af9ecd4"

EMSDK_ENV=""
if [[ -f "$ROOT_DIR/emsdk/emsdk_env.sh" ]]; then
  EMSDK_ENV="$ROOT_DIR/emsdk/emsdk_env.sh"  # GitHub Actions cache location.
elif [[ -f "/home/ubuntu/emsdk/emsdk_env.sh" ]]; then
  EMSDK_ENV="/home/ubuntu/emsdk/emsdk_env.sh"  # Local validation location.
fi
if [[ -n "$EMSDK_ENV" ]]; then
  # shellcheck disable=SC1090
  source "$EMSDK_ENV" >/dev/null
fi

for command in git cmake emcc em++ python3; do
  command -v "$command" >/dev/null
done

rm -rf "$WORK_DIR" "$OUTPUT_DIR"
mkdir -p "$WORK_DIR" "$OUTPUT_DIR"

git init -q "$WORK_DIR/source"
git -C "$WORK_DIR/source" remote add origin "$SOURCE_REPO"
git -C "$WORK_DIR/source" fetch --depth 1 origin "$SOURCE_COMMIT"
git -C "$WORK_DIR/source" checkout -q --detach FETCH_HEAD

cmake -S "$WORK_DIR/source" -B "$WORK_DIR/build" \
  -DWEBASSEMBLY=ON \
  -DRELEASE=ON \
  -DCMAKE_BUILD_TYPE=Release
cmake --build "$WORK_DIR/build" --parallel 4

for artifact in freerct.js freerct.wasm freerct.data; do
  test -s "$WORK_DIR/build/bin/$artifact"
  cp "$WORK_DIR/build/bin/$artifact" "$OUTPUT_DIR/$artifact"
done

cp "$WORK_DIR/source/LICENSE-gpl-2.0.txt" "$OUTPUT_DIR/ENGINE-COPYING.txt"
cat > "$OUTPUT_DIR/SOURCE-NOTICE.txt" <<EOF
FreeRCT WebAssembly source: https://github.com/freerct/freerct
Pinned source commit: $SOURCE_COMMIT
Engine and bundled game-data license: GPL-2.0-only (see ENGINE-COPYING.txt)

RIFTWAD profile: FreeRCT is compiled with its upstream WEBASSEMBLY CMake option.
The produced freerct.data package contains the game's clean-room graphics, rides,
scenery, RCD data, fonts, shaders and runtime data generated from the source tree.
No RollerCoaster Tycoon, OpenRCT2, proprietary game data, user upload or account is
used or requested. Saves are stored locally by the RIFTWAD browser shell.
EOF

for artifact in freerct.js freerct.wasm freerct.data ENGINE-COPYING.txt SOURCE-NOTICE.txt; do
  test -s "$OUTPUT_DIR/$artifact"
done

printf 'FreeRCT runtime packaged in: %s\n' "$OUTPUT_DIR"
du -sh "$OUTPUT_DIR"
ls -lh "$OUTPUT_DIR"/freerct.{js,wasm,data}
