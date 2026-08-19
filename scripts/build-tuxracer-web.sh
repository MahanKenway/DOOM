#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE_DIR="$ROOT_DIR/third_party/tuxracer-js"
OUTPUT_DIR="$ROOT_DIR/dist/tuxracer"

PNPM=(pnpm)
if ! pnpm --version >/dev/null 2>&1; then
  PNPM_CLI="$(npm root -g)/pnpm/bin/pnpm.cjs"
  test -f "$PNPM_CLI" || { echo "FATAL: a working pnpm CLI is required for the TuxRacer.js build" >&2; exit 1; }
  PNPM=(node "$PNPM_CLI")
fi

# The upstream project is GPL-2.0-only and its lockfile pins the browser build
# dependency graph. Lifecycle scripts are intentionally disabled during install.
(
  cd "$SOURCE_DIR"
  "${PNPM[@]}" install --frozen-lockfile --ignore-scripts --reporter=silent
  "${PNPM[@]}" build
)

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"
cp -R "$SOURCE_DIR/dist/." "$OUTPUT_DIR/"
cp "$SOURCE_DIR/LICENSE" "$OUTPUT_DIR/LICENSE"
cp "$ROOT_DIR/tuxracer/NOTICE.md" "$OUTPUT_DIR/NOTICE.md"

for required in index.html assets LICENSE NOTICE.md; do
  test -e "$OUTPUT_DIR/$required" || { echo "FATAL: TuxRacer.js output missing $required" >&2; exit 1; }
done

echo "TuxRacer.js bundled runtime ready:"
du -sh "$OUTPUT_DIR"
