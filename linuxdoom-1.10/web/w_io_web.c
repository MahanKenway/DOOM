/*
 * w_io_web.c  —  Virtual filesystem shim for the web/WASM build
 * ═══════════════════════════════════════════════════════════════
 * STANDALONE_WASM=1 has no filesystem syscalls, so every disk-I/O
 * call site in DOOM's sources is redirected here (via patch_web.py)
 * to one of two virtual backends:
 *
 *   1. "WEBWAD"          — read-only, backed by the in-memory WAD
 *                          buffer injected from JS at startup.
 *
 *   2. "doomsavN.dsg"    — read/write, backed by the browser's
 *      (N = 0-5)           localStorage via js_storage_save() /
 *                          js_storage_load_length() /
 *                          js_storage_load_data(). This is DOOM's
 *                          real save-game format (P_Archive*), now
 *                          persisted across browser sessions.
 *
 * Everything else (default.cfg, screenshots, response files,
 * PWAD reload) still fails open() gracefully — DOOM's own call
 * sites already handle a -1/NULL return by skipping that feature.
 * ═══════════════════════════════════════════════════════════════
 */

#include <string.h>
#include <stdlib.h>

/* ── JS imports (localStorage bridge) ──────────────────────────── */
extern int  js_storage_load_length(const char* name);
extern void js_storage_load_data(const char* name, unsigned char* dest);
extern void js_storage_save(const char* name, const unsigned char* data, int len);

/* ── WAD virtual file (read-only) ──────────────────────────────── */
#define WEBWAD_FD 9000

static unsigned char* s_wadBuffer = 0;
static int            s_wadLength = 0;
static int            s_wadCursor = 0;

void W_Web_SetWadBuffer(unsigned char* buf, int len)
{
    s_wadBuffer = buf;
    s_wadLength = len;
    s_wadCursor = 0;
}

/* ── Content-based game-mode detection ─────────────────────────
 * Vanilla DOOM decided gamemode by checking which IWAD FILENAME
 * existed on disk (doom2.wad -> commercial, doomu.wad -> retail,
 * etc.) — meaningless in a browser, since we only ever receive
 * raw bytes with no reliable filename. Instead, scan the WAD's
 * own lump directory for known map-name lumps, matching the same
 * conventions vanilla WADs always follow:
 *
 *   "MAP01" present  -> commercial   (DOOM2, Plutonia, TNT, and any
 *                        vanilla-compatible DOOM2-based PWAD/TC)
 *   "E4M1"  present  -> retail       (Ultimate DOOM, 4 episodes)
 *   "E2M1"  present  -> registered   (registered DOOM, 3 episodes)
 *   "E1M1"  present  -> shareware    (shareware DOOM / Freedoom
 *                        Phase 1, 1 episode)
 *   none matched     -> shareware    (safe fallback; avoids crashes
 *                        on unrecognised/malformed WADs rather than
 *                        guessing wrong in a way that reads out of
 *                        bounds later)
 *
 * This lets the SAME engine build correctly run any vanilla-
 * compatible IWAD or total-conversion PWAD a user drags in, not
 * just the bundled Freedoom WAD.
 */
static int wad_has_lump(const char* name)
{
    unsigned int numLumps, infoTableOfs, i;
    if (!s_wadBuffer || s_wadLength < 12) return 0;

    numLumps     = s_wadBuffer[4]  | (s_wadBuffer[5]<<8)  | (s_wadBuffer[6]<<16)  | (s_wadBuffer[7]<<24);
    infoTableOfs = s_wadBuffer[8]  | (s_wadBuffer[9]<<8)  | (s_wadBuffer[10]<<16) | (s_wadBuffer[11]<<24);

    for (i = 0; i < numLumps; i++) {
        unsigned int entryOfs = infoTableOfs + i * 16;
        char lumpName[9];
        int j;
        if (entryOfs + 16 > (unsigned int)s_wadLength) break;

        for (j = 0; j < 8; j++) lumpName[j] = s_wadBuffer[entryOfs + 8 + j];
        lumpName[8] = 0;

        if (strncmp(lumpName, name, 8) == 0) return 1;
    }
    return 0;
}

