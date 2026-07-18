/*
 * w_io_web.h  —  Prototypes for the web build's virtual filesystem
 * ═══════════════════════════════════════════════════════════════
 * Emscripten's clang enforces -Werror=implicit-function-declaration
 * unconditionally (this is baked into emcc's driver and cannot be
 * suppressed with -w). Every translation unit that calls a web_*
 * function must have a visible prototype for it, or the build
 * fails with "ISO C99 and later do not support implicit function
 * declarations" — even though the symbol resolves fine at link
 * time. Included by patch_web.py into d_main.c, w_wad.c, m_misc.c,
 * m_menu.c, and d_net.c.
 * ═══════════════════════════════════════════════════════════════
 */

#ifndef W_IO_WEB_H
#define W_IO_WEB_H

/* Populates one of up to 4 virtual "WEBWAD<N>" buffers (index 0-3).
 * Called once per loaded WAD file from i_main_web.c's initGame(),
 * in order (index 0 = primary IWAD, 1-3 = additional PWADs layered
 * on top), before D_DoomMain() runs. */
void W_Web_SetWadBuffer(int index, unsigned char* buf, int len);

/* How many WAD files were actually loaded (1-4). */
int W_Web_GetWadCount(void);

/* Detects gamemode (shareware/registered/commercial/retail) by
 * scanning the PRIMARY WAD's (index 0) own lump directory for known
 * map names — works for ANY vanilla-compatible IWAD, not just the
 * bundled one.
 * Returns: 0=shareware, 1=registered, 2=commercial, 3=retail. */
int W_Web_DetectGameMode(void);

/* POSIX-style raw I/O, redirected to the in-memory WAD buffer. */
int  web_open   (const char* path, int flags, ...);
int  web_read   (int fd, void* buf, unsigned int count);
int  web_write  (int fd, const void* buf, unsigned int count);
int  web_lseek  (int fd, int offset, int whence);
int  web_close  (int fd);
int  web_access (const char* path, int mode);
int  web_fstat  (int fd, void* statbuf);

/* stdio (FILE*) family — config/savegame/response files. Always
 * fail gracefully (no real backing store in this v1). */
void* web_fopen (const char* path, const char* mode);
int   web_fclose(void* f);
int   web_fread (void* ptr, int size, int n, void* f);
int   web_fwrite(const void* ptr, int size, int n, void* f);
int   web_fseek (void* f, long offset, int whence);
long  web_ftell (void* f);

/* mkdir() — only used on the Windows "-cdrom" path, never
 * exercised in the web build. */
int  web_mkdir  (const char* path, int mode);

#endif /* W_IO_WEB_H */
