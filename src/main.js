/**
 * main.js  —  Application entry point
 * ─────────────────────────────────────────────────────────────────
 * Orchestrates:
 *   1. WAD selection (bundled Freedoom or user upload)
 *   2. Engine loading + WASM instantiation
 *   3. Game loop start
 *   4. UI wiring (HUD, pause, fullscreen, mobile controls)
 *
 * Architecture:
 *
 *   main.js
 *     ├── WadLoader      (fetches WAD bytes)
 *     ├── DoomEngine     (WASM wrapper + game loop)
 *     │     ├── Renderer       (canvas blit)
 *     │     ├── AudioManager   (Web Audio)
 *     │     └── InputHandler   (keyboard/mouse/gamepad)
 *     ├── EventBus       (pub/sub decoupling)
 *     └── UI             (LoadingScreen, HUD, PauseMenu, MobileControls)
 * ─────────────────────────────────────────────────────────────────
 */

import { DoomEngine }   from './engine/DoomEngine.js';
import { WadLoader }    from './WadLoader.js';
import { EventBus }     from './EventBus.js';
import {
  LoadingScreen,
  HUD,
  PauseMenu,
  MobileControls,
  sleep,
}                       from './ui.js';

// ── Config ────────────────────────────────────────────────────────
const CONFIG = {
  wasmPath:     'wasm/doom.wasm',
  // Freedoom Phase 1 shareware — fully open-source, no legal issues
  bundledWad:   'assets/freedoom1.wad',
  enableCRT:    true,
  enableFpsHud: true,
};

// ── Globals ───────────────────────────────────────────────────────
let engine  = null;
const ui = {
  loading: new LoadingScreen(),
  hud:     new HUD(),
  pause:   new PauseMenu(),
  mobile:  null,          // initialised after engine.load()
};

// ═════════════════════════════════════════════════════════════════
//  INIT
// ═════════════════════════════════════════════════════════════════

async function init() {
  // Show loading screen immediately
  ui.loading.show();
  ui.loading.update(0, 'Booting DOOM…');

  // Play the ASCII boot sequence for that classic feel
  await ui.loading.playBootSequence();

  // Hide loading screen, show WAD picker
  await sleep(400);
  ui.loading.hide();

  // If there's a bundled WAD, offer it; otherwise go straight to picker
  showWadPicker();
}

// ═════════════════════════════════════════════════════════════════
//  WAD PICKER UI
// ═════════════════════════════════════════════════════════════════

function showWadPicker() {
  const picker = document.getElementById('wad-picker');
  picker?.classList.add('active');

  // Option A: bundled Freedoom
  document.getElementById('btn-freedoom')?.addEventListener('click', async () => {
    picker?.classList.remove('active');
    await startGame(CONFIG.bundledWad, 'url');
  });

  // Option B: file input
  document.getElementById('wad-upload')?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    picker?.classList.remove('active');
    await startGame(file, 'file');
  });

  // Option C: drag-and-drop
  const dropZone = document.getElementById('wad-drop-zone');
  document.body.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone?.classList.add('drag-over');
  });
  document.body.addEventListener('dragleave', () => {
    dropZone?.classList.remove('drag-over');
  });
  document.body.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropZone?.classList.remove('drag-over');
    const file = e.dataTransfer?.files[0];
    if (!file) return;
    picker?.classList.remove('active');
    await startGame(file, 'file');
  });
}

// ═════════════════════════════════════════════════════════════════
//  START GAME
// ═════════════════════════════════════════════════════════════════

/**
 * @param {string|File} source   URL string or File object
 * @param {'url'|'file'} type
 */
