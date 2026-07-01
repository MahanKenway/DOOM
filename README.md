<div align="center">

```
██████╗  ██████╗  ██████╗ ███╗   ███╗
██╔══██╗██╔═══██╗██╔═══██╗████╗ ████║
██║  ██║██║   ██║██║   ██║██╔████╔██║
██║  ██║██║   ██║██║   ██║██║╚██╔╝██║
██████╔╝╚██████╔╝╚██████╔╝██║ ╚═╝ ██║
╚═════╝  ╚═════╝  ╚═════╝ ╚═╝     ╚═╝
      B R O W S E R   E D I T I O N
```

### The 1993 classic, rebuilt for 2026 — running natively in your browser via WebAssembly.

[![Play Now](https://img.shields.io/badge/▶_PLAY_NOW-cc2200?style=for-the-badge&logo=googlechrome&logoColor=white)](https://mahankenway.github.io/DOOM/)
[![Build Status](https://img.shields.io/github/actions/workflow/status/MahanKenway/DOOM/build-and-deploy.yml?style=for-the-badge&label=BUILD&logo=githubactions&logoColor=white&color=success)](../../actions/workflows/build-and-deploy.yml)
[![License](https://img.shields.io/badge/LICENSE-DOOM_SOURCE-blueviolet?style=for-the-badge&logo=gnu&logoColor=white)](#-license)

[![WebAssembly](https://img.shields.io/badge/WebAssembly-654FF0?style=flat-square&logo=webassembly&logoColor=white)](https://webassembly.org/)
[![Emscripten](https://img.shields.io/badge/Emscripten-3.1.51-black?style=flat-square)](https://emscripten.org/)
[![C89](https://img.shields.io/badge/C-89-A8B9CC?style=flat-square&logo=c&logoColor=white)](https://en.wikipedia.org/wiki/ANSI_C)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![GitHub Pages](https://img.shields.io/badge/Hosted_on-GitHub_Pages-222?style=flat-square&logo=github&logoColor=white)](https://pages.github.com/)
[![Freedoom](https://img.shields.io/badge/WAD-Freedoom_Phase_1-orange?style=flat-square)](https://freedoom.github.io/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](../../pulls)
[![Made with 💀](https://img.shields.io/badge/Made_with-💀-red?style=flat-square)]()

<sub>No plugins. No Flash. No native app. Just a browser tab and 26.2 MB of pure id Software nostalgia.</sub>

</div>

---

## 🎮 [▶ Play it right now →](https://mahankenway.github.io/DOOM/)

Runs entirely client-side. The original **linuxdoom-1.10** C source, compiled straight to **WebAssembly**, rendering into an HTML5 `<canvas>` at a rock-solid 35 Hz — exactly as id Software shipped it in 1997.

<div align="center">
<sub>🖱 Click to lock the mouse · ⌨️ WASD or arrows to move · 🔫 Ctrl to fire · Esc for menu</sub>
</div>

---

## ⌨️ Controls

|                | Keyboard                 | Gamepad          | Touch          |
|----------------|---------------------------|-------------------|----------------|
| Move           | `↑ ↓ ← →` / `WASD`        | Left stick        | D-Pad          |
| Turn           | Mouse (pointer-locked)     | Right stick*       | Swipe          |
| Fire           | `Ctrl` / Left click        | `A` / Cross        | 🔫 button      |
| Use / Open     | `Space`                    | `B` / Circle       | ⚙ button       |
| Strafe         | `Alt` + `← →`              | `LB`               | ↰ ↱ buttons    |
| Run            | `Shift`                    | `X` / Square       | 💨 button      |
| Automap        | `Tab`                      | `Y` / Triangle     | 🗺 button      |
| Pause          | `P`                        | `Start`            | ⏸ button       |
| Fullscreen     | `F` / `F11`                | —                  | —              |

---

## 🏗️ How it works

```
┌─────────────────────────────────────────────────────────────┐
│  linuxdoom-1.10/*.c   (original 1997 id Software source)     │
│  + web/*.c            (browser platform layer — new)         │
│           │                                                   │
│           ▼  emcc -O2 --no-entry -s STANDALONE_WASM=1        │
│  ┌───────────────────┐                                       │
│  │    doom.wasm       │◄──── WAD bytes injected via JS       │
│  └─────────┬───────────┘                                     │
│            │  WebAssembly.instantiateStreaming()             │
│            ▼                                                  │
│  ┌────────────────────────────────────────────────────┐     │
│  │  DoomEngine.js                                       │     │
│  │   ├─ Renderer.js      320×200 → pixel-perfect canvas │     │
│  │   ├─ AudioManager.js  Web Audio API mixer (8ch)       │     │
│  │   ├─ InputHandler.js  Keyboard/Mouse/Gamepad/Touch    │     │
│  │   └─ 35 Hz fixed-step loop (requestAnimationFrame)    │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

The trickiest part wasn't the renderer — it was convincing 1997 C code that expects a real POSIX filesystem (`open()`, `fopen()`, `access()`) that it's living inside a sandboxed WebAssembly module with **zero** filesystem syscalls. See [`web/w_io_web.c`](linuxdoom-1.10/web/w_io_web.c) for the virtual filesystem shim that makes it possible — the WAD is injected directly into linear memory from JavaScript, no disk required.

### Key engineering pieces

| Piece | What it solves |
|---|---|
| [`i_video_web.c`](linuxdoom-1.10/web/i_video_web.c) | 8-bit paletted framebuffer → RGBA → `<canvas>`, with gamma correction |
| [`i_sound_web.c`](linuxdoom-1.10/web/i_sound_web.c) | DMX 8-bit PCM lumps → Web Audio `AudioBufferSourceNode` graph |
| [`i_system_web.c`](linuxdoom-1.10/web/i_system_web.c) | `I_Error`/`I_GetTime` without POSIX — `performance.now()`-backed |
| [`w_io_web.c`](linuxdoom-1.10/web/w_io_web.c) | Virtual filesystem — the whole game lives in one memory buffer |
| [`i_main_web.c`](linuxdoom-1.10/web/i_main_web.c) | The 4 exports JS calls: `initGame` / `tickGame` / key events |
| [`patch_web.py`](linuxdoom-1.10/patch_web.py) | Surgical, auditable patches applied at CI time — original source stays untouched in the repo |

---

## 🧩 Tech stack

- **Core engine:** unmodified `linuxdoom-1.10` — [id Software](https://www.idsoftware.com/), 1997
- **Compiler:** [Emscripten](https://emscripten.org/) 3.1.51 (LLVM/clang → WebAssembly)
- **Runtime:** vanilla ES2022 modules, zero frontend frameworks
- **Audio:** Web Audio API (no `<audio>` tags, no polyfills)
- **IWAD:** [Freedoom Phase 1](https://freedoom.github.io/) — 100% free-content replacement for `DOOM1.WAD`
- **CI/CD:** GitHub Actions — every push auto-compiles and deploys to Pages
- **Hosting:** GitHub Pages (static, no backend, no server costs)

---

## 🛠️ Building it yourself

```bash
git clone https://github.com/MahanKenway/DOOM.git
cd DOOM

# Compile (requires the Emscripten SDK)
source /path/to/emsdk/emsdk_env.sh
cd linuxdoom-1.10
python3 patch_web.py          # apply the browser-compat patches
emcc *.c web/*.c \
  -o ../dist/wasm/doom.wasm \
  -O2 -w -I. -DNORMALUNIX \
  -s WASM=1 -s STANDALONE_WASM=1 \
  -s INITIAL_MEMORY=33554432 -s ALLOW_MEMORY_GROWTH=1 \
  -s EXPORTED_FUNCTIONS='["_initGame","_tickGame","_reportKeyDown","_reportKeyUp"]' \
  --no-entry

# Serve locally
cd .. && python3 -m http.server 8080
```

Or just push to `main` — [`.github/workflows/build-and-deploy.yml`](.github/workflows/build-and-deploy.yml) does all of this automatically and deploys straight to Pages.

---

## 🗺️ Roadmap

- [x] Core rendering pipeline (BSP, walls, sprites, flats)
- [x] Full audio (SFX via Web Audio; MUS→MIDI still a stub)
- [x] Keyboard + mouse (Pointer Lock) + gamepad + touch controls
- [x] Auto-deploy via GitHub Actions
- [x] Virtual in-memory filesystem (no real disk needed for the WAD)
- [ ] Save/load via `localStorage` or `IndexedDB` (currently no-op — see `w_io_web.c`)
- [ ] MUS format → real music playback
- [ ] PWAD upload support (currently single bundled IWAD only)
- [ ] Optional multiplayer via WebRTC data channels

Contributions welcome — see [Issues](../../issues) for open items.

---

## ⚖️ License

| Component | License |
|---|---|
| **DOOM source code** (`linuxdoom-1.10/*.c`, `*.h`) | [DOOM Source Code License](https://github.com/id-Software/DOOM/blob/master/doomlic.txt) © id Software, 1997 |
| **Freedoom IWAD** (bundled at build time) | [BSD-3-Clause](https://github.com/freedoom/freedoom/blob/master/COPYING.adoc) |
| **Browser platform layer** (`web/*.c`, `src/*.js`, this build system) | MIT — see [LICENSE](LICENSE) |

This project does not distribute or require any commercial DOOM IWAD. It ships exclusively with **Freedoom**, an independently developed, completely free set of levels and assets designed as a drop-in DOOM-engine content pack. You may optionally drag-and-drop your own legally owned `DOOM.WAD` / `DOOM2.WAD` for the full original experience — nothing proprietary ever leaves your machine, since everything runs client-side.

---

## 🙏 Acknowledgements

- **[id Software](https://www.idsoftware.com/)** — for open-sourcing DOOM in 1997 and changing game development forever
- **[Freedoom Project](https://freedoom.github.io/)** — for the incredible free IWAD that makes legal, zero-friction distribution possible
- **[Emscripten](https://emscripten.org/) / [WebAssembly](https://webassembly.org/)** — for making "1993 C code, in a browser tab, at native speed" a genuinely boring, solved problem
- Every [DOOM source port](https://doomwiki.org/wiki/Source_port) that came before this one, proving the engine's architecture is timeless

<div align="center">
<sub>Built with 🩸 by <a href="https://github.com/MahanKenway">MahanKenway</a> · Rip and tear, until it is done.</sub>
</div>
