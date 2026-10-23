(() => {
  'use strict';
  const vendor=new URL('../vendor/pdfjs/',document.currentScript.src);
  const messages={
    en:{previous:'Previous page',next:'Next page',page:'Page',zoom:'Zoom',fit:'Fit width',loading:'Loading the document…',error:'The preview could not load. Open the PDF directly using the link above.',file:'Use the online preview for the embedded reader, or open the PDF directly.'},
    zh:{previous:'上一页',next:'下一页',page:'页码',zoom:'缩放',fit:'适合宽度',loading:'正在载入文档…',error:'预览暂时无法载入，请用上方链接直接打开 PDF。',file:'在线试阅支持页面内阅读；本地文件可用上方链接直接打开 PDF。'},
    ja:{previous:'前のページ',next:'次のページ',page:'ページ',zoom:'拡大率',fit:'幅に合わせる',loading:'読み込み中…',error:'プレビューを読み込めません。上のリンクから PDF を直接開いてください。',file:'埋め込み表示はオンライン試作版をご利用ください。ローカル PDF は上のリンクから開けます。'}
  };
  window.ReadingPDF={mount(element,url,initialPage,onPage){
    const text=()=>messages[document.documentElement.lang]||messages.en;
    let disposed=false,documentTask,pdf,renderTask,layer,epoch=0,currentPage=initialPage||1,scaleMode='fit',timer;
    const holder=document.createElement('div');holder.className='pdf-viewer';
    holder.innerHTML='<div class="pdf-controls"><button type="button" data-pdf="previous">←</button><label><span class="visually-hidden" data-pdf="page-label"></span><input data-pdf="page" type="number" min="1" value="1"></label><span data-pdf="total">/ …</span><button type="button" data-pdf="next">→</button><select data-pdf="zoom"><option value="fit"></option><option value="1.25">125%</option><option value="1.5">150%</option></select></div><p class="pdf-message" role="status"></p><div class="pdf-scroll"><div class="pdf-sheet"><canvas></canvas><div class="textLayer"></div></div></div>';
    element.append(holder);
    const control=name=>holder.querySelector(`[data-pdf="${name}"]`);
    const message=holder.querySelector('.pdf-message'),sheet=holder.querySelector('.pdf-sheet'),canvas=holder.querySelector('canvas'),scroll=holder.querySelector('.pdf-scroll');
    let status=location.protocol==='file:'?'file':'loading';
    function localize(){
      control('previous').ariaLabel=text().previous;control('next').ariaLabel=text().next;
      control('page-label').textContent=text().page;control('zoom').ariaLabel=text().zoom;
      control('zoom').options[0].textContent=text().fit;message.textContent=text()[status]||'';message.hidden=!status;
    }
    localize();
    const observer=new MutationObserver(localize);observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
    async function draw(number){
      if(disposed||!pdf)return;
      const turn=++epoch;
      currentPage=Math.min(pdf.numPages,Math.max(1,Math.trunc(Number(number)||1)));
      control('page').value=currentPage;control('total').textContent='/ '+pdf.numPages;
      control('page').max=pdf.numPages;control('previous').disabled=currentPage===1;control('next').disabled=currentPage===pdf.numPages;
      if(renderTask){renderTask.cancel();await renderTask.promise.catch(()=>{});}
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
      const lib=await import(new URL('build/pdf.mjs',vendor).href);
      const textContainer=holder.querySelector('.textLayer');textContainer.replaceChildren();
      layer=new lib.TextLayer({textContentSource:page.streamTextContent(),container:textContainer,viewport});
      await layer.render();
      if(disposed||turn!==epoch)return;
      status='';localize();element.dataset.renderedPage=String(currentPage);onPage(currentPage);
    }
    function requestDraw(n){draw(n).catch(e=>{if(!disposed){status='error';localize();console.warn('PDF preview:',e.message);}});}
    control('previous').onclick=()=>requestDraw(currentPage-1);control('next').onclick=()=>requestDraw(currentPage+1);
    control('page').onchange=e=>requestDraw(e.target.value);
    control('zoom').onchange=e=>{scaleMode=e.target.value;requestDraw(currentPage);};
    function resize(){clearTimeout(timer);timer=setTimeout(()=>{if(scaleMode==='fit')requestDraw(currentPage);},180);}
    window.addEventListener('resize',resize);
    (async()=>{
      if(location.protocol==='file:'){holder.querySelector('.pdf-controls').hidden=true;scroll.hidden=true;return;}
      const lib=await import(new URL('build/pdf.mjs',vendor).href);if(disposed)return;
      lib.GlobalWorkerOptions.workerSrc=new URL('build/pdf.worker.mjs',vendor).href;
      // Fetch only the required PDF ranges. PDF.js falls back to a full download when the host does not support ranges.
      documentTask=lib.getDocument({url:new URL(url,location.href).href,disableAutoFetch:true,disableStream:true,cMapUrl:new URL('cmaps/',vendor).href,cMapPacked:true,standardFontDataUrl:new URL('standard_fonts/',vendor).href,wasmUrl:new URL('wasm/',vendor).href});
      pdf=await documentTask.promise;if(disposed)return;
      await draw(currentPage);
    })().catch(e=>{if(!disposed){status='error';localize();console.warn('PDF load:',e.message);}});
    return ()=>{disposed=true;++epoch;clearTimeout(timer);observer.disconnect();window.removeEventListener('resize',resize);renderTask?.cancel();layer?.cancel();documentTask?.destroy().catch(()=>{});};
  }};
})();
