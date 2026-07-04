/*
 * i_main_web.c  —  WASM-exported entry points
 * ═══════════════════════════════════════════════════════════════
 * Exports the four functions JavaScript calls:
 *
 *   initGame()                    one-time startup
 *   tickGame()                    one DOOM logic tick (~28.5 ms)
 *   reportKeyDown(int doomKey)    inject a key press
 *   reportKeyUp(int doomKey)      inject a key release
 *
 * initGame() first pulls the WAD bytes from JavaScript
 * (js_get_wad_data_length / js_get_wad_data) into a malloc'd
 * buffer, hands it to w_io_web.c's virtual filesystem, THEN
 * calls D_DoomMain() — which will call IdentifyVersion() (patched
 * to hardcode D_AddFile("WEBWAD")) and W_InitMultipleFiles(),
 * which opens "WEBWAD" via web_open() and reads it straight out
 * of that buffer. No real filesystem is ever touched.
 * ═══════════════════════════════════════════════════════════════
 */

#include <stdlib.h>
#include <string.h>
#include <stdio.h>

#include "doomdef.h"
#include "doomstat.h"
#include "d_main.h"
#include "d_event.h"
#include "d_net.h"
#include "g_game.h"
#include "m_argv.h"
#include "i_system.h"
#include "i_video.h"
#include "web/w_io_web.h"

/* D_Display is defined in d_main.c but not declared in any header */
extern void D_Display(void);

/* JS imports */
extern void js_print_string(const char* msg);
extern int  js_get_wad_data_length(void);
extern void js_get_wad_data(unsigned char* ptr);

static const char* doom_argv[] = { "doom" };
static int         doom_argc   = 1;

/* ═══════════════════════════════════════════════════════════════
 * initGame()
 * Called once from JavaScript after WASM instantiation.
 * ═══════════════════════════════════════════════════════════════ */
void initGame(void)
{
    int wadLen;
    unsigned char* wadBuf;

    /* Disable stdout buffering so every printf() flushes immediately
     * via fd_write. Without this, a WASM trap (divide-by-zero, OOB
     * memory access, etc.) halts execution instantly with no chance
     * to flush a partially-filled stdio buffer — losing every DOOM
     * boot-sequence printf that hadn't yet been force-flushed. This
     * is essential for debugging crashes; the tiny per-call overhead
     * is irrelevant next to WASM instantiation cost. */
    setvbuf(stdout, NULL, _IONBF, 0);

    js_print_string("initGame: fetching WAD from JS...");

    wadLen = js_get_wad_data_length();
    if (wadLen <= 0) {
        js_print_string("initGame: FATAL - WAD length is 0!");
        return;
    }

    wadBuf = (unsigned char*) malloc(wadLen);
    if (!wadBuf) {
        js_print_string("initGame: FATAL - could not allocate WAD buffer!");
        return;
    }

    js_get_wad_data(wadBuf);
    W_Web_SetWadBuffer(wadBuf, wadLen);

    js_print_string("initGame: WAD buffer ready, starting D_DoomMain...");

    myargc = doom_argc;
    myargv = (char**)doom_argv;

    D_DoomMain();

    js_print_string("initGame: D_DoomMain returned (entering tick loop)");
}

/* ═══════════════════════════════════════════════════════════════
 * tickGame()
 * Called from JavaScript's fixed-step accumulator at 35 Hz.
 * Replicates one iteration of DOOM's original D_DoomLoop body.
 * ═══════════════════════════════════════════════════════════════ */
void tickGame(void)
{
    I_StartTic();       /* input polling — no-op for web */
    TryRunTics();       /* advance simulation */
    D_Display();        /* render frame, calls I_FinishUpdate */
    I_UpdateNoBlit();   /* no-op */
}

/* ═══════════════════════════════════════════════════════════════
 * reportKeyDown / reportKeyUp
 * Called from JavaScript's InputHandler with DOOM key codes.
 * ═══════════════════════════════════════════════════════════════ */
void reportKeyDown(int doomKey)
{
    event_t ev;
    ev.type = ev_keydown;
    ev.data1 = doomKey;
    D_PostEvent(&ev);
}

void reportKeyUp(int doomKey)
{
    event_t ev;
    ev.type = ev_keyup;
    ev.data1 = doomKey;
    D_PostEvent(&ev);
}
