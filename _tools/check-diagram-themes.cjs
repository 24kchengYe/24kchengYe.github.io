const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const { themeFigure } = require('./figure-themes.cjs');

const root = path.join(__dirname,'..');
const controller = fs.readFileSync(path.join(root,'assets/js/writing-diagram-style.js'),'utf8');
const routes = ['spec-generation','spec-generation/technical','spec-generation/essay','spec-repair','spec-repair/technical','rubric-model','rubric-model/technical','nimble-kev','attention-mechanisms','coding-agent-trajectories','automation-blueprint','agent-memory'];
const styles = ['openai-blog','engineering'];

function canonicalFigure(source) {
  const dom = new JSDOM(source,{ contentType:'image/svg+xml' });
  const document = dom.window.document;
  for (const style of document.querySelectorAll('style')) style.remove();
  for (const node of document.querySelectorAll('[data-diagram-style]')) node.removeAttribute('data-diagram-style');
  const result = document.documentElement.outerHTML;
  dom.window.close();
  return result;
}

function vectorChecks() {
  for (const name of ['spec-repair-06','spec-repair-07','spec-repair-15']) {
    const source = fs.readFileSync(path.join(root,'_data/writing/figures',name + '.svg'),'utf8');
    const original = new JSDOM(source,{ contentType:'image/svg+xml' });
    for (const theme of styles) {
      const themed = new JSDOM(themeFigure(source,'flow',theme),{ contentType:'image/svg+xml' });
      assert.deepEqual([...themed.window.document.querySelectorAll('defs')].map(node => node.outerHTML),[...original.window.document.querySelectorAll('defs')].map(node => node.outerHTML),`${name}: definitions must not inherit node stroke styling`);
      themed.window.close();
    }
    original.window.close();
    for (const language of ['zh','en','ja']) for (const theme of styles) {
      const file = path.join(root,'writing/figures',language,theme === 'engineering' ? 'engineering' : '',name + '.svg');
      const generated = new JSDOM(fs.readFileSync(file,'utf8'),{ contentType:'image/svg+xml' });
      const document = generated.window.document;
      const patternedNodes = [...document.querySelectorAll('[data-diagram-fill="soft"]')];
      assert(patternedNodes.length,`${name}/${language}: patterned nodes need a legible solid fill`);
      const bounds = shape => {
        const values = shape.getAttribute('d').match(/-?\d+(?:\.\d+)?/g).map(Number);
        const horizontal = values.filter((value,index) => index % 2 === 0);
        const vertical = values.filter((value,index) => index % 2 === 1);
        return [Math.min(...horizontal),Math.max(...horizontal),Math.min(...vertical),Math.max(...vertical)];
      };
      for (const fill of patternedNodes) {
        const outlines = [...document.querySelectorAll('[data-node-outline]')].filter(shape => shape.getAttribute('data-node-outline') === fill.parentElement.id);
        assert(outlines.length,`${name}/${language}: paired node outline missing`);
        for (const outline of outlines) assert(bounds(outline).every((value,index) => Math.abs(value - bounds(fill)[index]) < 0.001),`${name}/${language}: fill and outline must resize together`);
      }
      generated.window.close();
    }
  }
}

