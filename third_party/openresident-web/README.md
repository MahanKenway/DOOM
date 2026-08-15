# OpenResident WebGL2 probe adapter

This directory contains a **minimal, graphics-only Emscripten adapter** derived from the [XProger/OpenResident](https://github.com/XProger/OpenResident) source revision `00711c427297d70664be1fa86201bea11b9a9a04`.

The adapter is built by the RetroPlay GitHub Pages workflow into `dist/openresident/`. Its public host is `openresident.html`, which only validates WebAssembly and WebGL2 renderer setup. It does not initialise a game session and it does not contain, obtain, request, mount or distribute any Resident Evil game data.

The included upstream `LICENSE` applies to the copied OpenResident source material. RetroPlay-specific adapter changes are also supplied under the same BSD 2-Clause terms.

A complete playable browser port is outside this probe. It would need a production browser platform layer, robust input and audio adapters, a lawful local-data workflow, renderer parity testing and full-game compatibility validation before it could be listed as playable.
