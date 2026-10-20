const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const root = path.join(__dirname, '..');
const slugs = ['spec-generation', 'spec-repair', 'rubric-model'];
const policy = "default-src 'none'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'none'; font-src 'none'; base-uri 'none'; form-action 'none'";
const navigation = slug => `<nav class="report-site-nav" aria-label="Writing">
  <a href="/#writing" data-site-link><span lang="en">← Selected writing</span><span lang="zh">← 精选写作</span><span lang="ja">← 執筆記事</span></a>
  <a href="/writing/${slug}/technical/"><span lang="en">Technical report · Chinese →</span><span lang="zh">技术报告 →</span><span lang="ja">技術レポート（中国語）→</span></a>
  <div class="languages" role="group" aria-label="Language">
    <button type="button" data-language="en" aria-label="English">EN</button>
    <button type="button" data-language="zh" aria-label="中文">中</button>
    <button type="button" data-language="ja" aria-label="日本語">日</button>
  </div>
</nav>`;

function sizeFigures(document) {
  for (const image of document.querySelectorAll('img[src^="/writing/assets/"]')) {
    const source = image.getAttribute('src');
    if (!source.endsWith('.png')) continue;
    const bytes = fs.readFileSync(path.join(root, source));
    if (bytes.subarray(1, 4).toString() !== 'PNG') throw new Error(`Invalid PNG: ${source}`);
    image.width = bytes.readUInt32BE(16);
    image.height = bytes.readUInt32BE(20);
  }
}

function build(slug) {
  const source = fs.readFileSync(path.join(root, '_data/writing', `${slug}.html`), 'utf8');
  const translations = JSON.parse(fs.readFileSync(path.join(root, '_data/writing', `${slug}.json`), 'utf8'));
  const dom = new JSDOM(source);
  const { document, NodeFilter } = dom.window;
  document.querySelector('.report-site-nav')?.remove();
  document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.setAttribute('content', policy);
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.parentElement.closest('script,style') && /[\u3400-\u9fff]/u.test(node.textContent)) nodes.push(node);
  }
  for (const node of nodes) {
    const original = node.textContent.trim();
    const pair = translations[original];
    if (!pair || pair.length !== 2 || pair.some(value => typeof value !== 'string' || !value.trim())) throw new Error(`Missing translation: ${slug}: ${original}`);
    const fragment = document.createDocumentFragment();
    for (const [language, value] of [['zh', original], ['en', pair[0]], ['ja', pair[1]]]) {
      const span = document.createElement('span');
      span.lang = language;
      span.textContent = node.textContent.replace(original, value);
      fragment.append(span);
    }
    node.replaceWith(fragment);
  }
  for (const element of document.querySelectorAll('[alt],[title],[aria-label]')) {
    for (const attribute of ['alt', 'title', 'aria-label']) {
      const original = element.getAttribute(attribute);
      if (!original || !/[\u3400-\u9fff]/u.test(original)) continue;
      const pair = translations[original];
      if (!pair) throw new Error(`Missing attribute: ${slug}: ${original}`);
      for (const [language, value] of [['zh', original], ['en', pair[0]], ['ja', pair[1]]]) element.setAttribute(`data-${attribute}-${language}`, value);
    }
  }
  document.documentElement.lang = 'zh';
  document.querySelector('h1').setAttribute('data-page-title', '');
  document.querySelector('link[rel="canonical"]').href = `https://24kchengye.github.io/writing/${slug}/`;
  document.querySelector('meta[property="og:url"]').content = `https://24kchengye.github.io/writing/${slug}/`;
  sizeFigures(document);
  document.querySelector('img[src]')?.setAttribute('loading', 'eager');
  document.body.insertAdjacentHTML('afterbegin', navigation(slug));
  const figureNote = document.createElement('p');
  figureNote.className = 'figure-language-note';
  figureNote.innerHTML = '<span lang="en">Figures retain their original Chinese labels; captions and the full article are translated.</span><span lang="ja">図中の表記は中国語の原図を保持しています。図の説明と本文は翻訳しています。</span>';
  document.querySelector('h1').insertAdjacentElement('afterend', figureNote);
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = '/assets/css/writing-language.css';
  document.head.append(stylesheet);
  const script = document.createElement('script');
  script.src = '/assets/js/minimal.js?v=writing-i18n-2';
  script.defer = true;
  document.head.append(script);
  const output = dom.serialize() + '\n';
  fs.writeFileSync(path.join(root, 'writing', slug, 'index.html'), output);
  if (slug === 'spec-generation') fs.writeFileSync(path.join(root, 'writing', slug, 'essay/index.html'), output);
  dom.window.close();
}

for (const slug of slugs) build(slug);
for (const slug of slugs) {
  const file = path.join(root, 'writing', slug, 'technical/index.html');
  const dom = new JSDOM(fs.readFileSync(file, 'utf8'));
  dom.window.document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.setAttribute('content', policy);
  dom.window.document.querySelector('.report-site-nav a:nth-child(2)').href = `/writing/${slug}/`;
  sizeFigures(dom.window.document);
  dom.window.document.querySelector('img[src]')?.setAttribute('loading', 'eager');
  fs.writeFileSync(file, dom.serialize() + '\n');
  dom.window.close();
}
