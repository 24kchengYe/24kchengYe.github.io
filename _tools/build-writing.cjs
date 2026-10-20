const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const { buildFigures } = require('./build-figures.cjs');

const root = path.join(__dirname, '..');
const slugs = ['spec-generation', 'spec-repair', 'rubric-model'];
const figures = buildFigures();
const policy = "default-src 'none'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'none'; font-src 'none'; base-uri 'none'; form-action 'none'";
const navigation = (slug, technical) => `<nav class="report-site-nav" aria-label="Writing">
  <a class="writing-back" href="/#writing" data-site-link><span lang="en">← Selected writing</span><span lang="zh">← 精选写作</span><span lang="ja">← 執筆記事</span></a>
  <div class="edition-switch" aria-label="Article version">
    <a href="/writing/${slug}/" data-site-link${!technical ? ' aria-current="page"' : ''}>Blog</a>
    <a href="/writing/${slug}/technical/" data-site-link${technical ? ' aria-current="page"' : ''}><span lang="en">Technical report</span><span lang="zh">技术报告</span><span lang="ja">技術レポート</span></a>
  </div>
  <div class="languages" role="group" aria-label="Language">
    <button type="button" data-language="en" aria-label="English">EN</button>
    <button type="button" data-language="zh" aria-label="中文">中</button>
    <button type="button" data-language="ja" aria-label="日本語">日</button>
  </div>
</nav>`;

function localizeFigures(document) {
  for (const image of document.querySelectorAll('img[src^="/writing/assets/"]')) {
    const source = image.getAttribute('src');
    const figure = figures[source];
    if (!figure) throw new Error(`Missing figure source: ${source}`);
    image.width = figure.width;
    image.height = figure.height;
    for (const language of ['en', 'zh', 'ja']) image.setAttribute(`data-src-${language}`, figure.localized[language]);
    image.src = figure.localized.zh;
    const container = image.closest('.figure-panel') || image.closest('figure');
    if (container) {
      const details = document.createElement('details');
      details.className = 'figure-source-link';
      details.innerHTML = `<summary><span lang="en">Figure source</span><span lang="zh">图源</span><span lang="ja">図のソース</span></summary>
        <a href="https://github.com/24kchengYe/24kchengYe.github.io/blob/main/_data/writing/figures/${figure.source}">${figure.format === 'svg' ? 'SVG' : 'HTML + CSS'}</a>
        · <a href="https://github.com/24kchengYe/24kchengYe.github.io/blob/main/_data/writing/figures/translations.json">EN / 中 / 日</a>`;
      container.append(details);
    }
  }
}

function build(slug, technical = false) {
  const sourceName = `${slug}${technical ? '-technical' : ''}`;
  const source = fs.readFileSync(path.join(root, '_data/writing', `${sourceName}.html`), 'utf8');
  const translations = {
    ...JSON.parse(fs.readFileSync(path.join(root, '_data/writing', `${slug}.json`), 'utf8')),
    ...(technical ? JSON.parse(fs.readFileSync(path.join(root, '_data/writing', `${sourceName}.json`), 'utf8')) : {}),
  };
  const dom = new JSDOM(source.trimEnd());
  const { document, NodeFilter } = dom.window;
  document.querySelector('.report-site-nav')?.remove();
  document.querySelectorAll('.figure-source').forEach(element => element.remove());
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
  const route = `/writing/${slug}/${technical ? 'technical/' : ''}`;
  document.querySelector('link[rel="canonical"]').href = `https://24kchengye.github.io${route}`;
  document.querySelector('meta[property="og:url"]').content = `https://24kchengye.github.io${route}`;
  localizeFigures(document);
  document.querySelector('img[src]')?.setAttribute('loading', 'eager');
  document.body.insertAdjacentHTML('afterbegin', navigation(slug, technical));
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = '/assets/css/writing-language.css?v=figure-i18n-1';
  document.head.append(stylesheet);
  const script = document.createElement('script');
  script.src = '/assets/js/minimal.js?v=writing-i18n-3';
  script.defer = true;
  document.head.append(script);
  const output = dom.serialize() + '\n';
  fs.writeFileSync(path.join(root, route, 'index.html'), output);
  if (slug === 'spec-generation' && !technical) fs.writeFileSync(path.join(root, 'writing', slug, 'essay/index.html'), output);
  dom.window.close();
}

for (const slug of slugs) {
  build(slug);
  build(slug, true);
}
