"""Make a lightweight Pages mirror from a verified public server artifact.

Only the supplied output directory is mutated. The public placement snapshot and
transformation report remain beside it; no account endpoint is queried.
"""
from __future__ import annotations

import argparse
import collections
import hashlib
import json
import re
import urllib.request
from pathlib import Path
from urllib.parse import urljoin, urlsplit, urlunsplit

from bs4 import BeautifulSoup

WORK = Path(__file__).resolve().parent
CANONICAL = 'https://yechengzhang.duqi.top'
SITE_HOSTS = {'yechengzhang.duqi.top', '24kchengye.github.io'}
PRIVATE = {'/cv/yecheng_cv.pdf', '/cv/resume_cn_v2.pdf'}
URL_ATTRIBUTES = {'href', 'src', 'poster', 'data-src', 'data-src-en', 'data-src-zh',
                  'data-src-ja', 'data', 'action', 'cite', 'longdesc'}
CSS_URL = re.compile(r'url\(\s*([\"\']?)([^\"\')\s]+)\1\s*\)', re.I)
# Root-relative literals can occur in inline setup code and data attributes.
PATH_LITERAL = re.compile(r'(?P<q>[\"\'])(?P<url>/(?:reading(?:/|[?#])|cv/|assets/reading)[^\"\'\s<>]*)(?P=q)')


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def needs_server(path: str) -> bool:
    return (path == '/reading' or path.startswith('/reading/')
            or path.startswith('/cv/') or path.startswith('/assets/reading')
            or path.lower().endswith('.pdf'))


def remote_url(value: str, relative_page: str) -> str:
    if not value or value.startswith(('#', 'data:', 'javascript:', 'mailto:', 'tel:', 'blob:')):
        return value
    parsed = urlsplit(urljoin(CANONICAL + '/' + relative_page, value))
    if parsed.hostname and parsed.hostname.lower() in SITE_HOSTS:
        if parsed.path.lower() in PRIVATE:
            raise ValueError(f'Private CV link found in {relative_page}: {parsed.path}')
        if needs_server(parsed.path):
            return urlunsplit(('https', 'yechengzhang.duqi.top', parsed.path, parsed.query, parsed.fragment))
    return value


def apply_snapshot(soup: BeautifulSoup, snapshot: dict) -> dict:
    placements = snapshot['placements']
    ordered = collections.defaultdict(list)
    counts = collections.Counter()
    for sequence, element in enumerate(soup.select('[data-curation-item]')):
        original = element.find_parent(attrs={'data-curation-slot': True})
        group = element.find_parent(attrs={'data-curation-group': True})
        if original is None or group is None:
            raise ValueError('Curation item lacks a group/slot')
        ident = element['data-curation-item']
        placement = placements.get(ident, original['data-curation-slot'])
        if placement not in ('featured', 'archive'):
            raise ValueError(f'Invalid placement: {ident}')
        target_id = element.get('data-curation-' + placement + '-target')
        target = soup.find(id=target_id) if target_id else None
        if target is None or target.find_parent(attrs={'data-curation-group': True}) is not group:
            raise ValueError(f'Invalid target for {ident}: {target_id}')
        if target.get('data-curation-slot') != placement:
            raise ValueError(f'Wrong target placement for {ident}')
        order = int(element.get('data-curation-order', sequence))
        ordered[target_id].append((order, sequence, element))
        counts[f'{group["data-curation-group"]}:{placement}'] += 1
    for target_id, rows in ordered.items():
        target = soup.find(id=target_id)
        for _, _, element in sorted(rows, key=lambda row: row[:2]):
            target.append(element.extract())
    for slot in soup.select('[data-curation-slot]'):
        empty = slot.select_one('[data-curation-item]') is None
        classes = [name for name in slot.get('class', []) if name != 'curation-slot-empty']
        if empty:
            classes.append('curation-slot-empty')
        slot['class'] = classes
        for label in soup.select('[data-curation-heading-for]'):
            if label['data-curation-heading-for'] == slot.get('id'):
                if empty:
                    label['hidden'] = ''
                else:
                    label.attrs.pop('hidden', None)
    for details in soup.select('[data-curation-group] details'):
        archives = details.select('[data-curation-slot="archive"]')
        if archives:
            if all(slot.select_one('[data-curation-item]') is None for slot in archives):
                details['hidden'] = ''
            else:
                details.attrs.pop('hidden', None)
    return dict(counts)


