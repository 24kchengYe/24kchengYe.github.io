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
  const viewport = shadow.querySelector('.tm-viewport').getBoundingClientRect();
  if (Math.abs(bounds.left + bounds.width / 2 - viewport.left - viewport.width / 2) > 1) errors.push('Canvas is not horizontally centered');
  if (bounds.height <= viewport.height - 31 && Math.abs(bounds.top + bounds.height / 2 - viewport.top - viewport.height / 2) > 1) errors.push('Canvas is not vertically centered');
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
    if (canvas.hasAttribute('data-research-diagram')) {
      const owner = node.parentElement.closest('.node');
      if (owner) {
        const frame = owner.getBoundingClientRect();
        if (box.left < frame.left + scale * 8 || box.right > frame.right - scale * 8 || box.top < frame.top + scale * 8 || box.bottom > frame.bottom - scale * 8) errors.push(`Text outside node ${owner.id}: ${node.textContent}`);
      }
    }
  }
  if (canvas.hasAttribute('data-research-diagram')) {
    for (const node of canvas.querySelectorAll('.node')) {
      const frame = node.getBoundingClientRect();
      const labels = [...node.children].filter(child => !child.hidden);
      if (getComputedStyle(node).textAlign !== 'center') errors.push(`Node text is not centered: ${node.id}`);
      for (const label of labels) {
        const text = document.createRange();
        text.selectNodeContents(label);
        for (const line of text.getClientRects()) {
          if (line.width && Math.abs(line.left + line.width / 2 - frame.left - frame.width / 2) > scale * 2) errors.push(`Off-center node label: ${node.id}`);
        }
      }
      const first = labels[0]?.getBoundingClientRect();
      const last = labels.at(-1)?.getBoundingClientRect();
      if (first && last && Math.abs((first.top + last.bottom) / 2 - frame.top - frame.height / 2) > scale * 2) errors.push(`Off-center node text group: ${node.id}`);
    }
    const blocks = [...canvas.querySelectorAll('.node,.label')];
    for (let first = 0; first < blocks.length; first += 1) for (let second = first + 1; second < blocks.length; second += 1) {
      const left = blocks[first].getBoundingClientRect();
      const right = blocks[second].getBoundingClientRect();
      if (Math.min(left.right, right.right) - Math.max(left.left, right.left) > scale * 2 && Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top) > scale * 2) errors.push(`Overlapping blocks: ${blocks[first].id || blocks[first].textContent} / ${blocks[second].id || blocks[second].textContent}`);
    }
  }
  const vector = canvas.querySelector('svg');
  if (canvas.classList.contains('vector-canvas') && vector) {
    for (const connector of vector.querySelectorAll('path[data-axis]')) {
      const axis = connector.dataset.axis === 'vertical' ? 0 : 1;
      const positions = connector.getAttribute('d').match(/-?\d+(?:\.\d+)?/g).map(Number).filter((value,index) => index % 2 === axis);
      if (Math.max(...positions) - Math.min(...positions) > 0.01) errors.push(`Slanted axis-aligned connector: ${connector.parentElement.id}`);
    }
    const frame = vector.getBoundingClientRect();
    const viewBox = vector.getAttribute('viewBox').split(/\s+/).map(Number);
    const factor = Math.min(frame.width / viewBox[2], frame.height / viewBox[3]);
    const origin = { x:frame.left + (frame.width - viewBox[2] * factor) / 2 - viewBox[0] * factor, y:frame.top + (frame.height - viewBox[3] * factor) / 2 - viewBox[1] * factor };
    const labels = [...vector.querySelectorAll('text')].map(element => ({ element,id:element.parentElement.id,box:element.getBoundingClientRect() }));
    const overlaps = (first,second) => Math.min(first.right,second.right) - Math.max(first.left,second.left) > factor && Math.min(first.bottom,second.bottom) - Math.max(first.top,second.top) > factor;
    const nodeIds = [...new Set(labels.map(label => label.element.dataset.nodeBox).filter(Boolean))];
    for (const [index,label] of labels.entries()) {
      for (const other of labels.slice(index + 1)) if (overlaps(label.box,other.box)) errors.push(`Overlapping vector text: ${label.id}/${other.id}`);
      for (const id of nodeIds) {
        const shape = vector.querySelector(`[id="${id}"]>path`);
        const box = shape.getBoundingClientRect();
        if (label.element.dataset.nodeBox === id) {
          if (label.box.left < box.left + factor * 2 || label.box.right > box.right - factor * 2 || label.box.top < box.top + factor * 2 || label.box.bottom > box.bottom - factor * 2) errors.push(`Vector text outside node: ${label.id}/${id}`);
        } else if (overlaps(label.box,box)) errors.push(`Vector text overlaps another node: ${label.id}/${id}`);
      }
    }
    for (const connection of vector.querySelectorAll('.connection>g>path:first-child')) {
      let start = [0,0];
      const hits = new Set();
      const commands = connection.getAttribute('d');
      if (/[a-zA-Z]/.test(commands.replace(/[MLQ]/g,''))) errors.push(`Unsupported connector geometry: ${connection.parentElement.id}`);
      for (const segment of commands.match(/[MLQ][^MLQ]*/g) || []) {
        const points = (segment.slice(1).match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
        const end = points.slice(-2);
        if (segment[0] !== 'M') for (let sample = 0; sample <= 120; sample += 1) {
          const weight = sample / 120;
          const position = start.map((value,axis) => segment[0] === 'Q' ? (1 - weight) ** 2 * value + 2 * (1 - weight) * weight * points[axis] + weight ** 2 * end[axis] : value + weight * (end[axis] - value));
          const horizontal = origin.x + position[0] * factor;
          const vertical = origin.y + position[1] * factor;
          for (const label of labels) if (horizontal > label.box.left + factor && horizontal < label.box.right - factor && vertical > label.box.top + factor && vertical < label.box.bottom - factor) hits.add(label.id);
        }
        start = end;
      }
      for (const id of hits) errors.push(`Connector crosses text: ${connection.parentElement.id}/${id}`);
    }
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
      assert.equal(await map.locator('.tm-breadcrumb:visible').count(),0,'No duplicate current-view breadcrumb');
      assert.equal(await map.locator('.tm-status:visible').count(),0,'Reading help is opt-in');
      assert.equal(await page.locator('.map-ready>.panel-label:visible,.map-ready>.map-duplicate-caption:visible').count(),0,'Duplicate figure titles stay in the static fallback');
      await map.getByRole('button',{ name:'读图帮助',exact:true }).click();
      assert.equal(await map.locator('.tm-status:visible').count(),1);
      await map.getByRole('button',{ name:'读图帮助',exact:true }).click();
      const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const views = await page.evaluate(() => Object.keys(window.WritingDiagramData.views));
      for (const language of ['zh','en','ja']) {
        await page.locator(`[data-language="${language}"]`).click();
        for (const id of views) {
          await map.locator('select[data-view-control]').selectOption(id);
          await settle();
          assert.equal(await map.getAttribute('data-view'),id,'Selected view must render');
          const issues = await map.evaluate(inspect);
          results.push({ route,language,id,issues });
          if (issues.length) console.error('Runtime errors:',errors);
          assert.deepEqual(issues,[],`${route}/${id}/${language}`);
          if (language === 'en' && !route.includes('/')) await map.screenshot({ path:path.join(output,`${id}-en.png`) });
          const detailNode = map.locator('.node:has([data-node-detail])').first();
          if (await detailNode.count()) {
            const expectedDetail = await detailNode.locator('[data-node-detail]').textContent();
            await detailNode.focus();
            await page.keyboard.press('Enter');
            assert.equal(await map.getAttribute('data-view'), id, 'Brief nodes open details before drill-down');
            assert.equal((await map.locator('.tm-aside .tm-node-detail').textContent()).trim(), expectedDetail.trim());
            const linked = map.locator('.node[data-drill]:has([data-node-detail])').first();
            if (await linked.count()) {
              const target = await linked.getAttribute('data-drill');
              await linked.focus();
              await page.keyboard.press('Enter');
              const title = await page.evaluate(({ target, language }) => {
                const data = window.WritingDiagramData;
                return language === 'zh' ? data.views[target].title : data.strings[data.views[target].title][language === 'en' ? 0 : 1];
              }, { target, language });
              await map.locator('.tm-aside').getByRole('button', { name:title, exact:true }).first().click();
              assert.equal(await map.getAttribute('data-view'), target);
            }
            await map.locator('select[data-view-control]').selectOption(id);
          }
        }
      }
      await page.locator('[data-language="en"]').click();
      const linkedView = await page.evaluate(() => Object.entries(window.WritingDiagramData.views).find(([,view]) => Object.keys(view.links).length));
      if (linkedView) {
        const [id,view] = linkedView;
        const [node,target] = Object.entries(view.links)[0];
        await map.locator('select[data-view-control]').selectOption(id);
        await settle();
        await map.locator(`[id="${node}"]`).focus();
        await page.keyboard.press('Enter');
        assert.equal(await map.getAttribute('data-view'),target,'Open related module');
        await map.getByRole('button',{ name:'Back',exact:true }).click();
        assert.equal(await map.getAttribute('data-view'),id);
      }
      const connected = await page.evaluate(() => Object.entries(window.WritingDiagramData.views).find(([,view]) => view.localized.en.html.includes('class="connection"'))?.[0]);
      if (connected) {
        await map.locator('select[data-view-control]').selectOption(connected);
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
        for (const mobileView of [views[0], ...views.filter(id => id.endsWith('-full-workflow') || id.endsWith('-recorded-case'))]) {
          await map.locator('select[data-view-control]').selectOption(mobileView);
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
          if (language === 'en') await page.screenshot({ path:path.join(output,`${route.replaceAll('/','-')}-${mobileView}-mobile.png`) });
          await page.keyboard.press('Escape');
          await page.locator('dialog.trajectory-dialog').waitFor({ state:'detached' });
        }
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
