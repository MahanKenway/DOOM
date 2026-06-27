/*
 * i_main_web.c  —  WASM-exported entry points (FIXED)
 */

#include <stdlib.h>
#include <string.h>

#include "doomdef.h"
#include "doomstat.h"
#include "d_main.h"
#include "d_event.h"
#include "d_net.h"
#include "g_game.h"
#include "m_argv.h"
#include "i_system.h"
#include "i_video.h"

/* D_Display is in d_main.c but not in any header — forward declare */
extern void D_Display(void);

/* JS import */
extern void js_print_string(const char* msg);

static const char* doom_argv[] = { "doom" };
static int         doom_argc   = 1;

void initGame(void)
{
    js_print_string("initGame: Starting D_DoomMain...");
    myargc = doom_argc;
    myargv = (char**)doom_argv;
    D_DoomMain();
}

void tickGame(void)
{
    I_StartTic();
    TryRunTics();
    D_Display();
    I_UpdateNoBlit();
}

void reportKeyDown(int doomKey)
{
    event_t ev;
    ev.type  = ev_keydown;
    ev.data1 = doomKey;
    D_PostEvent(&ev);
}

void reportKeyUp(int doomKey)
{
    event_t ev;
    ev.type  = ev_keyup;
    ev.data1 = doomKey;
    D_PostEvent(&ev);
}
