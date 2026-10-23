(() => {
  'use strict';
  const vendor=new URL('../vendor/pdfjs/',document.currentScript.src);
  const messages={
    en:{fullscreen:'Full screen',previous:'Previous page',next:'Next page',page:'Page',zoom:'Zoom',fit:'Fit width',loading:'Loading document…',pageLoading:'Loading…',error:'This page could not load. Open the PDF using the link above.',retry:'Retry',file:'Open the online reader or the PDF directly.'},
    zh:{fullscreen:'全屏阅读',previous:'上一页',next:'下一页',page:'页码',zoom:'缩放',fit:'适合宽度',loading:'正在加载文档…',pageLoading:'加载中…',error:'本页加载失败，可用上方链接打开 PDF。',retry:'重试',file:'请使用在线阅读页，或直接打开 PDF。'},
    ja:{fullscreen:'全画面',previous:'前のページ',next:'次のページ',page:'ページ',zoom:'拡大率',fit:'幅に合わせる',loading:'文書を読み込み中…',pageLoading:'読み込み中…',error:'ページを読み込めません。上のリンクから PDF を開けます。',retry:'再試行',file:'オンライン表示、または PDF を直接開いてください。'}
  };
  let prepared;
  function prepare(){
    if(location.protocol==='file:')return Promise.resolve(null);
    return prepared||(prepared=import(new URL('build/pdf.mjs?v=6.4.299',vendor).href).then(async lib=>{
      lib.GlobalWorkerOptions.workerSrc=new URL('build/pdf.worker.mjs?v=6.4.299',vendor).href;
      const worker=new lib.PDFWorker();await worker.promise;return {lib,worker};
    }).catch(error=>{prepared=null;throw error;}));
  }
  window.ReadingPDF={prepare,mount(element,url,initialPage,onPage,preview,pageCountHint){
    const text=()=>messages[document.documentElement.lang]||messages.en;
    let disposed=false,documentTask,pdf,lib,count=Math.max(1,pageCountHint||1),currentPage=Math.min(count,Math.max(1,initialPage||1));
    let scaleMode='fit',status='loading',timer,scrollFrame,pumping=false,layoutEpoch=0,wanted=[],initializing=true;
    const records=[];
    const holder=document.createElement('div');holder.className='pdf-viewer pdf-continuous';
    holder.innerHTML='<div class="pdf-controls"><button type="button" data-pdf="previous">←</button><label><span class="visually-hidden" data-pdf="page-label"></span><input data-pdf="page" type="number" min="1" value="1"></label><span data-pdf="total">/ …</span><button type="button" data-pdf="next">→</button><select data-pdf="zoom"><option value="fit"></option><option value="1.25">125%</option><option value="1.5">150%</option></select><button type="button" data-pdf="fullscreen">⛶</button></div><p class="pdf-message" role="status"></p><div class="pdf-scroll" tabindex="0"><div class="pdf-pages"></div></div>';
    element.append(holder);
    const control=name=>holder.querySelector(`[data-pdf="${name}"]`),message=holder.querySelector('.pdf-message'),scroll=holder.querySelector('.pdf-scroll'),pages=holder.querySelector('.pdf-pages');
    const clamp=n=>Math.min(count,Math.max(1,Math.trunc(Number(n)||1)));
    function updateControls(){
      control('page').value=currentPage;control('page').max=count;
      control('total').textContent='/ '+(pdf||pageCountHint?count:'…');
      control('previous').disabled=currentPage===1;control('next').disabled=currentPage===count;
      element.dataset.currentPage=String(currentPage);
    }
    function localize(){
      for(const name of ['previous','next','fullscreen']){control(name).ariaLabel=text()[name];control(name).title=text()[name];}
      control('page-label').textContent=text().page;control('zoom').ariaLabel=text().zoom;control('zoom').options[0].textContent=text().fit;
      scroll.ariaLabel=text().page;message.textContent=text()[status]||'';message.hidden=!status;
      for(const r of records){r.sheet.ariaLabel=`${text().page} ${r.number}`;r.label.textContent=`${r.number} · ${text().pageLoading}`;r.retry.textContent=text().retry;}
    }
    function dimensions(r){
      const available=Math.max(200,scroll.clientWidth-(innerWidth<=600?16:32));
      const scale=scaleMode==='fit'?available/r.width:Number(scaleMode);
      return {scale,width:r.width*scale,height:r.height*scale};
    }
    function size(r){const d=dimensions(r);r.sheet.style.width=d.width+'px';r.sheet.style.height=d.height+'px';}
    function top(r){return pages.offsetTop+r.sheet.offsetTop;}
    function ensurePages(){
      while(records.length<count){
        const number=records.length+1,sheet=document.createElement('section');sheet.className='pdf-sheet';sheet.dataset.pdfPage=number;
        sheet.innerHTML='<span class="pdf-page-placeholder"></span><button type="button" class="pdf-page-retry" hidden></button>';
        const r={number,sheet,label:sheet.firstElementChild,retry:sheet.lastElementChild,width:612,height:preview?612*preview.height/preview.width:792,state:'idle',generation:0};
        r.retry.onclick=()=>{r.state='idle';r.retry.hidden=true;refresh();};
        records.push(r);pages.append(sheet);size(r);
        if(number===1&&preview){
          const img=document.createElement('img');img.className='pdf-first-preview';img.alt='';img.width=preview.width;img.height=preview.height;img.fetchPriority='high';
          img.onload=()=>{if(!disposed){element.dataset.previewReady='true';r.label.hidden=true;}};
          img.onerror=()=>{img.remove();r.preview=null;};img.src=preview.url;r.preview=img;sheet.append(img);
        }
      }
      while(records.length>count){const r=records.pop();release(r);r.sheet.remove();}
      localize();updateControls();
    }
    function release(r){
      ++r.generation;r.task?.cancel();r.layer?.cancel();
      if(r.canvas){r.canvas.width=0;r.canvas.height=0;r.canvas.remove();r.canvas=null;}
      r.text?.remove();r.text=null;r.layer=null;r.task=null;r.state='idle';delete r.sheet.dataset.rendered;
      r.label.hidden=!!r.preview;
    }
    function locate(y){
      let low=0,high=records.length-1;
      while(low<high){const mid=Math.ceil((low+high)/2);if(top(records[mid])<=y)low=mid;else high=mid-1;}
      return low+1;
    }
    function setCurrent(number){
      number=clamp(number);if(currentPage!==number){currentPage=number;updateControls();onPage(number);}
    }
    function refresh(){
      if(disposed||initializing)return;
      const first=locate(scroll.scrollTop+1),last=locate(scroll.scrollTop+scroll.clientHeight-1);
      setCurrent(scroll.scrollTop>0&&scroll.scrollTop+scroll.clientHeight>=scroll.scrollHeight-2?count:locate(scroll.scrollTop+Math.min(100,scroll.clientHeight*.2)));
      wanted=[currentPage,...Array.from({length:last-first+1},(_,i)=>first+i),last+1,last+2,first-1].filter((n,i,a)=>n>0&&n<=count&&a.indexOf(n)===i);
      for(const r of records)if(!wanted.includes(r.number)&&(r.canvas||r.state==='rendering'))release(r);
      element.dataset.loading=String(!pdf||records[currentPage-1].state!=='done');
      if(records[currentPage-1].state==='done')element.dataset.renderedPage=String(currentPage);
      pump();
    }
    async function render(r){
      const generation=++r.generation,epoch=layoutEpoch;r.state='rendering';r.retry.hidden=true;
      const valid=()=>!disposed&&r.generation===generation&&layoutEpoch===epoch&&wanted.includes(r.number);
      try{
        const page=await pdf.getPage(r.number);if(!valid())return;
        const natural=page.getViewport({scale:1}),oldHeight=r.sheet.offsetHeight;
        r.width=natural.width;r.height=natural.height;size(r);
        if(r.number<currentPage)scroll.scrollTop+=r.sheet.offsetHeight-oldHeight;
        const d=dimensions(r),viewport=page.getViewport({scale:d.scale});
        const dpr=Math.min(devicePixelRatio||1,2,Math.sqrt(4000000/(viewport.width*viewport.height)));
        const canvas=document.createElement('canvas');r.canvas=canvas;canvas.width=Math.ceil(viewport.width*dpr);canvas.height=Math.ceil(viewport.height*dpr);
        canvas.style.width=viewport.width+'px';canvas.style.height=viewport.height+'px';canvas.style.visibility='hidden';r.sheet.append(canvas);
        r.sheet.style.setProperty('--scale-factor',String(d.scale));r.sheet.style.setProperty('--total-scale-factor',String(d.scale));
        r.task=page.render({canvasContext:canvas.getContext('2d'),viewport,transform:dpr===1?null:[dpr,0,0,dpr,0,0]});
        await r.task.promise;if(!valid())return;
        canvas.style.visibility='';r.preview?.remove();r.preview=null;r.label.hidden=true;
        const layer=document.createElement('div');layer.className='textLayer';r.text=layer;r.sheet.append(layer);
        r.layer=new lib.TextLayer({textContentSource:page.streamTextContent(),container:layer,viewport});await r.layer.render();if(!valid())return;
        r.state='done';r.sheet.dataset.rendered='true';
        if(r.number===currentPage){element.dataset.renderedPage=String(currentPage);element.dataset.loading='false';}
      }catch(error){
        if(valid()&&!['RenderingCancelledException','AbortException'].includes(error.name)){r.state='error';r.label.textContent=text().error;r.label.hidden=false;r.retry.hidden=false;}
      }finally{if(r.generation===generation&&r.state==='rendering')r.state='idle';}
    }
    async function pump(){
      if(pumping||!pdf||disposed)return;pumping=true;
      try{let n;while(!disposed&&(n=wanted.find(n=>records[n-1]?.state==='idle')))await render(records[n-1]);}
      finally{pumping=false;}
    }
    function jump(n){
      setCurrent(clamp(n));scroll.scrollTop=top(records[currentPage-1]);refresh();
    }
    function resize(){
      clearTimeout(timer);timer=setTimeout(()=>{
        if(disposed)return;
        const r=records[currentPage-1],fraction=Math.max(0,(scroll.scrollTop-top(r))/r.sheet.offsetHeight);
        ++layoutEpoch;for(const item of records){release(item);size(item);}
        scroll.scrollTop=top(r)+fraction*r.sheet.offsetHeight;refresh();
      },160);
    }
    control('previous').onclick=()=>jump(currentPage-1);control('next').onclick=()=>jump(currentPage+1);
    control('page').onchange=e=>jump(e.target.value);control('zoom').onchange=e=>{scaleMode=e.target.value;resize();};
    control('fullscreen').onclick=async()=>{try{if(document.fullscreenElement===holder)await document.exitFullscreen();else await holder.requestFullscreen();}catch{}resize();};
    scroll.addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(()=>{scrollFrame=null;refresh();});},{passive:true});
    const observer=new MutationObserver(localize);observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
    window.addEventListener('resize',resize);ensurePages();scroll.scrollTop=top(records[currentPage-1]);initializing=false;refresh();
    (async()=>{
      if(location.protocol==='file:'){status='file';localize();return;}
      const prepared=await prepare();lib=prepared.lib;if(disposed)return;
      documentTask=lib.getDocument({worker:prepared.worker,url:new URL(url,location.href).href,disableAutoFetch:true,disableStream:false,cMapUrl:new URL('cmaps/',vendor).href,cMapPacked:true,standardFontDataUrl:new URL('standard_fonts/',vendor).href,wasmUrl:new URL('wasm/',vendor).href});
      pdf=await documentTask.promise;if(disposed)return;
      count=pdf.numPages;currentPage=clamp(currentPage);ensurePages();status='';localize();refresh();
    })().catch(()=>{if(!disposed){status='error';localize();}});
    return ()=>{disposed=true;++layoutEpoch;clearTimeout(timer);cancelAnimationFrame(scrollFrame);observer.disconnect();window.removeEventListener('resize',resize);for(const r of records)release(r);documentTask?.destroy().catch(()=>{});};
  }};
  if(new URLSearchParams(location.search).has('report'))prepare().catch(()=>{});
})();
