# OpenRCT2 runtime feasibility for RIFTWAD

**Status:** Not eligible for addition under RIFTWAD’s current no-upload, fully bundled game-data policy.

## Findings

| Requirement | Evidence | Result |
|---|---|---|
| Browser/WASM path exists | `Mstrodl/ORCT2-web` contains an Emscripten build workflow for `openrct2.js`, `openrct2.wasm`, and a browser shell. | Technically possible at the engine level. |
| Fully playable with only free replacement data | The official OpenRCT2 repository states that OpenRCT2 **requires original RollerCoaster Tycoon 2 files** to play. OpenGraphics describes itself as an ongoing replacement project with key blockers, including peep models, track sprites, flat rides, and vegetation. | Not satisfied. |
| No player upload | The inspected ORCT2-web browser shell renders a `webkitdirectory` file input titled “Select your RCT2 data path”, checks for `Data/ch.dat`, and displays “Pick your RCT2 Data directory”. | Explicitly violates the project requirement. |
| Redistributable bundled content | ORCT2-web packages OpenRCT2 engine assets but expects the player’s RCT2 directory under its persistent filesystem. It does not provide a complete lawful replacement campaign and game-data set. | Not satisfied. |

## Decision

RIFTWAD must not add OpenRCT2 as a playable runtime now. Shipping only the engine would recreate the importer-style experience the project has explicitly rejected, while bundling original RCT2 data would not be lawful. The correct future trigger is a complete, officially redistributable, freely licensed RCT2-compatible data set that OpenRCT2 itself supports for normal scenario/sandbox play.

## Sources

1. [OpenRCT2/OpenRCT2 README](https://github.com/OpenRCT2/OpenRCT2) — states the game requires original RollerCoaster Tycoon 2 files and links to its replacement-asset projects.
2. [OpenRCT2/OpenGraphics README](https://github.com/OpenRCT2/OpenGraphics) — explains that free replacement graphics remain incomplete and lists current blockers.
3. [Mstrodl/ORCT2-web](https://github.com/Mstrodl/ORCT2-web) — inspected locally at its default branch; its browser shell requests an RCT2 data directory and validates `Data/ch.dat`.

## FreeRCT browser-build probe

FreeRCT was built from source with its documented `WEBASSEMBLY=ON` CMake path. The build produced `freerct.html`, `freerct.js`, `freerct.wasm`, and a 99,725,136-byte preload data bundle generated from the source tree, demonstrating a data-complete free-content path. The first direct browser launch reached the stock Emscripten shell but displayed `Exception thrown, see JavaScript console`; no console text was exposed by the shell. This candidate remains under technical validation and is not yet approved for RIFTWAD.

FreeRCT is a materially better policy fit than OpenRCT2: its official site describes it as a playable early-alpha, confirms that its latest version can be played in the browser, and its source repository exposes an explicit `WEBASSEMBLY` CMake option that preloads generated RCD graphics/data. The remaining engineering task is a custom RIFTWAD shell for the documented JavaScript save-file bridge; the stock generated shell does not define those bridge functions.

## FreeRCT browser-runtime acceptance

With a minimal shell that supplies the official WebAssembly bridge (`CountRemoteDataFiles`, numbered remote-file getters, and `GameFileSaved`), FreeRCT completed startup from its generated 99.7 MB data package. Browser testing showed the genuine animated FreeRCT title scene and its playable primary menu: **New Game**, **Load**, **Editor**, **Settings**, and **Quit**. No game-data picker, importer, account, or proprietary file appeared. FreeRCT is therefore a viable independent RIFTWAD runtime, subject to normal RIFTWAD shell/control integration and final deployment testing.

## RIFTWAD shell integration probe

The first integrated RIFTWAD page (`freerct.html`) reached `READY` from a fresh local stage and rendered FreeRCT’s genuine animated title screen and principal menu, including **New Game**, **Load**, **Editor**, **Settings**, and **Quit**. The RIFTWAD shell showed only local browser saves, a fullscreen action, touch/keyboard/mouse input metadata, license/source notices, and no importer or file input. This validates the core game-runtime integration before catalog, CI, and final input/fullscreen tests.

## Interaction test note

The integrated canvas continues to render its animated title scene and menu after focused pointer events, with no runtime crash or missing-data error. The automated browser click did not yet transition from the title menu into a park because the browser automation viewport and canvas client coordinates use different scaling; this is an input-test mapping issue, not a startup or data-bundle failure. The next test derives native canvas coordinates from its actual DOM rectangle before selecting **New Game**.

## New-game flow test

FreeRCT’s official `N` main-menu shortcut successfully opened the **Select Scenario** dialog inside the integrated RIFTWAD canvas. The dialog listed the bundled official-easy scenarios **Emerald Expanses** and **Rugged Ravine**, proving that the scenario content is present in the generated free-data package and can be reached through actual engine input. Final scenario activation is being tested with the engine’s canvas interaction mapping.

## Fullscreen acceptance

The integrated FreeRCT canvas entered native browser fullscreen from the RIFTWAD control, rendered the animated title scene and scenario dialog at full viewport size with no black screen, then returned to the normal page layout via Escape without stopping the runtime. This satisfies the project’s fullscreen stability requirement in local browser validation.

## PSP touch-control acceptance

The RIFTWAD PSP control mapped to FreeRCT’s official **New Game** shortcut (`N`) was exercised directly. Its pointer press and release produced the expected `keydown` and `keyup` events with `code: KeyN` and `key: n` on the game canvas. Equivalent buttons are provided for Load (`L`), Editor (`E`), Settings (`O`), Menu (`Escape`), plus a directional pad. The full game canvas remains directly touchable for normal park construction and selection.

## Catalog-to-runtime acceptance

A fresh staged RIFTWAD hub rendered **20 records**, including FreeRCT as record **18** with the cropped screenshot captured from the real local WebAssembly runtime, `INDEPENDENT RUNTIME` state, free/bundled metadata, and **Launch FreeRCT**. Activating that button navigated to `freerct.html`, which reached `READY` with the bundled `freerct.data` package and presented no file picker or importer.

## Runtime-data and local-save acceptance

After launch from the staged catalog, the Emscripten runtime reported `calledRun: true`. Its virtual filesystem contained the generated FreeRCT content at `/wasm/share/freerct/{data,rcd}` and writable local paths at `/wasm/userdata/{save,tracks}`. The RIFTWAD local-save bridge was also exercised with a temporary encoded `.fct` payload: `GameFileSaved` stored it, `CountRemoteDataFiles` enumerated it, and the numbered name/content getters returned it synchronously for engine startup. The temporary probe was deleted immediately after verification.
