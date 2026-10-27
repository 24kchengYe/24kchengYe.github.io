/* Shared reader presentation. Existing document, language and history controllers
   remain responsible for content, URLs, account state and reading positions. */
(() => {
  'use strict';
  if (window.EditorialReader) return;
  window.EditorialReader = true;
  const root = document.documentElement;
  const words = {
    en:{contents:'Contents',sources:'Sources',shelf:'On this shelf',source:'Original source ↗',pdf:'PDF version ↗',analytics:'Analytics ↗',enlarge:'Enlarge ↗',close:'Close',fit:'Fit width',references:'Publications',zh:'Text in Chinese',en:'Text in English',ja:'Text in Japanese'},
    zh:{contents:'目录',sources:'资料',shelf:'同架',source:'原始来源 ↗',pdf:'PDF 版 ↗',analytics:'访问统计 ↗',enlarge:'放大 ↗',close:'关闭',fit:'适合宽度',references:'相关论文',zh:'中文正文',en:'英文正文',ja:'日文正文'},
    ja:{contents:'目次',sources:'資料',shelf:'同じ本棚',source:'原典 ↗',pdf:'PDF 版 ↗',analytics:'アクセス統計 ↗',enlarge:'拡大 ↗',close:'閉じる',fit:'幅に合わせる',references:'関連論文',zh:'本文：中国語',en:'本文：英語',ja:'本文：日本語'}
  };
  const language = () => ['zh','ja'].includes(root.lang) ? root.lang : 'en';
  const t = key => words[language()][key];
  const make = (tag,cls,text) => {const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
  const text = (el,value) => {if(el&&el.textContent!==value)el.textContent=value;};
  const rails = new Set(), enhanced = new WeakSet();
  let serial=0, pending=false, scrollPending=false;
  function visibleLabel(el) {
    const copy=el.cloneNode(true),mode=el.closest('[data-reading-mode]')?.dataset.readingMode||root.dataset.mode;
    copy.querySelectorAll('[lang]').forEach(n=>{if(n.lang!==language())n.remove();});
    if(mode)copy.querySelectorAll(mode==='en'?'.translation':'.original').forEach(n=>n.remove());
    copy.querySelectorAll('img[alt]').forEach(n=>n.replaceWith(document.createTextNode(n.alt)));
    return copy.textContent.replace(/\s+/g,' ').trim();
  }
  function addSources(rail) {
    if(!document.body.dataset.report||!rail.matches('.reader-sidebar')||rail.querySelector('[data-sidebar-tab="sources"]'))return;
    const tabs=rail.querySelector('.sidebar-tabs');if(!tabs)return;
    const button=make('button','',t('sources'));button.type='button';button.dataset.sidebarTab='sources';button.setAttribute('role','tab');button.tabIndex=-1;button.setAttribute('aria-selected','false');button.id='reader-sources-tab';button.setAttribute('aria-controls','reader-sources-panel');
    const panel=make('div','reader-source-links');panel.id='reader-sources-panel';panel.dataset.sidebarPanel='sources';panel.hidden=true;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);
    for(const [selector,key] of [['.intro .byline a','source'],['[data-format-link="pdf"]','pdf']]) {
      const original=document.querySelector(selector);if(!original)continue;
      const a=original.cloneNode(true);a.removeAttribute('id');a.dataset.readerLabel=key;text(a,t(key));panel.append(a);
    }
    const shelf=tabs.querySelector('[data-sidebar-tab="shelf"]');tabs.insertBefore(button,shelf);rail.append(panel);
  }
  function enhanceRail(rail,contents) {
    if(enhanced.has(rail))return;enhanced.add(rail);addSources(rail);
    const panel=make('div','reader-rail-body');panel.id='reader-rail-'+(++serial);
    while(rail.firstChild)panel.append(rail.firstChild);
    const button=make('button','reader-chapter-toggle');button.type='button';button.setAttribute('aria-controls',panel.id);button.setAttribute('aria-expanded','false');
    button.append(make('span','reader-navigation-label',t('contents')),make('span','reader-current-chapter',''));
    rail.append(button,panel);rail.classList.add('reader-enhanced-rail');rails.add(rail);
    button.addEventListener('click',()=>{
      const open=!rail.hasAttribute('data-reader-open');rail.toggleAttribute('data-reader-open',open);button.setAttribute('aria-expanded',String(open));
      if(open){const nested=panel.querySelector('#toc-panel>details');if(nested)nested.open=true;}
    });
    rail.addEventListener('keydown',event=>{if(event.key==='Escape'&&rail.hasAttribute('data-reader-open')){rail.removeAttribute('data-reader-open');button.setAttribute('aria-expanded','false');button.focus();}});
    rail.addEventListener('click',event=>{
      const a=event.target.closest('a[href]');if(!a||!panel.contains(a))return;
      // Closing a mobile rail does not replace the existing anchor/route handler.
      rail.removeAttribute('data-reader-open');button.setAttribute('aria-expanded','false');
    });
    rail._editorialContents=contents||panel;
  }
  function writingRail() {
    if(!document.querySelector('.report-site-nav')||document.querySelector('.reader-writing-mobile'))return;
    const original=document.querySelector('#edition-toc,.toc-panel,.blog-sidebar nav,.report-sidebar nav,.layout>aside nav'),main=document.querySelector('.blog-main,.report-content,.layout>main');
    if(!original||!main)return;
    const rail=make('aside','reader-writing-mobile');const nav=make('nav');nav.setAttribute('aria-label',t('contents'));
    original.querySelectorAll('a[href*="#"]').forEach(a=>{const clone=a.cloneNode(true);clone.removeAttribute('id');nav.append(clone);});
    rail.append(nav);main.prepend(rail);enhanceRail(rail,nav);
  }
  function currentChapters() {
    scrollPending=false;
    for(const rail of rails) {
      if(!rail.isConnected){rails.delete(rail);continue;}
      const sticky=document.body.dataset.report?document.querySelector('body>.shell>.toolbar,.shell>.toolbar'):null;
      const top=sticky?Math.round(sticky.getBoundingClientRect().height):0;
      const value=top+'px';if(rail.style.getPropertyValue('--reader-sticky-top')!==value)rail.style.setProperty('--reader-sticky-top',value);
      const links=[...(rail._editorialContents||rail).querySelectorAll('.article-toc a,#toc-panel nav a,.reader-writing-mobile nav a')];
      // The writing rail's nav is supplied directly, so query it explicitly.
      if(!links.length&&rail.matches('.reader-writing-mobile'))links.push(...rail.querySelectorAll('nav a'));
      let current=null;
      for(const a of links) {
        let id=a.dataset.articleAnchor;try{id ||= decodeURIComponent(new URL(a.href,location.href).hash.slice(1));}catch{}
        const target=id&&document.getElementById(id);if(!target)continue;
        if(target.getBoundingClientRect().top<=top+140)current=a;
      }
      text(rail.querySelector('.reader-navigation-label'),t('contents'));
      const firstHeading=rail.closest('.article-layout,.layout')?.querySelector('.paper h2,.article-content h2');
      text(rail.querySelector('.reader-current-chapter'),current?visibleLabel(current):firstHeading?visibleLabel(firstHeading):'');
    }
  }
  function scheduleScroll(){if(!scrollPending){scrollPending=true;requestAnimationFrame(currentChapters);}}
  function resume() {
    const page=document.querySelector('.resume');if(!page||enhanced.has(page))return;enhanced.add(page);
    for(const entry of page.querySelectorAll('.resume-entry')) {
      const projects=[...entry.children].filter(n=>n.classList.contains('resume-project'));
      if(projects.length){
        const group=make('div','resume-projects');projects[0].before(group);
        for(const project of projects){const heading=project.querySelector('h4');if(!heading)continue;const details=make('details','resume-project-disclosure'),summary=make('summary','',heading.textContent.replace(/^\[\d+\]\s*/,''));details.append(summary,project);group.append(details);}
      }
      const papers=entry.querySelector('.resume-references');if(papers&&papers.children.length>1){const details=make('details','resume-publications'),summary=make('summary','resume-references-summary');summary.dataset.readerLabel='references';text(summary,t('references'));papers.before(details);details.append(summary,papers);}
    }
  }
  function analytics() {
    if(!document.querySelector('.report-site-nav'))return;
    let footer=document.querySelector('footer');
    if(!footer){footer=make('footer','editorial-footer');const home=make('a','','Yecheng Zhang');home.href='/';footer.append(home);document.body.append(footer);}
    footer.classList.add('editorial-footer');
    const links=[...document.querySelectorAll('.duqi-stats-entry,.site-analytics-link')];
    for(const link of links){if(!footer.contains(link))footer.append(link);text(link,t('analytics'));}
  }
  let dialog,stage,image,opener;
  function openFigure(source,button) {
    if(!dialog){
      dialog=make('dialog','editorial-image-dialog');const controls=make('div','editorial-image-controls');stage=make('div','editorial-image-stage');image=make('img');stage.append(image);
      const resize=f=>{image.style.width=Math.min(5000,Math.max(200,image.getBoundingClientRect().width*f))+'px';};
      for(const [label,action] of [['−',()=>resize(1/1.25)],['+',()=>resize(1.25)],['fit',()=>image.style.width=Math.max(200,stage.clientWidth-48)+'px'],['close',()=>dialog.close()]]){const b=make('button','',words.en[label]?t(label):label);b.type='button';if(words.en[label])b.dataset.readerLabel=label;b.addEventListener('click',action);controls.append(b);}
      dialog.append(controls,stage);document.body.append(dialog);dialog.addEventListener('close',()=>opener?.focus({preventScroll:true}));
    }
    opener=button;image.src=source.currentSrc||source.src;image.alt=source.alt;image.style.width=Math.max(700,Math.min(1500,source.naturalWidth||1000))+'px';dialog.setAttribute('aria-label',t('enlarge'));dialog.showModal();dialog.querySelector('button:last-child').focus();
  }
  function figures() {
    for(const figure of document.querySelectorAll('body[data-report] .paper figure,.reading-article .article-content figure,.reading-article .article-content p')) {
      if(enhanced.has(figure))continue;
      const img=figure.querySelector('img:not(.math):not(.article-badge)');if(!img||img.closest('.inline-math-scroll'))continue;
      if(figure.matches('p')&&(figure.textContent.trim()||Number(img.getAttribute('width')||img.naturalWidth)<300))continue;
      enhanced.add(figure);const button=make('button','editorial-figure-expand',t('enlarge'));button.type='button';button.dataset.readerLabel='enlarge';
      button.addEventListener('click',()=>{const visible=[...figure.querySelectorAll('img:not(.math)')].find(n=>n.getClientRects().length)||img;openFigure(visible,button);});figure.append(button);
    }
  }
  function documentLanguage() {
    for(const article of document.querySelectorAll('.reading-article')) {
      const body=article.querySelector('.article-content'),toolbar=article.querySelector('.article-toolbar');if(!body||!toolbar)continue;
      const code=body.dataset.documentLanguage;let label=toolbar.querySelector('.reader-document-language');
      if(!code||article.dataset.readingFormat==='paired-report'){label?.remove();continue;}
      if(!label){label=make('span','reader-document-language');toolbar.prepend(label);}text(label,t(code));
    }
  }
  function enhance() {
    pending=false;resume();writingRail();
    document.querySelectorAll('.reading-article .article-sidebar,body[data-report] .reader-sidebar').forEach(rail=>enhanceRail(rail));
    figures();documentLanguage();analytics();
    document.querySelectorAll('[data-reader-label]').forEach(el=>text(el,t(el.dataset.readerLabel)));
    document.querySelectorAll('[data-sidebar-tab="sources"]').forEach(el=>text(el,t('sources')));
    scheduleScroll();
  }
  function schedule(){if(!pending){pending=true;requestAnimationFrame(enhance);}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance,{once:true});else enhance();
  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
  new MutationObserver(schedule).observe(root,{attributes:true,attributeFilter:['lang','data-mode']});
  document.addEventListener('click',event=>{if(event.target.closest('[data-mode],[data-edition],[data-language],[data-report-language]'))schedule();});
  window.addEventListener('scroll',scheduleScroll,{passive:true});window.addEventListener('resize',scheduleScroll,{passive:true});
})();
