# Modern Runtime Selection for RetroPlay

**Decision date:** 2026-08-15  
**Selected runtime:** **Neverball**  
**Delivery order:** Neverball is the first modern, creative runtime to be integrated and tested end-to-end. Additional candidates remain outside the catalog until they meet the same acceptance gate.

## Acceptance gate

A candidate must be independently playable from first load on the static GitHub Pages deployment. Its engine and bundled base content must have compatible free licences; it must not require an account, proprietary data, or a user upload. The deployment must have a reproducible source build, browser-local persistence where appropriate, a stable fullscreen path, touch controls designed for the game rather than a generic keyboard overlay, and a real gameplay screenshot captured after test play.

| Candidate | Decision | Reason |
|---|---|---|
| **Neverball** | **Accepted** | It has a maintained source tree, an upstream WebAssembly deployment workflow, bundled game data, browser-local replay support, and documented keyboard, gamepad and touchscreen controls. The official browser build launched to visible 3D gameplay during evaluation. [1] [2] [3] |
| The Powder Toy | Deferred | It is a compelling GPL physics-sandbox candidate with a real Emscripten target, and its official web build reached the live sandbox. However, its upstream local wasm server explicitly emits COOP and COEP headers; static GitHub Pages cannot set those headers. It will not enter RetroPlay until an independently verified headerless build and no-upload interaction layer are available. [4] [5] |
| SuperTux | Rejected for this release | The project provides a WebAssembly route, but the v0.7.0 wasm build has a documented crash after loading the large data file. This violates the no-known-runtime-error requirement. [6] [7] |
| SuperTuxKart | Rejected for this release | The available browser port identifies itself as experimental, documents incomplete rendering/network support, a 120 MB initial download, and about 500 MB memory usage. [8] |

## Neverball integration design

Neverball is a three-dimensional physics-puzzle game in which the player tilts the floor, collects coins, and reaches an exit before time expires. RetroPlay will use the project’s upstream Emscripten build model, pin the source revision, package its own base data, and present a dedicated launch page.

The runtime page will use browser-local storage for configuration and replays, rather than exposing the upstream replay or add-on upload interface. Its touchscreen interface will map a visible PSP-style D-pad to the floor-tilt direction, while camera actions and pause/fullscreen controls are supplied as dedicated touch buttons. Desktop keyboard and gamepad support remain available. The page will expose an explicit fullscreen action and report startup errors in-page instead of leaving a black canvas.

## References

[1]: https://github.com/Neverball/neverball "Neverball source repository"
[2]: https://play.neverball.org/ "Play Neverball official WebAssembly build"
[3]: https://github.com/Neverball/neverball/blob/master/.github/workflows/web-deploy.yml "Neverball upstream WebAssembly deployment workflow"
[4]: https://github.com/The-Powder-Toy/The-Powder-Toy "The Powder Toy source repository"
[5]: https://github.com/The-Powder-Toy/The-Powder-Toy/blob/master/resources/serve-wasm.template.py "The Powder Toy local wasm server template"
[6]: https://www.supertux.org/download "SuperTux downloads and WebAssembly availability"
[7]: https://github.com/SuperTux/supertux/issues/3739 "SuperTux WebAssembly crash report"
[8]: https://supertuxkart.pages.dev/ "SuperTuxKart experimental WebAssembly port"
