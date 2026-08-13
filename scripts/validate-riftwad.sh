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

grep -q "assets/hacx.wad" src/catalog.js
grep -q "hacx12.zip" .github/workflows/build-and-deploy.yml
test -f assets/licenses/HACX-LEGAL.txt
test -f assets/licenses/HACX-CREDITS.txt

if grep -R "assets/covers/" index.html src styles .github 2>/dev/null; then
  echo "Deprecated generated cover reference found in active runtime files" >&2
  exit 1
fi

printf 'RIFTWAD validation: PASS\n'
