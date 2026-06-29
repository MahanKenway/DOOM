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
