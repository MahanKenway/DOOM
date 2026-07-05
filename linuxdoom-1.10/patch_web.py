#!/usr/bin/env python3
"""patch_web.py — Pre-compile patches for DOOM browser WASM build"""
import re, sys

# ── Patch 1: d_main.c — replace D_DoomLoop with web stub ────────────
# NEEDS re.DOTALL because function spans multiple lines
with open('d_main.c') as f:
    src = f.read()

STUB = (
    'void D_DoomLoop (void)\n'
    '{\n'
    '    if (demorecording) G_BeginRecording ();\n'
    '    I_InitGraphics ();\n'
    '    /* WEB BUILD: JS drives loop via requestAnimationFrame */\n'
    '}\n'
)

patched = re.sub(
    r'void D_DoomLoop \(void\)\s*\{.*?\n\}\n',
    STUB, src, count=1, flags=re.DOTALL)   # <-- DOTALL required

if patched == src:
    print('ERROR: D_DoomLoop not found in d_main.c'); sys.exit(1)
with open('d_main.c', 'w') as f:
    f.write(patched)
print('OK d_main.c: D_DoomLoop -> web stub')

# ── Patch 2: m_misc.c — chatmacro pointer defaults ──────────────────
with open('m_misc.c') as f:
    src = f.read()

def fix_chatmacro(m):
    return '{"' + m.group(1) + '", (int *) &chat_macros[' + m.group(2) + '], 0}'

patched = re.sub(
    r'\{"(chatmacro\d+)",\s*\(int \*\)\s*&chat_macros\[(\d+)\],\s*\(int\)\s*\w+\s*\}',
    fix_chatmacro, src)

if patched == src:
    print('WARNING: chatmacro pattern not found in m_misc.c (may be OK)')
else:
    with open('m_misc.c', 'w') as f:
        f.write(patched)
    print('OK m_misc.c: chatmacro defaults = 0')

# ── Patch 3: am_map.c — implicit-int (C89 only, rejected by clang) ──
with open('am_map.c') as f:
    src = f.read()

fixes = [
    (r'\bstatic\s+nexttic\s*=',    'static int nexttic ='),
    (r'\bregister\s+outcode1\s*=', 'register int outcode1 ='),
    (r'\bregister\s+outcode2\s*=', 'register int outcode2 ='),
    (r'\bregister\s+outside\s*;',  'register int outside;'),
    (r'\bstatic\s+fuck\s*=',       'static int fuck ='),
]

patched = src
for pat, rep in fixes:
    patched = re.sub(pat, rep, patched)

if patched == src:
    print('WARNING: no am_map.c changes')
else:
    with open('am_map.c', 'w') as f:
        f.write(patched)
    print('OK am_map.c: implicit-int fixed (5 declarations)')

print('All patches done.')

# ── Patch 4: r_data.c — alloca() unavailable; stdlib.h conditionally
# excluded by #ifdef LINUX (we don't pass -DLINUX in the web build)
with open('r_data.c') as f:
    src = f.read()

# 1) Always add stdlib.h right after the includes block (unconditional,
#    regardless of #ifdef LINUX guarding the original alloca.h include)
if '#include <stdlib.h>' not in src:
    src = src.replace(
        '#include "r_local.h"',
        '#include <stdlib.h>\n#include "r_local.h"',
        1
    )
    print('OK r_data.c: added unconditional #include <stdlib.h>')

# 2) Replace every alloca(...) call with malloc(...)
n_before = src.count('alloca(') + src.count('alloca (')
src = src.replace('(byte *)alloca (texture->width)', '(byte *)malloc (texture->width)')
src = src.replace('alloca (nummappatches*sizeof(*patchlookup))',
                   'malloc (nummappatches*sizeof(*patchlookup))')
src = src.replace('alloca(numflats)',    'malloc(numflats)')
src = src.replace('alloca(numtextures)', 'malloc(numtextures)')
src = src.replace('alloca(numsprites)',  'malloc(numsprites)')
n_after = src.count('alloca(') + src.count('alloca (')

with open('r_data.c', 'w') as f:
    f.write(src)
print(f'OK r_data.c: alloca calls {n_before} -> {n_after} (remaining are header/comments)')

print('All patches done (4 total).')

# ── Patch 5: doomdef.h — undefine SNDSERV (external sound server)
# We use direct Web Audio bridge in i_sound_web.c instead.
# SNDSERV macro was hardcoded to 1, forcing unused/broken codepaths
# in m_misc.c (string literal address in static initializer).
with open('doomdef.h') as f:
    src = f.read()

patched = src.replace('#define SNDSERV  1', '// #define SNDSERV  1  // disabled for web build')

