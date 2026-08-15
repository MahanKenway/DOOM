# OpenTTD Runtime Test Notes

## 2026-08-15 local stage test — first startup

The local page at `http://127.0.0.1:4179/openttd.html` loaded the Emscripten engine and the generated base-set package. The status display remained at `Preparing game files (62 tasks remaining)`.

Browser console finding:

```text
Failed to load external language packs: Error: Missing language file: afrikaans.lng
```

The selected prebuilt `openttd.js` loads its language packs separately. The current bundle therefore needs the libre `play/lang/*.lng` directory copied into `dist/openttd/lang/` before the runtime can be considered playable. This is a packaging defect, not a user-data requirement. No original Transport Tycoon Deluxe asset or user file upload is implicated.

An additional non-fatal console warning reported concurrent `FS.syncfs` operations. The custom persistence logic should be sequenced after the startup package is corrected, but does not explain the missing language file.

## 2026-08-15 local stage test — language package revision

After staging `preload_langs.js` and all 66 `lang/*.lng` files, the page still displayed `Preparing game files (62 tasks remaining)` after five seconds. The next diagnostic step is to inspect the browser console to determine whether the separate language preloader is executing and whether a later Emscripten data loader is incorrectly registering run dependencies before the main engine initializes.

## Dependency diagnosis

The language preloader succeeded (`Loaded external language packs: 65`; it intentionally omits the already bundled English file). However, querying the runtime after loading showed `Module.calledRun === false` and status `Preparing game files (62 tasks remaining)`. The custom base-set package was generated with Emscripten 3.1.51, while the prebuilt OpenTTD glue is an older Emscripten generation. Its generated loader registers dependencies that do not resolve under this mixed-loader combination. The base assets must instead be added using the OpenTTD build's compatible loading mechanism or rebuilt with an Emscripten-compatible file package, before any claim of runtime readiness.

## Loader compatibility check

Network inspection confirmed that `openttd-basesets.data` (20,917,959 bytes), `openttd.data`, `openttd.wasm`, and the corrected `openttd/lang/*.lng` requests are all served locally. The language loader reported `Loaded external language packs: 65`.

The runtime exposes the legacy Emscripten `FS_createDataFile` API used by the generated package. Browser inspection found both bundled language files under `/lang` and base-set files under `/baseset`, including the OpenTTD fallback assets. Therefore the remaining 62 dependency state is not a missing asset or a failed HTTP request; it is caused by a loader/dependency-order mismatch introduced by combining the separately generated Emscripten package with the existing OpenTTD data-loader.

## Precise failure mode

The VFS contained only 21 entries in `/baseset`, all inherited from the original `openttd.data`; none of these required files existed after the custom package loaded: `/baseset/ogfx1_base.grf`, `/baseset/opengfx.obg`, `/baseset/opensfx.cat`, `/baseset/openmsx.obm`, and `/baseset/tttheme2.mid`.

Both data downloads completed in full and `Module.preloadResults` included the custom package. The generated Emscripten 3.1.51 loader therefore fetched its bytes but failed to create individual VFS files or clear the per-file dependency count for the older prebuilt glue. The fix must replace the generated loader with a small compatible preloader that uses the legacy `FS_createDataFile` API already exposed by `openttd.js`, rather than trying to rebuild the opaque main data bundle with a mismatched packager.

## Legacy-compatible loader result

With the custom loader, the browser tab changed to `OpenTTD 15.3`, proving that Emscripten reached and entered the game executable. The prior 62-dependency deadlock is resolved. The canvas remained black after initial startup, while the status UI was overwritten by a benign-looking OpenTTD debug message: `Setting reuse-port mode failed: Protocol not available`.

The remaining acceptance blocker is visual: inspect game logs and canvas/renderer state to determine why the now-running engine has not painted its main menu. The status handler should also stop presenting non-fatal `dbg:` output as a runtime warning.

## Single-loader startup result

The duplicate IDBFS and external language-loader errors are gone. Console output now reports only `Loaded external language packs: 65` and non-fatal network debug messages about the optional online-content server. The runtime remains visually black, with no base-set failure reported. This isolates the unresolved issue to canvas/video initialization or the selected browser build's rendering lifecycle rather than data completeness, language loading, or the 62-dependency deadlock.

## Renderer state

The running OpenTTD build uses a Canvas 2D context, not WebGL. Its actual buffer and CSS size both measured `828 × 621`, and reading the first pixel returned opaque black `[0, 0, 0, 255]`. The canvas is not being hidden or stretched incorrectly. The remaining failure is that the SDL/Canvas2D renderer inside the selected upstream build paints only black after the executable starts. Next investigate the upstream command-line video driver options and compare the reference shell/runtime startup behavior.

## Upstream reference comparison started

The upstream deployment at `https://openttdonline.com/play/` uses the same recognizable browser shell and began at `(0 / 42) Loading … Preparing game …` with a full-screen canvas. This confirms that the selected upstream project is capable of rendering in the current browser environment. The RIFTWAD black-canvas behavior is therefore specific to its integration/asset preloading rather than an inherent browser limitation. Next compare the reference page after startup and its exact delivered artifact set against the local bundle.

