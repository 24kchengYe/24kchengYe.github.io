(() => {
  'use strict';
  const root = document.getElementById('writing-activity');
  if (!root) return;
  const words = {
    en: {day: n => `${n} article${n === 1 ? '' : 's'} updated`, summary: n => `${n} active days`, since: d => `Records since ${d}`, empty: 'No writing updates recorded.', unknown: 'No records for this period.', publication: 'Added', revision: 'Revised'},
    zh: {day: n => `更新 ${n} 篇文章`, summary: n => `${n} 个更新日`, since: d => `记录始于 ${d}`, empty: '当天没有写作更新。', unknown: '这段时间尚无记录。', publication: '收录', revision: '修订'},
    ja: {day: n => `${n} 件の記事を更新`, summary: n => `更新日 ${n} 日`, since: d => `${d} から記録`, empty: 'この日の更新はありません。', unknown: 'この期間の記録はありません。', publication: '追加', revision: '改訂'}
  };
  const lang = () => words[document.documentElement.lang] ? document.documentElement.lang : 'en';
  const today = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Shanghai', year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const iso = d => d.toISOString().slice(0, 10);
  let data, days, selected;
  const yearSelect = root.querySelector('.activity-year'), grid = root.querySelector('.activity-grid'), detail = root.querySelector('.activity-day-detail');
  function showDay(date) {
    selected = date;
    const t = words[lang()], entries = days.get(date) || [], unknown = date < data.coverageStart;
    detail.replaceChildren(); detail.hidden = false;
    const heading = document.createElement('p'); heading.textContent = `${date.replaceAll('-','.')} · ${unknown ? t.unknown : t.day(entries.length)}`; detail.append(heading);
    const list = document.createElement('ul');
    for (const entry of entries) {
      const article = data.articles[entry.id]; if (!article) continue;
      const li = document.createElement('li'), a = document.createElement('a'), type = document.createElement('small');
      const url = new URL(article.href, location.href); if (url.origin !== location.origin || !url.pathname.includes('/writing/')) continue;
      url.searchParams.set('lang', lang()); a.href = url.href; a.textContent = article.title[lang()] || article.title.zh;
      type.textContent = t[entry.kind]; li.append(a, type); list.append(li);
    }
    if (!entries.length && !unknown) { const p = document.createElement('p'); p.textContent = t.empty; list.append(p); }
    detail.append(list);
    grid.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.date === date)));
  }
  function render() {
    const year = Number(yearSelect.value), first = new Date(Date.UTC(year,0,1)), last = new Date(Date.UTC(year,11,31));
    const start = new Date(first); start.setUTCDate(start.getUTCDate() - (first.getUTCDay()+6)%7);
    const weekCount = Math.ceil(((last - start)/86400000+1)/7);
    root.style.setProperty('--weeks', weekCount); grid.replaceChildren();
    const months = root.querySelector('.activity-months'); months.replaceChildren();
    const t = words[lang()], active = data.days.filter(d=>d.date.startsWith(year+'-')&&d.date<=today);
    root.querySelector('.activity-summary').textContent = `${t.summary(active.length)} · ${t.since(data.coverageStart.replaceAll('-','.'))}`;
    for (let month=0;month<12;month++) {
      const date = new Date(Date.UTC(year,month,1)), label=document.createElement('span');
      label.textContent = new Intl.DateTimeFormat(lang()==='zh'?'zh-CN':lang()==='ja'?'ja-JP':'en',{month:'short',timeZone:'UTC'}).format(date);
      label.style.gridColumn = String(Math.floor((date-start)/604800000)+1); months.append(label);
    }
    const focusDate = selected?.startsWith(year+'-') ? selected : active.at(-1)?.date || `${year}-01-01`;
    for(let index=0; index<weekCount*7; index++) {
      const date = new Date(start); date.setUTCDate(date.getUTCDate()+index);
      if(date.getUTCFullYear()!==year){grid.append(document.createElement('span'));continue;}
      const key=iso(date), count=(days.get(key)||[]).length, button=document.createElement('button');
      const state=key>today?'future':key<data.coverageStart?'unknown':'recorded';
      button.type='button'; button.className='activity-day'; button.dataset.date=key; button.dataset.state=state;
      button.dataset.level=String(count===0?0:count===1?1:count<=3?2:count<=5?3:4);
      button.disabled=state==='future'; button.tabIndex=key===focusDate?0:-1;
      button.title=`${key} · ${state==='unknown'?t.unknown:t.day(count)}`;button.setAttribute('aria-label',button.title);
      button.setAttribute('aria-pressed',String(key===selected));button.addEventListener('click',()=>showDay(key));grid.append(button);
    }
    if(selected?.startsWith(year+'-'))showDay(selected);else{detail.hidden=true;selected=null;}
  }
  grid.addEventListener('keydown',event=>{
    if(!event.target.matches('.activity-day'))return;
    const delta={ArrowUp:-1,ArrowDown:1,ArrowLeft:-7,ArrowRight:7}[event.key];
    if(delta===undefined&&event.key!=='Home'&&event.key!=='End')return;
    event.preventDefault();const buttons=[...grid.querySelectorAll('button:not(:disabled)')];let i=buttons.indexOf(event.target);
    i=event.key==='Home'?0:event.key==='End'?buttons.length-1:Math.max(0,Math.min(buttons.length-1,i+delta));
    buttons.forEach(b=>b.tabIndex=-1);buttons[i].tabIndex=0;buttons[i].focus();
  });
  async function init(){
    try{
      const response=await fetch(root.dataset.activitySource);if(!response.ok)throw new Error('activity data unavailable');data=await response.json();
      days=new Map(data.days.map(day=>[day.date,day.articles]));const years=[...new Set([today.slice(0,4),...data.days.map(d=>d.date.slice(0,4))])].sort().reverse();
      years.forEach(year=>{const option=document.createElement('option');option.value=option.textContent=year;yearSelect.append(option);});
      render();yearSelect.addEventListener('change',()=>{selected=null;render();});
      new MutationObserver(()=>render()).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
      if(innerWidth<680){const calendar=root.querySelector('.activity-calendar');const last=grid.querySelector(`[data-date="${data.days.at(-1)?.date}"]`);if(last)calendar.scrollLeft=Math.max(0,last.offsetLeft-calendar.offsetLeft-calendar.clientWidth+40);}
    }catch{root.hidden=true;}
  }
  if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();init();}},{rootMargin:'300px'});observer.observe(root);}else init();
})();
