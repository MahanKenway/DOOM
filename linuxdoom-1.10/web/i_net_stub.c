/*
 * i_net_stub.c  —  Network stub for single-player browser DOOM
 * ═══════════════════════════════════════════════════════════════
 * DOOM's network code (d_net.c) requires I_net functions.
 * For browser single-player we stub them all out.
 * Multi-player could later be added via WebRTC DataChannels.
 * ═══════════════════════════════════════════════════════════════
 */

#include "doomdef.h"
#include "d_net.h"
#include "i_system.h"

/* Called by D_CheckNetGame — set up single-player */
void I_InitNetwork(void)
{
    doomcom = (doomcom_t *)malloc(sizeof(*doomcom));
    memset(doomcom, 0, sizeof(*doomcom));

    /* Single player: 1 player, node 0 = console */
    doomcom->id         = DOOMCOM_ID;
    doomcom->numplayers = 1;
    doomcom->numNodes   = 1;
    doomcom->consoleplayer = 0;
    doomcom->deathmatch = 0;
}

void I_NetCmd(void)
{
    /* no-op: no actual network packets */
}
