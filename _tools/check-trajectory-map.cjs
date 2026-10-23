const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const root = path.join(__dirname, '..');
const output = path.resolve(process.env.MAP_REVIEW_DIR || path.join(root,'_preview/trajectory-map'));
const config = JSON.parse(fs.readFileSync(path.join(root,'_data/writing/trajectory-map.json'),'utf8'));
const report = [];

function inspectMap(host) {
  const shadow = host.shadowRoot;
  const canvas = shadow.querySelector('.canvas');
  const errors = [];
  const box = canvas.getBoundingClientRect();
  const scale = box.width / parseFloat(getComputedStyle(canvas).width);
  const outside = (inner, outer) => inner.left < outer.left - scale || inner.top < outer.top - scale || inner.right > outer.right + scale || inner.bottom > outer.bottom + scale;
  const overlaps = (first, second) => Math.min(first.right,second.right) - Math.max(first.left,second.left) > scale && Math.min(first.bottom,second.bottom) - Math.max(first.top,second.top) > scale;
  const selector = '.node,.event,.checkpoint,.restore,.bundle';
  for (const node of canvas.querySelectorAll('.event')) {
    const style = getComputedStyle(node);
    if (['borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth'].some(side => parseFloat(style[side]) < 1)) errors.push(['missing-event-border',node.id]);
  }
  if (host.dataset.view !== 'case') {
    const motion = [...shadow.querySelectorAll('.tm-tools button')].find(control => control.hasAttribute('aria-pressed'));
    if (!motion) errors.push(['missing-flow-animation']);
    for (const node of canvas.querySelectorAll('.node')) if (getComputedStyle(node).fontSize !== '28px') errors.push(['inconsistent-node-type',node.id]);
    for (const secondary of canvas.querySelectorAll('.sub')) if (getComputedStyle(secondary).fontSize !== '24px') errors.push(['inconsistent-secondary-type',secondary.textContent]);
  }
  const walker = document.createTreeWalker(canvas,NodeFilter.SHOW_TEXT);
  const texts = [];
  while (walker.nextNode()) {
    const text = walker.currentNode;
    if (!text.textContent.trim()) continue;
    const range = document.createRange();
    range.selectNodeContents(text);
    const bounds = range.getBoundingClientRect();
    if (outside(bounds,box)) errors.push(['canvas-overflow',text.textContent]);
    const node = text.parentElement.closest(selector);
    if (node && outside(bounds,node.getBoundingClientRect())) errors.push(['node-overflow',node.id,text.textContent]);
    texts.push({ label:text.textContent,rects:[...range.getClientRects()] });
  }
  for (let first = 0; first < texts.length; first++) {
    for (let second = first + 1; second < texts.length; second++) {
      if (texts[first].rects.some(left => texts[second].rects.some(right => overlaps(left,right)))) errors.push(['text-overlap',texts[first].label,texts[second].label]);
    }
  }
  const original = new DOMParser().parseFromString(window.TrajectoryMapData.views[host.dataset.view].localized[document.documentElement.lang].html,'text/html');
  const signature = parent => ({
    nodes:[...parent.querySelector('.canvas').querySelectorAll('[id]')].map(node => node.id).sort(),
    edges:[...parent.querySelector('.canvas').querySelectorAll('.connection')].map(edge => `${edge.dataset.from}>${edge.dataset.to}:${edge.dataset.logicalEdge || edge.dataset.relation || ''}`).sort(),
    text:parent.querySelector('.canvas').textContent.replace(/\s+/g,' ').trim()
  });
  if (JSON.stringify(signature(original)) !== JSON.stringify(signature(shadow))) errors.push(['source-fidelity']);
  return errors;
}

async function checkVisible(map, selector) {
  const visible = await map.evaluate((host, target) => {
    const shadow = host.shadowRoot;
    const viewport = shadow.querySelector('.tm-viewport').getBoundingClientRect();
    const bounds = shadow.querySelector('.tm-viewport').querySelector(target).getBoundingClientRect();
    return bounds.left >= viewport.left - 1 && bounds.top >= viewport.top - 1 && bounds.right <= viewport.right + 1 && bounds.bottom <= viewport.bottom + 1;
  }, selector);
  assert(visible, `${selector} must fit inside the viewport`);
}

