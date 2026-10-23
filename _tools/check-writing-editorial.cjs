const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const root = path.join(__dirname, '..');
const routes = ['spec-generation', 'spec-generation/technical', 'spec-generation/essay', 'spec-repair', 'spec-repair/technical', 'rubric-model', 'rubric-model/technical', 'nimble-kev', 'attention-mechanisms', 'coding-agent-trajectories', 'automation-blueprint', 'agent-memory'];
const languages = ['zh', 'en', 'ja'];
const editorialResidue = /本文整理自|两份原始文档|两份文档还指出|全面版另附|当期会话记录|主快照、路径与哈希见|离线阅读版|来源：2026 年 10 月的实现分析|页面不连接原项目的内网服务|implementation analysis and historical production-trace review|Based on the HTML report|Based on CLI trajectory synthesis|原文档|オフライン閲覧版/;
const privateLink = /larkoffice\.com|feishu\.cn|localhost|127\.0\.0\.1|^file:|\/Users\/|https?:\/\/10\.\d+\.\d+\.\d+/;
const githubPrefix = 'https://github.com/24kchengYe/24kchengYe.github.io/';
let sourceLinks = 0;

for (const route of routes) {
  const dom = new JSDOM(fs.readFileSync(path.join(root, 'writing', route, 'index.html'), 'utf8'));
  const document = dom.window.document;
  const article = document.querySelector('article,main');
  assert(article, `${route}: missing article`);
  assert.equal(article.querySelectorAll('.article-resources').length, 1, `${route}: one shared source entry`);
  assert.equal(article.querySelectorAll('.figure-source,.figure-source-link,.automation-source').length, 0, `${route}: per-figure source controls remain`);
  const resources = article.querySelector('.article-resources');
  assert(!resources.open, `${route}: sources must be collapsed by default`);
  assert.equal(resources.parentElement, article, `${route}: sources belong at article level`);
  assert(!resources.closest('figure'), `${route}: sources must not repeat inside a figure`);
  assert(resources.querySelector('summary'), `${route}: missing source label`);
  const hrefs = [...resources.querySelectorAll('a')].map(anchor => anchor.getAttribute('href'));
  assert.equal(hrefs.length, new Set(hrefs).size, `${route}: duplicate source links`);
  assert(hrefs.length >= 2, `${route}: missing source files`);
  for (const anchor of resources.querySelectorAll('a')) {
    assert(anchor.href.startsWith(githubPrefix), `${route}: unexpected source host`);
    const relative = anchor.href.slice(githubPrefix.length).replace(/^(?:blob|tree)\/main\//, '');
    assert(fs.existsSync(path.join(root, relative)), `${route}: missing resource ${relative}`);
    for (const language of languages) assert(anchor.querySelector(`[lang="${language}"]`)?.textContent.trim(), `${route}: untranslated source label`);
  }
  for (const anchor of document.querySelectorAll('a[href]')) assert(!privateLink.test(anchor.href), `${route}: private source link ${anchor.href}`);
  for (const language of languages) {
    const visible = article.cloneNode(true);
    visible.querySelectorAll('script,style,svg').forEach(element => element.remove());
    visible.querySelectorAll('[lang]').forEach(element => { if (element.lang !== language) element.remove(); });
    assert(!editorialResidue.test(visible.textContent), `${route}/${language}: editorial residue`);
    assert(resources.querySelector(`summary [lang="${language}"]`)?.textContent.trim(), `${route}/${language}: source summary missing`);
    if (route === 'agent-memory') {
      const evidence = visible.textContent;
      for (const value of ['303', '98', '200,000', '120,000', '40,000']) assert(evidence.includes(value), `${route}/${language}: missing ${value}`);
      assert(!/10,138|56,945|user-role/.test(evidence), `${route}/${language}: low-signal message inventory remains`);
      for (const selector of ['#input-path', '#compression-path', '#lifecycle-path']) assert(visible.querySelector(selector)?.textContent.trim(), `${route}/${language}: missing mechanism ${selector}`);
      const narrative = visible.cloneNode(true);
      narrative.querySelectorAll('details').forEach(element => element.remove());
      assert(!/200,000|120,000|40,000/.test(narrative.textContent), `${route}/${language}: implementation budgets belong in collapsed details`);
    }
  }
  if (route === 'attention-mechanisms') assert(document.querySelectorAll('a[href*="arxiv.org"]').length >= 8, 'Keep primary paper references');
  if (route === 'rubric-model' || route === 'rubric-model/technical') {
    const overview = document.getElementById('rubric-model-two-judges');
    const specInputs = document.getElementById('rubric-model-spec-io');
    const artifactInputs = document.getElementById('rubric-model-artifact-io');
    assert(overview && specInputs && artifactInputs, `${route}: both Judge input/output figures are required`);
    assert.equal(overview.nextElementSibling, specInputs, `${route}: Spec Judge inputs belong below the overview`);
    assert.equal(specInputs.nextElementSibling, artifactInputs, `${route}: artifact Judge inputs follow Spec Judge inputs`);
    assert(!document.getElementById('figure-figure_01_task_io'), `${route}: superseded input/output diagram must not repeat`);
    for (const figure of [specInputs, artifactInputs]) {
      for (const language of languages) assert(figure.querySelector(`figcaption [lang="${language}"]`)?.textContent.trim(), `${route}/${language}: input/output caption missing`);
    }
  }
  if (route === 'spec-generation' || route === 'spec-generation/technical') {
    const appendix = document.querySelector('details.name-key');
    assert(appendix && !appendix.open && appendix.querySelector('table'), `${route}: keep the PE index in a collapsed appendix`);
  }
  sourceLinks += hrefs.length;
  dom.window.close();
}

const homepage = new JSDOM(fs.readFileSync(path.join(root, '_includes/writing.html'), 'utf8'));
const writing = homepage.window.document.querySelector('#writing');
const more = writing.querySelector('details#more-writing');
assert(more && !more.open, 'More writing must be collapsed by default');
assert.equal(writing.querySelectorAll(':scope > a.writing-row').length, 4, 'Keep four featured articles');
assert.equal(writing.querySelectorAll('a[href="/writing/agent-memory/"]').length, 1, 'Agent Memory has one homepage entry');
assert(more.querySelector('a[href="/writing/agent-memory/"]'), 'Agent Memory belongs in More writing');
assert.equal(Number(more.querySelector('.more-count').textContent), more.querySelectorAll('a.writing-row').length, 'More writing count matches its articles');
homepage.window.close();

assert.equal(fs.readFileSync(path.join(root, 'writing/spec-generation/essay/index.html'), 'utf8'), fs.readFileSync(path.join(root, 'writing/spec-generation/index.html'), 'utf8'), 'Keep the essay alias synchronized');
console.log(`Editorial checks passed: ${routes.length} routes × 3 languages; one source entry per article; ${sourceLinks} valid source links.`);
