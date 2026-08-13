/**
 * WadLoader.js
 * ─────────────────────────────────────────────────────────────────
 * Responsible for obtaining a WAD file Uint8Array from:
 *   1. A bundled URL (pre-fetched Freedoom shareware WAD)
 *   2. A user file-picker  (<input type="file">)
 *   3. Drag-and-drop onto the window
 *
 * WAD format quick reference:
 *   Bytes 0–3:  "IWAD" or "PWAD" magic
 *   Bytes 4–7:  numLumps (uint32 LE)
 *   Bytes 8–11: infotableofs (uint32 LE)
 *   Then: directory of (filepos, size, name[8]) entries
 *
 * We do a minimal magic-byte sanity check before returning.
 * ─────────────────────────────────────────────────────────────────
 */

export class WadLoader {

  /**
   * Fetch a WAD from a URL with progress reporting.
   *
   * @param {string}   url
   * @param {(pct: number) => void} [onProgress]
   * @returns {Promise<Uint8Array>}
   */
  static async fromUrl(url, onProgress, { retries = 2, timeoutMs = 45000 } = {}) {
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await WadLoader.#fetchOnce(url, onProgress, timeoutMs);
      } catch (error) {
        lastError = error;
        if (attempt >= retries) break;
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
    throw new Error(`WAD download failed after ${retries + 1} attempts: ${lastError?.message ?? 'unknown network error'}`);
  }

  static async #fetchOnce(url, onProgress, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort('timeout'), timeoutMs);
    let response;
    try {
      response = await fetch(url, { signal: controller.signal, cache: 'force-cache' });
    } catch (error) {
      const reason = error?.name === 'AbortError' ? `timed out after ${Math.round(timeoutMs / 1000)} seconds` : error.message;
      throw new Error(`WAD fetch failed: ${reason}`);
    } finally {
      clearTimeout(timer);
    }
    if (!response.ok) throw new Error(`WAD fetch failed: ${response.status} ${response.statusText}`);

    const totalBytes = Number(response.headers.get('content-length') ?? 0);
    const reader = response.body?.getReader();
    if (!reader) {
      const ab = await response.arrayBuffer();
      onProgress?.(100);
      return WadLoader.#validate(new Uint8Array(ab));
    }

    const chunks = [];
    let received = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      onProgress?.(totalBytes > 0 ? Math.round(received / totalBytes * 100) : null);
    }

    const merged = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.length; }
    onProgress?.(100);
    return WadLoader.#validate(merged);
  }

  /**
   * Read a WAD from a File object (file input / drag-drop).
   *
   * @param {File} file
   * @param {(pct: number) => void} [onProgress]
   * @returns {Promise<Uint8Array>}
   */
  static fromFile(file, onProgress) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress?.(Math.round(e.loaded / e.total * 100));
        }
      };

      reader.onload = () => {
        try {
          const bytes = new Uint8Array(reader.result);
          resolve(WadLoader.#validate(bytes));
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = () => reject(new Error('FileReader error: ' + reader.error));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Parse WAD header and return some metadata without loading all data.
   * Useful for UI display (type, lump count, etc.)
   *
   * @param {Uint8Array} bytes
   * @returns {{ type: 'IWAD'|'PWAD', numLumps: number, lumps: string[] }}
   */
  static parseHeader(bytes) {
    const view = new DataView(bytes.buffer, bytes.byteOffset);
    const magic = String.fromCharCode(...bytes.subarray(0, 4));

    if (magic !== 'IWAD' && magic !== 'PWAD') {
      throw new Error(`Not a valid WAD file (magic: "${magic}")`);
    }

    const numLumps     = view.getUint32(4, true);
    const infotableOfs = view.getUint32(8, true);

    // Read lump names from directory (each entry is 16 bytes)
    const lumps = [];
    for (let i = 0; i < Math.min(numLumps, 2000); i++) {
      const entryOffset = infotableOfs + i * 16;
      if (entryOffset + 16 > bytes.length) break;
      const nameBytes = bytes.subarray(entryOffset + 8, entryOffset + 16);
      const name = String.fromCharCode(...nameBytes)
                          .replace(/\0+$/, '')
                          .trim();
      lumps.push(name);
    }

    return { type: magic, numLumps, lumps };
  }

  // ── Private ──────────────────────────────────────────────────
  static #validate(bytes) {
    if (bytes.length < 12) {
      throw new Error('File too small to be a valid WAD');
    }
    const magic = String.fromCharCode(...bytes.subarray(0, 4));
    if (magic !== 'IWAD' && magic !== 'PWAD') {
      throw new Error(
        `Invalid WAD magic bytes: "${magic}". ` +
        `Make sure you're loading a .WAD file (DOOM1.WAD, DOOM2.WAD, freedoom1.wad…)`
      );
    }
    return bytes;
  }
}