async function main() {
  fs.mkdirSync(output,{ recursive:true });
  const server = http.createServer((request,response) => {
    const route = decodeURIComponent(new URL(request.url,'http://localhost').pathname);
    if (route === '/favicon.ico') { response.writeHead(204).end(); return; }
    const file = path.resolve(root,'.' + route + (route.endsWith('/') ? 'index.html' : ''));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) { response.writeHead(404).end(); return; }
    const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml' };
    response.writeHead(200,{ 'Content-Type':types[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(response);
  });
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const origin = process.env.MAP_REVIEW_ORIGIN || `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath:process.env.CHROME_PATH,headless:true } : { headless:true });
    const page = await browser.newPage({ viewport:{ width:1440,height:1000 } });
    const errors = [];
    page.on('pageerror',error => errors.push(error.message));
    page.on('console',message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('response',response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    await page.goto(`${origin}/writing/coding-agent-trajectories/?lang=zh`);
    const map = page.locator('#trajectory-map-1');
    await map.locator('.tm-shell').waitFor();
    assert.equal(await map.locator('select').inputValue(),'overview','First figure opens the overview');
    assert.equal(await page.locator('#trajectory-map-2 select').inputValue(),'complete','Second figure opens the full workflow');
    const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    for (const language of ['zh','en','ja']) {
      await page.locator(`[data-language="${language}"]`).click();
      for (const id of Object.keys(config.views)) {
        await map.locator('select').selectOption(id);
        await settle();
        const issues = await map.evaluate(inspectMap);
        report.push({ view:id,language,issues });
        assert.deepEqual(issues,[],`${id}/${language}`);
        await map.screenshot({ path:path.join(output,`${id}-${language}.png`) });
        await map.getByRole('button',{ name:language === 'zh' ? '全图' : language === 'en' ? 'Fit all' : '全体表示',exact:true }).click();
        await settle();
        await checkVisible(map,'.canvas');
      }
    }
    assert.equal(await page.locator('.trajectory-map').count(),8);
    const other = page.locator('#trajectory-map-2');
    const otherEntry = await other.getAttribute('data-entry');
    await page.locator('[data-language="en"]').click();
    await map.locator('select').selectOption('overview');
    await settle();
    await map.locator('#harness').hover();
    assert(await map.locator('.connection.is-active').count() > 0,'Hover must trace connections');
    await map.locator('#harness').click();
    assert.equal(await map.getAttribute('data-view'),'harness');
    await map.locator('#AM').click();
    assert.equal(await map.getAttribute('data-view'),'rollout');
    assert.equal(await other.getAttribute('data-view'),otherEntry,'Each inline map navigates independently');
    await map.locator('.tm-breadcrumb button[aria-label="Back"]').click();
    assert.equal(await map.getAttribute('data-view'),'harness');
    await map.locator('select').selectOption('offline');
    await map.locator('#CR').click();
    assert.equal(await map.getAttribute('data-view'),'online');
    await map.locator('.port[data-port="2"]').click();
    assert(await map.locator('#BN').evaluate(node => node.classList.contains('is-active')));
    await map.getByRole('button',{ name:'Fit all',exact:true }).click();
    await map.locator('.connection[data-to="C0"]').focus();
    await page.keyboard.press('Enter');
    assert.equal(await map.getAttribute('data-view'),'offline','Panel boundary links open their destination');
    assert(!(await map.locator('.tm-aside').innerText()).includes('BO →'),'Cross-panel links use translated titles');
    await map.locator('select').selectOption('case');
    await settle();
    assert(await map.locator('.tm-aside').evaluate(node => node.hidden),'Replay details start collapsed to preserve canvas width');
    assert.equal(await map.locator('.tm-viewport').evaluate(node => getComputedStyle(node).overflowY),'auto','Long cases have native scrolling');
    const caseViewport = map.locator('.tm-viewport');
    await caseViewport.hover();
    await page.mouse.wheel(0,500);
    await page.waitForFunction(() => document.getElementById('trajectory-map-1').shadowRoot.querySelector('.tm-viewport').scrollTop > 100);
    await caseViewport.evaluate(node => { node.scrollTop = node.scrollHeight; });
    await settle();
    await checkVisible(map,'#p15');
    await checkVisible(map,'.footer');
    const mini = map.locator('.tm-minimap');
    await mini.click({ position:{x:48,y:20} });
    await settle();
    assert(await caseViewport.evaluate(node => node.scrollTop < 200),'Overview navigation reaches the beginning');
    await mini.click({ position:{x:48,y:225} });
    await settle();
    assert(await caseViewport.evaluate(node => node.scrollTop > 1500),'Overview navigation reaches the end');
    await map.getByRole('button',{name:'Event details',exact:true}).click();
    for (const [index,id] of config.views.case.sequence.entries()) {
      await map.locator('input[type="range"]').evaluate((input,value) => { input.value = value; input.dispatchEvent(new Event('input',{ bubbles:true })); },index);
      assert((await map.locator('.tm-replay output').innerText()).includes(`${index + 1} / 21`));
      const source = await map.locator('#' + id).evaluate(node => ({ action:node.querySelector('.action')?.textContent, response:node.querySelector('.response')?.textContent, state:node.querySelector('.state')?.textContent }));
      const text = await map.locator('.tm-aside').innerText();
      for (const value of Object.values(source)) if (value) assert(text.includes(value),'Replay must retain action, result and state');
      await settle();
      await checkVisible(map,'#' + id);
    }
    await map.locator('input[type="range"]').evaluate(input => { input.value = 4; input.dispatchEvent(new Event('input',{ bubbles:true })); });
    await map.locator('.tm-aside button').filter({ hasText:'Before T3' }).click();
    assert.equal(await map.locator('input[type="range"]').inputValue(),'5','Rewind follows the second checkpoint visit');
    await map.locator('.tm-aside button').filter({ hasText:'Rewrite fields' }).click();
    assert.equal(await map.locator('input[type="range"]').inputValue(),'6','Related node updates replay cursor');
    await map.getByRole('button',{ name:'Restart',exact:true }).click();
    await map.getByRole('button',{ name:'Play recording',exact:true }).click();
    await page.waitForFunction(() => document.getElementById('trajectory-map-1').shadowRoot.querySelector('input[type="range"]').value === '1');
    await map.getByRole('button',{ name:'Pause',exact:true }).click();
    assert.equal(await map.locator('.tm-replaying').count(),0);
    await map.locator('input[type="range"]').evaluate(input => { input.value = 4; input.dispatchEvent(new Event('input',{ bubbles:true })); });
    await page.locator('[data-language="ja"]').click();
    assert.equal(await map.getAttribute('data-view'),'case');
    assert.equal(await map.locator('input[type="range"]').inputValue(),'4');
    await map.locator('[data-expand]').click();
    assert.equal(await page.locator('dialog.trajectory-dialog[open]').count(),1);
    await settle();
    await map.screenshot({ path:path.join(output,'replay-expanded-ja.png') });
    await page.keyboard.press('Escape');
    await page.locator('dialog.trajectory-dialog').waitFor({ state:'detached' });
    assert.equal(await page.locator('dialog.trajectory-dialog').count(),0);
    await map.locator('select').selectOption('overview');
    await settle();
    const viewport = map.locator('.tm-viewport');
    await viewport.focus();
    const before = await map.locator('.tm-world').getAttribute('style');
    await page.keyboard.press('ArrowRight');
    assert.notEqual(await map.locator('.tm-world').getAttribute('style'),before,'Keyboard panning');
    await page.keyboard.press('+');
    await page.keyboard.press('0');
    await checkVisible(map,'.canvas');
    await viewport.scrollIntoViewIfNeeded();
    const bounds = await viewport.boundingBox();
    const dragStart = await map.locator('.tm-world').getAttribute('style');
    await page.mouse.move(bounds.x + 5,bounds.y + 5);
    await page.mouse.down();
    await page.mouse.move(bounds.x + 65,bounds.y + 65,{ steps:4 });
    await page.mouse.up();
    assert.notEqual(await map.locator('.tm-world').getAttribute('style'),dragStart,'Pointer dragging pans');
    await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
    assert.equal(await page.locator('.trajectory-static[open]').count(),8,'Print expands static fallbacks');
    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
    assert.equal(await page.locator('.trajectory-static[open]').count(),0,'Print restores fallback state');
    await page.setViewportSize({ width:390,height:844 });
    for (const language of ['zh','en','ja']) {
      await page.locator(`[data-language="${language}"]`).click();
      await map.locator('select').selectOption('overview');
      await settle();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),'Mobile horizontal overflow');
      await map.screenshot({ path:path.join(output,`mobile-overview-${language}.png`) });
      await map.locator('select').selectOption('case');
      const details = map.getByRole('button',{name:language === 'zh' ? '事件详情' : language === 'en' ? 'Event details' : 'イベントの詳細',exact:true});
      if (await details.getAttribute('aria-expanded') === 'true') await details.click();
      await settle();
      await map.locator('.tm-viewport').evaluate(node => { node.scrollTop = node.scrollHeight; });
      await settle();
      await checkVisible(map,'#p15');
      await map.locator('[data-expand]').click();
      await settle();
      assert(await map.locator('.tm-viewport').evaluate(node => node.clientHeight >= 160),'Mobile expanded viewport');
      const touchAction = await map.locator('.tm-viewport').evaluate(node => getComputedStyle(node).touchAction);
      assert(touchAction === 'manipulation' || touchAction.includes('pan-y'),'Expanded replay supports native touch scrolling');
      await page.screenshot({ path:path.join(output,`mobile-replay-${language}.png`) });
      await map.locator('input[type="range"]').evaluate(input => { input.value = 10; input.dispatchEvent(new Event('input',{ bubbles:true })); });
      await settle();
      await checkVisible(map,'#restore5');
      await details.click();
      await settle();
      await checkVisible(map,'#restore5');
      await page.keyboard.press('Escape');
      await page.locator('dialog.trajectory-dialog').waitFor({ state:'detached' });
      await map.locator('select').selectOption('complete');
      await map.locator('[data-expand]').click();
      await map.getByRole('button',{ name:language === 'zh' ? '全图' : language === 'en' ? 'Fit all' : '全体表示',exact:true }).click();
      await settle();
      await checkVisible(map,'.canvas');
      await page.keyboard.press('Escape');
      await page.locator('dialog.trajectory-dialog').waitFor({ state:'detached' });
    }
    assert.deepEqual(errors,[],'Runtime / console errors');
    const noScript = await browser.newPage({ javaScriptEnabled:false });
    await noScript.goto(`${origin}/writing/coding-agent-trajectories/`);
    assert.equal(await noScript.locator('.trajectory-static[open]').count(),8);
    assert.equal(await noScript.locator('.trajectory-map:visible').count(),0);
    await noScript.close();
    const unavailableStyles = await browser.newPage();
    await unavailableStyles.route('**/assets/css/trajectory-map.css*',route => route.abort());
    await unavailableStyles.goto(`${origin}/writing/coding-agent-trajectories/`);
    await unavailableStyles.waitForLoadState('networkidle');
    assert.equal(await unavailableStyles.locator('.trajectory-static[open]').count(),8,'Unavailable map styles retain static figures');
    assert.equal(await unavailableStyles.locator('.trajectory-map:visible').count(),0);
    await unavailableStyles.close();
    const reference = await browser.newPage();
    await reference.goto(`${origin}/writing/automation-blueprint/?lang=en`);
    await reference.locator('.am-world').waitFor();
    assert(await reference.locator('.am-node').count() > 20,'Automation reference remains intact');
    await reference.close();
    console.log('Passed: 27 interactive views, source fidelity, drill-down, feedback navigation, 21 replay events, three-language mobile, fullscreen, keyboard, no-JS fallback and automation regression.');
  } finally {
    fs.writeFileSync(path.join(output,'audit.json'),JSON.stringify(report,null,2));
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}
main().then(() => process.exit(0)).catch(error => { console.error(error); process.exit(1); });
