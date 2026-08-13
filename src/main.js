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
import { CatalogController } from './catalog.js';
import { loadSettings, saveSettings, profileIdFor, listSaveSlots, exportSaveBundle, importSaveBundle } from './persistence.js';
import {
  LoadingScreen,
  HUD,
  PauseMenu,
  MobileControls,
  sleep,
}                       from './ui.js';

// ── Config ────────────────────────────────────────────────────────
const CONFIG = {
  wasmPath: 'wasm/doom.wasm',
  enableFpsHud: true,
};

// ── Globals ───────────────────────────────────────────────────────
let engine  = null;
let catalog = null;
let lastLaunch = null;
let pendingImportGame = null;
let activeSaveProfile = null;

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
  ui.loading.update(0, 'Opening RIFTWAD…');

  // Play the ASCII boot sequence for that classic feel
  await ui.loading.playBootSequence();

  // Hide loading screen, show WAD picker
  await sleep(400);
  ui.loading.hide();

  // If there's a bundled WAD, offer it; otherwise go straight to picker
  showWadPicker();
}

// ═════════════════════════════════════════════════════════════════
//  ONE-TIME UI WIRING
//  Everything here runs EXACTLY ONCE for the entire page lifetime,
//  called from the bootstrap section at the bottom of this file —
//  never from init()/startGame(), which both run again on every
//  Restart. This is the fix for a bug where restarting the game
//  would silently stack duplicate event listeners on every button,
//  the window keydown handler, and several EventBus channels —
//  each additional Restart made every click/keypress fire that many
//  times over, eventually breaking pause/resume and the WAD picker
//  buttons entirely (clicking "Play" N times launched N concurrent
//  WASM instances racing each other).
// ═════════════════════════════════════════════════════════════════

function bootstrapUI() {
  // Log capture — MUST be wired before the first ever engine.load()
  // call, since initGame() fires boot-sequence messages synchronously
  // inside it. Wiring this once, here, satisfies that ordering
  // requirement permanently (no need to re-wire on every startGame).
  EventBus.on('engine:log', ({ text, level }) => {
    console.log('[RIFTWAD]', text);
    logHistory.push({ text, level: level ?? 'info', t: performance.now() });
    if (logHistory.length > LOG_HISTORY_MAX) logHistory.shift();
  });

  EventBus.on('game:paused',  () => ui.pause.show());
  EventBus.on('game:resumed', () => ui.pause.hide());

  wireWadPicker();
  wireGameControls();
  wireSettingsPanel();

  catalog = new CatalogController({
    onPlayGame: (game) => startBundledGame(game),
    onImportWad: (game) => {
      pendingImportGame = game ?? null;
      document.getElementById('wad-upload')?.click();
    },
  });
  EventBus.on('engine:save-updated', ({ profileId }) => {
    if (profileId === activeSaveProfile) renderSaveSlots(profileId);
  });
  catalog.init();

  // Single persistent MobileControls instance for the whole page
  // lifetime. Its target callback is rebound on every startGame()
  // via setInjectFn() rather than recreating the instance (which
  // would re-wire touch listeners on top of the existing ones).
  ui.mobile = new MobileControls(() => {}); // no-op until first engine loads
}

// ═════════════════════════════════════════════════════════════════
//  WAD PICKER UI
// ═════════════════════════════════════════════════════════════════

function wireWadPicker() {
  const picker = document.getElementById('wad-picker');

  // File input supports selecting an IWAD alone, or an IWAD + one
  // IWAD + one or more PWADs together via the 'multiple' attribute)
  document.getElementById('wad-upload')?.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    picker?.classList.remove('active');
    const game = pendingImportGame;
    pendingImportGame = null;
    await startGame(files, 'file', { catalogGame: game });
  });

  // Option C: drag-and-drop (also supports multiple files at once)
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
    const files = Array.from(e.dataTransfer?.files ?? []);
    if (files.length === 0) return;
    picker?.classList.remove('active');
    const game = pendingImportGame;
    pendingImportGame = null;
    await startGame(files, 'file', { catalogGame: game });
  });
}

