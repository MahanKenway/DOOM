/**
 * DoomEngine.js
 * ─────────────────────────────────────────────────────────────────
 * Core engine module: loads doom.wasm, wires all JS↔WASM imports,
 * drives the deterministic 35 Hz game ticker, and exposes a clean
 * public API consumed by main.js.
 *
 * DOOM's engine architecture (original):
 *   D_DoomMain()  → init subsystems
 *   D_DoomLoop()  → infinite: I_StartTic → G_BuildTiccmd → G_Ticker
 *                             → D_Display (R_RenderPlayerView + ST/HU)
 *
 * We replicate this cadence via requestAnimationFrame + accumulator.
 *
 * WASM interface (jacobenget/doom.wasm minimal design):
 *   IMPORTS (10 functions we supply):
 *     js_get_wad_data        – copy WAD bytes into WASM memory
 *     js_get_wad_data_length – return WAD byte-length
 *     js_draw_screen         – copy framebuffer → Canvas
 *     js_fatal_error         – I_Error handler
 *     js_get_time_ms         – performance.now() equivalent
 *     js_print_string        – console.log / log panel
 *     js_play_music          – start a music lump
 *     js_stop_music          – stop current music
 *     js_add_sfx_to_mixer    – queue a sound effect
 *     js_remove_sfx_from_mixer – dequeue a sound effect
 *
 *   EXPORTS (4 functions we call):
 *     initGame()             – one-time startup
 *     tickGame()             – one logic tick (~28.5 ms)
 *     reportKeyDown(key)     – DOOM keycode → pressed
 *     reportKeyUp(key)       – DOOM keycode → released
 * ─────────────────────────────────────────────────────────────────
 */

import { Renderer }      from './Renderer.js';
import { AudioManager }  from './AudioManager.js';
import { InputHandler }  from './InputHandler.js';
import { EventBus }      from '../EventBus.js';

// ─── Constants ────────────────────────────────────────────────
/** DOOM runs at exactly 35 ticks/second */
const DOOM_TICK_RATE  = 35;
const DOOM_TICK_MS    = 1000 / DOOM_TICK_RATE;   // ≈ 28.571 ms

/** DOOM framebuffer: 320×200 pixels, 8-bit paletted then converted */
const FB_WIDTH  = 320;
const FB_HEIGHT = 200;
const FB_PIXELS = FB_WIDTH * FB_HEIGHT;

// ─────────────────────────────────────────────────────────────────
export class DoomEngine {

  // ── State ──────────────────────────────────────────────────
  #wasm     = null;   // WebAssembly.Instance
  #memory   = null;   // WebAssembly.Memory (shared with DOOM C code)
  #wadData  = null;   // Uint8Array  — raw WAD bytes
  #running  = false;
  #paused   = false;

  // Timing accumulator for fixed-step ticker
  #accumulator  = 0;
  #lastTimestamp = 0;
  #rafHandle     = null;

  // FPS sampling
  #frameCount = 0;
  #fpsTimer   = 0;
  #currentFps = 0;

  // Sub-systems
  /** @type {Renderer}     */ #renderer;
  /** @type {AudioManager} */ #audio;
  /** @type {InputHandler} */ #input;

  // Callbacks
  #onFpsUpdate  = null;
  #onFatalError = null;

  /**
   * @param {object} opts
   * @param {HTMLCanvasElement} opts.canvas
   * @param {(fps: number) => void} [opts.onFpsUpdate]
   * @param {(msg: string)  => void} [opts.onFatalError]
   */
  constructor({ canvas, onFpsUpdate, onFatalError } = {}) {
    if (!canvas) throw new Error('DoomEngine: canvas element required');

    this.#renderer     = new Renderer(canvas, FB_WIDTH, FB_HEIGHT);
    this.#audio        = new AudioManager();
    this.#input        = new InputHandler(canvas);
    this.#onFpsUpdate  = onFpsUpdate  ?? (() => {});
    this.#onFatalError = onFatalError ?? console.error;

    // Wire input → engine key-report
    this.#input.onKeyDown = (doomKey) => this.#reportKey(doomKey, true);
    this.#input.onKeyUp   = (doomKey) => this.#reportKey(doomKey, false);
    this.#input.onMouseBtn = (doomKey, down) => this.#reportKey(doomKey, down);

    EventBus.on('engine:pause',  () => this.pause());
    EventBus.on('engine:resume', () => this.resume());
  }