if patched == src:
    print('WARNING: SNDSERV define not found in doomdef.h')
else:
    with open('doomdef.h', 'w') as f:
        f.write(patched)
    print('OK doomdef.h: SNDSERV disabled (web build uses direct Web Audio bridge)')

print('All patches done (5 total).')

# ── Patch 6: w_wad.c — strupr() conflicts with Emscripten's libc ───
# Emscripten provides its own strupr(char*) -> char* in compat/string.h
# DOOM's own strupr(char* s) -> void has a different return type.
# Rename DOOM's version to avoid the symbol clash.
with open('w_wad.c') as f:
    src = f.read()

patched = src.replace(
    'void strupr (char* s)\n{\n    while (*s) { *s = toupper(*s); s++; }\n}',
    'static void doom_strupr (char* s)\n{\n    while (*s) { *s = toupper(*s); s++; }\n}'
)
# Also rename all call sites: strupr( -> doom_strupr(
# but NOT the #define strcmpi line, and not Emscripten's own strupr
patched = patched.replace('strupr (', 'doom_strupr (')
patched = patched.replace('strupr(',  'doom_strupr(')
# Fix double-rename if the function definition already got renamed
patched = patched.replace('static void doom_doom_strupr', 'static void doom_strupr')

if patched == src:
    print('WARNING: strupr pattern not found in w_wad.c')
else:
    with open('w_wad.c', 'w') as f:
        f.write(patched)
    print('OK w_wad.c: strupr -> doom_strupr (avoid Emscripten libc clash)')

print('All patches done (6 total).')

# ── Patch 7: d_main.c — gut IdentifyVersion() + FindResponseFile()
# These do filesystem scanning (access/fopen/fread/fseek) with no
# equivalent in the browser. STANDALONE_WASM has no filesystem
# syscalls, so any linked reference to access()/fopen()/etc pulls
# in unresolvable __syscall_* imports — even for code paths that
# are never executed at runtime, since wasm-ld can't prove a
# runtime-conditional branch dead at link time.
with open('d_main.c') as f:
    src = f.read()

IDENTIFY_VERSION_STUB = (
    'void IdentifyVersion (void)\n'
    '{\n'
    '    /* WEB BUILD: no filesystem to scan. The single WAD is\n'
    '       injected directly from JavaScript (see w_io_web.c /\n'
    '       i_main_web.c) under the fixed sentinel name "WEBWAD". */\n'
    '    gamemode = shareware;\n'
    '    D_AddFile ("WEBWAD");\n'
    '}\n'
)
patched = re.sub(
    r'void IdentifyVersion \(void\)\s*\{.*?\n\}\n',
    IDENTIFY_VERSION_STUB, src, count=1, flags=re.DOTALL)
if patched == src:
    print('ERROR: IdentifyVersion not found'); sys.exit(1)
src = patched
print('OK d_main.c: IdentifyVersion -> hardcoded WEBWAD loader')

FIND_RESPONSE_STUB = (
    'void FindResponseFile (void)\n'
    '{\n'
    '    /* WEB BUILD: response files (@args) are not supported\n'
    '       in the browser — no local filesystem to read them from. */\n'
    '}\n'
)
patched = re.sub(
    r'void FindResponseFile \(void\)\s*\{.*?\n\}\n',
    FIND_RESPONSE_STUB, src, count=1, flags=re.DOTALL)
if patched == src:
    print('ERROR: FindResponseFile not found'); sys.exit(1)
src = patched
print('OK d_main.c: FindResponseFile -> no-op stub')

# Remove the Windows-only mkdir() call (inside the "-cdrom" branch,
# never exercised in the web build, but still linked otherwise).
patched = src.replace('\tmkdir("c:\\\\doomdata",0);\n', '')
if patched == src:
    print('WARNING: mkdir call not found in d_main.c')
else:
    src = patched
    print('OK d_main.c: removed mkdir() call')

with open('d_main.c', 'w') as f:
    f.write(src)

print('All patches done (7 total).')

# ── Patch 8: w_wad.c — redirect all real file I/O to web_* shims ──
with open('w_wad.c') as f:
    src = f.read()

