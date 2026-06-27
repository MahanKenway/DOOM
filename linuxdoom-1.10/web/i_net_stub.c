/*
 * i_net_stub.c  —  Network stub (FIXED)
 */

#include <stdlib.h>
#include <string.h>

#include "doomdef.h"
#include "d_net.h"
#include "i_system.h"

/* doomcom is declared extern in d_net.h */
extern doomcom_t* doomcom;

void I_InitNetwork(void)
{
    doomcom = (doomcom_t*)malloc(sizeof(doomcom_t));
    memset(doomcom, 0, sizeof(doomcom_t));
    doomcom->id             = DOOMCOM_ID;
    doomcom->numplayers     = 1;
    doomcom->numnodes       = 1;
    doomcom->consoleplayer  = 0;
    doomcom->deathmatch     = 0;
}

void I_NetCmd(void) { }
