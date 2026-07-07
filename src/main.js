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
  enableFpsHud: true,
};

// ── Globals ───────────────────────────────────────────────────────
let engine  = null;

/**
 * Rolling buffer of recent boot/runtime log messages, captured from
 * the very first EventBus registration (before engine.load() runs).
 * Displayed automatically in the crash screen so every future error
 * report is self-contained — no console scrolling/filtering needed.
 */
const logHistory = [];
const LOG_HISTORY_MAX = 60;

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

  // ═══════════════════════════════════════════════════════════
  // CRITICAL: wire the log capture BEFORE engine.load() runs.
  // initGame() (called synchronously inside engine.load()) fires
  // every DOOM boot-sequence log message via js_print_string. If
  // we register the EventBus listener AFTER awaiting engine.load(),
  // and initGame() crashes, every single one of those messages was
  // emitted to zero listeners and is lost forever — exactly what
  // happened across multiple prior debugging rounds. Registering
  // early + keeping a rolling history buffer means ANY future crash
  // report automatically includes full boot context, with no
  // dependence on console scrollback, filters, or the user knowing
  // to look for it.
  // ═══════════════════════════════════════════════════════════
  EventBus.on('engine:log', ({ text, level }) => {
    console.log('[DOOM]', text);
    logHistory.push({ text, level: level ?? 'info', t: performance.now() });
    if (logHistory.length > LOG_HISTORY_MAX) logHistory.shift();
  });

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
    EventBus.on('game:paused',  () => ui.pause.show());
    EventBus.on('game:resumed', () => ui.pause.hide());

    console.log('[DOOM] 💀 Game started — Rip and tear!');

  } catch (err) {
    console.error('[DOOM] Startup error:', err);
    logHistory.push({ text: `${err.name}: ${err.message}`, level: 'error', t: performance.now() });
    ui.loading.hide();
    showFatalError(`${err.name}: ${err.message}${err.stack ? '\n\n' + err.stack : ''}`);
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

  // Settings button opens the settings panel (pausing the game
  // underneath, matching how the pause menu already behaves)
  document.getElementById('btn-settings')?.addEventListener('click', () => {
    document.getElementById('settings-overlay')?.classList.remove('hidden');
  });
  document.getElementById('btn-settings-close')?.addEventListener('click', () => {
    document.getElementById('settings-overlay')?.classList.add('hidden');
  });

  // Mobile pause button
  document.getElementById('btn-pause-mobile')?.addEventListener('click', () => {
    engine.paused ? EventBus.emit('engine:resume') : EventBus.emit('engine:pause');
  });

  wireSettingsPanel();
}

// ═════════════════════════════════════════════════════════════════
//  SETTINGS PANEL
//  CRT toggle, display scale, smoothing, mouse sensitivity — all
//  persisted to localStorage so preferences survive page reloads.
// ═════════════════════════════════════════════════════════════════

const SETTINGS_KEY = 'doom-settings';

function loadSettings() {
  const defaults = { crt: true, smoothing: false, scale: 'auto', sensitivity: 1.0 };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch {
    return defaults;
  }
}

function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // localStorage disabled (private browsing) — preferences just
    // won't persist across reloads; not worth surfacing an error for.
  }
}

function applySettings(settings) {
  const crt = document.getElementById('crt-overlay');
  crt?.classList.toggle('disabled', !settings.crt);

  const renderer = engine?.getRenderer?.();
  renderer?.setSmoothing(settings.smoothing);
  renderer?.setScaleMode(settings.scale === 'auto' ? 'auto' : Number(settings.scale));

  const input = engine?.getInputHandler?.();
  input?.setSensitivity(settings.sensitivity);
}

