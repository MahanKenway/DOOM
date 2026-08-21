#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UPSTREAM_URL="https://github.com/mrdoob/Starter-Kit-Racing.git"
UPSTREAM_COMMIT="40942fbcefc833a80db6583040fcba27e0e7e6c1"
THREE_VERSION="0.185.1"
CRASHCAT_VERSION="0.0.3"
MATHCAT_VERSION="0.0.11"
DEST="$ROOT_DIR/starter-kit-racing"
VENDOR_DIR="$DEST/vendor"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

rm -rf "$DEST"
git clone --quiet "$UPSTREAM_URL" "$TMP_DIR/source"
git -C "$TMP_DIR/source" checkout --quiet "$UPSTREAM_COMMIT"

mkdir -p "$DEST"
cp -R "$TMP_DIR/source/audio" "$TMP_DIR/source/js" "$TMP_DIR/source/models" "$TMP_DIR/source/sprites" "$DEST/"
cp "$TMP_DIR/source/index.html" "$TMP_DIR/source/LICENSE" "$TMP_DIR/source/README.md" "$DEST/"

# Build-time only dependencies. The resulting runtime uses no node_modules tree
# and retains only browser-side ESM files needed by this game.
npm install --prefix "$TMP_DIR/deps" --no-audit --no-fund \
  "three@$THREE_VERSION" "crashcat@$CRASHCAT_VERSION" "mathcat@$MATHCAT_VERSION" >/dev/null
mkdir -p "$VENDOR_DIR/three" "$VENDOR_DIR/crashcat" "$VENDOR_DIR/mathcat"
cp -R "$TMP_DIR/deps/node_modules/three/build" "$VENDOR_DIR/three/"
mkdir -p "$VENDOR_DIR/three/examples/jsm"
for module_dir in postprocessing shaders lighting helpers loaders utils; do
  cp -R "$TMP_DIR/deps/node_modules/three/examples/jsm/$module_dir" "$VENDOR_DIR/three/examples/jsm/"
done
cp "$TMP_DIR/deps/node_modules/three/LICENSE" "$DEST/THREE-MIT-LICENSE"
cp -R "$TMP_DIR/deps/node_modules/crashcat/dist/." "$VENDOR_DIR/crashcat/"
cp "$TMP_DIR/deps/node_modules/crashcat/LICENSE" "$DEST/CRASHCAT-MIT-LICENSE"
cp -R "$TMP_DIR/deps/node_modules/mathcat/dist/." "$VENDOR_DIR/mathcat/"
cp "$TMP_DIR/deps/node_modules/mathcat/LICENSE" "$DEST/MATHCAT-MIT-LICENSE"
find "$VENDOR_DIR" -type f \( -name '*.d.ts' -o -name '*.map' \) -delete

# Replace CDN import map with fully local browser modules and remove off-site UI links.
python3 - "$DEST/index.html" <<'PY'
from pathlib import Path
import sys
p = Path(sys.argv[1])
s = p.read_text()
s = s.replace('"three": "https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.js",', '"three": "./vendor/three/build/three.module.js",')
s = s.replace('"three/addons/": "https://cdn.jsdelivr.net/npm/three@0.185.1/examples/jsm/",', '"three/addons/": "./vendor/three/examples/jsm/",')
s = s.replace('"crashcat": "https://esm.sh/crashcat@0.0.3"', '"crashcat": "./vendor/crashcat/index.js",\n\t\t\t\t"mathcat": "./vendor/mathcat/index.js"')
for line in [
    '\t<a id="github-link" class="corner-link" href="https://github.com/mrdoob/Starter-Kit-Racing" aria-label="View source on GitHub">\n',
    '\t\t<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.05c-3.2.7-3.88-1.36-3.88-1.36-.52-1.34-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18.92-.26 1.91-.39 2.89-.39.98 0 1.97.13 2.89.39 2.21-1.5 3.18-1.18 3.18-1.18.62 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.13v3.16c0 .31.21.67.79.56C20.21 21.39 23.5 17.07 23.5 12 23.5 5.65 18.35.5 12 .5z"/></svg>\n',
    '\t</a>\n',
    '\t<a id="editor-link" href="editor.html">Create new track</a>\n',
]:
    s = s.replace(line, '')
p.write_text(s)
PY

# Expose a packaging-only readiness marker after all local glTF meshes have loaded
# and the Three.js scene has been created. It does not alter racing physics or assets.
python3 - "$DEST/js/main.js" <<'PY'
from pathlib import Path
import sys
p = Path(sys.argv[1])
s = p.read_text()
needle = '\tanimate();\n\n}\n\ninit();\n'
replacement = '\twindow.RETROPLAY_STARTER_KIT_RACING_READY = true;\n\tanimate();\n\n}\n\ninit();\n'
if needle not in s:
    raise SystemExit('ERROR: upstream readiness insertion point changed')
p.write_text(s.replace(needle, replacement, 1))
PY

cat > "$DEST/SOURCE-NOTICE.txt" <<NOTICE
Starter Kit Racing was packaged by RetroPlay from:
$UPSTREAM_URL
Pinned source commit: $UPSTREAM_COMMIT

Upstream project license: MIT (Copyright 2023 Kenney; Copyright 2026 mrdoob).
Game meshes are identified by upstream as Kenney CC0 assets in README.md.
RetroPlay packaging changes: local vendoring of Three.js $THREE_VERSION,
crashcat $CRASHCAT_VERSION and mathcat $MATHCAT_VERSION; removal of remote
CDN imports and off-site UI links. No gameplay source or mesh data is replaced.
NOTICE

# Static package must be valid JavaScript and cannot contain remote module imports or fetches.
node --check "$DEST/js/main.js"
node --check "$DEST/vendor/crashcat/index.js"
! grep -qE 'https?://|wss?://' "$DEST/index.html"
! grep -RInE "(from|import) ['\"]https?://|fetch\(['\"]https?://|XMLHttpRequest|WebSocket" "$DEST/js"
! grep -RInE 'type="file"|type='"'"'file'"'"'' "$DEST"

echo "Starter Kit Racing runtime packaged at $DEST"