function showWadPicker() {
  document.getElementById('wad-picker')?.classList.add('active');
}

async function startBundledGame(game) {
  if (!game?.source) {
    showWadPicker();
    return;
  }
  document.getElementById('wad-picker')?.classList.remove('active');
  await startGame([game.source], 'url', { catalogGame: game });
}

// ═════════════════════════════════════════════════════════════════
//  START GAME
// ═════════════════════════════════════════════════════════════════

/**
 * @param {(string|File)[]} sources  One or more WAD sources — a mix
 *        of URL strings and/or File objects. The actual IWAD is
 *        detected by content (its "IWAD" magic bytes), not by
 *        upload order, since browsers don't guarantee any particular
 *        order when multiple files are selected/dropped together.
 * @param {'url'|'file'} type
 */
async function startGame(sources, type, { catalogGame = null } = {}) {
  // Keep a stable restart target for either a bundled WAD or a locally
  // selected IWAD + PWAD set. File objects remain in this browser session.
  lastLaunch = { sources, type, catalogGame };

  // Show loading screen again for WAD + WASM load
  ui.loading.show();
  ui.loading.update(5, `Loading WAD${sources.length > 1 ? 's' : ''}…`);

  try {
    if (sources.length > 4) {
      throw new Error('A maximum of 4 WAD files is supported: one IWAD plus up to 3 PWAD files.');
    }

    // 1. Load every WAD's bytes
    const loaded = [];
    for (let i = 0; i < sources.length; i++) {
      const src = sources[i];
      const base = Math.round((i / sources.length) * 25);
      const wad = type === 'url'
        ? await WadLoader.fromUrl(src, (pct) => {
            const displayPct = pct == null ? 15 : pct;
            ui.loading.update(5 + base + Math.round(displayPct * 0.25 / sources.length),
              `Fetching WAD ${i + 1}/${sources.length}… ${pct == null ? 'streaming' : `${pct}%`}`);
          })
        : await WadLoader.fromFile(src, (pct) => {
            ui.loading.update(5 + base + Math.round(pct * 0.25 / sources.length),
              `Reading WAD ${i + 1}/${sources.length}… ${pct}%`);
          });

      let header = null;
      try { header = WadLoader.parseHeader(wad); } catch { /* validated already by WadLoader */ }
      loaded.push({ bytes: wad, header });
    }

    // 2. Identify the primary IWAD by content (magic bytes), not
    //    upload order — an "IWAD" is the base game data; any
    //    "PWAD"s are patches layered on top of it. If the user
    //    uploaded only PWADs with no IWAD, we can't run (DOOM has
    //    nothing to layer them onto) — surface a clear error rather
    //    than silently guessing.
    const iwadIndexes = loaded
      .map((w, index) => w.header?.type === 'IWAD' ? index : -1)
      .filter(index => index >= 0);
    const iwadIdx = iwadIndexes[0] ?? -1;
    if (iwadIndexes.length > 1) {
      throw new Error('Select exactly one IWAD. Additional files must be PWAD patches or maps.');
    }
    if (iwadIdx === -1) {
      throw new Error(
        loaded.length === 1
          ? 'This file is a PWAD (patch), not a complete IWAD. Load it together with a base IWAD (e.g. DOOM.WAD, DOOM2.WAD) — select both files at once.'
          : 'None of the selected files is a valid IWAD. At least one must be a complete base game WAD (e.g. DOOM.WAD, DOOM2.WAD) — PWADs alone can\'t run standalone.'
      );
    }
    // Reorder: IWAD first, then every PWAD in their original relative order
    const ordered = [
      loaded[iwadIdx],
      ...loaded.filter((_, i) => i !== iwadIdx),
    ];

    const wadList = ordered.map(w => w.bytes);
    const saveProfile = profileIdFor({
      catalogId: catalogGame?.id,
      wadHeaders: ordered.map((w) => w.header),
    });
    const totalLumps = ordered.reduce((sum, w) => sum + (w.header?.numLumps ?? 0), 0);
    ui.loading.update(30,
      `${ordered[0].header?.type ?? 'WAD'}${ordered.length > 1 ? ` + ${ordered.length - 1} PWAD${ordered.length > 2 ? 's' : ''}` : ''}, ${totalLumps} lumps`,
      'ok');

    // 3. Create engine
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

    // 4. Load WASM + init game
    await engine.load({
      wasmPath: CONFIG.wasmPath,
      wad: wadList,
      saveProfile,
      onProgress: (pct, msg) => {
        ui.loading.update(35 + Math.round(pct * 0.65), msg);
      },
    });

    // 5. Switch to game screen
    ui.loading.hide();
    document.getElementById('game-screen')?.classList.add('active');

    // 6. Rebind the persistent MobileControls instance to this
    //    engine's InputHandler (does NOT re-wire touch listeners —
    //    those were wired exactly once in bootstrapUI()).
    ui.mobile?.setInjectFn((key, isDown, source) => {
      engine.getInputHandler?.().injectKey(key, isDown, source ?? 'touch');
    });

    // 7. Apply persisted user settings (CRT/scale/smoothing/
    //    sensitivity) to this fresh engine/renderer/input instance.
    activeSaveProfile = saveProfile;
    applySettings(loadSettings());
    renderSaveSlots(activeSaveProfile);

    console.log('[RIFTWAD] Runtime started');

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
    if (e.code === 'KeyP' && engine) {
      engine.paused ? EventBus.emit('engine:resume') : EventBus.emit('engine:pause');
    }
    if (e.code === 'KeyF' || e.code === 'F11') {
      e.preventDefault();
      toggleFullscreen();
    }
  });

  // Pause menu callbacks
  ui.pause.onResume     = () => EventBus.emit('engine:resume');
  ui.pause.onRestart    = () => restartCurrentSession();
  ui.pause.onFullscreen = () => toggleFullscreen();

  document.getElementById('btn-return-hub')?.addEventListener('click', () => {
    engine?.destroy();
    engine = null;
    ui.pause.hide();
    document.getElementById('game-screen')?.classList.remove('active');
    showWadPicker();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

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
    if (!engine) return;
    engine.paused ? EventBus.emit('engine:resume') : EventBus.emit('engine:pause');
  });
}

