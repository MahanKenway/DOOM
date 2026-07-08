/**
 * AudioManager.js
 * ─────────────────────────────────────────────────────────────────
 * DOOM sound system bridge using the Web Audio API.
 *
 * DOOM audio architecture:
 *   • 8 simultaneous SFX channels
 *   • Music via MUS format (converted to MIDI by wasm)
 *   • SFX are 8-bit unsigned PCM at 11025 Hz (vanilla)
 *
 * Web Audio API topology:
 *
 *   [SFX AudioBufferSource N] ──┐
 *   [SFX AudioBufferSource N] ──┤
 *   ...                         ├─► [sfxGain] ──┐
 *   [Music OscillatorNode]  ────►  [musicGain] ──┤─► [masterGain] ──► destination
 *
 * Features:
 *   • Per-channel gain for volume  (vol 0-127)
 *   • Stereo pan for separation    (sep 0-255, 128 = centre)
 *   • Up to 8 simultaneous SFX channels
 *   • Music stub (plays a sine tone as placeholder until
 *     a proper MUS decoder is wired up)
 * ─────────────────────────────────────────────────────────────────
 */

import { MusPlayer } from './MusPlayer.js';

const DOOM_SAMPLE_RATE = 11025;    // Hz — vanilla DOOM PCM rate
const MAX_CHANNELS     = 8;

export class AudioManager {
  #ctx        = null;   // AudioContext
  #masterGain = null;   // GainNode — master volume
  #sfxGain    = null;   // GainNode — SFX sub-bus
  #musicGain  = null;   // GainNode — music sub-bus

  /** @type {Map<number, AudioBufferSourceNode>} channel → active source */
  #sfxChannels = new Map();

  /** @type {AudioBufferSourceNode|MusPlayer|null} */
  #musicSource = null;

  /** @type {MusPlayer|null} */
  #musPlayer = null;

  #sfxVolume   = 1.0;
  #musicVolume = 0.6;
  #initialized = false;

  // ═══════════════════════════════════════════════════════════
  //  PUBLIC
  // ═══════════════════════════════════════════════════════════

  async init() {
    if (this.#initialized) return;

    // AudioContext requires a user gesture in browsers — must be called
    // from an event handler or after an interaction.
    this.#ctx = new (window.AudioContext ?? window.webkitAudioContext)({
      sampleRate: 44100,    // Standard; we'll resample DOOM's 11025 Hz
    });

    // Build the routing graph
    this.#masterGain = this.#makeGain(1.0);
    this.#sfxGain    = this.#makeGain(this.#sfxVolume);
    this.#musicGain  = this.#makeGain(this.#musicVolume);

    this.#sfxGain.connect(this.#masterGain);
    this.#musicGain.connect(this.#masterGain);
    this.#masterGain.connect(this.#ctx.destination);

    this.#initialized = true;

    // Resume if browser suspended it
    if (this.#ctx.state === 'suspended') {
      await this.#ctx.resume();
    }
  }

  /**
   * Play a sound effect on the given DOOM mixer channel.
   *
   * @param {object} opts
   * @param {Uint8Array} opts.pcmData   8-bit unsigned PCM at 11025 Hz
   * @param {number}     opts.channel   0–7
   * @param {number}     opts.vol       0–127
   * @param {number}     opts.sep       0–255 (128 = centre)
   * @param {number}     opts.pitch     (unused in vanilla)
   */
  playSfx({ pcmData, channel, vol, sep, pitch }) {
    if (!this.#initialized) return;
    if (channel < 0 || channel >= MAX_CHANNELS) return;

    // Stop whatever was on this channel
    this.stopSfx(channel);

    // Decode 8-bit unsigned PCM to float32 [-1, 1]
    const buffer  = this.#ctx.createBuffer(1, pcmData.length, DOOM_SAMPLE_RATE);
    const f32     = buffer.getChannelData(0);
    for (let i = 0; i < pcmData.length; i++) {
      f32[i] = (pcmData[i] - 128) / 128;   // u8 → [-1, +1]
    }

    const source = this.#ctx.createBufferSource();
    source.buffer = buffer;

    // Volume: DOOM vol 0–127 → gain 0–1
    const gainNode = this.#makeGain(vol / 127);

    // Stereo pan: DOOM sep 0–255, 128=centre → StereoPannerNode -1..+1
    const panValue = (sep - 128) / 128;
    const panNode  = this.#ctx.createStereoPanner();
    panNode.pan.value = Math.max(-1, Math.min(1, panValue));

    // Wire: source → gain → pan → sfxBus
    source.connect(gainNode);
    gainNode.connect(panNode);
    panNode.connect(this.#sfxGain);

    source.start();
    source.onended = () => { this.#sfxChannels.delete(channel); };

    this.#sfxChannels.set(channel, source);
  }

  /** Stop the sound on a specific DOOM channel. */
  stopSfx(channel) {
    const src = this.#sfxChannels.get(channel);
    if (src) {
      try { src.stop(); } catch { /* already ended */ }
      this.#sfxChannels.delete(channel);
    }
  }

  /**
   * Play a MUS-format music lump (DOOM's native music format).
   * @param {Uint8Array} musBytes  Raw MUS lump data
   * @param {boolean}    loop
   */
  playMusic(musBytes, loop = true) {
    if (!this.#initialized) return;
    this.stopMusic();

    if (!this.#musPlayer) {
      this.#musPlayer = new MusPlayer(this.#ctx, this.#musicGain);
    }
    this.#musPlayer.play(musBytes, loop);
    this.#musicSource = this.#musPlayer;
  }

  stopMusic() {
    if (this.#musicSource?.stop) {
      try { this.#musicSource.stop(); } catch { /* already stopped */ }
      this.#musicSource = null;
    }
  }

  // ── Volume control ────────────────────────────────────────
  setSfxVolume(v) {
    this.#sfxVolume = Math.max(0, Math.min(1, v));
    if (this.#sfxGain) this.#sfxGain.gain.value = this.#sfxVolume;
  }

  setMusicVolume(v) {
    this.#musicVolume = Math.max(0, Math.min(1, v));
    if (this.#musicGain) this.#musicGain.gain.value = this.#musicVolume;
  }

  setMasterVolume(v) {
    if (this.#masterGain) this.#masterGain.gain.value = Math.max(0, Math.min(1, v));
  }

  destroy() {
    this.stopMusic();
    this.#sfxChannels.forEach((_, ch) => this.stopSfx(ch));
    this.#ctx?.close();
    this.#initialized = false;
  }

  // ═══════════════════════════════════════════════════════════
  //  PRIVATE
  // ═══════════════════════════════════════════════════════════
  #makeGain(value) {
    const g = this.#ctx.createGain();
    g.gain.value = value;
    return g;
  }
}
