# Wolfenstein-compatible runtime research — 2026-08-15

## Findings

| Source | Finding | URL |
|---|---|---|
| `54ac/ecwolf-js` | ECWolf already has an Emscripten/WebAssembly browser port and IndexedDB filesystem support. Its build instructions require game IWAD files such as `WL6` files in addition to engine resources. | https://github.com/54ac/ecwolf-js |
| ECWolf upstream | ECWolf is a modern Wolfenstein 3D source port, but is designed to run supported game data rather than supplying replacement game data. | https://github.com/ECWolfEngine/ECWolf |
| id Software source release | The original source release says a released Wolf/Spear data set is required to use a built executable and retains a restrictive limited-use license over supplied materials. | https://github.com/id-Software/wolf3d |
| Wolfenstein 3D Shareware Snap | The official-style package is marked proprietary and limited to the first episode; it directs users to purchase the full game for the remaining episodes. | https://snapcraft.io/wolf3d |

## Legal implementation boundary

A public RetroPlay deployment must not bundle or transform original Wolfenstein 3D data without a clear distribution grant. The feasible compliant path is therefore either:

1. an ECWolf WebAssembly engine that accepts only data a player lawfully provides, or
2. a separate Wolfenstein-style open game whose maps, art, sounds and code all have redistributable licenses.

The next research step is to prioritize an independent compatible open-data game; otherwise an engine-only ECWolf runtime will be delivered with a local lawful-data importer and without copyright game content.
