"""Prepare hash-addressed public documents outside Git for the server library.

Uses only catalog originals and terminal translation outputs. No job logs,
accounts, caches or internal knowledge files enter this export.
"""
from __future__ import annotations
import argparse
from copy import deepcopy
from datetime import datetime, timezone
import hashlib
import html
import json
from pathlib import Path
from urllib.parse import urljoin

import markdown
import nh3


def digest(path):
    with path.open('rb') as f:
        return hashlib.file_digest(f, 'sha256').hexdigest()


def render_snapshot(text, title, source):
    attributes=deepcopy(nh3.ALLOWED_ATTRIBUTES)
    attributes['*']={'id','title'}
    attributes['img']={'src','alt','width','height'}
    fragment=markdown.markdown(text, extensions=['tables','fenced_code','sane_lists'])
    fragment=nh3.clean(fragment,attributes=attributes,url_schemes={'https','http','mailto'},
        url_relative=lambda u: u if u.startswith('#') else urljoin(source.rstrip('/')+'/',u))
    return '''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<title>'''+html.escape(title)+'''</title><style>
body{margin:0 auto;padding:32px 24px;max-width:820px;color:#292d30;background:#fff;font:17px/1.8 Georgia,"Noto Serif SC",serif;overflow-wrap:anywhere}h1,h2,h3{line-height:1.35;font-weight:500}h1{font-size:1.9em}h2{margin-top:2em;font-size:1.4em}a{color:#365e75}img{max-width:100%;height:auto}pre{padding:16px;background:#f7f6f2;overflow:auto;font-size:13px}code{font-size:.85em}table{display:block;overflow:auto;border-collapse:collapse;max-width:100%;font-size:.9em}td,th{padding:8px 12px;border-bottom:1px solid #ddd;text-align:left}blockquote{margin-left:0;padding-left:18px;border-left:2px solid #d5d1c7;color:#62676b}hr{border:0;border-top:1px solid #ddd;margin:28px 0}
</style></head><body>'''+fragment+'</body></html>'


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--source',type=Path,required=True)
    p.add_argument('--output',type=Path,required=True)
    p.add_argument('--base-url',default='https://yechengzhang.duqi.top/reading/files')
    args=p.parse_args(); source=args.source.resolve(strict=True);out=args.output.resolve()
    out.mkdir(parents=True,exist_ok=True);rendered=out/'rendered';rendered.mkdir(exist_ok=True)
    catalog=json.loads((source/'catalog.json').read_text(encoding='utf-8-sig'))
    records={}
    for f in (source/'_translation/reports').glob('*.json'):
        r=json.loads(f.read_text(encoding='utf-8'))
        if r.get('status')=='complete':records[r['id']]=r
    files=[];reports={}
    def add(path,ident,kind,expected=None):
        path=path.resolve(strict=True)
        assert path.is_relative_to(source) or path.is_relative_to(rendered)
        sha=digest(path)
        assert expected is None or sha==expected, f'Hash mismatch: {ident}:{kind}'
        ext=path.suffix.lower();assert ext in {'.pdf','.md','.html'}
        if ext=='.pdf':
            with path.open('rb') as f:assert f.read(5)==b'%PDF-',ident
        name=f'{ident}.{sha[:16]}.{kind}{ext}'
        size=path.stat().st_size
        files.append({'local_path':str(path),'name':name,'sha256':sha,'bytes':size})
        return {'url':args.base_url.rstrip('/')+'/'+name,'bytes':size,'sha256':sha,'format':ext[1:]}
    for row in catalog:
        ident=row['id'];assets={}
        original=source/row['local_path']
        assets['original']=add(original,ident,'original',row['sha256'])
        if original.suffix.lower()=='.md':
            target=rendered/(ident+'.html')
            target.write_text(render_snapshot(original.read_text(encoding='utf-8'),row['title'],row['source_url']),encoding='utf-8')
            preview=add(target,ident,'preview')
            preview['download_url']=assets['original']['url']
            preview['source_sha256']=assets['original']['sha256']
            assets['original']=preview
        if ident in records:
            r=records[ident]
            assert r['source_sha256']==row['sha256'],f'Translation source mismatch: {ident}'
            for kind in ['zh','dual']:
                if kind in r.get('links',{}):
                    assets[kind]=add(source/r['links'][kind],ident,kind,r['output_sha256'][kind])
        reports[ident]={'source_sha256':row['sha256'],'version':row.get('downloaded_version') or row.get('version') or '', 'assets':assets}
    assert len(reports)==len(catalog)
    manifest={'schema_version':1,'created_at':datetime.now(timezone.utc).isoformat(),'catalog_sha256':digest(source/'catalog.json'),'reports':reports}
    (out/'assets-public.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
    plan={'created_at':manifest['created_at'],'guide':'Guide: no material change','files':files,'bytes':sum(f['bytes'] for f in files),'file_count':len(files),'report_count':len(reports),'translated_count':sum('zh' in r['assets'] for r in reports.values()),'public_manifest_sha256':digest(out/'assets-public.json')}
    (out/'upload-plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({k:v for k,v in plan.items() if k!='files'},ensure_ascii=True))


if __name__=='__main__':main()
