#!/usr/bin/env bash
# Package a fully playable, data-complete OpenTTD WebAssembly runtime for RIFTWAD.
# Engine/browser port: swords02/openttd-online (OpenTTD GPL-2.0-only build).
# Bundled libre base sets: OpenGFX 8.0, OpenSFX 1.0.3, OpenMSX 0.4.2.
# No original Transport Tycoon Deluxe data and no player file upload are used.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK_DIR="${OPENTTD_WORK_DIR:-$ROOT_DIR/.cache/openttd-web}"
OUTPUT_DIR="${OPENTTD_OUTPUT_DIR:-$ROOT_DIR/dist/openttd}"

PORT_REPO="https://github.com/swords02/openttd-online.git"
# Deliberately pinned: this commit contains the inspected, prebuilt Emscripten artifacts.
PORT_COMMIT="d9736f76d80a3677d473578d6248e65ef2239f77"

OPENGFX_URL="https://cdn.openttd.org/opengfx-releases/8.0/opengfx-8.0-all.zip"
OPENGFX_SHA256="43a0c1dabf39cb865394f3a6cc36d4da5c10ecfaaf55652043104806810903be"
OPENSFX_URL="https://cdn.openttd.org/opensfx-releases/1.0.3/opensfx-1.0.3-all.zip"
OPENSFX_SHA256="e0a218b7dd9438e701503b0f84c25a97c1c11b7c2f025323fb19d6db16ef3759"
OPENMSX_URL="https://cdn.openttd.org/openmsx-releases/0.4.2/openmsx-0.4.2-all.zip"
OPENMSX_SHA256="5a4277a2e62d87f2952ea5020dc20fb2f6ffafdccf9913fbf35ad45ee30ec762"

for command in git curl sha256sum unzip tar python3; do
  command -v "$command" >/dev/null
done

BASESET_LOADER_GENERATOR="$ROOT_DIR/scripts/make-openttd-baseset-loader.py"
test -s "$BASESET_LOADER_GENERATOR"

rm -rf "$WORK_DIR" "$OUTPUT_DIR"
mkdir -p "$WORK_DIR/downloads" "$WORK_DIR/extracted" "$OUTPUT_DIR/baseset"

# Fetch exactly the reviewed port revision, rather than whatever the repository's default branch is later.
git init -q "$WORK_DIR/port"
git -C "$WORK_DIR/port" remote add origin "$PORT_REPO"
git -C "$WORK_DIR/port" fetch --depth 1 origin "$PORT_COMMIT"
git -C "$WORK_DIR/port" checkout -q --detach FETCH_HEAD

for artifact in openttd.js openttd.wasm openttd.data; do
  test -s "$WORK_DIR/port/play/$artifact"
  cp "$WORK_DIR/port/play/$artifact" "$OUTPUT_DIR/$artifact"
done

# This web build contains its own language preloader. Keep every upstream language locally
# available and point that built-in loader at RIFTWAD's `openttd/lang/` path rather than
# the otherwise missing site-root `lang/` directory.
test -d "$WORK_DIR/port/play/lang"
cp -a "$WORK_DIR/port/play/lang" "$OUTPUT_DIR/lang"
sed -i 's|fetch("lang/"+name|fetch("openttd/lang/"+name|g' "$OUTPUT_DIR/openttd.js"
! grep -q 'fetch("lang/"+name' "$OUTPUT_DIR/openttd.js"

# These files are part of the engine's own baseset directory and are libre OpenTTD fallback assets,
# not original Transport Tycoon Deluxe files. Preserve them alongside the replacement base sets.
cp -a "$WORK_DIR/port/play/baseset/." "$OUTPUT_DIR/baseset/"

fetch_checked() {
  local url="$1" sha256="$2" filename="$3"
  curl --fail --location --retry 3 --retry-delay 2 --output "$WORK_DIR/downloads/$filename" "$url"
  printf '%s  %s\n' "$sha256" "$WORK_DIR/downloads/$filename" | sha256sum --check --status
}

extract_tar_from_zip() {
  local archive="$1" tar_name="$2" top_dir="$3" label="$4"
  local unpack_dir="$WORK_DIR/extracted/$label"
  mkdir -p "$unpack_dir"
  unzip -q "$WORK_DIR/downloads/$archive" -d "$unpack_dir"
  test -s "$unpack_dir/$tar_name"
  tar -xf "$unpack_dir/$tar_name" -C "$unpack_dir"
  test -d "$unpack_dir/$top_dir"
  cp -a "$unpack_dir/$top_dir/." "$OUTPUT_DIR/baseset/"
}

fetch_checked "$OPENGFX_URL" "$OPENGFX_SHA256" "opengfx-8.0-all.zip"
fetch_checked "$OPENSFX_URL" "$OPENSFX_SHA256" "opensfx-1.0.3-all.zip"
fetch_checked "$OPENMSX_URL" "$OPENMSX_SHA256" "openmsx-0.4.2-all.zip"

