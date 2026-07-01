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
 * DOOM Key Event System:
 *
 *   DOOM's event queue (D_PostEvent / D_ProcessEvents) uses
 *   event_t structs with type ev_keydown / ev_keyup.
 *   We synthesise these from JS key codes in InputHandler.js,
 *   map them to DOOM key codes, then call reportKeyDown/Up.
 *
 *   Here in C we post them into DOOM's event queue (D_PostEvent)
 *   which G_Responder processes on the next tick.
 *
 * Tick loop design:
 *
 *   JS calls tickGame() from a requestAnimationFrame accumulator
 *   at exactly 35 Hz. This matches DOOM's original fixed-step
 *   simulation rate (TICRATE = 35).
 *
 *   tickGame() calls:
 *     I_StartTic()       → process OS events (no-op for us)
 *     G_BuildTiccmd()    → read input state → build ticcmd
 *     G_Ticker()         → advance game simulation one step
 *     D_Display()        → render frame → calls I_FinishUpdate
 *                          which blits via js_draw_screen
 *
 * Memory layout assumptions (Emscripten):
 *   WASM linear memory starts at 0.
 *   C pointers = indices into this memory.
 *   JS accesses WASM memory via WebAssembly.Memory.buffer.
 * ═══════════════════════════════════════════════════════════════
 */

#include <stdlib.h>
#include <string.h>

#include "doomdef.h"
#include "doomstat.h"
#include "d_main.h"
#include "d_event.h"
#include "g_game.h"
#include "m_argv.h"

/* ── JS import for initial print ────────────────────────────── */
extern void js_print_string(const char* msg);

/* ── Emscripten export annotation ───────────────────────────── */
/* The build script passes:
 *   -s EXPORTED_FUNCTIONS='["_initGame","_tickGame",
 *                           "_reportKeyDown","_reportKeyUp"]'
 * The leading underscore is Emscripten's C-name mangling convention.
 */

/* ── Fake argv for D_DoomMain ────────────────────────────────── */
static const char* doom_argv[] = {
    "doom",
    /* Add command-line options here if needed, e.g. "-skill 3" */
    /* "-warp", "1", "1",   ← uncomment to start on E1M1 directly */
};
static int doom_argc = 1;

/* ═══════════════════════════════════════════════════════════════
 * initGame()
 * Called once from JavaScript after WASM instantiation.
 * Runs DOOM's entire startup sequence.
 * ═══════════════════════════════════════════════════════════════ */
void initGame(void)
{
    js_print_string("initGame: Starting D_DoomMain...");

    myargc = doom_argc;
    myargv = (char**)doom_argv;

    D_DoomMain();

    js_print_string("initGame: D_DoomMain returned (entering loop)");
}

/* ═══════════════════════════════════════════════════════════════
 * tickGame()
 * Called from JavaScript's fixed-step accumulator at 35 Hz.
 *
 * DOOM's original D_DoomLoop() is an infinite while(1) that
 * we can't use in a browser (it would block the JS thread).
 *
 * Instead we expose this single-step version that does exactly
 * what one iteration of D_DoomLoop does.
 *
 * Note: D_DoomMain() must have been called first (initGame).
 * ═══════════════════════════════════════════════════════════════ */
void tickGame(void)
{
    /* D_DoomLoop body — one iteration:
     *   I_StartTic()    → poll OS input events (no-op for us)
     *   TryRunTics()    → call G_Ticker once or more for catch-up
     *   D_Display()     → render + HUD + I_FinishUpdate (blit)
     *   I_UpdateNoBlit  → (no-op)
     */

    /* Note: D_DoomLoop is not exposed as a single-step function
     * in the original source.  Emscripten's approach is to use
     * emscripten_set_main_loop(), but we prefer the JS-driven
     * approach for tighter integration.
     *
     * We replicate the loop body by calling these functions directly.
     */
    I_StartTic();       /* input polling — no-op for web */
    TryRunTics();       /* advance simulation */
    D_Display();        /* render frame, calls I_FinishUpdate */
    I_UpdateNoBlit();   /* no-op */
}

/* ═══════════════════════════════════════════════════════════════
 * reportKeyDown / reportKeyUp
 * Called from JavaScript's InputHandler with DOOM key codes.
 *
 * We synthesise a DOOM event_t and post it to the queue.
 * DOOM's D_ProcessEvents() → G_Responder() handles it
 * on the next call to TryRunTics().
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
