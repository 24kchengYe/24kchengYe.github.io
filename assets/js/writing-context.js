/* Series navigation and three source-backed, optional reading notes. */
(() => {
  'use strict';
  const match = location.pathname.match(/\/writing\/([^/]+)\/(?:(technical|essay)\/)?(?:index\.html)?$/);
  if (!match || document.querySelector('.writing-series-top')) return;
  const slug = match[1];
  const technical = match[2] === 'technical';
  const series = [
    { slug: 'spec-generation', report: true, title: { en: 'Generating Better Specs', zh: '让模型写好 Spec', ja: 'よりよいSpecを生成する' } },
    { slug: 'spec-repair', report: true, title: { en: 'Repairing Specs with Feedback', zh: '用评审反馈修复 Spec', ja: '評価フィードバックでSpecを修復する' } },
    { slug: 'rubric-model', report: true, title: { en: 'From designs to artifacts: training rubric judges', zh: '从设计到产物：训练规则评审模型', ja: '設計から成果物へ：ルール評価モデルの訓練' } },
    { slug: 'coding-agent-trajectories', report: false, title: { en: 'Building Training Trajectories for Coding Agents', zh: '为 Coding Agent 构建训练轨迹', ja: 'Coding Agentの学習軌跡を構築する' } }
  ];
  const index = series.findIndex(item => item.slug === slug);
  const article = document.querySelector('.blog-article, .article-body, article, main.note, .report-main');
  const heading = article?.querySelector('h1');
  if (index < 0 || !article || !heading) return;
  const copy = {
    en: { series: 'The Spec series', previous: 'Previous', next: 'Next', source: 'In this article', close: 'Close note', note: 'Reading note', blog: 'Blog', part: 'Part' },
    zh: { series: 'Spec 系列', previous: '上一篇', next: '下一篇', source: '查看本文说明', close: '关闭注解', note: '术语注解', blog: 'Blog', part: '第' },
    ja: { series: 'Spec シリーズ', previous: '前の記事', next: '次の記事', source: '本文の説明へ', close: '注釈を閉じる', note: '用語の注釈', blog: 'Blog', part: '第' }
  };
  const lang = () => ['en', 'zh', 'ja'].includes(document.documentElement.lang) ? document.documentElement.lang : 'en';
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const url = item => `/writing/${item.slug}/${technical && item.report ? 'technical/' : ''}?lang=${lang()}`;
  const top = el('nav', 'writing-series-top');
  const toggle = el('button', 'writing-series-toggle');
  toggle.type = 'button';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'writing-series-list');
  const list = el('ol', 'writing-series-list');
  list.id = 'writing-series-list';
  list.hidden = true;
  top.append(toggle, list);
  heading.before(top);
  const bottom = el('nav', 'writing-series-bottom');
  article.append(bottom);
  function seriesLink(item, position) {
    const link = el('a', 'writing-series-link');
    link.href = url(item);
    const number = el('span', 'writing-series-number', String(position + 1).padStart(2, '0'));
    const title = el('span', 'writing-series-title', item.title[lang()]);
    link.append(number, title);
    if (technical && !item.report) link.append(el('span', 'writing-series-format', copy[lang()].blog));
    if (position === index) link.setAttribute('aria-current', 'page');
    return link;
  }
  function renderSeries() {
    const c = copy[lang()];
    top.setAttribute('aria-label', c.series);
    bottom.setAttribute('aria-label', c.series);
    toggle.replaceChildren(el('span', '', c.series), el('span', 'writing-series-position', `${index + 1} / ${series.length}`));
    const chevron = el('span', 'writing-series-chevron', '⌄');
    chevron.setAttribute('aria-hidden', 'true');
    toggle.append(chevron);
    list.replaceChildren(...series.map((item, position) => {
      const row = el('li');
      row.append(seriesLink(item, position));
      return row;
    }));
    bottom.replaceChildren();
    for (const direction of [-1, 1]) {
      const position = index + direction;
      const item = series[position];
      if (!item) continue;
      const link = el('a', `writing-series-neighbor ${direction < 0 ? 'is-previous' : 'is-next'}`);
      link.href = url(item);
      link.append(el('span', 'writing-series-direction', direction < 0 ? `← ${c.previous}` : `${c.next} →`), el('span', 'writing-series-title', item.title[lang()]));
      if (technical && !item.report) link.append(el('span', 'writing-series-format', c.blog));
      bottom.append(link);
    }
  }
  toggle.addEventListener('click', () => {
    list.hidden = !list.hidden;
    toggle.setAttribute('aria-expanded', String(!list.hidden));
  });
  top.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !list.hidden) {
      list.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
      event.stopPropagation();
    }
  });
  renderSeries();

  // These explanations describe the methods used in the existing rubric-model
  // article. They are not generic claims about every implementation of a method.
  const notes = slug === 'rubric-model' ? [
    { id: 'rubric', pattern: { en: /\brubrics?\b/i, zh: /\brubric\b/i, ja: /ルーブリック/ }, title: { en: 'Rubric', zh: 'Rubric · 评审规则', ja: 'ルーブリック' },
      text: { en: 'In this article, each rule specifies its applicability, violations, and exceptions.', zh: '本文将检查整理成逐条业务规则，每条写明适用条件、违规情形和例外。', ja: '本文では検査項目をルーブリックに整理し、各項目の適用条件・違反・例外を明記している。' },
      anchor: technical ? 'technical-section-3' : 'blog-section-1' },
    { id: 'opd', pattern: { en: /\bOPD\b/, zh: /\bOPD\b/, ja: /\bOPD\b/ }, title: { en: 'OPD · On-policy distillation', zh: 'OPD · 概率蒸馏', ja: 'OPD · オンポリシー蒸留' },
      text: { en: 'Here, a fixed teacher provides next-token probabilities along prefixes generated by the current student; the student learns from those probabilities.', zh: '这里由当前学生生成答案，固定教师沿学生的前缀给出后续词元概率，学生据此调整概率分配。', ja: 'ここでは現学生が回答を生成し、固定教師が学生の接頭列に沿って次トークン確率を計算する。学生はその確率に基づいて分布を調整する。' },
      anchor: technical ? 'technical-section-7' : 'blog-section-5' },
    { id: 'grpo', pattern: { en: /\bGRPO\b/, zh: /\bGRPO\b/, ja: /\bGRPO\b/ }, title: { en: 'GRPO', zh: 'GRPO', ja: 'GRPO' },
      text: { en: 'For the experiments described here, the model generates several answers for each input and is updated using their relative scores within that group.', zh: '本文实验对同一输入生成多份答案，以这一组答案的相对得分更新模型。', ja: '本文の実験では、同じ入力に対して複数の回答を生成し、同一グループ内の相対得点でモデルを更新する。' },
      anchor: technical ? 'technical-section-6' : 'blog-section-4' }
  ] : [];
  const skip = 'a,button,code,pre,kbd,samp,math,svg,figure,figcaption,h1,h2,h3,h4,h5,h6,table,nav,header,footer,.math,.math-equation,.katex,.MathJax,.trajectory-map,.writing-series-bottom,.writing-series-top,[data-writing-note]';
  const terms = new Map();
  for (const note of notes) {
    for (const language of ['en', 'zh', 'ja']) {
      const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent || !parent.closest('p,li') || parent.closest(skip)) return NodeFilter.FILTER_REJECT;
          const ownLanguage = parent.closest('[lang]')?.getAttribute('lang');
          return ownLanguage === language && note.pattern[language].test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      });
      const text = walker.nextNode();
      if (!text) continue;
      const result = text.nodeValue.match(note.pattern[language]);
      const tail = text.splitText(result.index);
      tail.splitText(result[0].length);
      const button = el('button', 'writing-term', tail.nodeValue);
      button.type = 'button';
      button.dataset.writingNote = note.id;
      button.setAttribute('aria-haspopup', 'dialog');
      button.setAttribute('aria-expanded', 'false');
      tail.replaceWith(button);
      terms.set(button, { note, language });
    }
  }
  let active = null;
  let pinned = false;
  let timer;
  let hoverTimer;
  let pointer = null;
  let suppressFocus = false;
  const panel = el('aside', 'writing-note');
  panel.id = 'writing-context-note';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'false');
  panel.setAttribute('aria-labelledby', 'writing-context-note-title');
  const panelTitle = el('p', 'writing-note-title');
  panelTitle.id = 'writing-context-note-title';
  const dismiss = el('button', 'writing-note-close', '×');
  dismiss.type = 'button';
  const description = el('p', 'writing-note-description');
  const source = el('a', 'writing-note-source');
  panel.append(panelTitle, dismiss, description, source);
  if (notes.length) document.body.append(panel);
  const cancelClose = () => clearTimeout(timer);
  function close(restore = false) {
    clearTimeout(hoverTimer);
    cancelClose();
    const trigger = active;
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    active = null;
    pinned = false;
    panel.hidden = true;
    if (restore && trigger) {
      suppressFocus = true;
      trigger.focus({ preventScroll: true });
      suppressFocus = false;
    }
  }
  function position() {
    if (!active || panel.hidden) return;
    const rect = active.getBoundingClientRect();
    const viewport = window.visualViewport;
    const width = viewport?.width || innerWidth;
    const height = viewport?.height || innerHeight;
    const offsetX = viewport?.offsetLeft || 0;
    const offsetY = viewport?.offsetTop || 0;
    if (rect.bottom < offsetY || rect.top > offsetY + height) { close(); return; }
    panel.style.maxWidth = `${Math.min(336, width - 32)}px`;
    panel.style.maxHeight = `${height - 32}px`;
    const box = panel.getBoundingClientRect();
    const left = Math.max(offsetX + 16, Math.min(rect.left, offsetX + width - box.width - 16));
    const below = rect.bottom + 10;
    const top = below + box.height <= offsetY + height - 16 ? below : Math.max(offsetY + 16, rect.top - box.height - 10);
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  }
  function open(button, pin = false) {
    const selected = terms.get(button);
    if (!selected || String(window.getSelection() || '').length) return;
    cancelClose();
    clearTimeout(hoverTimer);
    if (active && active !== button) active.setAttribute('aria-expanded', 'false');
    active = button;
    pinned = pin;
    const { note, language } = selected;
    panelTitle.textContent = note.title[language];
    description.textContent = note.text[language];
    dismiss.setAttribute('aria-label', copy[language].close);
    source.textContent = `${copy[language].source} ↓`;
    source.href = `#${note.anchor}`;
    panel.setAttribute('lang', language);
    panel.hidden = false;
    button.setAttribute('aria-controls', panel.id);
    button.setAttribute('aria-expanded', 'true');
    position();
  }
  function scheduleClose() {
    clearTimeout(hoverTimer);
    if (!pinned) timer = setTimeout(() => { if (!panel.matches(':hover') && document.activeElement !== active && !panel.contains(document.activeElement)) close(); }, 180);
  }
  for (const [button, selected] of terms) {
    button.setAttribute('aria-label', `${button.textContent} · ${copy[selected.language].note}`);
    button.addEventListener('pointerenter', event => {
      cancelClose();
      if (event.pointerType === 'mouse' && !pointer && !pinned) hoverTimer = setTimeout(() => open(button), 180);
    });
    button.addEventListener('pointerleave', scheduleClose);
    button.addEventListener('focus', () => { if (!suppressFocus && !pointer) open(button); });
    button.addEventListener('click', event => {
      if (pointer?.dragged || String(window.getSelection() || '').length) { event.preventDefault(); close(); return; }
      if (active === button && pinned) close();
      else {
        open(button, true);
        if (event.detail === 0) dismiss.focus({ preventScroll: true });
      }
    });
    button.addEventListener('blur', scheduleClose);
  }
  panel.addEventListener('pointerenter', cancelClose);
  panel.addEventListener('pointerleave', scheduleClose);
  panel.addEventListener('focusin', cancelClose);
  panel.addEventListener('focusout', scheduleClose);
  dismiss.addEventListener('click', () => close(true));
  source.addEventListener('click', () => close());
  document.addEventListener('pointerdown', event => {
    pointer = { x: event.clientX, y: event.clientY, dragged: false };
    clearTimeout(hoverTimer);
    if (active && !panel.contains(event.target) && !active.contains(event.target)) close();
  });
  document.addEventListener('pointermove', event => {
    if (pointer && Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) > 5) { pointer.dragged = true; close(); }
  }, { passive: true });
  document.addEventListener('pointerup', () => setTimeout(() => { pointer = null; }, 0));
  document.addEventListener('pointercancel', () => { pointer = null; close(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && active) { close(true); event.stopPropagation(); }
  });
  window.addEventListener('resize', position, { passive: true });
  document.addEventListener('scroll', position, { passive: true, capture: true });
  window.visualViewport?.addEventListener('resize', position, { passive: true });
  new MutationObserver(() => { close(); renderSeries(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
