(() => {
  'use strict';
  const nav = document.querySelector('.report-site-nav');
  if (!nav || window.WritingReader) return;
  window.WritingReader = true;
  document.documentElement.classList.add('writing-reader');
  const language = () => ['zh','ja'].includes(document.documentElement.lang) ? document.documentElement.lang : 'en';
  const words = {
    settings:['Display','显示','表示'], contents:['Contents','目录','目次'], style:['Figure style','图形风格','図のスタイル'],
    paper:['Paper','纸感','ペーパー'], outline:['Outline','线框','線画'], enlarge:['Enlarge ↗','放大 ↗','拡大 ↗'],
    close:['Close','关闭','閉じる'], readable:['Readable zoom','清晰阅读','読みやすく'], original:['Original figure','原图','元の図'],
    fit:['Fit','适宽','幅に合わせる'], back:['Selected writing','精选写作','執筆記事']
  };
  const t = key => words[key][{en:0,zh:1,ja:2}[language()]];
  const make = (tag,cls,text) => { const n=document.createElement(tag); if(cls)n.className=cls; if(text)n.textContent=text; return n; };
  const stylesheet = [...document.querySelectorAll('link[rel="stylesheet"]')].find(l=>l.href.includes('/writing-reader.css'))?.href || '/assets/css/writing-reader.css';
  const controls = make('div','wr-controls');
  const settings = make('details','wr-settings');
  const settingsSummary = make('summary','',t('settings'));
  const settingsPanel = make('div','wr-popover');
  const styleLabel = make('label','',t('style')); styleLabel.htmlFor='wr-figure-style';
  const styleSelect = make('select'); styleSelect.id='wr-figure-style';
  for(const [value,key] of [['openai-blog','paper'],['engineering','outline']]) { const option=make('option','',t(key));option.value=value;styleSelect.append(option); }
  styleSelect.value=window.WritingDiagramStyle?.current() || 'openai-blog';
  styleSelect.addEventListener('change',()=>window.WritingDiagramStyle?.set(styleSelect.value));
  settingsPanel.append(styleLabel,styleSelect);settings.append(settingsSummary,settingsPanel);
  let toc = document.querySelector('#edition-toc,.toc-panel,.blog-sidebar nav,.report-sidebar nav,.layout>aside nav');
  if(!toc){
    toc=make('nav');
    [...document.querySelectorAll('article h2,main h2')].forEach((heading,index)=>{
      if(!heading.id)heading.id='writing-section-'+(index+1);
      const a=make('a');a.href='#'+heading.id;
      for(const child of heading.childNodes)a.append(child.cloneNode(true));
      toc.append(a);
    });
    if(!toc.childElementCount)toc=null;
  }
  let contents,contentsSummary;
  if(toc) {
    contents=make('details','wr-contents');contentsSummary=make('summary','',t('contents'));
    const panel=make('nav','wr-popover');panel.setAttribute('aria-label',t('contents'));
    const list=make('ol');
    for(const original of toc.querySelectorAll('a[href*="#"]')) {
      if(!original.hash || !document.getElementById(decodeURIComponent(original.hash.slice(1))))continue;
      const li=make('li'),a=original.cloneNode(true);a.removeAttribute('id');li.append(a);list.append(li);
      a.addEventListener('click',()=>{
        contents.open=false;
        const target=document.getElementById(decodeURIComponent(a.hash.slice(1)));
        if(target){target.setAttribute('tabindex','-1');requestAnimationFrame(()=>target.focus({preventScroll:true}));}
      });
    }
    panel.append(list);contents.append(contentsSummary,panel);controls.append(contents);
  }
  controls.append(settings);
  (nav.querySelector('.writing-preferences') || nav).append(controls);
  for(const detail of [settings,contents].filter(Boolean)) {
    detail.addEventListener('toggle',()=>{if(detail.open)for(const other of [settings,contents])if(other&&other!==detail)other.open=false;});
    detail.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();detail.open=false;detail.querySelector('summary').focus();}});
  }
  document.addEventListener('pointerdown',e=>{for(const detail of [settings,contents].filter(Boolean))if(detail.open&&!detail.contains(e.target))detail.open=false;});
  // Use the existing analytics destination. Do not add another tracking script.
  let footer=document.querySelector('footer');
  if(!footer){footer=make('footer','wr-footer');const back=make('a','','Yecheng Zhang');back.href='/';back.dataset.siteLink='';footer.append(back);document.body.append(footer);}
  footer.classList.add('wr-footer');
  function moveAnalytics(){
    for(const link of document.querySelectorAll('.site-analytics-link,a[href*="analytics.duqi.top/websites/"]')) {
      if(!footer.contains(link)){link.classList.add('site-analytics-link');footer.append(link);}
    }
  }
  moveAnalytics();
  // Dynamic shells are replaced when changing language/view, so enhance each shell once.
  const cameraStarts=new WeakMap();
  const originalFigures=new WeakMap();
  function patchMap(host){
    const root=host.shadowRoot || host;
    const expanded=host.hasAttribute('data-expanded') || host.classList.contains('am-expanded');
    const toolbar=root.querySelector('.tm-toolbar,.am-toolbar');if(!toolbar)return;
    host.dataset.readerReady='';
    if(host.shadowRoot&&!root.querySelector('link[data-reader-sheet]')){const sheet=make('link');sheet.rel='stylesheet';sheet.href=stylesheet;sheet.dataset.readerSheet='';root.append(sheet);}
    let expand=toolbar.querySelector('[data-expand],[data-reader-expand]');
    if(!expand&&toolbar.classList.contains('am-toolbar')){expand=toolbar.querySelector('.am-tools:last-child button:last-child');if(expand)expand.dataset.readerExpand='';}
    if(!expand)return;
    const label=t(expanded?'close':'enlarge');if(expand.textContent!==label)expand.textContent=label;expand.setAttribute('aria-label',label.replace(' ↗',''));
    expand.setAttribute('aria-expanded',String(expanded));
    const viewport=root.querySelector('.tm-viewport,.am-viewport');
    // Preview is an overview; focus and interaction live in the expanded view.
    if(viewport){if(!expanded){viewport.inert=true;viewport.tabIndex=-1;}else{viewport.inert=false;viewport.tabIndex=0;}}
    const tools=expand.parentElement;
    if(!originalFigures.has(host)){
      const sibling=host.nextElementSibling;
      const fallback=sibling?.matches('.trajectory-static')?sibling:host.closest('figure')?.querySelector('.trajectory-static');
      if(fallback)originalFigures.set(host,fallback);
    }
    const fallback=originalFigures.get(host);
    if(fallback){
      let original=tools.querySelector('[data-reader-original]');
      if(!original){
        original=make('button','',t('original'));original.type='button';original.dataset.readerOriginal='';
        tools.insertBefore(original,expand);
        original.addEventListener('click',()=>{
          const images=[...fallback.querySelectorAll('img')];
          const image=images.find(i=>!i.closest('[lang]')||i.closest('[lang]').lang===language())||images[0];
          if(image)showImage(image,original);
        });
      }
      if(original.textContent!==t('original'))original.textContent=t('original');
    }
    let readable=tools.querySelector('[data-reader-readable]');
    if(!readable){readable=make('button','',t('readable'));readable.type='button';readable.dataset.readerReadable='';tools.insertBefore(readable,expand);readable.addEventListener('click',()=>{
      const plus=[...tools.querySelectorAll('button')].find(b=>b.textContent.trim()==='+');
      const scale=root.querySelector('.tm-scale,.am-zoom');
      for(let i=0;i<20&&parseFloat(scale?.textContent||'100')<75;i++)plus?.click();
      viewport?.focus({preventScroll:true});
    });}
    if(readable.textContent!==t('readable'))readable.textContent=t('readable');
    if(!expanded){
      const previous=cameraStarts.get(toolbar);
      if(previous){clearTimeout(previous.timer);previous.controller.abort();cameraStarts.delete(toolbar);}
    }
    if(expanded&&matchMedia('(max-width:700px)').matches){
      let start=cameraStarts.get(toolbar);
      if(!start){
        start={manual:false,timer:null,controller:new AbortController()};cameraStarts.set(toolbar,start);
        const useCamera=()=>{start.manual=true;clearTimeout(start.timer);};
        for(const event of ['pointerdown','keydown','change'])toolbar.addEventListener(event,useCamera,{once:true,signal:start.controller.signal});
        for(const event of ['pointerdown','keydown','wheel'])viewport?.addEventListener(event,useCamera,{once:true,signal:start.controller.signal});
      }
      const percentage=parseFloat(root.querySelector('.tm-scale,.am-zoom')?.textContent||'0');
      if(!start.manual&&!start.timer&&percentage>0&&percentage<75){
        // The original stylesheet load and ResizeObserver both fit the camera.
        // Wait for those measurements to settle before selecting readable zoom.
        start.timer=setTimeout(()=>{
          start.timer=null;
          if(!(host.hasAttribute('data-expanded')||host.classList.contains('am-expanded')))return;
          if(!start.manual)readable.click();
        },100);
      }
    }
  }
  const maps=[...document.querySelectorAll('.trajectory-map,.automation-map')];
  for(const host of maps){
    patchMap(host);
    const mapObserver=new MutationObserver(()=>patchMap(host));
    mapObserver.observe(host.shadowRoot||host,{childList:true,subtree:true});
    new MutationObserver(()=>patchMap(host)).observe(host,{attributes:true,attributeFilter:['data-expanded','class']});
  }
  let imageDialog=null,imageOpener=null,imageTarget=null,imageSize=900;
  function showImage(image,opener){
    if(!imageDialog){
      imageDialog=make('dialog','wr-image-dialog');imageDialog.setAttribute('aria-label',t('enlarge'));
      const bar=make('div','wr-image-bar'),stage=make('div','wr-image-stage');
      imageTarget=make('img');stage.append(imageTarget);
      const scale=f=>{imageSize=Math.max(200,Math.min(4000,imageSize*f));imageTarget.style.width=imageSize+'px';};
      for(const [label,action] of [['−',()=>scale(1/1.25)],['+',()=>scale(1.25)],['fit',()=>{imageSize=stage.clientWidth-48;scale(1);}],['close',()=>imageDialog.close()]]){const b=make('button','',words[label]?t(label):label);b.type='button';if(words[label])b.dataset.readerLabel=label;b.addEventListener('click',action);bar.append(b);}
      imageDialog.append(bar,stage);document.body.append(imageDialog);
      imageDialog.addEventListener('close',()=>imageOpener?.focus({preventScroll:true}));
    }
    imageDialog.setAttribute('aria-label',t('enlarge'));
    for(const button of imageDialog.querySelectorAll('[data-reader-label]'))button.textContent=t(button.dataset.readerLabel);
    imageOpener=opener;imageTarget.src=image.currentSrc||image.src;imageTarget.alt=image.alt;
    imageSize=matchMedia('(max-width:700px)').matches?Math.max(800,Math.min(1200,image.naturalWidth||900)):Math.min(innerWidth*.9,image.naturalWidth||1200);
    imageTarget.style.width=imageSize+'px';imageDialog.showModal();imageDialog.querySelector('button:last-child').focus();
  }
  for(const figure of document.querySelectorAll('figure')){
    if(figure.querySelector('.trajectory-map,.automation-map')||figure.closest('.trajectory-static'))continue;
    const image=[...figure.querySelectorAll('img')].find(i=>!i.closest('[hidden]'));
    if(!image)continue;
    const button=make('button','wr-image-enlarge',t('enlarge'));button.type='button';
    button.addEventListener('click',()=>showImage([...figure.querySelectorAll('img')].find(i=>i.getClientRects().length)||image,button));figure.append(button);
  }
  function refresh(){
    settingsSummary.textContent=t('settings');styleLabel.textContent=t('style');
    if(contentsSummary)contentsSummary.textContent=t('contents');
    for(const option of styleSelect.options)option.textContent=t(option.value==='engineering'?'outline':'paper');
    styleSelect.value=window.WritingDiagramStyle?.current()||'openai-blog';
    for(const button of document.querySelectorAll('.wr-image-enlarge'))button.textContent=t('enlarge');
    for(const host of maps)patchMap(host);
    moveAnalytics();
  }
  new MutationObserver(refresh).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  window.addEventListener('writing-diagram-style-change',refresh);
  const bodyObserver=new MutationObserver(moveAnalytics);bodyObserver.observe(document.body,{childList:true,subtree:true});
})();
