/**
 * InputHandler.js
 * ─────────────────────────────────────────────────────────────────
 * Translates browser input events → DOOM internal key codes.
 *
 * Sources of input handled:
 *   1. Keyboard  (keydown / keyup)
 *   2. Mouse     (mousemove for look, buttons for fire/use)
 *   3. Pointer Lock API  (for FPS mouse-look without cursor escape)
 *   4. Gamepad API  (polling via requestAnimationFrame)
 *   5. Touch / on-screen controls  (forwarded from UI buttons)
 *
 * DOOM key code reference (from doomdef.h):
 *   Arrow keys  0xac–0xaf
 *   Ctrl        0x80+0x1d  (right ctrl)
 *   Alt         0x80+0x38
 *   Shift       0x80+0x36
 *   Enter       13,  Esc 27,  Space 32,  Tab 9
 * ─────────────────────────────────────────────────────────────────
 */

// ── DOOM key codes ────────────────────────────────────────────────
export const DoomKey = Object.freeze({
  RIGHT_ARROW:  0xae,
  LEFT_ARROW:   0xac,
  UP_ARROW:     0xad,
  DOWN_ARROW:   0xaf,
  ESCAPE:       27,
  ENTER:        13,
  TAB:          9,
  BACKSPACE:    127,
  PAUSE:        0xff,
  EQUALS:       0x3d,
  MINUS:        0x2d,
  RSHIFT:       0x80 + 0x36,
  RCTRL:        0x80 + 0x1d,
  RALT:         0x80 + 0x38,
  F1:           0x80 + 0x3b,
  F2:           0x80 + 0x3c,
  F3:           0x80 + 0x3d,
  F4:           0x80 + 0x3e,
  F5:           0x80 + 0x3f,
  F6:           0x80 + 0x40,
  F7:           0x80 + 0x41,
  F8:           0x80 + 0x42,
  F9:           0x80 + 0x43,
  F10:          0x80 + 0x44,
  F11:          0x80 + 0x57,
  F12:          0x80 + 0x58,
  // Weapon keys (1–7 → ASCII '1'–'7')
  WEAPON_1:     49, WEAPON_2: 50, WEAPON_3: 51, WEAPON_4: 52,
  WEAPON_5:     53, WEAPON_6: 54, WEAPON_7: 55,
  // Mouse buttons encoded as DOOM keys
  MOUSE_FIRE:   0x80 + 0x80,
  MOUSE_STRAFE: 0x80 + 0x81,
  MOUSE_FORWARD:0x80 + 0x82,
});

// ── Browser key → DOOM key mapping ────────────────────────────────
const KEY_MAP = new Map([
  // Arrow keys
  ['ArrowRight',  DoomKey.RIGHT_ARROW],
  ['ArrowLeft',   DoomKey.LEFT_ARROW],
  ['ArrowUp',     DoomKey.UP_ARROW],
  ['ArrowDown',   DoomKey.DOWN_ARROW],
  // WASD (map to arrow equivalents)
  ['KeyW',        DoomKey.UP_ARROW],
  ['KeyS',        DoomKey.DOWN_ARROW],
  ['KeyA',        DoomKey.LEFT_ARROW],
  ['KeyD',        DoomKey.RIGHT_ARROW],
  // Alt+left/right = strafe — handled separately via combo detection
  ['AltLeft',     DoomKey.RALT],
  ['AltRight',    DoomKey.RALT],
  ['ShiftLeft',   DoomKey.RSHIFT],
  ['ShiftRight',  DoomKey.RSHIFT],
  ['ControlLeft', DoomKey.RCTRL],
  ['ControlRight',DoomKey.RCTRL],
  ['Space',       32],
  ['Enter',       DoomKey.ENTER],
  ['Escape',      DoomKey.ESCAPE],
  ['Tab',         DoomKey.TAB],
  ['Backspace',   DoomKey.BACKSPACE],
  ['Pause',       DoomKey.PAUSE],
  ['Equal',       DoomKey.EQUALS],
  ['Minus',       DoomKey.MINUS],
  ['Digit1',      DoomKey.WEAPON_1],
  ['Digit2',      DoomKey.WEAPON_2],
  ['Digit3',      DoomKey.WEAPON_3],
  ['Digit4',      DoomKey.WEAPON_4],
  ['Digit5',      DoomKey.WEAPON_5],
  ['Digit6',      DoomKey.WEAPON_6],
  ['Digit7',      DoomKey.WEAPON_7],
  ['F1',  DoomKey.F1], ['F2',  DoomKey.F2], ['F3',  DoomKey.F3],
  ['F4',  DoomKey.F4], ['F5',  DoomKey.F5], ['F6',  DoomKey.F6],
  ['F7',  DoomKey.F7], ['F8',  DoomKey.F8], ['F9',  DoomKey.F9],
  ['F10', DoomKey.F10],['F11', DoomKey.F11],['F12', DoomKey.F12],
]);

