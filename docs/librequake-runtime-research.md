# LibreQuake Web Runtime Research Note

**Author:** Manus AI  
**Date:** 2026-08-15

## Selection decision

RetroPlay’s Quake-engine runtime uses **Qwasm** as the GPL WebAssembly engine layer and **LibreQuake Lite v0.09-beta** for game data. This delivers a complete independent classic first-person experience while deliberately excluding all original Quake game-data archives.

| Component | Selected source | Reason |
|---|---|---|
| Browser engine | [GMH-Code/Qwasm][1] | A dedicated Emscripten/WebAssembly port of the Quake engine with browser storage support. |
| Game content | [LibreQuake Lite v0.09-beta][2] | The project describes Lite as a shorter, simplified release containing all data required to play LibreQuake. |
| License posture | [LibreQuake project statement][3] | LibreQuake explicitly describes its data as free content that may be used, copied, redistributed and modified under its retained license. |

> The original Quake source release states that the **engine code** is GPL but its original **game data remains copyrighted and cannot be redistributed**.[4]

Therefore the build script downloads only `lite.zip` from LibreQuake’s official GitHub release, validates the presence of its `pak0.pak`, `pak1.pak`, license and credit files, and packages those files into the runtime. It does not fetch, embed or transform any original Quake shareware or retail archive.

## Runtime implementation

The reproducible build script compiles Qwasm with Emscripten and preloads the LibreQuake `id1/` directory into `index.data`. A small RetroPlay-only startup profile replaces configuration directives meant for unrelated desktop source ports. It binds browser controls, opens the free map `lq_e0m1`, and eliminates unsupported-command diagnostics without changing game assets. Browser saves remain in Qwasm’s IndexedDB location.

The public runtime is deliberately labeled **LibreQuake**, not Quake, and includes engine, data license, credit and source-notice files alongside the artifacts.

## References

[1]: https://github.com/GMH-Code/Qwasm "GMH-Code/Qwasm"
[2]: https://github.com/lavenderdotpet/LibreQuake/releases/tag/v0.09-beta "LibreQuake v0.09-beta release"
[3]: https://github.com/lavenderdotpet/LibreQuake "LibreQuake project"
[4]: https://github.com/id-software/quake "id Software Quake GPL source release"
