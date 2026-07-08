/**
 * MusPlayer.js
 * ─────────────────────────────────────────────────────────────────
 * Parses id Software's MUS music format (used by DOOM's D_* music
 * lumps) and plays it back using a lightweight built-in Web Audio
 * synthesizer — no soundfont file required.
 *
 * MUS is DMX's compact MIDI-like format. Format reference (widely
 * documented, e.g. the Vinyl/ZDoom mus2midi specs):
 *
 *   Header (16 bytes):
 *     0-3   "MUS\x1A" magic
 *     4-5   uint16 LE  scoreLen      (event-stream byte length)
 *     6-7   uint16 LE  scoreStart    (offset to first event)
 *     8-9   uint16 LE  channels      (primary channel count)
 *     10-11 uint16 LE  secondaryChannels
 *     12-13 uint16 LE  numInstruments
 *     14-15 uint16 LE  padding
 *
 *   Event stream (starting at scoreStart):
 *     Each event begins with a descriptor byte:
 *       bit7        "last event in this time-slice" flag — if set,
 *                   a delta-time VLQ follows this event's own data
 *       bits4-6     event type (0-6)
 *       bits0-3     channel (0-15; channel 15 = percussion)
 *
 *     Event types:
 *       0  Release Note      1 byte:  note (0-127)
 *       1  Play Note         1 byte:  bit7=volume-follows, bits0-6=note
 *                             (+1 byte volume if bit7 set)
 *       2  Pitch Bend         1 byte:  bend (0-255, 128=center)
 *       3  System Event       1 byte:  controller number (10-14)
 *       4  Controller Change  2 bytes: controller number, value
 *                             (controller 0 = program/patch change)
 *       6  Score End          (no data — end of song)
 *
 *     A delta-time VLQ (only present when the descriptor's bit7 was
 *     set) is a base-128 varint: each byte contributes 7 bits: value
 *     accumulates (byte & 0x7f); continue while (byte & 0x80).
 *
 *   Standard MUS tick rate: 140 Hz (matches DMX's original timing).
 *
 * Synthesis approach (deliberately simple — no soundfont asset):
 *   Each of the 16 MUS channels gets its own set of active voices.
 *   Channel 15 (percussion) triggers short filtered noise bursts.
 *   All other channels use a triangle/sawtooth oscillator with a
 *   simple attack/decay/sustain/release envelope, picked per
 *   General MIDI program-number range so different instruments
 *   (bass, lead, pad, pluck) sound at least tonally distinct.
 *   This won't match a real GM soundfont's timbre, but gives
 *   correct notes, rhythm, and dynamics — a big step up from a
 *   static drone placeholder.
 * ─────────────────────────────────────────────────────────────────
 */

const MUS_TICK_HZ = 140;

// Rough GM program-number → timbre category mapping. Ranges follow
// the General MIDI instrument family layout (0-indexed program #).
function timbreForProgram(program) {
  if (program < 8)   return 'piano';       // Piano family
  if (program < 16)  return 'chime';       // Chromatic percussion
  if (program < 24)  return 'organ';       // Organ family
  if (program < 32)  return 'guitar';      // Guitar family
  if (program < 40)  return 'bass';        // Bass family
  if (program < 48)  return 'strings';     // Strings
  if (program < 56)  return 'strings';     // Ensemble
  if (program < 64)  return 'brass';       // Brass
  if (program < 72)  return 'reed';        // Reed
  if (program < 80)  return 'lead';        // Pipe/lead
  if (program < 88)  return 'pad';         // Synth lead
  return 'pad';                             // Everything else -> pad
}

const TIMBRE_PARAMS = {
  piano:   { wave: 'triangle', attack: 0.004, decay: 0.25, sustain: 0.15, release: 0.15 },
  chime:   { wave: 'sine',     attack: 0.002, decay: 0.4,  sustain: 0.1,  release: 0.3  },
  organ:   { wave: 'square',   attack: 0.01,  decay: 0.05, sustain: 0.8,  release: 0.08 },
  guitar:  { wave: 'sawtooth', attack: 0.006, decay: 0.2,  sustain: 0.3,  release: 0.12 },
  bass:    { wave: 'triangle', attack: 0.008, decay: 0.15, sustain: 0.6,  release: 0.1  },
  strings: { wave: 'sawtooth', attack: 0.08,  decay: 0.1,  sustain: 0.7,  release: 0.25 },
  brass:   { wave: 'sawtooth', attack: 0.03,  decay: 0.1,  sustain: 0.6,  release: 0.15 },
  reed:    { wave: 'square',   attack: 0.02,  decay: 0.1,  sustain: 0.55, release: 0.12 },
  lead:    { wave: 'square',   attack: 0.01,  decay: 0.08, sustain: 0.65, release: 0.1  },
  pad:     { wave: 'sine',     attack: 0.15,  decay: 0.2,  sustain: 0.7,  release: 0.4  },
};

