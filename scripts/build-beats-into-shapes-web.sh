#!/usr/bin/env bash
# Package the official, browser-ready Beats into Shapes release with every
# playable asset local. RetroPlay distributes this GPL-3.0-or-later rhythm
# game non-commercially and keeps its upstream source and license notices.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CACHE_DIR="${BEATS_INTO_SHAPES_CACHE_DIR:-$ROOT_DIR/.cache/beats-into-shapes-web}"
OUT_DIR="$ROOT_DIR/dist/beats-into-shapes"
ARCHIVE="$CACHE_DIR/beats-into-shapes-HTML5.zip"
UNPACK_DIR="$CACHE_DIR/unpacked"

UPSTREAM_REPO="https://github.com/CoCoSol007/beats-into-shapes"
UPSTREAM_COMMIT="c8d91e3c85d6bf92348be7f447f1047a97c0fe41"
RELEASE_TAG="release-v1.0.1"
RELEASE_URL="https://github.com/CoCoSol007/beats-into-shapes/releases/download/${RELEASE_TAG}/beats-into-shapes-HTML5.zip"
ARCHIVE_SHA256="1b1aa0eaecc6c47282e3abb42ef0877f631a0bd7075bda19729b2f414bc0bd58"
COI_REPO="https://github.com/gzuidhof/coi-serviceworker"
COI_COMMIT="7b1d2a092d0d2dd2b7270b6f12f13605de26f214"

mkdir -p "$CACHE_DIR"
if [[ ! -f "$ARCHIVE" ]] || ! printf '%s  %s\n' "$ARCHIVE_SHA256" "$ARCHIVE" | sha256sum --check --status; then
  rm -f "$ARCHIVE"
  curl --fail --location --retry 3 --retry-delay 2 --output "$ARCHIVE" "$RELEASE_URL"
fi
printf '%s  %s\n' "$ARCHIVE_SHA256" "$ARCHIVE" | sha256sum --check

rm -rf "$UNPACK_DIR" "$OUT_DIR"
mkdir -p "$UNPACK_DIR" "$OUT_DIR"
unzip -q "$ARCHIVE" -d "$UNPACK_DIR"
EXPORT_DIR="$UNPACK_DIR/html5"
for required in beats-into-shapes.html beats-into-shapes.js beats-into-shapes.wasm beats-into-shapes.pck beats-into-shapes.worker.js beats-into-shapes.audio.worklet.js; do
  test -s "$EXPORT_DIR/$required" || { echo "FATAL: expected official web asset missing: $required" >&2; exit 1; }
done
cp -a "$EXPORT_DIR"/. "$OUT_DIR"/
rm -f "$OUT_DIR"/*.import

# Godot's official Web export uses threads and therefore requires COOP/COEP.
# GitHub Pages has no per-directory header configuration, so this tiny MIT
# service worker creates those headers after a single secure-context reload.
curl --fail --location --retry 3 --retry-delay 2 \
  "https://raw.githubusercontent.com/gzuidhof/coi-serviceworker/${COI_COMMIT}/coi-serviceworker.js" \
  --output "$OUT_DIR/coi-serviceworker.js"
curl --fail --location --retry 3 --retry-delay 2 \
  "https://raw.githubusercontent.com/CoCoSol007/beats-into-shapes/${UPSTREAM_COMMIT}/LICENSE" \
  --output "$OUT_DIR/BEATS-INTO-SHAPES-GPL-3.0-OR-LATER.txt"
curl --fail --location --retry 3 --retry-delay 2 \
  "https://raw.githubusercontent.com/gzuidhof/coi-serviceworker/${COI_COMMIT}/LICENSE" \
  --output "$OUT_DIR/COI-SERVICE-WORKER-MIT.txt"
# The Godot iframe can only use SharedArrayBuffer when its top-level wrapper
# is isolated too. Root scope maps to /RetroPlay/ on GitHub Pages.
cp "$OUT_DIR/coi-serviceworker.js" "$ROOT_DIR/coi-serviceworker.js"

if ! grep -q 'src="coi-serviceworker.js"' "$OUT_DIR/beats-into-shapes.html"; then
  sed -i 's#<script src="beats-into-shapes.js"></script>#<script src="coi-serviceworker.js"></script>\n\t\t<script src="beats-into-shapes.js"></script>#' "$OUT_DIR/beats-into-shapes.html"
fi

grep -q 'src="coi-serviceworker.js"' "$OUT_DIR/beats-into-shapes.html" || {
  echo 'FATAL: Cross-Origin Isolation service worker was not attached to Godot launcher.' >&2
  exit 1
}

cat > "$OUT_DIR/SOURCE-NOTICE.txt" <<NOTICE
Beats into Shapes runtime packaged for RetroPlay

Official HTML5 release: $RELEASE_URL
Upstream repository: $UPSTREAM_REPO
Pinned upstream release commit: $UPSTREAM_COMMIT
Release tag: $RELEASE_TAG
Artifact SHA-256: $ARCHIVE_SHA256

Beats into Shapes is licensed GPL-3.0-or-later. Its complete corresponding
source is available from the upstream repository above. The full upstream
license is retained in BEATS-INTO-SHAPES-GPL-3.0-OR-LATER.txt.

This directory is a local copy of the upstream project's official HTML5
release: all gameplay code, art, music, WebAssembly and PCK data are served
from this directory. RetroPlay's package script is
scripts/build-beats-into-shapes-web.sh. No user game file, account, network
score service, ad network or remote playable data is required.

The browser runtime requires Cross-Origin Isolation for Godot threads. The
MIT-licensed COI Service Worker is retained as coi-serviceworker.js.
COI Service Worker upstream: $COI_REPO
Pinned revision: $COI_COMMIT
License: COI-SERVICE-WORKER-MIT.txt
NOTICE

for required in beats-into-shapes.html beats-into-shapes.js beats-into-shapes.wasm beats-into-shapes.pck beats-into-shapes.worker.js beats-into-shapes.audio.worklet.js coi-serviceworker.js BEATS-INTO-SHAPES-GPL-3.0-OR-LATER.txt COI-SERVICE-WORKER-MIT.txt SOURCE-NOTICE.txt; do
  test -s "$OUT_DIR/$required" || { echo "FATAL: Beats into Shapes asset missing: $required" >&2; exit 1; }
done
test -s "$ROOT_DIR/coi-serviceworker.js" || { echo 'FATAL: root isolation worker missing.' >&2; exit 1; }

if grep -nE 'https?://(www\.)?(google-analytics|googletagmanager|facebook|twitter|discord|itch\.io|youtube)\.' "$OUT_DIR/beats-into-shapes.html" "$OUT_DIR/beats-into-shapes.js"; then
  echo 'FATAL: Beats into Shapes runtime still references a legacy remote service.' >&2
  exit 1
fi

echo 'Beats into Shapes static runtime packaged:'
du -sh "$OUT_DIR"
