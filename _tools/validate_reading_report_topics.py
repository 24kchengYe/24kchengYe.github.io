"""Validate reviewed report topics against the shared AI-learning taxonomy.

After export_reading.py adds or changes a report, review its primary subject and
add/update the stable ID, exact title and topicId in reading-report-topics.json.
Run this validator before build_reading_library.py. No default topic is inferred;
incomplete updates fail rather than silently filling the Foundation models shelf.
"""
from __future__ import annotations

import argparse
from collections import Counter
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def unique_objects(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f'Duplicate JSON key in report topics: {key}')
        result[key] = value
    return result


def load_report_topics(reports: list[dict], root: Path = ROOT) -> dict[str, str]:
    """Return exact one-topic-per-report assignments or raise on catalog drift."""
    path = root / '_data/reading-report-topics.json'
    reviewed = json.loads(path.read_text(encoding='utf-8'), object_pairs_hook=unique_objects)
    taxonomy = json.loads((root / '_data/reading-learning.json').read_text(encoding='utf-8'))
    topic_ids = [book['id'] for book in taxonomy['books']]
    if len(topic_ids) != len(set(topic_ids)):
        raise ValueError('Duplicate topic ID in AI-learning taxonomy')
    if reviewed.get('schema_version') != 1 or reviewed.get('taxonomy') != 'reading-learning.json:books':
        raise ValueError('Unsupported report topic schema or taxonomy')
    assignments = reviewed.get('reports')
    if not isinstance(assignments, dict):
        raise ValueError('Report topic assignments must be an object keyed by report ID')
    catalog = {r['id']: r for r in reports}
    if len(catalog) != len(reports):
        raise ValueError('Duplicate report ID in public bibliography')
    missing = sorted(catalog.keys() - assignments.keys())
    stale = sorted(assignments.keys() - catalog.keys())
    if missing or stale:
        raise ValueError(f'Review reading-report-topics.json: unclassified IDs={missing}; removed IDs={stale}')
    result = {}
    for ident, entry in assignments.items():
        if not re.fullmatch(r'[0-9a-f]{12}', ident):
            raise ValueError(f'Invalid report ID in topic mapping: {ident}')
        if not isinstance(entry, dict) or set(entry) != {'topicId', 'title'}:
            raise ValueError(f'Unexpected report topic fields: {ident}')
        if entry['topicId'] not in topic_ids:
            raise ValueError(f'Unknown topic for {ident}: {entry["topicId"]}')
        if entry['title'] != catalog[ident]['title']:
            raise ValueError(f'Review topic after report title change: {ident}')
        result[ident] = entry['topicId']
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT)
    args = parser.parse_args()
    root = args.root.resolve(strict=True)
    public = json.loads((root / '_data/reading.json').read_text(encoding='utf-8'))
    taxonomy = json.loads((root / '_data/reading-learning.json').read_text(encoding='utf-8'))
    assignments = load_report_topics(public['reports'], root)
    counts = Counter(assignments.values())
    print(json.dumps({
        'reports': len(assignments),
        'topics': {t['id']: {'title': t['title']['en'], 'reports': counts[t['id']]}
                   for t in taxonomy['books']},
    }, ensure_ascii=True, indent=2))


if __name__ == '__main__':
    main()
