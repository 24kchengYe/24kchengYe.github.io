(() => {
  'use strict';
  const storageKey = 'writing-diagram-style';
  const styles = ['openai-blog', 'engineering'];
  const eventName = 'writing-diagram-style-change';
  const labels = { en:'Diagram style', zh:'图形样式', ja:'図のスタイル' };
  let current = 'openai-blog';
  try {
    const saved = localStorage.getItem(storageKey);
    if (styles.includes(saved)) current = saved;
  } catch {}
  const apply = root => {
    for (const surface of root.querySelectorAll('[data-diagram-style]')) surface.dataset.diagramStyle = current;
    for (const control of root.querySelectorAll('[data-diagram-style-control]')) {
      control.value = current;
      control.setAttribute('aria-label', labels[document.documentElement.lang] || labels.en);
      control.title = control.getAttribute('aria-label');
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
    current = value;
    try { localStorage.setItem(storageKey,current); } catch {}
    apply(document);
    refreshImages();
    window.dispatchEvent(new CustomEvent(eventName,{ detail:current }));
  };
  const createControl = () => {
    const select = document.createElement('select');
    select.className = 'diagram-style-control';
    select.dataset.diagramStyleControl = '';
    select.setAttribute('aria-label',labels[document.documentElement.lang] || labels.en);
    select.title = select.getAttribute('aria-label');
    for (const [value,label] of [['openai-blog','OpenAI Blog'],['engineering','Engineering']]) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      select.append(option);
    }
    select.value = current;
    select.addEventListener('change',() => set(select.value));
    return select;
  };
  window.WritingDiagramStyle = { current:() => current,apply,createControl,refreshImages,eventName };
  const imageDialog = document.getElementById('zoom');
  if (imageDialog) {
    let opener = null;
    imageDialog.dataset.diagramStyle = current;
    imageDialog.classList.add('diagram-style-dialog');
    imageDialog.prepend(createControl());
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
  refreshImages();
})();
