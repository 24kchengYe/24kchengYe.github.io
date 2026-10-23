(() => {
  'use strict';
  const data = window.ReadingLibrary;
  const host = document.getElementById('library');
  if (!data || !host) return;
  const $ = id => document.getElementById(id);
  const all = data.reports;
  const byId = new Map(all.map(r => [r.id, r]));
  const collections = window.ReadingCollections || {books:[],researchers:[]};
  const learningEntries=collections.books.flatMap(book=>book.chapters.map(chapter=>({...chapter,topicId:book.id,topicTitle:book.title})));
  const paths = {
    foundations:['fffe3a68fde7','29864daaa4da','062b6f36b6d9','256aff6da7f6','ae05c3745b70','e61712df4b8b'],
    architecture:['f136305461ac','3062b56ccb5c','71c5692bf45f','d34b21f52753','0eac14151cad','0287ec0c0427'],
    posttraining:['339895873692','cf2d197ad533','af0ec679eebb','704e377fae0d','bc6ea548802a','d88dbc069c2f','6d96409126d5','e61712df4b8b','af9031968d8e','4a9d6ec982b5','bf6a2af2fae4']
  };
  const colors = ['#d9dfd3','#e5d9ca','#d6dfe2','#ddd4d0','#e9e0be','#d7dad2','#d9d7e2'];
  const copy = {
    en: { searchLabel:'Search title, company, technology',collection:'Collection',technology:'Technology',core:'Core · 20',online:'Read here · 2',selected:'Selected · 105',all:'All · 643',allTech:'All technologies',reset:'Reset',empty:'No matching reports. Clear the filters or try another term.',more:'Show more',pilot:'R1 and V3 are available to read here. The remaining reports link to their original sources.',source:'Original source ↗',original:'Original',zh:'中文译本',dual:'中英对照',open:'Open PDF ↗',back:'← Bookshelf',generated:'Translation awaiting upload',none:'Original source',available:'Read here',reports:n=>`${n} reports`,shown:(n,t)=>`${n} of ${t}`,foundations:'Models & scale',architecture:'Architecture & efficiency',posttraining:'Post-training & reasoning',archive:'Reports',pages:n=>`${n} pages`,read:'Read report →',quality:'Translation checked in samples; layout issues remain.',fallback:'If the PDF does not display, open it directly.',noFile:'This report is available from its original source.',missing:'Report not found',loading:'PDF reader',catalogDate:'Collection updated',note:'Version'},
    zh: { searchLabel:'搜索标题、公司、技术',collection:'范围',technology:'技术',core:'核心 · 20',online:'在线试读 · 2',selected:'精选 · 105',all:'全部 · 643',allTech:'全部技术',reset:'重置',empty:'没有匹配的报告，试试其他关键词或清除筛选。',more:'查看更多',pilot:'R1、V3 已上线试读，其余报告可打开原始来源。',source:'原始来源 ↗',original:'英文原文',zh:'中文译本',dual:'中英对照',open:'打开 PDF ↗',back:'← 返回书架',generated:'译本待上架',none:'原文',available:'在线试读',reports:n=>`${n} 篇`,shown:(n,t)=>`${n} / ${t} 篇`,foundations:'模型与规模',architecture:'架构与效率',posttraining:'后训练与推理',archive:'报告',pages:n=>`${n} 页`,read:'开始阅读 →',quality:'译文已抽查，仍有排版问题。',fallback:'若内嵌 PDF 无法显示，可直接打开文件。',noFile:'这篇报告目前可从原始来源阅读。',missing:'未找到这篇报告',loading:'PDF 阅读器',catalogDate:'目录更新',note:'版本'},
    ja: { searchLabel:'タイトル・企業・技術を検索',collection:'範囲',technology:'技術',core:'基本 · 20',online:'試し読み · 2',selected:'選集 · 105',all:'すべて · 643',allTech:'すべての技術',reset:'リセット',empty:'該当するレポートがありません。検索語かフィルターを変更してください。',more:'さらに表示',pilot:'R1 と V3 はここで試し読みできます。他のレポートは原典へリンクしています。',source:'原典 ↗',original:'英語原文',zh:'中国語訳',dual:'英中対照',open:'PDF を開く ↗',back:'← 本棚へ',generated:'訳文は公開準備中',none:'原典',available:'試し読み',reports:n=>`${n} 件`,shown:(n,t)=>`${n} / ${t} 件`,foundations:'モデルとスケーリング',architecture:'アーキテクチャと効率',posttraining:'事後学習と推論',archive:'レポート',pages:n=>`${n} ページ`,read:'読む →',quality:'訳文は抜き取り確認済み。組版に問題が残っています。',fallback:'PDF が表示されない場合は、直接ファイルを開いてください。',noFile:'このレポートは原典で読むことができます。',missing:'レポートが見つかりません',loading:'PDF リーダー',catalogDate:'目録更新',note:'版'}
  };
  for(const c of Object.values(copy)){
    for(const [key,stat] of [['core','core'],['online','online'],['selected','selected'],['all','reports']]) c[key]=c[key].replace(/\d+$/,String(data.stats[stat]));
  }
  Object.assign(copy.en,{openDocument:'Open document ↗',available:'Read here',online:'Read here · '+data.stats.online,pilot:'Original reports and available Chinese editions.'});
  Object.assign(copy.zh,{openDocument:'打开文档 ↗',original:'原文',available:'在线阅读',online:copy.zh.online.replace('在线试读','在线阅读'),pilot:'原文与现有中文译本。'});
  Object.assign(copy.ja,{openDocument:'文書を開く ↗',original:'原文',available:'オンラインで読む',online:copy.ja.online.replace('試し読み','オンライン'),pilot:'原文と公開済みの中国語訳。'});
  const collectionCopy = {
    en:{reportsTab:'Technical reports',learningTab:'AI learning',researchersTab:'Researchers',learningSearch:'Search topics, methods, papers',researcherSearch:'Search names, topics, writing',empty:'No matches. Try another search.',learningNote:'A topic index from the Foundation Models reading collection. Links open public sources.',researchersNote:'Personal blogs and selected essays.',chapters:'Contents',blog:'Personal blog ↗',articles:'Selected writing',unlinked:'Source pending',related:'Report',close:'Close',items:n=>`${n} entries`,volumes:(n,c)=>`${n} topics · ${c} entries`,people:(n,c)=>`${n} researchers · ${c} essays`,basics:'Models & systems',training:'Training & evaluation',applications:'Agents & applications'},
    zh:{reportsTab:'基模技术报告',learningTab:'AI 技术学习',researchersTab:'研究者',learningSearch:'搜索主题、方法、论文',researcherSearch:'搜索姓名、主题、文章',empty:'没有匹配结果，试试其他关键词。',learningNote:'按 Foundation Models 合集整理的主题目录，链接指向公开原文。',researchersNote:'个人博客与精选文章。',chapters:'章节目录',blog:'个人博客 ↗',articles:'精选文章',unlinked:'来源待补',related:'报告',close:'收起',items:n=>`${n} 条`,volumes:(n,c)=>`${n} 个主题 · ${c} 条`,people:(n,c)=>`${n} 位 · ${c} 篇文章`,basics:'模型与系统',training:'训练与评测',applications:'智能体与应用'},
    ja:{reportsTab:'技術レポート',learningTab:'AI 学習',researchersTab:'研究者',learningSearch:'テーマ・手法・論文を検索',researcherSearch:'名前・テーマ・記事を検索',empty:'該当する項目はありません。検索語を変更してください。',learningNote:'Foundation Models 文献集をテーマ別に整理。リンク先は公開原典です。',researchersNote:'個人ブログと記事の選集。',chapters:'目次',blog:'個人ブログ ↗',articles:'記事の選集',unlinked:'出典確認中',related:'レポート',close:'閉じる',items:n=>`${n} 件`,volumes:(n,c)=>`${n} テーマ · ${c} 件`,people:(n,c)=>`${n} 人 · ${c} 記事`,basics:'モデルとシステム',training:'学習と評価',applications:'エージェントと応用'}
  };
  for(const lang of Object.keys(copy))Object.assign(copy[lang],collectionCopy[lang]);
  Object.assign(copy.en,{allTopics:'All topics',topicLabel:'Topic',topicAll:n=>`All ${n} →`,overview:(n,c)=>`${n} shelves · ${c} entries`,learningNote:'Each book is a paper or resource. Organized by topic from the Foundation Models collection.'});
  Object.assign(copy.zh,{allTopics:'全部主题',topicLabel:'主题',topicAll:n=>`全部 ${n} 条 →`,overview:(n,c)=>`${n} 个书架 · ${c} 条`,learningNote:'每本书对应一篇论文或资料，按 Foundation Models 合集的主题编排。'});
  Object.assign(copy.ja,{allTopics:'すべてのテーマ',topicLabel:'テーマ',topicAll:n=>`全 ${n} 件 →`,overview:(n,c)=>`${n} 棚 · ${c} 件`,learningNote:'一冊が論文や資料に対応。Foundation Models 文献集をテーマ別に整理。'});
  Object.assign(copy.en,{previousBooks:'Previous books',nextBooks:'Next books'});
  Object.assign(copy.zh,{previousBooks:'向上浏览',nextBooks:'向下浏览'});
  Object.assign(copy.ja,{previousBooks:'前の本',nextBooks:'次の本'});
  const language = () => copy[document.documentElement.lang] ? document.documentElement.lang : 'en';
  const t = () => copy[language()];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const shade = r => colors[Array.from(r.id).reduce((n,c)=>n+c.charCodeAt(0),0)%colors.length];
  const local = value => typeof value==='object' ? value[language()]||value.en||value.zh : value;
  const title = r => r.short || r.title;
  const status = r => r.assets ? t().available : r.translation === 'generated' ? t().generated : t().none;
  const techs = [...new Set(all.flatMap(r=>r.technologies))].sort();
  const preferred=['MoE','MLA','GRPO','PPO','RLVR','Distillation'];
  techs.sort((a,b)=>(preferred.includes(a)?preferred.indexOf(a):99)-(preferred.includes(b)?preferred.indexOf(b):99));
  for(const term of techs){const o=document.createElement('option');o.value=term;o.textContent=term;$('library-tech').append(o);}
  for(const book of collections.books){const o=document.createElement('option');o.value=book.id;o.textContent=local(book.title);$('learning-topic').append(o);}
  let state,limit=30,disposePDF;
  function readLocation(){
    const p=new URLSearchParams(location.search);
    const path=Object.hasOwn(paths,p.get('path'))?p.get('path'):'';
    const scope=p.get('scope')==='archive'?'all':p.get('scope');
    const legacy={knowledge:'learning',researchers:'researchers'}[p.get('view')];
    return {collection:['reports','learning','researchers'].includes(p.get('collection'))?p.get('collection'):legacy||'reports',topic:collections.books.some(b=>b.id===p.get('topic'))?p.get('topic'):'',path,view:p.get('view')==='list'?'list':'shelf',scope:['core','online','selected','all'].includes(scope)?scope:path?'selected':'core',q:p.get('q')||'',tech:techs.includes(p.get('tech'))?p.get('tech'):'',book:p.get('book')||'',report:p.get('report')||'',page:Math.max(1,parseInt(p.get('page'),10)||1),edition:['original','zh','dual'].includes(p.get('edition'))?p.get('edition'):'original'};
  }
  function url(changes={}){
    const s={...state,...changes},u=new URL(location.href);u.search='';
    u.searchParams.set('lang',language());
    for(const key of ['collection','topic','path','view','scope','q','tech','book','report','edition','page']) if(s[key]&&s[key]!==({collection:'reports',view:'shelf',scope:'core',edition:'original',page:1}[key]))u.searchParams.set(key,s[key]);
    u.hash='';return u.pathname+u.search;
  }
  function navigate(changes,replace=false){
    const oldReport=state.report;if(changes.report&&changes.report!==oldReport)changes.page=1;state={...state,...changes};
    try{history[replace?'replaceState':'pushState']({limit},'',url());}catch{}
    render();
    if(oldReport!==state.report)window.scrollTo({top:0,behavior:'instant'});
  }
  function matching(){
    const words=state.q.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    return all.filter(r=>(state.scope==='all'||state.scope==='core'&&r.core_order>0||state.scope==='online'&&r.assets||state.scope==='selected'&&r.selected)&&(!state.topic||r.topicId===state.topic)&&(!state.path||paths[state.path].includes(r.id))&&(!state.tech||r.technologies.includes(state.tech))&&words.every(w=>`${r.short} ${r.title} ${r.company} ${r.technologies.join(' ')} ${r.keywords.join(' ')}`.toLocaleLowerCase().includes(w))).sort((a,b)=>state.path?paths[state.path].indexOf(a.id)-paths[state.path].indexOf(b.id):state.scope==='core'?a.core_order-b.core_order:0);
  }
  function shelfButton(r){
    const name=title(r),idx=all.indexOf(r),length=[...name].length;
    return `<button type="button" class="shelf-book" data-book="${r.id}" aria-pressed="${state.book===r.id}" aria-label="${esc(name+' · '+status(r))}" title="${esc(r.title)}" style="--book-color:${shade(r)};--book-inset:${idx%4*4}px;--stack-height:${64+idx%3*5}px;--spine-size:${length>45?13:15}px"><span class="book-year">${esc(r.date||'')}</span><span class="book-spine">${esc(name)}</span><span class="book-mark ${r.assets?'online':''}" aria-hidden="true"></span></button>`;
  }
  function shelfMarkup(group,label,books,button){
    if(!books.length)return '';
    const key=JSON.stringify([state.collection,state.scope,state.path,state.tech,state.q,group]);
    const id='shelf-'+group;
    return `<section class="shelf-group"><div class="shelf-caption"><h2 class="shelf-subject" id="${id}-label">${esc(label)}</h2><div class="shelf-navigation"><span class="shelf-position">${books.length}</span><button type="button" data-slide="prev" aria-label="${esc(t().previousBooks+' · '+label)}" aria-controls="${id}" disabled>↑</button><button type="button" data-slide="next" aria-label="${esc(t().nextBooks+' · '+label)}" aria-controls="${id}">↓</button></div></div><div class="shelf-stage"><div id="${id}" class="shelf-track" role="region" aria-labelledby="${id}-label" data-position-key="${esc(key)}"><div class="book-row">${books.map(button).join('')}</div></div></div></section>`;
  }
  function renderShelves(rows){
    $('library-shelves').innerHTML=collections.books.map(group=>shelfMarkup(group.id,local(group.title),rows.filter(r=>r.topicId===group.id),shelfButton)).join('');
  }
  function renderList(rows){
    $('library-list').innerHTML=rows.map((r,i)=>`<article class="library-list-row"><span class="list-number">${String(i+1).padStart(2,'0')}</span><div><h2><a href="${esc(url({book:r.id}))}" data-book="${r.id}">${esc(title(r))}</a></h2><p class="list-meta">${esc(r.company)} · ${esc(r.date||'')} ${r.technologies.length?' · '+esc(r.technologies.slice(0,4).join(' · ')):''}</p></div><span class="list-status ${r.assets?'online':''}">${esc(status(r))}</span></article>`).join('');
  }
  function searchMatch(text){
    return state.q.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean).every(w=>text.toLocaleLowerCase().includes(w));
  }
  function collectionItems(){return state.collection==='learning'?learningEntries:collections.researchers;}
  function collectionName(r){return local(r.title)||r.name;}
  function itemText(r){
    if(state.collection==='learning'){
      const synonyms={'Group Relative Policy Optimization':'GRPO','Proximal Policy Optimization':'PPO','Direct Preference Optimization':'DPO','Mixture of Experts':'MoE','Multi-head Latent Attention':'MLA'};
      return `${r.title} ${Object.values(r.topicTitle).join(' ')} ${local(r.section)||''} ${Object.entries(synonyms).filter(([term])=>r.title.toLowerCase().includes(term.toLowerCase())).map(([,abbr])=>abbr).join(' ')}`;
    }
    return `${r.name} ${r.topics.join(' ')}`;
  }
  function childItems(r){return searchMatch(itemText(r))?r.articles:r.articles.filter(c=>searchMatch(c.title));}
  function collectionMatching(){
    if(state.collection==='learning')return learningEntries.filter(r=>(!state.topic||r.topicId===state.topic)&&searchMatch(itemText(r)));
    return collections.researchers.filter(r=>childItems(r).length);
  }
  function collectionBook(r,i){
    const name=collectionName(r),spine=name,learning=state.collection==='learning';
    return `<button type="button" class="shelf-book" data-book="${esc(r.id)}" aria-pressed="${state.book===r.id}" aria-label="${esc(name)}" title="${esc(name)}" style="--book-color:${shade(r)};--book-inset:${i%4*4}px;--stack-height:${64+i%3*5}px;--spine-size:${spine.length>45?13:15}px"><span class="book-year">${learning?String(i+1).padStart(2,'0'):String(r.articles.length).padStart(2,'0')}</span><span class="book-spine">${esc(spine)}</span><span class="book-mark" aria-hidden="true"></span></button>`;
  }
  function renderCollection(rows){
    const learning=state.collection==='learning';
    if(state.view==='shelf'){
      const groups=learning?collections.books:[{id:'researchers',title:t().researchersTab}];
      $('library-shelves').innerHTML=groups.map(group=>shelfMarkup(group.id,local(group.title),rows.filter(r=>!learning||r.topicId===group.id),collectionBook)).join('');
      $('library-list').replaceChildren();return;
    }
    $('library-list').innerHTML=rows.map((r,i)=>`<article class="library-list-row"><span class="list-number">${String(i+1).padStart(2,'0')}</span><div><h2><a href="${esc(url({book:r.id}))}" data-book="${esc(r.id)}">${esc(collectionName(r))}</a></h2><p class="list-meta">${esc(learning?[local(r.topicTitle),local(r.section)].filter(Boolean).join(' · '):r.topics.join(' · '))}</p></div><span class="list-status">${learning?'':t().items(childItems(r).length)}</span></article>`).join('');
  }
  function chapterRow(c,index){
    const urls=c.sourceUrls||[c.url];
    const related=(c.reportIds||[]).filter(id=>byId.has(id));
    const extras=urls.slice(1).map((u,i)=>`<a href="${esc(u)}" target="_blank" rel="noopener">${i+2} ↗</a>`).join(' ');
    return `<li><span class="chapter-number">${String(index+1).padStart(2,'0')}</span><div>${urls.length?`<a href="${esc(urls[0])}" target="_blank" rel="noopener">${esc(c.title)} <span aria-hidden="true">↗</span></a>`:`<span>${esc(c.title)}</span> <small>${t().unlinked}</small>`}${extras?` <span class="chapter-extra">${extras}</span>`:''}${related.map(id=>` <a class="chapter-report" href="${esc(url({collection:'reports',book:id,report:'',q:'',topic:'',scope:'all',tech:'',path:''}))}" data-related="${id}">${t().related} ↗</a>`).join('')}</div></li>`;
  }
  function placeShelfDetail(button,panel){
    const grid=$('library-shelves'),groups=Array.from(grid.querySelectorAll(':scope > .shelf-group'));
    const index=groups.indexOf(button.closest('.shelf-group'));
    const columns=getComputedStyle(grid).gridTemplateColumns.split(' ').length;
    groups[Math.min(groups.length-1,Math.floor(index/columns)*columns+columns-1)]?.after(panel);
  }
  function renderDetail(){
    const panel=$('book-detail');panel.classList.toggle('collection-detail',state.collection!=='reports');
    if(state.collection!=='reports'){renderCollectionDetail();return;}
    const r=byId.get(state.book);panel.hidden=!r;
    if(!r)return;
    const issue=r.quality?.summary?.[language()]||'';
    panel.innerHTML=`<div class="detail-cover" style="--book-color:${shade(r)}"><strong>${esc(title(r))}</strong><span>${esc(r.date)} / ${esc(r.company.split('（')[0])}</span></div><div class="detail-copy"><p class="detail-meta">${esc(r.company)} · ${esc(r.date)}${r.pages?' · '+t().pages(r.pages):''}</p><h2 id="detail-title" tabindex="-1">${esc(title(r))}</h2><p class="detail-title-long">${esc(r.title)}</p><p class="detail-terms">${esc(r.keywords.slice(0,4).join(' · '))}</p><div class="detail-links">${r.assets?['original','zh','dual'].filter(k=>r.assets[k]).map(k=>`<a href="${esc(url({report:r.id,edition:k}))}" data-read="${r.id}" data-edition="${k}">${k==='original'?t().read:t()[k]}</a>`).join(''):''}<a href="${esc(r.source)}" target="_blank" rel="noopener">${t().source}</a></div><p class="detail-quality">${r.assets?esc(issue):esc(status(r))}</p></div>`;
    const button=$('library-shelves').querySelector(`[data-book="${r.id}"]`);
    if(state.view==='shelf'&&button)placeShelfDetail(button,panel);
    else $('library-more').after(panel);
  }
  function renderCollectionDetail(){
    const panel=$('book-detail'),r=collectionItems().find(r=>r.id===state.book);panel.hidden=!r;
    if(!r)return;
    const name=collectionName(r),learning=state.collection==='learning';
    const links=learning?r.sourceUrls:[],related=learning?r.reportIds.filter(id=>byId.has(id)):[];
    const sources=links.map(u=>{const domain=new URL(u).hostname.replace(/^www\./,'');const label=({'arxiv.org':'arXiv','github.com':'GitHub','nature.com':'Nature','huggingface.co':'Hugging Face'})[domain]||domain;return `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(label)} ↗</a>`;}).join('');
    const reports=related.map(id=>byId.get(id).assets?.original?`<a href="${esc(url({report:id,edition:'original',page:1}))}" data-read="${id}" data-edition="original">${esc(title(byId.get(id)))} · ${t().original} →</a>`:`<a href="${esc(url({collection:'reports',book:id,report:'',q:'',topic:'',scope:'all',tech:'',path:''}))}" data-related="${id}">${esc(title(byId.get(id)))} · ${t().related} →</a>`).join('');
    const editions=related.filter(id=>byId.get(id).assets?.zh).map(id=>`<a href="${esc(url({report:id,edition:'zh',page:1}))}" data-read="${id}" data-edition="zh">${t().zh} →</a>`).join('');
    const metadata=learning?[local(r.topicTitle),local(r.section)].filter(Boolean).join(' · '):t().researchersTab;
    panel.innerHTML=`<div class="detail-cover" style="--book-color:${shade(r)}"><strong>${esc(name)}</strong><span>${learning?t().learningTab:t().researchersTab}</span></div><div class="detail-copy"><div class="detail-topline"><p class="detail-meta">${esc(metadata)}</p><button type="button" data-close class="detail-close" aria-label="${t().close}">×</button></div><h2 id="detail-title" tabindex="-1">${esc(name)}</h2>${learning?`<div class="detail-links">${sources}${editions}${reports}</div>${!links.length?`<p class="detail-quality">${t().unlinked}</p>`:''}`:`<p class="detail-terms">${esc(r.topics.join(' · '))}</p><a href="${esc(r.url)}" target="_blank" rel="noopener" class="detail-blog">${t().blog}</a>`}</div>${!learning?`<div class="collection-contents"><h3>${t().articles}</h3><ol class="chapter-list">${childItems(r).map(chapterRow).join('')}</ol></div>`:''}`;
    const button=$('library-shelves').querySelector(`[data-book="${r.id}"]`);
    if(state.view==='shelf'&&button)placeShelfDetail(button,panel);
    else if(state.view==='list')$('library-list').querySelector(`[data-book="${r.id}"]`)?.closest('article').after(panel);
  }
  function renderReader(){
    const el=$('library-reader'),r=byId.get(state.report);
    if(!r){el.innerHTML=`<a class="reader-back" href="${esc(url({report:''}))}" data-back>${t().back}</a><h1>${t().missing}</h1>`;return;}
    if(r.assets&&!r.assets[state.edition])state.edition='original';
    const asset=r.assets?.[state.edition];
    const issue=r.quality?.summary?.[language()]||t().quality;
    const current=el.querySelector('.pdf-document');
    const key=`${r.id}:${state.edition}`;
    // Changing the interface language should not reload a long PDF.
    const reuse=current?.dataset.key===key?current:null;
    if(reuse)reuse.remove();else{disposePDF?.();disposePDF=null;}
    el.innerHTML=`<a class="reader-back" href="${esc(url({report:''}))}" data-back>${t().back}</a><header class="reader-heading"><h1>${esc(title(r))}</h1><p class="reader-subtitle">${esc(r.title)}</p><p class="reader-meta">${esc(r.company)} · ${esc(r.version)}${r.pages?' · '+t().pages(r.pages):''} · <a href="${esc(r.source)}" target="_blank" rel="noopener">${t().source}</a></p></header>${r.assets?`<nav class="edition-bar" aria-label="Edition"><div class="edition-tabs">${['original','zh','dual'].filter(k=>r.assets[k]).map(k=>`<a href="${esc(url({edition:k}))}" data-edition="${k}" data-read="${r.id}" aria-current="${state.edition===k}">${esc(t()[k])}</a>`).join('')}</div><a class="reader-external" href="${esc(asset?.url||r.source)}" target="_blank" rel="noopener">${asset?.format==='html'?t().openDocument:t().open}${asset?' · '+(asset.bytes/1e6).toFixed(1)+' MB':''}</a></nav><p class="reader-quality">${state.edition==='original'?'':esc(issue)}</p><div id="reader-document"></div><p class="reader-fallback">${asset?.format==='html'?'':t().fallback}</p>`:`<p>${t().noFile}</p>`}`;
    if(asset?.format==='html'){
      const frame=document.createElement('iframe');frame.className='reader-frame document-frame';frame.title=title(r);frame.src=asset.url;frame.setAttribute('sandbox','allow-popups allow-popups-to-escape-sandbox');$('reader-document').append(frame);
    }else if(asset){
      const frame=reuse||document.createElement('div');frame.className='pdf-document';frame.title=`${title(r)} · ${t()[state.edition]} · ${t().loading}`;
      frame.dataset.key=key;
      $('reader-document').append(frame);
      if(!reuse)disposePDF=window.ReadingPDF.mount(frame,asset.url,state.page,n=>{state.page=n;try{history.replaceState({limit},'',url());}catch{}});
    }
    document.title=`${title(r)} · Yecheng Zhang`;
  }
  function render(){
    window.ReadingShelves.remember($('library-shelves'));
    document.querySelectorAll('[data-copy]').forEach(el=>{const value=t()[el.dataset.copy];if(typeof value==='string')el.textContent=value;});
    const reportCollection=state.collection==='reports';
    const searchLabel=reportCollection?t().searchLabel:state.collection==='learning'?t().learningSearch:t().researcherSearch;
    $('library-search').placeholder=searchLabel;$('library-search-label').textContent=searchLabel;
    document.querySelectorAll('[data-collection]').forEach(el=>{
      if(el.dataset.collection===state.collection)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');
      el.href=url({collection:el.dataset.collection,topic:'',book:'',report:'',q:'',path:'',tech:'',scope:'core'});
    });
    $('learning-topic-control').hidden=state.collection==='researchers';$('learning-topic').value=state.topic;collections.books.forEach(b=>{$('learning-topic').querySelector(`[value="${b.id}"]`).textContent=local(b.title);});
    $('library-scope-control').hidden=!reportCollection;$('library-tech-control').hidden=!reportCollection;
    $('library-index').hidden=!!state.report;$('library-reader').hidden=!state.report;
    if(state.report){renderReader();return;}
    disposePDF?.();disposePDF=null;$('library-reader').replaceChildren();
    const matchingRows=reportCollection?matching():collectionMatching(),overview=state.collection==='learning'&&!state.topic&&!state.q&&state.view==='shelf';
    const selectedIndex=matchingRows.findIndex(r=>r.id===state.book);
    if(selectedIndex>=limit)limit=Math.ceil((selectedIndex+1)/30)*30;
    const rows=state.view==='shelf'||state.collection==='researchers'?matchingRows:matchingRows.slice(0,limit);
    $('library-search').value=state.q;$('library-scope').value=state.scope;$('library-tech').value=state.tech;
    document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===state.view)));
    $('library-shelves').hidden=state.view!=='shelf';$('library-list').hidden=state.view!=='list';
    // Keep the detail node alive when it was inserted between shelf rows.
    $('library-more').after($('book-detail'));
    if(!reportCollection)renderCollection(rows);else if(state.view==='shelf')renderShelves(rows);else renderList(rows);
    $('library-count').textContent=reportCollection?(state.view==='list'&&matchingRows.length>limit?t().shown(rows.length,matchingRows.length):t().reports(matchingRows.length)):state.collection==='learning'?(overview?t().overview(collections.books.length,matchingRows.length):state.view==='list'&&matchingRows.length>limit?t().shown(rows.length,matchingRows.length):t().items(matchingRows.length)):t().people(rows.length,rows.reduce((n,r)=>n+childItems(r).length,0));
    $('library-empty').hidden=matchingRows.length>0;$('library-more').hidden=state.view==='shelf'||rows.length>=matchingRows.length;
    $('library-reset').hidden=!state.q&&!state.topic&&(!reportCollection||!state.tech&&!state.path&&state.scope==='core');
    $('library-note-text').textContent=reportCollection?t().pilot:state.collection==='learning'?t().learningNote:t().researchersNote;
    renderDetail();
    if(state.view==='shelf')window.ReadingShelves.mount($('library-shelves'));
    document.title=`${language()==='zh'?'阅读':language()==='ja'?'読書':'Reading'} · Yecheng Zhang`;
  }
  host.addEventListener('click',event=>{
    const element=event.target.closest('[data-book],[data-read],[data-back],[data-view],[data-collection],[data-close],[data-related],[data-topic]');
    if(!element||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    event.preventDefault();
    if(element.hasAttribute('data-collection')){limit=30;navigate({collection:element.dataset.collection,topic:'',book:'',report:'',q:'',tech:'',path:'',scope:'core'});}
    else if(element.hasAttribute('data-topic')){limit=30;navigate({topic:element.dataset.topic,book:''});window.scrollTo({top:0,behavior:'instant'});}
    else if(element.hasAttribute('data-close')){const id=state.book;navigate({book:''});$(state.view==='shelf'?'library-shelves':'library-list').querySelector(`[data-book="${id}"]`)?.focus({preventScroll:true});}
    else if(element.hasAttribute('data-related')){limit=30;navigate({collection:'reports',book:element.dataset.related,report:'',q:title(byId.get(element.dataset.related)),topic:'',tech:'',path:'',scope:'all'});$('book-detail').scrollIntoView({block:'nearest'});$('detail-title')?.focus({preventScroll:true});}
    else if(element.hasAttribute('data-view'))navigate({view:element.dataset.view});
    else if(element.hasAttribute('data-back'))navigate({report:'',edition:'original'});
    else if(element.hasAttribute('data-read'))navigate({report:element.dataset.read,edition:element.dataset.edition||'original'});
    else{
      navigate({book:state.book===element.dataset.book?'':element.dataset.book});
      if(state.book){$('book-detail').scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});$('detail-title')?.focus({preventScroll:true});}
    }
  });
  $('library-search').addEventListener('input',e=>{limit=30;navigate({q:e.target.value,scope:e.target.value.trim()?'all':state.scope,book:'',path:''},true);});
  $('learning-topic').addEventListener('change',e=>{limit=30;navigate({topic:e.target.value,book:''});});
  $('library-scope').addEventListener('change',e=>{limit=30;navigate({scope:e.target.value,book:'',path:''});});
  $('library-tech').addEventListener('change',e=>{limit=30;navigate({tech:e.target.value,scope:e.target.value?'selected':state.scope,book:'',path:''});});
  $('library-reset').addEventListener('click',()=>{limit=30;navigate({q:'',tech:'',scope:'core',book:'',path:'',topic:''});});
  $('library-more').addEventListener('click',()=>{limit+=30;try{history.replaceState({limit},'',url());}catch{}render();});
  window.addEventListener('popstate',()=>{limit=Number.isInteger(history.state?.limit)?history.state.limit:30;state=readLocation();render();});
  window.addEventListener('resize',()=>{const button=$('library-shelves').querySelector('[aria-pressed="true"]');if(button&&!$('book-detail').hidden&&state.view==='shelf')placeShelfDetail(button,$('book-detail'));});
  new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  state=readLocation();render();
})();
