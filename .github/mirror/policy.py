"""Public, bounded export policy shared by the server and GitHub runner."""
import hashlib
import json
from pathlib import PurePosixPath
import re

ORIGIN = 'https://yechengzhang.duqi.top'
MIRROR = 'https://24kchengye.github.io'
MANIFEST_NAME = 'github-pages-sync-manifest.json'
MAX_BYTES = 250 * 1024 * 1024
MAX_FILE_BYTES = 25 * 1024 * 1024
MAX_FILES = 10000
ROOT_FILES = {'index.html', 'favicon.ico', 'robots.txt', 'about.html',
              'google-scholar-stats/gs_data.json'}
BLOCKED_EXTENSIONS = {'.pdf', '.zip', '.gz', '.tar', '.7z', '.docx', '.doc',
                      '.pem', '.key', '.p12', '.sqlite', '.db', '.env', '.yml', '.yaml'}


def permitted(name):
    if not isinstance(name, str) or not name or '\\' in name or ':' in name:
        return False
    parts = name.split('/')
    if any(not p or p.startswith('.') for p in parts):
        return False
    if not (name in ROOT_FILES or name.startswith(('writing/', 'resume/', 'images/', 'assets/', 'about/'))):
        return False
    if name.startswith(('assets/reading', 'assets/js/reading', 'assets/css/reading',
                        'assets/js/site-curation')):
        return False
    return PurePosixPath(name).suffix.lower() not in BLOCKED_EXTENSIONS


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical(data):
    return json.dumps(data, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode('utf-8')


def validate_manifest(manifest):
    if manifest.get('schema') != 1 or manifest.get('origin') != ORIGIN:
        raise ValueError('Unsupported mirror manifest')
    files = manifest.get('files')
    if not isinstance(files, list) or not 1 <= len(files) <= MAX_FILES:
        raise ValueError('Invalid export file count')
    seen = set()
    total = 0
    for item in files:
        name = item.get('path')
        if not permitted(name) or name in seen:
            raise ValueError('Disallowed or duplicate export path: ' + str(name))
        if not re.fullmatch('[a-f0-9]{64}', item.get('sha256', '')):
            raise ValueError('Invalid hash: ' + name)
        size = item.get('bytes')
        if type(size) is not int or not 0 <= size <= MAX_FILE_BYTES:
            raise ValueError('Invalid file size: ' + name)
        total += size
        seen.add(name)
    if total > MAX_BYTES or manifest.get('bytes') != total:
        raise ValueError('Export exceeds lightweight size policy')
    if not {'index.html', 'assets/js/minimal.js', 'resume/index.html'} <= seen:
        raise ValueError('Required public pages are missing')
    return files


def validate_layout(layout):
    if type(layout.get('revision')) is not int or not isinstance(layout.get('placements'), dict):
        raise ValueError('Invalid public layout')
    if len(layout['placements']) > 2000:
        raise ValueError('Too many layout items')
    for key, value in layout['placements'].items():
        if not isinstance(key, str) or len(key) > 250 or value not in ('featured', 'archive'):
            raise ValueError('Invalid placement')


def input_fingerprint(manifest, layout, code_sha):
    # Release-only changes (e.g. another translated report) need no mirror build.
    validate_manifest(manifest)
    validate_layout(layout)
    files = sorted(manifest['files'], key=lambda row: row['path'])
    return sha(canonical({'files': files, 'placements': layout['placements'], 'code': code_sha}))
