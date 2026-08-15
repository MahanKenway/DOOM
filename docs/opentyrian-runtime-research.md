# Engine selection: OpenTyrian2000 for RetroPlay

## Decision

The fourth independent RetroPlay runtime will be **OpenTyrian2000**, an open-source port of the arcade-style vertical shooter *Tyrian 2000*. It is distinct from the Doom WAD runtime, C-Dogs SDL, and GNU FreeDink both in engine and game genre.

## Evidence and integration basis

| Criterion | Finding | Source |
|---|---|---|
| Engine license | The browser-port documentation declares GPLv2 source. | https://github.com/aescarcha/opentyrian-wasm/blob/main/README-WASM.md |
| Game data status | Tyrian 2000 data is documented by the project as freeware and is fetched from the documented Camanis archive. | https://github.com/aescarcha/opentyrian-wasm/blob/main/README-WASM.md |
| WASM build path | The browser fork documents Emscripten output as HTML/JS/WASM/data and browser-local IndexedDB saves. | https://github.com/aescarcha/opentyrian-wasm/blob/main/README-WASM.md |
| Controls | The upstream project documents arrow-key movement, Space fire, Enter rear-weapon mode, and Ctrl/Alt sidekick fire. | https://github.com/opentyrian/opentyrian |
| Fullscreen | The upstream source has dedicated fullscreen handling; RetroPlay will use the browser Fullscreen API rather than depend on legacy Alt+Enter. | https://github.com/opentyrian/opentyrian |

## Rejected alternative

Brogue Community Edition is a capable libre roguelike, but the browser project discovered for it is an older learning exercise rather than a maintained, ready-to-package WebAssembly build. OpenTyrian2000 has a documented Emscripten build path and a freeware data source, making it lower risk for a fully verified deployment.

## Validation commitments

The integration must demonstrate a rendered title/menu or gameplay screen, working keyboard and virtual PSP controls, browser-local saves where the runtime supports them, stable document fullscreen, and zero game-engine console errors before deployment.
