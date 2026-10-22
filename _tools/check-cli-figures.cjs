const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

const root = path.join(__dirname, '..');
const output = path.resolve(process.env.FIGURE_REVIEW_DIR || path.join(root, '_preview/figure-review'));
const manifest = JSON.parse(fs.readFileSync(path.join(root, '_data/writing/figures/manifest.json'), 'utf8'));
const names = Object.keys(manifest).filter(name => name.startsWith('cli-'));
const languages = ['zh', 'en', 'ja'];
const graph = JSON.parse(fs.readFileSync(path.join(root, '_data/writing/figures/cli-trajectory-flow.json'), 'utf8'));
const results = [];

function layoutIssues() {
  const canvas = document.querySelector('.canvas');
  const bounds = canvas.getBoundingClientRect();
  const svg = document.documentElement;
  const issues = [];
  const outside = (inner, outer, tolerance = 1) => inner.left < outer.left - tolerance || inner.top < outer.top - tolerance || inner.right > outer.right + tolerance || inner.bottom > outer.bottom + tolerance;
  const overlaps = (first, second, tolerance = 1) => Math.min(first.right, second.right) - Math.max(first.left, second.left) > tolerance && Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top) > tolerance;
  if (bounds.width !== svg.viewBox.baseVal.width || bounds.height !== svg.viewBox.baseVal.height) issues.push({ type: 'canvas-viewbox-mismatch' });
  const walker = document.createTreeWalker(canvas, NodeFilter.SHOW_TEXT);
  const texts = [];
  const nodeSelector = '.node,.bundle,.event,.restore,.checkpoint';
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const label = node.textContent.trim();
    if (!label) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    const textBounds = range.getBoundingClientRect();
    if (outside(textBounds, bounds)) issues.push({ type: 'text-outside-canvas', label });
    const parent = node.parentElement.closest(nodeSelector);
    if (parent && outside(textBounds, parent.getBoundingClientRect(), -2)) issues.push({ type: 'text-outside-node', node: parent.id, label });
    texts.push({ label, rects: [...range.getClientRects()] });
  }
  for (let first = 0; first < texts.length; first++) {
    for (let second = first + 1; second < texts.length; second++) {
      if (texts[first].rects.some(left => texts[second].rects.some(right => overlaps(left, right)))) issues.push({ type: 'text-overlap', first: texts[first].label, second: texts[second].label });
    }
  }
  for (const label of canvas.querySelectorAll('.edge-label,.label,.note,.heading,.title')) {
    for (const node of canvas.querySelectorAll(nodeSelector)) {
      if (!node.contains(label) && overlaps(label.getBoundingClientRect(), node.getBoundingClientRect(), 3)) issues.push({ type: 'label-over-node', label: label.textContent.trim(), node: node.id });
    }
  }
  return issues;
}

