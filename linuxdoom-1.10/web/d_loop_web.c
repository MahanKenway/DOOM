/*
 * d_loop_web.c  —  Replace D_DoomLoop with web-compatible version
 *
 * Original D_DoomLoop is an infinite while(1) that blocks the browser.
 * We replace it with a stub that:
 *   1. Calls I_InitGraphics() (as the original does)
 *   2. Returns immediately
 *
 * JS then drives the loop via tickGame() at 35 Hz using rAF accumulator.
 *
 * IMPORTANT: To avoid linker duplicate symbol error, the workflow
 * excludes d_main.c's D_DoomLoop by using a linker flag or by
 * compiling this file AFTER d_main.c and using --allow-multiple-definition.
 */

#include "doomdef.h"
#include "i_video.h"
#include "m_argv.h"
#include "g_game.h"

extern boolean demorecording;
extern void G_BeginRecording(void);

/*
 * D_DoomLoop — web override
 * Called by D_DoomMain() at the end of startup.
 * In the browser we just initialise graphics and return;
 * JavaScript drives the game loop from outside.
 */
void D_DoomLoop(void)
{
    if (demorecording)
        G_BeginRecording();

    /* This is normally called inside D_DoomLoop in the original */
    I_InitGraphics();

    /* Return immediately — JS calls tickGame() at 35 Hz */
}