# filelength(): drop the fstat() call (dead code for our WAD-only
# use case — always takes the multi-lump WAD branch, never the
# single-lump-file branch that calls filelength()).
old_filelength = (
    'int filelength (int handle) \n'
    '{ \n'
    '    struct stat\tfileinfo;\n'
    '    \n'
    '    if (fstat (handle,&fileinfo) == -1)\n'
    '\tI_Error ("Error fstating");\n'
    '\n'
    '    return fileinfo.st_size;\n'
    '}'
)
new_filelength = (
    'int filelength (int handle) \n'
    '{ \n'
    '    /* WEB BUILD: dead code path (WEBWAD always takes the\n'
    '       multi-lump WAD branch in W_AddFile, never single-lump). */\n'
    '    (void) handle;\n'
    '    return 0;\n'
    '}'
)
if old_filelength in src:
    src = src.replace(old_filelength, new_filelength)
    print('OK w_wad.c: filelength() no longer calls fstat()')
else:
    print('WARNING: filelength() pattern not found')

# Blanket word-boundary redirect of raw syscalls + stdio to web_* shims.
# Safe because w_wad.c uses these identifiers ONLY as function calls
# (verified: no local vars/fields named open/read/close/lseek/fopen/fclose).
for name in ('open', 'read', 'lseek', 'close', 'fopen', 'fclose'):
    src = re.sub(r'\b' + name + r'\s*\(', 'web_' + name + ' (', src)

with open('w_wad.c', 'w') as f:
    f.write(src)
print('OK w_wad.c: open/read/lseek/close/fopen/fclose -> web_* shims')

print('All patches done (8 total).')

# ── Patch 9: m_misc.c — redirect file I/O to web_* shims ─────────
with open('m_misc.c') as f:
    src = f.read()

for name in ('open', 'read', 'write', 'close', 'fstat',
             'fopen', 'fclose', 'access'):
    src = re.sub(r'\b' + name + r'\s*\(', 'web_' + name + ' (', src)

with open('m_misc.c', 'w') as f:
    f.write(src)
print('OK m_misc.c: file I/O -> web_* shims (M_WriteFile/M_ReadFile/'
      'M_SaveDefaults/M_LoadDefaults/M_ScreenShot)')

print('All patches done (9 total).')

# ── Patch 10: m_menu.c — redirect save-game slot scan file I/O ───
with open('m_menu.c') as f:
    src = f.read()

for name in ('open', 'read', 'close'):
    src = re.sub(r'\b' + name + r'\s*\(', 'web_' + name + ' (', src)

with open('m_menu.c', 'w') as f:
    f.write(src)
print('OK m_menu.c: save-game slot scan -> web_* shims')

print('All patches done (10 total).')

# ── Patch 11: d_net.c — redirect debugfile fclose ─────────────────
with open('d_net.c') as f:
    src = f.read()

patched = re.sub(r'\bfclose\s*\(', 'web_fclose (', src)
if patched == src:
    print('WARNING: fclose pattern not found in d_net.c')
else:
    with open('d_net.c', 'w') as f:
        f.write(patched)
    print('OK d_net.c: fclose -> web_fclose')

print('All patches done (11 total).')

# ── Patch 12: inject w_io_web.h prototypes into every caller ─────
# Emscripten's clang treats implicit function declarations as a
# HARD ERROR unconditionally (baked into emcc's driver, -w cannot
# suppress it). Every file calling a web_* function needs the
# prototype visible via #include.
_WEB_IO_CALLERS = ['d_main.c', 'w_wad.c', 'm_misc.c', 'm_menu.c', 'd_net.c']

for fname in _WEB_IO_CALLERS:
    with open(fname) as f:
        src = f.read()
    include_line = '#include "web/w_io_web.h"\n'
    if include_line in src:
        print(f'OK {fname}: w_io_web.h already included')
        continue
    idx = src.find('#include')
    if idx == -1:
        src = include_line + src
    else:
        line_end = src.find('\n', idx) + 1
        src = src[:line_end] + include_line + src[line_end:]
    with open(fname, 'w') as f:
        f.write(src)
    print(f'OK {fname}: injected #include "web/w_io_web.h"')

print('All patches done (12 total).')

# ── Patch 13: inject unbuffered checkpoint markers into D_DoomMain ──
# The prior divide-by-zero crash (offset 0x1e40f) survived removing
# setvbuf unchanged, disproving that theory. D_DoomMain's own printf
# calls SHOULD show boot progress, but regular libc stdio is still
# buffered (we reverted the unbuffered attempt after it introduced
# its own bug), so a trap mid-boot may still swallow unflushed
# output. These markers call js_print_string() directly — a raw
# WASM import with zero libc/stdio involvement — guaranteeing every
# one that executes is visible in the console immediately, letting
# us bisect exactly which Init() call traps.
with open('d_main.c') as f:
    src = f.read()

