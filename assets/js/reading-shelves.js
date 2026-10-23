/* Vertical shelves: native touch/trackpad scrolling, arrows and keyboard. */
(() => {
  'use strict';
  const positions=new Map();
  let currentRoot;
  const motion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth';
  const tracks=root=>[...root.querySelectorAll('.shelf-track')];
  function remember(root){
    for(const track of tracks(root))if(track.getClientRects().length)positions.set(track.dataset.positionKey,track.scrollTop);
  }
  function sync(track){
    if(!track.clientHeight)return;
    const group=track.closest('.shelf-group'),max=track.scrollHeight-track.clientHeight;
    const prev=group.querySelector('[data-slide="prev"]'),next=group.querySelector('[data-slide="next"]');
    prev.hidden=next.hidden=max<=1;
    const books=[...track.querySelectorAll('.shelf-book')],bounds=track.getBoundingClientRect();
    prev.disabled=track.scrollTop<=1||books[0].getBoundingClientRect().top>=bounds.top;
    next.disabled=track.scrollTop>=max-1||books.at(-1).getBoundingClientRect().bottom<=bounds.bottom;
    group.querySelector('.shelf-stage').classList.toggle('has-next',max>1&&!next.disabled);
    const visible=books.map((book,i)=>({i,rect:book.getBoundingClientRect()})).filter(b=>b.rect.bottom>bounds.top+2&&b.rect.top<bounds.bottom-2);
    group.querySelector('.shelf-position').textContent=visible.length&&max>1?`${visible[0].i+1}–${visible.at(-1).i+1} / ${books.length}`:String(books.length);
  }
  function reveal(track,book){
    const bounds=track.getBoundingClientRect(),rect=book.getBoundingClientRect();
    const delta=rect.top<bounds.top+12?rect.top-bounds.top-12:rect.bottom>bounds.bottom-12?rect.bottom-bounds.bottom+12:0;
    if(delta)track.scrollBy({top:delta,behavior:'instant'});
  }
  function mount(root){
    currentRoot=root;
    for(const track of tracks(root)){
      const key=track.dataset.positionKey,books=[...track.querySelectorAll('.shelf-book')];
      const selected=books.find(b=>b.getAttribute('aria-pressed')==='true');
      books.forEach(book=>{book.tabIndex=book===(selected||books[0])?0:-1;});
      if(positions.has(key))track.scrollTop=positions.get(key);
      else if(selected)reveal(track,selected);
      let frame=0;
      track.addEventListener('scroll',()=>{
        if(!track.isConnected||!track.clientHeight)return;
        positions.set(key,track.scrollTop);
        if(!frame)frame=requestAnimationFrame(()=>{frame=0;if(track.isConnected)sync(track);});
      },{passive:true});
      track.addEventListener('focusin',event=>{
        const book=event.target.closest('.shelf-book');if(!book)return;
        books.forEach(b=>{b.tabIndex=b===book?0:-1;});reveal(track,book);
      });
      track.addEventListener('keydown',event=>{
        const book=event.target.closest('.shelf-book');if(!book||event.altKey||event.ctrlKey||event.metaKey)return;
        let index=books.indexOf(book);
        if(event.key==='ArrowDown')index++;
        else if(event.key==='ArrowUp')index--;
        else if(event.key==='Home')index=0;
        else if(event.key==='End')index=books.length-1;
        else return;
        event.preventDefault();const target=books[Math.max(0,Math.min(books.length-1,index))];
        target.focus({preventScroll:true});reveal(track,target);
      });
      for(const control of track.closest('.shelf-group').querySelectorAll('[data-slide]')){
        control.addEventListener('click',()=>track.scrollBy({top:(control.dataset.slide==='next'?1:-1)*Math.max(120,track.clientHeight*.8),behavior:motion()}));
      }
      sync(track);
    }
  }
  let resizeTimer;
  window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{
    if(currentRoot)for(const track of tracks(currentRoot)){
      const selected=track.querySelector('.shelf-book[aria-pressed="true"]');
      if(selected&&track.clientHeight)reveal(track,selected);
      sync(track);
    }
  },100);});
  window.ReadingShelves={remember,mount};
})();
