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

# ── Patch 4: r_data.c — alloca() not available in Emscripten libc ──
# Replace alloca(width) with malloc(width) + free() at both exit points
# (the early 'return' inside the for-loop, and end of function)
with open('r_data.c') as f:
    src = f.read()

old_alloca = "    patchcount = (byte *)alloca (texture->width);\n    memset (patchcount, 0, texture->width);"
new_malloc = "    patchcount = (byte *)malloc (texture->width);\n    memset (patchcount, 0, texture->width);"

if old_alloca in src:
    src = src.replace(old_alloca, new_malloc)

    # Add free(patchcount) before the early return inside the loop
    old_return = (
        "\tif (!patchcount[x])\n"
        "\t{\n"
        "\t    printf (\"R_GenerateLookup: column without a patch (%s)\\n\",\n"
        "\t\t    texture->name);\n"
        "\t    return;\n"
        "\t}"
    )
    new_return = (
        "\tif (!patchcount[x])\n"
        "\t{\n"
        "\t    printf (\"R_GenerateLookup: column without a patch (%s)\\n\",\n"
        "\t\t    texture->name);\n"
        "\t    free(patchcount);\n"
        "\t    return;\n"
        "\t}"
    )
    if old_return in src:
        src = src.replace(old_return, new_return)
        print('OK r_data.c: added free() before early return')
    else:
        print('WARNING: early-return pattern not found')

    # Add free(patchcount) at the natural end of the for-loop (before closing brace)
    old_loopend = "\t    texturecompositesize[texnum] += texture->height;\n\t}\n    }\t\n}"
    new_loopend = "\t    texturecompositesize[texnum] += texture->height;\n\t}\n    }\t\n    free(patchcount);\n}"
    if old_loopend in src:
        src = src.replace(old_loopend, new_loopend)
        print('OK r_data.c: added free() at function end')
    else:
        print('WARNING: function-end pattern not found')

    with open('r_data.c', 'w') as f:
        f.write(src)
    print('OK r_data.c: alloca() -> malloc()/free() conversion complete')
else:
    print('WARNING: alloca pattern not found in r_data.c (may already be patched)')

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
