/*
 * i_system_web.c  —  Web platform system layer (FIXED)
 */

#include <stdlib.h>
#include <stdio.h>
#include <stdarg.h>
#include <string.h>

#include "doomdef.h"
#include "i_sound.h"
#include "i_video.h"
#include "d_net.h"
#include "g_game.h"
#include "m_misc.h"
#include "i_system.h"

extern void js_fatal_error(const char* msg);
extern void js_print_string(const char* msg);
extern double js_get_time_ms(void);

#define HEAP_MB 16
static int mb_used = HEAP_MB;

int I_GetHeapSize(void)  { return mb_used * 1024 * 1024; }

byte* I_ZoneBase(int* size) {
    *size = mb_used * 1024 * 1024;
    return (byte*)malloc(*size);
}

int I_GetTime(void) {
    double ms = js_get_time_ms();
    return (int)(ms * TICRATE / 1000.0);
}

void I_Init(void) { I_InitSound(); }

void I_Error(char* error, ...) {
    char buf[1024];
    va_list argptr;
    va_start(argptr, error);
    vsnprintf(buf, sizeof(buf), error, argptr);
    va_end(argptr);
    js_fatal_error(buf);
    while(1) {}
}

void I_Quit(void) {
    D_QuitNetGame();
    I_ShutdownSound();
    I_ShutdownGraphics();
    js_fatal_error("DOOM quit");
    while(1) {}
}

void I_Tactile(int on, int off, int total) { (void)on; (void)off; (void)total; }

ticcmd_t  emptycmd;
ticcmd_t* I_BaseTiccmd(void) { return &emptycmd; }

byte* I_AllocLow(int length) {
    byte* mem = (byte*)malloc(length);
    memset(mem, 0, length);
    return mem;
}

void I_WaitVBL(int count) { (void)count; }
void I_BeginRead(void)    { }
void I_EndRead(void)      { }
