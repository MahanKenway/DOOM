# Obsidian Relay: Build Memory

## Confirmed constraints

1. The supplied `ResidentEvil(USA).7z` archive lists only a `.bin` disc image and a `.cue` sheet. It has no source-code files in its archive manifest. It is not extracted, mounted, executed, copied or shipped.
2. The existing `third_party/openresident-web` integration is a BSD-licensed, graphics-only WebGL2/Emscripten adapter derived from OpenResident. It currently proves browser rendering through `renderInit`, `renderResize`, `renderClear` and related APIs without starting a data-driven game session.
3. The game must provide a fully self-contained, first-load browser experience with no player upload, PSP-style touch controls, working fullscreen, a canvas fallback if practical, and a genuine runtime screenshot for the catalog.
4. GitHub Pages builds source through `.github/workflows/build-and-deploy.yml` using Emscripten. The build already produces `dist/openresident/openresident-probe.*`, so a second modularized Emscripten output can be added without changing hosting architecture.

## Engine decision

The original game will be named **Obsidian Relay**. It will use an original C++ simulation layer and an original primitive-render extension of the existing OpenResident WebGL2 adapter. No data-oriented components from OpenResident’s historic game loaders will be invoked. This preserves a real technical relationship to the adapter while keeping the game and all of its gameplay data entirely original.

## Visual decision

A project-specific visual target is stored at `.cache/obsidian-relay-visual-target.png`. It establishes a graphite/cyan/amber/rust station aesthetic, a high three-quarter camera, a player explorer, two echoes, a signal-cell collectible, relay console, bulkhead and simple HUD. It is not public artwork and is not eligible for the catalog card.

## Build risks to validate

- The extension must compile against WebGL2 and Emscripten 3.1.51 with no external data dependencies.
- Context setup must succeed in a normal browser canvas and must resize before the first rendered frame.
- Renderer output must remain visible during fullscreen and touch interaction.
- C++ exports and JavaScript controls must not duplicate held key transitions or allow an interaction soft-lock.

## Local preview observation

The first local navigation to `http://localhost:4173/shadow-station/` identified the game canvas, but the immediate browser state view returned `about:blank` rather than the active page. This does not validate rendering or indicate a game error; the next verification pass must navigate fresh, inspect the browser console and capture an actual visible frame before a screenshot is accepted.

## Visual QA progress

The local WebAssembly build compiles successfully after three renderer-specific corrections: the game world is scaled into the adapter’s native unit range, its positive-up simulation coordinates are translated to the adapter’s negative-up convention, and original geometry is rendered through a stable dimetric shader rather than the legacy asset-camera matrix. The current local browser frame visibly shows the explorer, cyan station lights, a signal-cell pickup, cargo obstacle, station shell and HUD. Painter-order rendering keeps interactable silhouettes visible instead of allowing the station shell to hide them. The next verification pass must test movement/progression, fullscreen and the RetroPlay wrapper, then take the catalog screenshot from the live runtime.

## Input QA trace

The browser accepted synthetic `ArrowLeft` and `ArrowUp` keyboard events against the running WASM host without console errors. The movement path is being used to confirm collision and pickup progression before release; a visual frame and HUD values must be inspected after this sequence rather than relying on event dispatch alone.

## Survival and restart evidence

A sustained movement test allowed the pursuing echoes to reduce health to zero, visibly switching the HUD to `SURVEYOR DOWN` and an explicit restart prompt. The runtime remained responsive and a synthetic Enter action was then sent to exercise the failed-state restart path. The next visual frame will confirm its restored health/objective values.

## Restart verification

The post-restart browser frame restored `SURVEYOR VITALS 100`, `SIGNAL CELLS 0 / 2`, and `RECOVER TWO SIGNAL CELLS`, while displaying the explorer, a cyan cell and the station crate. This confirms the failed-state reset path works without an iframe reload or a control lock.

## Wrapper and fullscreen verification

The local `shadow-station.html` RetroPlay wrapper loaded the iframe, received `Obsidian Relay online. Recover the signal cells.` through the runtime-status message, and displayed the expected runtime facts. Its fullscreen button expanded the active canvas while the original station scene and HUD remained visible; no black-screen failure occurred.
