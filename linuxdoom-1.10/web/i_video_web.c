/*
 * i_video_web.c  —  Web platform video backend
 * ═══════════════════════════════════════════════════════════════
 * Replaces the original X11-based i_video.c with a WebAssembly/
 * Emscripten-compatible implementation.
 *
 * DOOM Video Architecture:
 *
 *   screens[0]  ← 320×200 byte array of 8-bit palette indices
 *                 Written by the DOOM renderer (r_draw.c, etc.)
 *
 *   currentPalette ← 256×3 byte RGB table
 *                    Updated by I_SetPalette()
 *
 *   rgbaBuffer  ← 320×200×4 RGBA buffer (our intermediate layer)
 *                 We fill this by palette-mapping screens[0]
 *
 *   js_draw_screen(ptr)  ← JS callback: receives rgbaBuffer pointer,
 *                          blits to HTML5 canvas via ImageData
 *
 * Palette note:
 *   The DOOM palette lump (PLAYPAL) contains 14 palettes × 768 bytes.
 *   Each palette is 256 RGB triplets. We store the current one and
 *   apply it during I_FinishUpdate.
 *
 * Thread safety:
 *   Single-threaded WASM — no synchronisation needed.
 * ═══════════════════════════════════════════════════════════════
 */

#include <stdlib.h>
#include <string.h>
#include <stdio.h>

#include "doomdef.h"
#include "doomstat.h"
#include "i_system.h"
#include "v_video.h"
#include "m_argv.h"
#include "d_main.h"
#include "i_video.h"

/* ── JS imports ─────────────────────────────────────────────── */
extern void js_draw_screen(unsigned char* rgbaPtr);
extern void js_print_string(const char* str);

/* ── Framebuffer dimensions ─────────────────────────────────── */
#define FB_WIDTH    SCREENWIDTH    /* 320  — defined in doomdef.h */
#define FB_HEIGHT   SCREENHEIGHT   /* 200  — defined in doomdef.h */
#define FB_PIXELS   (FB_WIDTH * FB_HEIGHT)       /* 64000 */
#define FB_RGBA_BYTES (FB_PIXELS * 4)            /* 256000 */

/* ── Internal state ─────────────────────────────────────────── */

/* Current 256-colour RGB palette (updated by I_SetPalette) */
static unsigned char currentPalette[256 * 3];

/*
 * RGBA output buffer — 320×200 pixels, 4 bytes each.
 * Statically allocated to avoid malloc at render time.
 */
static unsigned char rgbaBuffer[FB_RGBA_BYTES];

/*
 * Gamma correction table (DOOM uses its own gamma, index 0 = no correction).
 * usegamma is a global in doomstat.h (0-4).
 */
