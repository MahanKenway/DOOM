#!/usr/bin/env bash
# Build GNU FreeDink as an isolated WebAssembly runtime for RIFTWAD.
# Requires Emscripten 3.1.51 and authenticated gh CLI to be on PATH.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK_DIR="${FREEDINK_WORK_DIR:-$ROOT_DIR/.cache/freedink-web}"
OUTPUT_DIR="${FREEDINK_OUTPUT_DIR:-$ROOT_DIR/dist/freedink}"
ENGINE_VERSION="109.6"
DATA_VERSION="1.08.20190120"
ENGINE_ARCHIVE="https://ftp.gnu.org/gnu/freedink/freedink-${ENGINE_VERSION}.tar.gz"
DATA_ARCHIVE="https://ftp.gnu.org/gnu/freedink/freedink-data-${DATA_VERSION}.tar.gz"
GLM_TAG="0.9.8.5"

ENGINE_DIR="$WORK_DIR/engine"
DATA_DIR="$WORK_DIR/data"
GLM_DIR="$WORK_DIR/glm"
PC_DIR="$WORK_DIR/pkgconfig"
BUILD_DIR="$WORK_DIR/build"
EMSCRIPTEN_ROOT="$(cd "$(dirname "$(command -v emcc)")" && pwd)"
SYSROOT="$EMSCRIPTEN_ROOT/cache/sysroot"

rm -rf "$WORK_DIR"
mkdir -p "$WORK_DIR" "$OUTPUT_DIR" "$PC_DIR"

curl -fsSL --retry 2 "$ENGINE_ARCHIVE" -o "$WORK_DIR/freedink.tar.gz"
curl -fsSL --retry 2 "$DATA_ARCHIVE" -o "$WORK_DIR/freedink-data.tar.gz"
tar -xzf "$WORK_DIR/freedink.tar.gz" -C "$WORK_DIR"
mv "$WORK_DIR/freedink-${ENGINE_VERSION}" "$ENGINE_DIR"
mkdir -p "$DATA_DIR"
tar -xzf "$WORK_DIR/freedink-data.tar.gz" -C "$DATA_DIR" --strip-components=1

# FreeDink's official historical web build used this GLM release. Pinning it
# avoids API changes in later GLM versions while retaining the upstream code.
gh api "repos/g-truc/glm/tarball/${GLM_TAG}" > "$WORK_DIR/glm.tar.gz"
mkdir -p "$GLM_DIR"
tar -xzf "$WORK_DIR/glm.tar.gz" -C "$GLM_DIR" --strip-components=1

test -f "$ENGINE_DIR/configure"
test -f "$DATA_DIR/README.txt"
test -f "$GLM_DIR/glm/glm.hpp"

# Modern Emscripten does not include gettext/libintl. The browser runtime is
# deliberately built without translations, while all non-browser targets keep
# FreeDink's original configure-time requirement unchanged.
sed -i 's/if test "$USE_NLS" = no; then/if test "$USE_NLS" = no \&\& test "$host" != "asmjs-unknown-emscripten"; then/' "$ENGINE_DIR/configure"
# SDL_ttf 2.22 correctly returns immutable names; text is only logged here.
sed -i 's/char \*familyname = TTF_FontFaceFamilyName(font);/const char *familyname = TTF_FontFaceFamilyName(font);/' "$ENGINE_DIR/src/gfx_fonts.cpp"
sed -i 's/char \*stylename = TTF_FontFaceStyleName(font);/const char *stylename = TTF_FontFaceStyleName(font);/' "$ENGINE_DIR/src/gfx_fonts.cpp"
# This Android-only hint is absent from Emscripten's SDL2 headers.
sed -i '/SDL_SetHint(SDL_HINT_ANDROID_SEPARATE_MOUSE_AND_TOUCH, "0");/i #ifdef SDL_HINT_ANDROID_SEPARATE_MOUSE_AND_TOUCH' "$ENGINE_DIR/src/input.cpp"
sed -i '/SDL_SetHint(SDL_HINT_ANDROID_SEPARATE_MOUSE_AND_TOUCH, "0");/a #endif' "$ENGINE_DIR/src/input.cpp"
# Modern gettext declarations return immutable strings; text is copied into the
# sprite buffer before modification/display.
sed -i 's/char text\[200\]/const char *text/g' "$ENGINE_DIR/src/text.h"
sed -i 's/int add_text_sprite(char\* text/int add_text_sprite(const char *text/' "$ENGINE_DIR/src/text.cpp"
sed -i 's/int say_text(char\* text/int say_text(const char *text/' "$ENGINE_DIR/src/text.cpp"
sed -i 's/int say_text_xy(char\* text/int say_text_xy(const char *text/' "$ENGINE_DIR/src/text.cpp"

