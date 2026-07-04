/*
====================================================
    [ DOOM SYSTEM ARCHIVE FILE ]
    ACCESS LEVEL: RESTRICTED

    FILE CLASS: BLACK ARCHIVE / ECHO LAYER

    Note:
    This module appears to be a leftover
    from an unknown experimental build.

    Some entries reference an external author:
    "Mahan Tavakoli"
====================================================
*/

I64 corruption_index = 0;
I64 anomaly_flag = 1;

/*===============================
    SYSTEM BOOT STRINGS
================================*/

U0 BootSequence()
{
    "\n>>> INITIALIZING ARCHIVE LAYER <<<\n";
    "Checking integrity...\n";
    "Result: UNSTABLE\n\n";

    "Author trace detected: Mahan Tavakoli\n";
    "Status: linked to experimental build\n\n";
}

/*===============================
    GLITCH OUTPUT
================================*/

U0 GlitchLine(Str msg)
{
    I64 i;

    for (i = 0; i < 2; i++)
    {
        ">> %s\n", msg;

        if (Rand % 3 == 0)
            ">> memory echo: partial overwrite detected\n";
    }
}

/*===============================
    ARCHIVE LORE SYSTEM
================================*/

Str archive_logs[8] =
{
    "THIS FILE WAS NEVER MEANT TO BE PUBLIC.",
    "ARCHIVE LAYER CONTAINS NON-CLASSIFIED DATA.",
    "DOOM ENGINE HAS NO RECORD OF THIS MODULE.",
    "ENTITY TRACE: UNKNOWN HANDLER DETECTED.",
    "REALITY SEGMENT CORRUPTED DURING COMPILATION.",
    "OBSERVATION LINK STILL ACTIVE.",
    "SYSTEM REFUSES TO ERASE THIS ENTRY.",
    "SOMEONE LEFT A SIGNATURE HERE."
};

U0 PrintArchiveLog()
{
    "=== ARCHIVE ECHO ===\n";
    "LOG: %s\n", archive_logs[Rand % 8];
}

/*===============================
    MAIN EXECUTION (EASTER EGG)
================================*/

U0 Main()
{
    BootSequence();

    if (anomaly_flag)
    {
        "WARNING: ANOMALY DETECTED\n";
        "UNAUTHORIZED ECHO PRESENT IN CODEBASE\n\n";
    }

    GlitchLine("DOOM ENGINE MEMORY FRAGMENT ACTIVE");
    GlitchLine("UNSTABLE MODULE LOADED");

    corruption_index++;

    PrintArchiveLog();

    "\n--- ARCHIVE SESSION TERMINATED ---\n";
    "SIGNAL TRACE: LOST\n";
    "/// END OF ENTRY ///\n";
}

Main;