extract_tar_from_zip "opengfx-8.0-all.zip" "opengfx-8.0.tar" "opengfx-8.0" "opengfx"
extract_tar_from_zip "opensfx-1.0.3-all.zip" "opensfx-1.0.3.tar" "opensfx-1.0.3" "opensfx"
extract_tar_from_zip "openmsx-0.4.2-all.zip" "openmsx-0.4.2.tar" "openmsx-0.4.2" "openmsx"

# Explicit data-completeness checks. Their absence would trigger a broken startup or a runtime download.
test "$(find "$OUTPUT_DIR/lang" -maxdepth 1 -type f -name '*.lng' | wc -l)" -ge 66

for asset in \
  baseset/opengfx.obg \
  baseset/ogfx1_base.grf \
  baseset/opensfx.obs \
  baseset/opensfx.cat \
  baseset/openmsx.obm \
  baseset/tttheme2.mid; do
  test -s "$OUTPUT_DIR/$asset"
done

# Make all base-set files visible in Emscripten's in-memory filesystem before OpenTTD starts.
# The selected browser build uses legacy glue, so package with the matching FS API rather
# than with the local, newer Emscripten file_packager.
python3 "$BASESET_LOADER_GENERATOR" \
  --source-dir "$OUTPUT_DIR/baseset" \
  --data-output "$OUTPUT_DIR/openttd-basesets.data" \
  --loader-output "$OUTPUT_DIR/openttd-basesets.js" \
  --remote-name "openttd-basesets.data"
test -s "$OUTPUT_DIR/openttd-basesets.data"
test -s "$OUTPUT_DIR/openttd-basesets.js"

# Preserve upstream licensing and attribution next to the deployed artifacts.
cp "$WORK_DIR/port/play/LICENSE" "$OUTPUT_DIR/ENGINE-COPYING.txt"
cp "$WORK_DIR/extracted/opengfx/opengfx-8.0/license.txt" "$OUTPUT_DIR/OPENGFX-LICENSE.txt"
cp "$WORK_DIR/extracted/opensfx/opensfx-1.0.3/license.txt" "$OUTPUT_DIR/OPENSFX-LICENSE.txt"
cp "$WORK_DIR/extracted/openmsx/openmsx-0.4.2/license.txt" "$OUTPUT_DIR/OPENMSX-LICENSE.txt"
cp "$WORK_DIR/extracted/opengfx/opengfx-8.0/readme.txt" "$OUTPUT_DIR/OPENGFX-README.txt"
cp "$WORK_DIR/extracted/opensfx/opensfx-1.0.3/readme.txt" "$OUTPUT_DIR/OPENSFX-README.txt"
cp "$WORK_DIR/extracted/openmsx/openmsx-0.4.2/readme.txt" "$OUTPUT_DIR/OPENMSX-README.txt"

cat > "$OUTPUT_DIR/SOURCE-NOTICE.txt" <<EOF
OpenTTD WebAssembly port source: https://github.com/swords02/openttd-online
Pinned source commit: $PORT_COMMIT
OpenTTD Engine license: GPL-2.0-only (see ENGINE-COPYING.txt)

OpenGFX 8.0 source: https://github.com/OpenTTD/OpenGFX
Archive: $OPENGFX_URL
SHA-256: $OPENGFX_SHA256
License: GPL-2.0-only (see OPENGFX-LICENSE.txt)

OpenSFX 1.0.3 source: https://github.com/OpenTTD/OpenSFX
Archive: $OPENSFX_URL
SHA-256: $OPENSFX_SHA256
License: CC-BY-SA-3.0 for the collection; see OPENSFX-LICENSE.txt for details.

OpenMSX 0.4.2 source: https://github.com/OpenTTD/OpenMSX
Archive: $OPENMSX_URL
SHA-256: $OPENMSX_SHA256
License: GPL-2.0-only (see OPENMSX-LICENSE.txt)

RIFTWAD profile: fully bundled libre base graphics, sound and music. The browser glue is
patched only to resolve its shipped language files from the local openttd/lang/ path on this static site.
No proprietary Transport Tycoon Deluxe files and no user file upload are requested or used.
EOF

for artifact in openttd.js openttd.wasm openttd.data openttd-basesets.js openttd-basesets.data ENGINE-COPYING.txt OPENGFX-LICENSE.txt OPENSFX-LICENSE.txt OPENMSX-LICENSE.txt SOURCE-NOTICE.txt; do
  test -s "$OUTPUT_DIR/$artifact"
done

echo "OpenTTD runtime packaged in: $OUTPUT_DIR"
du -sh "$OUTPUT_DIR"
ls -lh "$OUTPUT_DIR"/openttd.{js,wasm,data} "$OUTPUT_DIR"/openttd-basesets.{js,data}
