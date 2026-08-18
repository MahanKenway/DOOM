#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

node --check src/catalog.js
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

grep -q "assets/hacx.wad" src/catalog.js
grep -q "hacx12.zip" .github/workflows/build-and-deploy.yml
test -f assets/licenses/HACX-LEGAL.txt
test -f assets/licenses/HACX-CREDITS.txt

if grep -R "assets/covers/" index.html src styles .github 2>/dev/null; then
  echo "Deprecated generated cover reference found in active runtime files" >&2
  exit 1
fi

printf 'RetroPlay validation: PASS\n'