static const unsigned char gammatable[5][256] = {
    /* gamma 0 — identity */
    {1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,
     17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,
     33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,
     49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,
     65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,
     81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,
     97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,
     113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,
     128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,
     144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,
     160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,
     176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,
     192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,
     208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,
     224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,
     240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255},
    /* gamma 1 */
    {2,4,5,7,8,10,11,12,14,15,16,18,19,20,21,22,
     23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,
     39,40,41,42,43,44,45,46,47,48,49,50,50,51,52,53,
     54,55,55,56,57,58,59,60,60,61,62,63,64,65,65,66,
     67,68,69,70,70,71,72,73,74,75,75,76,77,78,79,80,
     80,81,82,83,84,85,85,86,87,88,89,90,90,91,92,93,
     94,95,95,96,97,98,99,100,100,101,102,103,104,105,105,106,
     107,108,109,110,110,111,112,113,114,115,115,116,117,118,119,120,
     120,121,122,123,124,125,125,126,127,128,129,130,130,131,132,133,
     134,135,135,136,137,138,139,140,140,141,142,143,144,145,145,146,
     147,148,149,150,150,151,152,153,154,155,155,156,157,158,159,160,
     160,161,162,163,164,165,165,166,167,168,169,170,170,171,172,173,
     174,175,175,176,177,178,179,180,180,181,182,183,184,185,185,186,
     187,188,189,190,190,191,192,193,194,195,195,196,197,198,199,200,
     200,201,202,203,204,205,205,206,207,208,209,210,210,211,212,213,
     214,215,215,216,217,218,219,220,220,221,222,223,224,225,225,226,
     },
    /* gamma 2 */
    {4,7,9,11,13,15,17,19,21,22,24,26,27,29,30,32,
     33,35,36,38,39,40,42,43,45,46,47,48,50,51,52,54,
     55,56,57,59,60,61,62,63,65,66,67,68,69,70,72,73,
     74,75,76,77,78,79,80,82,83,84,85,86,87,88,89,90,
     91,92,93,94,95,96,97,98,100,101,102,103,104,105,106,107,
     108,109,110,111,112,113,114,114,115,116,117,118,119,120,121,122,
     123,124,125,126,127,128,129,130,130,131,132,133,134,135,136,137,
     138,139,140,141,142,142,143,144,145,146,147,148,149,150,151,152,
     152,153,154,155,156,157,158,159,160,161,161,162,163,164,165,166,
     167,168,169,170,170,171,172,173,174,175,176,177,178,178,179,180,
     181,182,183,184,185,186,186,187,188,189,190,191,192,193,194,194,
     195,196,197,198,199,200,201,202,202,203,204,205,206,207,208,209,
     210,210,211,212,213,214,215,216,217,218,218,219,220,221,222,223,
     224,225,226,226,227,228,229,230,231,232,233,234,234,235,236,237,
     238,239,240,241,242,242,243,244,245,246,247,248,249,250,250,251,
     252,253,254,255,255,255,255,255,255,255,255,255,255,255,255,255},
    /* gamma 3 */
    {8,16,23,28,33,37,42,46,49,53,56,59,62,65,68,70,
     73,75,78,80,82,85,87,89,91,93,95,97,99,101,103,105,
     107,109,110,112,114,116,117,119,121,122,124,125,127,128,130,131,
     133,134,136,137,139,140,142,143,144,146,147,149,150,151,153,154,
     155,157,158,159,161,162,163,164,166,167,168,169,171,172,173,174,
     175,177,178,179,180,181,182,184,185,186,187,188,189,190,192,193,
     194,195,196,197,198,199,200,201,202,204,205,206,207,208,209,210,
     211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,
     227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,
     243,244,245,246,247,248,249,250,251,252,253,254,255,255,255,255,
     255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,
     255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,
     255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,
     255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,
     255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,
     255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255},
    /* gamma 4 */
    {16,31,45,56,65,73,81,88,95,101,107,112,117,122,127,131,
     135,139,143,147,150,154,157,160,163,166,169,172,175,177,180,182,
     185,187,190,192,194,196,199,201,203,205,207,209,211,213,215,217,
     219,221,222,224,226,228,229,231,233,234,236,238,239,241,242,244,
     245,247,248,250,251,252,254,255,255,255,255,255,255,255,255,255,
     255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,
     255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,
     255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,
     255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,
     255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,
     255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,
     255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,
     255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,
     255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,
     255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,
     255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255}
};

/* ═══════════════════════════════════════════════════════════════
 * I_InitGraphics
 * Called once at startup to initialise the display subsystem.
 * ═══════════════════════════════════════════════════════════════ */
void I_InitGraphics(void)
{
    /* Allocate DOOM's 8-bit pixel buffer (screens[0]) */
    screens[0] = (unsigned char *) malloc(FB_PIXELS);
    if (!screens[0]) I_Error("I_InitGraphics: Could not allocate screen buffer");

    memset(screens[0],  0, FB_PIXELS);
    memset(rgbaBuffer,  0, FB_RGBA_BYTES);
    memset(currentPalette, 0, sizeof(currentPalette));

    js_print_string("I_InitGraphics: 320x200 framebuffer ready");
}

/* ═══════════════════════════════════════════════════════════════
 * I_ShutdownGraphics
 * ═══════════════════════════════════════════════════════════════ */
