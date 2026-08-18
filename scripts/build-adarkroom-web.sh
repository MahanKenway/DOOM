#!/usr/bin/env bash
# Package A Dark Room as a fully local MPL-2.0 browser runtime for RetroPlay.
# The game and its original audio, script, translations and image assets remain
# upstream material; this script only removes remote-service references.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CACHE_DIR="${ADARKROOM_CACHE_DIR:-$ROOT_DIR/.cache/adarkroom-web}"
SOURCE_DIR="$CACHE_DIR/adarkroom"
OUT_DIR="$ROOT_DIR/dist/adarkroom"
ADARKROOM_REPO="https://github.com/doublespeakgames/adarkroom.git"
ADARKROOM_COMMIT="1fada4620b6c66bd07bf15a3f1eb8223df8bc1d7"

mkdir -p "$CACHE_DIR"
if [[ ! -d "$SOURCE_DIR/.git" ]]; then
  rm -rf "$SOURCE_DIR"
  timeout 180 git clone --filter=blob:none "$ADARKROOM_REPO" "$SOURCE_DIR"
fi

git -C "$SOURCE_DIR" fetch --depth=1 origin "$ADARKROOM_COMMIT"
git -C "$SOURCE_DIR" checkout --detach "$ADARKROOM_COMMIT"
test "$(git -C "$SOURCE_DIR" rev-parse HEAD)" = "$ADARKROOM_COMMIT"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"
cp -a "$SOURCE_DIR"/. "$OUT_DIR"/
rm -rf "$OUT_DIR/.git" "$OUT_DIR/.github" "$OUT_DIR/node_modules" "$OUT_DIR/doc" "$OUT_DIR/tools" "$OUT_DIR/dev-server.js" "$OUT_DIR/package.json" "$OUT_DIR/yarn.lock" "$OUT_DIR/README.md" "$OUT_DIR/contributing.md"

# The playable application includes a local jQuery fallback, but RetroPlay must
# not contact Google's CDN.  Make the local copy authoritative and remove the
# upstream analytics snippet and marketing link; all game assets remain local.
sed -i \
  -e '19,24c\        <script src="lib/jquery.min.js"></script>' \
  -e '/Google tag (gtag.js)/,/<\/script>/d' \
  -e '/<a class="logo"/,/<\/a>/d' \
  "$OUT_DIR/index.html"
sed -i \
  -e 's#SITE_URL: encodeURIComponent("http://adarkroom.doublespeakgames.com")#SITE_URL: encodeURIComponent(location.origin + location.pathname)#' \
  "$OUT_DIR/script/engine.js"
sed -i \
  -e "/link: 'https:\/\/penrose\.doublespeakgames\.com/d" \
  "$OUT_DIR/script/events/marketing.js"

cp "$SOURCE_DIR/LICENSE.md" "$OUT_DIR/ADARKROOM-MPL-2.0.txt"
cat > "$OUT_DIR/SOURCE-NOTICE.txt" <<NOTICE
A Dark Room runtime packaged for RetroPlay

Upstream repository: https://github.com/doublespeakgames/adarkroom
Pinned revision: $ADARKROOM_COMMIT
Upstream game: https://adarkroom.doublespeakgames.com/

A Dark Room is licensed under MPL-2.0. The full upstream license is included at
ADARKROOM-MPL-2.0.txt. The corresponding source is available from the upstream
repository above; RetroPlay's packaging script is scripts/build-adarkroom-web.sh.

Packaging changes: the remote Google jQuery CDN fallback, Google Analytics and
an external studio-marketing link were removed. Gameplay code, localization,
audio, images and browser-local save data are served only from this directory.
NOTICE

if grep -RInE 'ajax\.googleapis\.com|googletagmanager\.com|google-analytics\.com|doublespeakgames\.com' "$OUT_DIR" --exclude='SOURCE-NOTICE.txt' --exclude='ADARKROOM-MPL-2.0.txt'; then
  echo 'FATAL: A Dark Room runtime still references a remote service.' >&2
  exit 1
fi
for required in index.html lib/jquery.min.js script/engine.js script/world.js css/main.css audio ADARKROOM-MPL-2.0.txt SOURCE-NOTICE.txt; do
  test -e "$OUT_DIR/$required" || { echo "FATAL: A Dark Room asset missing: $required" >&2; exit 1; }
done

echo 'A Dark Room static runtime packaged:'
du -sh "$OUT_DIR"
