/* PhotoBridge v762 — compact order list, contextual add button, full-width composer send. */
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
    let row=nav.querySelector(':scope>#pb761-mode-actions');
    if(!row){
      row=document.createElement('div');
      row.id='pb761-mode-actions';
      row.setAttribute('aria-label','ارسال سفارش');
      row.innerHTML='<button type="button" class="pb761Send"></button>';
      row.querySelector('.pb761Send').addEventListener('click',()=>clickAction(1));
      nav.append(row);
    }
    const isAlbum=albumMode(w),mode=isAlbum?'album':'print';
    const composing=isAlbum?albumCreate(w):printCreate(w);
    w.classList.toggle('pb762Composing',composing);
    const send=row.querySelector('.pb761Send');
    row.dataset.mode=mode;
    const sendLabel=isAlbum?'ارسال آلبوم برای چاپ':'ارسال فایل برای چاپ';
    if(txt(send)!==sendLabel)send.textContent=sendLabel;
    const chooseSource=actionSource(w,mode,0),sendSource=actionSource(w,mode,1);
    if(send.disabled!==(!sendSource||!!sendSource.disabled))send.disabled=!sendSource||!!sendSource.disabled;
    let back=nav.querySelector(':scope>#pb762-back');
    if(!back){
      back=document.createElement('button');back.type='button';back.id='pb762-back';
      back.textContent='←';back.setAttribute('aria-label','بازگشت');
      back.addEventListener('click',()=>workspace()?.querySelector('.photographerPrintModeBack')?.click());
      nav.append(back);
    }
    const nativeBack=w.querySelector('.photographerPrintModeBack');
    if(back.disabled!==!nativeBack)back.disabled=!nativeBack;
    let add=document.getElementById('pb762-add');
    if(!add){
      add=document.createElement('button');add.id='pb762-add';add.type='button';
      add.textContent='+';add.addEventListener('click',()=>clickAction(0));
      document.body.append(add);
    }
    const addLabel=isAlbum?(composing?(albumHasFiles()?'افزودن فایل به آلبوم':'انتخاب فایل آلبوم'):'سفارش آلبوم جدید')
      :(composing?'افزودن عکس برای چاپ':'سفارش چاپ عکس جدید');
    if(add.getAttribute('aria-label')!==addLabel){add.setAttribute('aria-label',addLabel);add.title=addLabel}
    if(add.disabled!==(!chooseSource||!!chooseSource.disabled))add.disabled=!chooseSource||!!chooseSource.disabled;
    add.classList.toggle('pb762Composing',composing);
    const lab=nav.querySelector(':scope>.photographerPrintTopLab');
    // The lab row is a structural child of the mobile print nav. Older styles can report it
    // hidden during the first mutation pass, which previously made the frame 36px too short.
    // Reserve the row whenever the node exists; this keeps both action buttons inside the box.
    const hasLab=!!lab;
    nav.classList.toggle('pb761HasVisibleLab',hasLab);
    nav.classList.remove('pb755HasVisibleLab','pb756HasVisibleLab','pb757HasVisibleLab');
    // The structural row determines the frame height. Its dimensions are also
    // enforced by CSS, even before this first frame measurement finishes.
    w.style.setProperty('--pb761-nav-height',composing?'106px':hasLab?'112px':'64px');
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
    document.querySelectorAll('.pb761PhotoStatuses').forEach(n=>{if(albumMode(w)||printCreate(w)||!activeOrders(w,false)?.contains(n))n.remove()});
    if(albumMode(w)||printCreate(w))return;
    const orders=activeOrders(w,false),source=sourcePhotoButtons(w);
    if(!orders||!source.length)return;
    let bar=orders.querySelector(':scope>.pb761PhotoStatuses');
    if(!bar){
      bar=document.createElement('div');bar.className='pb761PhotoStatuses';bar.setAttribute('aria-label','وضعیت سفارش‌های چاپ');
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
    albumFetchPromise=fetch(`/api/customer/orders?_pb761=${now}`,{credentials:'same-origin',cache:'no-store'})
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
    document.querySelectorAll('.pb761AlbumStageStatuses').forEach(n=>{if(!albumMode(w)||albumCreate(w)||!activeOrders(w,true)?.contains(n))n.remove()});
    if(!albumMode(w)||albumCreate(w))return;
    const orders=activeOrders(w,true);if(!orders)return;
    refreshAlbumRows();
    let bar=orders.querySelector(':scope>.pb761AlbumStageStatuses');
    if(!bar){
      bar=document.createElement('div');bar.className='pb761AlbumStageStatuses';bar.setAttribute('aria-label','مراحل سفارش آلبوم');
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
    const header=w.querySelector(':scope>.photographerPrintModeHeader');
    const nav=header?.querySelector(':scope>.photographerPrintModeNav');
    const scroll=w.querySelector(':scope>.photographerRolePageScrollArea');
    if(!header||!nav||!scroll)return;

    const navRect=nav.getBoundingClientRect();
    const headerRect=header.getBoundingClientRect();
    const actions=nav.querySelector(':scope>#pb761-mode-actions');
    const lab=nav.querySelector(':scope>.photographerPrintTopLab');
    const photo=nav.querySelector(':scope>.photographerPrintPhotoTab');
    const album=nav.querySelector(':scope>.photographerPrintAlbumTab');
    const cssNavHeight=parseFloat(getComputedStyle(nav).height)||0;
    const expectedNavHeight=parseFloat(w.style.getPropertyValue('--pb761-nav-height'))||(lab?112:64);

    const bottoms=[
      navRect.bottom,
      navRect.top+cssNavHeight,
      navRect.top+expectedNavHeight,
      headerRect.bottom+expectedNavHeight,
      actions&&actions.getBoundingClientRect().bottom+8,
      lab?.getBoundingClientRect().bottom,
      photo?.getBoundingClientRect().bottom,
      album?.getBoundingClientRect().bottom
    ].filter(Number.isFinite);

    // Measure the visible action row instead of reserving the old, oversized
    // list clearance. The status row begins just below the complete nav frame.
    const safeTop=Math.ceil(Math.max(...bottoms)+4);
    const bottomNav=w.querySelector('.photographerBottomAppNav');
    const navTop=bottomNav?.getBoundingClientRect().top||0;
    const bottom=navTop>0&&navTop<innerHeight&&navTop-safeTop>110?Math.max(0,Math.ceil(innerHeight-navTop)):0;

    w.style.setProperty('--pb761-content-top',`${safeTop}px`);
    w.style.setProperty('--pb761-content-bottom',`${bottom}px`);
    w.style.setProperty('--pb761-scroll-clearance','4px');
    const add=document.getElementById('pb762-add');
    if(add){
      if(bottom>0)add.style.bottom=`${bottom+12}px`;
      else add.style.removeProperty('bottom');
    }

    // One deterministic viewport for every mobile print/album state. Older versions
    // used a mix of normal-flow and fixed scrollers, which is what caused the overlap.
    scroll.style.setProperty('position','fixed','important');
    scroll.style.setProperty('top',`${safeTop}px`,'important');
    scroll.style.setProperty('left','0','important');
    scroll.style.setProperty('right','0','important');
    scroll.style.setProperty('bottom',`${bottom}px`,'important');
    scroll.style.setProperty('width','100%','important');
    scroll.style.setProperty('height','auto','important');
    scroll.style.setProperty('margin','0','important');
    scroll.style.setProperty('box-sizing','border-box','important');
    // The list's order grid owns scrolling; composers still scroll as one page.
    const orderList=albumMode(w)?!albumCreate(w):!printCreate(w);
    scroll.style.setProperty('overflow-y',orderList?'hidden':'auto','important');
    scroll.style.setProperty('overflow-x','hidden','important');
  }

  let geometryObserver=null;
  function watchGeometry(w){
    if(!('ResizeObserver' in window))return;
    if(!geometryObserver)geometryObserver=new ResizeObserver(()=>schedule());
    geometryObserver.disconnect();
    const header=w.querySelector(':scope>.photographerPrintModeHeader');
    const nav=header?.querySelector(':scope>.photographerPrintModeNav');
    const nodes=[header,nav,nav?.querySelector(':scope>#pb761-mode-actions'),nav?.querySelector(':scope>.photographerPrintTopLab'),w.querySelector('.photographerBottomAppNav')];
    nodes.filter(Boolean).forEach(n=>{try{geometryObserver.observe(n)}catch{}});
  }

  function resetScrollGeometry(w){
    const scroll=w?.querySelector(':scope>.photographerRolePageScrollArea');
    if(scroll){
      for(const p of ['position','top','left','right','bottom','width','height','margin','box-sizing','overflow-y','overflow-x'])scroll.style.removeProperty(p);
    }
  }

  function cleanup(w){
    document.getElementById('pb753-mobile-order-actions')?.remove();
    document.getElementById('pb754-album-create-actions')?.remove();
    document.getElementById('pb755-mode-actions')?.remove();
    document.getElementById('pb756-mode-actions')?.remove();
    document.getElementById('pb757-mode-actions')?.remove();
    document.querySelectorAll('.pb752OrderStatuses,.pb754AlbumStageRail,.pb755OrderStatuses,.pb756PhotoStatuses,.pb756AlbumStageStatuses,.pb757PhotoStatuses,.pb757AlbumStageStatuses').forEach(n=>n.remove());
    w?.querySelectorAll('.pb753LegacyHidden,.pb753LegacyAlbumActionHidden').forEach(n=>n.classList.remove('pb753LegacyHidden','pb753LegacyAlbumActionHidden'));
  }

  function run(){
    raf=0;const w=workspace();if(!w){document.getElementById('pb762-add')?.remove();return}
    cleanup(w);
    if(!mq.matches){
      document.getElementById('pb761-mode-actions')?.remove();
      document.getElementById('pb762-back')?.remove();
      document.getElementById('pb762-add')?.remove();
      w.classList.remove('pb762Composing');
      document.querySelectorAll('.pb761PhotoStatuses,.pb761AlbumStageStatuses').forEach(n=>n.remove());
      w.style.removeProperty('--pb761-nav-height');w.style.removeProperty('--pb761-scroll-clearance');w.style.removeProperty('--pb761-content-top');w.style.removeProperty('--pb761-content-bottom');
      resetScrollGeometry(w); geometryObserver?.disconnect();
      return;
    }
    ensureModeActions(w);
    watchGeometry(w);
    syncGeometry(w);
    if(albumMode(w))syncAlbumStatuses(w);else syncPhotoStatuses(w);
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(run)}
  function start(){
    const root=document.getElementById('root');
    if(root)new MutationObserver(schedule).observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','disabled','aria-expanded']});
    const settle=()=>{schedule();setTimeout(schedule,40);setTimeout(schedule,120);setTimeout(schedule,320)};
    document.addEventListener('click',settle,true);
    window.addEventListener('popstate',()=>{albumStage='download_print';albumRows=[];albumFetchAt=0;settle()});
    window.addEventListener('resize',settle,{passive:true});
    window.visualViewport?.addEventListener('resize',settle,{passive:true});
    mq.addEventListener?.('change',schedule);
    setInterval(()=>{if(mq.matches&&albumMode(workspace())&&!albumCreate(workspace()))refreshAlbumRows(true)},15000);
    schedule();setTimeout(schedule,60);setTimeout(schedule,180);setTimeout(schedule,500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
