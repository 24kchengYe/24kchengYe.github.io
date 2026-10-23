"""Resume a bounded, manifest-driven SFTP upload; verify SHA256 before publish."""
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import json
from pathlib import Path
import posixpath
import re
import threading
import time
import paramiko


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--plan',type=Path,required=True)
    p.add_argument('--status',type=Path,required=True)
    p.add_argument('--host',required=True)
    p.add_argument('--key',type=Path,required=True)
    p.add_argument('--destination',default='/opt/yechengzhang-academic/releases/library-files')
    p.add_argument('--workers',type=int,default=2)
    p.add_argument('--mib-per-second',type=float,default=6)
    args=p.parse_args()
    assert 1<=args.workers<=3 and 0<args.mib_per_second<=10
    assert args.destination=='/opt/yechengzhang-academic/releases/library-files'
    plan=json.loads(args.plan.read_text(encoding='utf-8'))
    for row in plan['files']:
        assert re.fullmatch(r'[a-z0-9.-]+',row['name']) and '/' not in row['name'] and '..' not in row['name']
        assert re.fullmatch(r'[a-f0-9]{64}',row['sha256'])
        assert Path(row['local_path']).stat().st_size==row['bytes']
    state={'started_at':time.time(),'total_files':len(plan['files']),'total_bytes':sum(r['bytes'] for r in plan['files']),'completed':{},'active':{},'errors':[],'status':'running'}
    lock=threading.Lock();local=threading.local();clients=[];lastwrite=[0.]
    def save(force=False):
        now=time.time()
        if not force and now-lastwrite[0]<1:return
        lastwrite[0]=now
        state['updated_at']=now
        state['completed_bytes']=sum(state['completed'].values())
        state['transferred_in_active_files']=sum(state['active'].values())
        tmp=args.status.with_suffix('.tmp');tmp.write_text(json.dumps(state,indent=2),encoding='utf-8');tmp.replace(args.status)
    def connection():
        if not hasattr(local,'client'):
            c=paramiko.SSHClient();c.load_system_host_keys()
            c.connect(args.host,username='ubuntu',key_filename=str(args.key),allow_agent=False,look_for_keys=False,timeout=15,banner_timeout=20)
            c.get_transport().set_keepalive(20)
            local.client=c;local.sftp=paramiko.SFTPClient.from_transport(c.get_transport(),window_size=8*1024*1024)
            with lock:clients.append(c)
        return local.client,local.sftp
    def remote_hash(c,path):
        _,out,err=c.exec_command('sha256sum -- '+path,timeout=60)
        value=out.read().decode().split()
        code=out.channel.recv_exit_status()
        return value[0] if code==0 and value else None
    def upload(row):
        name=row['name'];target=posixpath.join(args.destination,name);partial=target+'.part'
        for attempt in range(1,4):
            try:
                c,sftp=connection()
                try:exists=sftp.stat(target).st_size==row['bytes']
                except FileNotFoundError:exists=False
                if exists:
                    assert remote_hash(c,target)==row['sha256'],'Existing destination hash mismatch'
                else:
                    try:offset=sftp.stat(partial).st_size
                    except FileNotFoundError:offset=0
                    if offset>row['bytes']:offset=0
                    start=time.monotonic();sent=0
                    with Path(row['local_path']).open('rb') as src,sftp.open(partial,'ab' if offset else 'wb') as dst:
                        dst.set_pipelined(True);src.seek(offset)
                        while block:=src.read(256*1024):
                            dst.write(block);sent+=len(block)
                            pause=sent/(args.mib_per_second*1024*1024/args.workers)-(time.monotonic()-start)
                            if pause>0:time.sleep(pause)
                            with lock:state['active'][name]=offset+sent;save()
                    assert remote_hash(c,partial)==row['sha256'],'Uploaded hash mismatch'
                    sftp.chmod(partial,0o644);sftp.posix_rename(partial,target)
                with lock:
                    state['completed'][name]=row['bytes'];state['active'].pop(name,None);save(True)
                return
            except Exception as e:
                with lock:state['errors'].append({'file':name,'attempt':attempt,'type':type(e).__name__,'message':str(e)[:200]});save(True)
                if hasattr(local,'client'):
                    local.client.close();del local.client;del local.sftp
                if attempt==3:raise
                time.sleep(2*attempt)
    args.status.parent.mkdir(parents=True,exist_ok=True)
    with lock:save(True)
    try:
        with ThreadPoolExecutor(max_workers=args.workers) as pool:
            for f in as_completed([pool.submit(upload,row) for row in plan['files']]):f.result()
        state['status']='complete'
    except Exception:
        state['status']='failed';raise
    finally:
        with lock:save(True)
        for c in clients:c.close()
    print(json.dumps({'status':state['status'],'files':len(state['completed']),'bytes':state['completed_bytes'],'seconds':round(time.time()-state['started_at'],1),'retry_events':len(state['errors'])}))


if __name__=='__main__':main()
