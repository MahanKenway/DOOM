/**
 * ui/LoadingScreen.js
 * ─────────────────────────────────────────────────────────────────
 * Retro-terminal boot sequence UI.
 *
 * Mimics the DOOM startup text, adding each line in sequence with
 * a typewriter effect and a green cursor blink — purely aesthetic.
 * ─────────────────────────────────────────────────────────────────
 */

export class LoadingScreen {
  #el;     // outer .screen element
  #log;    // .boot-log div
  #fill;   // .progress-fill div
  #pct;    // .progress-text span
  #hint;   // .loading-hint p
  #driftWall = null;

  constructor() {
    this.#el   = document.getElementById('loading-screen');
    this.#log  = document.getElementById('boot-log');
    this.#fill = document.getElementById('progress-fill');
    this.#pct  = document.getElementById('progress-text');
    this.#hint = this.#el?.querySelector('.loading-hint');
  }

  show() {
    this.#mountDriftWall();
    this.#el?.classList.add('active');
  }
  hide() { this.#el?.classList.remove('active'); }

  #mountDriftWall() {
    const quality = document.documentElement.dataset.visualQuality;
    if (!this.#el || this.#driftWall || quality === 'static') return;
    const tiles = [
      'assets/screenshots/hexgl-runtime.webp',
      'assets/screenshots/astray-runtime.webp',
      'assets/screenshots/tuxracer-runtime.webp',
      'assets/screenshots/starter-kit-racing-runtime.webp',
    ].map((path) => new URL(path, document.baseURI).href);
    const wall = document.createElement('div');
    wall.className = 'loading-drift-wall';
    wall.setAttribute('aria-hidden', 'true');
    wall.innerHTML = tiles.map((image, index) => {
      const next = tiles[(index + 1) % tiles.length];
      return `<div class="loading-drift-column loading-drift-column-${index + 1}" style="--drift-image:url('${image}');--drift-next:url('${next}')"><i></i><i></i><i></i></div>`;
    }).join('');
    this.#el.prepend(wall);
    this.#driftWall = wall;
  }

  /**
   * Append a line to the boot log.
   * @param {string} text
   * @param {'ok'|'warn'|'error'|'info'} level
   */
  log(text, level = 'ok') {
    if (!this.#log) return;
    const line = document.createElement('div');
    line.className = `log-${level}`;
    line.textContent = `> ${text}`;
    this.#log.appendChild(line);
    // Auto-scroll to bottom
    this.#log.scrollTop = this.#log.scrollHeight;
  }

  /**
   * Update the progress bar.
   * @param {number} pct  0–100
   */
  setProgress(pct) {
    const p = Math.max(0, Math.min(100, pct));
    if (this.#fill) this.#fill.style.width = `${p}%`;
    if (this.#pct)  this.#pct.textContent  = `${p}%`;
    if (this.#fill) {
      this.#fill.parentElement.setAttribute('aria-valuenow', String(p));
    }
  }

  /**
   * Update + log in one call (called by engine during load).
   * @param {number} pct
   * @param {string} message
   */
  update(pct, message) {
    this.setProgress(pct);
    this.log(message);
    if (this.#hint) {
      this.#hint.textContent = message;
    }
  }

  /**
   * Play the classic DOOM startup sequence for dramatic effect.
   */
  async playBootSequence() {
    const lines = [
      { text: 'RetroPlay // browser catalog',              level: 'ok'   },
      { text: 'Checking local runtime...',                level: 'info' },
      { text: 'Archive bridge: available.',               level: 'ok'   },
      { text: 'WAD parser: ready.',                       level: 'ok'   },
      { text: 'Input surfaces: keyboard / mouse / touch.',level: 'ok'   },
      { text: 'Audio route: on-demand.',                 level: 'ok'   },
      { text: 'Library index: local storage.',            level: 'ok'   },
      { text: 'Renderer target: WebAssembly.',            level: 'ok'   },
      { text: 'Catalog state: open.',                     level: 'ok'   },
    ];

    for (const { text, level } of lines) {
      this.log(text, level);
      await sleep(60 + Math.random() * 80);
    }
  }
}

// ─────────────────────────────────────────────────────────────────
/**
 * ui/HUD.js
 * Minimal HUD overlay drawn on top of the DOOM canvas.
 */
export class HUD {
  #fpsBadge;
  #mapBadge;

  constructor() {
    this.#fpsBadge = document.getElementById('hud-fps');
    this.#mapBadge = document.getElementById('hud-map');
  }

  setFps(fps) {
    if (this.#fpsBadge) this.#fpsBadge.textContent = `${fps} FPS`;
    // Color-code: green ≥ 30, amber 15-30, red < 15
    const col = fps >= 30 ? '#d7eb41' : fps >= 15 ? '#c6bc6e' : '#b8786b';
    if (this.#fpsBadge) this.#fpsBadge.style.color = col;
  }

  setMap(name) {
    if (this.#mapBadge) this.#mapBadge.textContent = name;
  }
}

// ─────────────────────────────────────────────────────────────────
/**
 * ui/PauseMenu.js
 * Shows / hides the pause overlay, wires buttons.
 */
export class PauseMenu {
  #overlay;
  #visible = false;
  onResume    = null;
  onRestart   = null;
  onFullscreen= null;

  constructor() {
    this.#overlay = document.getElementById('pause-overlay');

    document.getElementById('btn-resume')?.addEventListener('click', () => {
      this.hide();
      this.onResume?.();
    });

    document.getElementById('btn-restart')?.addEventListener('click', () => {
      this.onRestart?.();
    });

    document.getElementById('btn-fullscreen')?.addEventListener('click', () => {
      this.onFullscreen?.();
      this.hide();
    });
  }

  show() {
    this.#visible = true;
    this.#overlay?.classList.remove('hidden');
    // Defensive: ensure the higher-z-index "click to capture mouse"
    // overlay never sits on top of (and blocks) the Resume button,
    // regardless of pointer-lock event ordering.
    document.getElementById('click-to-play')?.classList.add('hidden');
  }

  hide() {
    this.#visible = false;
    this.#overlay?.classList.add('hidden');
  }

  toggle() { this.#visible ? this.hide() : this.show(); }
}

// ─────────────────────────────────────────────────────────────────
/**
 * ui/MobileControls.js
 * PSP-inspired controls built with Pointer Events. Each pointer receives its
 * own source token, so two fingers (for example move + fire) never release
 * each other's keys. Cancel, focus-loss and hidden-tab paths release every
 * synthetic key defensively.
 */
export class MobileControls {
  #container;
  #injectFn;
  #wired = false;
  #activeButtons = new Map(); // pointerId → { doomKey, source, button }
  #lookPointers = new Map();  // pointerId → { lastX }
  #pulseTimers = new Map();   // source → { timer, doomKey }
  #pulseSerial = 0;
  #boundReleaseAll;

  #keyMap = {
    up:      0xad,          // UP_ARROW
    down:    0xaf,          // DOWN_ARROW
    left:    0xac,          // LEFT_ARROW
    right:   0xae,          // RIGHT_ARROW
    fire:    0x80 + 0x1d,   // RCTRL
    use:     32,            // SPACE
    strafe:  0x80 + 0x38,   // RALT
    run:     0x80 + 0x36,   // RSHIFT
    map:     9,             // TAB
    menu:    27,            // ESCAPE
  };

  /**
   * @param {(doomKey: number, isDown: boolean, source?: string) => void} injectFn
   */
  constructor(injectFn) {
    this.#container = document.getElementById('mobile-controls');
    this.#injectFn = injectFn;
    this.#boundReleaseAll = () => this.#releaseAll();

    if (this.#isTouchDevice()) {
      this.#container?.style.setProperty('display', 'block');
      this.#wireControls();
    }
  }

  /** Rebind only the engine target; DOM listeners remain single-instance. */
  setInjectFn(injectFn) {
    this.#releaseAll();
    this.#injectFn = injectFn;
  }

  #wireControls() {
    if (this.#wired) return;
    this.#wired = true;
    this.#container?.addEventListener('contextmenu', (event) => event.preventDefault());

    const buttons = this.#container?.querySelectorAll('[data-key]') ?? [];
    for (const button of buttons) this.#wireButton(button);
    this.#wireLookZone(this.#container?.querySelector('[data-look-zone]'));

    window.addEventListener('blur', this.#boundReleaseAll);
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.#releaseAll(); });
  }

  #wireButton(button) {
    const doomKey = this.#keyMap[button.dataset.key];
    if (doomKey == null) return;

    const finish = (event) => {
      const active = this.#activeButtons.get(event.pointerId);
      if (!active) return;
      this.#activeButtons.delete(event.pointerId);
      active.button.classList.remove('pressed');
      this.#injectFn(active.doomKey, false, active.source);
    };

    button.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      event.preventDefault();
      if (this.#activeButtons.has(event.pointerId)) return;
      const source = `touch-button:${button.dataset.key}:${event.pointerId}`;
      this.#activeButtons.set(event.pointerId, { doomKey, source, button });
      button.classList.add('pressed');
      try { button.setPointerCapture(event.pointerId); } catch { /* capture is a best-effort enhancement */ }
      this.#injectFn(doomKey, true, source);
    });
    button.addEventListener('pointerup', finish);
    button.addEventListener('pointercancel', finish);
    button.addEventListener('lostpointercapture', finish);
  }

  #wireLookZone(zone) {
    if (!zone) return;
    const finish = (event) => {
      this.#lookPointers.delete(event.pointerId);
      zone.classList.toggle('is-looking', this.#lookPointers.size > 0);
    };

    zone.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      event.preventDefault();
      this.#lookPointers.set(event.pointerId, { lastX: event.clientX });
      zone.classList.add('is-looking');
      try { zone.setPointerCapture(event.pointerId); } catch { /* capture is a best-effort enhancement */ }
    });
    zone.addEventListener('pointermove', (event) => {
      const pointer = this.#lookPointers.get(event.pointerId);
      if (!pointer) return;
      event.preventDefault();
      const deltaX = event.clientX - pointer.lastX;
      pointer.lastX = event.clientX;
      if (Math.abs(deltaX) >= 3) this.#pulseTurn(deltaX > 0 ? 'right' : 'left', Math.abs(deltaX), event.pointerId);
    });
    zone.addEventListener('pointerup', finish);
    zone.addEventListener('pointercancel', finish);
    zone.addEventListener('lostpointercapture', finish);
  }

  #pulseTurn(direction, magnitude, pointerId) {
    const doomKey = direction === 'right' ? this.#keyMap.right : this.#keyMap.left;
    const source = `touch-look:${pointerId}:${++this.#pulseSerial}`;
    this.#injectFn(doomKey, true, source);
    const delay = Math.min(Math.max(magnitude * 6, 24), 84);
    const timer = setTimeout(() => {
      this.#injectFn(doomKey, false, source);
      this.#pulseTimers.delete(source);
    }, delay);
    this.#pulseTimers.set(source, { timer, doomKey });
  }

  #releaseAll() {
    for (const { doomKey, source, button } of this.#activeButtons.values()) {
      button.classList.remove('pressed');
      this.#injectFn(doomKey, false, source);
    }
    this.#activeButtons.clear();
    for (const [source, { timer, doomKey }] of this.#pulseTimers) {
      clearTimeout(timer);
      this.#injectFn(doomKey, false, source);
    }
    this.#pulseTimers.clear();
    this.#lookPointers.clear();
    this.#container?.querySelector('[data-look-zone]')?.classList.remove('is-looking');
  }

  #isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
  }
}

// ─────────────────────────────────────────────────────────────────
/** Simple async sleep helper */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
