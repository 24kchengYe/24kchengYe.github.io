(() => {
  const url='https://analytics.duqi.top/websites/3a69e17f-5cb4-4975-b0b4-8c1c1e5b6f30';
  function entry(){
    const footer=document.querySelector('.site-footer')||document.querySelector('footer');
    if(!footer)return;
    let a=footer.querySelector('.site-analytics-link');
    if(!a){a=document.createElement('a');a.className='site-analytics-link';a.href=url;a.target='_blank';a.rel='noopener noreferrer';footer.append(a);footer.style.flexWrap='wrap';}
    const lang=document.documentElement.lang.toLowerCase();
    a.textContent=lang.startsWith('zh')?'访问统计 ↗':lang.startsWith('ja')?'アクセス統計 ↗':'Analytics ↗';
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',entry,{once:true});else entry();
  new MutationObserver(entry).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();

(() => {
  'use strict';
  if(location.hostname!=='yechengzhang.duqi.top'||window.AcademicAnalytics)return;
  window.AcademicAnalytics=true;
  // Only public document identifiers are counted. Search text, page positions,
  // local reading history and user identifiers are never included.
  let previous='',timer;
  function pagePath(){const u=new URL(location.href),p=new URLSearchParams();for(const key of ['report','note','doc','format','edition']){const v=u.searchParams.get(key);if(v&&/^[a-zA-Z0-9._-]{1,100}$/.test(v))p.set(key,v);}return u.pathname+(p.size?'?'+p:'');}
  function track(){if(!window.umami)return;const url=pagePath();if(url===previous)return;previous=url;let referrer='';try{if(document.referrer)referrer=new URL(document.referrer).origin;}catch{}window.umami.track(props=>({...props,url,referrer})).catch(()=>{});}
  const script=document.createElement('script');script.src='https://analytics.duqi.top/script.js';script.async=true;script.dataset.websiteId='3a69e17f-5cb4-4975-b0b4-8c1c1e5b6f30';script.dataset.autoTrack='false';script.dataset.domains='yechengzhang.duqi.top';script.addEventListener('load',track);document.head.append(script);
  function schedule(){clearTimeout(timer);timer=setTimeout(track,400);}
  for(const name of ['pushState','replaceState']){const original=history[name];history[name]=function(...args){const result=Reflect.apply(original,this,args);schedule();return result;};}
  window.addEventListener('popstate',schedule);
})();