  // ═══════════════════════════════════════════════════════════
  //  PUBLIC API
  // ═══════════════════════════════════════════════════════════

  /**
   * Load the WASM module and the WAD data, then start the game.
   * @param {object} opts
   * @param {string} opts.wasmPath  – URL to doom.wasm
   * @param {Uint8Array} opts.wad   – WAD file bytes
   * @param {(pct: number, msg: string) => void} [opts.onProgress]
   */
  async load({ wasmPath, wad, onProgress }) {
    const progress = onProgress ?? (() => {});

    // 1. Store WAD
    this.#wadData = wad;
    progress(20, `WAD loaded (${this.#fmtBytes(wad.byteLength)})`);

    // 2. Initialise audio context (must be after user gesture)
    await this.#audio.init();
    progress(35, 'Audio context ready');

    // 3. Compile + instantiate WASM
    progress(40, `Fetching ${wasmPath}…`);
    const { instance } = await WebAssembly.instantiateStreaming(
      fetch(wasmPath),
      {
        ...this.#makeWasmImports(),   // already shaped as { env: {...} }
        wasi_snapshot_preview1: this.#makeWasiShim(),
      }
    );
    this.#wasm   = instance;
    this.#memory = instance.exports.memory;
    progress(80, 'WASM compiled & instantiated');

    // 4. Run DOOM's init (D_DoomMain equivalent)
    instance.exports.initGame();
    progress(100, 'DOOM initialised — rip and tear!');

    // 5. Wire input
    this.#input.attach();
    this.#running = true;
    this.#lastTimestamp = performance.now();
    this.#rafHandle = requestAnimationFrame(this.#loop.bind(this));
  }

