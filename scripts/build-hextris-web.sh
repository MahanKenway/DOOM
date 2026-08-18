#!/usr/bin/env bash
# Package the browser-native Hextris arcade-puzzle runtime with all playable
# code and assets local.  RetroPlay serves this GPL-3.0-or-later package
# non-commercially with upstream source and attribution notices retained.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CACHE_DIR="${HEXTRIS_CACHE_DIR:-$ROOT_DIR/.cache/hextris-web}"
SOURCE_DIR="$CACHE_DIR/hextris"
OUT_DIR="$ROOT_DIR/dist/hextris"
HEXTRIS_REPO="https://github.com/Hextris/hextris.git"
HEXTRIS_COMMIT="3f4847dc8fd7dab3d1c87e6324b9159d92fbd396"

mkdir -p "$CACHE_DIR"
if [[ ! -d "$SOURCE_DIR/.git" ]]; then
  rm -rf "$SOURCE_DIR"
  timeout 180 git clone --filter=blob:none "$HEXTRIS_REPO" "$SOURCE_DIR"
fi

git -C "$SOURCE_DIR" fetch --depth=1 origin "$HEXTRIS_COMMIT"
git -C "$SOURCE_DIR" checkout --detach "$HEXTRIS_COMMIT"
test "$(git -C "$SOURCE_DIR" rev-parse HEAD)" = "$HEXTRIS_COMMIT"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"
cp -a "$SOURCE_DIR"/. "$OUT_DIR"/
rm -rf "$OUT_DIR/.git" "$OUT_DIR/CNAME" "$OUT_DIR/.github"
rm -f "$OUT_DIR/vendor/rrssb.min.js" "$OUT_DIR/style/rrssb.css"

# The original static site loads a Google font, an ad script and two analytics
# snippets.  The actual game uses only repository-local JS, images and styles.
sed -i \
  -e '/fonts\.googleapis\.com/d' \
  -e '/hextris\.io\/a\.js/d' \
  -e '/pagead2\.googlesyndication\.com/d' \
  -e '/GoogleAnalyticsObject/,/<\/script>/d' \
  -e '/<meta property="og:/d' \
  -e '/<meta property="twitter:/d' \
  -e "/<div id='socialShare'>/,/^[[:space:]]*<\\/div>$/d" \
  -e "/<div id='buttonCont'>/,/^[[:space:]]*<\\/div>$/d" \
  -e '/^[[:space:]]*<script type="text\/javascript">$/,/<\/script>/d' \
  -e '/vendor\/rrssb\.min\.js/d' \
  "$OUT_DIR/index.html"
sed -i "/id='restart'/a\\                <div id='buttonCont' aria-hidden='true'></div>" "$OUT_DIR/index.html"
sed -i "/^[[:space:]]*(function(i, s, o, g, r, a, m) {/,/ga('send', 'pageview');/d" "$OUT_DIR/js/initialization.js"
sed -i \
  -e "/'pausedAndroid':/c\\        'pausedAndroid': \"<div class='centeredHeader unselectable'>Game Paused</div>\", " \
  -e "/'pausediOS':/c\\        'pausediOS': \"<div class='centeredHeader unselectable'>Game Paused</div>\", " \
  -e "/'pausedOther':/c\\        'pausedOther': \"<div class='centeredHeader unselectable'>Game Paused</div>\", " \
  "$OUT_DIR/js/view.js"
sed -i "/^[[:space:]]*window.onblur = function(e) {/,/^[[:space:]]*};/c\\        window.onblur = null;" "$OUT_DIR/js/initialization.js"
sed -E -i "s#<hr> <p id = 'afterhr'></p> By <a href='http://loganengstrom.com'.*Hextris Website</a>#<hr> <p id = 'afterhr'></p>#" "$OUT_DIR/js/main.js"
sed -i '/^[[:space:]]*(function(){/,/^})()/d' "$OUT_DIR/js/main.js"

cat > "$OUT_DIR/retroplay-loader.js" <<'LOADER'
// RetroPlay integration: a launch URL begins the local Hextris session.
// It does not fetch assets, communicate with a score server or enable ads.
(function () {
  if (new URLSearchParams(location.search).get('autostart') !== '1') return;
  window.addEventListener('load', function () {
    window.setTimeout(function () {
      // Some embedded browser contexts postpone jQuery's document-ready hook.
      // Run Hextris' own initializer only when that hook has not created a
      // session yet, then use its normal start handler.
      if (typeof canRestart !== 'number' && typeof initialize === 'function') initialize();
      window.setTimeout(function () {
        if (typeof startBtnHandler === 'function') {
          startBtnHandler();
          return;
        }
        var start = document.getElementById('startBtn');
        if (start) start.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      }, 40);
    }, 220);
  });
}());
LOADER
sed -i '/js\/initialization\.js/a\        <script type="text/javascript" src="retroplay-loader.js"></script>' "$OUT_DIR/index.html"

cp "$SOURCE_DIR/LICENSE.md" "$OUT_DIR/HEXTRIS-GPL-3.0-OR-LATER.txt"
cat > "$OUT_DIR/SOURCE-NOTICE.txt" <<NOTICE
Hextris runtime packaged for RetroPlay

Upstream repository: https://github.com/Hextris/hextris
Pinned revision: $HEXTRIS_COMMIT
Upstream project: https://hextris.github.io/hextris/

Hextris is GPL-3.0-or-later. This bundled directory retains the full upstream
license at HEXTRIS-GPL-3.0-OR-LATER.txt. The complete corresponding source is
available from the upstream repository above, and RetroPlay's packaging script
is scripts/build-hextris-web.sh.

Packaging changes: Google font, Google Ads and Google Analytics references were
removed. All gameplay code, images, style sheets, sound generation and local
storage score handling are served from this directory; no playable data is
fetched from another site.
NOTICE

if grep -nE 'fonts\.googleapis\.com|hextris\.io\/a\.js|pagead2\.googlesyndication\.com|google-analytics\.com|GoogleAnalyticsObject|facebook\.com|twitter\.com|play\.google\.com|itunes\.apple\.com' "$OUT_DIR/index.html" "$OUT_DIR/js/initialization.js" "$OUT_DIR/js/view.js" "$OUT_DIR/js/main.js"; then
  echo 'FATAL: Hextris still contains a legacy remote service.' >&2
  exit 1
fi
for required in index.html retroplay-loader.js js/main.js js/input.js vendor/jquery.js images LICENSE.md HEXTRIS-GPL-3.0-OR-LATER.txt SOURCE-NOTICE.txt; do
  test -e "$OUT_DIR/$required" || { echo "FATAL: Hextris asset missing: $required" >&2; exit 1; }
done

echo 'Hextris static runtime packaged:'
du -sh "$OUT_DIR"