/** MIDI note number → frequency (Hz), A4 = note 69 = 440Hz. */
function noteToFreq(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

export class MusPlayer {
  #ctx;
  #destination;
  #playing = false;
  #loop = false;
  #timeouts = [];
  #channelProgram = new Array(16).fill(0);
  #channelVolume  = new Array(16).fill(127);
  #musData = null;

  /**
   * @param {AudioContext} audioCtx
   * @param {AudioNode} destinationNode  Where synthesized audio routes to
   *                                     (e.g. the engine's musicGain bus)
   */
  constructor(audioCtx, destinationNode) {
    this.#ctx = audioCtx;
    this.#destination = destinationNode;
  }

  /**
   * Parse and play a MUS lump.
   * @param {Uint8Array} musBytes
   * @param {boolean} loop
   */
  play(musBytes, loop = true) {
    this.stop();

    if (musBytes.length < 16 ||
        musBytes[0] !== 0x4D || musBytes[1] !== 0x55 ||
        musBytes[2] !== 0x53 || musBytes[3] !== 0x1A) {
      // Not a valid MUS lump (bad magic) — silently skip rather
      // than crash; DOOM occasionally has maps with no music lump.
      return;
    }

    this.#musData = musBytes;
    this.#loop = loop;
    this.#playing = true;
    this.#channelProgram.fill(0);
    this.#channelVolume.fill(127);

    this.#scheduleSong();
  }

  stop() {
    this.#playing = false;
    this.#timeouts.forEach(clearTimeout);
    this.#timeouts = [];
  }

  // ═══════════════════════════════════════════════════════════
  //  MUS PARSING + SCHEDULING
  // ═══════════════════════════════════════════════════════════

  #scheduleSong() {
    const data = this.#musData;
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const scoreStart = view.getUint16(6, true);

    let pos = scoreStart;
    let elapsedTicks = 0;
    const lastVolume = new Array(16).fill(64);

    const readVLQ = () => {
      let value = 0;
      let b;
      do {
        b = data[pos++];
        value = (value << 7) | (b & 0x7f);
      } while (b & 0x80);
      return value;
    };

    while (pos < data.length && this.#playing !== false) {
      const desc = data[pos++];
      const last = (desc & 0x80) !== 0;
      const type = (desc >> 4) & 0x07;
      const channel = desc & 0x0f;
      const timeSec = elapsedTicks / MUS_TICK_HZ;

      switch (type) {
        case 0: { // Release note
          const note = data[pos++] & 0x7f;
          this.#scheduleNoteOff(channel, note, timeSec);
          break;
        }
        case 1: { // Play note
          const noteByte = data[pos++];
          const note = noteByte & 0x7f;
          if (noteByte & 0x80) {
            lastVolume[channel] = data[pos++] & 0x7f;
          }
          this.#scheduleNoteOn(channel, note, lastVolume[channel], timeSec);
          break;
        }
        case 2: { // Pitch bend (not implemented — skip byte)
          pos++;
          break;
        }
        case 3: { // System event
          pos++; // controller number, not implemented
          break;
        }
        case 4: { // Controller change
          const controller = data[pos++];
          const value = data[pos++];
          if (controller === 0) this.#channelProgram[channel] = value;
          if (controller === 3) lastVolume[channel] = value;
          break;
        }
        case 6: // Score end
          pos = data.length; // stop the loop
          if (this.#loop && this.#playing) {
            const totalSec = elapsedTicks / MUS_TICK_HZ;
            this.#timeouts.push(setTimeout(() => {
              if (this.#playing) this.#scheduleSong();
            }, Math.max(50, totalSec * 1000)));
          }
          break;
        default:
          break;
      }

      if (last && type !== 6) {
        elapsedTicks += readVLQ();
      }
    }
  }

  #scheduleNoteOn(channel, note, volume, timeSec) {
    const timbre = timbreForProgram(this.#channelProgram[channel]);
    const isPercussion = channel === 15;
    const gainScale = Math.max(0, Math.min(1, volume / 127));

    const t = this.#timeouts.push(setTimeout(() => {
      if (!this.#playing) return;
      if (isPercussion) {
        this.#playPercussionHit(note, gainScale);
      } else {
        this.#playTone(timbre, note, gainScale);
      }
    }, timeSec * 1000));
  }

  #scheduleNoteOff(channel, note, timeSec) {
    // Our simple synth uses fire-and-forget envelopes (each note
    // plays its own decay/release automatically), so explicit
    // note-off is a no-op — matches how percussive/decaying voices
    // naturally behave and keeps the scheduler simple.
  }

  #playTone(timbreName, note, gainScale) {
    const p = TIMBRE_PARAMS[timbreName] ?? TIMBRE_PARAMS.pad;
    const freq = noteToFreq(note);
    const now = this.#ctx.currentTime;

    const osc = this.#ctx.createOscillator();
    osc.type = p.wave;
    osc.frequency.value = freq;

    const gain = this.#ctx.createGain();
    const peak = 0.18 * gainScale;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peak, now + p.attack);
    gain.gain.linearRampToValueAtTime(peak * p.sustain, now + p.attack + p.decay);
    gain.gain.setValueAtTime(peak * p.sustain, now + p.attack + p.decay + 0.15);
    gain.gain.linearRampToValueAtTime(0, now + p.attack + p.decay + 0.15 + p.release);

    osc.connect(gain);
    gain.connect(this.#destination);

    osc.start(now);
    osc.stop(now + p.attack + p.decay + 0.15 + p.release + 0.05);
  }

  #playPercussionHit(note, gainScale) {
    const now = this.#ctx.currentTime;
    const bufferSize = Math.floor(this.#ctx.sampleRate * 0.12);
    const buffer = this.#ctx.createBuffer(1, bufferSize, this.#ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = this.#ctx.createBufferSource();
    noise.buffer = buffer;

    // Rough kick/snare/hihat differentiation by GM percussion note
    // ranges (35-59 roughly covers kicks/snares/toms; 42+ hihats/cymbals)
    const filter = this.#ctx.createBiquadFilter();
    if (note <= 41)      { filter.type = 'lowpass';  filter.frequency.value = 200; }
    else if (note <= 51) { filter.type = 'bandpass'; filter.frequency.value = 900; }
    else                 { filter.type = 'highpass'; filter.frequency.value = 4000; }

    const gain = this.#ctx.createGain();
    gain.gain.setValueAtTime(0.35 * gainScale, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.#destination);
    noise.start(now);
  }
}
