"""Publish only the selected public file hashes after a canonical site release."""
import argparse
import json
import os
from pathlib import Path

from policy import MANIFEST_NAME, ORIGIN, canonical, permitted, sha, validate_manifest


def export(current, state_path):
    release = current.resolve(strict=True)
    manifest_path = release / 'manifest.json'
    stat = manifest_path.stat()
    fingerprint = [str(release), stat.st_size, stat.st_mtime_ns]
    output = release / 'site' / MANIFEST_NAME
    previous = json.loads(state_path.read_text()) if state_path.exists() else {}
    if (previous.get('fingerprint') == fingerprint and output.is_file()
            and sha(output.read_bytes()) == previous.get('sha256')):
        print('Unchanged: ' + release.name)
        return False
    source = json.loads(manifest_path.read_text('utf-8'))
    files = sorted(({'path': f['path'], 'bytes': f['bytes'], 'sha256': f['sha256']}
                    for f in source['files'] if permitted(f['path'])), key=lambda f: f['path'])
    manifest = {'schema': 1, 'origin': ORIGIN, 'release': release.name,
                'files': files, 'bytes': sum(f['bytes'] for f in files)}
    validate_manifest(manifest)
    site = (release / 'site').resolve(strict=True)
    for item in files:
        path = site / item['path']
        if not path.resolve(strict=True).is_relative_to(site) or path.is_symlink():
            raise ValueError('Unexpected symbolic link: ' + item['path'])
        data = path.read_bytes()
        if len(data) != item['bytes'] or sha(data) != item['sha256']:
            raise ValueError('Release file differs from manifest: ' + item['path'])
    if current.resolve(strict=True) != release:
        raise ValueError('Release changed during export; next timer run will retry')
    data = canonical(manifest) + b'\n'
    temporary = output.with_suffix('.json.tmp')
    temporary.write_bytes(data)
    temporary.chmod(0o644)
    os.replace(temporary, output)
    state_path.parent.mkdir(parents=True, exist_ok=True)
    temporary_state = state_path.with_suffix('.tmp')
    temporary_state.write_bytes(canonical({'fingerprint': fingerprint, 'sha256': sha(data)}))
    os.replace(temporary_state, state_path)
    print(json.dumps({'release': release.name, 'files': len(files), 'bytes': manifest['bytes']}))
    return True


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--current', type=Path, default=Path('/opt/yechengzhang-academic/releases/current'))
    parser.add_argument('--state', type=Path, default=Path('/var/lib/academic-pages-sync/manifest-state.json'))
    args = parser.parse_args()
    export(args.current, args.state)
