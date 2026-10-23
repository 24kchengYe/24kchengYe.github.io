"""Export the public reading library with verified server assets or the PDF pilot.

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
from validate_reading_report_topics import load_report_topics

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
    report_topics = load_report_topics(public['reports'], ROOT)
    publication = json.loads((ROOT / '_data/reading-publication.json').read_text(encoding='utf-8'))
    pilot = {r['id']:r for r in publication['reports']}
    asset_manifest_path=ROOT/'_data/reading-assets.json'
    remote=json.loads(asset_manifest_path.read_text(encoding='utf-8')) if asset_manifest_path.exists() else None
    if remote:
        assert remote['catalog_sha256']==digest(catalog_path), 'Rebuild the server asset manifest for this catalog'
        assert set(remote['reports'])=={r['id'] for r in catalog}
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
    inventory = {'created_at':timestamp,'guide':'Guide: no material change','scope':'Public catalog and verified server document manifest' if remote else 'Public catalog, finished editions, two-report layout pilot',
                 'input_hashes':{'catalog':digest(catalog_path),'public_metadata':digest(public_path),
                                 'report_topics':digest(ROOT/'_data/reading-report-topics.json'),
                                 'shared_taxonomy':digest(ROOT/'_data/reading-learning.json')},'sources':[], 'editions':[]}
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
             'core':len(public['core']),'online':len(remote['reports']) if remote else len(pilot),'companies':len({r['company'] for r in catalog}),
             'original_bytes':sum(r['bytes'] for r in inventory['sources']),
             'zh_bytes':sum(r['bytes'] for r in inventory['editions'] if r['kind']=='zh'),
             'dual_bytes':sum(r['bytes'] for r in inventory['editions'] if r['kind']=='dual'),
             'formats':dict(Counter(r['format'] for r in inventory['sources']))}
    preview_path=ROOT/'_data/reading-previews.json'
    previews=json.loads(preview_path.read_text(encoding='utf-8')) if preview_path.exists() else {}
    date_overrides=json.loads((ROOT/'_data/reading-dates.json').read_text(encoding='utf-8')) if (ROOT/'_data/reading-dates.json').exists() else {}
    published=[]
    for report in public['reports']:
        r=dict(report); source_record=by_id[r['id']]
        if r['id'] in date_overrides:
            override=date_overrides[r['id']]
            assert override['source_sha256']==source_record['sha256']
            r.update(date=override['date'],dateBasis=override['dateBasis'])
        r.update(topicId=report_topics[r['id']],pages=source_record.get('pages'),version=source_record.get('downloaded_version') or source_record.get('version') or '',
                 translation='generated' if r['id'] in records else 'none',assets=None,quality=None)
        if remote:
            entry=remote['reports'][r['id']]
            assert entry['source_sha256']==source_record['sha256'] and entry['version']==r['version']
            assert 'original' in entry['assets']
            assert set(entry['assets']).issubset({'original','zh','dual'})
            for kind, asset in entry['assets'].items():
                assert re.fullmatch(r'https://yechengzhang\.duqi\.top/reading/files/[a-z0-9.-]+',asset['url'])
                assert re.fullmatch(r'[a-f0-9]{64}',asset['sha256']) and asset['bytes']>0
                assert asset['format'] in {'pdf','html','md'}
                if kind in {'zh','dual'}:
                    assert asset['sha256']==records[r['id']]['output_sha256'][kind]
                elif asset['format']!='html':
                    assert asset['sha256']==source_record['sha256']
                else:
                    assert asset['source_sha256']==source_record['sha256']
            r['assets']=entry['assets']
        elif r['id'] in pilot:
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
        if r['assets']:
            for asset in r['assets'].values():
                if asset['format']=='pdf' and asset['sha256'] in previews:
                    asset['preview']=previews[asset['sha256']]
        if r['assets'] and any(k in r['assets'] for k in ['zh','dual']):
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
    inventory['published_bytes']=sum(a['bytes'] for r in published if r['assets'] for a in r['assets'].values())
    write_json(ROOT/'_preview/library/inventory.json',inventory)
    print(json.dumps({'stats':stats,'published_bytes':inventory['published_bytes'],'export_bytes':len(serialized.encode())},ensure_ascii=True))

if __name__=='__main__':main()
