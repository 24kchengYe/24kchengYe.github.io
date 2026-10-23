"""Mirror exact public originals on the server, accepting only matching hashes."""
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import json
from pathlib import Path
import re
import threading
import time
import urllib.request


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--plan',type=Path,required=True)
    p.add_argument('--status',type=Path,required=True)
    p.add_argument('--destination',type=Path,default=Path('/opt/yechengzhang-academic/releases/library-files'))
    args=p.parse_args();assert str(args.destination)=='/opt/yechengzhang-academic/releases/library-files'
    rows=json.loads(args.plan.read_text())['files']
    state={'started_at':time.time(),'total_files':len(rows),'total_bytes':sum(r['bytes'] for r in rows),'completed':{},'active':{},'failures':[],'status':'running'}
    lock=threading.Lock();last=[0.]
    def save(force=False):
        now=time.time()
        if not force and now-last[0]<1:return
        last[0]=now;state['updated_at']=now;state['completed_bytes']=sum(state['completed'].values())
        tmp=args.status.with_suffix('.tmp');tmp.write_text(json.dumps(state,indent=2));tmp.replace(args.status)
    def digest(p):
        with p.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
    def fetch(row):
        name=row['name'];assert re.fullmatch(r'[a-z0-9.-]+',name) and '..' not in name
        assert row['url'].startswith('https://')
        target=args.destination/name;partial=args.destination/(name+'.fetch-part')
        if target.exists() and target.stat().st_size==row['bytes'] and digest(target)==row['sha256']:
            with lock:state['completed'][name]=row['bytes'];save(True)
            return
        try:
            start=time.monotonic();size=0;sha=hashlib.sha256()
            req=urllib.request.Request(row['url'],headers={'User-Agent':'AcademicLibraryMirror/1.0'})
            with urllib.request.urlopen(req,timeout=40) as response,partial.open('wb') as f:
                while block:=response.read(256*1024):
                    f.write(block);sha.update(block);size+=len(block)
                    assert size<=row['bytes']+1024*1024,'Remote file exceeds expected size'
                    delay=size/(3*1024*1024)-(time.monotonic()-start)
                    if delay>0:time.sleep(delay)
                    with lock:state['active'][name]=size;save()
            assert size==row['bytes'] and sha.hexdigest()==row['sha256'],'Source version/hash differs'
            partial.chmod(0o644);partial.replace(target)
            with lock:state['completed'][name]=size;state['active'].pop(name,None);save(True)
        except Exception as e:
            with lock:state['failures'].append({'name':name,'type':type(e).__name__,'message':str(e)[:180]});state['active'].pop(name,None);save(True)
    with lock:save(True)
    with ThreadPoolExecutor(max_workers=2) as pool:
        for f in as_completed([pool.submit(fetch,row) for row in rows]):f.result()
    with lock:state['status']='complete' if not state['failures'] else 'needs_local_fallback';save(True)
    print(json.dumps({k:v for k,v in state.items() if k not in {'completed','active'}}))


if __name__=='__main__':main()