  pause()  { this.#paused = true;  EventBus.emit('game:paused');  }
  resume() { this.#paused = false; EventBus.emit('game:resumed'); }

  destroy() {
    this.#running = false;
    cancelAnimationFrame(this.#rafHandle);
    this.#input.detach();
    this.#audio.destroy();
  }

  get fps()    { return this.#currentFps; }
  get paused() { return this.#paused;     }

  // ═══════════════════════════════════════════════════════════
  //  MAIN LOOP  (requestAnimationFrame + fixed-step accumulator)
  // ═══════════════════════════════════════════════════════════

  /**
   * The canonical game loop pattern for fixed-timestep simulation
   * combined with as-fast-as-possible rendering.
   *
   * Reference: https://gafferongames.com/post/fix_your_timestep/
   *
   * @param {DOMHighResTimeStamp} timestamp
   */
  #loop(timestamp) {
    if (!this.#running) return;
    this.#rafHandle = requestAnimationFrame(this.#loop.bind(this));

    if (this.#paused) return;

    const dt = Math.min(timestamp - this.#lastTimestamp, 200); // clamp spiral of death
    this.#lastTimestamp = timestamp;

    // Accumulate elapsed time and drain in DOOM_TICK_MS chunks
    this.#accumulator += dt;
    while (this.#accumulator >= DOOM_TICK_MS) {
      this.#wasm.exports.tickGame();   // one deterministic DOOM tick
      this.#accumulator -= DOOM_TICK_MS;
    }

    // FPS counter
    this.#frameCount++;
    this.#fpsTimer += dt;
    if (this.#fpsTimer >= 1000) {
      this.#currentFps = Math.round(this.#frameCount * 1000 / this.#fpsTimer);
      this.#frameCount = 0;
      this.#fpsTimer   = 0;
      this.#onFpsUpdate(this.#currentFps);
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  WASM IMPORT FACTORY
  //  All functions the DOOM C code can call back into JS
  // ═══════════════════════════════════════════════════════════
  #makeWasmImports() {
    // Helper: read a null-terminated C string from WASM linear memory
    const readCString = (ptr) => {
      if (!this.#memory) return '';
      const bytes = new Uint8Array(this.#memory.buffer, ptr);
      let end = 0;
      while (bytes[end] !== 0) end++;
      return new TextDecoder().decode(bytes.subarray(0, end));
    };

    return {
      env: {
        // ── Video ────────────────────────────────────────────
        /**
         * DOOM calls this once per rendered frame with a pointer
         * to its 320×200 RGBA framebuffer in WASM memory.
         * We blit it straight to the canvas.
         */
        js_draw_screen: (fbPtr) => {
          const rgba = new Uint8ClampedArray(
            this.#memory.buffer,
            fbPtr,
            FB_PIXELS * 4
          );
          this.#renderer.drawFrame(rgba);
        },

        // ── WAD access ───────────────────────────────────────
        /**
         * DOOM asks: "how long is the WAD?"
         */
        js_get_wad_data_length: () => this.#wadData?.byteLength ?? 0,

        /**
         * DOOM asks us to copy the WAD into its linear memory at `ptr`.
         */
        js_get_wad_data: (ptr) => {
          if (!this.#wadData || !this.#memory) return;
          const dest = new Uint8Array(this.#memory.buffer, ptr, this.#wadData.byteLength);
          dest.set(this.#wadData);
        },

        // ── Timing ───────────────────────────────────────────
        /**
         * DOOM's I_GetTime – milliseconds since page load.
         * Using performance.now() (sub-ms precision) avoids the
         * overhead of constructing Date objects on every tick.
         */
        js_get_time_ms: () => performance.now(),

        // ── Logging ──────────────────────────────────────────
        js_print_string: (ptr) => {
          const msg = readCString(ptr);
          EventBus.emit('engine:log', { level: 'info', text: msg });
        },

        // ── Fatal errors ─────────────────────────────────────
        js_fatal_error: (ptr) => {
          const msg = readCString(ptr);
          this.#running = false;
          this.#onFatalError(msg);
          EventBus.emit('engine:fatal', msg);
        },

        // ── Audio: music ─────────────────────────────────────
        js_play_music: (ptr, loop) => {
          const lumpName = readCString(ptr);
          this.#audio.playMusic(lumpName, !!loop);
        },

        js_stop_music: () => {
          this.#audio.stopMusic();
        },

        // ── Audio: SFX ───────────────────────────────────────
        /**
         * @param {number} dataPtr   – pointer to PCM data in WASM memory
         * @param {number} dataLen   – byte length
         * @param {number} channel   – mixer channel (0-7)
         * @param {number} vol       – volume 0-127
         * @param {number} sep       – stereo separation 0-255 (128=centre)
         * @param {number} pitch     – pitch shift (not used in vanilla)
         */
        js_add_sfx_to_mixer: (dataPtr, dataLen, channel, vol, sep, pitch) => {
          const pcmData = new Uint8Array(this.#memory.buffer, dataPtr, dataLen).slice();
          this.#audio.playSfx({ pcmData, channel, vol, sep, pitch });
        },

        js_remove_sfx_from_mixer: (channel) => {
          this.#audio.stopSfx(channel);
        },
      }
    };
  }

  // ═══════════════════════════════════════════════════════════
  //  WASI SNAPSHOT PREVIEW1 SHIM
  //  Emscripten's STANDALONE_WASM=1 output imports a handful of
  //  WASI functions (printf/exit/clock use these under the hood
  //  via libc). We implement the minimal subset DOOM actually
  //  triggers — fd_write (printf/fprintf), proc_exit (I_Quit/abort
  //  paths), clock_time_get, and a few no-op stubs for fd_*
  //  metadata calls some libc paths probe defensively.
  //
  //  Reference: https://github.com/WebAssembly/WASI/blob/main/legacy/preview1/docs.md
  // ═══════════════════════════════════════════════════════════
  #makeWasiShim() {
    const decoder = new TextDecoder();

    /** Read a little-endian uint32 from WASM memory at `ptr`. */
    const u32 = (ptr) => new DataView(this.#memory.buffer).getUint32(ptr, true);
    /** Write a little-endian uint32 into WASM memory at `ptr`. */
    const setU32 = (ptr, val) => new DataView(this.#memory.buffer).setUint32(ptr, val, true);

    return {
      /**
       * fd_write(fd, iovs_ptr, iovs_len, nwritten_ptr) -> errno
       * Used by libc's printf/fprintf/puts (DOOM calls these ~224 times).
       * iovs is an array of {buf_ptr: u32, buf_len: u32} structs (8 bytes each).
       */
      fd_write: (fd, iovsPtr, iovsLen, nwrittenPtr) => {
        let totalWritten = 0;
        let text = '';
        for (let i = 0; i < iovsLen; i++) {
          const base   = iovsPtr + i * 8;
          const bufPtr = u32(base);
          const bufLen = u32(base + 4);
          if (bufLen > 0) {
            const bytes = new Uint8Array(this.#memory.buffer, bufPtr, bufLen);
            text += decoder.decode(bytes);
            totalWritten += bufLen;
          }
        }
        if (text) {
          // fd 1 = stdout, fd 2 = stderr — both routed to our log
          EventBus.emit('engine:log', { level: fd === 2 ? 'warn' : 'info', text: text.replace(/\n+$/, '') });
        }
        setU32(nwrittenPtr, totalWritten);
        return 0; // WASI errno: success
      },

      /**
       * proc_exit(code) -> never returns
       * Called if DOOM's C runtime hits exit()/abort(). We treat
       * this the same as I_Error: surface as a fatal error.
       */
      proc_exit: (code) => {
        this.#running = false;
        this.#onFatalError(`DOOM process exited (code ${code})`);
        EventBus.emit('engine:fatal', `proc_exit(${code})`);
        throw new Error(`WASI proc_exit(${code})`);
      },

      /**
       * clock_time_get(clock_id, precision, time_ptr) -> errno
       * Some libc init paths query the clock defensively even
       * though we don't rely on it for game timing (js_get_time_ms
       * handles that). Return current time in nanoseconds.
       */
      clock_time_get: (clockId, precision, timePtr) => {
        const ns = BigInt(Math.floor(performance.now() * 1e6));
        new DataView(this.#memory.buffer).setBigUint64(timePtr, ns, true);
        return 0;
      },

      /** fd_seek — not used by DOOM's WAD I/O (we inject WAD via memory), stub only. */
      fd_seek: (fd, offsetLow, offsetHigh, whence, newOffsetPtr) => {
        setU32(newOffsetPtr, 0);
        return 0;
      },

      /** fd_close — no real file descriptors to close. */
      fd_close: (fd) => 0,

      /** environ_sizes_get / environ_get — DOOM doesn't read env vars; report empty. */
      environ_sizes_get: (countPtr, sizePtr) => {
        setU32(countPtr, 0);
        setU32(sizePtr, 0);
        return 0;
      },
      environ_get: (environPtr, environBufPtr) => 0,

      /** args_sizes_get / args_get — argv is supplied via myargv in i_main_web.c, not WASI. */
      args_sizes_get: (countPtr, sizePtr) => {
        setU32(countPtr, 0);
        setU32(sizePtr, 0);
        return 0;
      },
      args_get: (argvPtr, argvBufPtr) => 0,

      /** fd_fdstat_get — minimal stat stub so isatty()-style checks don't crash. */
      fd_fdstat_get: (fd, statPtr) => 0,
    };
  }

  // ═══════════════════════════════════════════════════════════
  //  INPUT FORWARDING
  // ═══════════════════════════════════════════════════════════
  #reportKey(doomKey, isDown) {
    if (!this.#wasm || !this.#running) return;
    if (isDown) this.#wasm.exports.reportKeyDown(doomKey);
    else        this.#wasm.exports.reportKeyUp(doomKey);
  }

  // ═══════════════════════════════════════════════════════════
  //  HELPERS
  // ═══════════════════════════════════════════════════════════
  #fmtBytes(n) {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(2)} MB`;
  }
}