function wireSettingsPanel() {
  const settings = loadSettings();
  applySettings(settings);

  const crtCheckbox    = document.getElementById('setting-crt');
  const smoothCheckbox = document.getElementById('setting-smoothing');
  const scaleSelect    = document.getElementById('setting-scale');
  const sensSlider     = document.getElementById('setting-sensitivity');
  const sensValue      = document.getElementById('setting-sensitivity-value');

  // Reflect loaded settings in the UI controls
  if (crtCheckbox)    crtCheckbox.checked    = settings.crt;
  if (smoothCheckbox) smoothCheckbox.checked = settings.smoothing;
  if (scaleSelect)    scaleSelect.value      = String(settings.scale);
  if (sensSlider)     sensSlider.value       = String(settings.sensitivity);
  if (sensValue)      sensValue.textContent  = `${Number(settings.sensitivity).toFixed(1)}×`;

  crtCheckbox?.addEventListener('change', () => {
    settings.crt = crtCheckbox.checked;
    applySettings(settings);
    saveSettings(settings);
  });

  smoothCheckbox?.addEventListener('change', () => {
    settings.smoothing = smoothCheckbox.checked;
    applySettings(settings);
    saveSettings(settings);
  });

  scaleSelect?.addEventListener('change', () => {
    settings.scale = scaleSelect.value;
    applySettings(settings);
    saveSettings(settings);
  });

  sensSlider?.addEventListener('input', () => {
    settings.sensitivity = Number(sensSlider.value);
    if (sensValue) sensValue.textContent = `${settings.sensitivity.toFixed(1)}×`;
    applySettings(settings);
    saveSettings(settings);
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
    color: #ff2200; z-index: 9999; gap: 16px; padding: 30px;
    overflow-y: auto;
  `;

  overlay.innerHTML = `
    <div style="font-size: 28px; font-weight: bold; text-shadow: 0 0 20px currentColor; flex-shrink:0">
      ☠ DOOM CRASHED
    </div>
    <div style="font-size: 14px; color: #aaa; max-width: 700px; text-align: center; flex-shrink:0">
      ${escapeHtml(msg)}
    </div>

    <div style="font-size: 11px; color:#66ccff; letter-spacing:1px; flex-shrink:0">
      ── FULL BOOT LOG (${logHistory.length} lines — copy this whole box when reporting) ──
    </div>
    <textarea readonly
      style="width: min(800px, 92vw); height: 260px; background:#0a0a0a;
             border: 1px solid #333; color: #ccc; font-family: inherit;
             font-size: 11px; line-height: 1.6; padding: 12px;
             resize: vertical; white-space: pre;"
    >${logHistory.map(l => `[${l.level}] ${l.text}`).join('\n')}${logHistory.length === 0 ? '(no log messages were captured before this crash)' : ''}

FATAL: ${msg}</textarea>

    <div style="display:flex; gap:12px; flex-shrink:0">
      <button id="fatal-copy-btn"
        style="border: 1px solid #3366cc; background: none; color: #66ccff;
               padding: 12px 24px; font-family: inherit; font-size: 14px;
               cursor: pointer; letter-spacing: 2px;">
        📋 COPY LOG
      </button>
      <button onclick="location.reload()"
        style="border: 1px solid #cc2200; background: none; color: #ff4400;
               padding: 12px 24px; font-family: inherit; font-size: 14px;
               cursor: pointer; letter-spacing: 2px;">
        ↺ RELOAD
      </button>
    </div>
  `;
  document.body.appendChild(overlay);

  // Wire the copy button (can't inline an async clipboard call in onclick=""
  // reliably across browsers, so wire it properly after insertion)
  const copyBtn = overlay.querySelector('#fatal-copy-btn');
  const textarea = overlay.querySelector('textarea');
  copyBtn?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(textarea.value);
      copyBtn.textContent = '✅ COPIED!';
      setTimeout(() => { copyBtn.textContent = '📋 COPY LOG'; }, 1500);
    } catch {
      textarea.select();
      copyBtn.textContent = 'Select-all done, press Ctrl+C';
    }
  });
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

// ═════════════════════════════════════════════════════════════════
//  GLOBAL SAFETY NET
//  Catches anything that slips past startGame()'s own try/catch —
//  e.g. an error thrown from inside the rAF game loop after startup
//  succeeded, or a rejected promise nobody awaited directly. Routes
//  through the same self-contained crash screen (full log history
//  included) rather than a silent console-only failure or the
//  browser's default "Uncaught Error" overlay.
// ═════════════════════════════════════════════════════════════════
window.addEventListener('error', (event) => {
  // Ignore noise from third-party browser extensions injecting
  // content scripts (e.g. "chunk-XXXX.js", "Could not establish
  // connection") — these are not part of this page and are outside
  // our control or relevance.
  const src = event.filename || '';
  if (src && !src.includes(location.origin)) return;

  console.error('[DOOM] Uncaught error:', event.error ?? event.message);
  logHistory.push({
    text: `Uncaught: ${event.error?.message ?? event.message}`,
    level: 'error',
    t: performance.now(),
  });
  if (!document.getElementById('doom-canvas')?.dataset.crashed) {
    showFatalError(`Uncaught error: ${event.error?.message ?? event.message}`);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const text = reason?.message ?? String(reason);
  // Same extension-noise filter as above.
  if (typeof reason === 'object' && reason?.stack && !reason.stack.includes(location.origin)) {
    return;
  }
  console.error('[DOOM] Unhandled promise rejection:', reason);
  logHistory.push({ text: `Unhandled rejection: ${text}`, level: 'error', t: performance.now() });
});
