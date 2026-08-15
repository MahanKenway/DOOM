#!/usr/bin/env python3
"""Patch the pinned OpenTTD browser glue for a no-survey first launch.

The upstream browser build mounts /home/web_user/.openttd using IDBFS in a
preRun hook. Before the engine reads its config, this patch writes a minimal
openttd.cfg only when that file does not already exist. It selects the
upstream documented `network.participate_survey = no` setting, avoiding the
first-run survey dialog while preserving any later player preference.
"""

from __future__ import annotations

import sys
from pathlib import Path

MARKER = b"retroplay-no-survey-config-seed"
NEEDLE = (
    b'FS.mount(IDBFS,{},personal_dir);Module.addRunDependency("syncfs");'
    b'FS.syncfs(true,function(err){Module.removeRunDependency("syncfs")})'
)
REPLACEMENT = (
    b'FS.mount(IDBFS,{},personal_dir);Module.addRunDependency("syncfs");'
    b'FS.syncfs(true,function(err){'
    b'if(err){Module.removeRunDependency("syncfs");return}'
    b'try{var retroplayConfigPath=personal_dir+"/openttd.cfg";'
    b'if(!FS.analyzePath(retroplayConfigPath).exists){'
    b'FS.writeFile(retroplayConfigPath,"[network]\\nparticipate_survey = no\\n");'
    b'FS.syncfs(false,function(){Module.removeRunDependency("syncfs")});return}'
    b'}catch(e){}'
    b'Module.removeRunDependency("syncfs")'
    b'})/*retroplay-no-survey-config-seed*/'
)


def main() -> int:
    if len(sys.argv) != 2:
        raise SystemExit("usage: patch-openttd-browser-glue.py <openttd.js>")

    path = Path(sys.argv[1])
    content = path.read_bytes()
    if MARKER in content:
        print(f"OpenTTD browser glue already patched: {path}")
        return 0

    occurrences = content.count(NEEDLE)
    if occurrences != 1:
        raise SystemExit(
            f"expected exactly one upstream IDBFS hook in {path}, found {occurrences}"
        )

    path.write_bytes(content.replace(NEEDLE, REPLACEMENT, 1))
    print(f"Seeded no-survey first-launch config hook in: {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