def transform_html(path: Path, root: Path, snapshot: dict) -> dict:
    relative = path.relative_to(root).as_posix()
    soup = BeautifulSoup(path.read_text('utf-8'), 'html.parser')
    removed = 0
    for script in soup.select('script[src]'):
        if urlsplit(script['src']).path.endswith('/site-curation.js'):
            script.decompose()
            removed += 1
    counts = apply_snapshot(soup, snapshot) if relative == 'index.html' else {}
    changes = 0
    for element in soup.find_all(True):
        for name, value in list(element.attrs.items()):
            if not isinstance(value, str):
                continue
            if name in URL_ATTRIBUTES or name.startswith('data-src-'):
                updated = remote_url(value, relative)
            elif name == 'srcset':
                parts = []
                for item in value.split(','):
                    tokens = item.strip().split(None, 1)
                    parts.append(remote_url(tokens[0], relative) + (' ' + tokens[1] if len(tokens) > 1 else '') if tokens else '')
                updated = ', '.join(parts)
            elif name == 'style':
                updated = CSS_URL.sub(lambda m: f'url({m[1]}{remote_url(m[2], relative)}{m[1]})', value)
            else:
                updated = PATH_LITERAL.sub(lambda m: m['q'] + remote_url(m['url'], relative) + m['q'], value)
            if updated != value:
                element[name] = updated
                changes += 1
    for style in soup.find_all('style'):
        if style.string:
            text = str(style.string)
            style.string.replace_with(CSS_URL.sub(lambda m: f'url({m[1]}{remote_url(m[2], relative)}{m[1]})', text))
    for script in soup.find_all('script', src=False):
        if script.string:
            text = str(script.string)
            script.string.replace_with(PATH_LITERAL.sub(lambda m: m['q'] + remote_url(m['url'], relative) + m['q'], text))
    path.write_text(str(soup), 'utf-8')
    return {'file': relative, 'urls': changes, 'editor_scripts_removed': removed, 'placements': counts}


