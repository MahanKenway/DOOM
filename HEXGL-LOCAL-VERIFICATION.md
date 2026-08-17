# HexGL Local Verification

Date: 2026-08-17

The staged RetroPlay wrapper at `http://127.0.0.1:8095/hexgl.html?fullscreenfix=2` reached `READY` and rendered the native WebGL Cityscape race. The fullscreen control recreated the HexGL iframe only when entering fullscreen, which allowed the canvas to consume the full browser viewport without a black or white unrendered area. Exiting fullscreen with Escape preserved the active race and timer in the normal RetroPlay layout; the iframe was not reloaded and did not fall back to the HexGL menu.

A real local gameplay screenshot was captured from this wrapper and placed at `assets/screenshots/hexgl-runtime.webp` for the catalog card.
