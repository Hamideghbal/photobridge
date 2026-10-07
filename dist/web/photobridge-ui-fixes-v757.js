/* PhotoBridge v757 — measured mobile Print/Album frame + photo filters + album-stage filters. */
(()=>{
  'use strict';
  const mq=matchMedia('(max-width:820px)');
  let raf=0, albumRows=[], albumFetchAt=0, albumFetchPromise=null, albumStage='download_print';
  const txt=n=>(n?.textContent||'').replace(/\s+/g,' ').trim();
  const workspace=()=>document.querySelector('.photographerMain.photographerPrintWorkspace');

  function albumMode(w){
    if(w?.querySelector('.photographerPrintModeNav>.photographerPrintAlbumTab.active'))return true;
    if(w?.querySelector('.photographerPrintModeNav>.photographerPrintPhotoTab.active'))return false;
    return !!w?.classList.contains('photographerAlbumWorkspaceMode');
  }
  const albumCreate=w=>!!w?.classList.contains('photographerAlbumCreateWorkspaceMode')||location.pathname.startsWith('/photographer/album/new');
  const printCreate=w=>!!w?.classList.contains('simplePrintPilotWorkspaceMode')||!!document.querySelector('.simplePrintPilot');
  const albumHasFiles=()=>!!document.querySelector('.albumOrderWorkspace .albumFileToolbar.hasFiles,.albumOrderWorkspace .albumFileQcGrid .albumFileCard,.albumMultiProjectShell .albumPrintFilesBody');

  function oldLaunch(mode){return [...document.querySelectorAll(`.photographerMobileOrderLaunch.${mode} .photographerMobileOrderAction`)]}
  function actionSource(w,mode,index){
    if(mode==='album'&&albumCreate(w)){
      if(index===0)return document.querySelector('.photographerAlbumCreateWorkspaceMode .albumOrderWorkspace .albumFileActionFile,.albumOrderWorkspace .albumFileActionFile,.photographerAlbumCreateWorkspaceMode .albumQuickActions button:first-child');
      return document.querySelector('.photographerAlbumCreateWorkspaceMode .albumOrderWorkspace .albumQuoteCard button.primary,.albumOrderWorkspace .albumQuoteCard button.primary,.photographerAlbumCreateWorkspaceMode .albumQuickActions button:nth-child(2)');
    }
    if(mode==='print'&&printCreate(w)){
      if(index===0)return document.querySelector('.simplePrintPilotMobileInlineActions .simplePrintPilotPrimaryAdd,.simplePrintPilot .simplePrintPilotPrimaryAdd');
      return document.querySelector('.simplePrintPilot .simplePrintPilotQuoteSubmit,.simplePrintPilotMobileInlineActions .simplePrintPilotHeaderSubmit,.simplePrintPilot .simplePrintPilotHeaderSubmit');
    }
    return oldLaunch(mode)[index]||null;
  }
  function clickAction(index){
    const w=workspace();if(!w)return;
    const mode=albumMode(w)?'album':'print';
    const source=actionSource(w,mode,index);
    if(source&&!source.disabled){source.click();return}
    setTimeout(()=>{const again=actionSource(workspace(),mode,index);if(again&&!again.disabled)again.click()},90);
  }

  function ensureModeActions(w){
    const nav=w.querySelector('.photographerPrintModeHeader .photographerPrintModeNav');
    if(!nav)return null;
    document.getElementById('pb755-mode-actions')?.remove();
    let row=nav.querySelector(':scope>#pb757-mode-actions');
    if(!row){
      row=document.createElement('div');
      row.id='pb757-mode-actions';
      row.setAttribute('aria-label','عملیات چاپ و آلبوم');
      row.innerHTML='<button type="button" class="pb757Choose"></button><button type="button" class="pb757Send"></button>';
      row.querySelector('.pb757Choose').addEventListener('click',()=>clickAction(0));
      row.querySelector('.pb757Send').addEventListener('click',()=>clickAction(1));
      nav.append(row);
    }
    const isAlbum=albumMode(w),mode=isAlbum?'album':'print';
    const choose=row.querySelector('.pb757Choose'),send=row.querySelector('.pb757Send');
    row.dataset.mode=mode;
    choose.textContent=isAlbum?(albumHasFiles()?'افزودن فایل به آلبوم':'انتخاب فایل آلبوم'):'انتخاب سایز و عکس';
    send.textContent=isAlbum?'ارسال آلبوم برای چاپ':'ارسال فایل برای چاپ';
    const chooseSource=actionSource(w,mode,0),sendSource=actionSource(w,mode,1);
    choose.disabled=!!chooseSource?.disabled;
    send.disabled=((isAlbum&&albumCreate(w))||(mode==='print'&&printCreate(w)))?!!sendSource?.disabled:false;
    const lab=nav.querySelector(':scope>.photographerPrintTopLab');
    // The lab row is a structural child of the mobile print nav. Older styles can report it
    // hidden during the first mutation pass, which previously made the frame 36px too short.
    // Reserve the row whenever the node exists; this keeps both action buttons inside the box.
    const hasLab=!!lab;
    nav.classList.toggle('pb757HasVisibleLab',hasLab);
    nav.classList.remove('pb755HasVisibleLab','pb756HasVisibleLab');
    w.style.setProperty('--pb757-nav-height',hasLab?'154px':'106px');
    return row;
  }

  function activeOrders(w,isAlbum){
    if(isAlbum)return w.querySelector('.photographerAlbumListFlush .ordersWorkspace.liveCustomerOrders,.photographerAlbumListFlush .ordersWorkspace.customerOrders');
    return [...w.querySelectorAll('.ordersWorkspace.liveCustomerOrders,.ordersWorkspace.customerOrders')].find(n=>!n.closest('.photographerAlbumListFlush'))||null;
  }
  function sourcePhotoButtons(w){
    for(const sel of ['.photographerContextStatusesMobile>button','.photographerContextStatusesDesktop>button']){
      const b=[...w.querySelectorAll(sel)];if(b.length)return b;
    }
    return [];
  }
  function sourceAlbumButtons(w){
    for(const sel of ['.photographerAlbumHeaderStatusMobile .albumHeaderStatuses>button','.photographerAlbumHeaderStatusDesktop .albumHeaderStatuses>button']){
      const b=[...w.querySelectorAll(sel)];if(b.length)return b;
    }
    return [];
  }
  function clickAlbumNativeFilter(w,key){
    const label=key==='ready'?'آماده تحویل':key==='completed'?'تحویل‌شده':key==='needs_fix'?'نیازمند اصلاح':'در جریان';
    const b=sourceAlbumButtons(w).find(n=>txt(n).startsWith(label));
    if(b&&!b.disabled&&!b.classList.contains('active'))b.click();
  }

  function syncPhotoStatuses(w){
    document.querySelectorAll('.pb757PhotoStatuses').forEach(n=>{if(albumMode(w)||printCreate(w)||!activeOrders(w,false)?.contains(n))n.remove()});
    if(albumMode(w)||printCreate(w))return;
    const orders=activeOrders(w,false),source=sourcePhotoButtons(w);
    if(!orders||!source.length)return;
    let bar=orders.querySelector(':scope>.pb757PhotoStatuses');
    if(!bar){
      bar=document.createElement('div');bar.className='pb757PhotoStatuses';bar.setAttribute('aria-label','وضعیت سفارش‌های چاپ');
      orders.insertBefore(bar,orders.querySelector(':scope>.customerOrderGrid')||null);
    }
    while(bar.children.length<source.length){
      const b=document.createElement('button');b.type='button';
      b.addEventListener('click',()=>{const i=[...bar.children].indexOf(b),cur=sourcePhotoButtons(workspace())[i];if(cur&&!cur.disabled)cur.click()});
      bar.append(b);
    }
    while(bar.children.length>source.length)bar.lastElementChild.remove();
    [...bar.children].forEach((b,i)=>{const s=source[i];b.innerHTML=s.innerHTML;b.classList.toggle('active',s.classList.contains('active'));b.disabled=!!s.disabled;b.setAttribute('aria-pressed',s.classList.contains('active')?'true':'false')});
  }

  function albumStageKey(o){
    const status=String(o?.status||''),stage=String(o?.album_stage||'');
    if(status==='completed'||['completed','delivered','done','archived'].includes(stage))return 'completed';
    if(status==='ready'||stage==='ready')return 'ready';
    if(stage==='binding')return 'binding';
    return 'download_print';
  }
  function stageFromCard(card){
    const current=txt(card.querySelector('.albumCustomerTimeline .current b,.pb754AlbumStageRail .current b,.albumStageBadge'));
    if(current.includes('تحویل‌شده')||current.includes('تحویل شد'))return 'completed';
    if(current.includes('آماده تحویل'))return 'ready';
    if(current.includes('صحافی'))return 'binding';
    return 'download_print';
  }
  function albumMap(){return new Map(albumRows.map(o=>[String(o.id),o]))}
  function albumStageCounts(){
    const c={download_print:0,binding:0,ready:0,completed:0};
    for(const o of albumRows){
      if(String(o?.mode||'')!=='album'||String(o?.status||'')==='cancelled'||String(o?.status||'')==='uploading')continue;
      const k=albumStageKey(o);if(k in c)c[k]++;
    }
    return c;
  }
  function refreshAlbumRows(force=false){
    if(!mq.matches||!albumMode(workspace())||albumCreate(workspace()))return Promise.resolve(albumRows);
    const now=Date.now();if(!force&&albumRows.length&&now-albumFetchAt<12000)return Promise.resolve(albumRows);
    if(albumFetchPromise)return albumFetchPromise;
    albumFetchPromise=fetch(`/api/customer/orders?_pb757=${now}`,{credentials:'same-origin',cache:'no-store'})
      .then(r=>r.ok?r.json():Promise.reject(new Error('orders')))
      .then(d=>{albumRows=(d?.orders||[]).filter(o=>String(o?.mode||'')==='album');albumFetchAt=Date.now();return albumRows})
      .catch(()=>albumRows)
      .finally(()=>{albumFetchPromise=null;schedule()});
    return albumFetchPromise;
  }
  function applyAlbumStageFilter(w){
    const orders=activeOrders(w,true);if(!orders)return;
    const map=albumMap();
    orders.querySelectorAll('.albumCustomerOrderCard[data-order-id]').forEach(card=>{
      const o=map.get(String(card.dataset.orderId||''));
      const key=o?albumStageKey(o):stageFromCard(card);
      if(key!==albumStage)card.style.setProperty('display','none','important');
      else card.style.removeProperty('display');
    });
  }
  function setAlbumStage(w,key){
    albumStage=key;
    clickAlbumNativeFilter(w,key==='ready'?'ready':key==='completed'?'completed':'flow');
    setTimeout(()=>{applyAlbumStageFilter(workspace());schedule()},60);
  }
  function syncAlbumStatuses(w){
    document.querySelectorAll('.pb757AlbumStageStatuses').forEach(n=>{if(!albumMode(w)||albumCreate(w)||!activeOrders(w,true)?.contains(n))n.remove()});
    if(!albumMode(w)||albumCreate(w))return;
    const orders=activeOrders(w,true);if(!orders)return;
    refreshAlbumRows();
    let bar=orders.querySelector(':scope>.pb757AlbumStageStatuses');
    if(!bar){
      bar=document.createElement('div');bar.className='pb757AlbumStageStatuses';bar.setAttribute('aria-label','مراحل سفارش آلبوم');
      const defs=[['download_print','دانلود / چاپ'],['binding','صحافی'],['ready','آماده تحویل'],['completed','تحویل‌شده']];
      for(const [key,label] of defs){
        const b=document.createElement('button');b.type='button';b.dataset.stage=key;b.innerHTML=`<span>${label}</span> <b>۰</b>`;b.addEventListener('click',()=>setAlbumStage(workspace(),key));bar.append(b)
      }
      orders.insertBefore(bar,orders.querySelector(':scope>.customerOrderGrid')||null);
    }
    const counts=albumStageCounts();
    [...bar.children].forEach(b=>{const k=b.dataset.stage;b.classList.toggle('active',k===albumStage);b.setAttribute('aria-pressed',k===albumStage?'true':'false');const c=b.querySelector('b');if(c)c.textContent=String(counts[k]??0)});
    applyAlbumStageFilter(w);
  }

  function syncGeometry(w){
    const nav=w.querySelector('.photographerPrintModeHeader .photographerPrintModeNav');
    const scroll=w.querySelector(':scope>.photographerRolePageScrollArea');
    if(!nav||!scroll)return;
    const navRect=nav.getBoundingClientRect();
    const actions=nav.querySelector(':scope>#pb757-mode-actions');
    const lab=nav.querySelector(':scope>.photographerPrintTopLab');
    const photo=nav.querySelector(':scope>.photographerPrintPhotoTab');
    const album=nav.querySelector(':scope>.photographerPrintAlbumTab');
    const bottoms=[navRect.bottom,actions?.getBoundingClientRect().bottom,lab?.getBoundingClientRect().bottom,photo?.getBoundingClientRect().bottom,album?.getBoundingClientRect().bottom]
      .filter(Number.isFinite);
    // Use the lowest *real child edge*, not only the nav box. This survives legacy CSS that
    // temporarily gives the nav an old height while the action row has already been laid out.
    const safeTop=Math.ceil(Math.max(...bottoms)+10);
    const bottomNav=w.querySelector('.photographerBottomAppNav');
    const navTop=bottomNav?.getBoundingClientRect().top||0;
    const bottom=navTop>0&&navTop<innerHeight&&navTop-safeTop>120?Math.max(0,Math.ceil(innerHeight-navTop)):0;
    const pos=getComputedStyle(scroll).position;
    const shouldFix=pos==='fixed'||w.classList.contains('photographerAlbumWorkspaceMode')||w.classList.contains('photographerAlbumCreateWorkspaceMode')||w.classList.contains('simplePrintPilotWorkspaceMode');
    if(shouldFix){
      scroll.style.setProperty('top',`${safeTop}px`,'important');
      scroll.style.setProperty('bottom',`${bottom}px`,'important');
      w.style.setProperty('--pb757-content-top',`${safeTop}px`);
      w.style.setProperty('--pb757-content-bottom',`${bottom}px`);
      w.style.setProperty('--pb757-scroll-clearance','10px');
    }else{
      scroll.style.removeProperty('top');scroll.style.removeProperty('bottom');
      const r=scroll.getBoundingClientRect();
      const overlap=Math.max(0,safeTop-Math.ceil(r.top));
      w.style.setProperty('--pb757-scroll-clearance',`${Math.max(10,overlap+10)}px`);
    }
  }

  function cleanup(w){
    document.getElementById('pb753-mobile-order-actions')?.remove();
    document.getElementById('pb754-album-create-actions')?.remove();
    document.getElementById('pb755-mode-actions')?.remove();
    document.getElementById('pb756-mode-actions')?.remove();
    document.querySelectorAll('.pb752OrderStatuses,.pb754AlbumStageRail,.pb755OrderStatuses,.pb756PhotoStatuses,.pb756AlbumStageStatuses').forEach(n=>n.remove());
    w?.querySelectorAll('.pb753LegacyHidden,.pb753LegacyAlbumActionHidden').forEach(n=>n.classList.remove('pb753LegacyHidden','pb753LegacyAlbumActionHidden'));
  }

  function run(){
    raf=0;const w=workspace();if(!w)return;
    cleanup(w);
    if(!mq.matches){
      document.getElementById('pb757-mode-actions')?.remove();
      document.querySelectorAll('.pb757PhotoStatuses,.pb757AlbumStageStatuses').forEach(n=>n.remove());
      w.style.removeProperty('--pb757-nav-height');w.style.removeProperty('--pb757-scroll-clearance');w.style.removeProperty('--pb757-content-top');w.style.removeProperty('--pb757-content-bottom');
      return;
    }
    ensureModeActions(w);
    syncGeometry(w);
    if(albumMode(w))syncAlbumStatuses(w);else syncPhotoStatuses(w);
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(run)}
  function start(){
    const root=document.getElementById('root');
    if(root)new MutationObserver(schedule).observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','disabled','aria-expanded']});
    document.addEventListener('click',()=>setTimeout(schedule,0),true);
    window.addEventListener('popstate',()=>{albumStage='download_print';albumRows=[];albumFetchAt=0;schedule()});
    window.addEventListener('resize',schedule,{passive:true});
    window.visualViewport?.addEventListener('resize',schedule,{passive:true});
    mq.addEventListener?.('change',schedule);
    setInterval(()=>{if(mq.matches&&albumMode(workspace())&&!albumCreate(workspace()))refreshAlbumRows(true)},15000);
    schedule();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
