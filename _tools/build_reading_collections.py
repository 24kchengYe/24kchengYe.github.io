"""Build the public bookshelf data from reviewed metadata, without private notes."""
import json
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]

def main():
    learning = json.loads((ROOT / '_data/reading-learning.json').read_text(encoding='utf-8'))
    researchers = json.loads((ROOT / '_data/reading-researchers.json').read_text(encoding='utf-8'))
    payload = {'schemaVersion': 1, 'books': learning['books'], 'researchers': researchers['researchers']}
    ids = []
    urls = []
    report_ids = {r['id'] for r in json.loads((ROOT/'_data/reading.json').read_text(encoding='utf-8'))['reports']}
    for book in payload['books']:
        ids.append(book['id'])
        assert set(book) == {'id','title','topics','chapters'}
        for chapter in book['chapters']:
            ids.append(chapter['id'])
            assert set(chapter) == {'id','title','section','sourceUrls','reportIds'}
            assert set(chapter['reportIds']).issubset(report_ids)
            urls.extend(chapter['sourceUrls'])
    for person in payload['researchers']:
        ids.append(person['id'])
        assert set(person) == {'id','name','topics','url','articles'}
        urls.append(person['url'])
        for article in person['articles']:
            assert set(article) == {'title','url'}
            urls.append(article['url'])
    assert len(ids) == len(set(ids)), 'Duplicate bookshelf IDs'
    for url in urls:
        parsed = urlsplit(url)
        assert parsed.scheme in ('https','http') and parsed.hostname and not parsed.username and not parsed.password
        assert not any(parsed.hostname == host or parsed.hostname.endswith('.'+host) for host in ('larkoffice.com','feishu.cn','bytetech.info','localhost'))
    serialized = json.dumps(payload, ensure_ascii=False, separators=(',',':'))
    for private in ('file://','dev-knowledge-base','linked-docs/','foundation_notes/','D:/','D:\\','C:/','C:\\'):
        assert private not in serialized, private
    (ROOT/'assets/js/reading-collections-data.js').write_text('window.ReadingCollections = '+serialized+';\n', encoding='utf-8')
    print(json.dumps({'books':len(payload['books']),'entries':sum(len(b['chapters']) for b in payload['books']),'researchers':len(payload['researchers']),'bytes':len(serialized.encode())}))

if __name__ == '__main__':
    main()
