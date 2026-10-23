"""Verify and install one immutable learning-document batch; run as ubuntu."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import tarfile

def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream,'sha256').hexdigest()

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('archive',type=Path)
    parser.add_argument('sha256')
    args=parser.parse_args()
    stage=Path('/home/ubuntu/academic-pilot-staging').resolve()
    archive=args.archive.resolve(strict=True)
    assert archive.parent==stage and re.fullmatch(r'learning-[a-f0-9]{16}-\d+\.tar',archive.name)
    assert digest(archive)==args.sha256
    with tarfile.open(archive) as tf:
        manifest=json.load(tf.extractfile('manifest.json'))
        version=manifest['version']
        assert re.fullmatch(r'[a-f0-9]{16}',version)
        root=Path('/opt/yechengzhang-academic/releases/learning-files')/version
        assert not root.is_symlink()
        root.mkdir(parents=True,exist_ok=True)
        expected={r['name']:r for r in manifest['files']}
        members=tf.getmembers()
        assert len(members)==len({m.name for m in members})
        assert {m.name for m in members}=={'manifest.json'}|{n for n,r in expected.items() if not r.get('reuse')}
        for member in members:
            assert member.isfile() and member.name in {'manifest.json'}|set(expected)
        for name,row in expected.items():
            assert re.fullmatch(r'(?:[a-f0-9]{24,64}|toc-[a-z0-9-]{3,40})\.(?:html|md|pdf|png|jpg|jpeg|gif|webp|svg)',name)
            target=root/name
            assert not target.is_symlink()
            if target.is_file():
                assert target.stat().st_size==row['bytes'] and digest(target)==row['sha256']
                continue
            temp=root/(name+'.part')
            assert not temp.exists()
            if row.get('reuse'):
                reuse=row['reuse']
                assert re.fullmatch(r'[a-z0-9.-]+',reuse) and '..' not in reuse
                original=Path('/opt/yechengzhang-academic/releases/library-files')/reuse
                assert not original.is_symlink() and digest(original)==row['sha256']
                os.link(original,temp)
            else:
                with tf.extractfile(name) as src,temp.open('xb') as dst:
                    shutil.copyfileobj(src,dst,1024*1024)
            assert temp.stat().st_size==row['bytes'] and digest(temp)==row['sha256']
            temp.chmod(0o644)
            os.replace(temp,target)
    print(json.dumps({'version':version,'verified':len(expected)}),flush=True)
    # Exact validated staging archive, after every member has verified.
    archive.unlink()

if __name__=='__main__':
    main()
