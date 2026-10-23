(() => {
  'use strict';
  const root = document.getElementById('automation-map');
  const data = window.AutomationBlueprint;
  if (!root || !data) return;
  const horizontalScale = 1.25;
  const verticalScale = 1.5;
  const svgNamespace = 'http://www.w3.org/2000/svg';
  const allNodes = new Map(Object.values(data.views).flatMap(view => view.nodes.map(node => [node.id, node])));
  let language = document.documentElement.lang;
  let currentView = 'overview';
  let trail = ['overview'];
  let zoom = 1;
  let offset = { x: 0, y: 0 };
  let dragging = null;
  let moved = false;
  let expanded = false;
  let selectedEdge = null;
  let bounds;
  let world;
  let viewport;
  let aside;
  let status;
  let zoomLabel;
  let expandButton;
  let resizeObserver;
  let savedFocus;

  const text = original => !original ? '' : language === 'zh' ? original : data.translations[original]?.[language === 'ja' ? 1 : 0] || original;
  const element = (tag, className, content) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content) node.textContent = content;
    return node;
  };
  const button = (label, action, glyph) => {
    const node = element('button', '', glyph || text(label));
    node.type = 'button';
    node.setAttribute('aria-label', text(label));
    node.title = text(label);
    node.addEventListener('click', action);
    return node;
  };
  const graphFor = id => data.views[id] || { title: allNodes.get(id).title, nodes: [allNodes.get(id)], edges: [], labels: [], related: [] };
  const canonicalTrail = id => {
    if (id === 'overview') return ['overview'];
    if (data.views.overview.nodes.some(node => node.id === id)) return ['overview', id];
    const parent = data.views.overview.nodes.find(node => data.views[node.id]?.nodes.some(child => child.id === id));
    return parent ? ['overview', parent.id, id] : ['overview', id];
  };
  const viewFromUrl = () => {
    const requested = new URL(location.href).searchParams.get('view');
    return requested && (data.views[requested] || allNodes.has(requested)) ? requested : 'overview';
  };
  const applyTransform = () => {
    world.style.transform = `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`;
    zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
  };
  const fit = mode => {
    const width = viewport.clientWidth;
    if (width <= 40) return;
    const fitWidth = Math.min((width - 40) / bounds.width, 1);
    if (!expanded) viewport.style.setProperty('--am-canvas-height', `${Math.max(320, Math.ceil(bounds.height * fitWidth + 48))}px`);
    const height = viewport.clientHeight;
    const fitAll = mode === 'all' || (expanded && mode === 'reset');
    zoom = fitAll ? Math.min(fitWidth, (height - 40) / bounds.height) : fitWidth;
    offset = { x: (width - bounds.width * zoom) / 2 - bounds.x * zoom, y: fitAll || !expanded ? (height - bounds.height * zoom) / 2 - bounds.y * zoom : 24 - bounds.y * zoom };
    applyTransform();
  };
  const zoomAt = (factor, clientX = viewport.clientWidth / 2, clientY = viewport.clientHeight / 2) => {
    const next = Math.min(2.5, Math.max(.12, zoom * factor));
    offset.x = clientX - (clientX - offset.x) * next / zoom;
    offset.y = clientY - (clientY - offset.y) * next / zoom;
    zoom = next;
    applyTransform();
  };
  const setExpanded = value => {
    expanded = value;
    root.classList.toggle('am-expanded', expanded);
    document.body.classList.toggle('am-modal-open', expanded);
    if (expanded) {
      savedFocus = document.activeElement;
      root.setAttribute('role', 'dialog');
      root.setAttribute('aria-modal', 'true');
    } else {
      root.removeAttribute('role');
      root.removeAttribute('aria-modal');
    }
    expandButton.textContent = text(expanded ? '收起画布' : '展开画布');
    expandButton.setAttribute('aria-label', text(expanded ? '退出放大视图' : '展开画布'));
    if (!expanded) savedFocus?.focus();
    requestAnimationFrame(() => fit('reset'));
  };
  const navigate = (id, nextTrail = canonicalTrail(id), push = true) => {
    currentView = id;
    trail = nextTrail;
    selectedEdge = null;
    const url = new URL(location.href);
    url.searchParams.set('lang', language);
    if (id === 'overview') url.searchParams.delete('view');
    else url.searchParams.set('view', id);
    if (push) history.pushState(null, '', url.pathname + url.search + url.hash);
    else history.replaceState(null, '', url.pathname + url.search + url.hash);
    render();
    viewport.focus({ preventScroll: true });
  };
  const describeEdge = edge => `${text(allNodes.get(edge.from).title)} → ${text(allNodes.get(edge.to).title)}${edge.condition ? ' · ' + text(edge.condition) : ''}`;
  const highlight = (nodeId, edgeId) => {
    const graph = graphFor(currentView);
    const activeEdges = graph.edges.filter(edge => edgeId ? edge.id === edgeId : nodeId && (edge.from === nodeId || edge.to === nodeId));
    const connectedNodes = new Set(activeEdges.flatMap(edge => [edge.from, edge.to]));
    if (nodeId) connectedNodes.add(nodeId);
    const active = !!(nodeId || edgeId);
    for (const node of world.querySelectorAll('.am-node')) {
      node.classList.toggle('is-active', connectedNodes.has(node.dataset.node));
      node.classList.toggle('is-muted', active && !connectedNodes.has(node.dataset.node));
    }
    for (const edge of world.querySelectorAll('.am-edge')) {
      const matched = activeEdges.some(candidate => candidate.id === edge.dataset.edge);
      edge.classList.toggle('is-active', matched);
      edge.classList.toggle('is-muted', active && !matched);
    }
    status.textContent = edgeId ? describeEdge(graph.edges.find(edge => edge.id === edgeId)) : text('点击节点下钻；悬停追踪连线；拖动画布平移。');
  };
  const showNode = node => {
    aside.hidden = false;
    aside.replaceChildren(element('h3', '', text(node.title)));
    if (node.note) aside.append(element('p', '', text(node.note)));
    aside.append(element('p', '', text('来源中的末级步骤。选择关联流程继续浏览。')));
    appendRelated(graphFor(currentView).related);
    aside.append(button('关闭详情', () => { aside.hidden = true; }));
  };
  const appendRelated = links => {
    for (const link of links) {
      const control = button(link.title, () => navigate(link.target));
      control.className = 'am-related';
      control.replaceChildren(element('small', '', text(link.direction)), element('strong', '', text(link.title) + ' ↗'));
      if (link.condition) control.append(element('em', '', text(link.condition)));
      aside.append(control);
    }
  };
  const render = () => {
    resizeObserver?.disconnect();
    const graph = graphFor(currentView);
    root.replaceChildren();
    root.dataset.diagramStyle = window.WritingDiagramStyle?.current() || 'openai-blog';
    const toolbar = element('div', 'am-toolbar');
    const select = element('select');
    select.dataset.viewControl = '';
    select.setAttribute('aria-label', text('流程视图'));
    const choices = [['overview', '统一流程图'], ['unified-o1-10', '自动开发／修复'], ['unified-o1-12', 'CI：构建与测试'], ['unified-o1-13', '代码评审与风险分类'], ['unified-o1-16', 'CD 与上线验收'], ['unified-o1-2', '每日巡检与实时故障监控']];
    for (const [value, title] of choices) {
      const option = element('option', '', text(title));
      option.value = value;
      select.append(option);
    }
    if (!choices.some(([value]) => value === currentView)) {
      const option = element('option', '', text(graph.title));
      option.value = currentView;
      select.append(option);
    }
    select.value = currentView;
    select.addEventListener('change', () => navigate(select.value));
    const controls = element('div', 'am-tools');
    zoomLabel = element('span', 'am-zoom');
    expandButton = button(expanded ? '收起画布' : '展开画布', () => setExpanded(!expanded));
    controls.append(button('缩小', () => zoomAt(1 / 1.2), '−'), zoomLabel, button('放大', () => zoomAt(1.2), '+'), button('全图', () => fit('all')), button('适应宽度', () => fit('width')), button('复位', () => fit('reset')), expandButton);
    const viewControls = element('div','am-tools');
    viewControls.append(select);
    toolbar.append(viewControls, controls);
    const breadcrumb = element('nav', 'am-breadcrumb');
    breadcrumb.setAttribute('aria-label', text('返回上一层'));
    trail.forEach((id, index) => {
      if (index) breadcrumb.append(element('span', '', '›'));
      const crumb = button(graphFor(id).title, () => navigate(id, trail.slice(0, index + 1)));
      if (id === currentView) crumb.setAttribute('aria-current', 'page');
      breadcrumb.append(crumb);
    });
    const body = element('div', 'am-body');
    viewport = element('div', 'am-viewport');
    viewport.tabIndex = 0;
    viewport.setAttribute('role', 'region');
    viewport.setAttribute('aria-label', `${text(graph.title)} · ${text('方向键平移，+ / − 缩放，0 复位。')}`);
    world = element('div', 'am-world');
    world.style.width = `${graph.width * horizontalScale || 1800}px`;
    world.style.height = `${graph.height * verticalScale || 2700}px`;
    const svg = document.createElementNS(svgNamespace, 'svg');
    svg.classList.add('am-links');
    svg.setAttribute('width', graph.width * horizontalScale || 1800);
    svg.setAttribute('height', graph.height * verticalScale || 2700);
    const definitions = document.createElementNS(svgNamespace, 'defs');
    const marker = document.createElementNS(svgNamespace, 'marker');
    for (const [name, value] of Object.entries({ id: 'am-arrow', viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' })) marker.setAttribute(name, value);
    const arrow = document.createElementNS(svgNamespace, 'path');
    arrow.setAttribute('d', 'M1 1 L9 5 L1 9');
    arrow.setAttribute('fill', 'none');
    arrow.setAttribute('stroke', '#8a938d');
    marker.append(arrow);
    definitions.append(marker);
    svg.append(definitions);
    const paths = document.createElementNS(svgNamespace, 'g');
    paths.setAttribute('transform', `scale(${horizontalScale} ${verticalScale})`);
    for (const edge of graph.edges) {
      const path = document.createElementNS(svgNamespace, 'path');
      path.classList.add('am-edge');
      path.dataset.edge = edge.id;
      path.setAttribute('d', edge.path);
      path.setAttribute('marker-end', 'url(#am-arrow)');
      const hit = document.createElementNS(svgNamespace, 'path');
      hit.classList.add('am-edge-hit');
      hit.setAttribute('d', edge.path);
      hit.setAttribute('tabindex', '0');
      hit.setAttribute('role', 'button');
      hit.setAttribute('aria-label', describeEdge(edge));
      const selectEdge = () => { selectedEdge = edge.id; highlight(null, edge.id); };
      hit.addEventListener('pointerenter', () => highlight(null, edge.id));
      hit.addEventListener('pointerleave', () => highlight(null, selectedEdge));
      hit.addEventListener('focus', () => highlight(null, edge.id));
      hit.addEventListener('click', selectEdge);
      hit.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectEdge(); } });
      paths.append(path, hit);
    }
    svg.append(paths);
    const labels = element('div', 'am-labels');
    for (const [index, label] of graph.labels.entries()) {
      const node = element('span', 'am-label', text(label.text));
      if (currentView === 'overview' && index === 0) node.classList.add('am-heading');
      node.style.left = `${label.x * horizontalScale}px`;
      node.style.top = `${label.y * verticalScale}px`;
      node.style.width = `${Math.max(label.width * horizontalScale, 90)}px`;
      labels.append(node);
    }
    const cards = element('div', 'am-nodes');
    for (const node of graph.nodes) {
      const terminal = graph.nodes.length === 1 && graph.nodes[0].id === currentView;
      const card = button(node.title, () => {
        if (moved) return;
        if (terminal || !data.views[node.id]) showNode(node);
        else navigate(node.id, [...trail, node.id]);
      });
      card.className = 'am-node';
      card.dataset.node = node.id;
      card.dataset.type = node.type;
      card.style.left = `${node.x * horizontalScale}px`;
      card.style.top = `${node.y * verticalScale}px`;
      card.style.width = `${node.width * horizontalScale}px`;
      card.style.height = `${node.height * verticalScale}px`;
      card.setAttribute('aria-label', `${text(node.title)} · ${text(terminal || !data.views[node.id] ? '查看详情' : '查看内部流程')}`);
      const icon = element('span', 'am-node-icon', { condition: '◇', approval: '◇', tool: '⌘', terminal: '▷', agent: '↗' }[node.type] || '·');
      icon.setAttribute('aria-hidden', 'true');
      const copy = element('span', 'am-node-copy');
      copy.append(element('span', 'am-node-title', text(node.title)));
      if (node.note) copy.append(element('span', 'am-node-note', text(node.note)));
      card.replaceChildren(icon, copy);
      if (!terminal && data.views[node.id]) {
        const chevron = element('span', 'am-chevron', '›');
        chevron.setAttribute('aria-hidden', 'true');
        card.append(chevron);
      }
      card.addEventListener('pointerenter', () => highlight(node.id, null));
      card.addEventListener('pointerleave', () => highlight(null, selectedEdge));
      card.addEventListener('focus', () => highlight(node.id, null));
      cards.append(card);
    }
    world.append(svg, labels, cards);
    viewport.append(world);
    aside = element('aside', 'am-aside');
    aside.setAttribute('aria-label', text('关联流程'));
    aside.hidden = graph.related.length === 0;
    aside.append(element('h3', '', text('关联流程')));
    appendRelated(graph.related);
    body.append(viewport, aside);
    status = element('div', 'am-status', text('点击节点下钻；悬停追踪连线；拖动画布平移。'));
    status.setAttribute('aria-live', 'polite');
    root.append(toolbar, breadcrumb, body, status);
    const boxes = [...graph.nodes, ...graph.labels];
    if (graph.edges.length) boxes.push(paths.getBBox());
    const left = Math.min(...boxes.map(box => box.x)) * horizontalScale - 24;
    const top = Math.min(...boxes.map(box => box.y)) * verticalScale - 24;
    bounds = { x: left, y: top, width: Math.max(...boxes.map(box => box.x + Math.max(box.width, 90))) * horizontalScale - left + 32, height: Math.max(...boxes.map(box => box.y + box.height)) * verticalScale - top + 60 };
    bindViewport();
    requestAnimationFrame(() => fit('reset'));
    let previousWidth = viewport.clientWidth;
    let previousHeight = viewport.clientHeight;
    resizeObserver = new ResizeObserver(() => {
      const width = viewport.clientWidth;
      const height = viewport.clientHeight;
      const changed = width !== previousWidth || (expanded && height !== previousHeight);
      previousWidth = width;
      previousHeight = height;
      if (changed) fit('reset');
    });
    resizeObserver.observe(viewport);
  };
  const bindViewport = () => {
    viewport.addEventListener('pointerdown', event => {
      moved = false;
      if (event.target.closest('button,[role="button"]') || event.button > 0) return;
      viewport.focus({ preventScroll: true });
      dragging = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: offset.x, startY: offset.y };
      viewport.setPointerCapture(event.pointerId);
      viewport.classList.add('am-dragging');
    });
    viewport.addEventListener('pointermove', event => {
      if (!dragging || dragging.id !== event.pointerId) return;
      const deltaX = event.clientX - dragging.x;
      const deltaY = event.clientY - dragging.y;
      if (Math.abs(deltaX) + Math.abs(deltaY) > 5) moved = true;
      offset = { x: dragging.startX + deltaX, y: dragging.startY + deltaY };
      applyTransform();
    });
    const endDrag = event => {
      if (!dragging || dragging.id !== event.pointerId) return;
      dragging = null;
      viewport.classList.remove('am-dragging');
      if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    };
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    viewport.addEventListener('wheel', event => {
      if (!event.ctrlKey && !event.metaKey && (!expanded || document.activeElement !== viewport)) return;
      event.preventDefault();
      if (event.ctrlKey || event.metaKey) {
        const rect = viewport.getBoundingClientRect();
        zoomAt(Math.exp(-event.deltaY * .006), event.clientX - rect.left, event.clientY - rect.top);
      } else {
        offset.x -= event.deltaX;
        offset.y -= event.deltaY;
        applyTransform();
      }
    }, { passive: false });
    viewport.addEventListener('keydown', event => {
      if (event.target !== viewport) return;
      const movement = { ArrowLeft: [60, 0], ArrowRight: [-60, 0], ArrowUp: [0, 60], ArrowDown: [0, -60] }[event.key];
      if (movement) { event.preventDefault(); offset.x += movement[0]; offset.y += movement[1]; applyTransform(); }
      if (event.key === '+' || event.key === '=') { event.preventDefault(); zoomAt(1.2); }
      if (event.key === '-') { event.preventDefault(); zoomAt(1 / 1.2); }
      if (event.key === '0') { event.preventDefault(); fit('reset'); }
    });
  };
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && expanded) { event.preventDefault(); setExpanded(false); }
    if (event.key === 'Tab' && expanded) {
      const focusable = [...root.querySelectorAll('button,select,[tabindex="0"]')].filter(node => node.getClientRects().length);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  new MutationObserver(() => {
    if (language === document.documentElement.lang) return;
    language = document.documentElement.lang;
    render();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  window.addEventListener('popstate', () => { const view = viewFromUrl(); navigate(view, canonicalTrail(view), false); });
  currentView = viewFromUrl();
  window.addEventListener('writing-diagram-style-change',() => {
    root.dataset.diagramStyle = window.WritingDiagramStyle.current();
    window.WritingDiagramStyle.apply(root);
  });
  trail = canonicalTrail(currentView);
  render();
})();
