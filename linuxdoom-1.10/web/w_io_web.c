/*
 * w_io_web.c  —  Virtual filesystem shim for the web/WASM build
 * ═══════════════════════════════════════════════════════════════
 * STANDALONE_WASM=1 output has NO filesystem syscalls available
 * (no MEMFS, no NODERAWFS). Any reference to open()/read()/lseek()/
 * close()/access()/fstat()/write() in the linked binary requires
 * Emscripten to import __syscall_* functions that simply don't
 * exist in our minimal JS host — causing:
 *
 *   "Import #N 'env' '__syscall_faccessat': function import
 *    requires a callable"
 *
 * Fix: replace every disk-I/O call site in the DOOM sources with
 * these web_* equivalents (done by patch_web.py). There is exactly
 * ONE "file" in this universe: the in-memory WAD buffer injected
 * from JavaScript via js_get_wad_data() before D_DoomMain() runs.
 * It is addressed by the sentinel filename "WEBWAD" (chosen to end
 * in "wad" so w_wad.c's strcmpi(...,"wad") extension check routes
 * it through the proper multi-lump WAD parser, not the single-lump
 * path).
 *
 * Anything else (savegames, screenshots, default.cfg, PWAD reload)
 * fails open() gracefully — DOOM's own call sites already handle
 * a -1 return by skipping/disabling that feature, so this never
 * crashes; saving/loading and screenshots are simply unavailable
 * in this first web build.
 * ═══════════════════════════════════════════════════════════════
 */

#include <string.h>

/* Sentinel virtual file descriptor for the WAD buffer. Arbitrary
 * but distinct from any real fd id (0/1/2 are stdio). */
#define WEBWAD_FD 9000

static unsigned char* s_wadBuffer = 0;
static int            s_wadLength = 0;
static int            s_wadCursor = 0;

/*
 * Called once from i_main_web.c's initGame(), BEFORE D_DoomMain()
 * runs, after js_get_wad_data() has copied the WAD bytes into
 * WASM linear memory.
 */
void W_Web_SetWadBuffer(unsigned char* buf, int len)
{
    s_wadBuffer = buf;
    s_wadLength = len;
    s_wadCursor = 0;
}

/* ── open() replacement ──────────────────────────────────────── */
int web_open(const char* path, int flags, ...)
{
    (void)flags;
    if (path && strcmp(path, "WEBWAD") == 0) {
        s_wadCursor = 0;
        return WEBWAD_FD;
    }
    return -1;   /* everything else: savegames, default.cfg, etc. */
}

/* ── read() replacement ──────────────────────────────────────── */
int web_read(int fd, void* buf, unsigned int count)
{
    int avail, toCopy;
    if (fd != WEBWAD_FD || !s_wadBuffer) return -1;
    avail = s_wadLength - s_wadCursor;
    if (avail <= 0) return 0;
    toCopy = ((int)count < avail) ? (int)count : avail;
    memcpy(buf, s_wadBuffer + s_wadCursor, toCopy);
    s_wadCursor += toCopy;
    return toCopy;
}

/* ── write() replacement (savegames/screenshots — unsupported) ── */
int web_write(int fd, const void* buf, unsigned int count)
{
    (void)fd; (void)buf; (void)count;
    return -1;
}

/* ── lseek() replacement ─────────────────────────────────────── */
int web_lseek(int fd, int offset, int whence)
{
    if (fd != WEBWAD_FD) return -1;
    if (whence == 0)       s_wadCursor = offset;               /* SEEK_SET */
    else if (whence == 1)  s_wadCursor += offset;               /* SEEK_CUR */
    else if (whence == 2)  s_wadCursor = s_wadLength + offset;  /* SEEK_END */
    return s_wadCursor;
}

/* ── close() replacement ─────────────────────────────────────── */
int web_close(int fd)
{
    (void)fd;
    return 0;
}

/* ── access() replacement ────────────────────────────────────── */
int web_access(const char* path, int mode)
{
    (void)mode;
    return (path && strcmp(path, "WEBWAD") == 0) ? 0 : -1;
}

/* ── fstat() replacement ─────────────────────────────────────── */
/* Only reachable from w_wad.c's filelength() in the single-lump
 * file branch, which our "WEBWAD" sentinel never takes (it always
 * matches the multi-lump WAD branch). Kept only so the symbol
 * resolves; should never actually run. */
int web_fstat(int fd, void* statbuf)
{
    (void)fd; (void)statbuf;
    return -1;
}

/* ── stdio (FILE*) family — config files, savegames, response
 *    files, debug logs. None of these have a real backing store
 *    in the browser (v1); all fail gracefully. DOOM's own call
 *    sites already check `if (!f)` / `if (f)` before using the
 *    result, so returning NULL here just means "config didn't
 *    load, use hardcoded defaults" / "couldn't save, skip it" —
 *    never a crash. ─────────────────────────────────────────── */
void* web_fopen(const char* path, const char* mode)
{
    (void)path; (void)mode;
    return (void*)0;
}

int web_fclose(void* f)
{
    (void)f;
    return 0;
}

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

long web_ftell(void* f)
{
    (void)f;
    return -1;
}

/* ── mkdir() replacement (only used for the Windows "-cdrom"
 *    path, never exercised in the web build) ───────────────── */
int web_mkdir(const char* path, int mode)
{
    (void)path; (void)mode;
    return -1;
}