async function controllerChecks() {
  const dom = new JSDOM('<!doctype html><html lang="en"><body><nav class="report-site-nav"><div class="languages"></div></nav><section data-diagram-style="openai-blog"></section><img data-diagram-image data-src-openai-blog-en="/blog-en.svg" data-src-engineering-en="/engineering-en.svg" data-src-engineering-ja="/engineering-ja.svg"></body></html>',{ url:'https://example.test/writing/',runScripts:'outside-only' });
  const { window } = dom;
  window.eval(controller);
  const api = window.WritingDiagramStyle;
  assert.equal(api.current(),'openai-blog');
  const control = window.document.querySelector('[data-diagram-style-control]');
  const menu = window.document.getElementById('writing-style-menu');
  assert.equal(window.document.querySelectorAll('[data-diagram-style-control]').length,1);
  assert(control.closest('.report-site-nav'));
  assert.equal(menu.hidden,true);
  control.click();
  assert.equal(menu.hidden,false);
  assert.equal(control.getAttribute('aria-expanded'),'true');
  assert.deepEqual([...menu.querySelectorAll('strong')].map(option => option.textContent),['OpenAI Blog','Engineering']);
  menu.querySelector('[data-style-option="engineering"]').click();
  assert.equal(menu.hidden,true);
  assert.equal(control.querySelector('.diagram-style-name').textContent,'Engineering');
  assert.equal(window.document.activeElement,control);
  assert.equal(window.localStorage.getItem('writing-diagram-style'),'engineering');
  assert.equal(window.document.querySelector('section').dataset.diagramStyle,'engineering');
  assert.equal(window.document.querySelector('img').getAttribute('src'),'/engineering-en.svg');
  window.document.documentElement.lang = 'ja';
  await Promise.resolve();
  assert.equal(control.getAttribute('aria-label'),'ページ全体の図のスタイル');
  assert.equal(window.document.querySelector('img').getAttribute('src'),'/engineering-ja.svg');
  const host = window.document.createElement('div');
  window.document.body.append(host);
  const shadow = host.attachShadow({ mode:'open' });
  shadow.innerHTML = '<div data-diagram-style="openai-blog"></div>';
  api.apply(shadow);
  assert.equal(shadow.querySelector('[data-diagram-style]').dataset.diagramStyle,'engineering');
  assert.equal(shadow.querySelector('[data-diagram-style-control]'),null);
  window.dispatchEvent(new window.StorageEvent('storage',{ key:'writing-diagram-style',newValue:'openai-blog' }));
  assert.equal(api.current(),'openai-blog');
  assert.equal(control.querySelector('.diagram-style-name').textContent,'OpenAI Blog');
  control.click();
  menu.dispatchEvent(new window.KeyboardEvent('keydown',{ key:'Escape',bubbles:true }));
  assert.equal(menu.hidden,true);
  assert.equal(window.document.activeElement,control);
  window.dispatchEvent(new window.StorageEvent('storage',{ key:'unrelated',newValue:'engineering' }));
  assert.equal(api.current(),'openai-blog');
  window.dispatchEvent(new window.StorageEvent('storage',{ key:'writing-diagram-style',newValue:'invalid' }));
  assert.equal(api.current(),'openai-blog');
  dom.window.close();
  for (const saved of ['engineering','invalid',null]) {
    const fresh = new JSDOM('<!doctype html><html lang="zh"><body></body></html>',{ url:'https://example.test',runScripts:'outside-only' });
    if (saved) fresh.window.localStorage.setItem('writing-diagram-style',saved);
    fresh.window.eval(controller);
    assert.equal(fresh.window.WritingDiagramStyle.current(),saved === 'engineering' ? saved : 'openai-blog');
    fresh.window.close();
  }
  const blocked = new JSDOM('<!doctype html><html lang="en"><body></body></html>',{ runScripts:'outside-only' });
  blocked.window.eval(controller);
  blocked.window.WritingDiagramStyle.set('engineering');
  assert.equal(blocked.window.WritingDiagramStyle.current(),'engineering');
  blocked.window.close();
}

async function main() {
  await controllerChecks();
  vectorChecks();
  let figures = 0;
  for (const language of ['zh','en','ja']) {
    const directory = path.join(root,'writing/figures',language);
    for (const file of fs.readdirSync(path.join(directory,'engineering')).filter(file => file.endsWith('.svg'))) {
      const blog = fs.readFileSync(path.join(directory,file),'utf8');
      const engineering = fs.readFileSync(path.join(directory,'engineering',file),'utf8');
      assert.match(blog,/data-diagram-style="openai-blog"/);
      assert.match(engineering,/data-diagram-style="engineering"/);
      assert.equal(canonicalFigure(blog),canonicalFigure(engineering),`${language}/${file}: theme must preserve text and geometry`);
      figures += 2;
    }
  }
  for (const route of routes) {
    const dom = new JSDOM(fs.readFileSync(path.join(root,'writing',route,'index.html'),'utf8'));
    const document = dom.window.document;
    const scripts = [...document.querySelectorAll('script[src]')].map(script => script.getAttribute('src'));
    const controllerIndex = scripts.findIndex(source => source.includes('writing-diagram-style.js'));
    assert(controllerIndex >= 0,`${route}: controller missing`);
    for (const renderer of ['trajectory-map.js','automation-blueprint.js','figure-viewer.js']) {
      const rendererIndex = scripts.findIndex(source => source.includes(renderer));
      if (rendererIndex >= 0) assert(controllerIndex < rendererIndex,`${route}: controller loads before ${renderer}`);
    }
    assert(document.querySelector('link[href*="writing-diagram-themes.css"]'));
    for (const image of document.querySelectorAll('img[data-diagram-image]')) {
      for (const style of styles) for (const language of ['zh','en','ja']) {
        const source = image.getAttribute(`data-src-${style}-${language}`);
        assert(source,`${route}: missing ${style}/${language}`);
        assert(fs.existsSync(path.join(root,source.split('?')[0])),`${route}: missing asset ${source}`);
      }
    }
    dom.window.close();
  }
  for (const renderer of ['trajectory-map.js','automation-blueprint.js','figure-viewer.js']) {
    assert(!fs.readFileSync(path.join(root,'assets/js',renderer),'utf8').includes('createControl'),`${renderer}: style selector must only live in page navigation`);
  }
  console.log(`Diagram themes: ${figures} SVG variants, ${routes.length} routes; controller, SVG definitions, solid node fills and paired-outline checks passed.`);
}

main().then(() => process.exit(0)).catch(error => { console.error(error); process.exit(1); });
