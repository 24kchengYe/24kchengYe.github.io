const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { JSDOM } = require('jsdom');

const root = path.join(__dirname,'..');
const languages = ['zh','en','ja'];
const manifest = JSON.parse(fs.readFileSync(path.join(root,'_data/writing/figures/manifest.json'),'utf8'));
const annotations = JSON.parse(fs.readFileSync(path.join(root,'_data/writing/diagram-explorer.json'),'utf8'));
const sharedStrings = JSON.parse(fs.readFileSync(path.join(root,'_data/writing/trajectory-map.json'),'utf8')).strings;
const extraStrings = {
  '本篇图解':['Article diagrams','記事の図解'],
  '连线动效':['Animate connections','接続をアニメーション'],
  '停止动效':['Stop animation','アニメーションを停止'],
  '点击节点查看细节或关联图；拖动平移，Ctrl/⌘ + 滚轮缩放。':['Select a node for details or a related diagram; drag to pan, Ctrl/⌘ + scroll to zoom.','ノードから詳細や関連図を開きます。ドラッグで移動、Ctrl/⌘＋スクロールで拡大。'],
  '悬停追踪连接，点击查看细节或关联图；动效仅辅助读图，不代表执行。':['Trace connections on hover; select a detail or related diagram. Animation illustrates links, not execution.','ホバーで接続を追跡し、詳細や関連図を開きます。アニメーションは接続の説明であり、実行ではありません。'],
  '点击查看原图数据；拖动平移，Ctrl/⌘ + 滚轮缩放。':['Select original chart data; drag to pan, Ctrl/⌘ + scroll to zoom.','元の図のデータを選択。ドラッグで移動、Ctrl/⌘＋スクロールで拡大。']
};
const hash = file => createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex').slice(0,12);

function annotate(document, canvas, config, vector) {
  const selector = vector ? 'g[id^="text_"]' : '.node,.head,.chart-row,.plot-row,.panel,.matrix>div,.stat-grid>div,.cells';
  const nodes = [...canvas.querySelectorAll(selector)].filter(node => !node.parentElement.closest(selector));
  for (const [index,node] of nodes.entries()) {
    if (config.nodeCount && index >= config.nodeCount) continue;
    if (!node.id) node.id = `n${index + 1}`;
    node.setAttribute('data-map-node','');
    node.setAttribute('data-map-label',(canvas.hasAttribute('data-research-diagram') ? node.querySelector('strong')?.textContent || node.textContent : node.textContent).trim().replace(/\s+/g,' '));
  }
  const existing = [...canvas.querySelectorAll('.edge[data-from][data-to]')];
  const groups = new Map();
  const connect = (from,to,parts) => {
    for (const id of [from,to]) if (!canvas.querySelector(`[id="${id}"]`)) throw new Error(`Missing connection node: ${id}`);
    const connection = vector ? document.createElementNS('http://www.w3.org/2000/svg','g') : document.createElementNS('http://www.w3.org/1999/xhtml','div');
    connection.setAttribute('class','connection');
    connection.setAttribute('data-from',from);
    connection.setAttribute('data-to',to);
    const first = parts[0];
    first.before(connection);
    for (const part of parts) {
      if (part.closest('.connection')) throw new Error('An edge segment cannot belong to two connections');
      connection.append(part);
    }
  };
  for (const part of existing) {
    const key = `${part.getAttribute('data-from')}|${part.getAttribute('data-to')}`;
    if (!groups.has(key)) groups.set(key,[]);
    groups.get(key).push(part);
  }
  for (const [key,parts] of groups) connect(...key.split('|'),parts);
  for (const [from,to,selectors] of config.edges || []) {
    const parts = Object.entries(selectors).flatMap(([className,indices]) => indices.map(index => {
      const part = canvas.querySelectorAll('.' + className)[index];
      if (!part) throw new Error(`Missing edge part: ${className}/${index}`);
      return part;
    }));
    connect(from,to,parts);
  }
  for (const [from,to,ids] of config.vectorEdges || []) {
    connect(from,to,ids.map(id => {
      const part = canvas.querySelector(`[id="${id}"]`);
      if (!part) throw new Error(`Missing vector edge: ${id}`);
      return part;
    }));
  }
}

function buildView(id, definition, title) {
  const config = annotations[id] || {};
  const localized = {};
  for (const language of languages) {
    const filename = path.join(root,'writing/figures',language,id + '.svg');
    const dom = new JSDOM(fs.readFileSync(filename,'utf8'),{ contentType:'image/svg+xml' });
    const document = dom.window.document;
    if (document.querySelector('script,iframe,object')) throw new Error(`Unsafe figure: ${id}`);
    let canvas = document.querySelector('.canvas');
    const vector = !canvas;
    if (vector) {
      const svg = document.documentElement;
      svg.setAttribute('width',definition.width);
      svg.setAttribute('height',definition.height);
      canvas = document.createElementNS('http://www.w3.org/1999/xhtml','div');
      canvas.setAttribute('class','canvas vector-canvas');
      canvas.setAttribute('style',`position:relative;width:${definition.width}px;height:${definition.height}px`);
      canvas.append(svg.cloneNode(true));
    }
    const originalText = canvas.textContent;
    annotate(document,canvas,config,vector);
    const words = text => text.replace(/\s+/g,' ').trim().split(' ').sort();
    if (JSON.stringify(words(originalText)) !== JSON.stringify(words(canvas.textContent))) throw new Error(`Annotation changed text: ${id}`);
    localized[language] = { css:[...document.querySelectorAll('style')].map(style => style.textContent).join('\n'),html:canvas.outerHTML };
    dom.window.close();
  }
  return { title, width:definition.width, height:definition.height, kind:config.kind || 'data', localized, links:{ ...config.links },related:[] };
}

