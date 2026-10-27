"""Incremental verified mirror builder. No account credentials or server writes."""
import argparse
import concurrent.futures
import datetime
import json
import os
from pathlib import Path
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

from policy import (MANIFEST_NAME, MIRROR, ORIGIN, canonical, input_fingerprint,
                    sha, validate_layout, validate_manifest)

HERE = Path(__file__).resolve().parent


def fetch(url, limit, attempts=3):
    failure = None
    for attempt in range(attempts):
        try:
            request = urllib.request.Request(url, headers={
                'User-Agent': 'YechengAcademicPagesMirror/1.0', 'Accept-Encoding': 'identity'})
            with urllib.request.urlopen(request, timeout=60) as response:
                if urllib.parse.urlsplit(response.geturl()).netloc != urllib.parse.urlsplit(url).netloc:
                    raise ValueError('Cross-origin download redirect refused')
                data = response.read(limit + 1)
            if len(data) > limit:
                raise ValueError('Download exceeds expected size')
            return data
        except (OSError, ValueError) as exc:
            failure = exc
            if isinstance(exc, urllib.error.HTTPError) and exc.code == 404:
                raise
            if attempt + 1 < attempts:
                time.sleep(1 + attempt)
    raise failure


def code_sha():
    return sha(canonical({p.name: sha(p.read_bytes()) for p in sorted(HERE.glob('*.py'))}))


def outputs(**values):
    if os.environ.get('GITHUB_OUTPUT'):
        with open(os.environ['GITHUB_OUTPUT'], 'a', encoding='utf-8') as stream:
            for key, value in values.items():
                stream.write(f'{key}={value}\n')
    print(json.dumps(values), flush=True)


def probe(work):
    work.mkdir(parents=True, exist_ok=True)
    manifest = json.loads(fetch(ORIGIN + '/' + MANIFEST_NAME, 4 * 1024 * 1024))
    validate_manifest(manifest)
    layout = json.loads(fetch(ORIGIN + '/api/reading/site-layout', 256 * 1024))
    validate_layout(layout)
    fingerprint = input_fingerprint(manifest, layout, code_sha())
    try:
        previous = json.loads(fetch(MIRROR + '/mirror-status.json?check=' + str(int(time.time())), 64 * 1024))
    except urllib.error.HTTPError as exc:
        if exc.code != 404:
            raise
        previous = {}
    changed = previous.get('fingerprint') != fingerprint
    (work / 'manifest.json').write_bytes(canonical(manifest))
    (work / 'layout.json').write_bytes(canonical(layout))
    (work / 'input.json').write_bytes(canonical({'fingerprint': fingerprint, 'changed': changed}))
    outputs(changed=str(changed).lower(), cache_key=fingerprint)
    summary = os.environ.get('GITHUB_STEP_SUMMARY')
    if summary:
        with open(summary, 'a', encoding='utf-8') as stream:
            stream.write(f'Canonical release: `{manifest["release"]}`\n\n')
            stream.write(('Lightweight content changed; verifying a new mirror.\n' if changed
                          else 'No lightweight content or public placement changes. No deployment needed.\n'))


def verified_object(item, cache, getter=fetch):
    path = cache / item['sha256']
    if path.is_file():
        data = path.read_bytes()
        if len(data) == item['bytes'] and sha(data) == item['sha256']:
            return data, False
    url = ORIGIN + '/' + urllib.parse.quote(item['path'], safe='/')
    data = getter(url, item['bytes'])
    if len(data) != item['bytes'] or sha(data) != item['sha256']:
        raise ValueError('Public content changed during sync: ' + item['path'])
    # Concurrent same-content requests share the hash; atomic unique temp writes.
    import tempfile
    fd, name = tempfile.mkstemp(prefix='verified-', dir=cache)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    os.replace(name, path)
    return data, True


def build(work, cache):
    from audit import audit
    manifest = json.loads((work / 'manifest.json').read_text('utf-8'))
    layout = json.loads((work / 'layout.json').read_text('utf-8'))
    pending = json.loads((work / 'input.json').read_text('utf-8'))
    files = validate_manifest(manifest)
    if pending['fingerprint'] != input_fingerprint(manifest, layout, code_sha()):
        raise ValueError('Build inputs changed after probe')
    root = work / 'site'
    if root.exists() and any(root.iterdir()):
        raise ValueError('Build requires a fresh staging directory')
    root.mkdir(parents=True, exist_ok=True)
    cache.mkdir(parents=True, exist_ok=True)

    def install(item):
        data, downloaded = verified_object(item, cache)
        path = root / item['path']
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        return downloaded, len(data) if downloaded else 0

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        transfers = list(pool.map(install, files))
    # The published release can change while downloads are in flight. Different
    # light-content hashes abort this candidate and preserve the existing Pages.
    latest = json.loads(fetch(ORIGIN + '/' + MANIFEST_NAME, 4 * 1024 * 1024))
    latest_layout = json.loads(fetch(ORIGIN + '/api/reading/site-layout', 256 * 1024))
    if input_fingerprint(latest, latest_layout, code_sha()) != pending['fingerprint']:
        raise ValueError('Canonical content/layout changed during build; next run will retry')
    subprocess.run([sys.executable, str(HERE / 'transform_mirror.py'), '--site', str(root),
                    '--layout', str(work / 'layout.json'), '--report', str(work / 'transform.json')], check=True)
    (root / '.nojekyll').write_bytes(b'')
    result = audit(root)
    state = {'schema': 1, 'fingerprint': pending['fingerprint'], 'source': ORIGIN,
             'release': manifest['release'], 'source_files': len(files),
             'source_bytes': manifest['bytes'], 'layout_revision': layout['revision'],
             'synced_at': datetime.datetime.now(datetime.timezone.utc).isoformat()}
    (root / 'mirror-status.json').write_bytes(canonical(state) + b'\n')
    report = {**state, **result, 'downloaded_files': sum(row[0] for row in transfers),
              'downloaded_bytes': sum(row[1] for row in transfers)}
    (work / 'build-report.json').write_bytes(canonical(report))
    print(json.dumps(report), flush=True)
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a', encoding='utf-8') as stream:
            stream.write(f'\nVerified {len(files)} source files ({manifest["bytes"] / 1024**2:.1f} MiB). ')
            stream.write(f'Downloaded {report["downloaded_files"]}; the remainder reused hash-verified cache.\n\n')
            stream.write('Reading documents, reports, PDFs, accounts and editing remain on the canonical server.\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('command', choices=['probe', 'build'])
    parser.add_argument('--work', type=Path, default=Path('mirror-work'))
    parser.add_argument('--cache', type=Path, default=Path('.mirror-cache/objects'))
    args = parser.parse_args()
    if args.command == 'probe':
        probe(args.work.resolve())
    else:
        build(args.work.resolve(), args.cache.resolve())
