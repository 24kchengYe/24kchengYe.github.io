/* Decorative arrival sky. No requests, persistent state, canvas or animation loop. */
(() => {
  'use strict';
  const scene = document.querySelector('[data-poetic-scene="arrival"]');
  if (!scene || scene.querySelector('.poetic-night-sky')) return;
  const ns = 'http://www.w3.org/2000/svg';
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width:650px)');
  let visible = false, resizeFrame = 0, revealKey = '', reveals = [];
  const sky = document.createElement('div');
  sky.className = 'poetic-night-sky';
  sky.setAttribute('aria-hidden', 'true');
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('focusable', 'false');
  sky.append(svg);
  scene.prepend(sky);
  const make = (tag, attrs, parent) => {
    const node = document.createElementNS(ns, tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
    parent.append(node);
    return node;
  };
  function compose() {
    const width = scene.clientWidth, height = scene.clientHeight;
    if (!width || !height) return;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    reveals.forEach(animation => animation.cancel()); reveals = []; revealKey = '';
    svg.replaceChildren();
    const far = make('g', {class: 'night-sky-depth', fill: '#b4c8ce'}, svg);
    const near = make('g', {class: 'night-sky-depth', fill: '#e7e5d4'}, svg);
    // Seeded positions stay still when the page is reopened or resized.
    let seed = 210125;
    const random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
    const mobile = narrow.matches;
    const textBox = scene.querySelector('.poetic-copy').getBoundingClientRect();
    const sceneBox = scene.getBoundingClientRect();
    const occupied = (x, y) => x > textBox.left-sceneBox.left-30 && x < textBox.right-sceneBox.left+20 && y > textBox.top-sceneBox.top-35 && y < textBox.bottom-sceneBox.top+35;
    const dot = (x, y, radius, opacity, parent = far) => {
      if (occupied(x, y)) return;
      make('circle', {cx: x.toFixed(2), cy: y.toFixed(2), r: radius.toFixed(2), opacity: opacity.toFixed(2)}, parent);
    };
    // Sparse field with generous space around the name, thinning toward the river.
    for (let i = 0; i < (mobile ? 66 : 138); i++) {
      const x = (.035 + random() * .93) * width;
      const y = (.035 + random() * .57) * height;
      dot(x, y, .4 + random() * .6, .2 + random() * .42);
    }
    // A barely visible arc of remote stars, denser to the right of the typography.
    for (let i = 0; i < (mobile ? 35 : 115); i++) {
      const t = random(), spread = (random() + random() - 1);
      const x = (mobile ? .3 + .64*t : .42 + .48*t) * width;
      const y = (.53 - .44*t + .08*spread + .035*Math.sin(t*6)) * height;
      dot(x, y, .3 + random() * .35, .12 + random() * .3);
    }
    const anchors = mobile
      ? [[.81,.095],[.57,.12],[.18,.09],[.87,.41],[.43,.46],[.13,.52],[.7,.52]]
      : [[.88,.13],[.7,.09],[.54,.13],[.94,.37],[.79,.3],[.66,.42],[.47,.49],[.23,.44],[.11,.1]];
    anchors.forEach(([x, y], index) => {
      x *= width; y *= height;
      if (occupied(x, y)) return;
      const star = make('g', {class: 'night-sky-shimmer', style: `--star-period:${6.2+index*.57}s;--star-phase:${-index*1.63}s`}, near);
      make('circle', {cx:x,cy:y,r:5.5,fill:'#e6d9af',opacity:.035}, star);
      make('circle', {cx:x,cy:y,r:2.8,fill:'#e6d9af',opacity:.12}, star);
      make('circle', {cx:x,cy:y,r:1.05,fill:index%3?'#dbe4e6':'#ebd6a4'}, star);
      if (index === 0 || index === 4) {
        make('path', {d:`M${x-4} ${y}h8 M${x} ${y-4}v8`,stroke:'#e5d7b3','stroke-width':.55,opacity:.6}, star);
      }
    });
    reveal();
  }
  function lights() {
    const drawing = scene.querySelector('.poetic-art svg');
    if (!drawing || drawing.querySelector('.poetic-night-lights')) return;
    // Added after the chapter's path collection: these never delay scroll release.
    const group = make('g', {class:'poetic-night-lights',fill:'#e7bd7f','fill-opacity':.68}, drawing);
    for (const points of ['922,318 932,314 932,319 922,323','974,325 982,322 982,327 974,330','1005,344 1012,347 1012,353 1005,350','1077,352 1085,348 1085,353 1077,357','1126,386 1131,384 1131,388 1126,390']) {
      make('polygon', {points}, group);
    }
    make('g', {stroke:'#d6bd87','stroke-width':1,'stroke-linecap':'round',opacity:.35}, group).innerHTML = '<line x1="884" y1="402" x2="897" y2="401"/><line x1="873" y1="408" x2="882" y2="407"/><line x1="843" y1="444" x2="854" y2="440"/>';
    revealKey = ''; reveal();
  }
  function reveal() {
    const state = scene.dataset.poeticState;
    const stamp = Number(scene.dataset.poeticStartedAt);
    const layers = [svg.children[0], svg.children[1], scene.querySelector('.poetic-night-lights')].filter(Boolean);
    if (!layers.length) return;
    if (reduced.matches || state === 'complete' || !window.PoeticChapters) {
      reveals.forEach(animation => animation.cancel()); reveals = []; revealKey = '';
      layers.forEach(layer => { layer.style.opacity = '1'; });
      return;
    }
    if (state !== 'drawing' || !scene.hasAttribute('data-poetic-started-at')) {
      reveals.forEach(animation => animation.cancel()); reveals = []; revealKey = '';
      layers.forEach(layer => { layer.style.opacity = '0'; });
      return;
    }
    const key = scene.dataset.poeticCycle + ':' + stamp;
    if (key === revealKey) return;
    reveals.forEach(animation => animation.cancel()); reveals = []; revealKey = key;
    const paths = [...scene.querySelectorAll('.poetic-art path[data-phase]')];
    const length = Math.max(...paths.map(p => Number(p.dataset.start)+Number(p.dataset.duration)));
    const scale = Number(scene.dataset.poeticDuration || 2800) / length;
    const start = phase => Math.min(...paths.filter(p => p.dataset.phase === phase).map(p => Number(p.dataset.start))) * scale;
    [[layers[0], 'stars', 0, 350], [layers[1], 'stars', 75, 350], [layers[2], 'windows', 0, 300]].forEach(([layer, phase, offset, duration]) => {
      if (!layer) return;
      layer.style.opacity = '0';
      const animation = layer.animate([{opacity:0},{opacity:1}], {delay:start(phase)+offset, duration, easing:'ease-out', fill:'both'});
      animation.startTime = stamp;
      reveals.push(animation);
    });
  }
  function sync() {
    scene.toggleAttribute('data-night-active', root.dataset.theme === 'dark' && visible && !document.hidden && !reduced.matches);
    reveal();
  }
  function resize() {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(compose);
  }
  compose(); lights();
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, {threshold:0}).observe(scene);
  } else { visible = true; sync(); }
  new MutationObserver(sync).observe(root, {attributes:true,attributeFilter:['data-theme']});
  new MutationObserver(sync).observe(scene, {attributes:true,attributeFilter:['data-poetic-state','data-poetic-cycle','data-poetic-started-at']});
  // Recompose the clear space if the poem's line breaks change with language.
  new MutationObserver(resize).observe(root, {attributes:true,attributeFilter:['lang']});
  window.addEventListener('resize', resize, {passive:true});
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', () => scene.removeAttribute('data-night-active'));
  window.addEventListener('pageshow', sync);
  reduced.addEventListener('change', sync);
})();
