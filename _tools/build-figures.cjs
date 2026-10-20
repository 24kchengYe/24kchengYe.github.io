const fs = require('node:fs');
const path = require('node:path');
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

function localizeVector(source, language) {
  const dom = new JSDOM(source, { contentType: 'image/svg+xml' });
  const { document } = dom.window;
  const svg = document.documentElement;
  for (const label of svg.querySelectorAll('text')) {
    const original = label.textContent.trim();
    const translated = translate(original, language);
    const originalWidth = Number(label.getAttribute('data-original-width'));
    if (translated !== original && originalWidth) {
      const fontSize = Number(label.getAttribute('font-size'));
      const maxWidth = Math.max(originalWidth, fontSize * 2.2);
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
      validation.window.close();
      if (language === 'en' && /[\u3400-\u9fff]/u.test(output)) throw new Error(`Untranslated figure: ${name}`);
      fs.writeFileSync(path.join(directory, `${name}.svg`), output + '\n');
      figures[asset].localized[language] = `/writing/figures/${language}/${name}.svg`;
    }
  }
  return figures;
}

module.exports = { buildFigures };