/* Returns a GameMode_t value (see doomdef.h): 0=shareware,
 * 1=registered, 2=commercial, 3=retail — kept as plain int here to
 * avoid pulling in doomdef.h's full dependency chain into this
 * small, focused file; the patched IdentifyVersion() casts it. */
int W_Web_DetectGameMode(void)
{
    if (wad_has_lump("MAP01")) return 2; /* commercial */
    if (wad_has_lump("E4M1"))  return 3; /* retail     */
    if (wad_has_lump("E2M1"))  return 1; /* registered */
    return 0;                             /* shareware (also the safe fallback) */
}

/* ── Savegame virtual files (read/write, localStorage-backed) ──── */
#define SAVE_FD_BASE   9100
#define MAX_SAVE_SLOTS 6      /* doomsav0.dsg .. doomsav5.dsg */
#define SAVE_GROW_CHUNK 65536

typedef struct {
    int    active;
    int    writing;      /* 1 = write mode (buffer grows), 0 = read mode */
    char   name[32];      /* "doomsav0.dsg" etc, for close-time save */
    unsigned char* buf;
    int    len;            /* bytes currently valid */
    int    cap;            /* allocated capacity (write mode only) */
    int    cursor;
} save_slot_t;

static save_slot_t s_saveSlots[MAX_SAVE_SLOTS];

static int is_savegame_name(const char* path)
{
    /* Matches "doomsav0.dsg" through "doomsav5.dsg" (DOOM's own
     * SAVEGAMENAME "doomsav" + slot digit + ".dsg", see g_game.c) */
    size_t len;
    if (!path) return 0;
    len = strlen(path);
    if (len < 9 || len > 20) return 0;
    return (strncmp(path, "doomsav", 7) == 0 &&
            strcmp(path + len - 4, ".dsg") == 0);
}

static int find_free_slot(void)
{
    int i;
    for (i = 0; i < MAX_SAVE_SLOTS; i++)
        if (!s_saveSlots[i].active) return i;
    return -1;
}

/* ── open() replacement ──────────────────────────────────────── */
int web_open(const char* path, int flags, ...)
{
    int writing = (flags & 3) != 0;   /* O_WRONLY=1 or O_RDWR=2 -> writing */

    if (path && strcmp(path, "WEBWAD") == 0) {
        s_wadCursor = 0;
        return WEBWAD_FD;
    }

    if (is_savegame_name(path)) {
        int slot = find_free_slot();
        if (slot < 0) return -1;

        save_slot_t* s = &s_saveSlots[slot];
        memset(s, 0, sizeof(*s));
        strncpy(s->name, path, sizeof(s->name) - 1);
        s->active = 1;
        s->writing = writing;

        if (writing) {
            /* Fresh growable buffer for this write session */
            s->cap = SAVE_GROW_CHUNK;
            s->buf = (unsigned char*) malloc(s->cap);
            s->len = 0;
        } else {
            /* Load existing save from localStorage, if any */
            int storedLen = js_storage_load_length(path);
            if (storedLen < 0) { s->active = 0; return -1; }   /* no such save */
            s->buf = (unsigned char*) malloc(storedLen > 0 ? storedLen : 1);
            js_storage_load_data(path, s->buf);
            s->len = storedLen;
        }
        s->cursor = 0;
        return SAVE_FD_BASE + slot;
    }

    return -1;   /* everything else: config, screenshots, etc. */
}

/* ── read() replacement ──────────────────────────────────────── */
int web_read(int fd, void* buf, unsigned int count)
{
    if (fd == WEBWAD_FD) {
        int avail = s_wadLength - s_wadCursor;
        int toCopy;
        if (!s_wadBuffer || avail <= 0) return 0;
        toCopy = ((int)count < avail) ? (int)count : avail;
        memcpy(buf, s_wadBuffer + s_wadCursor, toCopy);
        s_wadCursor += toCopy;
        return toCopy;
    }

    if (fd >= SAVE_FD_BASE && fd < SAVE_FD_BASE + MAX_SAVE_SLOTS) {
        save_slot_t* s = &s_saveSlots[fd - SAVE_FD_BASE];
        int avail, toCopy;
        if (!s->active || !s->buf) return -1;
        avail = s->len - s->cursor;
        if (avail <= 0) return 0;
        toCopy = ((int)count < avail) ? (int)count : avail;
        memcpy(buf, s->buf + s->cursor, toCopy);
        s->cursor += toCopy;
        return toCopy;
    }

    return -1;
}

