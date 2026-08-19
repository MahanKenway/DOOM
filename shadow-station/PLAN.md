# Game Plan: Obsidian Relay

## Originality boundary

**Obsidian Relay** is a new survival-exploration game set in an abandoned ocean-floor communications station. It contains no characters, names, locations, models, textures, audio, dialogue, level layouts, code, or data from the user-supplied disc image. The archive is not extracted, mounted, read at the filesystem level, or included in the build.

## Risk Tasks

### 1. OpenResident WebGL2 procedural-render extension

- **Why isolated:** The upstream-derived browser adapter establishes a WebGL2 context and has a renderer oriented around its own asset formats. An original game needs independently authored procedural world geometry without parsing or accessing any external game-data format.
- **Approach:** Extend only the BSD-licensed renderer adapter with a small flat-colour primitive path. The game will submit original boxes, slabs, beacon elements, actor silhouettes, and energy cells; the renderer will use the existing `renderInit`, `renderResize`, `renderSetCamera`, `renderClear`, and browser event-loop model. No original game asset parser is invoked.
- **Verify:** A WebAssembly module draws a visible corridor, floor, player silhouette, energy cell, enemy silhouette, and closed bulkhead inside the `#canvas` element on first load; it resizes without WebGL errors.

### 2. Fixed-camera movement and collision

- **Why isolated:** A fixed elevated camera with screen-relative controls can feel inconsistent if forward/back input is interpreted in room coordinates rather than the visible scene, while close geometry can trap the player.
- **Approach:** Keep the world compact and grid-informed. Convert actions into a controlled X/Z walk vector; clamp the player to the station hull, resolve box collisions, and have the camera follow at a stable diagonal offset. Retain a keyboard-action state map so touch buttons and gamepads share the same input route.
- **Verify:** Arrow keys, WASD, PSP d-pad and analog input move the explorer in the expected visible direction; the explorer cannot walk through wall blocks or outside the room boundary.

### 3. Survival loop and explicit progression state

- **Why isolated:** The pickup-to-switch-to-door sequence must not soft-lock when the player revisits rooms or an enemy collides during interaction.
- **Approach:** Use explicit states: `SEARCH` (find two signal cells), `RESTORE` (activate relay console), `EXIT` (door unlocks), `COMPLETE`, and `FAILED`. Enemies use simple steering with separation against world walls. Damage has a short cooldown. The host HUD reads compact numeric state exported from the module.
- **Verify:** Collecting both cells enables console interaction; the console changes its light and unlocks the door; walking through the open door reaches completion. Enemy contact decreases health only once per cooldown and restart reliably resets all state.

## Main Build

The player is a lone relay surveyor trapped inside **Obsidian Relay**, a submerged signal station whose maintenance systems have begun producing hostile memory-echoes. The compact vertical slice has an entry hall, a flooded side bay, a relay console, two original triangular signal cells, two echo entities, an emergency door, and a final exit plane. The intended survival-horror tension comes from low health, spatial navigation, scarce cells that unlock progress, proximity danger, and an objective sequence rather than from any copied narrative or assets.

- **Assets needed:** The game uses an original visual target and a limited graphite/cyan/amber/rust art direction. Its in-game geometry is procedural and uses generated colour/material cues rather than third-party game assets. The catalog image will be a real browser capture of this runtime, never generated artwork.
- **Verify:**
  - The runtime begins rendering immediately after the small WASM module loads, without user files or uploads.
  - Keyboard, PSP-style touch controls, and standard gamepad actions map to one shared input system.
  - The health meter, cell count, objective, and prompt remain readable at desktop and mobile widths.
  - The interaction loop works: collect two cells, activate relay, unlock exit, complete.
  - Fullscreen preserves an active canvas and controller interaction rather than producing a black surface.
  - Screenshot capture shows actual Obsidian Relay gameplay with the explorer, one cell or relay, a hostile echo, and the HUD.
  - No runtime errors occur in the browser console during the verification run.
  - The reference visual language is maintained: a high three-quarter camera, compact corridor geometry, graphite/cyan/amber/rust palette, and sharp hard-edged silhouettes.
