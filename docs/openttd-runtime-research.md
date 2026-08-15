# OpenTTD Web Runtime Research Note

**Date:** 2026-08-15

## Candidate evaluation

OpenTTD is selected as the next fully playable strategy runtime candidate because both the engine and the necessary replacement base sets are openly licensed and a maintained browser/touch build path exists.

| Component | Evidence | Source |
|---|---|---|
| WebAssembly/touch port | `pelya/openttd-touch-webapp` describes OpenTTD as a web application with touchscreen interface and provides an Emscripten build procedure. | https://github.com/pelya/openttd-touch-webapp |
| Ready browser bundle precedent | `swords02/openttd-online` describes a WebAssembly build that includes OpenGFX, OpenSFX and OpenMSX, and states that no extra downloads or accounts are required. | https://github.com/swords02/openttd-online |
| Graphics base set | OpenGFX says it provides all graphics required to enjoy OpenTTD and is GPLv2. | https://github.com/OpenTTD/OpenGFX |
| Engine and replacement data | OpenTTD describes its engine as GPLv2 and identifies OpenGFX, OpenSFX and OpenMSX as free data files when original TTD files are unavailable. | https://github.com/OpenTTD/OpenTTD |

## Decision criterion

The runtime must bundle the engine and the OpenGFX, OpenSFX and OpenMSX base sets. It will not ask a player to provide original Transport Tycoon Deluxe files, create an account or download a separate game package. The build should use a browser-focused OpenTTD port with tested touch input and preserve full-screen rendering in the custom RetroPlay shell.

## Verified packaging contract

The checked OpenTTD Online artifacts (`openttd.js`, `openttd.wasm`, and `openttd.data`) contain the engine and OpenTTD's internal fallback files, but not a complete free graphics, sound, and music set. The RetroPlay build therefore packages the official archives directly in `baseset/`; OpenTTD's documented baseset discovery uses this directory, so the game can start immediately without runtime bootstrap downloads or player-supplied Transport Tycoon Deluxe files.

| Base set | Pinned version | Official archive | Role in runtime | License |
|---|---:|---|---|---|
| OpenGFX | 8.0 | https://cdn.openttd.org/opengfx-releases/8.0/opengfx-8.0-all.zip | Complete free graphics | GPL-2.0-only |
| OpenSFX | 1.0.3 | https://cdn.openttd.org/opensfx-releases/1.0.3/opensfx-1.0.3-all.zip | Complete free sound effects | CC-BY-SA-3.0 (collection; supporting files GPL-2.0-or-later/CDDL-1.1) |
| OpenMSX | 0.4.2 | https://cdn.openttd.org/openmsx-releases/0.4.2/openmsx-0.4.2-all.zip | Free music set | GPL-2.0-only |

Each archive URL was verified on 2026-08-15 to return a ZIP payload from the official OpenTTD CDN. The build will verify the downloaded archive checksums before extraction and will retain the upstream license and notice files alongside the runtime.

## Runtime compatibility notes

The selected `swords02/openttd-online` browser build is an Emscripten runtime that accepts a custom `Module` object before `openttd.js` is loaded. Its existing shell uses `IDBFS` for browser-local persistence, a canvas named `canvas`, and DOM keyboard/touch events. RetroPlay can provide the same Module contract while replacing the unrelated toolbar, analytics, bootstrap overlay, and file-import UI with the project's PSP-style page. The runtime will direct `locateFile` to the local `openttd/` folder and use a fullscreen wrapper that resizes the canvas on the browser `fullscreenchange` event.

The upstream browser build's own `play/baseset` directory holds internal OpenTTD fallback assets and metadata for the original TTD base sets. It does not contain proprietary Transport Tycoon Deluxe files; RetroPlay will include only the three independently free replacement sets listed above.

## Sources

1. https://github.com/OpenTTD/OpenGFX
2. https://github.com/OpenTTD/OpenSFX
3. https://github.com/OpenTTD/OpenMSX
4. https://github.com/swords02/openttd-online
5. https://www.openttd.org/downloads/opengfx-releases/latest
6. https://www.openttd.org/downloads/opensfx-releases/latest
7. https://www.openttd.org/downloads/openmsx-releases/latest
