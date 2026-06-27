# 💀 DOOM — Browser Edition

> Classic DOOM (linuxdoom-1.10) compiled to WebAssembly and running in your browser.

[![Build & Deploy](../../actions/workflows/build-and-deploy.yml/badge.svg)](../../actions/workflows/build-and-deploy.yml)
[![GitHub Pages](https://img.shields.io/badge/Play-GitHub%20Pages-red?style=flat&logo=github)](https://YOUR_USERNAME.github.io/doom-browser/)

---

## 🎮 Play

**[▶ Play Now →](https://YOUR_USERNAME.github.io/doom-browser/)**

Uses **Freedoom Phase 1** (open-source WAD). You can also load your own `DOOM1.WAD` or `DOOM2.WAD`.

### Controls

| Action         | Keyboard              | Gamepad         |
|----------------|-----------------------|-----------------|
| Move forward   | `↑` / `W`             | Left stick ↑    |
| Move backward  | `↓` / `S`             | Left stick ↓    |
| Turn left/right| `←` / `→` / `A` / `D`| Left stick ←→   |
| Fire           | `Ctrl` / Left click   | A / Cross       |
| Use / Open     | `Space`               | B / Circle      |
| Strafe         | `Alt` + `←` / `→`    | LB              |
| Run            | `Shift`               | X / Square      |
| Automap        | `Tab`                 | Y / Triangle    |
| Menu           | `Esc`                 | Start           |
| Fullscreen     | `F` / `F11`           |                 |
| Pause          | `P`                   |                 |
| Mouse look     | Move mouse (click to lock pointer) |    |

---

## 🏗 Architecture

```
doom-browser/
│
├── index.html                  Main page (loading, WAD picker, game)
├── styles/main.css             Doom-themed CSS (CRT effect, HUD, mobile)
├── manifest.json               PWA manifest
│
├── src/
│   ├── main.js                 Entry point — orchestrates everything
│   ├── EventBus.js             Pub/sub decoupling between modules
│   ├── WadLoader.js            WAD fetching / File API / drag-drop
│   │
│   ├── engine/
│   │   ├── DoomEngine.js       WASM loader, game loop (rAF + accumulator)
│   │   ├── Renderer.js         Canvas blit, pixel-perfect scaling
│   │   ├── AudioManager.js     Web Audio API SFX + music routing graph
│   │   └── InputHandler.js     Keyboard / Mouse / Pointer Lock / Gamepad
│   │
│   └── ui.js                   LoadingScreen, HUD, PauseMenu, MobileControls
│
├── linuxdoom-1.10/             Original id Software C source (unmodified)
│   └── web/                    Our Emscripten platform layer (NEW)
│       ├── i_video_web.c       Framebuffer → Canvas via js_draw_screen()
│       ├── i_sound_web.c       PCM/MUS → Web Audio via JS imports
│       ├── i_system_web.c      time / error / memory (no POSIX)
│       ├── i_net_stub.c        Single-player network stub
│       └── i_main_web.c        WASM exports: initGame / tickGame / key events
│
└── .github/workflows/
    └── build-and-deploy.yml    Emscripten compilation + GitHub Pages deploy
```

---

## 🔧 How It Works

### WASM Interface

The bridge between C (DOOM) and JavaScript uses 10 imports and 4 exports:

**JS → WASM (exports we call):**
```
initGame()                  D_DoomMain() — one-time init
tickGame()                  One 35 Hz game tick
reportKeyDown(doomKey)      Inject key-press event
reportKeyUp(doomKey)        Inject key-release event
```

**WASM → JS (imports we provide):**
```
js_draw_screen(ptr)         Copy RGBA framebuffer to canvas
js_get_time_ms()            performance.now()
js_get_wad_data(ptr)        Copy WAD bytes into WASM memory
js_get_wad_data_length()    WAD size in bytes
js_fatal_error(ptr)         Handle I_Error()
js_print_string(ptr)        Console logging
js_play_music(ptr, loop)    Start a music lump
js_stop_music()             Stop music
js_add_sfx_to_mixer(...)    Play a sound effect
js_remove_sfx_from_mixer(n) Stop a sound effect channel
```

### Game Loop (Fixed Timestep)

```
requestAnimationFrame(loop)
  │
  ├── accumulator += deltaTime
  │
  └── while (accumulator >= 28.571ms):   ← 1000/35 Hz
        wasm.tickGame()                  ← one deterministic tick
        accumulator -= 28.571ms
```

This follows the [Fix Your Timestep](https://gafferongames.com/post/fix_your_timestep/) pattern — the simulation advances at exactly 35 Hz regardless of display refresh rate (60/120/144 Hz).

### Video Pipeline

```
DOOM renderer writes 8-bit palette indices to screens[0] (320×200)
           ↓
I_FinishUpdate() applies current palette → RGBA buffer (256 KB)
           ↓
js_draw_screen(ptr) called from WASM
           ↓
JS creates ImageData from WASM memory slice
           ↓
putImageData() → offscreen 320×200 canvas
           ↓
drawImage() scaled to window (nearest-neighbour, pixel-perfect)
```

### Audio Pipeline

```
WASM calls js_add_sfx_to_mixer(pcmPtr, len, ch, vol, sep, pitch)
           ↓
JS decodes 8-bit unsigned PCM → Float32 AudioBuffer
           ↓
AudioBufferSourceNode → GainNode (volume) → StereoPannerNode (sep)
           ↓
sfxGain (bus) → masterGain → AudioContext.destination
```

---

## 🛠 Local Development

### Prerequisites
- [Emscripten SDK](https://emscripten.org/docs/getting_started/downloads.html) ≥ 3.1
- Node.js (optional, for a local HTTP server)

### Build

```bash
# Source Emscripten
source ./emsdk/emsdk_env.sh

# Compile
cd linuxdoom-1.10
PORTABLE=$(ls *.c | grep -vE '^(i_video|i_sound|i_system|i_main|i_net)\.c$')
emcc $PORTABLE web/*.c \
  -o ../dist/wasm/doom.wasm \
  -O2 -DNORMALUNIX -DLINUX -DWEBASSEMBLY \
  -s WASM=1 -s STANDALONE_WASM=1 \
  -s INITIAL_MEMORY=33554432 -s ALLOW_MEMORY_GROWTH=1 \
  --no-entry \
  -s EXPORTED_FUNCTIONS='["_initGame","_tickGame","_reportKeyDown","_reportKeyUp"]'
```

### Serve locally

```bash
# Python
python3 -m http.server 8080

# Node
npx serve .
```

Then open `http://localhost:8080`.

> ⚠️ Must be served over HTTP (not `file://`) for SharedArrayBuffer and WASM fetch to work.

---

## 📚 Key Techniques Used

| Technique | Where | Why |
|-----------|-------|-----|
| **Fixed-step accumulator** | `DoomEngine.js` | Match DOOM's 35 Hz without drift |
| **OffscreenCanvas** | `Renderer.js` | Zero-copy framebuffer blit |
| **Pointer Lock API** | `InputHandler.js` | Mouse-look without cursor escape |
| **Gamepad API polling** | `InputHandler.js` | Controller support |
| **Web Audio graph** | `AudioManager.js` | Per-channel volume + stereo pan |
| **ResizeObserver** | `Renderer.js` | Responsive pixel-perfect scaling |
| **EventBus (pub/sub)** | `EventBus.js` | Decoupled module communication |
| **Standalone WASM** | `i_main_web.c` | No Emscripten JS glue needed |
| **Palette expansion** | `i_video_web.c` | 8-bit → 32-bit RGBA with gamma |
| **PWA manifest** | `manifest.json` | Installable, fullscreen on mobile |

---

## ⚖️ License

- **DOOM source code**: [DOOM Source Code License](https://github.com/id-Software/DOOM/blob/master/doomlic.txt) © id Software
- **Freedoom WAD**: [BSD-3-Clause](https://github.com/freedoom/freedoom/blob/master/COPYING.adoc)
- **Browser frontend** (this project): MIT

---

## 🙏 Credits

- [id Software](https://www.idsoftware.com/) — original DOOM
- [Freedoom project](https://freedoom.github.io/) — open-source WAD
- [jacobenget/doom.wasm](https://github.com/jacobenget/doom.wasm) — WASM interface design inspiration