// ── Gamepad button → DOOM key mapping ────────────────────────────
const GAMEPAD_BTN_MAP = [
  DoomKey.RCTRL,       // 0  A / Cross   → Fire
  32,                   // 1  B / Circle  → Use
  DoomKey.RSHIFT,      // 2  X / Square  → Run
  DoomKey.TAB,         // 3  Y / Triangle→ Automap
  DoomKey.RALT,        // 4  LB          → Strafe
  DoomKey.RALT,        // 5  RB          → Strafe
  null,                 // 6  LT
  null,                 // 7  RT
  null,                 // 8  Select/Back
  DoomKey.ESCAPE,      // 9  Start       → Menu
  null,                 // 10 L3
  null,                 // 11 R3
  DoomKey.UP_ARROW,    // 12 D-up
  DoomKey.DOWN_ARROW,  // 13 D-down
  DoomKey.LEFT_ARROW,  // 14 D-left
  DoomKey.RIGHT_ARROW, // 15 D-right
];

// ─────────────────────────────────────────────────────────────────
export class InputHandler {
  #canvas;

  /** Called by DoomEngine when a key should be reported pressed. */
  onKeyDown   = null;
  /** Called by DoomEngine when a key should be reported released. */
  onKeyUp     = null;
  /** Called for mouse button events. */
  onMouseBtn  = null;

  // Internal state
  #heldKeys       = new Set();
  #pointerLocked  = false;

  // Bound listeners (stored so we can removeEventListener cleanly)
  #boundKeyDown;
  #boundKeyUp;
  #boundMouseDown;
  #boundMouseUp;
  #boundMouseMove;
  #boundPointerLock;
  #boundPointerUnlock;

  // Gamepad polling
  #gamepadRAF   = null;
  #gamepadState = {};   // { [index]: boolean[] }

  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.#canvas = canvas;

