"""Install an exact verified preview-image bundle; original PDFs remain unchanged."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import tarfile

def sha(path):
    with path.open('rb') as stream:return hashlib.file_digest(stream,'sha256').hexdigest()

parser=argparse.ArgumentParser()
parser.add_argument('sha256')
args=parser.parse_args()
archive=Path('/home/ubuntu/academic-pilot-staging/reading-previews.tar')
assert sha(archive)==args.sha256
root=Path('/opt/yechengzhang-academic/releases/reading-previews')
assert root.is_dir() and not root.is_symlink()
with tarfile.open(archive) as tf:
    manifest=json.load(tf.extractfile('manifest.json'))
    rows={r['name']:r for r in manifest['files']}
    members=tf.getmembers()
    assert len(members)==len(rows)+1
    assert all(m.isfile() and m.name in {'manifest.json'}|set(rows) for m in members)
    for name,row in rows.items():
        assert re.fullmatch(r'[a-f0-9]{64}\.webp',name)
        target=root/name
        assert not target.is_symlink()
        if target.exists():
            assert sha(target)==row['sha256']
            continue
        temp=root/(name+'.part')
        with tf.extractfile(name) as source,temp.open('xb') as output:shutil.copyfileobj(source,output)
        assert temp.stat().st_size==row['bytes'] and sha(temp)==row['sha256']
        temp.chmod(0o644);os.replace(temp,target)
print(json.dumps({'verified_previews':len(rows)}))
