# OpenResident WebGL2 adapter

This directory contains a focused WebGL2/Emscripten adapter derived from the [XProger/OpenResident](https://github.com/XProger/OpenResident) source revision `00711c427297d70664be1fa86201bea11b9a9a04`.

RetroPlay’s GitHub Pages workflow builds two separate browser outputs from this adapter. The first is `dist/openresident/openresident-probe.*`, a graphics-only compatibility probe hosted by `openresident.html`. It does not initialize a data-driven game session and does not contain, obtain, request, mount or distribute any Resident Evil game data.

The second is `dist/shadow-station/obsidian-relay.*`, an original RetroPlay game runtime hosted by `shadow-station.html`. Its C++ game layer is `obsidian_relay.cpp`; it uses the adapter’s WebGL2 context lifecycle and an original procedural primitive extension in `render_web.cpp`. Obsidian Relay creates its own station geometry, simulation, characters, collectibles, puzzle state and UI. It does not call the historical game-resource loaders and has no dependency on any Resident Evil disc image or other commercial game data.

| Output | Purpose | Data policy |
|---|---|---|
| `openresident-probe.*` | WebGL2/WebAssembly compatibility study | No game session; no game data |
| `obsidian-relay.*` | Original 3D survival-exploration runtime | Self-contained original simulation and geometry only |

The included upstream `LICENSE` applies to the copied OpenResident source material. RetroPlay-specific adapter changes and the Obsidian Relay source are supplied under the same BSD 2-Clause terms.
