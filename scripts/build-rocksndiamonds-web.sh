#!/usr/bin/env bash
# Build Rocks'n'Diamonds as a fully bundled browser runtime for RetroPlay.
# The official GPL-2.0-or-later source and its included free game data stay local.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CACHE_DIR="${ROCKSNDIAMONDS_CACHE_DIR:-$ROOT_DIR/.cache/rocksndiamonds-web}"
SOURCE_DIR="$CACHE_DIR/source"
BUILD_DIR="$CACHE_DIR/build"
OUT_DIR="$ROOT_DIR/dist/rocksndiamonds"
RND_REPO="https://git.artsoft.org/rocksndiamonds.git"
RND_COMMIT="b42509b0cc55e6eb6b48953be946c09ac24cf6a3"

mkdir -p "$CACHE_DIR"
if [[ ! -d "$SOURCE_DIR/.git" ]]; then
  rm -rf "$SOURCE_DIR"
  # The official server intentionally exposes a dumb HTTP Git endpoint, so a
  # complete clone is required instead of --depth/--filter cloning.
  timeout 300 git clone "$RND_REPO" "$SOURCE_DIR"
fi

git -C "$SOURCE_DIR" fetch origin master
git -C "$SOURCE_DIR" checkout --detach "$RND_COMMIT"
test "$(git -C "$SOURCE_DIR" rev-parse HEAD)" = "$RND_COMMIT"

if [[ -f "$ROOT_DIR/emsdk/emsdk_env.sh" ]]; then
  # GitHub Actions checks out emsdk inside the repository workspace.
  source "$ROOT_DIR/emsdk/emsdk_env.sh" >/dev/null
elif [[ -f "/home/ubuntu/emsdk/emsdk_env.sh" ]]; then
  # Local RetroPlay verification uses the shared sandbox toolchain.
  source "/home/ubuntu/emsdk/emsdk_env.sh" >/dev/null
fi
command -v emcc >/dev/null || { echo 'FATAL: Emscripten emcc is required.' >&2; exit 1; }
: "${EMSDK:?FATAL: EMSDK is required after activating Emscripten.}"
FILE_PACKAGER="$EMSDK/upstream/emscripten/tools/file_packager.py"
test -x "$FILE_PACKAGER" || { echo "FATAL: file packager missing: $FILE_PACKAGER" >&2; exit 1; }

rm -rf "$BUILD_DIR" "$OUT_DIR"
mkdir -p "$BUILD_DIR" "$OUT_DIR"
git -C "$SOURCE_DIR" archive "$RND_COMMIT" | tar -x -C "$BUILD_DIR"

# SDL's Web build intentionally omits this Windows-only DPI hint. The guard
# retains the native behavior but permits the official Emscripten target to compile.
perl -0pi -e 's{  // prevent Windows systems from upscaling the program Window\n  SDL_SetHint\(SDL_HINT_WINDOWS_DPI_AWARENESS, "permonitorv2"\);}{  // Prevent Windows systems from upscaling the program window. The SDL\n  // port used by Emscripten intentionally does not expose this Windows hint.\n#ifdef SDL_HINT_WINDOWS_DPI_AWARENESS\n  SDL_SetHint(SDL_HINT_WINDOWS_DPI_AWARENESS, "permonitorv2");\n#endif}g' "$BUILD_DIR/src/libgame/sdl.c"
grep -q 'SDL_HINT_WINDOWS_DPI_AWARENESS' "$BUILD_DIR/src/libgame/sdl.c"

(
  cd "$BUILD_DIR"
  emmake make -C src PLATFORM=emscripten BUILD_DIST=1 FILE_PACKAGER="$FILE_PACKAGER"
)

for required in rocksndiamonds.js rocksndiamonds.wasm rocksndiamonds.data rocksndiamonds.data.js; do
  test -s "$BUILD_DIR/$required" || { echo "FATAL: build output missing: $required" >&2; exit 1; }
  cp "$BUILD_DIR/$required" "$OUT_DIR/$required"