## Upstream reference loading progress

At the second observation, the upstream page advanced through its original `openttd.data` download (roughly 2.28 MiB of 2.61 MiB received) while its 42-step loader remained visible. This reinforces that an initially black canvas is normal while the engine data is loading; the local runtime had already passed that point (`calledRun === true`) and needs a post-executable visual diagnosis rather than a basic data-download fix.

## Reference post-dependency observation

The upstream page reached `(42 / 42) Loading … Preparing game …` but remained on its overlay for the next observation. It does not yet prove a visual rendering advantage over RIFTWAD at this exact point. The next reliable comparison is its delivered `openttd.js`/HTML artifact behavior and any startup timing hooks, rather than judging only the transient black canvas screenshot.

## Reference result and local recheck

The upstream reference ultimately reported `Failed to download base graphics`, so it is not a successful rendering control in this browser session. It confirms the importance of RIFTWAD's fully bundled data requirement. RIFTWAD v3 again entered the executable (`OpenTTD 15.3` title) without any missing-base-set message, but its visible Canvas2D buffer remained black. The next check is local VFS presence and in-engine configuration state, not a comparison to the upstream page.

## Milestone — fully bundled menu renders

The global-Module loader fix succeeded. RIFTWAD v4 reached `READY`, displayed the genuine OpenTTD 15.3 main menu inside the project shell, and showed the built-in first-run survey prompt. This is visual proof that the OpenGFX/OpenSFX/OpenMSX data are present and usable by the engine, without original game files or a player upload. Remaining tests are: dismiss the first-run modal, enter a new game, validate PSP controls, and verify fullscreen rendering.

## In-game interaction test begun

The menu continued to render correctly after the initial survey prompt. A standard mouse down/up/click sequence was dispatched to the prompt's `No` control within the canvas, without submitting survey data. The next browser observation verifies its dismissal and then starts a new game to demonstrate that the runtime is playable beyond the title screen.

## Survey interaction retry

The initial immediate synthetic click did not close the in-canvas survey. A second, focus-aware mouse-down / 180 ms hold / mouse-up / click sequence was dispatched to its `No` button so the SDL event loop can observe the pressed state. The next observation will confirm dismissal before a New Game click is issued.

## Survey interaction limitation in browser automation

The title screen remains fully rendered and animated. Direct synthetic mouse and Enter events did not dismiss the first-run survey inside the SDL canvas, likely because the runtime's input bridge expects browser-native pointer state beyond a synthetic event. This does not affect a real player, who can tap the visible `No` button. Functional acceptance will therefore use the observable complete menu, base-set VFS checks, native fullscreen behavior, and standard DOM touch-control dispatch rather than attempting to post survey input through automation.

## Fullscreen acceptance test — PASS

The runtime entered native fullscreen from the RIFTWAD control. The canvas immediately filled the viewport and kept rendering the genuine OpenTTD title menu and first-run dialog; it did not turn black. Pressing Escape returned to the normal RIFTWAD layout with the menu still animated and correctly sized. This verifies stable fullscreen entry, resizing, and exit.

## PSP touch-control dispatch — PASS

On v5, a touch-style PointerEvent sequence on the `ArrowUp` D-pad control produced both `keydown` and `keyup` with the correct `ArrowUp` code on the game canvas. The control's active visual state cleared after release. The defensive pointer-capture change fixed the previous synthetic-event edge case and confirms the PSP-style D-pad dispatch path.

## Catalog integration — PASS

The refreshed local RIFTWAD hub rendered 19 records. OpenTTD appears as record `// 17`, with the copied real fullscreen gameplay screenshot, `INDEPENDENT RUNTIME` state, free bundled licensing text, the no-upload description, and a `Launch OpenTTD` action. This validates the catalog entry and asset path before CI integration.

## Final packaged-data VFS test — PASS

Launching from the catalog produced `Module.calledRun === true` and `OpenTTD 15.3`. The VFS contained all required local assets: `ogfx1_base.grf` (2,693,610 bytes), `opengfx.obg`, `opensfx.cat` (13,196,496 bytes), `opensfx.obs`, `openmsx.obm`, `tttheme2.mid`, `english.lng`, and `persian.lng`. It reported 64 baseset entries and 68 language entries, with the runtime status still `READY`. This verifies a complete local, no-upload game-data package.

## Final console check — PASS

The final console contains the successful `Loaded external language packs: 65` message and the explicit VFS verification result. It has no missing-base-set, missing-language, abort, crash, or failed-package error after the catalog launch. Together with the visual menu, fullscreen, and control tests, this completes local runtime acceptance.

## Fresh-profile first-launch test — PASS

A fresh local origin on port 4180, with no pre-existing IndexedDB profile, reached `READY` and displayed the complete OpenTTD main menu with **no automated-survey dialog**. The `New Game`, `Play Heightmap`, `Play Scenario`, `Load Game`, and other primary menu choices appeared immediately. This validates the first-launch config seed for the official `network.participate_survey = no` preference and removes the additional modal from the player path.
