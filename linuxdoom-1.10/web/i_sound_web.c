/*
 * i_sound_web.c  —  Web Audio API sound backend
 * ═══════════════════════════════════════════════════════════════
 * Replaces i_sound.c (Linux /dev/dsp + sndserver) with a bridge
 * to the JavaScript AudioManager via Emscripten JS imports.
 *
 * DOOM sound architecture:
 *
 *   SFX:
 *     • s_sound.c calls I_StartSound() with a sfxinfo_t*
 *     • Each sfx has a lump in the WAD containing raw 8-bit PCM
 *       at 11025 Hz with an 8-byte header (see below)
 *     • Up to 8 simultaneous channels (NUM_CHANNELS = 8)
 *     • Volume: 0–127,  Separation: 0–255 (128=centre)
 *
 *   Music:
 *     • MUS format (proprietary id Software MIDI subset)
 *     • Stored as WAD lumps named "D_*" (e.g. D_E1M1)
 *     • We forward the lump name to JS for decoding
 *
 * WAD SFX lump format:
 *   bytes 0–1:  format (always 3 = DMX)
 *   bytes 2–3:  sample rate (uint16 LE, usually 11025)
 *   bytes 4–7:  sample count (uint32 LE)
 *   bytes 8+:   8-bit unsigned PCM samples
 * ═══════════════════════════════════════════════════════════════
 */

#include <stdlib.h>
#include <stdio.h>
#include <string.h>

#include "doomdef.h"
#include "sounds.h"
#include "s_sound.h"
#include "m_random.h"
#include "w_wad.h"
#include "z_zone.h"
#include "i_system.h"
#include "i_sound.h"

/* ── JS imports ─────────────────────────────────────────────── */
extern void js_add_sfx_to_mixer(
    unsigned char* dataPtr,
    int            dataLen,
    int            channel,
    int            vol,
    int            sep,
    int            pitch);

extern void js_remove_sfx_from_mixer(int channel);
extern void js_play_music(const char* lumpName, int loop);
extern void js_stop_music(void);
extern void js_print_string(const char* msg);

/* ── Channel state ──────────────────────────────────────────── */
#define NUM_CHANNELS  8

typedef struct {
    int   id;        /* sfxinfo handle assigned by s_sound.c */
    int   active;    /* boolean */
} channel_t;

static channel_t channels[NUM_CHANNELS];

/* SFX volume: 0–127 (set by I_SetSfxVolume) */
static int sfxVolume = 127;

/* ── Helper: find a free channel ───────────────────────────── */
static int findFreeChannel(void)
{
    for (int i = 0; i < NUM_CHANNELS; i++) {
        if (!channels[i].active) return i;
    }
    /* All busy — steal oldest (channel 0) */
    js_remove_sfx_from_mixer(0);
    channels[0].active = 0;
    return 0;
}

/* ═══════════════════════════════════════════════════════════════
 * I_InitSound
 * ═══════════════════════════════════════════════════════════════ */
void I_InitSound(void)
{
    memset(channels, 0, sizeof(channels));
    js_print_string("I_InitSound: Web Audio bridge ready");
}

void I_ShutdownSound(void)
{
    for (int i = 0; i < NUM_CHANNELS; i++) {
        if (channels[i].active) {
            js_remove_sfx_from_mixer(i);
            channels[i].active = 0;
        }
    }
}

/* ═══════════════════════════════════════════════════════════════
 * I_GetSfxLumpNum
 * Returns the WAD lump number for an sfx.
 * sfx names are stored in s_sfx[] (sounds.c).
 * ═══════════════════════════════════════════════════════════════ */
int I_GetSfxLumpNum(sfxinfo_t* sfx)
{
    char namebuf[16];
    snprintf(namebuf, sizeof(namebuf), "ds%s", sfx->name);
    return W_GetNumForName(namebuf);
}

/* ═══════════════════════════════════════════════════════════════
 * I_StartSound
 * Start a sound effect on a mixer channel.
 *
 * @param id      sfx index into S_sfx[]
 * @param vol     0–127
 * @param sep     stereo separation 0–255 (128=centre)
 * @param pitch   pitch (0-255, 127=normal; vanilla DOOM ignores it)
 * @param priority unused in vanilla
 * @returns channel handle, or -1 on failure
 * ═══════════════════════════════════════════════════════════════ */
