(() => {
  'use strict';
  const vendor=new URL('../vendor/pdfjs/',document.currentScript.src);
  const messages={
    en:{fullscreen:'Full screen',previous:'Previous page',next:'Next page',page:'Page',zoom:'Zoom',fit:'Fit width',pageLoading:'Loading this page…',loading:'Preparing page navigation…',error:'The preview could not load. Open the PDF directly using the link above.',file:'Use the online preview for the embedded reader, or open the PDF directly.'},
    zh:{fullscreen:'全屏阅读',previous:'上一页',next:'下一页',page:'页码',zoom:'缩放',fit:'适合宽度',pageLoading:'正在加载本页…',loading:'正在准备翻页…',error:'预览暂时无法载入，请用上方链接直接打开 PDF。',file:'在线试阅支持页面内阅读；本地文件可用上方链接直接打开 PDF。'},
    ja:{fullscreen:'全画面',previous:'前のページ',next:'次のページ',page:'ページ',zoom:'拡大率',fit:'幅に合わせる',pageLoading:'ページを読み込み中…',loading:'ページ移動を準備中…',error:'プレビューを読み込めません。上のリンクから PDF を直接開いてください。',file:'埋め込み表示はオンライン試作版をご利用ください。ローカル PDF は上のリンクから開けます。'}
  };
  const moduleUrl=new URL('build/pdf.mjs?v=6.4.299',vendor).href;
  let prepared;
  function prepare(){
    if(location.protocol==='file:')return Promise.resolve(null);
    return prepared||(prepared=import(moduleUrl).then(async lib=>{
      lib.GlobalWorkerOptions.workerSrc=new URL('build/pdf.worker.mjs?v=6.4.299',vendor).href;
      const worker=new lib.PDFWorker();await worker.promise;return {lib,worker};
    }).catch(error=>{prepared=null;throw error;}));
  }
  window.ReadingPDF={prepare,mount(element,url,initialPage,onPage,preview){
    const text=()=>messages[document.documentElement.lang]||messages.en;
    let disposed=false,documentTask,pdf,renderTask,layer,epoch=0,currentPage=initialPage||1,scaleMode='fit',timer,prefetchTimer,prefetching=false;
    const holder=document.createElement('div');holder.className='pdf-viewer';
    holder.innerHTML='<div class="pdf-controls"><button type="button" data-pdf="previous">←</button><label><span class="visually-hidden" data-pdf="page-label"></span><input data-pdf="page" type="number" min="1" value="1"></label><span data-pdf="total">/ …</span><button type="button" data-pdf="next">→</button><select data-pdf="zoom"><option value="fit"></option><option value="1.25">125%</option><option value="1.5">150%</option></select><button type="button" data-pdf="fullscreen">⛶</button></div><p class="pdf-message" role="status"></p><div class="pdf-scroll"><div class="pdf-sheet"><canvas></canvas><div class="textLayer"></div></div></div>';
    element.append(holder);
    const control=name=>holder.querySelector(`[data-pdf="${name}"]`);
    const message=holder.querySelector('.pdf-message'),sheet=holder.querySelector('.pdf-sheet'),canvas=holder.querySelector('canvas'),scroll=holder.querySelector('.pdf-scroll');
    let previewImage;
    if(preview&&currentPage===1){
      previewImage=document.createElement('img');previewImage.className='pdf-first-preview';previewImage.src=preview.url;previewImage.width=preview.width;previewImage.height=preview.height;previewImage.alt='';previewImage.fetchPriority='high';scroll.prepend(previewImage);sheet.hidden=true;
      previewImage.onload=()=>{if(!disposed&&sheet.hidden)element.dataset.previewReady='true';};
      previewImage.onerror=()=>{previewImage.remove();sheet.hidden=false;};
    }
    let status=location.protocol==='file:'?'file':'loading';
    function localize(){
      control('previous').ariaLabel=text().previous;control('next').ariaLabel=text().next;
      control('previous').title=text().previous;control('next').title=text().next;
      control('page-label').textContent=text().page;control('zoom').ariaLabel=text().zoom;
      control('fullscreen').ariaLabel=text().fullscreen;control('fullscreen').title=text().fullscreen;
      control('zoom').options[0].textContent=text().fit;message.textContent=text()[status]||'';message.hidden=!status;
    }
    localize();
    element.dataset.loading='true';
    for(const name of ['previous','next','page','zoom'])control(name).disabled=true;
    const observer=new MutationObserver(localize);observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
    async function draw(number){
      if(disposed||!pdf)return;
      const turn=++epoch;
      currentPage=Math.min(pdf.numPages,Math.max(1,Math.trunc(Number(number)||1)));
      control('page').disabled=false;control('zoom').disabled=false;
      control('page').value=currentPage;control('total').textContent='/ '+pdf.numPages;
      control('page').max=pdf.numPages;control('previous').disabled=currentPage===1;control('next').disabled=currentPage===pdf.numPages;
      if(renderTask){renderTask.cancel();await renderTask.promise.catch(()=>{});}
      if(disposed||turn!==epoch)return;
      layer?.cancel();
      const page=await pdf.getPage(currentPage);if(disposed||turn!==epoch)return;
      const original=page.getViewport({scale:1});
      const available=Math.max(240,scroll.clientWidth-32);
      const scale=scaleMode==='fit'?available/original.width:Number(scaleMode);
      const viewport=page.getViewport({scale});const dpr=Math.min(devicePixelRatio||1,2);
      canvas.width=Math.ceil(viewport.width*dpr);canvas.height=Math.ceil(viewport.height*dpr);
      canvas.style.width=viewport.width+'px';canvas.style.height=viewport.height+'px';
      sheet.style.width=viewport.width+'px';sheet.style.height=viewport.height+'px';
      sheet.style.setProperty('--scale-factor',String(scale));sheet.style.setProperty('--total-scale-factor',String(scale));
      renderTask=page.render({canvasContext:canvas.getContext('2d'),viewport,transform:dpr===1?null:[dpr,0,0,dpr,0,0]});
      try{await renderTask.promise;}catch(e){if(e.name==='RenderingCancelledException')return;throw e;}
      if(disposed||turn!==epoch)return;
      const {lib}=await prepare();
      sheet.hidden=false;previewImage?.remove();
      const textContainer=holder.querySelector('.textLayer');textContainer.replaceChildren();
      layer=new lib.TextLayer({textContentSource:page.streamTextContent(),container:textContainer,viewport});
      await layer.render();
      if(disposed||turn!==epoch)return;
      status='';localize();element.dataset.loading='false';element.dataset.renderedPage=String(currentPage);onPage(currentPage);
      scheduleNextPage();
    }
    // Prepare only the adjacent page's drawing instructions, never the entire document.
    function scheduleNextPage(){
      clearTimeout(prefetchTimer);
      if(disposed||!pdf||prefetching||currentPage>=pdf.numPages)return;
      const target=currentPage+1;
      prefetchTimer=setTimeout(async()=>{
        if(disposed||currentPage+1!==target)return;
        prefetching=true;
        try{const page=await pdf.getPage(target);if(!disposed&&currentPage+1===target)await page.getOperatorList();}
        catch{}finally{prefetching=false;if(!disposed&&currentPage+1!==target)scheduleNextPage();}
      },150);
    }
    function requestDraw(n){
      if(!pdf||disposed)return;
      clearTimeout(prefetchTimer);status='pageLoading';localize();element.dataset.loading='true';
      scroll.scrollTop=0;
      draw(n).catch(e=>{if(!disposed){status='error';localize();console.warn('PDF preview:',e.message);}});
    }
    control('previous').onclick=()=>requestDraw(currentPage-1);control('next').onclick=()=>requestDraw(currentPage+1);
    control('page').onchange=e=>requestDraw(e.target.value);
    control('fullscreen').onclick=async()=>{try{if(document.fullscreenElement===holder)await document.exitFullscreen();else await holder.requestFullscreen();}catch{}resize();};
    control('zoom').onchange=e=>{scaleMode=e.target.value;requestDraw(currentPage);};
    function resize(){clearTimeout(timer);timer=setTimeout(()=>{if(scaleMode==='fit')requestDraw(currentPage);},180);}
    window.addEventListener('resize',resize);
    (async()=>{
      if(location.protocol==='file:'){holder.querySelector('.pdf-controls').hidden=true;scroll.hidden=true;return;}
      const {lib,worker}=await prepare();if(disposed)return;
      // Keep the download stream moving while range requests fetch the index/tail.
      // Disabling streaming fragmented translated PDFs into dozens of sequential RTTs.
      documentTask=lib.getDocument({worker,url:new URL(url,location.href).href,disableAutoFetch:true,disableStream:false,cMapUrl:new URL('cmaps/',vendor).href,cMapPacked:true,standardFontDataUrl:new URL('standard_fonts/',vendor).href,wasmUrl:new URL('wasm/',vendor).href});
      pdf=await documentTask.promise;if(disposed)return;
      await draw(currentPage);
    })().catch(e=>{if(!disposed){status='error';localize();console.warn('PDF load:',e.message);}});
    return ()=>{disposed=true;++epoch;clearTimeout(timer);clearTimeout(prefetchTimer);observer.disconnect();window.removeEventListener('resize',resize);renderTask?.cancel();layer?.cancel();documentTask?.destroy().catch(()=>{});};
  }};
  if(new URLSearchParams(location.search).has('report'))prepare().catch(()=>{});
})();
