(() => {
  'use strict';
  const storageKey = 'writing-diagram-style';
  const styles = ['openai-blog', 'engineering'];
  const eventName = 'writing-diagram-style-change';
  const labels = { en:'Figure style · entire page', zh:'全页图形风格', ja:'ページ全体の図のスタイル' };
  const descriptions = {
    'openai-blog': { en:'Soft textures · color accents · feedback paths', zh:'轻点阵 · 少量配色 · 突出反馈', ja:'淡いドット · 色のアクセント · フィードバック' },
    engineering: { en:'White canvas · plain nodes · crisp outlines', zh:'纯白画布 · 简洁节点 · 清晰线框', ja:'白いキャンバス · 簡潔なノード · 明確な輪郭' }
  };
  const language = () => ['zh','ja'].includes(document.documentElement.lang) ? document.documentElement.lang : 'en';
  let current = 'openai-blog';
  try {
    const saved = localStorage.getItem(storageKey);
    if (styles.includes(saved)) current = saved;
  } catch {}
  const apply = root => {
    for (const surface of root.querySelectorAll('[data-diagram-style]')) surface.dataset.diagramStyle = current;
    if (root !== document) return;
    document.documentElement.dataset.diagramStyle = current;
    const control = document.querySelector('[data-diagram-style-control]');
    if (!control) return;
    control.setAttribute('aria-label', labels[language()]);
    control.title = labels[language()];
    control.querySelector('.diagram-style-name').textContent = current === 'engineering' ? 'Engineering' : 'OpenAI Blog';
    for (const option of document.querySelectorAll('[data-style-option]')) {
      option.setAttribute('aria-checked',String(option.dataset.styleOption === current));
      option.querySelector('small').textContent = descriptions[option.dataset.styleOption][language()];
    }
  };
  const refreshImages = () => {
    const language = ['zh','en','ja'].includes(document.documentElement.lang) ? document.documentElement.lang : 'en';
    for (const image of document.querySelectorAll('img[data-diagram-image]')) {
      const source = image.getAttribute(`data-src-${current}-${language}`);
      if (source && image.getAttribute('src') !== source) image.src = source;
    }
  };
  const set = value => {
    if (!styles.includes(value)) return;
    const top = document.querySelector('.report-site-nav')?.getBoundingClientRect().bottom || 0;
    const anchor = [...document.querySelectorAll('.trajectory-map,.automation-map,article > p,article > h2')].find(node => {
      const bounds = node.getBoundingClientRect();
      return bounds.height && bounds.bottom > top && bounds.top < window.innerHeight;
    });
    const anchorTop = anchor?.getBoundingClientRect().top;
    current = value;
    try { localStorage.setItem(storageKey,current); } catch {}
    apply(document);
    refreshImages();
    window.dispatchEvent(new CustomEvent(eventName,{ detail:current }));
    if (anchor) requestAnimationFrame(() => requestAnimationFrame(() => {
      window.scrollBy(0,anchor.getBoundingClientRect().top - anchorTop);
    }));
  };
  const mountControl = () => {
    const navigation = document.querySelector('.report-site-nav');
    if (!navigation || navigation.querySelector('[data-diagram-style-control]')) return;
    const preferences = document.createElement('div');
    preferences.className = 'writing-preferences';
    const picker = document.createElement('div');
    picker.className = 'diagram-style-picker';
    const control = document.createElement('button');
    control.type = 'button';
    control.className = 'diagram-style-control';
    control.dataset.diagramStyleControl = '';
    control.setAttribute('aria-haspopup','menu');
    control.setAttribute('aria-expanded','false');
    control.setAttribute('aria-controls','writing-style-menu');
    control.innerHTML = '<span class="diagram-style-icon" aria-hidden="true"></span><span class="diagram-style-name"></span><span aria-hidden="true">⌄</span>';
    const menu = document.createElement('div');
    menu.id = 'writing-style-menu';
    menu.className = 'diagram-style-menu';
    menu.setAttribute('role','menu');
    menu.hidden = true;
    const close = (focus = false) => {
      menu.hidden = true;
      control.setAttribute('aria-expanded','false');
      if (focus) control.focus({ preventScroll:true });
    };
    for (const [value,label] of [['openai-blog','OpenAI Blog'],['engineering','Engineering']]) {
      const option = document.createElement('button');
      option.type = 'button';
      option.dataset.styleOption = value;
      option.setAttribute('role','menuitemradio');
      option.innerHTML = `<span class="style-swatch ${value}" aria-hidden="true"><i></i><b></b><i></i></span><span class="style-option-copy"><strong>${label}</strong><small></small></span>`;
      option.addEventListener('click',() => { set(value); close(true); });
      menu.append(option);
    }
    const open = () => {
      menu.hidden = false;
      control.setAttribute('aria-expanded','true');
      menu.querySelector('[aria-checked="true"]').focus();
    };
    control.addEventListener('click',() => menu.hidden ? open() : close());
    control.addEventListener('keydown',event => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); open(); }
    });
    picker.addEventListener('keydown',event => {
      if (event.key === 'Escape') { event.preventDefault(); close(true); }
      if (event.key === 'Tab') close();
      if (!menu.hidden && ['ArrowDown','ArrowUp','Home','End'].includes(event.key)) {
        event.preventDefault();
        const options = [...menu.querySelectorAll('button')];
        const index = options.indexOf(document.activeElement);
        options[event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : (index + (event.key === 'ArrowUp' ? -1 : 1) + options.length) % options.length].focus();
      }
    });
    document.addEventListener('pointerdown',event => { if (!picker.contains(event.target)) close(); });
    picker.append(control,menu);
    preferences.append(picker);
    const languages = navigation.querySelector('.languages');
    if (languages) preferences.append(languages);
    navigation.append(preferences);
  };
  window.WritingDiagramStyle = { current:() => current,apply,set,refreshImages,eventName };
  mountControl();
  const imageDialog = document.getElementById('zoom');
  if (imageDialog) {
    let opener = null;
    imageDialog.dataset.diagramStyle = current;
    imageDialog.classList.add('diagram-style-dialog');
    for (const image of document.querySelectorAll('figure img[data-diagram-image]')) {
      image.addEventListener('click',() => { opener = image; });
      image.addEventListener('keydown',event => { if (event.key === 'Enter') opener = image; });
    }
    window.addEventListener(eventName,() => {
      if (opener && imageDialog.open) imageDialog.querySelector('img').src = opener.src;
    });
  }
  window.addEventListener('storage',event => {
    if (event.key !== storageKey && event.key !== null) return;
    current = styles.includes(event.newValue) ? event.newValue : 'openai-blog';
    apply(document);
    refreshImages();
    window.dispatchEvent(new CustomEvent(eventName,{ detail:current }));
  });
  new MutationObserver(() => { apply(document); refreshImages(); }).observe(document.documentElement,{ attributes:true,attributeFilter:['lang'] });
  apply(document);
  refreshImages();
})();
