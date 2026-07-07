/**
 * Renderer.js
 * ─────────────────────────────────────────────────────────────────
 * Handles all canvas rendering for the DOOM framebuffer.
 *
 * DOOM's internal framebuffer is 320×200 pixels (RGBA after palette
 * conversion in WASM).  We blit it to a hidden offscreen canvas, then
 * scale it up to fill the visible canvas — keeping pixel-perfect
 * nearest-neighbour scaling (no blurring).
 *
 * Techniques used:
 *   • OffscreenCanvas  → zero-copy path when available
 *   • ImageData + putImageData  → fastest path for raw RGBA blits
 *   • CSS `image-rendering: pixelated` + canvas CSS sizing for scale
 *   • ResizeObserver for responsive re-scaling without polling
 * ─────────────────────────────────────────────────────────────────
 */

export class Renderer {
  #canvas;          // visible <canvas> element
  #ctx;             // 2D context of visible canvas
  #fbCanvas;        // hidden 320×200 offscreen framebuffer
  #fbCtx;           // 2D context of framebuffer canvas
  #imageData;       // reused ImageData(320, 200)
  #fbWidth;
  #fbHeight;
  #resizeObserver;
  #scaleMode = 'auto';   // 'auto' | 1 | 2 | 3 | 4 ...
  #smoothing = false;

  /**
   * @param {HTMLCanvasElement} canvas  Visible game canvas
   * @param {number} fbWidth            Framebuffer width  (320)
   * @param {number} fbHeight           Framebuffer height (200)
   */
  constructor(canvas, fbWidth = 320, fbHeight = 200) {
    this.#canvas   = canvas;
    this.#fbWidth  = fbWidth;
    this.#fbHeight = fbHeight;

    // Primary context: we only use drawImage (no pixel work here)
    this.#ctx = canvas.getContext('2d', {
      alpha:              false,  // opaque → faster compositing
      desynchronized:     true,   // hint for reduced latency (Chrome)
      willReadFrequently: false,
    });

    // Framebuffer canvas — always 320×200, never resized
    this.#fbCanvas = this.#createOffscreen(fbWidth, fbHeight);
    this.#fbCtx    = this.#fbCanvas.getContext('2d', {
      alpha:              false,
      willReadFrequently: false,
    });

    // Pre-allocate ImageData so we don't GC every frame
    this.#imageData = this.#fbCtx.createImageData(fbWidth, fbHeight);

    // Watch container for resize events
    this.#resizeObserver = new ResizeObserver(() => this.#onResize());
    this.#resizeObserver.observe(canvas.parentElement ?? document.body);
    this.#onResize();
  }

  // ═══════════════════════════════════════════════════════════
  //  PUBLIC — called by DoomEngine once per rendered frame
  // ═══════════════════════════════════════════════════════════

  /**
   * Blit one frame.
   * @param {Uint8ClampedArray} rgba  320×200 RGBA pixels from WASM
   */
  drawFrame(rgba) {
    // 1. Write pixels into the pre-allocated ImageData
    this.#imageData.data.set(rgba);

    // 2. Push ImageData to the 320×200 offscreen canvas
    this.#fbCtx.putImageData(this.#imageData, 0, 0);

    // 3. Blit (scaled) to the visible canvas
    //    drawImage handles the integer scale via CSS – no blurring
    this.#ctx.drawImage(
      this.#fbCanvas,
      0, 0, this.#fbWidth, this.#fbHeight,   // src rect
      0, 0, this.#canvas.width, this.#canvas.height  // dst rect (CSS-sized)
    );
  }

  /** Clear the visible canvas (e.g. during loading). */
  clear(color = '#000') {
    this.#ctx.fillStyle = color;
    this.#ctx.fillRect(0, 0, this.#canvas.width, this.#canvas.height);
  }

  destroy() {
    this.#resizeObserver.disconnect();
  }

  // ═══════════════════════════════════════════════════════════
  //  PRIVATE
  // ═══════════════════════════════════════════════════════════

  /**
   * Recompute the pixel scale that fits DOOM's 320×200 framebuffer
   * into the current window, preserving the original aspect ratio.
   *
   * Two modes:
   *   'auto'  — largest integer scale that fits the window (default,
   *             pixel-perfect, may letterbox)
   *   N (int) — fixed scale factor, ignoring window size (user's
   *             explicit choice from the settings panel)
   */
  #onResize() {
    const winW = window.innerWidth;
    const winH = window.innerHeight;

    let scale;
    if (this.#scaleMode === 'auto') {
      const scaleX = Math.floor(winW / this.#fbWidth);
      const scaleY = Math.floor(winH / this.#fbHeight);
      scale = Math.max(1, Math.min(scaleX, scaleY));
    } else {
      scale = Math.max(1, this.#scaleMode);
    }

    const displayW = this.#fbWidth  * scale;
    const displayH = this.#fbHeight * scale;

    // Set the canvas drawing-buffer size (not CSS size!)
    // We use the scaled pixel count so drawImage is a 1:1 blit.
    this.#canvas.width  = displayW;
    this.#canvas.height = displayH;

    // Center via CSS transform (already done in CSS, but ensure size)
    this.#canvas.style.width  = `${displayW}px`;
    this.#canvas.style.height = `${displayH}px`;

    // Re-apply smoothing preference after every resize (browsers
    // reset imageSmoothingEnabled to true on canvas resize).
    this.#ctx.imageSmoothingEnabled = this.#smoothing;
  }

  /**
   * Change the display scale mode.
   * @param {'auto'|number} mode
   */
  setScaleMode(mode) {
    this.#scaleMode = mode;
    this.#onResize();
  }

  /**
   * Toggle smooth (bilinear) vs pixelated (nearest-neighbour)
   * upscaling. Pixelated ('false') is the authentic retro look;
   * smooth can be preferred on very large displays.
   * @param {boolean} enabled
   */
  setSmoothing(enabled) {
    this.#smoothing = enabled;
    this.#canvas.style.imageRendering = enabled ? 'auto' : 'pixelated';
    this.#ctx.imageSmoothingEnabled = enabled;
  }

  /**
   * Create an offscreen canvas (native OffscreenCanvas if available,
   * otherwise a hidden <canvas> element).
   */
  #createOffscreen(w, h) {
    if (typeof OffscreenCanvas !== 'undefined') {
      return new OffscreenCanvas(w, h);
    }
    // Fallback: invisible DOM canvas
    const c = document.createElement('canvas');
    c.width  = w;
    c.height = h;
    return c;
  }
}
