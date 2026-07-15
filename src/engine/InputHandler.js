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
  #sensitivity    = 1.0;   // configurable via setSensitivity()
  #gyroEnabled    = false;
  #gyroBaseline   = null;  // calibration reference yaw (set on first reading)
  #gyroSmoothedYaw = null; // low-pass-filtered yaw, reduces sensor jitter
  #boundDeviceOrientation;
  #boundOrientationChange;

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
    this.#boundDeviceOrientation = this.#onDeviceOrientation.bind(this);
    this.#boundOrientationChange = this.#onOrientationChange.bind(this);
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
    this.disableGyro();

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
    const dx = e.movementX * this.#sensitivity;
    const threshold = 3;  // pixels before we register a turn
    if (dx > threshold)        this.#injectTurn('right', dx);
    else if (dx < -threshold)  this.#injectTurn('left',  -dx);
  }

  /**
   * Set mouse look sensitivity multiplier (from the settings panel).
   * 1.0 = default speed, 0.5 = half speed, 2.0 = double speed.
   * @param {number} value
   */
  setSensitivity(value) {
    this.#sensitivity = Math.max(0.1, Math.min(5, value));
  }

  /**
   * Enable gyroscope-based looking (mobile devices only).
   * On iOS 13+, DeviceOrientationEvent access requires an explicit
   * permission prompt, which MUST be triggered from a user gesture
   * (e.g. a settings-panel toggle click) — cannot be requested
   * automatically on page load.
   * @returns {Promise<boolean>} true if successfully enabled
   */
  async enableGyro() {
    if (typeof DeviceOrientationEvent === 'undefined') return false;

    // iOS 13+ requires an explicit permission request
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const result = await DeviceOrientationEvent.requestPermission();
        if (result !== 'granted') return false;
      } catch {
        return false;
      }
    }

    this.#gyroBaseline    = null;   // recalibrate on next reading
    this.#gyroSmoothedYaw = null;
    this.#gyroEnabled = true;
    window.addEventListener('deviceorientation', this.#boundDeviceOrientation);
    window.addEventListener('orientationchange', this.#boundOrientationChange);
    return true;
  }

  disableGyro() {
    this.#gyroEnabled = false;
    window.removeEventListener('deviceorientation', this.#boundDeviceOrientation);
    window.removeEventListener('orientationchange', this.#boundOrientationChange);
  }

  get gyroActive() { return this.#gyroEnabled; }

  /**
   * Screen rotated (portrait ↔ landscape) — recalibrate so the
   * player doesn't get spun around by the coordinate-frame jump.
   */
  #onOrientationChange() {
    this.#gyroBaseline = null;
    this.#gyroSmoothedYaw = null;
  }

  /**
   * Device orientation → turn commands.
   *
   * This ports the industry-standard algorithm used by three.js's
   * reference DeviceOrientationControls (the same math underlying
   * most WebXR/mobile-AR camera code): convert the raw alpha/beta/
   * gamma triple into a proper 3D rotation (quaternion), correct
   * for the device holding orientation and current screen rotation
   * (portrait vs landscape read completely differently otherwise),
   * then extract a single stable yaw angle from that corrected
   * rotation. This is a large step up from naively watching alpha
   * alone: beta/gamma (front/back and left/right tilt) now properly
   * factor into the result instead of being ignored, and rotating
   * the phone's screen orientation no longer breaks calibration.
   *
   * DOOM only has horizontal look (no vertical/pitch), so only the
   * extracted yaw is used — but computing it via the full rotation
   * (rather than a raw single-axis delta) is what actually makes
   * the result stable instead of jittery/inconsistent between
   * portrait and landscape, which is the concrete thing that was
   * "bad" about the previous implementation.
   */
  #onDeviceOrientation(e) {
    if (!this.#gyroEnabled || e.alpha == null || e.beta == null || e.gamma == null) return;

    const rawYaw = InputHandler.#computeYawFromOrientation(
      e.alpha, e.beta, e.gamma,
      screen.orientation?.angle ?? window.orientation ?? 0
    );

    // Exponential moving-average low-pass filter — smooths out
    // sensor jitter far better than using the raw per-event value.
    // Handles the ±180° wraparound by comparing against the
    // shortest angular path before blending.
    if (this.#gyroSmoothedYaw === null) {
      this.#gyroSmoothedYaw = rawYaw;
    } else {
      let diff = rawYaw - this.#gyroSmoothedYaw;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      this.#gyroSmoothedYaw += diff * 0.25; // smoothing factor
    }

    if (this.#gyroBaseline === null) {
      this.#gyroBaseline = this.#gyroSmoothedYaw;
      return;
    }

    // Shortest-path angular delta from the calibration baseline
    let delta = this.#gyroSmoothedYaw - this.#gyroBaseline;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    const threshold = 1.5; // degrees of dead-zone before turning
    const turnSpeed = delta * this.#sensitivity * 0.6;

    if (turnSpeed > threshold)       this.#injectTurn('left',  turnSpeed);
    else if (turnSpeed < -threshold) this.#injectTurn('right', -turnSpeed);

    // Slowly re-center the baseline toward the current reading so
    // small persistent tilts don't cause continuous turning forever.
    this.#gyroBaseline += delta * 0.02;
  }

  /**
   * Convert a raw deviceorientation reading (alpha/beta/gamma, all
   * in degrees) plus the current screen rotation angle (degrees)
   * into a stable yaw angle (degrees), via proper quaternion math.
   *
   * Ported from three.js's DeviceOrientationControls reference
   * implementation (public-domain algorithm, W3C Device Orientation
   * spec §Implementation guidelines): builds the device's absolute
   * 3D orientation as a quaternion using Tait-Bryan angles in
   * Z-X'-Y'' order, rotates it -90° around X (the device screen
   * faces up, but "forward" should point out from the top edge),
   * then compensates for screen rotation around Z — finally
   * extracting the yaw (rotation around the vertical axis) from
   * the resulting quaternion via a YXZ Euler decomposition.
   *
   * @returns {number} yaw angle in degrees
   */
  static #computeYawFromOrientation(alphaDeg, betaDeg, gammaDeg, screenAngleDeg) {
    const D2R = Math.PI / 180;
    const alpha = alphaDeg * D2R;
    const beta  = betaDeg  * D2R;
    const gamma = gammaDeg * D2R;
    const orient = screenAngleDeg * D2R;

    // ── Euler (beta, alpha, -gamma) in 'YXZ' order → quaternion ──
    const x = beta, y = alpha, z = -gamma;
    const c1 = Math.cos(x / 2), c2 = Math.cos(y / 2), c3 = Math.cos(z / 2);
    const s1 = Math.sin(x / 2), s2 = Math.sin(y / 2), s3 = Math.sin(z / 2);

    let qx = s1 * c2 * c3 + c1 * s2 * s3;
    let qy = c1 * s2 * c3 - s1 * c2 * s3;
    let qz = c1 * c2 * s3 - s1 * s2 * c3;
    let qw = c1 * c2 * c3 + s1 * s2 * s3;

    // ── Multiply by q1 = -90° rotation around X axis ──────────────
    // (camera looks out of the top edge of the device, not its face)
    const q1x = -Math.SQRT1_2, q1y = 0, q1z = 0, q1w = Math.SQRT1_2;
    ({ x: qx, y: qy, z: qz, w: qw } = InputHandler.#quatMultiply(
      qx, qy, qz, qw, q1x, q1y, q1z, q1w
    ));

    // ── Multiply by q0 = rotation around Z by -screenOrientation ──
    const halfOrient = -orient / 2;
    const q0x = 0, q0y = 0, q0z = Math.sin(halfOrient), q0w = Math.cos(halfOrient);
    ({ x: qx, y: qy, z: qz, w: qw } = InputHandler.#quatMultiply(
      qx, qy, qz, qw, q0x, q0y, q0z, q0w
    ));

    // ── Extract yaw (Y-axis Euler component) via YXZ decomposition ─
    const xx = qx * qx, yy = qy * qy, zz = qz * qz;
    const xy = qx * qy, xz = qx * qz, yz = qy * qz;
    const wx = qw * qx, wy = qw * qy, wz = qw * qz;

    const m13 = xz + wy;
    const m23 = yz - wx;
    const m11 = 1 - 2 * (yy + zz);
    const m33 = 1 - 2 * (xx + yy);
    const m31 = xz - wy;

    let yaw;
    if (Math.abs(m23) < 0.9999999) {
      yaw = Math.atan2(m13, m33);
    } else {
      yaw = Math.atan2(-m31, m11);
    }

    return yaw / D2R; // back to degrees
  }

  /** Hamilton quaternion product (a * b), all components as plain numbers. */
  static #quatMultiply(ax, ay, az, aw, bx, by, bz, bw) {
    return {
      x: ax * bw + aw * bx + ay * bz - az * by,
      y: ay * bw + aw * by + az * bx - ax * bz,
      z: az * bw + aw * bz + ax * by - ay * bx,
      w: aw * bw - ax * bx - ay * by - az * bz,
    };
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
