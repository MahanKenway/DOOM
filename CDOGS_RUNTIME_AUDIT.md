# C-Dogs SDL Runtime Audit

## Scope

RetroPlay evaluates **C-Dogs SDL** as an independent, browser-based runtime for a top-down retro action game. This runtime is separate from the existing Doom/WAD engine: it has its own WebAssembly module, SDL input path, asset archive, lifecycle and storage policy.

## Upstream and licensing

| Item | Status | Source |
|---|---|---|
| Engine and game source | C-Dogs SDL is an open-source classic overhead run-and-gun game. | [1] |
| Code licence | GPL-2.0; upstream also notes BSD-2-Clause portions. | [1] |
| Game data | Upstream documents CC0, CC-BY and CC-BY-SA terms for data; attribution and licence material must ship with a production bundle. | [1] |
| Browser build pattern | The upstream `make_emscripten.sh` uses SDL2, SDL2_image PNG support, SDL2_mixer OGG support, IDBFS, ASYNCIFY and preloaded data directories. | [2] |

## Browser prototype constraints

The browser build uses a **curated, self-contained asset archive** suitable for static GitHub Pages delivery. It includes the free base data, root graphics, required particle, hat and player-sprite resources, full free music, upstream campaign folders, dogfights and the upstream credits file. Source Blender authoring files are deliberately omitted because the runtime only consumes exported game assets. Multiplayer networking remains disabled by scope.

The WebAssembly build is **session-local**. Durable persistent saves are not advertised for C-Dogs, and the runtime does not use cloud storage. Doom's existing local persistence remains unaffected. Any future C-Dogs save implementation must first pass a separate browser-storage test.

## References

[1]: https://github.com/cxong/cdogs-sdl "C-Dogs SDL — upstream repository and licensing notes"
[2]: https://github.com/cxong/cdogs-sdl/blob/master/make_emscripten.sh "C-Dogs SDL official Emscripten build script"
