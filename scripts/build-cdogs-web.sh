#!/usr/bin/env bash
# Build the isolated C-Dogs SDL WebAssembly runtime used by RIFTWAD.
# Requires emcmake/emmake from the Emscripten SDK to already be on PATH.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_DIR="${CDOGS_SOURCE_DIR:-$ROOT_DIR/.cache/cdogs-sdl}"
BUILD_DIR="${CDOGS_BUILD_DIR:-$ROOT_DIR/.cache/cdogs-build-wasm}"
BOOTSTRAP_DIR="${CDOGS_BOOTSTRAP_DIR:-$ROOT_DIR/.cache/cdogs-web-bootstrap}"
OUTPUT_DIR="${CDOGS_OUTPUT_DIR:-$ROOT_DIR/dist/cdogs}"
PATCH_FILE="$ROOT_DIR/third_party/cdogs-web/cdogs-wasm.patch"
CDOGS_COMMIT="bb7e16ce765610d705f7c3e190ddcd4a81f3b371"

rm -rf "$SOURCE_DIR" "$BUILD_DIR" "$BOOTSTRAP_DIR"
mkdir -p "$(dirname "$SOURCE_DIR")" "$BOOTSTRAP_DIR" "$OUTPUT_DIR"

git clone --depth 1 https://github.com/cxong/cdogs-sdl.git "$SOURCE_DIR"
cd "$SOURCE_DIR"
git fetch --depth 1 origin "$CDOGS_COMMIT"
git checkout --detach "$CDOGS_COMMIT"
test "$(git rev-parse HEAD)" = "$CDOGS_COMMIT" || {
  echo "FATAL: expected C-Dogs SDL commit $CDOGS_COMMIT, got $(git rev-parse HEAD)" >&2
  exit 1
}
git apply --check "$PATCH_FILE"
git apply "$PATCH_FILE"

# Bundle the complete free game data required for browser gameplay, including
# campaign tiles, walls, doors, player sprites, particles, JSON and music.
# Blender authoring files are omitted because the runtime consumes only their
# exported game assets.
cp -a data "$BOOTSTRAP_DIR/data"
find "$BOOTSTRAP_DIR/data" -type f -name 'src.blend' -delete
cp -a graphics "$BOOTSTRAP_DIR/graphics"
find "$BOOTSTRAP_DIR/graphics" -type f -name 'src.blend' -delete
cp -a music missions dogfights "$BOOTSTRAP_DIR/"
mkdir -p "$BOOTSTRAP_DIR/doc"
cp -a doc/CREDITS "$BOOTSTRAP_DIR/doc/CREDITS"

LINK_FLAGS="-sUSE_SDL=2 -sUSE_SDL_IMAGE=2 -sSDL2_IMAGE_FORMATS='[\"png\"]' -sUSE_SDL_MIXER=2 -sSDL2_MIXER_FORMATS='[\"ogg\"]' -sSTACK_SIZE=131072 -sINITIAL_MEMORY=134217728 -sALLOW_MEMORY_GROWTH=1 -sFORCE_FILESYSTEM=1 -sNO_EXIT_RUNTIME=1 --preload-file $BOOTSTRAP_DIR/data@/data --preload-file $BOOTSTRAP_DIR/graphics@/graphics --preload-file $BOOTSTRAP_DIR/music@/music --preload-file $BOOTSTRAP_DIR/missions@/missions --preload-file $BOOTSTRAP_DIR/dogfights@/dogfights --preload-file $BOOTSTRAP_DIR/doc@/doc"

emcmake cmake -S . -B "$BUILD_DIR" \
  -DBUILD_EDITOR=OFF \
  -DBUILD_TESTING=OFF \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_MODULE_PATH="$SOURCE_DIR/cmake" \
  -DCMAKE_EXE_LINKER_FLAGS="$LINK_FLAGS"
emmake cmake --build "$BUILD_DIR" --target cdogs-sdl -j2

cp "$BUILD_DIR/src/cdogs-sdl.js" "$BUILD_DIR/src/cdogs-sdl.wasm" "$BUILD_DIR/src/cdogs-sdl.data" "$OUTPUT_DIR/"
test -s "$OUTPUT_DIR/cdogs-sdl.js"
test -s "$OUTPUT_DIR/cdogs-sdl.wasm"
test -s "$OUTPUT_DIR/cdogs-sdl.data"
ls -lh "$OUTPUT_DIR"/cdogs-sdl.{js,wasm,data}
