const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { JSDOM } = require('jsdom');

const root = path.join(__dirname, '..');
const sourceDirectory = path.join(root, '_data/writing/figures');
const manifest = JSON.parse(fs.readFileSync(path.join(sourceDirectory, 'manifest.json'), 'utf8'));
const translations = JSON.parse(fs.readFileSync(path.join(sourceDirectory, 'translations.json'), 'utf8'));
const svgNamespace = 'http://www.w3.org/2000/svg';
const htmlNamespace = 'http://www.w3.org/1999/xhtml';

function translate(original, language) {
  if (language === 'zh' || !/[\u3400-\u9fff]/u.test(original)) return original;
  const pair = translations[original];
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

function localizeVector(source, language) {
  const dom = new JSDOM(source, { contentType: 'image/svg+xml' });
  const { document } = dom.window;
  const svg = document.documentElement;
  const labels = [...svg.querySelectorAll('text')];
  const boxes = [...svg.querySelectorAll('path')].flatMap(shape => {
    const commands = shape.getAttribute('d') || '';
    if (!/[zZ]/.test(commands) || !/[qQ]/.test(commands) || /fill:\s*none/.test(shape.getAttribute('style') || '')) return [];
    const coordinates = commands.match(/-?\d+(?:\.\d+)?/g)?.map(Number) || [];
    const horizontal = coordinates.filter((value, index) => index % 2 === 0);
    const vertical = coordinates.filter((value, index) => index % 2 === 1);
    return [{ left: Math.min(...horizontal), right: Math.max(...horizontal), top: Math.min(...vertical), bottom: Math.max(...vertical) }];
  });
  const widths = labels.map(label => labelWidth(label, labels, boxes, Number(svg.getAttribute('viewBox').split(/\s+/)[2])));
  for (const [index, label] of labels.entries()) {
    const original = label.textContent.trim();
    const translated = translate(original, language);
    const originalWidth = Number(label.getAttribute('data-original-width'));
    if (translated !== original && originalWidth) {
      const fontSize = Number(label.getAttribute('font-size'));
      const maxWidth = widths[index];
      const predictedWidth = estimatedWidth(translated, fontSize);
      label.setAttribute('x', Number(label.getAttribute('x')) + originalWidth / 2);
      label.setAttribute('text-anchor', 'middle');
      if (predictedWidth > maxWidth) {
        label.setAttribute('textLength', maxWidth);
        label.setAttribute('lengthAdjust', 'spacingAndGlyphs');
      }
    }
    label.textContent = translated;
    label.removeAttribute('data-original-width');
  }
  svg.setAttribute('lang', language);
  const output = svg.outerHTML;
  dom.window.close();
  return output;
}

function fitLayoutLabels(document, canvas, language) {
  const segmenter = new Intl.Segmenter(language, { granularity: 'word' });
  for (const node of canvas.querySelectorAll('.node')) {
    const lines = node.innerHTML.split(/<br\s*\/?>/i).map(line => {
      const content = document.createElement('span');
      content.innerHTML = line;
      return content.textContent.trim();
    });
    const content = document.createElement('span');
    content.append(...node.childNodes);
    content.style.minWidth = '0';
    content.style.overflowWrap = 'anywhere';
    node.append(content);
    if (language === 'zh') continue;
    const width = parseFloat(node.style.width) - 32;
    const height = parseFloat(node.style.height) - 20;
    if (!(width > 0 && height > 0)) continue;
    let fontSize = parseFloat(node.style.fontSize) || (node.classList.contains('small') ? 22 : 26);
    const lineCount = size => lines.reduce((total, line) => {
      let count = 1;
      let used = 0;
      for (const { segment } of segmenter.segment(line)) {
        const advance = [...segment].reduce((sum, character) => sum + (/[\u2e80-\uffff]/u.test(character) ? 1 : 0.61), 0) * size;
        if (used && used + advance > width) {
          count += 1;
          used = 0;
        }
        if (!used && !segment.trim()) continue;
        used += advance;
        while (used > width) {
          count += 1;
          used -= width;
        }
      }
      return total + count;
    }, 0);
    while (fontSize > 14 && lineCount(fontSize) * fontSize * 1.4 > height) fontSize -= 1;
    node.style.fontSize = `${fontSize}px`;
    node.style.lineHeight = '1.4';
  }
}

function localizeLayout(source, item, language) {
  const dom = new JSDOM(source);
  const { document, NodeFilter, XMLSerializer } = dom.window;
  const canvas = document.querySelector('.canvas');
  const walker = document.createTreeWalker(canvas, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const original = node.textContent.trim();
    node.textContent = node.textContent.replace(original, translate(original, language));
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
    figures[asset] = { ...item, localized: {} };
    for (const language of ['zh', 'en', 'ja']) {
      const directory = path.join(outputDirectory, language);
      fs.mkdirSync(directory, { recursive: true });
      const output = item.format === 'svg' ? localizeVector(source, language) : localizeLayout(source, item, language);
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
