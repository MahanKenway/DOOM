/*
 * i_video_web.c  —  Web platform video backend (FIXED v3)
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

extern void js_draw_screen(unsigned char* rgbaPtr);
extern void js_print_string(const char* str);

#define FB_WIDTH    SCREENWIDTH
#define FB_HEIGHT   SCREENHEIGHT
#define FB_PIXELS   (FB_WIDTH * FB_HEIGHT)
#define FB_RGBA_BYTES (FB_PIXELS * 4)

static unsigned char currentPalette[256 * 3];
static unsigned char rgbaBuffer[FB_RGBA_BYTES];

/* NOTE: gammatable is declared extern in v_video.h and defined in v_video.c
   We use it directly — do NOT redefine it here. */

void I_InitGraphics(void)
{
    screens[0] = (unsigned char*)malloc(FB_PIXELS);
    if (!screens[0]) I_Error("I_InitGraphics: out of memory");
    memset(screens[0],   0, FB_PIXELS);
    memset(rgbaBuffer,   0, FB_RGBA_BYTES);
    memset(currentPalette, 0, sizeof(currentPalette));
    js_print_string("I_InitGraphics: 320x200 ready");
}

void I_ShutdownGraphics(void)
{
    if (screens[0]) { free(screens[0]); screens[0] = NULL; }
}

void I_SetPalette(byte* palette)
{
    int i;
    for (i = 0; i < 256; i++) {
        int gamma = usegamma < 0 ? 0 : (usegamma > 4 ? 4 : usegamma);
        currentPalette[i*3+0] = gammatable[gamma][palette[i*3+0]];
        currentPalette[i*3+1] = gammatable[gamma][palette[i*3+1]];
        currentPalette[i*3+2] = gammatable[gamma][palette[i*3+2]];
    }
}

void I_FinishUpdate(void)
{
    unsigned int i;
    unsigned char palIdx;
    unsigned char* dst;
    const unsigned char* src = screens[0];

    for (i = 0; i < FB_PIXELS; i++) {
        palIdx = src[i];
        dst    = &rgbaBuffer[i * 4];
        dst[0] = currentPalette[palIdx * 3 + 0];
        dst[1] = currentPalette[palIdx * 3 + 1];
        dst[2] = currentPalette[palIdx * 3 + 2];
        dst[3] = 255;
    }
    js_draw_screen(rgbaBuffer);
}

void I_UpdateNoBlit(void) { }
void I_ReadScreen(byte* scr) { memcpy(scr, screens[0], FB_PIXELS); }
void I_StartFrame(void) { }
void I_StartTic(void)   { }
void I_WaitVBL(int count) { (void)count; }
void I_BeginRead(void)  { }
void I_EndRead(void)    { }
