/* PhotoBridge v754 — recover canonical mobile print/album hierarchy without list-level proxy controls. */
(()=>{
  'use strict';
  const mq=matchMedia('(max-width:820px)');
  let raf=0, quoteTimer=0;
  const text=n=>(n?.textContent||'').replace(/\s+/g,' ').trim();
  const workspace=()=>document.querySelector('.photographerMain.photographerPrintWorkspace');
  const albumCreate=()=>location.pathname.startsWith('/photographer/album/new') || !!document.querySelector('.photographerMain.photographerAlbumCreateWorkspaceMode .albumOrderWorkspace');

  function cleanupV753(w){
    document.getElementById('pb753-mobile-order-actions')?.remove();
    document.querySelectorAll('.pb753AlbumStageRail').forEach(n=>n.remove());
    w?.querySelectorAll('.pb753LegacyHidden').forEach(n=>n.classList.remove('pb753LegacyHidden'));
    w?.querySelectorAll('.pb753LegacyAlbumActionHidden').forEach(n=>n.classList.remove('pb753LegacyAlbumActionHidden'));
  }

  function albumFileButton(){
    return document.querySelector('.photographerAlbumCreateWorkspaceMode .albumOrderWorkspace button.albumFileActionFile');
  }
  function albumQuote(){
    return document.querySelector('.photographerAlbumCreateWorkspaceMode .albumOrderWorkspace .albumQuoteCard');
  }
  function albumHasFiles(){
    return !!document.querySelector('.photographerAlbumCreateWorkspaceMode .albumOrderWorkspace .albumFileToolbar.hasFiles, .photographerAlbumCreateWorkspaceMode .albumOrderWorkspace .albumFileQcGrid .albumFileCard');
  }

  function ensureAlbumCreateActions(w){
    let bar=document.getElementById('pb754-album-create-actions');
    if(!mq.matches || !albumCreate()){
      bar?.remove();
      w?.style.removeProperty('--pb754-album-actions-top');
      w?.style.removeProperty('--pb754-album-content-top');
      w?.style.removeProperty('--pb754-album-bottom');
      return null;
    }
    if(!bar){
      bar=document.createElement('div');
      bar.id='pb754-album-create-actions';
      bar.setAttribute('aria-label','اقدام‌های سفارش آلبوم');
      bar.innerHTML='<button type="button" class="pb754AlbumAdd">انتخاب فایل آلبوم</button><button type="button" class="pb754AlbumQuote">ارسال آلبوم برای چاپ</button>';
      document.body.append(bar);
      bar.querySelector('.pb754AlbumAdd').addEventListener('click',()=>{
        const b=albumFileButton();
        if(b && !b.disabled) b.click();
      });
      bar.querySelector('.pb754AlbumQuote').addEventListener('click',()=>{
        const q=albumQuote();
        if(!q)return;
        q.classList.add('pb754QuoteFocus');
        q.setAttribute('tabindex','-1');
        q.scrollIntoView({behavior:'smooth',block:'start',inline:'nearest'});
        try{q.focus({preventScroll:true})}catch{}
        clearTimeout(quoteTimer);
        quoteTimer=setTimeout(()=>q.classList.remove('pb754QuoteFocus'),1800);
      });
    }
    const add=bar.querySelector('.pb754AlbumAdd');
    const quote=bar.querySelector('.pb754AlbumQuote');
    const realAdd=albumFileButton(), realQuote=albumQuote();
    add.textContent=albumHasFiles()?'افزودن فایل به آلبوم':'انتخاب فایل آلبوم';
    add.disabled=!realAdd || !!realAdd.disabled;
    quote.disabled=!realQuote;
    return bar;
  }

  function measureAlbumCreate(w,bar){
    if(!bar || !w)return;
    const nav=w.querySelector('.photographerPrintModeHeader .photographerPrintModeNav');
    const header=w.querySelector('.unifiedRoleHeader.photographerHeaderRefined');
    const lab=w.querySelector('.photographerPrintTopLab');
    const candidates=[nav,lab,header].map(n=>n?.getBoundingClientRect().bottom||0).filter(v=>v>0&&v<innerHeight*.9);
    const top=Math.ceil(Math.max(0,...candidates)+6);
    const h=56;
    const bottomNav=w.querySelector('.photographerBottomAppNav');
    const navTop=bottomNav?.getBoundingClientRect().top;
    const bottom=navTop>0&&navTop<innerHeight&&navTop-(top+h)>120?Math.ceil(innerHeight-navTop):0;
    w.style.setProperty('--pb754-album-actions-top',`${top}px`);
    w.style.setProperty('--pb754-album-content-top',`${top+h}px`);
    w.style.setProperty('--pb754-album-bottom',`${bottom}px`);
  }

  const stageLabels=['دانلود / چاپ','صحافی','آماده تحویل','تحویل‌شده'];
  function currentStageIndex(card){
    const badge=text(card.querySelector('.albumStageBadge'));
    if(badge.includes('تحویل‌شده')||badge.includes('تحویل شد'))return 3;
    if(badge.includes('آماده تحویل'))return 2;
    if(badge.includes('صحافی'))return 1;
    return 0;
  }
  function syncAlbumStages(){
    if(!mq.matches || albumCreate())return;
    document.querySelectorAll('.albumCustomerOrderCard').forEach(card=>{
      const idx=currentStageIndex(card);
      let rail=card.querySelector(':scope .pb754AlbumStageRail');
      if(!rail){
        rail=document.createElement('div');
        rail.className='pb754AlbumStageRail';
        rail.setAttribute('aria-label','مراحل سفارش آلبوم');
        const head=card.querySelector('.customerOrderHead');
        (head||card).insertAdjacentElement(head?'afterend':'afterbegin',rail);
      }
      rail.innerHTML=stageLabels.map((label,i)=>`<span class="${i<idx?'done ':''}${i===idx?'current':''}"><i>${i<idx?'✓':i+1}</i><b>${label}</b></span>`).join('');
    });
  }

  function run(){
    raf=0;
    const w=workspace();
    if(!w)return;
    cleanupV753(w);
    if(!mq.matches){document.getElementById('pb754-album-create-actions')?.remove();return;}
    const bar=ensureAlbumCreateActions(w);
    measureAlbumCreate(w,bar);
    syncAlbumStages();
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(run)}
  function start(){
    const root=document.getElementById('root');
    if(root)new MutationObserver(schedule).observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','disabled','aria-expanded']});
    document.addEventListener('click',()=>setTimeout(schedule,0),true);
    window.addEventListener('popstate',schedule);
    window.addEventListener('resize',schedule,{passive:true});
    window.visualViewport?.addEventListener('resize',schedule,{passive:true});
    mq.addEventListener?.('change',schedule);
    schedule();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