function restartCurrentSession() {
  const launch = lastLaunch;
  engine?.destroy();
  engine = null;
  ui.pause.hide();
  document.getElementById('game-screen')?.classList.remove('active');
  if (launch) startGame(launch.sources, launch.type, { catalogGame: launch.catalogGame });
  else showWadPicker();
}

// ═════════════════════════════════════════════════════════════════
//  SETTINGS PANEL
//  CRT toggle, display scale, smoothing, mouse sensitivity — all
//  persisted to localStorage so preferences survive page reloads.
// ═════════════════════════════════════════════════════════════════

function applySettings(settings) {
  const performance = settings.performanceMode ?? 'auto';
  const useCrt = settings.crt && performance !== 'battery';
  const useSmoothing = performance === 'battery' ? false : settings.smoothing;

  document.documentElement.dataset.performance = performance;
  document.getElementById('crt-overlay')?.classList.toggle('disabled', !useCrt);

  const renderer = engine?.getRenderer?.();
  renderer?.setSmoothing(useSmoothing);
  renderer?.setScaleMode(settings.scale === 'auto' ? 'auto' : Number(settings.scale));

  const input = engine?.getInputHandler?.();
  input?.setSensitivity(settings.sensitivity);
  input?.setGamepadDeadzone(settings.gamepadDeadzone);

  const audio = engine?.getAudio?.();
  audio?.setMasterVolume(settings.masterVolume);
  audio?.setSfxVolume(settings.sfxVolume);
  audio?.setMusicVolume(settings.musicVolume);
}