function serve() {
  const types = { '.html': 'text/html', '.svg': 'image/svg+xml', '.js': 'text/javascript', '.css': 'text/css' };
  return http.createServer((request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    if (pathname === '/favicon.ico') { response.writeHead(204).end(); return; }
    const filename = path.resolve(root, '.' + decodeURIComponent(pathname) + (pathname.endsWith('/') ? 'index.html' : ''));
    if (!filename.startsWith(root + path.sep) || !fs.existsSync(filename) || !fs.statSync(filename).isFile()) { response.writeHead(404).end(); return; }
    response.writeHead(200, { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream' });
    fs.createReadStream(filename).pipe(response);
  });
}

async function checkFit(page) {
  const issue = await page.evaluate(() => {
    const viewport = document.querySelector('.figure-viewport');
    const image = viewport.querySelector('img').getBoundingClientRect();
    const bounds = viewport.getBoundingClientRect();
    return image.left < bounds.left - 1 || image.top < bounds.top - 1 || image.right > bounds.left + viewport.clientWidth + 1 || image.bottom > bounds.top + viewport.clientHeight + 1;
  });
  assert.equal(issue, false, 'Fit must show all four image edges');
}

async function checkArticle(browser, origin, width, height) {
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto(`${origin}/writing/coding-agent-trajectories/?lang=zh`);
  for (const language of languages) {
    await page.locator(`[data-language="${language}"]`).click();
    assert.equal(await page.locator('html').getAttribute('lang'), language);
    const figures = page.locator('figure img');
    for (let index = 0; index < await figures.count(); index++) {
      const figure = figures.nth(index);
      await figure.evaluate(image => { const fallback = image.closest('.trajectory-static'); if (fallback) fallback.open = true; });
      await figure.scrollIntoViewIfNeeded();
      await figure.evaluate(image => image.decode());
      const geometry = await figure.evaluate(image => {
        const bounds = image.getBoundingClientRect();
        return { left: bounds.left, right: bounds.right, ratio: bounds.width / bounds.height, natural: image.naturalWidth / image.naturalHeight, declared: Number(image.getAttribute('width')) / Number(image.getAttribute('height')), src: image.currentSrc };
      });
      assert(geometry.src.includes(`/figures/${language}/`), 'Figure language must follow article');
      assert(geometry.left >= -1 && geometry.right <= width + 1, 'Inline image outside page');
      assert(Math.abs(geometry.ratio - geometry.natural) < 0.002 && Math.abs(geometry.declared - geometry.natural) < 0.002, 'Distorted figure aspect ratio');
      await figure.click();
      await page.locator('#figure-zoom img').evaluate(image => image.decode());
      await checkFit(page);
      assert((await page.locator('#figure-zoom img').getAttribute('src')).includes(`/figures/${language}/`));
      if (index === 0) await page.screenshot({ path: path.join(output, `viewer-${width}-${language}.png`) });
      await page.locator('[data-viewer="width"]').click();
      const fitWidth = await page.locator('#figure-zoom img').evaluate(image => image.getBoundingClientRect().width);
      await page.locator('[data-viewer="in"]').click();
      assert(await page.locator('#figure-zoom img').evaluate(image => image.getBoundingClientRect().width) > fitWidth, 'Zoom must enlarge the image');
      const reachable = await page.locator('.figure-viewport').evaluate(viewport => {
        viewport.scrollLeft = viewport.scrollWidth;
        viewport.scrollTop = viewport.scrollHeight;
        const bounds = viewport.getBoundingClientRect();
        const image = viewport.querySelector('img').getBoundingClientRect();
        return image.right <= bounds.left + viewport.clientWidth + 1 && image.bottom <= bounds.top + viewport.clientHeight + 1;
      });
      assert(reachable, 'Zoomed bottom/right edges must remain reachable');
      await page.locator('[data-viewer="out"]').click();
      await page.locator('[data-viewer="fit"]').click();
      await checkFit(page);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#figure-zoom').getAttribute('open'), null);
      assert(await figure.evaluate(image => document.activeElement === image), 'Focus should return to opener');
    }
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Article must not overflow horizontally');
    results.push({ article: language, viewport: `${width}x${height}`, figures: await figures.count(), checks: 'load, language, aspect, fit, zoom, scroll, close, focus' });
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: path.join(output, `article-${width}-${language}.png`), fullPage: true });
  }
  const first = page.locator('figure img').first();
  await first.focus();
  await page.keyboard.press('Enter');
  await checkFit(page);
  await page.setViewportSize({ width: width === 390 ? 844 : 700, height: 540 });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await checkFit(page);
  await page.locator('[data-viewer="width"]').click();
  await page.locator('[data-viewer="in"]').click();
  await page.locator('.figure-viewport').evaluate(viewport => { viewport.scrollTop = 0; viewport.scrollLeft = 0; });
  const bounds = await page.locator('.figure-viewport').boundingBox();
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width / 2 - 80, bounds.y + bounds.height / 2 - 80, { steps: 4 });
  await page.mouse.up();
  assert(await page.locator('.figure-viewport').evaluate(viewport => viewport.scrollTop > 0 && viewport.scrollLeft > 0), 'Zoomed figure must support dragging');
  await page.locator('[data-viewer="close"]').click();
  assert.equal(await page.locator('#figure-zoom').getAttribute('open'), null);
  assert.deepEqual(errors, [], 'Browser console / resource errors');
  await page.close();
}

async function main() {
  fs.mkdirSync(output, { recursive: true });
  const server = serve();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH, headless: true } : { headless: true });
    const page = await browser.newPage({ viewport: { width: 2400, height: 3800 } });
    for (const language of languages) {
      for (const name of names) {
        await page.goto(`${origin}/writing/figures/${language}/${name}.svg`);
        await page.evaluate(() => document.fonts.ready);
        const issues = await page.evaluate(layoutIssues);
        results.push({ name, language, issues });
        if (name === 'cli-combined') {
          const edges = await page.locator('[data-logical-edge]').evaluateAll(elements => [...new Set(elements.map(element => element.dataset.logicalEdge).filter(Boolean))].sort());
          assert.deepEqual(edges, graph.edges.map(edge => `${edge.from}>${edge.to}`).sort(), 'All logical workflow branches must be preserved');
          for (const node of graph.nodes) assert.equal(await page.locator(`[id="${node.id}"]`).count(), 1, `Missing node ${node.id}`);
        }
        await page.locator('svg').first().screenshot({ path: path.join(output, `${name}-${language}.png`) });
        assert.deepEqual(issues, [], `${name} / ${language}`);
      }
    }
    await page.close();
    await checkArticle(browser, origin, 1280, 900);
    await checkArticle(browser, origin, 390, 844);
    console.log(`Passed: ${names.length * languages.length} figure layouts, 6 article/viewport combinations, viewer controls. Screenshots: ${output}`);
  } finally {
    fs.writeFileSync(path.join(output, 'audit.json'), JSON.stringify(results, null, 2) + '\n');
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

main().then(() => process.exit(0)).catch(error => { console.error(error); process.exit(1); });
