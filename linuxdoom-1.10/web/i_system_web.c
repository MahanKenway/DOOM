/*
 * i_system_web.c  —  Web platform system abstraction
 * ═══════════════════════════════════════════════════════════════
 * Replaces the Unix/POSIX system calls in i_system.c with
 * browser-compatible equivalents using Emscripten/JS callbacks.
 *
 * Key differences from Unix backend:
 *
 *   I_GetTime()  — uses js_get_time_ms() (performance.now)
 *                  instead of gettimeofday()
 *
 *   I_Error()    — calls js_fatal_error() then loops forever
 *                  (can't call exit() in WASM event loop safely)
 *
 *   I_Quit()     — calls js_fatal_error("quit")
 *
 *   I_ZoneBase() — malloc-based; Emscripten has its own heap
 * ═══════════════════════════════════════════════════════════════
 */

#include <stdlib.h>
#include <stdio.h>
#include <stdarg.h>
#include <string.h>

#include "doomdef.h"
#include "m_misc.h"
#include "i_video.h"
#include "i_sound.h"
#include "d_net.h"
#include "g_game.h"
#include "i_system.h"

/* ── JS imports ─────────────────────────────────────────────── */
extern void js_fatal_error(const char* msg);
extern void js_print_string(const char* msg);
extern double js_get_time_ms(void);

/* ── Heap config ────────────────────────────────────────────── */
/* DOOM's zone memory manager gets this many megabytes */
#define HEAP_MB   16
static int mb_used = HEAP_MB;

/* ═══════════════════════════════════════════════════════════════
 * I_GetHeapSize / I_ZoneBase
 * DOOM's Z_Init calls these to set up its zone allocator.
 * ═══════════════════════════════════════════════════════════════ */
int I_GetHeapSize(void)
{
    return mb_used * 1024 * 1024;
}

byte* I_ZoneBase(int* size)
{
    *size = mb_used * 1024 * 1024;
    return (byte*)malloc(*size);
}

/* ═══════════════════════════════════════════════════════════════
 * I_GetTime
 * Returns time in 1/TICRATE (= 1/35) second tics.
 *
 * Formula: tics = ms * TICRATE / 1000
 *
 * DOOM's original used gettimeofday; we use JS performance.now()
 * via the js_get_time_ms import.
 * ═══════════════════════════════════════════════════════════════ */
int I_GetTime(void)
{
    double ms = js_get_time_ms();
    return (int)(ms * TICRATE / 1000.0);
}

/* ═══════════════════════════════════════════════════════════════
 * I_Init — initialise all I_ subsystems
 * ═══════════════════════════════════════════════════════════════ */
void I_Init(void)
{
    I_InitSound();
    /* I_InitGraphics() is called separately by D_DoomMain */
}

/* ═══════════════════════════════════════════════════════════════
 * I_Error
 * Print an error message and stop the engine.
 *
 * In native DOOM this calls exit(-1).
 * In WASM we can't call exit() safely while inside the JS event
 * loop, so we call js_fatal_error() which throws on the JS side,
 * then loop forever to prevent further WASM execution.
 * ═══════════════════════════════════════════════════════════════ */
void I_Error(char* error, ...)
{
    char   buf[1024];
    va_list argptr;

    va_start(argptr, error);
    vsnprintf(buf, sizeof(buf), error, argptr);
    va_end(argptr);

    js_fatal_error(buf);

    /* Prevent any further execution in WASM */
    while (1) {}
}

/* ═══════════════════════════════════════════════════════════════
 * I_Quit
 * ═══════════════════════════════════════════════════════════════ */
void I_Quit(void)
{
    D_QuitNetGame();
    I_ShutdownSound();
    I_ShutdownGraphics();
    js_fatal_error("DOOM quit cleanly");
    while (1) {}
}

/* ═══════════════════════════════════════════════════════════════
 * Other I_system stubs
 * ═══════════════════════════════════════════════════════════════ */
void I_Tactile(int on, int off, int total)
{
    (void)on; (void)off; (void)total;
}

ticcmd_t  emptycmd;
ticcmd_t* I_BaseTiccmd(void)
{
    return &emptycmd;
}

byte* I_AllocLow(int length)
{
    byte* mem = (byte*)malloc(length);
    memset(mem, 0, length);
    return mem;
}

void I_WaitVBL(int count) { (void)count; }
void I_BeginRead(void)    { }
void I_EndRead(void)      { }
