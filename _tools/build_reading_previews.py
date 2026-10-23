"""Create small first-page images for instant reading while PDF.js initializes."""
import argparse
from concurrent.futures import ProcessPoolExecutor, as_completed
import hashlib
import json
from pathlib import Path
import fitz
from PIL import Image

def create(task):
    row,out=task
    target=Path(out)/(row['sha256']+'.webp')
    if not target.exists():
        with fitz.open(row['local_path']) as pdf:
            page=pdf[0]
            pix=page.get_pixmap(matrix=fitz.Matrix(1500/page.rect.width,1500/page.rect.width),alpha=False,colorspace=fitz.csRGB)
            Image.frombytes('RGB',(pix.width,pix.height),pix.samples).save(target,'WEBP',quality=88,method=4)
    with Image.open(target) as image:
        width,height=image.size
    return row['sha256'],{'name':target.name,'local_path':str(target),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'bytes':target.stat().st_size,'width':width,'height':height}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--plan',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    args.output.mkdir(parents=True,exist_ok=True)
    plan=json.loads(args.plan.read_text(encoding='utf-8'))
    rows={r['sha256']:r for r in plan['files'] if r['name'].endswith('.pdf')}
    results={}
    with ProcessPoolExecutor(max_workers=2) as pool:
        for future in as_completed([pool.submit(create,(r,str(args.output.resolve()))) for r in rows.values()]):
            source,row=future.result();results[source]=row
            if len(results)%100==0: print(json.dumps({'completed':len(results),'total':len(rows)}),flush=True)
    # Image filenames are based on their actual bytes, not the source PDF hash.
    public={}
    for source,row in results.items():
        path=Path(row['local_path']);name=row['sha256']+'.webp';target=args.output/name
        if path!=target and not target.exists(): path.rename(target)
        row.update(name=name,local_path=str(target.resolve()))
        public[source]={k:row[k] for k in ['sha256','bytes','width','height']}
        public[source]['url']='https://yechengzhang.duqi.top/reading/previews/'+name
    (args.output/'manifest.json').write_text(json.dumps(public,indent=2),encoding='utf-8')
    (args.output/'upload-plan.json').write_text(json.dumps({'files':list({r['name']:r for r in results.values()}.values())},indent=2),encoding='utf-8')
    print(json.dumps({'completed':len(results),'bytes':sum(r['bytes'] for r in results.values())}),flush=True)

if __name__=='__main__':
    main()
