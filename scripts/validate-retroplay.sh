#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

node --check src/catalog.js
node --check src/runtime-shell.js
node --check src/ui.js
node --check src/engine/InputHandler.js
node --check src/main.js

git diff --check

mapfile -t artwork < <(grep -oE "assets/screenshots/[A-Za-z0-9._-]+" src/catalog.js | sort -u)
for path in "${artwork[@]}"; do
  test -f "$path" || { echo "Missing catalog artwork: $path" >&2; exit 1; }
done

test -f openresident.html
test -f third_party/openresident-web/LICENSE
test -f third_party/openresident-web/README.md

grep -q "openresident.html" src/catalog.js
grep -q "Compile OpenResident WebGL2 probe" .github/workflows/build-and-deploy.yml

test -f neverball.html
test -x scripts/build-neverball-web.sh
grep -q "neverball.html" src/catalog.js
grep -q "neverball-runtime.png" src/catalog.js
grep -q "Compile Neverball fully bundled physics-puzzle runtime" .github/workflows/build-and-deploy.yml
grep -q "neverball.html" sitemap.xml
grep -q "id:'set-easy'" neverball.html
grep -q "id:'set-medium'" neverball.html
grep -q 'id}-package.json' neverball.html
grep -q 'id}-\[a-f0-9\]' neverball.html
grep -q 'set-easy set-medium' scripts/build-neverball-web.sh
grep -q '\$PACKAGE_ID-package.json' scripts/build-neverball-web.sh
grep -q 'releaseVirtualKeys' neverball.html
grep -q 'gamepadconnected' neverball.html
grep -q 'controller-status' neverball.html
grep -q 'data-key="KeyR"' neverball.html
! grep -q 'type="file"' neverball.html

test -f blasphemer.html
test -x scripts/build-blasphemer-web.sh
test -f scripts/patches/chocolate-heretic-retroplay.patch
grep -q "blasphemer.html" src/catalog.js
grep -q "blasphemer-runtime.png" src/catalog.js
grep -q "Compile Blasphemer fully bundled fantasy-shooter runtime" .github/workflows/build-and-deploy.yml
grep -q "blasphemer.html" sitemap.xml
grep -q "Web_DoomMain" scripts/patches/chocolate-heretic-retroplay.patch
grep -q "emscripten_set_main_loop" scripts/patches/chocolate-heretic-retroplay.patch
grep -q "releaseVirtualKeys" blasphemer.html
grep -q "gamepadconnected" blasphemer.html
grep -q "controller-status" blasphemer.html
grep -q 'data-key="ControlLeft"' blasphemer.html
! grep -q 'type="file"' blasphemer.html

test -f tuxracer.html
test -x scripts/build-tuxracer-web.sh
test -f tuxracer/index.html
test -f tuxracer/LICENSE
test -f tuxracer/NOTICE.md
test -f third_party/tuxracer-js/LICENSE
test -f third_party/tuxracer-js/README.md
test -f third_party/tuxracer-js/package.json
test -f third_party/tuxracer-js/pnpm-lock.yaml
test -f third_party/tuxracer-js/index.html
test -f assets/screenshots/tuxracer-runtime.webp
grep -q "id: 'tuxracer-js'" src/catalog.js
grep -q "tuxracer.html" src/catalog.js
grep -q "tuxracer-runtime.webp" src/catalog.js
grep -q "tuxracer.html" sitemap.xml
grep -q "Package TuxRacer.js fully bundled 3D downhill runtime" .github/workflows/build-and-deploy.yml
grep -q 'src="src/runtime-shell.js"' tuxracer.html
grep -q 'data-key="ArrowUp"' tuxracer.html
grep -q 'data-key="ArrowDown"' tuxracer.html
grep -q 'data-runtime-fullscreen' tuxracer.html
! grep -q 'type="file"' tuxracer.html

