/* A progressive opening for Writing pages. No reading-state access or scroll capture. */
(() => {
  'use strict';
  const insert = () => {
    const nav = document.querySelector('body > .report-site-nav');
    if (!nav || location.hash || window.scrollY > 1 || document.querySelector('.poetic-writing-entry')) return;
    const content = document.querySelector('body > .blog-layout, body > .report-layout, body > .layout, body > main.note');
    if (!content) return;

    // The same static poem and artwork used by the homepage. If the drawing
    // enhancer fails, this remains readable; if this helper fails, the article
    // remains exactly as it was, with no CSS rule hiding its content.
    const entry = document.createElement('div');
    entry.className = 'poetic-writing-entry poetic-opening';
    entry.dataset.poeticScene = 'writing';
    entry.dataset.poeticSize = 'entry';
    entry.innerHTML = '<div class="poetic-copy"><blockquote>'
      + '<span lang="en">Yet what endures<br>is founded by poets.</span>'
      + '<span lang="zh">然而，长存之物，<br>由诗人创立。</span>'
      + '<span lang="ja">しかし、長く残るものを<br>詩人たちが築く。</span>'
      + '</blockquote><cite><a href="https://ausstellungen.deutsche-digitale-bibliothek.de/aufbrueche-abbrueche-hoelderlin" rel="noopener" target="_blank" title="Was bleibet aber, stiften die Dichter.">'
      + '<span lang="en">Hölderlin · Andenken</span><span lang="zh">荷尔德林 ·《纪念》</span><span lang="ja">ヘルダーリン ·『追想』</span>'
      + '</a></cite></div><div aria-hidden="true" class="poetic-art">'
      + '<img alt="" height="360" width="820" decoding="async" src="/assets/artwork/poetic-writing.svg"></div>';
    nav.before(entry);

    const root = document.documentElement;
    const updateCover = () => {
      // Show the existing fixed/sticky contents only after the article reaches
      // the reading area. This never changes their layout or the scroll offset.
      const readingTop = Math.max(0, nav.getBoundingClientRect().bottom) + 32;
      root.toggleAttribute('data-poetic-writing-cover', entry.getBoundingClientRect().bottom > 0 || content.getBoundingClientRect().top > readingTop);
    };
    const updateSize = () => {
      updateCover();
    };
    let queued = false;
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; updateCover(); });
    };
    updateSize();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateSize, { passive: true });
    window.addEventListener('pageshow', updateSize);
    if ('ResizeObserver' in window) new ResizeObserver(updateSize).observe(nav);
    if (document.fonts?.ready) document.fonts.ready.then(updateSize);
    if (window.PoeticChapters?.mount) window.PoeticChapters.mount(entry);
  };
  if (document.querySelector('body > .report-site-nav')) insert();
  else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', insert, { once: true });
})();