done

cp "$BUILD_DIR/COPYING" "$OUT_DIR/ROCKSNDIAMONDS-GPL-2.0-OR-LATER.txt"
cat > "$OUT_DIR/index.html" <<'HTML'
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <meta name="theme-color" content="#05070b" />
  <title>Rocks'n'Diamonds — RetroPlay Runtime</title>
  <style>
    html,body { width:100%; height:100%; margin:0; overflow:hidden; background:#05070b; color:#d9ffe9; font:13px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; }
    #canvas { display:block; width:100%; height:100%; outline:0; image-rendering:auto; }
    #status { position:fixed; left:10px; bottom:10px; z-index:2; max-width:calc(100% - 20px); padding:6px 8px; border:1px solid rgba(105,255,135,.75); background:rgba(0,0,0,.72); color:#d9ffe9; pointer-events:none; }
  </style>
</head>
<body>
  <canvas id="canvas" tabindex="0" aria-label="Rocks'n'Diamonds game canvas"></canvas>
  <output id="status" aria-live="polite">Loading bundled rocks, music and levels…</output>
  <script>
    var status = document.getElementById('status');
    var canvas = document.getElementById('canvas');
    var Module = {
      canvas: canvas,
      locateFile: function(path) { return path; },
      setStatus: function(text) { status.textContent = text || 'READY — Rocks’n’Diamonds is running'; },
      printErr: function(text) { console.error(text); status.textContent = 'Runtime error: ' + text; },
      onRuntimeInitialized: function() {
        status.textContent = 'READY — Rocks’n’Diamonds is running';
        canvas.focus();
        if (new URLSearchParams(location.search).get('autostart') === '1') {
          // Space is Rocks’n’Diamonds’ native menu confirm key. This starts
          // the bundled first level without a file picker or remote data.
          window.setTimeout(function() {
            ['keydown', 'keyup'].forEach(function(type) {
              canvas.dispatchEvent(new KeyboardEvent(type, { key:' ', code:'Space', keyCode:32, which:32, bubbles:true }));
            });
          }, 650);
        }
      }
    };
  </script>
  <script src="rocksndiamonds.data.js"></script>
  <script src="rocksndiamonds.js"></script>
</body>
</html>
HTML

cat > "$OUT_DIR/SOURCE-NOTICE.txt" <<NOTICE
Rocks'n'Diamonds browser runtime packaged for RetroPlay

Upstream source: $RND_REPO
Pinned revision: $RND_COMMIT
Upstream project: https://www.artsoft.org/rocksndiamonds/

Rocks'n'Diamonds is distributed under the GNU GPL version 2 or later. The
full license is retained at ROCKSNDIAMONDS-GPL-2.0-OR-LATER.txt. Complete
corresponding source is available from the upstream Git repository above; the
RetroPlay packaging script is scripts/build-rocksndiamonds-web.sh.

Packaging changes: a compile guard encloses a Windows-only SDL DPI hint that is
not present in SDL's Emscripten build. The runtime packages the project's
included configuration, documentation, levels, graphics, sounds and music as
local Emscripten data. It does not fetch playable content, require an upload,
or contact a network game server.
NOTICE

if grep -RInE 'https?://|www\.' "$OUT_DIR" --include='*.html' --include='*.js'; then
  echo 'FATAL: Rocks’n’Diamonds runtime contains an external runtime URL.' >&2
  exit 1
fi

for required in index.html rocksndiamonds.js rocksndiamonds.wasm rocksndiamonds.data rocksndiamonds.data.js ROCKSNDIAMONDS-GPL-2.0-OR-LATER.txt SOURCE-NOTICE.txt; do
  test -s "$OUT_DIR/$required" || { echo "FATAL: Rocks’n’Diamonds asset missing: $required" >&2; exit 1; }
done

echo 'Rocks’n’Diamonds WebAssembly runtime built:'
du -sh "$OUT_DIR"