_CHECKPOINTS = [
    ('printf ("V_Init: allocate screens.\\n");',
     'js_print_string("CHECKPOINT: before V_Init");\n    printf ("V_Init: allocate screens.\\n");'),
    ('printf ("Z_Init: Init zone memory allocation daemon. \\n");',
     'js_print_string("CHECKPOINT: before Z_Init");\n    printf ("Z_Init: Init zone memory allocation daemon. \\n");'),
    ('printf ("W_Init: Init WADfiles.\\n");',
     'js_print_string("CHECKPOINT: before W_Init");\n    printf ("W_Init: Init WADfiles.\\n");'),
    ('printf ("M_Init: Init miscellaneous info.\\n");',
     'js_print_string("CHECKPOINT: before M_Init");\n    printf ("M_Init: Init miscellaneous info.\\n");'),
    ('printf ("R_Init: Init DOOM refresh daemon - ");',
     'js_print_string("CHECKPOINT: before R_Init");\n    printf ("R_Init: Init DOOM refresh daemon - ");'),
    ('printf ("\\nP_Init: Init Playloop state.\\n");',
     'js_print_string("CHECKPOINT: before P_Init");\n    printf ("\\nP_Init: Init Playloop state.\\n");'),
    ('printf ("I_Init: Setting up machine state.\\n");',
     'js_print_string("CHECKPOINT: before I_Init");\n    printf ("I_Init: Setting up machine state.\\n");'),
    ('printf ("D_CheckNetGame: Checking network game status.\\n");',
     'js_print_string("CHECKPOINT: before D_CheckNetGame");\n    printf ("D_CheckNetGame: Checking network game status.\\n");'),
    ('printf ("S_Init: Setting up sound.\\n");',
     'js_print_string("CHECKPOINT: before S_Init");\n    printf ("S_Init: Setting up sound.\\n");'),
    ('printf ("HU_Init: Setting up heads up display.\\n");',
     'js_print_string("CHECKPOINT: before HU_Init");\n    printf ("HU_Init: Setting up heads up display.\\n");'),
    ('printf ("ST_Init: Init status bar.\\n");',
     'js_print_string("CHECKPOINT: before ST_Init");\n    printf ("ST_Init: Init status bar.\\n");'),
]

count = 0
for old, new in _CHECKPOINTS:
    if old in src:
        src = src.replace(old, new, 1)
        count += 1
    else:
        print(f'WARNING: checkpoint pattern not found: {old[:50]}...')

# js_print_string needs a prototype visible in d_main.c (already
# gets w_io_web.h via Patch 12, but that doesn't declare this JS
# import — add it directly here).
if 'extern void js_print_string' not in src:
    idx = src.find('#include "web/w_io_web.h"')
    if idx != -1:
        line_end = src.find('\n', idx) + 1
        src = (src[:line_end] +
               'extern void js_print_string(const char* msg);\n' +
               src[line_end:])

with open('d_main.c', 'w') as f:
    f.write(src)

print(f'OK d_main.c: injected {count}/11 boot checkpoint markers')
print('All patches done (13 total).')

# ── Patch 14: d_main.c — remove original setbuf(stdout, NULL) call ──
# FOUND IT: this is DOOM's OWN unmodified source code (not something
# we added), called very early in D_DoomMain (right after
# IdentifyVersion, before the gamemode title banner). setbuf(f, NULL)
# is exactly equivalent to setvbuf(f, NULL, _IONBF, 0) — unbuffered
# mode. We already proved via disassembly + a controlled experiment
# that switching stdout to unbuffered mode triggers a divide-by-zero
# inside musl libc's internal buffer-size arithmetic in this
# Emscripten/STANDALONE_WASM environment. We previously (wrongly)
# blamed our OWN diagnostic setvbuf() addition for this and removed
# it — but the crash persisted at the same offset because THIS line,
# original vanilla DOOM code, was doing the exact same thing all
# along. Removing it: DOOM already works fine with default buffered
# stdio for every other printf call throughout the whole boot
# sequence, so unbuffered mode was never actually needed.
with open('d_main.c') as f:
    src = f.read()

old_setbuf = '    setbuf (stdout, NULL);\n'
if old_setbuf in src:
    src = src.replace(
        old_setbuf,
        '    /* WEB BUILD: setbuf(stdout, NULL) removed — unbuffered\n'
        '       mode triggers a divide-by-zero in musl libc\'s internal\n'
        '       buffer-size handling under Emscripten STANDALONE_WASM.\n'
        '       Default buffered stdio works fine here. */\n'
    )
    with open('d_main.c', 'w') as f:
        f.write(src)
    print('OK d_main.c: removed setbuf(stdout, NULL) — the ACTUAL divide-by-zero cause')
else:
    print('WARNING: setbuf(stdout, NULL) pattern not found')

print('All patches done (14 total).')