cat > "$PC_DIR/sdl2.pc" <<EOF
prefix=$SYSROOT
includedir=\${prefix}/include/SDL2
Name: sdl2
Description: Emscripten SDL2 port
Version: 2.0.28
Cflags: -I\${includedir} -sUSE_SDL=2
Libs: -sUSE_SDL=2
EOF
for name in SDL2_image SDL2_mixer SDL2_ttf SDL2_gfx; do
  case "$name" in
    SDL2_image) flag='-sUSE_SDL_IMAGE=2'; version='2.8.0' ;;
    SDL2_mixer) flag='-sUSE_SDL_MIXER=2'; version='2.6.0' ;;
    SDL2_ttf) flag='-sUSE_SDL_TTF=2'; version='2.22.0' ;;
    SDL2_gfx) flag='-sUSE_SDL_GFX=2'; version='1.0.4' ;;
  esac
  cat > "$PC_DIR/${name}.pc" <<EOF
Name: $name
Description: Emscripten $name port
Version: $version
Cflags: -I$SYSROOT/include/SDL2 $flag
Libs: $flag
EOF
done

LINK_FLAGS="-sUSE_SDL=2 -sUSE_SDL_IMAGE=2 -sUSE_SDL_MIXER=2 -sUSE_SDL_TTF=2 -sUSE_SDL_GFX=2 -sUSE_WEBGL2=1 -sFULL_ES3=1 -sALLOW_MEMORY_GROWTH=1 -sFORCE_FILESYSTEM=1 -sNO_EXIT_RUNTIME=1"
mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"
emconfigure env \
  PKG_CONFIG_LIBDIR="$PC_DIR:${PKG_CONFIG_LIBDIR:-}" \
  LDFLAGS="$LINK_FLAGS" \
  "$ENGINE_DIR/configure" \
    --host=asmjs-unknown-emscripten \
    --build=x86_64-linux-gnu \
    --disable-nls \
    --disable-tests \
    --disable-static
emmake make -j2 CPPFLAGS="-I$GLM_DIR"

cp "$BUILD_DIR/src/freedink" "$OUTPUT_DIR/freedink.js"
cp "$BUILD_DIR/src/freedink.wasm" "$OUTPUT_DIR/freedink.wasm"
python3 "$EMSCRIPTEN_ROOT/tools/file_packager.py" \
  "$OUTPUT_DIR/freedink.data" \
  --js-output="$OUTPUT_DIR/freedink.data.js" \
  --preload "$DATA_DIR/dink@/usr/local/share/dink/dink"
cp "$ENGINE_DIR/COPYING" "$OUTPUT_DIR/ENGINE-COPYING.txt"
cp "$DATA_DIR/COPYING" "$OUTPUT_DIR/DATA-COPYING.txt"
cp "$DATA_DIR/README.txt" "$OUTPUT_DIR/DATA-README.txt"
cp "$GLM_DIR/copying.txt" "$OUTPUT_DIR/GLM-COPYING.txt"

test -s "$OUTPUT_DIR/freedink.js"
test -s "$OUTPUT_DIR/freedink.wasm"
test -s "$OUTPUT_DIR/freedink.data"
test -s "$OUTPUT_DIR/freedink.data.js"
ls -lh "$OUTPUT_DIR"/freedink.{js,wasm,data,data.js}
