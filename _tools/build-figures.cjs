const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { JSDOM } = require('jsdom');

const root = path.join(__dirname, '..');
const sourceDirectory = path.join(root, '_data/writing/figures');
const manifest = JSON.parse(fs.readFileSync(path.join(sourceDirectory, 'manifest.json'), 'utf8'));
const translations = JSON.parse(fs.readFileSync(path.join(sourceDirectory, 'translations.json'), 'utf8'));
const explorer = JSON.parse(fs.readFileSync(path.join(root, '_data/writing/diagram-explorer.json'), 'utf8'));
const vectorLayouts = JSON.parse(fs.readFileSync(path.join(sourceDirectory, 'vector-layouts.json'), 'utf8'));
const svgNamespace = 'http://www.w3.org/2000/svg';
const htmlNamespace = 'http://www.w3.org/1999/xhtml';

function translate(original, language, localTranslations = {}) {
  if (language === 'zh' || !/[\u3400-\u9fff]/u.test(original)) return original;
  const pair = localTranslations[original] || translations[original];
  if (!pair?.[language === 'en' ? 0 : 1]) throw new Error(`Missing figure translation: ${original}`);
  return pair[language === 'en' ? 0 : 1];
}

function estimatedWidth(text, fontSize) {
  return [...text].reduce((total, character) => total + (
    /[\u2e80-\uffff]/u.test(character) ? 1 :
    /[ilI.,:;'!| ]/.test(character) ? 0.28 :
    /[MW@]/.test(character) ? 0.85 : 0.55
  ), 0) * fontSize;
}

function labelWidth(label, labels, boxes, pageWidth) {
  const fontSize = Number(label.getAttribute('font-size'));
  const center = Number(label.getAttribute('x')) + Number(label.getAttribute('data-original-width')) / 2;
  const baseline = Number(label.getAttribute('y'));
  let available = 2 * Math.min(center - 8, pageWidth - center - 8);
  for (const other of labels) {
    if (other === label || Math.abs(Number(other.getAttribute('y')) - baseline) > fontSize * 0.8) continue;
    const otherCenter = Number(other.getAttribute('x')) + Number(other.getAttribute('data-original-width')) / 2;
    available = Math.min(available, Math.abs(otherCenter - center) - 12);
  }
  for (const box of boxes) {
    if (center > box.left && center < box.right && baseline > box.top && baseline < box.bottom) {
      available = Math.min(available, 2 * Math.min(center - box.left, box.right - center) - 16);
    }
  }
  return Math.max(available, Number(label.getAttribute('data-original-width')));
}

function localizeVector(source, language, item) {
  const dom = new JSDOM(source, { contentType: 'image/svg+xml' });
  const { document } = dom.window;
  const svg = document.documentElement;
  const name = path.basename(item.source, '.svg');
  const layout = vectorLayouts[name] || {};
  const nodeIds = new Set((explorer[name]?.vectorEdges || []).flatMap(([from, to]) => [from, to]));
  const labels = [...svg.querySelectorAll('text')];
  const boxes = [...svg.querySelectorAll('path')].flatMap(shape => {
    const commands = shape.getAttribute('d') || '';
    if (!/[zZ]/.test(commands) || !/[qQ]/.test(commands) || /fill:\s*none/.test(shape.getAttribute('style') || '')) return [];
    const coordinates = commands.match(/-?\d+(?:\.\d+)?/g)?.map(Number) || [];
    const horizontal = coordinates.filter((value, index) => index % 2 === 0);
    const vertical = coordinates.filter((value, index) => index % 2 === 1);
    return [{ element: shape, left: Math.min(...horizontal), right: Math.max(...horizontal), top: Math.min(...vertical), bottom: Math.max(...vertical) }];
  });
  const labelBoxes = labels.map(label => {
    const center = Number(label.getAttribute('x')) + Number(label.getAttribute('data-original-width')) / 2;
    const baseline = Number(label.getAttribute('y'));
    return boxes.filter(box => center > box.left && center < box.right && baseline > box.top && baseline < box.bottom && box.bottom - box.top < 160).sort((first, second) => (first.right - first.left) * (first.bottom - first.top) - (second.right - second.left) * (second.bottom - second.top))[0];
  });
  for (const [index, label] of labels.entries()) {
    if (labelBoxes[index] || !nodeIds.has(label.parentElement.id)) continue;
    const left = Number(label.getAttribute('x'));
    const baseline = Number(label.getAttribute('y'));
    const size = Number(label.getAttribute('font-size'));
    const box = { element:null, left:left - 6, right:left + Number(label.getAttribute('data-original-width')) + 6, top:baseline - size - 4, bottom:baseline + 4 };
    boxes.push(box);
    labelBoxes[index] = box;
  }
  const originalBoxes = boxes.map(box => ({ ...box }));
  const widths = labels.map(label => labelWidth(label, labels, boxes, Number(svg.getAttribute('viewBox').split(/\s+/)[2])));
  for (const [index, label] of labels.entries()) {
    const original = label.textContent.trim();
    const translated = translate(original, language);
    const originalWidth = Number(label.getAttribute('data-original-width'));
    const oldSize = Number(label.getAttribute('font-size'));
    const muted = ['#707070', '#707570', '#666666', '#777777', '#647067', '#666', '#737373', '#626262'].includes(label.getAttribute('fill'));
    const fontSize = oldSize >= 20 ? (oldSize > 30 ? 36 : 26) : muted || oldSize < 13.5 ? 15 : 18;
    const leftAligned = Number(label.getAttribute('x')) === 36;
    let center = Number(label.getAttribute('x')) + originalWidth / 2;
    const box = labelBoxes[index];
    const placement = layout[label.parentElement.id];
    if (box) {
      if (box.element) label.setAttribute('data-node-box', box.element.parentElement.id);
      if (!box.element) {
        const available = Math.min(placement?.width || 220, 2 * Math.min(center - 12, item.width - center - 12));
        const width = Math.min(available, Math.max(box.right - box.left, estimatedWidth(translated, fontSize) + 24));
        box.left = center - width / 2;
        box.right = center + width / 2;
      }
      const wordWidth = Math.max(...[...new Intl.Segmenter(language, { granularity: 'word' }).segment(translated)].map(part => estimatedWidth(part.segment, fontSize)));
      const extra = Math.max(0, wordWidth + 20 - (box.right - box.left));
      box.left -= extra / 2;
      box.right += extra / 2;
      center = (box.left + box.right) / 2;
      widths[index] = box.right - box.left - 16;
    }
    if (leftAligned) {
      widths[index] = oldSize >= 15 ? 790 : 180;
      center = 36;
    }
    if (placement && !box) {
      center = placement.x;
      widths[index] = placement.width;
      label.setAttribute('data-layout-label', 'true');
    }
    const lines = [''];
    for (const { segment } of new Intl.Segmenter(language, { granularity: 'word' }).segment(translated)) {
      const previous = lines.at(-1);
      if (previous && estimatedWidth(previous + segment, fontSize) > widths[index]) lines.push(segment.trimStart());
      else lines[lines.length - 1] += segment;
    }
    label.textContent = '';
    label.setAttribute('aria-label', translated);
    label.setAttribute('font-size', fontSize);
    label.setAttribute('data-type-role', fontSize === 15 ? 'secondary' : fontSize >= 26 ? 'metric' : 'primary');
    label.setAttribute('x', center);
    label.setAttribute('text-anchor', leftAligned ? 'start' : 'middle');
    let baseline = Number(label.getAttribute('y')) + (fontSize - oldSize) * 0.3;
    if (placement && !box) baseline = placement.y + fontSize * 0.35;
    if (box && labelBoxes.filter(candidate => candidate === box).length === 1) {
      const extra = Math.max(0, lines.length * fontSize * 1.2 + 16 - (box.bottom - box.top));
      box.top -= extra / 2;
      box.bottom += extra / 2;
      baseline = (box.top + box.bottom) / 2 + fontSize * 0.35;
    }
    label.setAttribute('y', baseline - (lines.length - 1) * fontSize * 0.6);
    for (const [lineIndex, line] of lines.entries()) {
      const span = document.createElementNS(svgNamespace, 'tspan');
      span.setAttribute('x', center);
      span.setAttribute('dy', lineIndex ? fontSize * 1.2 : 0);
      span.textContent = line.trim() + (lineIndex < lines.length - 1 ? ' ' : '');
      label.append(span);
    }
    label.removeAttribute('data-original-width');
  }
  const movedPoint = (horizontal, vertical) => {
    for (const [index, before] of originalBoxes.entries()) {
      const after = boxes[index];
      if (vertical > before.top - 3 && vertical < before.bottom + 3) {
        if (Math.abs(horizontal - before.left) < 4) return [horizontal + after.left - before.left, vertical];
        if (Math.abs(horizontal - before.right) < 4) return [horizontal + after.right - before.right, vertical];
      }
      if (horizontal > before.left - 3 && horizontal < before.right + 3) {
        if (Math.abs(vertical - before.top) < 4) return [horizontal, vertical + after.top - before.top];
        if (Math.abs(vertical - before.bottom) < 4) return [horizontal, vertical + after.bottom - before.bottom];
      }
    }
    return [horizontal, vertical];
  };
  const rewriteCoordinates = (shape, transform) => {
    let index = 0;
    shape.setAttribute('d', shape.getAttribute('d').replace(/-?\d+(?:\.\d+)?/g, value => String(transform(Number(value), index++))));
  };
  for (const group of svg.querySelectorAll('g')) {
    const paths = [...group.children].filter(child => child.localName === 'path');
    const line = paths[0];
    if (!line || /[zZhHvVcCsSaAtT]/.test(line.getAttribute('d'))) continue;
    const points = line.getAttribute('d').match(/-?\d+(?:\.\d+)?/g)?.map(Number);
    if (!points || points.length < 4) continue;
    const start = movedPoint(points[0], points[1]);
    const end = movedPoint(points.at(-2), points.at(-1));
    rewriteCoordinates(line, (value, index) => index < 2 ? start[index] : index >= points.length - 2 ? end[index - points.length + 2] : value);
    if (paths.length === 2) rewriteCoordinates(paths[1], (value, index) => value + (index % 2 ? end[1] - points.at(-1) : end[0] - points.at(-2)));
  }
  for (const [index, box] of boxes.entries()) {
    if (!box.element) continue;
    const before = originalBoxes[index];
    rewriteCoordinates(box.element, (value, coordinate) => coordinate % 2 ? box.top + (value - before.top) * (box.bottom - box.top) / (before.bottom - before.top) : box.left + (value - before.left) * (box.right - box.left) / (before.right - before.left));
  }
  svg.setAttribute('lang', language);
  const output = svg.outerHTML;
  dom.window.close();
  return output;
}

function fitLayoutLabels(document, canvas, language) {
  if (canvas.hasAttribute('data-fixed-type')) return;
  for (const node of canvas.querySelectorAll('.node')) {
    const content = document.createElement('span');
    content.append(...node.childNodes);
    content.style.minWidth = '0';
    content.style.overflowWrap = 'anywhere';
    node.append(content);
    const secondary = node.classList.contains('small') && !node.classList.contains('box');
    node.style.fontSize = secondary ? '24px' : '28px';
    node.style.lineHeight = '1.25';
    node.setAttribute('data-type-role', secondary ? 'secondary' : 'primary');
  }
  if (!canvas.hasAttribute('data-fixed-type')) document.querySelector('style').textContent += '\nbody{font-family:Arial,"PingFang SC","Hiragino Sans",sans-serif}.label,.legend,.note,.annotation,.small-note,.caption,.axis{font-size:22px}.title,.label.title{font-size:30px}.group-title,.chart h2{font-size:26px}.chart-row,.plot-row,.matrix>div,.stat-grid p,.val{font-size:26px}.matrix .muted,.math,.legend,.small{font-size:24px}';
}

function localizeLayout(source, item, language) {
  const dom = new JSDOM(source);
  const { document, NodeFilter, XMLSerializer } = dom.window;
  const canvas = document.querySelector('.canvas');
  const canvasStyle = dom.window.getComputedStyle(canvas);
  if (parseFloat(canvasStyle.width) !== item.width || parseFloat(canvasStyle.height) !== item.height) {
    throw new Error(`Canvas / manifest mismatch: ${item.source}: ${canvasStyle.width} × ${canvasStyle.height}, expected ${item.width} × ${item.height}`);
  }
  const walker = document.createTreeWalker(canvas, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  const localTranslations = item.translations ? JSON.parse(fs.readFileSync(path.join(sourceDirectory, item.translations), 'utf8')) : {};
  for (const node of nodes) {
    const original = node.textContent.trim();
    node.textContent = node.textContent.replace(original, translate(original, language, localTranslations));
  }
  fitLayoutLabels(document, canvas, language);
  const svg = document.createElementNS(svgNamespace, 'svg');
  svg.setAttribute('viewBox', `0 0 ${item.width} ${item.height}`);
  svg.setAttribute('width', item.width);
  svg.setAttribute('height', item.height);
  svg.setAttribute('lang', language);
  const content = document.createElementNS(svgNamespace, 'foreignObject');
  content.setAttribute('width', item.width);
  content.setAttribute('height', item.height);
  const wrapper = document.createElementNS(htmlNamespace, 'div');
  wrapper.className = 'diagram-root';
  const style = document.createElementNS(htmlNamespace, 'style');
  style.textContent = document.querySelector('style').textContent.replace(/\bbody\s*\{/g, '.diagram-root{');
  wrapper.append(style, canvas);
  content.append(wrapper);
  svg.append(content);
  const output = new XMLSerializer().serializeToString(svg);
  dom.window.close();
  return output;
}

function buildFigures() {
  const outputDirectory = path.join(root, 'writing/figures');
  const figures = {};
  for (const [asset, item] of Object.entries(manifest)) {
    const source = fs.readFileSync(path.join(sourceDirectory, item.source), 'utf8');
    const name = path.basename(item.source, path.extname(item.source));
    const sourceWithOverrides = item.source.startsWith('cli-') && item.source.endsWith('.html')
      ? source.replace('</style>', `${fs.readFileSync(path.join(sourceDirectory, item.source === 'cli-case-format.html' ? 'cli-case-format-overrides.css' : 'cli-flow-theme.css'), 'utf8')}</style>`)
      : source;
    figures[asset] = { ...item, localized: {} };
    for (const language of ['zh', 'en', 'ja']) {
      const directory = path.join(outputDirectory, language);
      fs.mkdirSync(directory, { recursive: true });
      const output = item.format === 'svg' ? localizeVector(sourceWithOverrides, language, item) : localizeLayout(sourceWithOverrides, item, language);
      const validation = new JSDOM(output, { contentType: 'image/svg+xml' });
      if (validation.window.document.querySelector('parsererror,script,image')) throw new Error(`Unsafe or invalid SVG: ${name}`);
      for (const element of validation.window.document.querySelectorAll('*')) {
        for (const attribute of element.attributes) {
          const reference = attribute.value.match(/^#([\w-]+)$|url\(#([\w-]+)\)/);
          if ((attribute.localName === 'href' || attribute.value.startsWith('url(')) && reference && !validation.window.document.getElementById(reference[1] || reference[2])) {
            throw new Error(`Missing SVG definition in ${name}: ${attribute.value}`);
          }
        }
      }
      validation.window.close();
      if (language === 'en' && /[\u3400-\u9fff]/u.test(output)) throw new Error(`Untranslated figure: ${name}`);
      fs.writeFileSync(path.join(directory, `${name}.svg`), output + '\n');
      const revision = createHash('sha256').update(output).digest('hex').slice(0, 12);
      figures[asset].localized[language] = `/writing/figures/${language}/${name}.svg?v=${revision}`;
    }
  }
  return figures;
}

module.exports = { buildFigures };
