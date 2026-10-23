"""Export the public reading library and a two-report PDF pilot.

Reads only the bibliography, translation terminal records and explicitly selected
public reports. Internal notes, credentials, logs and cache contents are never copied.
The local inventory is saved under ignored _preview/library/.
"""
from __future__ import annotations
import argparse
from collections import Counter
from datetime import datetime
from hashlib import sha256
import json
from pathlib import Path
import re
import shutil
import subprocess
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
QUALITY = {
    'd88dbc069c2f': {
        'en': 'Chinese edition: crowded table headers on pp. 9 and 61; some prompts and text remain in English.',
        'zh': '中文译本：第 9、61 页表头拥挤；部分提示模板和正文仍有英文。',
        'ja': '中国語訳：9・61 ページの表見出しが密集。一部のプロンプトと本文に英語が残っています。',
    },
    '0eac14151cad': {
        'en': 'Chinese edition: inline subscripts on pp. 8–9 need correction; some headings remain in English.',
        'zh': '中文译本：第 8–9 页部分行内下标错排；少量小标题未译。',
        'ja': '中国語訳：8–9 ページの行内数式の添字に組版の問題。一部の見出しは英語のままです。',
    },
}

def digest(path):
    return sha256(path.read_bytes()).hexdigest()

def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--source', type=Path, required=True)
    args = p.parse_args()
    source = args.source.resolve(strict=True)
    assert subprocess.run(['git','check-ignore','-q','_preview/library/inventory.json'],cwd=ROOT).returncode == 0
    catalog_path = source / 'catalog.json'
    catalog = json.loads(catalog_path.read_text(encoding='utf-8-sig'))
    public_path = ROOT / '_data/reading.json'
    public = json.loads(public_path.read_text(encoding='utf-8'))
    publication = json.loads((ROOT / '_data/reading-publication.json').read_text(encoding='utf-8'))
    pilot = {r['id']:r for r in publication['reports']}
    base_url = publication['asset_base_url']
    assert base_url.startswith('https://') or base_url in {'files/', '/reading/library-preview/files/'}
    by_id = {r['id']:r for r in catalog}
    assert len(by_id)==len(catalog)
    assert set(by_id)=={r['id'] for r in public['reports']}, 'Refresh the bibliography with export_reading.py first'
    records = {}
    for file in (source / '_translation/reports').glob('*.json'):
        record = json.loads(file.read_text(encoding='utf-8'))
        if record.get('status') == 'complete' and record.get('links') and all((source / x).is_file() for x in record['links'].values()):
            records[record['id']] = record
    assert set(records).issubset(by_id)
    timestamp = datetime.now(ZoneInfo('Asia/Shanghai')).isoformat(timespec='seconds')
    inventory = {'created_at':timestamp,'guide':'Guide: no material change','scope':'Public catalog, finished editions, two-report layout pilot',
                 'input_hashes':{'catalog':digest(catalog_path),'public_metadata':digest(public_path)},'sources':[], 'editions':[]}
    for row in catalog:
        file = source / row['local_path']
        assert file.is_file(), file
        inventory['sources'].append({'id':row['id'],'path':str(file),'bytes':file.stat().st_size,'format':file.suffix})
    for ident, record in records.items():
        for kind, name in record['links'].items():
            file = source / name
            inventory['editions'].append({'id':ident,'kind':kind,'path':str(file),'bytes':file.stat().st_size})
    stats = {'reports':len(catalog),'translated':len(records),'untranslated':len(catalog)-len(records),
             'selected':sum(r['selected'] for r in public['reports']),
             'selected_translated':sum(r['selected'] and r['id'] in records for r in public['reports']),
             'core':len(public['core']),'online':len(pilot),'companies':len({r['company'] for r in catalog}),
             'original_bytes':sum(r['bytes'] for r in inventory['sources']),
             'zh_bytes':sum(r['bytes'] for r in inventory['editions'] if r['kind']=='zh'),
             'dual_bytes':sum(r['bytes'] for r in inventory['editions'] if r['kind']=='dual'),
             'formats':dict(Counter(r['format'] for r in inventory['sources']))}
    published=[]
    for report in public['reports']:
        r=dict(report); source_record=by_id[r['id']]
        r.update(pages=source_record.get('pages'),version=source_record.get('downloaded_version') or source_record.get('version') or '',
                 translation='generated' if r['id'] in records else 'none',assets=None,quality=None)
        if r['id'] in pilot:
            publication_record=pilot[r['id']]
            assert r['version']==publication_record['source_version'], 'Source version changed; review the publication manifest'
            record=records[r['id']]
            assert record['source_sha256']==source_record['sha256']
            assets={}
            inputs={'original':source/source_record['local_path'],**{kind:source/file for kind,file in record['links'].items()}}
            for kind in ['original','zh','dual']:
                src=inputs[kind]
                assert src.suffix=='.pdf' and src.read_bytes()[:5]==b'%PDF-'
                name=f'{publication_record["filename_prefix"]}.{kind}.pdf'
                destination=ROOT/'reading/library-preview/files'/name
                destination.parent.mkdir(parents=True,exist_ok=True)
                expected=source_record['sha256'] if kind=='original' else record['output_sha256'][kind]
                assert digest(src)==expected, f'Source hash changed: {src}'
                if not destination.exists() or digest(destination)!=expected:
                    shutil.copyfile(src,destination)
                assert digest(destination)==expected
                assets[kind]={'url':base_url.rstrip('/')+'/'+name,'bytes':destination.stat().st_size,'sha256':expected}
            r['assets']=assets
            r['quality']=({'state':'sampled_with_issues','reviewed_at':'2026-10-21','summary':QUALITY[r['id']]}
                          if r['id'] in QUALITY else {'state':'not_reviewed','summary':{'en':'Machine translation; not reviewed.','zh':'机器译文，尚未校对。','ja':'機械翻訳・未校閲。'}})
        published.append(r)
    result={'schema_version':1,'collection_date':'2026-10-17','exported_at':timestamp,'stats':stats,'core':public['core'],'reports':published}
    serialized=json.dumps(result,ensure_ascii=False,separators=(',',':'))
    assert not re.search(r'\b[A-Za-z]:[\\/]',serialized)
    assert not any(s in serialized for s in ['dev-knowledge-base','larkoffice.com','account_profile','api_key','file://'])
    (ROOT/'assets/js/reading-library-data.js').write_text('window.ReadingLibrary = '+serialized+';\n',encoding='utf-8')
    inventory['stats']=stats
    inventory['published_assets']=[{'id':r['id'],'assets':r['assets']} for r in published if r['assets']]
    inventory['public_output_sha256']=digest(ROOT/'assets/js/reading-library-data.js')
    inventory['pilot_bytes']=sum(a['bytes'] for r in published if r['assets'] for a in r['assets'].values())
    write_json(ROOT/'_preview/library/inventory.json',inventory)
    print(json.dumps({'stats':stats,'pilot_bytes':inventory['pilot_bytes'],'export_bytes':len(serialized.encode())},ensure_ascii=True))

if __name__=='__main__':main()
