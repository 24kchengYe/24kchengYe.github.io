const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

const root = path.join(__dirname,'..');
const output = path.resolve(process.env.WRITING_MAP_REVIEW_DIR || '_preview/writing-maps');
const routes = ['spec-generation','spec-generation/technical','spec-repair','spec-repair/technical','rubric-model','rubric-model/technical','nimble-kev','attention-mechanisms'];
const results = [];

function inspect(host) {
  const shadow = host.shadowRoot;
  const canvas = shadow.querySelector('.canvas');
  const bounds = canvas.getBoundingClientRect();
  const scale = bounds.width / parseFloat(getComputedStyle(canvas).width);
  const original = new DOMParser().parseFromString(window.WritingDiagramData.views[host.dataset.view].localized[document.documentElement.lang].html,'text/html');
  const errors = [];
  const signature = parent => ({
    text:parent.querySelector('.canvas').textContent.replace(/\s+/g,' ').trim(),
    geometry:[...parent.querySelectorAll('path,polyline,polygon,line,rect,circle,text,tspan')].map(node => [node.tagName,...['d','points','x','y','x1','y1','x2','y2','width','height','transform','dx','dy'].map(key => node.getAttribute(key))]),
    edges:[...parent.querySelectorAll('.connection')].map(node => `${node.dataset.from}>${node.dataset.to}`)
  });
  const actual = signature(shadow);
  const expected = signature(original);
  for (const key of Object.keys(actual)) if (JSON.stringify(actual[key]) !== JSON.stringify(expected[key])) errors.push({ changed:key,actual:JSON.stringify(actual[key]).slice(0,350),expected:JSON.stringify(expected[key]).slice(0,350) });
  const walker = document.createTreeWalker(canvas,NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.textContent.trim() || node.parentElement.closest('defs,style,metadata')) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    const box = range.getBoundingClientRect();
    if (!box.width || !box.height) continue;
    if (box.left < bounds.left - scale * 2 || box.top < bounds.top - scale * 2 || box.right > bounds.right + scale * 2 || box.bottom > bounds.bottom + scale * 2) errors.push(`Text outside canvas: ${node.textContent}`);
  }
  return errors;
}

async function main() {
  fs.mkdirSync(output,{ recursive:true });
  const server = http.createServer((request,response) => {
    const route = decodeURIComponent(new URL(request.url,'http://localhost').pathname);
    if (route === '/favicon.ico') { response.writeHead(204).end(); return; }
    const filename = path.resolve(root,'.' + route + (route.endsWith('/') ? 'index.html' : ''));
    if (!filename.startsWith(root + path.sep) || !fs.existsSync(filename)) { response.writeHead(404).end(); return; }
    const mime = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml' };
    response.writeHead(200,{ 'Content-Type':mime[path.extname(filename)] || 'application/octet-stream' });
    fs.createReadStream(filename).pipe(response);
  });
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const origin = process.env.WRITING_MAP_ORIGIN || `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({ executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true });
    for (const route of routes) {
      const page = await browser.newPage({ viewport:{ width:1440,height:1000 } });
      const errors = [];
      page.on('pageerror',error => errors.push(error.message));
      page.on('response',response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
      await page.goto(`${origin}/writing/${route}/?lang=zh`);
      const map = page.locator('#writing-map-1');
      await map.locator('.tm-shell').waitFor();
      const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const views = await page.evaluate(() => Object.keys(window.WritingDiagramData.views));
      for (const language of ['zh','en','ja']) {
        await page.locator(`[data-language="${language}"]`).click();
        for (const id of views) {
          await map.locator('select').selectOption(id);
          await settle();
          assert.equal(await map.getAttribute('data-view'),id,'Selected view must render');
          const issues = await map.evaluate(inspect);
          results.push({ route,language,id,issues });
          if (issues.length) console.error('Runtime errors:',errors);
          assert.deepEqual(issues,[],`${route}/${id}/${language}`);
          if (language === 'en' && !route.includes('/')) await map.screenshot({ path:path.join(output,`${id}-en.png`) });
        }
      }
      await page.locator('[data-language="en"]').click();
      const linkedView = await page.evaluate(() => Object.entries(window.WritingDiagramData.views).find(([,view]) => Object.keys(view.links).length));
      if (linkedView) {
        const [id,view] = linkedView;
        const [node,target] = Object.entries(view.links)[0];
        await map.locator('select').selectOption(id);
        await settle();
        await map.locator(`[id="${node}"]`).focus();
        await page.keyboard.press('Enter');
        assert.equal(await map.getAttribute('data-view'),target,'Open related module');
        await map.getByRole('button',{ name:'Back',exact:true }).click();
        assert.equal(await map.getAttribute('data-view'),id);
      }
      const connected = await page.evaluate(() => Object.entries(window.WritingDiagramData.views).find(([,view]) => view.localized.en.html.includes('class="connection"'))?.[0]);
      if (connected) {
        await map.locator('select').selectOption(connected);
        await settle();
        const first = map.locator('.connection').first();
        await first.focus();
        assert(await map.locator('.connection.is-active').count() > 0,'Trace selected connection');
        await map.getByRole('button',{ name:'Animate connections',exact:true }).click();
        assert.equal(await map.locator('.tm-flowing').count(),1);
        await page.emulateMedia({ reducedMotion:'reduce' });
        assert.equal(await first.evaluate(node => getComputedStyle(node).animationName),'none');
        await page.emulateMedia({ reducedMotion:'no-preference' });
        await map.getByRole('button',{ name:'Stop animation',exact:true }).click();
      }
      await page.setViewportSize({ width:390,height:844 });
      for (const language of ['zh','en','ja']) {
        await page.locator(`[data-language="${language}"]`).click();
        await map.locator('select').selectOption(views[0]);
        await settle();
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),`${route} horizontal overflow`);
        await map.locator('[data-expand]').click();
        await map.getByRole('button',{ name:language === 'en' ? 'Fit all' : language === 'zh' ? '全图' : '全体表示',exact:true }).click();
        await settle();
        const fits = await map.evaluate(host => {
          const shadow = host.shadowRoot;
          const canvas = shadow.querySelector('.canvas').getBoundingClientRect();
          const viewport = shadow.querySelector('.tm-viewport').getBoundingClientRect();
          return canvas.left >= viewport.left - 1 && canvas.top >= viewport.top - 1 && canvas.right <= viewport.right + 1 && canvas.bottom <= viewport.bottom + 1;
        });
        assert(fits,'Fit all preserves all canvas edges');
        if (language === 'en') await page.screenshot({ path:path.join(output,`${route.replaceAll('/','-')}-mobile.png`) });
        await page.keyboard.press('Escape');
        await page.locator('dialog.trajectory-dialog').waitFor({ state:'detached' });
      }
      assert.deepEqual(errors,[],route);
      await page.close();
      const fallback = await browser.newPage({ javaScriptEnabled:false });
      await fallback.goto(`${origin}/writing/${route}/`);
      assert(await fallback.locator('.trajectory-static[open]').count() > 0);
      assert.equal(await fallback.locator('.trajectory-map:visible').count(),0);
      await fallback.close();
      console.log(`Passed ${route}: ${views.length * 3} views, links, mobile, fullscreen, fallback.`);
    }
  } finally {
    fs.writeFileSync(path.join(output,'audit.json'),JSON.stringify(results,null,2));
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}
main().then(() => process.exit(0)).catch(error => { console.error(error); process.exit(1); });