/* ── write() replacement ─────────────────────────────────────── */
int web_write(int fd, const void* buf, unsigned int count)
{
    if (fd >= SAVE_FD_BASE && fd < SAVE_FD_BASE + MAX_SAVE_SLOTS) {
        save_slot_t* s = &s_saveSlots[fd - SAVE_FD_BASE];
        if (!s->active || !s->writing) return -1;

        /* Grow the buffer if this write would overflow it */
        while (s->len + (int)count > s->cap) {
            int newCap = s->cap * 2;
            unsigned char* nb = (unsigned char*) realloc(s->buf, newCap);
            if (!nb) return -1;
            s->buf = nb;
            s->cap = newCap;
        }
        memcpy(s->buf + s->len, buf, count);
        s->len += (int)count;
        return (int)count;
    }
    return -1;
}

/* ── lseek() replacement ─────────────────────────────────────── */
int web_lseek(int fd, int offset, int whence)
{
    if (fd == WEBWAD_FD) {
        if (whence == 0)       s_wadCursor = offset;
        else if (whence == 1)  s_wadCursor += offset;
        else if (whence == 2)  s_wadCursor = s_wadLength + offset;
        return s_wadCursor;
    }
    if (fd >= SAVE_FD_BASE && fd < SAVE_FD_BASE + MAX_SAVE_SLOTS) {
        save_slot_t* s = &s_saveSlots[fd - SAVE_FD_BASE];
        if (!s->active) return -1;
        if (whence == 0)       s->cursor = offset;
        else if (whence == 1)  s->cursor += offset;
        else if (whence == 2)  s->cursor = s->len + offset;
        return s->cursor;
    }
    return -1;
}

/* ── close() replacement ─────────────────────────────────────── */
int web_close(int fd)
{
    if (fd >= SAVE_FD_BASE && fd < SAVE_FD_BASE + MAX_SAVE_SLOTS) {
        save_slot_t* s = &s_saveSlots[fd - SAVE_FD_BASE];
        if (s->active) {
            if (s->writing && s->buf) {
                /* Flush to localStorage on close */
                js_storage_save(s->name, s->buf, s->len);
            }
            free(s->buf);
            memset(s, 0, sizeof(*s));
        }
        return 0;
    }
    return 0;
}

/* ── access() replacement ────────────────────────────────────── */
int web_access(const char* path, int mode)
{
    (void)mode;
    if (path && strcmp(path, "WEBWAD") == 0) return 0;
    if (is_savegame_name(path)) return (js_storage_load_length(path) >= 0) ? 0 : -1;
    return -1;
}

/* ── fstat() replacement ─────────────────────────────────────── */
int web_fstat(int fd, void* statbuf)
{
    (void)fd; (void)statbuf;
    return -1;
}

/* ── stdio (FILE*) family — config files, response files, debug
 *    logs. None of these have a real backing store (v1); all fail
 *    gracefully. DOOM's own call sites already check `if (!f)` /
 *    `if (f)` before using the result. ─────────────────────────── */
void* web_fopen(const char* path, const char* mode)
{
    (void)path; (void)mode;
    return (void*)0;
}

int web_fclose(void* f) { (void)f; return 0; }

int web_fread(void* ptr, int size, int n, void* f)
{
    (void)ptr; (void)size; (void)n; (void)f;
    return 0;
}

int web_fwrite(const void* ptr, int size, int n, void* f)
{
    (void)ptr; (void)size; (void)n; (void)f;
    return 0;
}

int web_fseek(void* f, long offset, int whence)
{
    (void)f; (void)offset; (void)whence;
    return -1;
}

long web_ftell(void* f) { (void)f; return -1; }

/* ── mkdir() replacement ─────────────────────────────────────── */
int web_mkdir(const char* path, int mode)
{
    (void)path; (void)mode;
    return -1;
}
