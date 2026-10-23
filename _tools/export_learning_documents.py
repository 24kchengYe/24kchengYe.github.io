"""Publish the authorized Foundation Models collection, with an audited asset closure.

Only Markdown, PDFs and linked images beneath the named source directory are read.
Source claims are preserved. Missing references are recorded, not fabricated.
"""
import argparse
from collections import Counter
from copy import deepcopy
import hashlib
import html
import json
from pathlib import Path
import re
import subprocess
from urllib.parse import unquote, urlsplit
import markdown
from bs4 import BeautifulSoup
import nh3

ALLOWED = {'.md', '.pdf', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'}
MATH = re.compile(r'(```[\s\S]*?```|`[^`\n]+`)|(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|(?<![\\$])\$(?!\s|\$)[^$\n]+?(?<!\s)\$(?!\$))')
CSS = '''body{margin:0 auto;max-width:860px;padding:28px 28px 80px;background:#fff;color:#292d30;font:17px/1.85 Georgia,"Noto Serif SC",serif;overflow-wrap:anywhere}nav{display:flex;justify-content:space-between;gap:16px;border-bottom:1px solid #e2e4e6;padding-bottom:18px;margin-bottom:42px;font:14px/1.5 Arial,sans-serif;color:#69747c}h1{font-size:32px;line-height:1.4;font-weight:500;margin:0 0 28px}h2{font-size:25px;margin-top:2.1em;font-weight:500;line-height:1.45}h3{font-size:21px;line-height:1.5;margin-top:1.8em}a{color:#365e75;text-underline-offset:4px}img{display:block;max-width:100%;height:auto;margin:24px auto}pre{background:#f6f6f4;padding:18px;overflow:auto;font:13px/1.65 monospace}code{font-size:.85em}table{display:block;max-width:100%;overflow:auto;border-collapse:collapse;font-size:14px}td,th{border-bottom:1px solid #deded8;padding:9px 12px;text-align:left}blockquote{margin-left:0;padding-left:20px;border-left:2px solid #d6d4cd;color:#59626a}hr{border:0;border-top:1px solid #ddd;margin:32px 0}math[display="block"]{display:block;max-width:100%;overflow:auto;padding:14px 0}math{font-size:1.05em}.unavailable{color:#767e82;text-decoration:underline dotted;text-underline-offset:4px}.source-meta{font:13px/1.6 Arial,sans-serif;color:#69747c}summary{cursor:pointer}@media(max-width:600px){body{padding:20px 18px 60px;font-size:16px}h1{font-size:25px}h2{font-size:22px}nav{margin-bottom:28px}}'''

def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--katex', type=Path, required=True)
    args = parser.parse_args()
    source = args.source.resolve(strict=True)
    root = source.parent
    out = args.output.resolve()
    out.mkdir(parents=True, exist_ok=True)
    rendered = out/'rendered'
    rendered.mkdir(exist_ok=True)
    raw = source.read_text(encoding='utf-8-sig')
    anchors = list(re.finditer(r'<a id="([^"]+)"\s*></a>', raw))
    chapters = {}
    for index, match in enumerate(anchors):
        if match[1].startswith('toc-'):
            end = anchors[index+1].start() if index+1 < len(anchors) else len(raw)
            body = raw[match.end():end].strip()
            if re.search(r'^###\s+', body, re.M):
                chapters[match[1]] = body
    texts = {source: raw[raw.index('<a id="sec-001"'):]}
    queue = [source]
    files = {}
    missing, outside, unsupported = set(), set(), set()
    basename = {}
    for path in root.rglob('*'):
        if path.is_file() and path.suffix.lower() in ALLOWED:
            basename.setdefault(path.name.casefold(), []).append(path)
    repairs = {}

    def resolve(current, link):
        parsed = urlsplit(link)
        if parsed.scheme or parsed.netloc or not parsed.path:
            return None
        path = (current.parent/unquote(parsed.path)).resolve()
        if not path.is_relative_to(root):
            outside.add(link)
            return None
        if path.suffix.lower() not in ALLOWED:
            unsupported.add(str(path.relative_to(root)))
            return None
        if not path.is_file():
            # Repair only an unambiguous same-article asset, never an unrelated basename.
            article = next((p for p in current.parents if p.parent.name == 'linked-docs'), None)
            candidates = [p for p in basename.get(path.name.casefold(), []) if article and p.is_relative_to(article)]
            if len(candidates) == 1:
                repairs[str(path.relative_to(root))] = str(candidates[0].relative_to(root))
                return candidates[0]
            missing.add(str(path.relative_to(root)))
            return None
        return path

    while queue:
        current = queue.pop()
        soup = BeautifulSoup(markdown.markdown(texts[current], extensions=['tables','fenced_code']), 'html.parser')
        for element in soup.find_all(['a','img']):
            link = element.get('href') if element.name == 'a' else element.get('src')
            if not link:
                continue
            path = resolve(current, link)
            if path is None:
                continue
            if path not in files:
                files[path] = {'sha256': digest(path), 'bytes': path.stat().st_size}
            if path.suffix.lower() == '.md' and path not in texts:
                texts[path] = path.read_text(encoding='utf-8-sig')
                queue.append(path)
    # Directory addresses derive from source contents AND renderer, so nested links
    # remain immutable even if a referenced document changes later.
    signature = digest(Path(__file__)) + digest(Path(__file__).with_name('learning_math.cjs')) + digest(source) + json.dumps(sorted((str(p.relative_to(root)),v['sha256']) for p,v in files.items()))
    version = hashlib.sha256(signature.encode()).hexdigest()[:16]
    base = 'https://yechengzhang.duqi.top/reading/learning-files/'+version+'/'
    names = {p: (hashlib.sha256(p.relative_to(root).as_posix().encode()).hexdigest()[:24]+'.html' if p.suffix.lower()=='.md' else v['sha256']+p.suffix.lower()) for p,v in files.items()}
    chapter_names = {ident: ident+'.html' for ident in chapters}
    equations = []
    math_errors = []
    math_repairs = []

    def protect_math(text):
        def replace(match):
            if match[1]:
                return match[0]
            value = match[2]
            display = value.startswith(('$$', '\\['))
            trim = 2 if value.startswith(('$$', '\\[', '\\(')) else 1
            index = len(equations)
            equations.append({'tex':value[trim:-trim], 'display':display})
            return f'LEARNINGMATHPLACEHOLDER{index}END'
        return MATH.sub(replace, text)

    attrs = deepcopy(nh3.ALLOWED_ATTRIBUTES)
    attrs['*'] = {'id','title','class'}
    attrs['img'] = {'src','alt','width','height','loading','decoding'}
    attrs['a'] = {'href','title','target'}
    documents = []

    def render(current, text, name, title=None, chapter=None):
        fragment = markdown.markdown(protect_math(text), extensions=['tables','fenced_code','sane_lists','toc'])
        soup = BeautifulSoup(fragment, 'html.parser')
        for element in soup.find_all(['a','img']):
            key = 'href' if element.name == 'a' else 'src'
            link = element.get(key)
            if not link:
                continue
            parsed = urlsplit(link)
            if not parsed.scheme and not parsed.netloc and parsed.path:
                path = resolve(current, link)
                if path in names:
                    element[key] = base+names[path]+('#'+parsed.fragment if parsed.fragment else '')
                elif path == source and parsed.fragment in chapter_names:
                    element[key] = base+chapter_names[parsed.fragment]
                else:
                    if element.name == 'a':
                        element.name='span';element.attrs={'class':'unavailable','title':'参考文件未收录'}
                    else:
                        element.name='span';element.string=element.get('alt') or '图片未收录';element.attrs={'class':'unavailable'}
            if element.name == 'img':
                element['loading']='lazy';element['decoding']='async'
            if element.name == 'a':
                element['target']='_blank'
        fragment = nh3.clean(str(soup), attributes=attrs, url_schemes={'http','https','mailto'})
        if title is None:
            heading = soup.find(re.compile('^h[1-6]$'))
            title = heading.get_text(' ',strip=True) if heading else current.stem
        if chapter:
            fragment = re.sub(r'<h3([^>]*)>(.*?)</h3>',r'<h1\1>\2</h1>',fragment,count=1,flags=re.S)
        back = 'https://yechengzhang.duqi.top/reading/?lang=zh&collection=learning'+('&book='+chapter if chapter else '')
        documents.append((name, '<!doctype html><html lang="zh"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+html.escape(title)+' · Yecheng Zhang</title><style>'+CSS+'</style></head><body><nav><a href="'+back+'" target="_top">← AI 技术学习</a><span>Foundation Models · 解读原文</span></nav><main>'+fragment+'</main></body></html>'))

    for path,text in texts.items():
        if path in names:
            render(path,text,names[path])
    for ident,text in chapters.items():
        render(source,text,chapter_names[ident],chapter=ident)
    (out/'math-input.json').write_text(json.dumps(equations,ensure_ascii=False),encoding='utf-8')
    subprocess.run(['node',str(Path(__file__).with_name('learning_math.cjs')),str(args.katex.resolve()),str(out/'math-input.json'),str(out/'math-output.json')],check=True)
    math = json.loads((out/'math-output.json').read_text(encoding='utf-8'))
    plan = {}
    def add(path,name):
        plan[name]={'name':name,'local_path':str(path),'sha256':digest(path),'bytes':path.stat().st_size}
    for name,body in documents:
        def restore(match):
            index = int(match[1]);item=math[index]
            if 'html' in item:
                if item.get('repair'):math_repairs.append({'document':name,'original':equations[index]['tex'],'rendered':item['repair']})
                return item['html']
            math_errors.append({'document':name,'tex':equations[index]['tex'],'error':item['error']})
            return '<code>'+html.escape(equations[index]['tex'])+'</code>'
        body = re.sub(r'LEARNINGMATHPLACEHOLDER(\d+)END',restore,body)
        target = rendered/name
        target.write_text(body,encoding='utf-8')
        add(target,name)
    for path in files:
        if path.suffix.lower() != '.md':
            add(path,names[path])
        else:
            add(path,files[path]['sha256']+'.md')
    add(source,digest(source)+'.md')
    manifest = {'version':version,'base_url':base,'chapters':{ident:{'url':base+name,'bytes':plan[name]['bytes'],'sha256':plan[name]['sha256']} for ident,name in chapter_names.items()}}
    (out/'assets-public.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
    audit={'version':version,'source_sha256':digest(source),'files':list(plan.values()),'bytes':sum(v['bytes'] for v in plan.values()),'chapters':len(chapters),'documents':len(documents),'formats':dict(Counter(Path(n).suffix for n in plan)), 'repairs':repairs,'missing':sorted(missing),'outside':sorted(outside),'unsupported':sorted(unsupported),'math_count':len(equations),'math_errors':math_errors,'math_repairs':math_repairs,'guide':'Guide: no material change'}
    assert digest(source) == hashlib.sha256(source.read_bytes()).hexdigest()
    (out/'upload-plan.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({k:audit[k] for k in ['version','bytes','chapters','documents','formats','math_count']}))
    print(json.dumps({'missing':len(missing),'outside':len(outside),'repairs':len(repairs),'math_errors':len(math_errors)}))

if __name__ == '__main__':
    main()