async function startGame(source, type) {
  // Show loading screen again for WAD + WASM load
  ui.loading.show();
  ui.loading.update(5, 'Loading WAD…');

  try {
    // 1. Load WAD bytes
    const wad = type === 'url'
      ? await WadLoader.fromUrl(source, (pct) => {
          ui.loading.update(Math.round(pct * 0.3), `Fetching WAD… ${pct}%`);
        })
      : await WadLoader.fromFile(source, (pct) => {
          ui.loading.update(Math.round(pct * 0.3), `Reading WAD… ${pct}%`);
        });

    // Show WAD info
    try {
      const { type: wadType, numLumps } = WadLoader.parseHeader(wad);
      ui.loading.update(35, `WAD: ${wadType}, ${numLumps} lumps`, 'ok');
    } catch { /* non-critical */ }

    // 2. Create engine
    const canvas = document.getElementById('doom-canvas');
    engine = new DoomEngine({
      canvas,
      onFpsUpdate: (fps) => {
        if (CONFIG.enableFpsHud) ui.hud.setFps(fps);
      },
      onFatalError: (msg) => {
        showFatalError(msg);
      },
    });

    // 3. Load WASM + init game
    await engine.load({
      wasmPath: CONFIG.wasmPath,
      wad,
      onProgress: (pct, msg) => {
        ui.loading.update(35 + Math.round(pct * 0.65), msg);
      },
    });

    // 4. Switch to game screen
    ui.loading.hide();
    document.getElementById('game-screen')?.classList.add('active');

    // 5. Wire mobile controls
    ui.mobile = new MobileControls((key, isDown) => {
      engine.getInputHandler?.().injectKey(key, isDown);
    });

    // 6. Wire pause / resume
    wireGameControls();

    // 7. Wire EventBus → HUD
    EventBus.on('engine:log', ({ text }) => console.log('[DOOM]', text));
    EventBus.on('game:paused',  () => ui.pause.show());
    EventBus.on('game:resumed', () => ui.pause.hide());

    // 8. CRT effect toggle
    const crt = document.getElementById('crt-overlay');
    if (!CONFIG.enableCRT) crt?.classList.add('disabled');

    console.log('[DOOM] 💀 Game started — Rip and tear!');

  } catch (err) {
    console.error('[DOOM] Startup error:', err);
    ui.loading.log(`ERROR: ${err.message}`, 'error');
    ui.loading.update(0, `Fatal: ${err.message}`);
  }
}

// ═════════════════════════════════════════════════════════════════
//  GAME CONTROLS (pause, fullscreen, restart)
// ═════════════════════════════════════════════════════════════════

function wireGameControls() {
  // Keyboard shortcuts not handled by DOOM itself
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyP') {
      engine.paused ? EventBus.emit('engine:resume') : EventBus.emit('engine:pause');
    }
    if (e.code === 'KeyF' || e.code === 'F11') {
      e.preventDefault();
      toggleFullscreen();
    }
  });

  // Pause menu callbacks
  ui.pause.onResume     = () => EventBus.emit('engine:resume');
  ui.pause.onRestart    = () => { engine.destroy(); init(); };
  ui.pause.onFullscreen = () => toggleFullscreen();

  // Mobile pause button
  document.getElementById('btn-pause-mobile')?.addEventListener('click', () => {
    engine.paused ? EventBus.emit('engine:resume') : EventBus.emit('engine:pause');
  });
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(console.warn);
  } else {
    document.exitFullscreen().catch(console.warn);
  }
}

// ═════════════════════════════════════════════════════════════════
//  FATAL ERROR HANDLER
// ═════════════════════════════════════════════════════════════════

function showFatalError(msg) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; inset: 0; background: #000;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    font-family: 'Courier New', monospace;
    color: #ff2200; z-index: 9999; gap: 20px; padding: 40px;
  `;
  overlay.innerHTML = `
    <div style="font-size: 32px; font-weight: bold; text-shadow: 0 0 20px currentColor">
      ☠ DOOM CRASHED
    </div>
    <div style="font-size: 14px; color: #aaa; max-width: 500px; text-align: center">
      ${escapeHtml(msg)}
    </div>
    <button onclick="location.reload()"
      style="border: 1px solid #cc2200; background: none; color: #ff4400;
             padding: 12px 24px; font-family: inherit; font-size: 14px;
             cursor: pointer; letter-spacing: 2px;">
      ↺ RELOAD
    </button>
  `;
  document.body.appendChild(overlay);
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ═════════════════════════════════════════════════════════════════
//  BOOTSTRAP
// ═════════════════════════════════════════════════════════════════

// Wait for DOM to be fully parsed
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Expose to window for debugging
window.__doom = {
  get engine()    { return engine; },
  pause()         { EventBus.emit('engine:pause'); },
  resume()        { EventBus.emit('engine:resume'); },
  get fps()       { return engine?.fps ?? 0; },
};
