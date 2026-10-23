(() => {
  'use strict';
  const data = window.ReadingLibrary;
  const host = document.getElementById('library');
  if (!data || !host) return;
  const $ = id => document.getElementById(id);
  const all = data.reports;
  const byId = new Map(all.map(r => [r.id, r]));
  const colors = ['#d9dfd3','#e5d9ca','#d6dfe2','#ddd4d0','#e9e0be','#d7dad2','#d9d7e2'];
  const copy = {
    en: { searchLabel:'Search title, company, technology',collection:'Collection',technology:'Technology',core:'Core · 20',online:'Read here · 2',selected:'Selected · 105',all:'All · 643',allTech:'All technologies',reset:'Reset',empty:'No matching reports. Clear the filters or try another term.',more:'Show more',pilot:'R1 and V3 are available to read here. The remaining reports link to their original sources.',source:'Original source ↗',original:'Original',zh:'中文译本',dual:'中英对照',open:'Open PDF ↗',back:'← Bookshelf',generated:'Translation awaiting upload',none:'Original source',available:'Read here',reports:n=>`${n} reports`,shown:(n,t)=>`${n} of ${t}`,foundations:'Models & scale',architecture:'Architecture & efficiency',posttraining:'Post-training & reasoning',archive:'Reports',pages:n=>`${n} pages`,read:'Read report →',quality:'Translation checked in samples; layout issues remain.',fallback:'If the PDF does not display, open it directly.',noFile:'This report is available from its original source.',missing:'Report not found',loading:'PDF reader',catalogDate:'Collection updated',note:'Version'},
    zh: { searchLabel:'搜索标题、公司、技术',collection:'范围',technology:'技术',core:'核心 · 20',online:'在线试读 · 2',selected:'精选 · 105',all:'全部 · 643',allTech:'全部技术',reset:'重置',empty:'没有匹配的报告，试试其他关键词或清除筛选。',more:'查看更多',pilot:'R1、V3 已上线试读，其余报告可打开原始来源。',source:'原始来源 ↗',original:'英文原文',zh:'中文译本',dual:'中英对照',open:'打开 PDF ↗',back:'← 返回书架',generated:'译本待上架',none:'原文',available:'在线试读',reports:n=>`${n} 篇`,shown:(n,t)=>`${n} / ${t} 篇`,foundations:'模型与规模',architecture:'架构与效率',posttraining:'后训练与推理',archive:'报告',pages:n=>`${n} 页`,read:'开始阅读 →',quality:'译文已抽查，仍有排版问题。',fallback:'若内嵌 PDF 无法显示，可直接打开文件。',noFile:'这篇报告目前可从原始来源阅读。',missing:'未找到这篇报告',loading:'PDF 阅读器',catalogDate:'目录更新',note:'版本'},
    ja: { searchLabel:'タイトル・企業・技術を検索',collection:'範囲',technology:'技術',core:'基本 · 20',online:'試し読み · 2',selected:'選集 · 105',all:'すべて · 643',allTech:'すべての技術',reset:'リセット',empty:'該当するレポートがありません。検索語かフィルターを変更してください。',more:'さらに表示',pilot:'R1 と V3 はここで試し読みできます。他のレポートは原典へリンクしています。',source:'原典 ↗',original:'英語原文',zh:'中国語訳',dual:'英中対照',open:'PDF を開く ↗',back:'← 本棚へ',generated:'訳文は公開準備中',none:'原典',available:'試し読み',reports:n=>`${n} 件`,shown:(n,t)=>`${n} / ${t} 件`,foundations:'モデルとスケーリング',architecture:'アーキテクチャと効率',posttraining:'事後学習と推論',archive:'レポート',pages:n=>`${n} ページ`,read:'読む →',quality:'訳文は抜き取り確認済み。組版に問題が残っています。',fallback:'PDF が表示されない場合は、直接ファイルを開いてください。',noFile:'このレポートは原典で読むことができます。',missing:'レポートが見つかりません',loading:'PDF リーダー',catalogDate:'目録更新',note:'版'}
  };
  for(const c of Object.values(copy)){
    for(const [key,stat] of [['core','core'],['online','online'],['selected','selected'],['all','reports']]) c[key]=c[key].replace(/\d+$/,String(data.stats[stat]));
  }
  const language = () => copy[document.documentElement.lang] ? document.documentElement.lang : 'en';
  const t = () => copy[language()];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const shade = r => colors[parseInt(r.id.slice(0,4),16)%colors.length];
  const title = r => r.short || r.title;
  const status = r => r.assets ? t().available : r.translation === 'generated' ? t().generated : t().none;
  const techs = [...new Set(all.flatMap(r=>r.technologies))].sort();
  const preferred=['MoE','MLA','GRPO','PPO','RLVR','Distillation'];
  techs.sort((a,b)=>(preferred.includes(a)?preferred.indexOf(a):99)-(preferred.includes(b)?preferred.indexOf(b):99));
  for(const term of techs){const o=document.createElement('option');o.value=term;o.textContent=term;$('library-tech').append(o);}
  let state,limit=30,disposePDF;
  function readLocation(){
    const p=new URLSearchParams(location.search);
    return {view:p.get('view')==='list'?'list':'shelf',scope:['core','online','selected','all'].includes(p.get('scope'))?p.get('scope'):'core',q:p.get('q')||'',tech:techs.includes(p.get('tech'))?p.get('tech'):'',book:p.get('book')||'',report:p.get('report')||'',page:Math.max(1,parseInt(p.get('page'),10)||1),edition:['original','zh','dual'].includes(p.get('edition'))?p.get('edition'):'original'};
  }
  function url(changes={}){
    const s={...state,...changes},u=new URL(location.href);u.search='';
    u.searchParams.set('lang',language());
    for(const key of ['view','scope','q','tech','book','report','edition','page']) if(s[key]&&s[key]!==({view:'shelf',scope:'core',edition:'original',page:1}[key]))u.searchParams.set(key,s[key]);
    u.hash='';return u.pathname+u.search;
  }
  function navigate(changes,replace=false){
    const oldReport=state.report;if(changes.report&&changes.report!==oldReport)changes.page=1;state={...state,...changes};
    try{history[replace?'replaceState':'pushState'](null,'',url());}catch{}
    render();
    if(oldReport!==state.report)window.scrollTo({top:0,behavior:'instant'});
  }
  function matching(){
    const words=state.q.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    return all.filter(r=>(state.scope==='all'||state.scope==='core'&&r.core_order>0||state.scope==='online'&&r.assets||state.scope==='selected'&&r.selected)&&(!state.tech||r.technologies.includes(state.tech))&&words.every(w=>`${r.short} ${r.title} ${r.company} ${r.technologies.join(' ')} ${r.keywords.join(' ')}`.toLocaleLowerCase().includes(w))).sort((a,b)=>state.scope==='core'?a.core_order-b.core_order:0);
  }
  function groupKey(r){
    if(['architecture','systems'].includes(r.category))return 'architecture';
    if(['reasoning','agent'].includes(r.category)||['d88dbc069c2f','af0ec679eebb','339895873692','cf2d197ad533','e61712df4b8b'].includes(r.id))return 'posttraining';
    return 'foundations';
  }
  function shelfButton(r){
    const name=title(r),idx=all.indexOf(r),length=[...name].length;
    return `<button type="button" class="shelf-book" data-book="${r.id}" aria-pressed="${state.book===r.id}" aria-label="${esc(name+' · '+status(r))}" title="${esc(r.title)}" style="--book-color:${shade(r)};--book-width:${56+idx%4*5}px;--book-height:${178+idx%5*8}px;--spine-size:${length>25?10:length>14?12:16}px"><span class="book-year">${esc(r.date||'')}</span><span class="book-spine">${esc(name)}</span><span class="book-mark ${r.assets?'online':''}" aria-hidden="true"></span></button>`;
  }
  function renderShelves(rows){
    const width=$('library-shelves').clientWidth;
    const per=Math.max(3,Math.min(10,Math.floor((width-36)/(innerWidth<=640?53:75))));
    let markup='';
    for(const group of ['foundations','architecture','posttraining']){
      const books=rows.filter(r=>groupKey(r)===group);
      for(let start=0;start<books.length;start+=per){
        const slice=books.slice(start,start+per);
        markup+=`<section class="shelf-group"><h2 class="shelf-caption"><span class="shelf-subject">${esc(t()[group])}${start?' · '+(Math.floor(start/per)+1):''}</span><span>${slice.length.toString().padStart(2,'0')}</span></h2><div class="book-row">${slice.map(shelfButton).join('')}</div></section>`;
      }
    }
    $('library-shelves').innerHTML=markup;
  }
  function renderList(rows){
    $('library-list').innerHTML=rows.map((r,i)=>`<article class="library-list-row"><span class="list-number">${String(i+1).padStart(2,'0')}</span><div><h2><a href="${esc(url({book:r.id}))}" data-book="${r.id}">${esc(title(r))}</a></h2><p class="list-meta">${esc(r.company)} · ${esc(r.date||'')} ${r.technologies.length?' · '+esc(r.technologies.slice(0,4).join(' · ')):''}</p></div><span class="list-status ${r.assets?'online':''}">${esc(status(r))}</span></article>`).join('');
  }
  function renderDetail(){
    const panel=$('book-detail'),r=byId.get(state.book);panel.hidden=!r;
    if(!r)return;
    const issue=r.quality?.summary?.[language()]||'';
    panel.innerHTML=`<div class="detail-cover" style="--book-color:${shade(r)}"><strong>${esc(title(r))}</strong><span>${esc(r.date)} / ${esc(r.company.split('（')[0])}</span></div><div class="detail-copy"><p class="detail-meta">${esc(r.company)} · ${esc(r.date)}${r.pages?' · '+t().pages(r.pages):''}</p><h2 id="detail-title" tabindex="-1">${esc(title(r))}</h2><p class="detail-title-long">${esc(r.title)}</p><p class="detail-terms">${esc(r.keywords.slice(0,4).join(' · '))}</p><div class="detail-links">${r.assets?`<a href="${esc(url({report:r.id,edition:'original'}))}" data-read="${r.id}" data-edition="original">${t().read}</a><a href="${esc(url({report:r.id,edition:'zh'}))}" data-read="${r.id}" data-edition="zh">${t().zh}</a><a href="${esc(url({report:r.id,edition:'dual'}))}" data-read="${r.id}" data-edition="dual">${t().dual}</a>`:''}<a href="${esc(r.source)}" target="_blank" rel="noopener">${t().source}</a></div><p class="detail-quality">${r.assets?esc(issue):esc(status(r))}</p></div>`;
    const button=$('library-shelves').querySelector(`[data-book="${r.id}"]`);
    if(state.view==='shelf'&&button)button.closest('.shelf-group').after(panel);
    else $('library-more').after(panel);
  }
  function renderReader(){
    const el=$('library-reader'),r=byId.get(state.report);
    if(!r){el.innerHTML=`<a class="reader-back" href="${esc(url({report:''}))}" data-back>${t().back}</a><h1>${t().missing}</h1>`;return;}
    const asset=r.assets?.[state.edition];
    const issue=r.quality?.summary?.[language()]||t().quality;
    const current=el.querySelector('.pdf-document');
    const key=`${r.id}:${state.edition}`;
    // Changing the interface language should not reload a long PDF.
    const reuse=current?.dataset.key===key?current:null;
    if(reuse)reuse.remove();else{disposePDF?.();disposePDF=null;}
    el.innerHTML=`<a class="reader-back" href="${esc(url({report:''}))}" data-back>${t().back}</a><header class="reader-heading"><h1>${esc(title(r))}</h1><p class="reader-subtitle">${esc(r.title)}</p><p class="reader-meta">${esc(r.company)} · ${esc(r.version)}${r.pages?' · '+t().pages(r.pages):''} · <a href="${esc(r.source)}" target="_blank" rel="noopener">${t().source}</a></p></header>${r.assets?`<nav class="edition-bar" aria-label="Edition"><div class="edition-tabs">${['original','zh','dual'].filter(k=>r.assets[k]).map(k=>`<a href="${esc(url({edition:k}))}" data-edition="${k}" data-read="${r.id}" aria-current="${state.edition===k}">${esc(t()[k])}</a>`).join('')}</div><a class="reader-external" href="${esc(asset?.url||r.source)}" target="_blank" rel="noopener">${t().open}${asset?' · '+(asset.bytes/1e6).toFixed(1)+' MB':''}</a></nav><p class="reader-quality">${state.edition==='original'?'':esc(issue)}</p><div id="reader-document"></div><p class="reader-fallback">${t().fallback}</p>`:`<p>${t().noFile}</p>`}`;
    if(asset){
      const frame=reuse||document.createElement('div');frame.className='pdf-document';frame.title=`${title(r)} · ${t()[state.edition]} · ${t().loading}`;
      frame.dataset.key=key;
      $('reader-document').append(frame);
      if(!reuse)disposePDF=window.ReadingPDF.mount(frame,asset.url,state.page,n=>{state.page=n;try{history.replaceState(null,'',url());}catch{}});
    }
    document.title=`${title(r)} · Yecheng Zhang`;
  }
  function render(){
    document.querySelectorAll('[data-copy]').forEach(el=>{const value=t()[el.dataset.copy];if(typeof value==='string')el.textContent=value;});
    $('library-search').placeholder=t().searchLabel;
    $('library-index').hidden=!!state.report;$('library-reader').hidden=!state.report;
    if(state.report){renderReader();return;}
    disposePDF?.();disposePDF=null;$('library-reader').replaceChildren();
    const matchingRows=matching(),rows=matchingRows.slice(0,limit);
    $('library-search').value=state.q;$('library-scope').value=state.scope;$('library-tech').value=state.tech;
    document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===state.view)));
    $('library-shelves').hidden=state.view!=='shelf';$('library-list').hidden=state.view!=='list';
    // Keep the detail node alive when it was inserted between shelf rows.
    $('library-more').after($('book-detail'));
    if(state.view==='shelf')renderShelves(rows);else renderList(rows);
    $('library-count').textContent=matchingRows.length>limit?t().shown(rows.length,matchingRows.length):t().reports(matchingRows.length);
    $('library-empty').hidden=matchingRows.length>0;$('library-more').hidden=rows.length>=matchingRows.length;
    $('library-reset').hidden=!state.q&&!state.tech&&state.scope==='core';
    renderDetail();
    document.title=`${language()==='zh'?'基模阅读':language()==='ja'?'基盤モデル':'Foundation Models'} · Yecheng Zhang`;
  }
  host.addEventListener('click',event=>{
    const element=event.target.closest('[data-book],[data-read],[data-back],[data-view]');
    if(!element||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    event.preventDefault();
    if(element.hasAttribute('data-view'))navigate({view:element.dataset.view});
    else if(element.hasAttribute('data-back'))navigate({report:'',edition:'original'});
    else if(element.hasAttribute('data-read'))navigate({report:element.dataset.read,edition:element.dataset.edition||'original'});
    else{
      navigate({book:state.book===element.dataset.book?'':element.dataset.book});
      if(state.book){$('book-detail').scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});$('detail-title')?.focus({preventScroll:true});}
    }
  });
  $('library-search').addEventListener('input',e=>{limit=30;navigate({q:e.target.value,scope:e.target.value.trim()?'all':state.scope,book:''},true);});
  $('library-scope').addEventListener('change',e=>{limit=30;navigate({scope:e.target.value,book:''});});
  $('library-tech').addEventListener('change',e=>{limit=30;navigate({tech:e.target.value,scope:e.target.value?'selected':state.scope,book:''});});
  $('library-reset').addEventListener('click',()=>{limit=30;navigate({q:'',tech:'',scope:'core',book:''});});
  $('library-more').addEventListener('click',()=>{limit+=30;render();});
  window.addEventListener('popstate',()=>{state=readLocation();render();});
  new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(!state.report&&state.view==='shelf')render();},180);});
  state=readLocation();render();
})();