void I_ShutdownGraphics(void)
{
    if (screens[0]) {
        free(screens[0]);
        screens[0] = NULL;
    }
}

/* ═══════════════════════════════════════════════════════════════
 * I_SetPalette
 * Receive the 768-byte (256×RGB) palette from DOOM's WAD lump.
 * We store it and apply it in I_FinishUpdate.
 *
 * The raw palette values are 0–255 per channel.
 * We apply the current gamma correction table before storing.
 * ═══════════════════════════════════════════════════════════════ */
void I_SetPalette(byte* palette)
{
    int i;
    const unsigned char* gamma = gammatable[usegamma];

    for (i = 0; i < 256; i++) {
        currentPalette[i * 3 + 0] = gamma[palette[i * 3 + 0]];  /* R */
        currentPalette[i * 3 + 1] = gamma[palette[i * 3 + 1]];  /* G */
        currentPalette[i * 3 + 2] = gamma[palette[i * 3 + 2]];  /* B */
    }
}

/* ═══════════════════════════════════════════════════════════════
 * I_FinishUpdate
 * Called by DOOM after rendering a complete frame (D_Display).
 *
 * Steps:
 *   1. Palette-expand screens[0] (8-bit) → rgbaBuffer (32-bit RGBA)
 *   2. Call js_draw_screen() so JS blits rgbaBuffer to the canvas.
 *
 * Performance note:
 *   The inner loop touches 64000 bytes + 256000 bytes per frame.
 *   At 35 Hz this is ~11 MB/s — negligible for modern CPUs.
 *   Using a lookup table instead of branching for cache efficiency.
 * ═══════════════════════════════════════════════════════════════ */
void I_FinishUpdate(void)
{
    unsigned int i;
    unsigned char palIdx;
    unsigned char* dst;
    const unsigned char* src = screens[0];

    /* Build pre-multiplied RGBA lookup cache for this frame */
    /* (We re-build only when palette changes, but simplicity wins) */

    for (i = 0; i < FB_PIXELS; i++) {
        palIdx = src[i];
        dst    = &rgbaBuffer[i * 4];
        dst[0] = currentPalette[palIdx * 3 + 0];   /* R */
        dst[1] = currentPalette[palIdx * 3 + 1];   /* G */
        dst[2] = currentPalette[palIdx * 3 + 2];   /* B */
        dst[3] = 255;                               /* A = opaque */
    }

    /* Hand the RGBA buffer to JavaScript */
    js_draw_screen(rgbaBuffer);
}

/* ═══════════════════════════════════════════════════════════════
 * I_UpdateNoBlit — called between frames; no-op for us
 * ═══════════════════════════════════════════════════════════════ */
void I_UpdateNoBlit(void)
{
    /* intentional no-op */
}

/* ═══════════════════════════════════════════════════════════════
 * I_ReadScreen — copy framebuffer into user buffer (for screenshots)
 * ═══════════════════════════════════════════════════════════════ */
void I_ReadScreen(byte* scr)
{
    memcpy(scr, screens[0], FB_PIXELS);
}

/* ═══════════════════════════════════════════════════════════════
 * I_StartFrame — called before rendering begins each frame
 * ═══════════════════════════════════════════════════════════════ */
void I_StartFrame(void)
{
    /* no-op: JS drives the timing via requestAnimationFrame */
}

/* ═══════════════════════════════════════════════════════════════
 * I_StartTic — called by D_DoomLoop before G_BuildTiccmd.
 * Input events are injected by JS via reportKeyDown/reportKeyUp,
 * so we don't need to poll anything here.
 * ═══════════════════════════════════════════════════════════════ */
void I_StartTic(void)
{
    /* Input is injected externally by JavaScript */
}

/* ═══════════════════════════════════════════════════════════════
 * I_WaitVBL — wait for vertical blank; no-op in browser
 * ═══════════════════════════════════════════════════════════════ */
void I_WaitVBL(int count)
{
    (void)count;
    /* Browser's event loop handles timing; no busy-wait needed */
}

void I_BeginRead(void) { }
void I_EndRead(void)   { }
