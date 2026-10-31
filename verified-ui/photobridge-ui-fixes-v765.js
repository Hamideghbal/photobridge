/* PhotoBridge v765 — clean list spacing + composer choose/send + open-only plus flow. */
(()=>{
  'use strict';
  const mq=matchMedia('(max-width:820px)');
  let raf=0, albumRows=[], albumFetchAt=0, albumFetchPromise=null, albumStage='download_print';
  const txt=n=>(n?.textContent||'').replace(/\s+/g,' ').trim();
  const printRoute=()=>{const p=location.pathname,q=new URLSearchParams(location.search);return /^\/photographer\/(orders|upload|album|archive|finance)(?:\/|$)/.test(p)||q.get('workspace')==='print'};
  const activeBottomLabel=()=>{const b=document.querySelector('.photographerBottomAppNav button.active,[aria-current=\"page\"].photographerStoreMobileNav');return String(b?.getAttribute('aria-label')||b?.querySelector?.('em')?.textContent||b?.textContent||'').replace(/\s+/g,' ').trim()};
  const workspace=()=>{const w=document.querySelector('.photographerMain.photographerPrintWorkspace');if(!w)return null;if(printRoute())return w;return activeBottomLabel()==='چاپ'?w:null};

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
      row.innerHTML='<button type="button" class="pb765Choose"></button><button type="button" class="pb761Send"></button>';
      row.querySelector('.pb765Choose').addEventListener('click',()=>clickAction(0));
      row.querySelector('.pb761Send').addEventListener('click',()=>clickAction(1));
      nav.append(row);
    }
    const isAlbum=albumMode(w),mode=isAlbum?'album':'print';
    const composing=isAlbum?albumCreate(w):printCreate(w);
    w.classList.toggle('pb765Composing',composing);
    const choose=row.querySelector('.pb765Choose');
    const send=row.querySelector('.pb761Send');
    row.dataset.mode=mode;
    const chooseLabel=isAlbum?(albumHasFiles()?'افزودن فایل آلبوم':'انتخاب فایل آلبوم'):'انتخاب عکس';
    const sendLabel=isAlbum?'ارسال آلبوم برای چاپ':'ارسال برای چاپ';
    if(txt(choose)!==chooseLabel)choose.textContent=chooseLabel;
    if(txt(send)!==sendLabel)send.textContent=sendLabel;
    const chooseSource=actionSource(w,mode,0),sendSource=actionSource(w,mode,1);
    if(choose.disabled!==(!chooseSource||!!chooseSource.disabled))choose.disabled=!chooseSource||!!chooseSource.disabled;
    if(send.disabled!==(!sendSource||!!sendSource.disabled))send.disabled=!sendSource||!!sendSource.disabled;
    // v806: the composer needs one reliable Back control. Prefer React's native back;
    // fall back to the print overview when that control is not mounted.
    let back=nav.querySelector('#pb765-back');
    if(!back){
      back=document.createElement('button');back.type='button';back.id='pb765-back';
      back.textContent='←';back.setAttribute('aria-label','بازگشت');back.title='بازگشت';
      back.addEventListener('click',()=>{
        const ww=workspace()||document.querySelector('.photographerMain.photographerPrintWorkspace');
        const native=ww?.querySelector('.photographerPrintModeBack');
        if(native&&!native.disabled){native.click();return}
        location.assign('/photographer/orders/flow?workspace=print');
      });
      nav.append(back);
    }
    const nativeBack=w.querySelector('.photographerPrintModeBack');
    back.disabled=false;
    let add=document.getElementById('pb765-add');
    if(!add){
      add=document.createElement('button');add.id='pb765-add';add.type='button';
      add.textContent='+';add.addEventListener('click',()=>{
        const ww=workspace();if(!ww)return;
        const mm=albumMode(ww)?'album':'print';
        const source=oldLaunch(mm)[0];
        if(!source||source.disabled)return;
        window.PB765OpenComposerOnly=true;
        source.click();
        setTimeout(()=>{window.PB765OpenComposerOnly=false},250);
      });
      document.body.append(add);
    }
    const addLabel=isAlbum?(composing?(albumHasFiles()?'افزودن فایل به آلبوم':'انتخاب فایل آلبوم'):'سفارش آلبوم جدید')
      :(composing?'افزودن عکس برای چاپ':'سفارش چاپ عکس جدید');
    if(add.getAttribute('aria-label')!==addLabel){add.setAttribute('aria-label',addLabel);add.title=addLabel}
    if(add.disabled!==(!chooseSource||!!chooseSource.disabled))add.disabled=!chooseSource||!!chooseSource.disabled;
    add.classList.toggle('pb765Composing',composing);
    // v805: the floating + exists only on the order overview, never inside file selection/composer.
    add.hidden=!!composing;
    add.setAttribute('aria-hidden',composing?'true':'false');
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
      const b=[...w.querySelectorAll(sel)].filter(n=>{const t=txt(n);return !t.includes('فاکتور')&&!t.includes('بازگشت')});if(b.length)return b;
    }
    return [];
  }
  function sourceAlbumButtons(w){
    for(const sel of ['.photographerAlbumHeaderStatusMobile .albumHeaderStatuses>button','.photographerAlbumHeaderStatusDesktop .albumHeaderStatuses>button']){
      const b=[...w.querySelectorAll(sel)].filter(n=>{const t=txt(n);return !t.includes('فاکتور')&&!t.includes('بازگشت')});if(b.length)return b;
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

  function syncGeometry(w){if(document.documentElement.classList.contains('pb1126Embedded'))return;
    const scroll=w?.querySelector(':scope>.photographerRolePageScrollArea');
    if(!scroll)return;
    // R100F37: fixed Store-header geometry. Never measure hidden/native headers.
    const composing=w.classList.contains('pb765Composing')||printCreate(w)||albumCreate(w);
    const pb1310=window.pb1310PrintGeometry?.(w)??(/* PB1315 embedded print viewport */document.documentElement.classList.contains('pb1126Embedded')?{top:0,bottom:0}:null);
    const safeTop=pb1310?.top??(composing?241:181);
    const bottom=pb1310?.bottom??78;
    w.style.setProperty('--pb761-content-top',`${safeTop}px`);
    w.style.setProperty('--pb761-content-bottom',`${bottom}px`);
    w.style.setProperty('--pb761-scroll-clearance','10px');
    const add=document.getElementById('pb765-add');
    if(add)add.style.bottom=`${bottom+12}px`;
    const props={position:'fixed',top:`${safeTop}px`,left:'0',right:'0',bottom:`${bottom}px`,width:'100%',height:'auto',margin:'0','box-sizing':'border-box','overflow-y':'auto','overflow-x':'hidden'};
    for(const [k,v] of Object.entries(props))scroll.style.setProperty(k,v,'important');
  }

  let geometryObserver=null;
  function watchGeometry(w){
    // R100F37: intentionally no ResizeObserver. It caused the Print viewport to
    // continuously re-measure itself after fixed-position updates.
    geometryObserver?.disconnect?.();
  }

  function resetScrollGeometry(w){if(document.documentElement.classList.contains('pb1126Embedded'))return;
    const scroll=w?.querySelector(':scope>.photographerRolePageScrollArea');
    if(scroll){
      for(const p of ['position','top','left','right','bottom','width','height','margin','box-sizing','overflow-y','overflow-x'])scroll.style.removeProperty(p);
    }
  }

  function cleanup(w){
    document.getElementById('pb762-back')?.remove();
    document.getElementById('pb762-add')?.remove();
    document.getElementById('pb753-mobile-order-actions')?.remove();
    document.getElementById('pb754-album-create-actions')?.remove();
    document.getElementById('pb755-mode-actions')?.remove();
    document.getElementById('pb756-mode-actions')?.remove();
    document.getElementById('pb757-mode-actions')?.remove();
    document.querySelectorAll('.pb752OrderStatuses,.pb754AlbumStageRail,.pb755OrderStatuses,.pb756PhotoStatuses,.pb756AlbumStageStatuses,.pb757PhotoStatuses,.pb757AlbumStageStatuses').forEach(n=>n.remove());
    w?.querySelectorAll('.pb753LegacyHidden,.pb753LegacyAlbumActionHidden').forEach(n=>n.classList.remove('pb753LegacyHidden','pb753LegacyAlbumActionHidden'));
  }

  function run(){
    raf=0;const w=workspace();
    if(!w){
      document.getElementById('pb761-mode-actions')?.remove();
      document.getElementById('pb765-back')?.remove();
      document.getElementById('pb765-add')?.remove();
      const main=document.querySelector('.photographerMain');
      if(main){
        for(const name of ['--pb742-content-top','--pb742-nav-bottom','--pb743-album-top','--pb743-album-bottom','--pb761-nav-height','--pb761-scroll-clearance','--pb761-content-top','--pb761-content-bottom'])main.style.removeProperty(name);
        resetScrollGeometry(main);
      }
      return
    }
    cleanup(w);
    if(!mq.matches){
      document.getElementById('pb761-mode-actions')?.remove();
      document.getElementById('pb765-back')?.remove();
      document.getElementById('pb765-add')?.remove();
      w.classList.remove('pb765Composing');
      document.querySelectorAll('.pb761PhotoStatuses,.pb761AlbumStageStatuses').forEach(n=>n.remove());
      w.style.removeProperty('--pb761-nav-height');w.style.removeProperty('--pb761-scroll-clearance');w.style.removeProperty('--pb761-content-top');w.style.removeProperty('--pb761-content-bottom');
      resetScrollGeometry(w); geometryObserver?.disconnect();
      return;
    }
    const finance=location.pathname.startsWith('/photographer/finance')||!!w.querySelector('.financeWorkspace');
    if(finance){
      document.getElementById('pb761-mode-actions')?.remove();
      document.getElementById('pb765-back')?.remove();
      document.getElementById('pb765-add')?.remove();
      w.classList.remove('pb765Composing');
      watchGeometry(w);
      syncGeometry(w);
      const scroll=w.querySelector(':scope>.photographerRolePageScrollArea');
      if(scroll)scroll.style.setProperty('overflow-y','auto','important');
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
    if(root)new MutationObserver(schedule).observe(root,{subtree:true,childList:true});
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
