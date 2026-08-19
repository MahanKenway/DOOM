# Assets: Obsidian Relay

**Art direction:** A compact original 3D survival-exploration space seen from a high three-quarter fixed camera. Graphite station walls and wet slate flooring frame cyan guide lights, small amber emergency lights, restrained rust-orange accents and hard-edged silhouettes. The mood is tense but not photoreal; rooms are readable at mobile scale and route-critical props have clear emissive colour contrast.

## Art-direction reference

| Item | Role | Size | File | Runtime use |
|---|---|---:|---|---|
| Obsidian Relay visual target | Internal composition and palette target only | 2560×1440 px | `.cache/obsidian-relay-visual-target.png` | Not shipped and never used as catalog art |

The visual target was generated specifically for this project and depicts only original, planned objects: explorer, echo, energy cell, console, bulkhead, crates, pipes, beacon, HUD arrangement and corridor geometry.

## Runtime visual kit

| Name | Description | Intended size | Implementation |
|---|---|---:|---|
| Explorer | Rust-orange maintenance explorer with cyan shoulder lamp; deliberately non-franchise silhouette | 1.8m tall | Original procedural boxes, tapered head and emissive lamp cue |
| Echo | Dark segmented signal anomaly with a cyan core | 1.9m tall | Original procedural prism/box construction |
| Signal cell | Teal triangular prism, clear from a fixed camera | 0.45m tall | Original procedural prism with pulsing colour |
| Relay console | Embedded station control surface with amber/teal state response | 1.5m wide | Original procedural console blocks and panel indicator |
| Bulkhead | Circular exit door that visibly opens after relay restoration | 3.6m wide | Original procedural ring and two door plates |
| Station modules | Floor panels, wall slab, pipe, crate, beacon and dry/flooded bay shapes | 2m tile scale | Original procedural geometry with deterministic colours |
| HUD bars | Health, cell counter, objective and interaction prompt | Responsive browser overlay | CSS/HTML, not image text |

## Excluded materials

No asset, texture, level, model, audio file, filename, game-data block, icon, story or character from `ResidentEvil(USA).7z` is used. The two-file archive is a disc-image payload and cue sheet; it is excluded from the repository, build output, asset directory and runtime.

## Catalog artwork policy

The released catalog card will use a real screenshot taken from the running Obsidian Relay runtime. It will not use the generated visual target or any other AI-generated illustration.