int I_StartSound(int id, int vol, int sep, int pitch, int priority)
{
    sfxinfo_t*    sfx;
    unsigned char* lumpData;
    unsigned char* pcmStart;
    int            lumpLen;
    int            sampleCount;
    int            ch;

    (void)priority;

    if (id < 1 || id >= NUMSFX) return -1;

    sfx = &S_sfx[id];

    /* Lazy-cache the WAD lump */
    if (!sfx->data) {
        int lumpNum = I_GetSfxLumpNum(sfx);
        if (lumpNum < 0) return -1;
        sfx->data = W_CacheLumpNum(lumpNum, PU_STATIC);
    }

    lumpData = (unsigned char*)sfx->data;
    lumpLen  = W_LumpLength(I_GetSfxLumpNum(sfx));

    /* Parse the 8-byte DMX header */
    if (lumpLen < 8) return -1;
    /* bytes 4–7: sample count (LE uint32) */
    sampleCount = lumpData[4] | (lumpData[5] << 8) |
                  (lumpData[6] << 16) | (lumpData[7] << 24);
    if (sampleCount <= 0 || 8 + sampleCount > lumpLen) return -1;

    pcmStart = lumpData + 8;    /* raw 8-bit unsigned PCM */

    ch = findFreeChannel();

    /* Scale vol by global sfxVolume */
    int scaledVol = (vol * sfxVolume) / 127;

    js_add_sfx_to_mixer(pcmStart, sampleCount, ch, scaledVol, sep, pitch);

    channels[ch].id     = id;
    channels[ch].active = 1;

    return ch;    /* channel handle returned to s_sound.c */
}

/* ═══════════════════════════════════════════════════════════════
 * I_StopSound
 * ═══════════════════════════════════════════════════════════════ */
void I_StopSound(int handle)
{
    if (handle < 0 || handle >= NUM_CHANNELS) return;
    js_remove_sfx_from_mixer(handle);
    channels[handle].active = 0;
}

/* ═══════════════════════════════════════════════════════════════
 * I_SoundIsPlaying
 * s_sound.c uses this to decide whether to evict a channel.
 * We approximate: if it's marked active in our table, say yes.
 * (The JS side will mark it done via onended, but WASM can't
 *  receive that callback synchronously.)
 * ═══════════════════════════════════════════════════════════════ */
int I_SoundIsPlaying(int handle)
{
    if (handle < 0 || handle >= NUM_CHANNELS) return 0;
    return channels[handle].active;
}

/* ═══════════════════════════════════════════════════════════════
 * I_UpdateSound — called per-tick to update panning/volume
 * Vanilla DOOM's mixer updates happen here; for us it's a no-op
 * because the Web Audio graph handles it.
 * ═══════════════════════════════════════════════════════════════ */
void I_UpdateSound(void) { }

void I_SetChannels(void)  { }

void I_SetSfxVolume(int volume)
{
    sfxVolume = (volume > 127) ? 127 : (volume < 0) ? 0 : volume;
}

/* ═══════════════════════════════════════════════════════════════
 * Music
 * ═══════════════════════════════════════════════════════════════ */
void I_InitMusic(void)    { }
void I_ShutdownMusic(void){ js_stop_music(); }

void I_SetMusicVolume(int volume)
{
    /* TODO: forward to AudioManager.setMusicVolume() */
    (void)volume;
}

/*
 * I_RegisterSong
 * DOOM passes us the raw MUS lump data.
 * We return an opaque handle (lump number).
 */
int I_RegisterSong(void* data)
{
    (void)data;
    /* We use lump names for music, handle = 0 for now */
    return 0;
}

void I_UnRegisterSong(int handle) { (void)handle; }

/*
 * I_PlaySong
 * DOOM calls this with the lump handle and loop flag.
 * We look up the currently active music lump name from
 * gamemap / gamemode and forward it to JS.
 */
void I_PlaySong(int handle, int looping)
{
    /*
     * Vanilla DOOM tracks the music lump name in mus_playing->name
     * (set in s_sound.c before calling I_PlaySong).
     * We access it via the global musicinfo pointer.
     */
    extern musicinfo_t* mus_playing;
    if (mus_playing && mus_playing->name) {
        char lumpName[16];
        snprintf(lumpName, sizeof(lumpName), "d_%s", mus_playing->name);
        js_play_music(lumpName, looping);
    }
    (void)handle;
}

void I_PauseSong(int handle) { (void)handle; js_stop_music(); }
void I_ResumeSong(int handle)
{
    extern musicinfo_t* mus_playing;
    if (mus_playing && mus_playing->name) {
        char lumpName[16];
        snprintf(lumpName, sizeof(lumpName), "d_%s", mus_playing->name);
        js_play_music(lumpName, 1);
    }
    (void)handle;
}

void I_StopSong(int handle)    { (void)handle; js_stop_music(); }
int  I_QrySongPlaying(int handle) { (void)handle; return 1; }