test -f neon-rift.html
test -f neon-rift/index.html
test -f assets/screenshots/neon-rift-runtime.webp
grep -q "neon-rift.html" src/catalog.js
grep -q "neon-rift-runtime.webp" src/catalog.js
grep -q "neon-rift.html" sitemap.xml
grep -q 'src="src/runtime-shell.js"' neon-rift.html
grep -q 'data-key="ArrowUp"' neon-rift.html
grep -q 'data-runtime-fullscreen\|id="fullscreen"' neon-rift.html
! grep -q 'type="file"' neon-rift.html
test -f shadow-station.html
test -f shadow-station/index.html
test -f third_party/openresident-web/obsidian_relay.cpp
test -f assets/screenshots/obsidian-relay-runtime.webp
grep -q "id: 'obsidian-relay'" src/catalog.js
grep -q "shadow-station.html" src/catalog.js
grep -q "obsidian-relay-runtime.webp" src/catalog.js
grep -q "shadow-station.html" sitemap.xml
grep -q "Compile Obsidian Relay original survival runtime" .github/workflows/build-and-deploy.yml
grep -q 'src="src/runtime-shell.js"' shadow-station.html
grep -q 'data-key="ArrowUp"' shadow-station.html
grep -q 'data-key="Space"' shadow-station.html
grep -q 'data-runtime-fullscreen' shadow-station.html
grep -q 'obsidian_relay_init' shadow-station/index.html
! grep -q 'type="file"' shadow-station.html

test -f assets/retroplay-mark.png
test -f assets/gamecube-tab-mark.png
test -f assets/favicon-tab.png
test -f assets/favicon.ico
grep -q 'favicon.ico?v=gamecube-1' index.html
grep -q 'gamecube-tab-mark.png' .gitignore || true
test -f assets/icon-192.png
grep -q 'neon-rift.html' .github/workflows/build-and-deploy.yml
for removed in orbit-lander skyline-sprint comet-breaker vector-putt; do
  ! grep -R -q "$removed" src/catalog.js sitemap.xml .github/workflows/build-and-deploy.yml
  ! test -e "$removed.html"
done

test -f hexgl.html
test -x scripts/build-hexgl-web.sh
grep -q "hexgl.html" src/catalog.js
grep -q "hexgl-runtime.webp" src/catalog.js
grep -q "Package HexGL fully bundled 3D racing runtime" .github/workflows/build-and-deploy.yml
grep -q "hexgl.html" sitemap.xml
grep -q "fullscreenchange" hexgl.html
grep -q "gamepadconnected" hexgl.html
! grep -q 'type="file"' hexgl.html

test -f hextris.html
test -x scripts/build-hextris-web.sh
grep -q "hextris.html" src/catalog.js
grep -q "hextris-runtime.webp" src/catalog.js
grep -q "Package Hextris fully bundled arcade-puzzle runtime" .github/workflows/build-and-deploy.yml
grep -q "hextris.html" sitemap.xml
grep -q "fullscreenchange" hextris.html
grep -q "gamepadconnected" hextris.html
! grep -q 'type="file"' hextris.html

test -f rocksndiamonds.html
test -x scripts/build-rocksndiamonds-web.sh
grep -q "rocksndiamonds.html" src/catalog.js
grep -q "rocksndiamonds-runtime.webp" src/catalog.js
grep -q "Compile Rocks'n'Diamonds fully bundled rock-and-gem runtime" .github/workflows/build-and-deploy.yml
grep -q "rocksndiamonds.html" sitemap.xml
grep -q "fullscreenchange" rocksndiamonds.html
grep -q "gamepadconnected" rocksndiamonds.html
! grep -q 'type="file"' rocksndiamonds.html

test -f beats-into-shapes.html
test -x scripts/build-beats-into-shapes-web.sh
test -f assets/screenshots/beats-into-shapes-runtime.webp
test -f coi-serviceworker.js
grep -q "beats-into-shapes.html" src/catalog.js
grep -q "beats-into-shapes-runtime.webp" src/catalog.js
grep -q "Package Beats into Shapes fully bundled rhythm runtime" .github/workflows/build-and-deploy.yml
grep -q "beats-into-shapes.html" sitemap.xml
grep -q 'data-key="KeyA"' beats-into-shapes.html
grep -q 'data-key="Space"' beats-into-shapes.html
grep -q 'data-key="KeyD"' beats-into-shapes.html
grep -q "fullscreenchange" beats-into-shapes.html
grep -q "gamepadconnected" beats-into-shapes.html
grep -q 'src="coi-serviceworker.js"' beats-into-shapes.html
! grep -q 'type="file"' beats-into-shapes.html

