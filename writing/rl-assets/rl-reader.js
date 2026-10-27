(() => {
 'use strict';
 const root=document.documentElement;
 // Reuse the site's style picker while keeping this reader's inline contents.
 const groups=[...document.querySelectorAll('.report-site-nav > .writing-preferences')];
 if(groups.length>1){for(const group of groups.slice(1)){groups[0].append(...group.childNodes);group.remove();}}
 const syncFallbacks=()=>document.querySelectorAll('iframe.static-diagram').forEach(frame=>{
  try{const doc=frame.contentDocument;if(!doc)return;
   doc.documentElement.dataset.theme=root.dataset.theme||'light';
   doc.documentElement.dataset.diagramStyle=window.WritingDiagramStyle?.current()||'openai-blog';
  }catch{}
 });
 document.querySelectorAll('iframe.static-diagram').forEach(frame=>frame.addEventListener('load',syncFallbacks));
 window.addEventListener('writing-diagram-style-change',syncFallbacks);
 new MutationObserver(syncFallbacks).observe(root,{attributes:true,attributeFilter:['data-theme']});
 const isVisible=e=>!!e.getClientRects().length;
 const current=()=>document.querySelector(`.lang-article[lang="${root.lang}"]`);
 function hashTarget(){
  const id=decodeURIComponent(location.hash.slice(1));if(!id)return;
  const local=root.lang+'-'+id.replace(/^(en|zh|ja)-/,'');
  const target=document.getElementById(local)||document.getElementById(id);
  if(target&&isVisible(target)){target.closest('details')?.setAttribute('open','');requestAnimationFrame(()=>target.scrollIntoView());}
 }
 document.querySelectorAll('.mobile-contents nav a').forEach(a=>a.addEventListener('click',()=>a.closest('details').open=false));
 let lastLang=root.lang;
 new MutationObserver(()=>{if(lastLang!==root.lang){lastLang=root.lang;hashTarget();}}).observe(root,{attributes:true,attributeFilter:['lang']});
 window.addEventListener('hashchange',hashTarget);window.addEventListener('load',hashTarget,{once:true});
 let queued=false;
 window.addEventListener('scroll',()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{
  queued=false;const headings=[...(current()?.querySelectorAll('section>h2')||[])];
  const active=[...headings].reverse().find(h=>h.getBoundingClientRect().top<180)||headings[0];
  document.querySelectorAll('.article-toc a').forEach(a=>{if(active&&a.hash==='#'+active.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
 });},{passive:true});
 for(const box of document.querySelectorAll('.clock-example')){
  const lang=box.closest('[lang]').lang;
  const get=id=>box.querySelector('[id="'+lang+'-'+id+'"]');
  const input=get('observation-length'),unit=get('unit-clock');
  if(!input||!unit)continue;
  function update(){const count=+input.value,q=unit.checked?1:.72;get('observation-count').value=count;
   for(const [key,power] of [['full',count+3],['skip',3],['turn',1]]){const v=q**power;get('clock-'+key).value=v<.0001&&v>0?v.toExponential(2):v.toFixed(4);get('clock-'+key+'-power').textContent=q+'^'+power;get('clock-'+key+'-bar').style.width=100*v+'%';}
   get('clock-reading').textContent=lang==='zh'?`混合链跨 ${count+3} 条边；只跳过观察跨 3 条边；TB-GAE 只跨 1 个回合边界。`:lang==='ja'?`混合列は${count+3}本、観測を飛ばす列は3本の辺を通る。TB-GAEはターン境界を1回だけ越える。`:`The mixed sequence crosses ${count+3} edges; skipping observations leaves 3. TB-GAE crosses one turn boundary.`;
  }
  input.addEventListener('input',update);unit.addEventListener('change',update);update();
 }
})();
