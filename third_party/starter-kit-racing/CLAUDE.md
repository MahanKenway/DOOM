# Starter Kit Racing

Port of the Kenney "Starter Kit Racing" Godot 4.6 project to plain JavaScript and three.js with crashcat physics.

## Structure

- `js/` — JavaScript port
  - `main.js` — Entry point, scene setup, game loop
  - `Physics.js` — crashcat wall colliders and sphere body (ported from Godot collision shapes)
  - `Track.js` — GridMap track layout and piece placement
  - `Vehicle.js` — Vehicle physics and controls
  - `Camera.js` — Camera system
  - `Controls.js` — Input handling
  - `Particles.js` — Smoke trail effects
  - `Audio.js` — Sound: positional sources on the vehicle, distance lowpass, outdoor reverb; engine and impacts are synthesized, skid is a sample with tone/pitch variation
  - `EngineWorklet.js` — Procedural engine synth (AudioWorklet)
  - `ImpactSound.js` — Procedural collision one-shots (rendered into AudioBuffers at init)
- `models/` — GLB models shared between both versions
- `audio/` — Sample assets (skid.ogg; engine and impacts are synthesized). The synth DSP cores are plain classes importable from Node for offline rendering/analysis.
- `sprites/` — Sprite assets

## Key conventions

- GridMap cell size: 9.99 units, scale: 0.75 (`CELL_RAW` and `GRID_SCALE` in `Track.js`)
- Track group has `position.y = -0.5` offset
- Godot vehicle models use `root_scale = 0.5`
- Wall colliders: friction 0.0, restitution 0.1
- Corner colliders: arc center at `(-CELL_HALF, +CELL_HALF)` in local space, outer wall radius `2*CELL_HALF - 0.25`
- Orientation mapping from Godot GridMap indices: `{ 0: 0°, 10: 180°, 16: 90°, 22: 270° }`

## Porting reference

Godot collision shapes are defined in `_godot/models/Library/mesh-library.tscn` as `ConcavePolygonShape3D` vertex data. The JS port approximates these with crashcat cuboid colliders.
