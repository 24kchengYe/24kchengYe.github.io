const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { JSDOM } = require('jsdom');

const root = path.join(__dirname, '..');
const languages = ['zh', 'en', 'ja'];

function revision(file) {
  return createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex').slice(0, 12);
}

function buildTrajectoryMap() {
  const config = JSON.parse(fs.readFileSync(path.join(root, '_data/writing/trajectory-map.json'), 'utf8'));
  const manifests = JSON.parse(fs.readFileSync(path.join(root, '_data/writing/figures/manifest.json'), 'utf8'));
  const views = {};
  for (const [id, view] of Object.entries(config.views)) {
    const localized = {};
    for (const language of languages) {
      const source = fs.readFileSync(path.join(root, 'writing/figures', language, view.figure + '.svg'), 'utf8');
      const dom = new JSDOM(source, { contentType: 'image/svg+xml' });
      const document = dom.window.document;
      if (document.querySelector('script,iframe,object')) throw new Error(`Unsafe diagram: ${id}`);
      const canvas = document.querySelector('.canvas');
      for (const element of canvas.querySelectorAll('*')) {
        if ([...element.attributes].some(attribute => /^on/i.test(attribute.name))) throw new Error(`Unsafe diagram attribute: ${id}`);
      }
      for (const [node, target] of Object.entries(view.links)) {
        if (!document.getElementById(node) || !config.views[target]) throw new Error(`Broken drill-down: ${id}/${node} → ${target}`);
      }
      for (const target of view.related) if (!config.views[target]) throw new Error(`Broken related flow: ${target}`);
      for (const node of view.sequence || []) if (!document.getElementById(node)) throw new Error(`Missing replay event: ${node}`);
      if (id === 'case') {
        const events = [...canvas.querySelectorAll('.event')];
        if (events.length !== 15 || events.filter(event => event.dataset.disposition === 'retained').length !== 13) throw new Error('Case attempt / turn count changed');
      }
      localized[language] = { css: document.querySelector('style').textContent, html: canvas.outerHTML };
      dom.window.close();
    }
    const manifest = manifests[view.figure];
    views[id] = { ...view, width: manifest.width, height: manifest.height, localized };
  }
  for (const [key, translations] of Object.entries(config.strings)) {
    if (translations.length !== 2 || translations.some(value => typeof value !== 'string' || !value.trim())) throw new Error(`Incomplete map translation: ${key}`);
  }
  const file = 'assets/js/trajectory-map-data.js';
  fs.writeFileSync(path.join(root, file), `window.TrajectoryMapData = ${JSON.stringify({ views, strings: config.strings })};\n`);
  return { config, script: `/${file}?v=${revision(file)}` };
}

function attachTrajectoryMaps(document, artifact) {
  const translate = original => {
    const pair = artifact.config.strings[original];
    if (!pair) throw new Error(`Missing map translation: ${original}`);
    return languages.map((language, index) => {
      const span = document.createElement('span');
      span.lang = language;
      span.textContent = index ? pair[index - 1] : original;
      return span;
    });
  };
  const caption = '点击模块可进入内部流程，也可沿关联流程切换。Harness 是 Online 生成与修复共用的执行底座；虚线规划层对应 Spec→TodoList 设计。';
  for (const [index, image] of [...document.querySelectorAll('figure img[data-figure]')].entries()) {
    const figure = image.closest('figure');
    const original = image.dataset.figure;
    const entry = Object.keys(artifact.config.views).find(id => artifact.config.views[id].figure === original);
    if (!entry) throw new Error(`Unknown interactive figure: ${original}`);
    figure.classList.add('trajectory-figure');
    figure.classList.remove('tall-figure', 'case-figure');
    const fallback = document.createElement('details');
    fallback.className = 'trajectory-static';
    fallback.open = true;
    const summary = document.createElement('summary');
    summary.append(...translate('静态图与图注'));
    fallback.append(summary, image);
    if (index === 0) {
      fallback.append(figure.querySelector('figcaption'));
      const introduction = document.createElement('figcaption');
      introduction.append(...translate(caption));
      figure.prepend(introduction);
    }
    const map = document.createElement('div');
    map.className = 'trajectory-map';
    map.id = `trajectory-map-${index + 1}`;
    map.dataset.entry = entry;
    map.hidden = true;
    const source = figure.querySelector('.figure-source-link');
    if (source) fallback.append(source);
    figure.prepend(map);
    figure.append(fallback);
  }
  const stylesheet = document.createElement('style');
  stylesheet.textContent = '.trajectory-figure{width:min(1200px,calc(100vw - 32px))}.trajectory-static{margin:12px 0;font-size:13px;color:var(--muted)}.trajectory-static>summary{cursor:pointer;padding:8px 0}.trajectory-static img{margin-top:16px}.trajectory-static figcaption{margin-top:14px}.trajectory-map[hidden]{display:none}@media(max-width:640px){.trajectory-figure{width:100%}}@media print{.trajectory-map{display:none}.trajectory-figure{width:100%;transform:none;margin-left:0}.trajectory-static>summary{display:none}}';
  document.head.append(stylesheet);
  for (const source of [artifact.script, `/assets/js/trajectory-map.js?v=${revision('assets/js/trajectory-map.js')}`]) {
    const script = document.createElement('script');
    script.src = source;
    script.defer = true;
    document.head.append(script);
  }
  document.querySelector('script[src*="trajectory-map.js"]').dataset.stylesheet = `/assets/css/trajectory-map.css?v=${revision('assets/css/trajectory-map.css')}`;
}

module.exports = { buildTrajectoryMap, attachTrajectoryMaps };
