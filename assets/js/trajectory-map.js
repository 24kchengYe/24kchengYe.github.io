(() => {
  'use strict';
  const data = window.WritingDiagramData || window.TrajectoryMapData;
  if (!data) return;
  const stylesheet = document.querySelector('script[src*="trajectory-map.js"]').dataset.stylesheet;
  const nodeSelector = data.generic ? '[data-map-node]' : '.node[id],.bundle[id],.workspace[id],.event[id],.checkpoint[id],.restore[id]';
  const canonical = { A:'harness', B:'online', C:'offline' };
  const element = (tag, className, content) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content) node.textContent = content;
    return node;
  };
  const modalStyle = element('style');
  modalStyle.textContent = 'dialog.trajectory-dialog{box-sizing:border-box;width:96vw;max-width:1800px;height:94dvh;max-height:94dvh;padding:0;border:0;background:#fff;overflow:hidden}dialog.trajectory-dialog::backdrop{background:#28302ab0}dialog.trajectory-dialog>.trajectory-map{height:100%}@media(max-width:700px){dialog.trajectory-dialog{width:98vw;max-width:98vw;height:96dvh;max-height:96dvh}}';
  document.head.append(modalStyle);

  for (const host of document.querySelectorAll('.trajectory-map[data-entry]')) {
    const shadow = host.attachShadow({ mode:'open' });
    const entry = host.dataset.entry;
    const figure = host.closest('figure');
    const panel = host.closest('.figure-panel') || figure;
    const fallback = host.nextElementSibling?.matches('.trajectory-static') ? host.nextElementSibling : host.closest('figure').querySelector('.trajectory-static');
    let language = document.documentElement.lang;
    let viewId = entry;
    let trail = [entry];
    let scale = 1;
    let cameraMode = 'width';
    let offset = { x:0, y:0 };
    let canvas;
    let viewport;
    let world;
    let aside;
    let status;
    let scaleLabel;
    let replayLabel;
    let replayInput;
    let playButton;
    let selected = null;
    let drag = null;
    let observer;
    let timer = null;
    let cursor = 0;
    let dialog = null;
    let placeholder;
    let flowing = false;
    let minimap;
    let minimapFrame;
    let minimapScale = 1;
    let detailsVisible = false;
    let detailsButton;
    const externalNames = new Map();
    const translate = original => language === 'zh' ? original : data.strings[original]?.[language === 'ja' ? 1 : 0] || original;
    const view = () => data.views[viewId];
    const button = (label, action, glyph) => {
      const control = element('button', '', glyph || translate(label));
      control.type = 'button';
      control.setAttribute('aria-label', translate(label));
      control.addEventListener('click', action);
      return control;
    };
    const activate = (node, action) => {
      node.tabIndex = 0;
      node.setAttribute('role','button');
      node.addEventListener('click', action);
      node.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        action();
      });
    };
    const casePadding = () => ({ x:Math.max(16,(viewport.clientWidth - view().width * scale) / 2), y:Math.max(16,(viewport.clientHeight - view().height * scale) / 2) });
    const updateMinimap = () => {
      if (viewId !== 'case' || !minimapFrame) return;
      const left = Math.max(0,-offset.x / scale);
      const top = Math.max(0,-offset.y / scale);
      const width = Math.min(view().width - left, viewport.clientWidth / scale);
      const height = Math.min(view().height - top, viewport.clientHeight / scale);
      Object.assign(minimapFrame.style,{ left:`${left * minimapScale}px`,top:`${top * minimapScale}px`,width:`${width * minimapScale}px`,height:`${height * minimapScale}px` });
    };
    const applyTransform = () => {
      if (viewId === 'case') {
        const padding = casePadding();
        world.style.width = `${Math.max(viewport.clientWidth,view().width * scale + 32)}px`;
        world.style.height = `${Math.max(viewport.clientHeight,view().height * scale + 32)}px`;
        world.firstElementChild.style.transform = `translate(${padding.x}px,${padding.y}px) scale(${scale})`;
        viewport.scrollLeft = Math.max(0,padding.x - offset.x);
        viewport.scrollTop = Math.max(0,padding.y - offset.y);
        offset = { x:padding.x - viewport.scrollLeft,y:padding.y - viewport.scrollTop };
        updateMinimap();
      } else world.style.transform = `translate(${offset.x}px,${offset.y}px) scale(${scale})`;
      scaleLabel.textContent = `${Math.round(scale * 100)}%`;
    };
    const fit = (mode = 'width') => {
      cameraMode = mode;
      const width = viewport.clientWidth;
      if (!width) return;
      const fitWidth = Math.min(1, (width - 32) / view().width);
      if (!dialog) viewport.style.height = viewId === 'case' ? `${Math.max(380,Math.min(760,window.innerHeight * .72))}px` : `${Math.max(320, view().height * fitWidth + 32)}px`;
      scale = mode === 'all' ? Math.min(fitWidth, (viewport.clientHeight - 32) / view().height) : fitWidth;
      offset = { x:(width - view().width * scale) / 2, y:Math.max(16, (viewport.clientHeight - view().height * scale) / 2) };
      applyTransform();
    };
    const zoom = (factor, horizontal = viewport.clientWidth / 2, vertical = viewport.clientHeight / 2) => {
      const next = Math.min(3, Math.max(.06, scale * factor));
      offset = { x:horizontal - (horizontal - offset.x) * next / scale, y:vertical - (vertical - offset.y) * next / scale };
      scale = next;
      applyTransform();
    };
    const focusNode = id => {
      const node = shadow.getElementById(id);
      if (!node) return;
      const bounds = node.getBoundingClientRect();
      const original = canvas.getBoundingClientRect();
      const left = (bounds.left - original.left) / scale;
      const top = (bounds.top - original.top) / scale;
      const width = bounds.width / scale;
      const height = bounds.height / scale;
      cameraMode = 'node';
      scale = viewId === 'case' ? Math.min(1,(viewport.clientWidth - 32) / view().width) : Math.min(1, (viewport.clientWidth - 48) / (width + 80), (viewport.clientHeight - 48) / (height + 100));
      offset = { x:viewport.clientWidth / 2 - (left + width / 2) * scale, y:viewport.clientHeight / 2 - (top + height / 2) * scale };
      offset.x = Math.max(Math.min(16, viewport.clientWidth - view().width * scale - 16), Math.min(16, offset.x));
      applyTransform();
    };
    const relations = () => [...canvas.querySelectorAll('.connection')].map(connection => ({ element:connection, from:connection.dataset.from, to:connection.dataset.to }));
    const nodeName = id => {
      const local = shadow.getElementById(id);
      if (local) return (local.dataset.mapLabel || local.querySelector('.action,.restore-title,h3')?.textContent || local.firstElementChild?.textContent || local.textContent).trim();
      const key = `${language}:${id}`;
      const graph = data.views[canonical[id[0]]];
      if (!externalNames.has(key) && graph) {
        const template = document.createElement('template');
        template.innerHTML = graph.localized[language].html;
        const node = template.content.getElementById(id);
        if (node) externalNames.set(key,(node.firstElementChild?.textContent || node.textContent).trim());
      }
      return externalNames.get(key) || id;
    };
    const highlight = (nodeId, connection = null) => {
      const edges = relations().filter(edge => connection ? edge.element === connection : nodeId && (edge.from === nodeId || edge.to === nodeId));
      const nodes = new Set(edges.flatMap(edge => [edge.from, edge.to]));
      if (nodeId) nodes.add(nodeId);
      for (const node of canvas.querySelectorAll(nodeSelector)) {
        node.classList.toggle('is-active', nodes.has(node.id));
        node.classList.toggle('is-muted', !!(nodeId || connection) && !nodes.has(node.id));
      }
      for (const edge of relations()) {
        edge.element.classList.toggle('is-active', edges.some(active => active.element === edge.element));
        edge.element.classList.toggle('is-muted', !!(nodeId || connection) && !edges.some(active => active.element === edge.element));
      }
    };
    const pause = () => {
      clearInterval(timer);
      timer = null;
      canvas?.classList.remove('tm-replaying');
      if (playButton) { playButton.textContent = translate('播放记录'); playButton.setAttribute('aria-label', translate('播放记录')); }
    };
    const navigate = (target, nextTrail = [...trail, target]) => {
      pause();
      viewId = target;
      trail = nextTrail.slice(-12);
      selected = null;
      cameraMode = dialog ? 'all' : 'width';
      render();
    };
    const related = () => {
      aside.append(element('h3','',translate(data.generic ? '本篇图解' : '关联流程')));
      for (const target of view().related) {
        const control = button(data.views[target].title, () => navigate(target));
        control.className = 'tm-related';
        control.dataset.view = target;
        control.textContent += ' ↗';
        aside.append(control);
      }
    };
    const openNode = (id, focus = false) => {
      const node = shadow.getElementById(id);
      if (!node) {
        const target = canonical[id[0]];
        if (target) { navigate(target); openNode(id, true); }
        return;
      }
      selected = id;
      aside.hidden = viewId === 'case' && !detailsVisible;
      aside.replaceChildren(element('h3','',nodeName(id)));
      const fields = element('dl');
      if (node.matches('.event')) {
        aside.append(element('small','',node.querySelector('.index').textContent + ' · ' + node.querySelector('.tool').textContent));
        for (const [label, selector] of [['动作','.action'],['工具返回','.response'],['状态','.state']]) {
          fields.append(element('dt','',translate(label)), element('dd','',node.querySelector(selector).textContent));
        }
        aside.append(element('p','',translate(node.dataset.disposition === 'discarded' ? '失败尝试 · 保留审计与成本' : '最终保留轮次')));
      } else {
        const detail = node.querySelector('[data-node-detail]');
        const description = (detail?.textContent || node.textContent).trim();
        if (description.replace(/\s+/g,' ') !== nodeName(id).replace(/\s+/g,' ')) aside.append(element('p',detail ? 'tm-node-detail' : '',description));
        if (node.matches('.checkpoint,.restore')) aside.append(element('small','',translate('Harness 控制事件')));
      }
      aside.append(fields);
      const jump = view().links[id];
      if (jump) aside.append(button(data.views[jump].title, () => navigate(jump)));
      for (const [label, incoming] of [['上游',true],['下游',false]]) {
        const linked = [...new Set(relations().filter(edge => incoming ? edge.to === id : edge.from === id).map(edge => incoming ? edge.from : edge.to))].filter(target => !target.startsWith('connector-'));
        if (!linked.length) continue;
        aside.append(element('small','',translate(label)));
        for (const target of linked) {
          const control = button('查看详情', () => { pause(); selectNode(target); });
          control.textContent = nodeName(target) + ' →';
          aside.append(control);
        }
      }
      related();
      aside.append(button('关闭详情', () => {
        aside.hidden = true;
        if (viewId === 'case') {
          detailsVisible = false;
          detailsButton.setAttribute('aria-expanded','false');
        } else { selected = null; highlight(null); fit(dialog ? 'all' : 'width'); }
      }));
      highlight(id);
      if (focus) focusNode(id);
    };
    const selectNode = id => {
      if (viewId !== 'case') { openNode(id, true); return; }
      const indices = view().sequence.flatMap((node, index) => node === id ? [index] : []);
      if (!indices.length) return;
      replay(indices.reduce((nearest, index) => Math.abs(index - cursor) < Math.abs(nearest - cursor) ? index : nearest));
    };
    const replay = (next, focus = true) => {
      cursor = Math.max(0, Math.min(view().sequence.length - 1, next));
      const id = view().sequence[cursor];
      openNode(id, focus);
      replayInput.value = cursor;
      replayLabel.textContent = `${translate('事件')} ${cursor + 1} / ${view().sequence.length}`;
      const previous = view().sequence[cursor - 1];
      const edge = relations().find(connection => connection.from === previous && connection.to === id);
      highlight(id, edge?.element);
      const visited = new Set(view().sequence.slice(0, cursor));
      for (const node of canvas.querySelectorAll('.event')) node.classList.toggle('is-visited', visited.has(node.id));
      shadow.querySelector('[data-replay="previous"]').disabled = cursor === 0;
      shadow.querySelector('[data-replay="next"]').disabled = cursor === view().sequence.length - 1;
      if (cursor === view().sequence.length - 1) pause();
    };
    const togglePlayback = () => {
      if (timer) { pause(); return; }
      if (cursor === view().sequence.length - 1) replay(0);
      else replay(cursor);
      canvas.classList.add('tm-replaying');
      playButton.textContent = translate('暂停');
      playButton.setAttribute('aria-label', translate('暂停'));
      timer = setInterval(() => replay(cursor + 1), 2600);
    };
    const expand = () => {
      if (dialog) { dialog.close(); return; }
      pause();
      placeholder = document.createComment('trajectory-map');
      host.before(placeholder);
      dialog = element('dialog','trajectory-dialog');
      dialog.setAttribute('aria-label',translate(view().title));
      document.body.append(dialog);
      dialog.append(host);
      host.dataset.expanded = '';
      dialog.addEventListener('close', () => {
        pause();
        placeholder.replaceWith(host);
        delete host.dataset.expanded;
        dialog.remove();
        dialog = null;
        render();
        shadow.querySelector('[data-expand]').focus({ preventScroll:true });
      }, { once:true });
      dialog.showModal();
      render();
      shadow.querySelector('[data-expand]').focus();
    };
    const bindCanvas = () => {
      for (const node of canvas.querySelectorAll(nodeSelector)) {
        const target = view().links[node.id];
        const hasDetails = !!node.querySelector('[data-node-detail]');
        if (target) node.dataset.drill = target;
        node.setAttribute('aria-label', `${nodeName(node.id)} · ${translate(target && !hasDetails ? '查看内部流程' : '查看详情')}`);
        activate(node, () => {
          pause();
          if (target && !hasDetails) navigate(target);
          else selectNode(node.id);
        });
        node.addEventListener('pointerenter', () => { if (!timer) highlight(node.id); });
        node.addEventListener('pointerleave', () => { if (!timer) highlight(selected); });
        node.addEventListener('focus', () => { if (!timer) highlight(node.id); });
      }
      for (const edge of relations()) {
        edge.element.setAttribute('aria-label', `${nodeName(edge.from)} → ${nodeName(edge.to)}`);
        activate(edge.element, () => { pause(); selectNode(edge.to); });
        edge.element.addEventListener('pointerenter', () => { if (!timer) highlight(null, edge.element); });
        edge.element.addEventListener('pointerleave', () => { if (!timer) highlight(selected); });
        edge.element.addEventListener('focus', () => highlight(null, edge.element));
      }
      for (const port of canvas.querySelectorAll('.port')) {
        activate(port, () => {
          pause();
          const target = port.dataset.port === '2' ? 'BN' : 'BG';
          if (viewId === 'offline') navigate('online');
          openNode(target, true);
        });
      }
    };
    const bindViewport = () => {
      viewport.addEventListener('scroll', () => {
        if (viewId !== 'case') return;
        const padding = casePadding();
        offset = { x:padding.x - viewport.scrollLeft,y:padding.y - viewport.scrollTop };
        updateMinimap();
      });
      viewport.addEventListener('pointerdown', event => {
        if (viewId === 'case' && event.pointerType === 'touch') { pause(); return; }
        if (event.button > 0 || event.target.closest('[role="button"]')) return;
        const bounds = viewport.getBoundingClientRect();
        if (event.clientX - bounds.left >= viewport.clientWidth || event.clientY - bounds.top >= viewport.clientHeight) return;
        pause();
        viewport.focus({ preventScroll:true });
        drag = { id:event.pointerId, x:event.clientX, y:event.clientY, left:offset.x, top:offset.y };
        viewport.setPointerCapture(event.pointerId);
        viewport.classList.add('is-dragging');
      });
      viewport.addEventListener('pointermove', event => {
        if (!drag || drag.id !== event.pointerId) return;
        offset = { x:drag.left + event.clientX - drag.x, y:drag.top + event.clientY - drag.y };
        applyTransform();
      });
      const stopDrag = () => { drag = null; viewport.classList.remove('is-dragging'); };
      for (const type of ['pointerup','pointercancel','lostpointercapture']) viewport.addEventListener(type, stopDrag);
      viewport.addEventListener('wheel', event => {
        if (viewId === 'case' && !event.ctrlKey && !event.metaKey) { pause(); return; }
        if (!event.ctrlKey && !event.metaKey && !dialog) return;
        event.preventDefault();
        pause();
        if (event.ctrlKey || event.metaKey) {
          const bounds = viewport.getBoundingClientRect();
          zoom(Math.exp(-event.deltaY * .006), event.clientX - bounds.left, event.clientY - bounds.top);
        } else { offset.x -= event.deltaX; offset.y -= event.deltaY; applyTransform(); }
      }, { passive:false });
      viewport.addEventListener('keydown', event => {
        if (event.target !== viewport) return;
        const shift = { ArrowLeft:[60,0], ArrowRight:[-60,0], ArrowUp:[0,60], ArrowDown:[0,-60] }[event.key];
        if (shift) { event.preventDefault(); pause(); offset.x += shift[0]; offset.y += shift[1]; applyTransform(); }
        if (['+','=','-','0'].includes(event.key)) {
          event.preventDefault(); pause();
          if (event.key === '0') fit('all');
          else zoom(event.key === '-' ? 1 / 1.2 : 1.2);
        }
      });
    };
    const render = () => {
      observer?.disconnect();
      const storedSelection = selected;
      const storedCameraMode = cameraMode;
      const original = element('style','',view().localized[language].css);
      const theme = element('link');
      theme.rel = 'stylesheet';
      theme.href = stylesheet;
      const shell = element('section',viewId === 'case' ? 'tm-shell tm-case' : 'tm-shell');
      const toolbar = element('div','tm-toolbar');
      const select = element('select');
      select.setAttribute('aria-label',translate('流程视图'));
      for (const [id, graph] of Object.entries(data.views)) {
        const option = element('option','',translate(graph.title));
        option.value = id;
        select.append(option);
      }
      select.value = viewId;
      select.addEventListener('change', () => navigate(select.value, [data.generic ? Object.keys(data.views)[0] : 'overview',select.value].filter((value,index,list) => list.indexOf(value) === index)));
      const controls = element('div','tm-tools');
      scaleLabel = element('span','tm-scale');
      const expanded = button(dialog ? '收起画布' : '展开画布', expand);
      expanded.dataset.expand = '';
      controls.append(button('缩小', () => { pause(); zoom(1 / 1.2); }, '−'),scaleLabel,button('放大', () => { pause(); zoom(1.2); }, '+'),button('全图', () => { pause(); fit('all'); }),button('适合宽度', () => { pause(); fit('width'); }),expanded);
      const hasConnections = view().localized[language].html.includes('class="connection"');
      if (data.generic && view().kind === 'flow' && hasConnections) {
        const motion = button(flowing ? '停止动效' : '连线动效', () => {
          flowing = !flowing;
          canvas.classList.toggle('tm-flowing',flowing);
          motion.textContent = translate(flowing ? '停止动效' : '连线动效');
          motion.setAttribute('aria-label',motion.textContent);
          motion.setAttribute('aria-pressed',String(flowing));
        });
        motion.setAttribute('aria-pressed',String(flowing));
        controls.append(motion);
      }
      toolbar.append(select,controls);
      const breadcrumb = element('nav','tm-breadcrumb');
      breadcrumb.setAttribute('aria-label',translate('返回'));
      breadcrumb.hidden = trail.length < 2;
      const back = button('返回', () => navigate(trail.at(-2), trail.slice(0,-1)), '←');
      back.disabled = trail.length < 2;
      breadcrumb.append(back);
      trail.slice(0,-1).forEach((id,index) => {
        if (index) breadcrumb.append(element('span','','›'));
        const crumb = button(data.views[id].title, () => navigate(id,trail.slice(0,index + 1)));
        breadcrumb.append(crumb);
      });
      if (viewId !== entry) breadcrumb.append(button('回到本节', () => navigate(entry,[entry])));
      shell.append(toolbar,breadcrumb);
      const body = element('div','tm-body');
      viewport = element('div','tm-viewport');
      viewport.tabIndex = 0;
      viewport.setAttribute('role','region');
      viewport.setAttribute('aria-label',`${translate(view().title)} · ${translate('方向键平移，+ / − 缩放，0 查看全图。')}`);
      world = element('div','tm-world');
      const diagram = element('div','diagram-root');
      const template = document.createElement('template');
      template.innerHTML = view().localized[language].html;
      diagram.append(template.content);
      canvas = diagram.querySelector('.canvas');
      for (const title of canvas.querySelectorAll('.label.title')) {
        if (title.textContent.trim() === translate(view().title)) title.classList.add('tm-repeated-title');
      }
      canvas.classList.toggle('tm-flowing',flowing && view().kind === 'flow');
      world.append(diagram);
      viewport.append(world);
      aside = element('aside','tm-aside');
      aside.hidden = true;
      aside.setAttribute('aria-label',translate('查看详情'));
      minimap = null;
      minimapFrame = null;
      if (viewId === 'case') {
        const navigator = element('div','tm-navigator');
        navigator.append(element('span','tm-navigator-title',translate('完整轨迹')));
        minimap = button('在总览中定位',event => {
          if (!event.detail) { pause(); fit('all'); return; }
          pause();
          const bounds = minimap.getBoundingClientRect();
          const displayScale = bounds.width / view().width;
          const horizontal = (event.clientX - bounds.left) / displayScale;
          const vertical = (event.clientY - bounds.top) / displayScale;
          cameraMode = 'width';
          scale = Math.min(1,(viewport.clientWidth - 32) / view().width);
          offset = { x:viewport.clientWidth / 2 - horizontal * scale,y:viewport.clientHeight / 2 - vertical * scale };
          applyTransform();
        });
        minimap.className = 'tm-minimap';
        const miniature = canvas.cloneNode(true);
        miniature.className = 'tm-mini-canvas';
        miniature.style.width = `${view().width}px`;
        miniature.style.height = `${view().height}px`;
        miniature.removeAttribute('id');
        miniature.setAttribute('aria-hidden','true');
        miniature.inert = true;
        for (const node of miniature.querySelectorAll('[id]')) node.removeAttribute('id');
        minimapScale = 96 / view().width;
        miniature.style.transform = `scale(${minimapScale})`;
        minimap.style.height = `${view().height * minimapScale}px`;
        minimapFrame = element('span','tm-minimap-frame');
        minimap.replaceChildren(miniature,minimapFrame);
        navigator.append(minimap,element('small','',translate('框内为当前视野。点击定位。')));
        body.append(navigator);
      }
      body.append(viewport,aside);
      if (viewId === 'case') {
        const replayControls = element('div','tm-replay');
        const previous = button('上一步', () => { pause(); replay(cursor - 1); }, '←');
        previous.dataset.replay = 'previous';
        const next = button('下一步', () => { pause(); replay(cursor + 1); }, '→');
        next.dataset.replay = 'next';
        playButton = button('播放记录',togglePlayback);
        replayInput = element('input');
        replayInput.type = 'range'; replayInput.min = 0; replayInput.max = view().sequence.length - 1; replayInput.value = cursor;
        replayInput.setAttribute('aria-label',translate('回放位置'));
        replayInput.addEventListener('input', () => { pause(); replay(Number(replayInput.value)); });
        replayLabel = element('output');
        replayLabel.setAttribute('aria-live','polite');
        detailsButton = button('事件详情', () => {
          detailsVisible = !detailsVisible;
          detailsButton.setAttribute('aria-expanded',String(detailsVisible));
          replay(cursor);
        });
        detailsButton.setAttribute('aria-expanded',String(detailsVisible));
        replayControls.append(previous,playButton,next,button('重新开始', () => { pause(); replay(0); }),replayInput,replayLabel,detailsButton);
        shell.append(replayControls);
      } else playButton = null;
      const flowHint = hasConnections ? '悬停追踪连接，点击查看细节或关联图；动效仅辅助读图，不代表执行。' : '点击节点查看细节或关联图；拖动平移，Ctrl/⌘ + 滚轮缩放。';
      const hint = data.generic ? (view().kind === 'flow' ? flowHint : '点击查看原图数据；拖动平移，Ctrl/⌘ + 滚轮缩放。') : (viewId === 'case' ? '滚动查看完整轨迹，也可点击左侧总览定位。回放不执行工具；检查点与回退不计模型轮次。' : '悬停追踪连线；点击模块展开；拖动平移，Ctrl/⌘ + 滚轮缩放。');
      status = element('div','tm-status',translate(hint));
      status.hidden = true;
      const help = button('读图帮助', () => {
        status.hidden = !status.hidden;
        help.setAttribute('aria-expanded',String(!status.hidden));
      }, '?');
      help.setAttribute('aria-expanded','false');
      controls.append(help);
      shell.append(body,status);
      shadow.replaceChildren(original,theme,shell);
      bindCanvas(); bindViewport();
      host.dataset.view = viewId;
      const ready = () => {
        if (theme !== shadow.querySelector('link') || !theme.sheet) return;
        host.hidden = false;
        panel?.classList.add('map-ready');
        if (figure?.querySelectorAll('.trajectory-map').length === 1) figure.classList.add('map-ready');
        fallback.open = false;
        fit(storedCameraMode === 'node' ? 'width' : storedCameraMode);
        if (viewId === 'case') replay(cursor, storedCameraMode === 'node');
        else if (storedSelection) openNode(storedSelection,storedCameraMode === 'node');
      };
      theme.addEventListener('load',ready,{ once:true });
      theme.addEventListener('error', () => {
        if (theme !== shadow.querySelector('link')) return;
        pause();
        host.hidden = true;
        panel?.classList.remove('map-ready');
        figure?.classList.remove('map-ready');
        fallback.open = true;
      }, { once:true });
      requestAnimationFrame(ready);
      let previousWidth = viewport.clientWidth;
      let previousHeight = viewport.clientHeight;
      observer = new ResizeObserver(() => {
        const width = viewport.clientWidth;
        const height = viewport.clientHeight;
        if (width === previousWidth && (!dialog || height === previousHeight)) return;
        previousWidth = width; previousHeight = height;
        const mode = cameraMode;
        fit(mode === 'node' ? 'width' : mode);
        if (mode === 'node' && selected) focusNode(selected);
      });
      observer.observe(viewport);
    };
    render();
    new MutationObserver(() => {
      if (language === document.documentElement.lang) return;
      pause();
      language = document.documentElement.lang;
      render();
    }).observe(document.documentElement,{ attributes:true,attributeFilter:['lang'] });
    document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
    let wasOpen;
    window.addEventListener('beforeprint', () => { pause(); wasOpen = fallback.open; fallback.open = true; });
    window.addEventListener('afterprint', () => { fallback.open = wasOpen; });
  }
})();
