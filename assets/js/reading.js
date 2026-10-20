(() => {
  'use strict';
  const list = document.getElementById('report-list');
  if (!list) return;
  const reports = [...list.querySelectorAll('.report')].map(element => ({
    element,
    id: element.dataset.id,
    core: Number(element.dataset.core),
    selected: element.dataset.selected === 'true',
    technologies: JSON.parse(element.dataset.technologies),
    search: `${element.textContent} ${element.querySelector('h3 a').title}`.toLocaleLowerCase()
  }));
  // Public report IDs only. These are reading sequences, not performance rankings.
  const paths = {
    foundations: ['fffe3a68fde7', '29864daaa4da', '062b6f36b6d9', '256aff6da7f6', 'ae05c3745b70', 'e61712df4b8b'],
    architecture: ['f136305461ac', '3062b56ccb5c', '71c5692bf45f', 'd34b21f52753', '0eac14151cad', '0287ec0c0427'],
    posttraining: ['339895873692', 'cf2d197ad533', 'af0ec679eebb', '704e377fae0d', 'bc6ea548802a', 'd88dbc069c2f', '6d96409126d5', 'e61712df4b8b', 'af9031968d8e', '4a9d6ec982b5', 'bf6a2af2fae4']
  };
  const options = document.getElementById('technology-options');
  const terms = [...new Set(reports.flatMap(report => report.technologies))].sort((a, b) => a.localeCompare(b));
  const preferred = ['MoE', 'MLA', 'GRPO', 'PPO', 'RLVR'];
  terms.sort((a, b) => {
    const rank = term => preferred.includes(term) ? preferred.indexOf(term) : preferred.length;
    return rank(a) - rank(b);
  });
  terms.forEach(term => {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = term;
    label.append(input, document.createTextNode(term));
    options.append(label);
  });
  const search = document.getElementById('report-search');
  const count = document.getElementById('result-count');
  const reset = document.getElementById('clear-filters');
  const filter = document.querySelector('.technology-filter');
  const copy = {
    en: { reports: n => `${n} reports`, search: 'Search reports…', found: 'Foundations & scale', architecture: 'Architecture & efficiency', posttraining: 'Post-training & agents' },
    zh: { reports: n => `${n} 篇报告`, search: '搜索标题、公司、技术…', found: '基础与规模规律', architecture: '架构与效率', posttraining: '后训练与智能体' },
    ja: { reports: n => `${n} 件`, search: 'タイトル・企業・技術を検索…', found: '基礎とスケーリング', architecture: 'アーキテクチャと効率', posttraining: '事後学習とエージェント' }
  };
  let state;
  let visibleCount = 0;
  function readLocation() {
    const query = new URLSearchParams(location.search);
    const path = Object.hasOwn(paths, query.get('path')) ? query.get('path') : '';
    const scope = ['core', 'selected', 'archive'].includes(query.get('scope')) ? query.get('scope') : path ? 'selected' : 'core';
    return { scope, path, query: query.get('q') || '', technologies: query.getAll('tech').filter(term => terms.includes(term)) };
  }
  function updateCopy() {
    const language = copy[document.documentElement.lang] || copy.en;
    search.placeholder = language.search;
    const routeName = state.path ? language[state.path === 'foundations' ? 'found' : state.path] : '';
    count.textContent = `${routeName ? `${routeName} · ` : ''}${language.reports(visibleCount)}`;
  }
  function updateLocation(replace) {
    const url = new URL(location.href);
    url.search = '';
    if (state.scope !== 'core') url.searchParams.set('scope', state.scope);
    if (state.path) url.searchParams.set('path', state.path);
    if (state.query) url.searchParams.set('q', state.query);
    state.technologies.forEach(term => url.searchParams.append('tech', term));
    try { history[replace ? 'replaceState' : 'pushState'](null, '', url); } catch { /* Filters also work in restrictive file previews. */ }
  }
  function render() {
    const path = paths[state.path];
    const words = state.query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    const ordered = [...reports].sort((a, b) => {
      if (path) return path.indexOf(a.id) - path.indexOf(b.id);
      if (state.scope === 'core') return a.core - b.core;
      return 0;
    });
    const fragment = document.createDocumentFragment();
    visibleCount = 0;
    ordered.forEach(report => {
      const inScope = state.scope === 'archive' || (state.scope === 'selected' ? report.selected : report.core > 0);
      const inPath = !path || path.includes(report.id);
      const inTechnology = !state.technologies.length || state.technologies.some(term => report.technologies.includes(term));
      const searchable = `${report.search} ${report.technologies.join(' ').toLocaleLowerCase()}`;
      const visible = inScope && inPath && inTechnology && words.every(word => searchable.includes(word));
      report.element.hidden = !visible;
      if (visible) report.element.querySelector('.report-number').textContent = String(++visibleCount).padStart(2, '0');
      fragment.append(report.element);
    });
    list.append(fragment);
    search.value = state.query;
    options.querySelectorAll('input').forEach(input => { input.checked = state.technologies.includes(input.value); });
    document.querySelectorAll('[data-scope]').forEach(button => {
      button.setAttribute('aria-pressed', String(!state.path && button.dataset.scope === state.scope));
    });
    document.querySelectorAll('[data-path]').forEach(link => {
      if (link.dataset.path === state.path) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    document.getElementById('active-tech-count').textContent = state.technologies.length ? ` · ${state.technologies.length}` : '';
    document.getElementById('reading-order').hidden = !state.path && state.scope !== 'core';
    document.getElementById('empty-results').hidden = visibleCount > 0;
    reset.hidden = !state.path && !state.query && !state.technologies.length && state.scope === 'core';
    updateCopy();
  }
  document.querySelectorAll('[data-scope]').forEach(button => {
    button.addEventListener('click', () => {
      state.scope = button.dataset.scope;
      state.path = '';
      render();
      updateLocation(false);
    });
  });
  document.querySelectorAll('[data-path]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      state = { scope: 'selected', path: link.dataset.path, query: '', technologies: [] };
      render();
      updateLocation(false);
      document.getElementById('reports').scrollIntoView({ block: 'start' });
    });
  });
  options.addEventListener('change', () => {
    state.technologies = [...options.querySelectorAll('input:checked')].map(input => input.value);
    state.path = '';
    state.scope = 'selected';
    render();
    updateLocation(false);
  });
  search.addEventListener('input', () => {
    state.query = search.value;
    // A title search starts from the complete bibliography.
    if (state.query.trim()) { state.scope = 'archive'; state.path = ''; }
    render();
    updateLocation(true);
  });
  reset.addEventListener('click', () => {
    state = { scope: 'core', path: '', query: '', technologies: [] };
    render();
    updateLocation(false);
  });
  window.addEventListener('popstate', () => {
    state = readLocation();
    render();
    if (state.technologies.length) filter.open = true;
  });
  new MutationObserver(updateCopy).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  state = readLocation();
  render();
  if (state.technologies.length) filter.open = true;
  document.documentElement.classList.add('reading-ready');
})();