function wireSettingsPanel() {
  const settings = loadSettings();
  applySettings(settings);

  const bindCheckbox = (id, key) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.checked = Boolean(settings[key]);
    el.addEventListener('change', () => {
      settings[key] = el.checked;
      applySettings(settings);
      saveSettings(settings);
    });
  };
  const bindSelect = (id, key) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = String(settings[key]);
    el.addEventListener('change', () => {
      settings[key] = el.value;
      applySettings(settings);
      saveSettings(settings);
    });
  };
  const bindRange = (id, key, valueId, format = (value) => `${Math.round(value * 100)}%`) => {
    const el = document.getElementById(id);
    const output = document.getElementById(valueId);
    if (!el) return;
    const reflect = () => { if (output) output.textContent = format(Number(settings[key])); };
    el.value = String(settings[key]);
    reflect();
    el.addEventListener('input', () => {
      settings[key] = Number(el.value);
      reflect();
      applySettings(settings);
      saveSettings(settings);
    });
  };

  bindCheckbox('setting-crt', 'crt');
  bindCheckbox('setting-smoothing', 'smoothing');
  bindSelect('setting-scale', 'scale');
  bindSelect('setting-performance', 'performanceMode');
  bindRange('setting-sensitivity', 'sensitivity', 'setting-sensitivity-value', (value) => `${value.toFixed(1)}×`);
  bindRange('setting-deadzone', 'gamepadDeadzone', 'setting-deadzone-value');
  bindRange('setting-master', 'masterVolume', 'setting-master-value');
  bindRange('setting-sfx', 'sfxVolume', 'setting-sfx-value');
  bindRange('setting-music', 'musicVolume', 'setting-music-value');

  const gyroCheckbox = document.getElementById('setting-gyro');
  const gyroRow = document.getElementById('settings-row-gyro');
  const hasOrientationSensor = typeof DeviceOrientationEvent !== 'undefined' &&
    (navigator.maxTouchPoints > 0 || 'ontouchstart' in window);
  if (gyroRow) gyroRow.style.display = hasOrientationSensor ? 'flex' : 'none';
  if (gyroCheckbox) gyroCheckbox.checked = false;
  gyroCheckbox?.addEventListener('change', async () => {
    const input = engine?.getInputHandler?.();
    if (!input) return;
    if (gyroCheckbox.checked) {
      const granted = await input.enableGyro();
      if (!granted) gyroCheckbox.checked = false;
    } else input.disableGyro();
  });

  document.getElementById('btn-export-saves')?.addEventListener('click', () => {
    if (!activeSaveProfile) return;
    const blob = new Blob([exportSaveBundle(activeSaveProfile)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${activeSaveProfile.replace(/[^a-z0-9]+/gi, '-')}-saves.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  });
  document.getElementById('save-import')?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file || !activeSaveProfile) return;
    try {
      const result = importSaveBundle(await file.text(), activeSaveProfile);
      renderSaveSlots(result.profileId);
    } catch (error) {
      alert(error.message ?? 'Save import failed.');
    } finally {
      event.target.value = '';
    }
  });
}

function renderSaveSlots(profileId) {
  const label = document.getElementById('save-profile-label');
  const list = document.getElementById('save-slot-list');
  if (label) label.textContent = `Profile: ${profileId ?? 'no active WAD'}`;
  if (!list) return;
  const slots = profileId ? listSaveSlots(profileId) : [];
  list.innerHTML = slots.length
    ? slots.map((slot) => `<div><span>${slot.name}</span><span>${Math.ceil(slot.size / 1024)} KB · ${new Date(slot.updatedAt).toLocaleDateString()}</span></div>`).join('')
    : '<p>No saved sessions for this WAD profile yet. Use the game menu (F2–F6) to create one.</p>';
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
function boot() {
  bootstrapUI();   // wires everything exactly once, ever
  init();           // shows boot animation + WAD picker (safe to call again on Restart)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
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