function attachWritingMaps(document, sourceName) {
  const images = [...document.querySelectorAll('figure img[data-figure-key]')];
  if (!images.length) return;
  const strings = { ...sharedStrings,...extraStrings };
  const views = {};
  for (const image of images) {
    const definition = manifest[image.dataset.figureKey];
    const id = path.basename(definition.source,path.extname(definition.source));
    const title = annotations[id]?.title?.[0] || image.dataset.altZh || image.alt;
    strings[title] = annotations[id]?.title?.slice(1) || [image.dataset.altEn || title,image.dataset.altJa || title];
    if (!views[id]) views[id] = buildView(id,definition,title);
    image.dataset.mapEntry = id;
  }
  const order = Object.keys(views);
  for (const [index,id] of order.entries()) {
    const view = views[id];
    for (const [node,target] of Object.entries(view.links)) {
      if (!views[target]) { delete view.links[node]; continue; }
      const dom = new JSDOM(view.localized.zh.html);
      if (!dom.window.document.getElementById(node)) throw new Error(`Broken diagram link: ${id}/${node}`);
      dom.window.close();
    }
    view.related = [order[index - 1],order[index + 1]].filter(Boolean);
  }
  const dataFile = `assets/js/writing-maps/${sourceName}.js`;
  fs.mkdirSync(path.dirname(path.join(root,dataFile)),{ recursive:true });
  fs.writeFileSync(path.join(root,dataFile),`window.WritingDiagramData = ${JSON.stringify({ views,strings,generic:true })};\n`);
  for (const [index,image] of images.entries()) {
    const container = image.closest('.figure-panel') || image.closest('figure');
    const figure = image.closest('figure');
    figure.classList.add('writing-map-figure');
    const map = document.createElement('div');
    map.className = 'trajectory-map';
    map.id = `writing-map-${index + 1}`;
    map.dataset.entry = image.dataset.mapEntry;
    map.hidden = true;
    const fallback = document.createElement('details');
    fallback.className = 'trajectory-static';
    fallback.open = true;
    const summary = document.createElement('summary');
    for (const [language,text] of [['zh','静态图'],['en','Static figure'],['ja','静止図']]) {
      const span = document.createElement('span');
      span.lang = language; span.textContent = text; summary.append(span);
    }
    fallback.append(summary);
    image.before(map,fallback);
    fallback.append(image);
    const caption = container.querySelector(':scope > figcaption') || (figure.querySelectorAll('img[data-figure-key]').length === 1 ? figure.querySelector(':scope > figcaption') : null);
    if (caption) {
      const simplify = value => value.trim().replace(/^(?:图|Figure|Fig\.|図)\s*\d+\s*[:：·.\s]*/u,'');
      const localized = caption.querySelector('[lang="zh"]')?.textContent || caption.textContent;
      if (simplify(localized) === simplify(image.dataset.altZh || image.alt)) caption.classList.add('map-duplicate-caption');
    }
    delete image.dataset.mapEntry;
  }
  const style = document.createElement('style');
  style.textContent = '.writing-map-figure .trajectory-map{max-width:1200px;margin:0 auto}.writing-map-figure .figure-panel{padding:0!important;background:none!important;border:0!important}.trajectory-map[hidden]{display:none}.trajectory-static{margin:12px 0;font-size:13px;color:#71767e}.trajectory-static>summary{cursor:pointer;padding:8px 0}.trajectory-static img{margin-top:16px}@media print{.trajectory-map{display:none}.trajectory-static>summary{display:none}}';
  document.head.append(style);
  const compact = document.createElement('style');
  compact.textContent = '.map-ready>.panel-label,.map-ready>.map-duplicate-caption{display:none}.writing-map-figure .trajectory-static{font-size:12px;margin:6px 0 12px}.writing-map-figure .trajectory-static>summary{padding:4px 0}@media print{.map-ready>.panel-label,.map-ready>.map-duplicate-caption{display:block}}';
  document.head.append(compact);
  for (const file of [dataFile,'assets/js/trajectory-map.js']) {
    const script = document.createElement('script');
    script.src = `/${file}?v=${hash(file)}`;
    script.defer = true;
    if (file.endsWith('/trajectory-map.js')) script.dataset.stylesheet = `/assets/css/trajectory-map.css?v=${hash('assets/css/trajectory-map.css')}`;
    document.head.append(script);
  }
}

module.exports = { attachWritingMaps };
