# RetroPlay Packaging Note for Backdooms

RetroPlay vendors the upstream `THE-BACKDOOMS.html` gameplay source from commit `ed2dd50c8ad09d1ae521f2b7b8931cd339fbc513` under the upstream MIT License.

The upstream repository also contains Google Analytics markup and credits its web-hosted soundtrack as an 8-bit version of an Undertale track. RetroPlay does **not** redistribute the analytics code, `Game-Music.mp3`, `Game-Music.WAV`, the upstream favicon, or any other media asset. The package script copies the game document, removes that markup and audio code, and fails if a remote URL, BGM reference or audio tag remains.

The resulting runtime retains only the procedural Canvas raycaster and procedural enemy/HUD drawing logic from the upstream source. Its local distribution notice is written when the package is built.
