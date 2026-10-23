#!/usr/bin/env python3
from pathlib import Path
import subprocess,zipfile,sys
root=Path(__file__).resolve().parent.parent
subprocess.run(['node','tools/release.js'],cwd=root,check=True)
output=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else root.parent/'iPadDashboard_v19.4.zip'
exclude={'.git','.github','__pycache__','.pytest_cache'}
with zipfile.ZipFile(output,'w',compression=zipfile.ZIP_DEFLATED) as z:
    for p in sorted(root.rglob('*')):
        if p.is_file() and not any(part in exclude for part in p.relative_to(root).parts):
            z.write(p,p.relative_to(root).as_posix())
with zipfile.ZipFile(output) as z:
    assert z.testzip() is None
print('Packaged',output)
