"""Extract document dates from explicit labels in the downloaded original files.

Never use filesystem or PDF creation timestamps as publication dates.
"""
import argparse
import json
import re
from pathlib import Path
import fitz

MONTHS = {name[:3].lower(): n + 1 for n, name in enumerate(
    ['January', 'February', 'March', 'April', 'May', 'June', 'July',
     'August', 'September', 'October', 'November', 'December'])}

def dateof(text):
    match = re.search(r'\b(20\d{2})[-/](\d{1,2})[-/]\d{1,2}\b', text)
    if match and 1 <= int(match[2]) <= 12:
        return f'{match[1]}.{int(match[2]):02d}'
    match = re.search(r'\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember|t)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*(?:\d{1,2}(?:st|nd|rd|th)?)?\s*,?\s*(20\d{2})\b', text, re.I)
    if match:
        return f'{match[2]}.{MONTHS[match[1][:3].lower()]:02d}'
    match = re.search(r'\b(\d{1,2})/(\d{1,2})/(20\d{2})\b', text)
    if match and 1 <= int(match[1]) <= 12:
        return f'{match[3]}.{int(match[1]):02d}'

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    catalog = json.loads((args.source/'catalog.json').read_text(encoding='utf-8-sig'))
    reports = json.loads((root/'_data/reading.json').read_text(encoding='utf-8'))['reports']
    missing = {row['id'] for row in reports if not row.get('date')}
    overrides = {}
    for row in catalog:
        if row['id'] not in missing:
            continue
        path = args.source/row['local_path']
        if path.suffix == '.pdf':
            with fitz.open(path) as doc:
                text = '\n'.join(doc[i].get_text() for i in range(min(3,len(doc))))
        else:
            text = path.read_text(encoding='utf-8-sig')
        evidence = None
        kind = 'publication'
        for pattern, basis in [
            (r'(?:Model card published(?:/updated)?|Model Release Date|Release Date)\s*[:*\s]*[^\n]{0,30}(?:\n[^\n]{0,120}){0,3}', 'publication'),
            (r'\A\s*20\d\d-\d{1,2}-\d{1,2}', 'publication'),
            (r'(?:Model card updated|Last updated)\s*[:*\s]*[^\n]{0,100}(?:\n[^\n]{0,80})?', 'updated'),
        ]:
            match = re.search(pattern, text, re.I)
            if match and dateof(match[0]):
                evidence, kind = match[0], ('updated' if '/updated' in match[0].lower() else basis)
                break
        for ident, excerpt in {
            '209f2a74a248': '2026-08-12: Qwen3.8-2.4T-A95B is now available',
            'ef742a03b510': '2025/08/20',
        }.items():
            if row['id'] == ident and excerpt in text:
                evidence = excerpt
        if evidence and dateof(evidence):
            overrides[row['id']] = dict(date=dateof(evidence), dateBasis=kind,
                source=row['source_url'], source_sha256=row['sha256'], evidence=evidence.strip())
    (root/'_data/reading-dates.json').write_text(json.dumps(overrides, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(json.dumps({'new_dates': len(overrides)}))

if __name__ == '__main__':
    main()
