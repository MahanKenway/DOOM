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
   * Recompute the integer pixel-perfect scale that fits DOOM's
   * 320×200 framebuffer into the current window, preserving
   * the original 4:3 (actually 8:5) aspect ratio.
   *
   * Strategy:
   *   scale = floor( min(winW / 320, winH / 200) )
   *   minimum scale = 1 (never shrink below native)
   */
  #onResize() {
    const winW = window.innerWidth;
    const winH = window.innerHeight;

    // Largest integer scale that fits window
    const scaleX = Math.floor(winW / this.#fbWidth);
    const scaleY = Math.floor(winH / this.#fbHeight);
    const scale  = Math.max(1, Math.min(scaleX, scaleY));

    const displayW = this.#fbWidth  * scale;
    const displayH = this.#fbHeight * scale;

    // Set the canvas drawing-buffer size (not CSS size!)
    // We use the scaled pixel count so drawImage is a 1:1 blit.
    this.#canvas.width  = displayW;
    this.#canvas.height = displayH;

    // Center via CSS transform (already done in CSS, but ensure size)
    this.#canvas.style.width  = `${displayW}px`;
    this.#canvas.style.height = `${displayH}px`;

    // Re-disable smoothing after every resize (browsers reset it)
    this.#ctx.imageSmoothingEnabled = false;
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
