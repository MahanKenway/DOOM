# License and persistence research

## Content policy

Freedoom states that the original Doom program code was released separately while Doom game content remains proprietary. It describes Freedoom as a complete free/libre replacement and says its assets are BSD-licensed; redistribution must retain the same copyright statement and credit the project. Its repository further describes three distributable WADs: Freedoom Phase 1, Freedoom Phase 2, and FreeDM, and explicitly states that redistribution is allowed provided the license remains intact.

Final Doom content, including TNT: Evilution and The Plutonia Experiment, is treated by RIFTWAD as **metadata-only / bring-your-own-file**. The catalog may describe compatibility and help a user attach a legally obtained IWAD, but it must not bundle or host those WAD files. Community archive entries also require per-item license review before hosting; a third-party archive listing alone is not proof of redistribution rights.

## Runtime persistence capability

The existing web I/O shim already maps `doomsav0.dsg` through `doomsav5.dsg` to browser localStorage. Its write path flushes each save buffer on close through `js_storage_save`, and its read/access path loads save data via the corresponding `js_storage_load_*` imports. This means genuine vanilla-style save games already have a local persistence backend; the current gap is product UI, save slot visibility, namespacing by WAD profile and robust quota/error reporting.

Cloud saves cannot be safely implemented in a static GitHub Pages deployment alone because they require an authenticated backend or a user-owned sync provider. The practical phase-one path is advanced local persistence with export/import; cloud sync is a separate opt-in phase once an authenticated backend is selected.

## Sources

1. Freedoom project, "What is Freedoom?" — https://freedoom.github.io/about.html
2. Freedoom GitHub repository and distribution guidance — https://github.com/freedoom/freedoom
3. Final Doom support reference (commercial product support) — https://support.gog.com/hc/en-us/articles/213529629-Final-Doom
4. Doomworld idgames archive (automated extraction blocked; use browser/manual review for individual items) — https://www.doomworld.com/idgames/
