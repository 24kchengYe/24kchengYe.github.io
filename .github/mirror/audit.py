"""Fail before publication on missing assets or forbidden copied material."""
from pathlib import Path
import re
from urllib.parse import unquote, urljoin, urlsplit

from bs4 import BeautifulSoup
from policy import MIRROR, permitted


def audit(root):
    failures = []
    count = 0
    special = {'.nojekyll', '404.html', 'mirror-status.json',
               'reading/index.html', 'reading/history/index.html'}

    def check(source, value):
        nonlocal count
        value = value.strip()
        if not value or value.startswith(('#', 'data:', 'javascript:', 'mailto:', 'tel:', 'blob:')):
            return
        parsed = urlsplit(urljoin(MIRROR + '/' + source.relative_to(root).as_posix(), value))
        if (parsed.hostname or '').lower() != '24kchengye.github.io':
            return
        relative = unquote(parsed.path).lstrip('/')
        target = root / relative
        if not target.resolve().is_relative_to(root.resolve()):
            failures.append('Escaping local link: ' + value)
            return
        if parsed.path.endswith('/') or target.is_dir():
            target /= 'index.html'
        if not target.is_file() and not target.suffix and target.with_suffix('.html').is_file():
            target = target.with_suffix('.html')
        count += 1
        if not target.is_file():
            failures.append(source.relative_to(root).as_posix() + ': ' + value)

    for source in sorted(root.rglob('*')):
        if not source.is_file():
            continue
        relative = source.relative_to(root).as_posix()
        if source.is_symlink() or (relative not in special and not permitted(relative)):
            failures.append('Disallowed published file: ' + relative)
        if source.suffix.lower() not in ('.html', '.css', '.svg'):
            continue
        text = source.read_text('utf-8')
        if source.suffix.lower() in ('.html', '.svg'):
            soup = BeautifulSoup(text, 'html.parser')
            for element in soup.find_all(True):
                for name in ('src', 'href', 'poster', 'data-src', 'data-src-en', 'data-src-zh',
                             'data-src-ja', 'data', 'xlink:href'):
                    value = element.get(name)
                    if isinstance(value, str):
                        check(source, value)
                for part in str(element.get('srcset', '')).split(','):
                    if part.strip():
                        check(source, part.strip().split(None, 1)[0])
        for match in re.finditer(r'url\(\s*[\"\']?([^\"\')\s]+)[\"\']?\s*\)', text):
            check(source, match[1])
        for match in re.finditer(r'@import\s+[\"\']([^\"\']+)[\"\']', text):
            check(source, match[1])
    if failures:
        raise ValueError('Mirror validation failed:\n' + '\n'.join(failures[:25]))
    return {'checked_local_references': count, 'broken_local_references': 0}