    this.#boundKeyDown        = this.#onKeyDown.bind(this);
    this.#boundKeyUp          = this.#onKeyUp.bind(this);
    this.#boundMouseDown      = this.#onMouseDown.bind(this);
    this.#boundMouseUp        = this.#onMouseUp.bind(this);
    this.#boundMouseMove      = this.#onMouseMove.bind(this);
    this.#boundPointerLock    = this.#onPointerLock.bind(this);
    this.#boundPointerUnlock  = this.#onPointerUnlock.bind(this);
  }

  attach() {
    window.addEventListener('keydown', this.#boundKeyDown, { passive: false });
    window.addEventListener('keyup',   this.#boundKeyUp);
    this.#canvas.addEventListener('mousedown', this.#boundMouseDown);
    this.#canvas.addEventListener('mouseup',   this.#boundMouseUp);
    document.addEventListener('mousemove',     this.#boundMouseMove);
    document.addEventListener('pointerlockchange', this.#boundPointerLock);
    document.addEventListener('pointerlockerror',  this.#boundPointerUnlock);

    // Click canvas to request pointer lock
    this.#canvas.addEventListener('click', () => this.#requestPointerLock());

    // Gamepad
    window.addEventListener('gamepadconnected',    this.#onGamepadConnect.bind(this));
    window.addEventListener('gamepaddisconnected', this.#onGamepadDisconnect.bind(this));
    this.#pollGamepads();
  }

  detach() {
    window.removeEventListener('keydown', this.#boundKeyDown);
    window.removeEventListener('keyup',   this.#boundKeyUp);
    this.#canvas.removeEventListener('mousedown', this.#boundMouseDown);
    this.#canvas.removeEventListener('mouseup',   this.#boundMouseUp);
    document.removeEventListener('mousemove',     this.#boundMouseMove);
    document.removeEventListener('pointerlockchange', this.#boundPointerLock);
    document.removeEventListener('pointerlockerror',  this.#boundPointerUnlock);

    cancelAnimationFrame(this.#gamepadRAF);
  }

  /** For mobile/touch buttons to inject synthetic key events. */
  injectKey(doomKey, isDown) {
    if (!this.#heldKeys.has(doomKey) && isDown) {
      this.#heldKeys.add(doomKey);
      this.onKeyDown?.(doomKey);
    } else if (this.#heldKeys.has(doomKey) && !isDown) {
      this.#heldKeys.delete(doomKey);
      this.onKeyUp?.(doomKey);
    }
  }

  // ─── Private: Keyboard ──────────────────────────────────────
  #onKeyDown(e) {
    // Prevent browser shortcuts inside the canvas
    if (this.#pointerLocked || document.activeElement === this.#canvas) {
      const blocklist = ['Tab','F1','F2','F3','F4','F5','F6',
                         'F7','F8','F9','F10','F11','F12'];
      if (blocklist.includes(e.key)) e.preventDefault();
    }

    const dk = KEY_MAP.get(e.code);
    if (dk == null) return;
    if (this.#heldKeys.has(dk)) return;   // ignore auto-repeat
    this.#heldKeys.add(dk);
    this.onKeyDown?.(dk);
  }

  #onKeyUp(e) {
    const dk = KEY_MAP.get(e.code);
    if (dk == null) return;
    this.#heldKeys.delete(dk);
    this.onKeyUp?.(dk);
  }

  // ─── Private: Mouse ─────────────────────────────────────────
  #onMouseDown(e) {
    const dk = e.button === 0 ? DoomKey.MOUSE_FIRE :
               e.button === 2 ? DoomKey.MOUSE_STRAFE : null;
    if (dk) this.onMouseBtn?.(dk, true);
  }

  #onMouseUp(e) {
    const dk = e.button === 0 ? DoomKey.MOUSE_FIRE :
               e.button === 2 ? DoomKey.MOUSE_STRAFE : null;
    if (dk) this.onMouseBtn?.(dk, false);
  }

  /**
   * Mouse movement → synthetic LEFT/RIGHT arrow presses.
   * DOOM's original mouse handling uses X-delta for turning.
   * We replicate by injecting key-hold signals proportional to speed.
   *
   * Note: movementX is only reliable when pointer-locked.
   */
  #onMouseMove(e) {
    if (!this.#pointerLocked) return;
    const dx = e.movementX;
    const threshold = 3;  // pixels before we register a turn
    if (dx > threshold)        this.#injectTurn('right', dx);
    else if (dx < -threshold)  this.#injectTurn('left',  -dx);
  }

  /**
   * Simulate a key-press + key-release in one frame for mouse turning.
   * We don't hold the key; we pulse it proportional to speed.
   */
  #injectTurn(dir, magnitude) {
    const dk = dir === 'right' ? DoomKey.RIGHT_ARROW : DoomKey.LEFT_ARROW;
    this.onKeyDown?.(dk);
    // Release after a small delay proportional to magnitude
    const delay = Math.min(magnitude * 8, 100);
    setTimeout(() => this.onKeyUp?.(dk), delay);
  }

  // ─── Private: Pointer Lock ───────────────────────────────────
  #requestPointerLock() {
    if (!document.pointerLockElement) {
      this.#canvas.requestPointerLock();
    }
  }

  #onPointerLock() {
    this.#pointerLocked = document.pointerLockElement === this.#canvas;
    document.getElementById('click-to-play')?.classList.toggle(
      'hidden', this.#pointerLocked
    );
  }

  #onPointerUnlock() {
    this.#pointerLocked = false;
  }

  // ─── Private: Gamepad ───────────────────────────────────────
  #onGamepadConnect(e)    { console.log('[Input] Gamepad connected:', e.gamepad.id); }
  #onGamepadDisconnect(e) { console.log('[Input] Gamepad disconnected:', e.gamepad.id); }

  #pollGamepads() {
    this.#gamepadRAF = requestAnimationFrame(() => this.#pollGamepads());
    const pads = navigator.getGamepads?.() ?? [];

    for (const pad of pads) {
      if (!pad) continue;
      const prev = this.#gamepadState[pad.index] ?? [];

      // Digital buttons
      pad.buttons.forEach((btn, i) => {
        const dk = GAMEPAD_BTN_MAP[i];
        if (!dk) return;
        const nowPressed  = btn.pressed;
        const wasPressed  = prev[i] ?? false;
        if (nowPressed && !wasPressed) {
          this.#heldKeys.add(dk);
          this.onKeyDown?.(dk);
        } else if (!nowPressed && wasPressed) {
          this.#heldKeys.delete(dk);
          this.onKeyUp?.(dk);
        }
      });

      // Left stick X-axis → turn
      const lx = pad.axes[0] ?? 0;
      if (Math.abs(lx) > 0.25) {
        const dk = lx > 0 ? DoomKey.RIGHT_ARROW : DoomKey.LEFT_ARROW;
        if (!this.#heldKeys.has(dk)) {
          this.#heldKeys.add(dk);
          this.onKeyDown?.(dk);
        }
      } else {
        [DoomKey.RIGHT_ARROW, DoomKey.LEFT_ARROW].forEach(dk => {
          if (this.#heldKeys.has(dk)) {
            this.#heldKeys.delete(dk);
            this.onKeyUp?.(dk);
          }
        });
      }

      // Left stick Y-axis → forward/back
      const ly = pad.axes[1] ?? 0;
      if (Math.abs(ly) > 0.25) {
        const dk = ly > 0 ? DoomKey.DOWN_ARROW : DoomKey.UP_ARROW;
        if (!this.#heldKeys.has(dk)) {
          this.#heldKeys.add(dk);
          this.onKeyDown?.(dk);
        }
      } else {
        [DoomKey.UP_ARROW, DoomKey.DOWN_ARROW].forEach(dk => {
          if (this.#heldKeys.has(dk)) {
            this.#heldKeys.delete(dk);
            this.onKeyUp?.(dk);
          }
        });
      }

      // Save current state for next frame delta
      this.#gamepadState[pad.index] = pad.buttons.map(b => b.pressed);
    }
  }
}
