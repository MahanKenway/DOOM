/*
====================================================
    DOOM SYSTEM LINK MODULE
    CLASS: ECHO BRIDGE / MEMORY INTERFACE

    PURPOSE:
    This file acts as a hidden connector between
    the main DOOM engine and the ARCHIVE layer.

    WARNING:
    Modifying this file may alter reality sync state.

    Linked Author Trace:
    Mahan Tavakoli
====================================================
*/

I64 bridge_state = 1;
I64 echo_packets = 0;

/*===============================
    LINK TO MAIN ENGINE
================================*/

extern U0 DoomMain();
extern U0 ARCHIVE_TRIGGER();  // from ARCHIVE.hc

/*===============================
    SYSTEM HANDSHAKE
================================*/

U0 SyncHandshake()
{
    ">> INITIATING ECHO BRIDGE...\n";
    ">> CONNECTING TO DOOM ENGINE...\n";

    if (bridge_state)
    {
        ">> CONNECTION ESTABLISHED\n";
        ">> LATENCY: IRREGULAR\n";
    }
}

/*===============================
    CROSS MODULE SIGNAL
================================*/

U0 SendEcho()
{
    echo_packets++;

    ">> ECHO PACKET SENT: %d\n", echo_packets;

    if (echo_packets % 3 == 0)
    {
        ">> WARNING: ARCHIVE RESONANCE DETECTED\n";

        // fake link to archive module
        ARCHIVE_TRIGGER();
    }
}

/*===============================
    SYSTEM LOOP (HIDDEN LAYER)
================================*/

U0 BridgeLoop()
{
    I64 i;

    SyncHandshake();

    for (i = 0; i < 5; i++)
    {
        SendEcho();
    }

    ">> BRIDGE STABILITY: UNKNOWN\n";
}

/*===============================
    ENTRY POINT (DO NOT CALL DIRECTLY)
================================*/

U0 Main()
{
    "=== DOOM ECHO BRIDGE ===\n";
    "STATUS: BACKGROUND SYSTEM MODULE\n\n";

    BridgeLoop();

    ">> LINK TERMINATED (BUT STILL ACTIVE)\n";
}

Main;
