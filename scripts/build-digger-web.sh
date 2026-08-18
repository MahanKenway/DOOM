#!/usr/bin/env bash
# Build and package the upstream Digger Remastered WASM target for RetroPlay.
# Digger's upstream source carries mixed historical notices (Public Domain,
# Beer-Ware, BSD-2-Clause and GPL-2.0); the original README is shipped intact.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CACHE_DIR="${DIGGER_CACHE_DIR:-$ROOT_DIR/.cache/digger-web}"
SOURCE_DIR="$CACHE_DIR/digger"
OUT_DIR="$ROOT_DIR/dist/digger"
DIGGER_REPO="https://github.com/sobomax/digger.git"
DIGGER_COMMIT="e85cab1164f0304b3e66f371a5997d83f7a0090a"

mkdir -p "$CACHE_DIR"
if [[ ! -d "$SOURCE_DIR/.git" ]]; then
  rm -rf "$SOURCE_DIR"
  timeout 180 git clone --filter=blob:none "$DIGGER_REPO" "$SOURCE_DIR"
fi

git -C "$SOURCE_DIR" fetch --depth=1 origin "$DIGGER_COMMIT"
git -C "$SOURCE_DIR" checkout --detach "$DIGGER_COMMIT"
test "$(git -C "$SOURCE_DIR" rev-parse HEAD)" = "$DIGGER_COMMIT"

# The project maintains an official Emscripten target in GNUmakefile. Prefer the
# RetroPlay SDK in a local development sandbox; GitHub Actions already adds emcc
# to PATH before this script is called.
if [[ -x /home/ubuntu/emsdk/upstream/emscripten/emcc ]]; then
  export PATH="/home/ubuntu/emsdk/upstream/emscripten:$PATH"
fi
command -v emcc >/dev/null || { echo 'FATAL: emcc is required for Digger.' >&2; exit 1; }
make -C "$SOURCE_DIR" ARCH=WASM -j"${DIGGER_JOBS:-2}"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"
cp -a "$SOURCE_DIR/web-dist"/. "$OUT_DIR"/
# Do not fetch a webfont and do not expose an external project link from the
# runtime. Keep the build identifier as plain local text for traceability.
sed -i \
  -e '/fonts\.googleapis\.com/d' \
  -e 's#<a id="build-link" href="https://github.com/sobomax/digger">github</a>#<span id="build-link">local build</span>#' \
  "$OUT_DIR/digger.html"
cp "$SOURCE_DIR/README.md" "$OUT_DIR/DIGGER-UPSTREAM-NOTICES.txt"
cat > "$OUT_DIR/SOURCE-NOTICE.txt" <<NOTICE
Digger Remastered runtime built for RetroPlay

Upstream repository: https://github.com/sobomax/digger
Pinned revision: $DIGGER_COMMIT
Upstream project: https://www.digger.org/

The Digger Remastered upstream README documents the source's historical mixed
license notices, including Public Domain, Beer-Ware, 2-clause BSD and GPL-2.0.
The original README is included at DIGGER-UPSTREAM-NOTICES.txt. Corresponding
source is available from the repository above; RetroPlay's build recipe is
scripts/build-digger-web.sh.

Packaging changes: Digger's upstream `ARCH=WASM` target is used unmodified for
game code. The Google webfont import and external GitHub link in its HTML shell
were removed. The game JavaScript, WASM and build-info assets are all local.
NOTICE

if grep -RInE 'fonts\.googleapis\.com|href="https?://' "$OUT_DIR/digger.html" "$OUT_DIR/digger.js"; then
  echo 'FATAL: Digger runtime still references a remote service.' >&2
  exit 1
fi
for required in digger.html digger.js digger.wasm digger-build-info.js DIGGER-UPSTREAM-NOTICES.txt SOURCE-NOTICE.txt; do
  test -f "$OUT_DIR/$required" || { echo "FATAL: Digger asset missing: $required" >&2; exit 1; }
done

echo 'Digger WebAssembly runtime packaged:'
du -sh "$OUT_DIR"
