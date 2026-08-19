# Obsidian Relay: Runtime Architecture

## Technical position

Obsidian Relay is an **original game layer built on the existing OpenResident WebGL2 adapter path**. The implementation does not load OpenResident game assets or any user-provided disc data. It uses the adapter’s browser context setup, camera mathematics, lifecycle functions, and a new original primitive-rendering extension to render its own small world.

| Layer | Responsibility | Source location |
|---|---|---|
| Original game core | World state, player movement, collisions, enemy steering, pickup and door states, exported HUD values | `third_party/openresident-web/obsidian_relay.cpp` |
| Renderer extension | WebGL2 primitive buffers, flat-colour material, original geometry submission, camera and presentation | `third_party/openresident-web/render_web.cpp`, `include/render.h` |
| Browser module API | Modularized Emscripten bridge with initialization, resize, frame, semantic input, interact and restart exports | `dist/shadow-station/obsidian-relay.js` at build output |
| Game host | Loads the module, maps browser keyboard and gamepad state to semantic actions, renders accessible HTML HUD | `shadow-station/index.html` |
| RetroPlay shell | Status messaging, fullscreen, PSP-styled touch controls | `shadow-station.html`, `src/runtime-shell.js` |
| Catalog | Runtime card, real gameplay capture, filtering and navigation metadata | `src/catalog.js`, `assets/screenshots/` |

## Ownership and flow

`ObsidianRelay` owns all simulation data. It stores the explorer, cells, relay state, bulkhead state, hostile echoes, timer, health and objective phase. It exposes only semantic control functions such as move, interact and restart. Browser UI code never alters the level state directly; it sends actions and reads compact exported values for HUD presentation.

The renderer owns WebGL resources and builds simple hard-edged meshes for the station world from coordinates sent by the game core. It provides a coloured primitive pipeline beside the original adapter APIs, but does not call its game-file model, animation or texture loaders. The game core sets a stable diagonal camera target once per frame and submits world props in a deterministic ordering.

## Asset hints

| Asset or motif | In-game role | Intended size | Implementation |
|---|---|---:|---|
| Explorer silhouette | Player readability | 1.8m tall | Original procedural body, coat, lamp and backpack primitives |
| Echo silhouette | Hostile threat | 1.9m tall | Original faceted dark body plus cyan core primitives |
| Signal cell | Objective pickup | 0.45m tall | Original glowing triangular prism |
| Relay console | Progress interaction | 1.5m wide | Original block, inset panel and cyan/amber indicator primitives |
| Bulkhead | Exit lock and payoff | 3.6m wide | Original segmented ring and sliding door primitives |
| Station kit | Navigation and mood | 2m floor tiles, 3m walls | Original slabs, crates, pipes and beacon primitives |

## Runtime state machine

```text
SEARCH → RESTORE → EXIT → COMPLETE
   └────────────→ FAILED ───→ SEARCH (restart)
```

The player starts in `SEARCH`, finds two signal cells, uses the relay console to move to `EXIT`, then crosses the opened bulkhead to reach `COMPLETE`. Enemy contact may bring health to zero and set `FAILED`; restart constructs a clean `SEARCH` state.
