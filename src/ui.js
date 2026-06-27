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

  constructor() {
    this.#el   = document.getElementById('loading-screen');
    this.#log  = document.getElementById('boot-log');
    this.#fill = document.getElementById('progress-fill');
    this.#pct  = document.getElementById('progress-text');
    this.#hint = this.#el?.querySelector('.loading-hint');
  }

  show() { this.#el?.classList.add('active'); }
  hide() { this.#el?.classList.remove('active'); }

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
      { text: 'DOOM v1.10 — Browser Edition',          level: 'ok'   },
      { text: 'Initialising memory zone...',            level: 'info' },
      { text: 'Z_Init: Init zone memory allocation daemon.', level: 'ok' },
      { text: 'W_Init: Init WADfiles.',                 level: 'ok'   },
      { text: 'Added /wads/freedoom1.wad',              level: 'ok'   },
      { text: 'I_Init: Setting up machine state.',      level: 'ok'   },
      { text: 'R_Init: Init DOOM refresh daemon -',     level: 'ok'   },
      { text: '..................................done',  level: 'ok'   },
      { text: 'P_Init: Init Playloop state.',           level: 'ok'   },
      { text: 'I_Init: Init interfaces.',               level: 'ok'   },
      { text: 'D_CheckNetGame: Checking network game...', level: 'ok' },
      { text: 'S_Init: Setting up sound.',              level: 'ok'   },
      { text: 'ST_Init: Init status bar.',              level: 'ok'   },
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
    const col = fps >= 30 ? '#00bb55' : fps >= 15 ? '#ff8800' : '#ff2200';
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
 * Wires the on-screen D-pad and action buttons to InputHandler.injectKey().
 */
export class MobileControls {
  #container;
  #injectFn;

  // Map data-key attribute → DOOM key code(s)
  // Imported from InputHandler to avoid circular deps
  #keyMap = {
    up:    0xad,   // UP_ARROW
    down:  0xaf,   // DOWN_ARROW
    left:  0xac,   // LEFT_ARROW
    right: 0xae,   // RIGHT_ARROW
    shoot: 0x80 + 0x1d,   // RCTRL = fire
    use:   32,             // SPACE = use
    sl:    0x80 + 0x38,   // RALT = strafe mode
    sr:    0x80 + 0x38,
    run:   0x80 + 0x36,   // RSHIFT = run
  };

  /**
   * @param {(doomKey: number, isDown: boolean) => void} injectFn
   */
  constructor(injectFn) {
    this.#container = document.getElementById('mobile-controls');
    this.#injectFn  = injectFn;

    if (this.#isTouchDevice()) {
      this.#container?.style.setProperty('display', 'block');
      this.#wireButtons();
    }
  }

  #wireButtons() {
    const buttons = this.#container?.querySelectorAll('[data-key]') ?? [];

    for (const btn of buttons) {
      const keyName = btn.dataset.key;
      const doomKey = this.#keyMap[keyName];
      if (doomKey == null) continue;

      // Touch events (more responsive than click on mobile)
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        btn.classList.add('pressed');
        this.#injectFn(doomKey, true);
      }, { passive: false });

      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        btn.classList.remove('pressed');
        this.#injectFn(doomKey, false);
      }, { passive: false });

      btn.addEventListener('touchcancel', () => {
        btn.classList.remove('pressed');
        this.#injectFn(doomKey, false);
      });
    }
  }

  #isTouchDevice() {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches
    );
  }
}

// ─────────────────────────────────────────────────────────────────
/** Simple async sleep helper */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