for runtime in 2048 javascript-tetris adarkroom digger; do
  test -f "$runtime.html"
  test -x "scripts/build-$runtime-web.sh"
  test -f "assets/screenshots/$runtime-runtime.webp"
  grep -q "$runtime.html" src/catalog.js
  grep -q "$runtime-runtime.webp" src/catalog.js
  grep -q "$runtime.html" sitemap.xml
  grep -q 'src="src/runtime-shell.js"' "$runtime.html"
  grep -q 'data-runtime-fullscreen' "$runtime.html"
  ! grep -q 'type="file"' "$runtime.html"
done

grep -q 'Package A Dark Room fully bundled text-adventure runtime' .github/workflows/build-and-deploy.yml
grep -q 'Package 2048 fully bundled arcade-puzzle runtime' .github/workflows/build-and-deploy.yml
grep -q 'Package JavaScript Tetris fully bundled arcade-puzzle runtime' .github/workflows/build-and-deploy.yml
grep -q 'Compile Digger Remastered fully bundled action runtime' .github/workflows/build-and-deploy.yml
grep -q '2048.html javascript-tetris.html adarkroom.html digger.html' .github/workflows/build-and-deploy.yml

grep -q 'Mahan Tavakoli' index.html
grep -q 'ماهان توکلی' index.html
grep -q 'https://github.com/MahanKenway' index.html
grep -q 'card-download-link' src/catalog.js
grep -q 'card-download-note' styles/main.css
for link in 'moddb.com/games/doom-ii/addons/ancient-aliens' 'moddb.com/mods/eviternity' 'doomworld.com/files/file/18748-back-to-saturn-x-e1-get-out-of-my-stations' 'bigbrikgames.itch.io/square' 'store.steampowered.com/app/2290/Final_DOOM' 'maniacsvault.net/ecwolf/download.php'; do
  grep -q "$link" src/catalog.js
done
# These entries are intentionally grouped after immediately playable titles.
last_bundled_line=$(grep -n "id: 'adarkroom'" src/catalog.js | cut -d: -f1)
first_external_line=$(grep -n "id: 'ancient-aliens'" src/catalog.js | cut -d: -f1)
test "$first_external_line" -gt "$last_bundled_line"
test -f assets/screenshots/supertuxkart-runtime.jpg
grep -q "id: 'supertuxkart'" src/catalog.js
grep -q 'supertuxkart.net/Download' src/catalog.js
grep -q 'SuperTuxKart-1.5-linux-x86_64.tar.gz' src/catalog.js
last_catalog_id=$(grep "id: '" src/catalog.js | tail -n1 | sed -E "s/.*id: '([^']+)'.*/\\1/")
test "$last_catalog_id" = 'supertuxkart'
grep -q 'data-retro-nav="about"' index.html
grep -q 'button.dataset.retroNav' src/catalog.js
grep -q 'about-panel' styles/main.css

grep -q 'data-genre="Strategy"' index.html
grep -q 'data-genre="Racing"' index.html
grep -q 'data-genre="Arcade Puzzle"' index.html
grep -q 'data-genre="Rock &amp; Gem Action Puzzle"' index.html
grep -q 'data-genre="Rhythm"' index.html
grep -q 'data-genre="Fantasy shooter"' index.html
grep -q 'genre-deck' styles/main.css

grep -q "assets/hacx.wad" src/catalog.js
grep -q "hacx12.zip" .github/workflows/build-and-deploy.yml
test -f assets/licenses/HACX-LEGAL.txt
test -f assets/licenses/HACX-CREDITS.txt

if grep -R "assets/covers/" index.html src styles .github 2>/dev/null; then
  echo "Deprecated generated cover reference found in active runtime files" >&2
  exit 1
fi

printf 'RetroPlay validation: PASS\n'
