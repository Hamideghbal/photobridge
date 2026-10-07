/* PhotoBridge v755 — one canonical four-button mobile Print/Album box + restored status row. */
(()=>{
  'use strict';
  const mq=matchMedia('(max-width:820px)');
  let raf=0;
  const txt=n=>(n?.textContent||'').replace(/\s+/g,' ').trim();
  const workspace=()=>document.querySelector('.photographerMain.photographerPrintWorkspace');

  function albumMode(w){
    const activeAlbum=w?.querySelector('.photographerPrintModeNav>.photographerPrintAlbumTab.active');
    const activePhoto=w?.querySelector('.photographerPrintModeNav>.photographerPrintPhotoTab.active');
    if(activeAlbum)return true;
    if(activePhoto)return false;
    return !!w?.classList.contains('photographerAlbumWorkspaceMode');
  }
  function albumCreate(w){return !!w?.classList.contains('photographerAlbumCreateWorkspaceMode') || location.pathname.startsWith('/photographer/album/new')}
  function printCreate(w){return !!w?.classList.contains('simplePrintPilotWorkspaceMode') || !!document.querySelector('.simplePrintPilot')}
  function albumHasFiles(){return !!document.querySelector('.albumOrderWorkspace .albumFileToolbar.hasFiles,.albumOrderWorkspace .albumFileQcGrid .albumFileCard')}

  function oldLaunch(mode){
    const all=[...document.querySelectorAll(`.photographerMobileOrderLaunch.${mode} .photographerMobileOrderAction`)];
    return all;
  }
  function actionSource(w,mode,index){
    if(mode==='album' && albumCreate(w)){
      if(index===0)return document.querySelector('.photographerAlbumCreateWorkspaceMode .albumOrderWorkspace .albumFileActionFile,.albumOrderWorkspace .albumFileActionFile');
      return document.querySelector('.photographerAlbumCreateWorkspaceMode .albumOrderWorkspace .albumQuoteCard button.primary,.photographerAlbumCreateWorkspaceMode .albumOrderWorkspace .albumQuoteCard button:not([type=\"button\"]),.albumOrderWorkspace .albumQuoteCard button.primary');
    }
    if(mode==='print' && printCreate(w)){
      if(index===0)return document.querySelector('.simplePrintPilotMobileInlineActions .simplePrintPilotPrimaryAdd,.simplePrintPilot .simplePrintPilotPrimaryAdd');
      return document.querySelector('.simplePrintPilot .simplePrintPilotQuoteSubmit,.simplePrintPilotMobileInlineActions .simplePrintPilotHeaderSubmit,.simplePrintPilot .simplePrintPilotHeaderSubmit');
    }
    return oldLaunch(mode)[index]||null;
  }
  function clickAction(index){
    const w=workspace(); if(!w)return;
    const mode=albumMode(w)?'album':'print';
    const source=actionSource(w,mode,index);
    if(source && !source.disabled){ source.click(); return; }
    // List launch can be momentarily remounted after a route switch; retry once.
    setTimeout(()=>{
      const again=actionSource(workspace(),mode,index);
      if(again && !again.disabled)again.click();
    },80);
  }

  function ensureModeActions(w){
    const nav=w.querySelector('.photographerPrintModeHeader .photographerPrintModeNav');
    if(!nav)return null;
    let row=nav.querySelector(':scope>#pb755-mode-actions');
    if(!row){
      row=document.createElement('div');
      row.id='pb755-mode-actions';
      row.setAttribute('aria-label','عملیات چاپ و آلبوم');
      row.innerHTML='<button type="button" class="pb755Choose"></button><button type="button" class="pb755Send"></button>';
      row.querySelector('.pb755Choose').addEventListener('click',()=>clickAction(0));
      row.querySelector('.pb755Send').addEventListener('click',()=>clickAction(1));
      nav.append(row);
    }
    const isAlbum=albumMode(w), mode=isAlbum?'album':'print';
    row.dataset.mode=mode;
    const choose=row.querySelector('.pb755Choose'), send=row.querySelector('.pb755Send');
    choose.textContent=isAlbum?(albumHasFiles()?'افزودن فایل به آلبوم':'انتخاب فایل آلبوم'):'انتخاب سایز و عکس';
    send.textContent=isAlbum?'ارسال آلبوم برای چاپ':'ارسال فایل برای چاپ';
    const chooseSource=actionSource(w,mode,0), sendSource=actionSource(w,mode,1);
    choose.disabled=!!chooseSource?.disabled;
    // On list pages the real send button navigates to the composer, so it stays enabled.
    send.disabled=(isAlbum&&albumCreate(w))||(mode==='print'&&printCreate(w)) ? !!sendSource?.disabled : false;

    const lab=nav.querySelector('.photographerPrintTopLab');
    const labVisible=!!lab && getComputedStyle(lab).display!=='none' && lab.getClientRects().length>0;
    nav.classList.toggle('pb755HasVisibleLab',labVisible);
    w.style.setProperty('--pb755-nav-height',labVisible?'168px':'118px');
    return row;
  }

  function statusSources(w,isAlbum){
    const selectors=isAlbum?[
      '.photographerAlbumHeaderStatusMobile .albumHeaderStatuses>button',
      '.photographerAlbumHeaderStatusDesktop .albumHeaderStatuses>button',
      '.photographerAlbumHeaderStatusMobile button',
      '.photographerAlbumHeaderStatusDesktop button'
    ]:[
      '.photographerContextStatusesMobile>button',
      '.photographerContextStatusesDesktop>button'
    ];
    for(const sel of selectors){
      const buttons=[...w.querySelectorAll(sel)];
      if(buttons.length)return buttons;
    }
    return [];
  }
  function activeOrders(w,isAlbum){
    if(isAlbum){
      return w.querySelector('.photographerAlbumListFlush .ordersWorkspace.liveCustomerOrders,.photographerAlbumListFlush .ordersWorkspace.customerOrders');
    }
    const candidates=[...w.querySelectorAll('.ordersWorkspace.liveCustomerOrders,.ordersWorkspace.customerOrders')];
    return candidates.find(n=>!n.closest('.photographerAlbumListFlush'))||null;
  }
  function syncStatuses(w){
    const isAlbum=albumMode(w);
    const inCreate=isAlbum?albumCreate(w):printCreate(w);
    document.querySelectorAll('.pb755OrderStatuses').forEach(n=>{if(inCreate||!activeOrders(w,isAlbum)?.contains(n))n.remove()});
    if(inCreate)return;
    const orders=activeOrders(w,isAlbum), source=statusSources(w,isAlbum);
    if(!orders||!source.length)return;
    let bar=orders.querySelector(':scope>.pb755OrderStatuses');
    if(!bar){
      bar=document.createElement('div');
      bar.className='pb755OrderStatuses';
      bar.setAttribute('aria-label','وضعیت سفارش‌ها');
      const grid=orders.querySelector(':scope>.customerOrderGrid');
      orders.insertBefore(bar,grid||null);
    }
    while(bar.children.length<source.length){
      const b=document.createElement('button'); b.type='button';
      b.addEventListener('click',()=>{
        const idx=[...bar.children].indexOf(b);
        const current=statusSources(workspace(),isAlbum)[idx];
        if(current&&!current.disabled)current.click();
      });
      bar.append(b);
    }
    while(bar.children.length>source.length)bar.lastElementChild.remove();
    [...bar.children].forEach((b,i)=>{
      const src=source[i];
      b.innerHTML=src.innerHTML;
      b.classList.toggle('active',src.classList.contains('active'));
      b.disabled=!!src.disabled;
      b.setAttribute('aria-pressed',src.classList.contains('active')?'true':'false');
      const label=txt(src); if(label)b.setAttribute('aria-label',label);
    });
  }

  function cleanupLegacy(w){
    document.getElementById('pb753-mobile-order-actions')?.remove();
    document.getElementById('pb754-album-create-actions')?.remove();
    document.querySelectorAll('.pb752OrderStatuses,.pb754AlbumStageRail').forEach(n=>n.remove());
    w?.querySelectorAll('.pb753LegacyHidden,.pb753LegacyAlbumActionHidden').forEach(n=>{
      n.classList.remove('pb753LegacyHidden','pb753LegacyAlbumActionHidden');
    });
  }

  function run(){
    raf=0; const w=workspace(); if(!w)return;
    cleanupLegacy(w);
    if(!mq.matches){
      document.getElementById('pb755-mode-actions')?.remove();
      document.querySelectorAll('.pb755OrderStatuses').forEach(n=>n.remove());
      w.style.removeProperty('--pb755-nav-height');
      return;
    }
    ensureModeActions(w);
    syncStatuses(w);
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
