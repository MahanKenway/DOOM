#!/usr/bin/env bash
# Package Astray as a completely local 3D WebGL runtime for RetroPlay.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CACHE_DIR="${ASTRAY_CACHE_DIR:-$ROOT_DIR/.cache/astray-web}"
SOURCE_DIR="$CACHE_DIR/source"
OUT_DIR="${ASTRAY_OUTPUT_DIR:-$ROOT_DIR/dist/astray}"
ASTRAY_REPO="https://github.com/wwwtyro/Astray.git"
ASTRAY_COMMIT="d3c4f61f2cbbe35752fbfa205f85a41d7f9fe0f0"

mkdir -p "$CACHE_DIR"
if [[ ! -d "$SOURCE_DIR/.git" ]]; then
  rm -rf "$SOURCE_DIR"
  timeout 180 git clone --filter=blob:none "$ASTRAY_REPO" "$SOURCE_DIR"
fi

git -C "$SOURCE_DIR" fetch --depth=1 origin "$ASTRAY_COMMIT"
git -C "$SOURCE_DIR" checkout --detach "$ASTRAY_COMMIT"
test "$(git -C "$SOURCE_DIR" rev-parse HEAD)" = "$ASTRAY_COMMIT"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"
cp -a "$SOURCE_DIR"/. "$OUT_DIR"/
rm -rf "$OUT_DIR/.git"

# The upstream demo was hosted at the origin root. These must be relative when
# the independently runnable game is served at /RetroPlay/astray/.
sed -i \
  -e "s#'/ball.png'#'ball.png'#g" \
  -e "s#'/concrete.png'#'concrete.png'#g" \
  -e "s#'/brick.png'#'brick.png'#g" \
  "$OUT_DIR/index.html"

# Preserve source and licence provenance beside the static game package.
cp "$SOURCE_DIR/License.md" "$OUT_DIR/ASTRAY-UNLICENSE.md"
cp "$SOURCE_DIR/README.md" "$OUT_DIR/UPSTREAM-README.md"
cat > "$OUT_DIR/SOURCE-NOTICE.txt" <<NOTICE
Astray runtime packaged for RetroPlay

Upstream repository: https://github.com/wwwtyro/Astray
Pinned revision: $ASTRAY_COMMIT
Upstream demo: https://wwwtyro.github.io/Astray/

The upstream repository releases Astray under the Unlicense/public-domain
 dedication (ASTRAY-UNLICENSE.md). The source snapshot retains its bundled
Three.js, Box2dWeb, KeyboardJS and jQuery files exactly as supplied upstream.
This package makes only static-hosting path corrections: the three texture URLs
were changed from origin-root paths to local relative paths. No playable asset,
analytics script, user upload, account, server or remote game-data request is
used by RetroPlay.
NOTICE

if grep -nE "['\"]/(ball|brick|concrete)\.png" "$OUT_DIR/index.html"; then
  echo 'FATAL: Astray has unresolved root-absolute texture URLs.' >&2
  exit 1
fi
for required in index.html maze.js keyboard.js Three.js Box2dWeb.min.js jquery.js ball.png brick.png concrete.png License.md ASTRAY-UNLICENSE.md UPSTREAM-README.md SOURCE-NOTICE.txt; do
  test -s "$OUT_DIR/$required" || { echo "FATAL: Astray file missing: $required" >&2; exit 1; }
done

echo 'Astray static runtime packaged:'
du -sh "$OUT_DIR"
