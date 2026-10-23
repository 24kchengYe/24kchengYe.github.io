const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const root = path.join(__dirname,'..');
const controller = fs.readFileSync(path.join(root,'assets/js/writing-diagram-style.js'),'utf8');
const routes = ['spec-generation','spec-generation/technical','spec-generation/essay','spec-repair','spec-repair/technical','rubric-model','rubric-model/technical','nimble-kev','attention-mechanisms','coding-agent-trajectories','automation-blueprint'];
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

async function controllerChecks() {
  const dom = new JSDOM('<!doctype html><html lang="en"><body><section data-diagram-style="openai-blog"></section><img data-diagram-image data-src-openai-blog-en="/blog-en.svg" data-src-engineering-en="/engineering-en.svg" data-src-engineering-ja="/engineering-ja.svg"></body></html>',{ url:'https://example.test/writing/',runScripts:'outside-only' });
  const { window } = dom;
  window.eval(controller);
  const api = window.WritingDiagramStyle;
  assert.equal(api.current(),'openai-blog');
  const first = api.createControl();
  const second = api.createControl();
  window.document.body.append(first,second);
  assert.deepEqual([...first.options].map(option => option.textContent),['OpenAI Blog','Engineering']);
  first.value = 'engineering';
  first.dispatchEvent(new window.Event('change'));
  assert.equal(second.value,'engineering');
  assert.equal(window.localStorage.getItem('writing-diagram-style'),'engineering');
  assert.equal(window.document.querySelector('section').dataset.diagramStyle,'engineering');
  assert.equal(window.document.querySelector('img').getAttribute('src'),'/engineering-en.svg');
  window.document.documentElement.lang = 'ja';
  await Promise.resolve();
  assert.equal(first.getAttribute('aria-label'),'図のスタイル');
  assert.equal(window.document.querySelector('img').getAttribute('src'),'/engineering-ja.svg');
  const host = window.document.createElement('div');
  window.document.body.append(host);
  const shadow = host.attachShadow({ mode:'open' });
  shadow.innerHTML = '<div data-diagram-style="openai-blog"></div>';
  shadow.append(api.createControl());
  api.apply(shadow);
  assert.equal(shadow.querySelector('[data-diagram-style]').dataset.diagramStyle,'engineering');
  window.dispatchEvent(new window.StorageEvent('storage',{ key:'writing-diagram-style',newValue:'openai-blog' }));
  assert.equal(api.current(),'openai-blog');
  assert.equal(second.value,'openai-blog');
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
  const control = blocked.window.WritingDiagramStyle.createControl();
  control.value = 'engineering';
  control.dispatchEvent(new blocked.window.Event('change'));
  assert.equal(blocked.window.WritingDiagramStyle.current(),'engineering');
  blocked.window.close();
}

async function main() {
  await controllerChecks();
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
  console.log(`Diagram themes: ${figures} SVG variants, ${routes.length} routes, controller persistence/storage/language checks passed.`);
}

main().then(() => process.exit(0)).catch(error => { console.error(error); process.exit(1); });