def redirect_html(route: str) -> str:
    target = CANONICAL + route
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Reading · Yecheng Zhang</title><link rel="canonical" href="{target}">
<script>location.replace({json.dumps(target)} + location.search + location.hash);</script>
<meta http-equiv="refresh" content="0;url={target}">
<style>body{{font:18px/1.7 system-ui,sans-serif;max-width:44rem;margin:18vh auto;padding:0 1.5rem;color:#303632}}a{{color:inherit}}</style>
</head><body><p><a href="{target}">Continue to the reading library →</a></p></body></html>'''


def add_404_bridge(path: Path) -> None:
    # Fixed destination origin; a strict local path family prevents an open redirect.
    bridge = '''(() => {
  const path = location.pathname;
  const entry = /^\\/reading(?:\\/index\\.html)?\\/?$/.test(path)
    || /^\\/reading\\/(?:history|r1-web|v3-web|library-preview)(?:\\/index\\.html)?\\/?$/.test(path);
  const asset = /^\\/reading\\/(?:web|files|learning-files|previews|library-preview\\/files)\\/[A-Za-z0-9._~+-]+(?:\\/[A-Za-z0-9._~+-]+)*$/.test(path)
    && !path.split('/').some(part => part === '.' || part === '..');
  if (entry || asset) {
    location.replace('https://yechengzhang.duqi.top' + path + location.search + location.hash);
  }
})();'''
    if path.exists():
        soup = BeautifulSoup(path.read_text('utf-8'), 'html.parser')
        if not soup.head:
            raise ValueError('404.html has no head')
        old = soup.find(id='reading-canonical-bridge')
        if old:
            old.decompose()
        script = soup.new_tag('script', id='reading-canonical-bridge')
        script.string = bridge
        soup.head.insert(0, script)
        path.write_text(str(soup), 'utf-8')
    else:
        path.write_text(f'''<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found · Yecheng Zhang</title>
<script id="reading-canonical-bridge">{bridge}</script>
<style>body{{font:18px/1.7 system-ui,sans-serif;max-width:44rem;margin:18vh auto;padding:0 1.5rem;color:#303632}}a{{color:inherit}}</style>
</head><body><h1>Page not found</h1><p><a href="/">Return to Yecheng Zhang</a></p></body></html>''', 'utf-8')


def validate(root: Path) -> dict:
    failures = []
    htmls = list(root.rglob('*.html'))
    for path in htmls:
        relative = path.relative_to(root).as_posix()
        soup = BeautifulSoup(path.read_text('utf-8'), 'html.parser')
        if soup.select('script[src*="site-curation.js"]'):
            failures.append(relative + ': owner API script remains')
        for element in soup.find_all(True):
            for name in URL_ATTRIBUTES:
                value = element.get(name)
                if isinstance(value, str) and remote_url(value, relative) != value:
                    failures.append(relative + ': unconverted ' + value)
    for path in root.rglob('*'):
        if path.is_file() and path.suffix.lower() == '.pdf':
            failures.append('PDF remains: ' + path.relative_to(root).as_posix())
    if failures:
        raise ValueError('\n'.join(failures[:25]))
    return {'html_files': len(htmls), 'pdf_files': 0, 'validation': 'passed'}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--site', type=Path, default=WORK / 'site')
    parser.add_argument('--layout', type=Path, default=WORK / 'public-layout.json')
    parser.add_argument('--report', type=Path, default=WORK / 'transformation-report.json')
    args = parser.parse_args()
    root = args.site.resolve()
    if not (root / 'index.html').is_file() or not (root / 'assets/js/minimal.js').is_file():
        raise SystemExit('Expected a complete server public artifact with index.html and minimal.js')
    if root == Path(root.anchor) or root == WORK:
        raise SystemExit('Refusing a non-site output directory')
    if args.layout.resolve().is_relative_to(root) or args.report.resolve().is_relative_to(root):
        raise SystemExit('Snapshot and report must stay outside the published directory')
    if not args.layout.exists():
        request = urllib.request.Request(CANONICAL + '/api/reading/site-layout', headers={'Accept': 'application/json'})
        with urllib.request.urlopen(request, timeout=25) as response:
            snapshot = json.load(response)
        args.layout.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2), 'utf-8')
    else:
        snapshot = json.loads(args.layout.read_text('utf-8'))
    if not isinstance(snapshot.get('placements'), dict) or not isinstance(snapshot.get('revision'), int):
        raise ValueError('Invalid public layout snapshot')
    if any(value not in ('featured', 'archive') for value in snapshot['placements'].values()):
        raise ValueError('Invalid public placement')
    # Reading documents/PDFs are deliberately excluded by the export step.
    for relative in ('cv/Yecheng_CV.pdf', 'cv/resume_cn_v2.pdf'):
        if (root / relative).exists():
            raise ValueError('Private CV present: ' + relative)
    before = {p.relative_to(root).as_posix(): digest(p) for p in root.rglob('*') if p.is_file()}
    records = [transform_html(path, root, snapshot) for path in sorted(root.rglob('*.html'))]
    minimal = root / 'assets/js/minimal.js'
    source = minimal.read_text('utf-8')
    old = "link.setAttribute('href', url.pathname + url.search + url.hash);"
    new = "link.setAttribute('href', (url.origin === location.origin ? '' : url.origin) + url.pathname + url.search + url.hash);"
    if old not in source and new not in source:
        raise ValueError('Expected minimal.js language-link code not found')
    minimal.write_text(source.replace(old, new), 'utf-8')
    for route in ('/reading/', '/reading/history/'):
        path = root / route.lstrip('/') / 'index.html'
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(redirect_html(route), 'utf-8')
    add_404_bridge(root / '404.html')
    result = validate(root)
    after = {p.relative_to(root).as_posix(): digest(p) for p in root.rglob('*') if p.is_file()}
    report = {'layout_revision': snapshot['revision'], 'layout_sha256': digest(args.layout),
              'changed_files': [name for name, sha in after.items() if before.get(name) != sha],
              'html_changes': records, **result}
    args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2), 'utf-8')
    print(json.dumps({'changed_files': len(report['changed_files']), 'layout_revision': snapshot['revision'], **result}))


if __name__ == '__main__':
    main()
