/* i_sound_web.c — Web Audio API sound backend */

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

extern void js_add_sfx_to_mixer(unsigned char*, int, int, int, int, int);
extern void js_remove_sfx_from_mixer(int);
extern void js_play_music(unsigned char*, int, int);
extern void js_stop_music(void);
extern void js_print_string(const char*);

#define NUM_CHANNELS 8

typedef struct { int id; int active; } channel_t;
static channel_t channels[NUM_CHANNELS];
static int sfxVolume = 127;

static int findFreeChannel(void)
{
    int i;
    for (i = 0; i < NUM_CHANNELS; i++)
        if (!channels[i].active) return i;
    js_remove_sfx_from_mixer(0);
    channels[0].active = 0;
    return 0;
}

void I_InitSound(void)
{
    memset(channels, 0, sizeof(channels));
    js_print_string("I_InitSound: Web Audio ready");
}

void I_ShutdownSound(void)
{
    int i;
    for (i = 0; i < NUM_CHANNELS; i++)
        if (channels[i].active) {
            js_remove_sfx_from_mixer(i);
            channels[i].active = 0;
        }
}

int I_GetSfxLumpNum(sfxinfo_t* sfx)
{
    char namebuf[16];
    sprintf(namebuf, "ds%s", sfx->name);
    return W_CheckNumForName(namebuf);
}

int I_StartSound(int id, int vol, int sep, int pitch, int priority)
{
    sfxinfo_t*     sfx;
    unsigned char* lumpData;
    int            lumpNum, lumpLen, sampleCount, ch, scaledVol;
    (void)priority;

    if (id < 1 || id >= NUMSFX) return -1;
    sfx = &S_sfx[id];

    if (!sfx->data) {
        lumpNum = I_GetSfxLumpNum(sfx);
        if (lumpNum < 0) return -1;
        sfx->data = W_CacheLumpNum(lumpNum, PU_STATIC);
    }

    lumpNum  = I_GetSfxLumpNum(sfx);
    if (lumpNum < 0) return -1;
    lumpLen  = W_LumpLength(lumpNum);
    lumpData = (unsigned char*)sfx->data;

    if (lumpLen < 8) return -1;
    sampleCount = lumpData[4] | (lumpData[5]<<8)
                | (lumpData[6]<<16) | (lumpData[7]<<24);
    if (sampleCount <= 0 || 8 + sampleCount > lumpLen) return -1;

    ch = findFreeChannel();
    scaledVol = (vol * sfxVolume) / 127;
    js_add_sfx_to_mixer(lumpData + 8, sampleCount, ch, scaledVol, sep, pitch);
    channels[ch].id     = id;
    channels[ch].active = 1;
    return ch;
}

void I_StopSound(int handle)
{
    if (handle < 0 || handle >= NUM_CHANNELS) return;
    js_remove_sfx_from_mixer(handle);
    channels[handle].active = 0;
}

int I_SoundIsPlaying(int handle)
{
    if (handle < 0 || handle >= NUM_CHANNELS) return 0;
    return channels[handle].active;
}

void I_UpdateSound(void)    { }
void I_SubmitSound(void)    { }
void I_SetChannels(void)    { }
void I_UpdateSoundParams(int h, int v, int s, int p) { (void)h;(void)v;(void)s;(void)p; }
void I_SetSfxVolume(int v)  { sfxVolume = v>127?127:v<0?0:v; }

void I_InitMusic(void)      { }
void I_ShutdownMusic(void)  { js_stop_music(); }
void I_SetMusicVolume(int v){ (void)v; }

int  I_RegisterSong(void* d){ (void)d; return 0; }
void I_UnRegisterSong(int h){ (void)h; }

void I_PlaySong(int handle, int looping)
{
    extern int gameepisode, gamemap;
    extern GameMode_t gamemode;
    char lumpName[16];
    int lumpNum, lumpLen;
    unsigned char* musData;
    (void)handle;

    if (gamemode == commercial)
        sprintf(lumpName, "d_map%02d", gamemap);
    else
        sprintf(lumpName, "d_e%dm%d", gameepisode, gamemap);

    lumpNum = W_CheckNumForName(lumpName);
    if (lumpNum < 0) {
        js_print_string("I_PlaySong: no music lump for this map");
        return;
    }

    lumpLen = W_LumpLength(lumpNum);
    musData = (unsigned char*) W_CacheLumpNum(lumpNum, PU_STATIC);
    if (!musData || lumpLen < 4) return;

    js_play_music(musData, lumpLen, looping);
}

void I_PauseSong(int h)     { (void)h; js_stop_music(); }
void I_ResumeSong(int h)    { (void)h; }
void I_StopSong(int h)      { (void)h; js_stop_music(); }
int  I_QrySongPlaying(int h){ (void)h; return 1; }
