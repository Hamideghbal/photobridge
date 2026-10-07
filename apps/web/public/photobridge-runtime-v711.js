/* PhotoBridge v731 — original print/album workflow restored; PWA install reconciliation + auto-update + body-owned mobile context strip.
   Installed state is reconciled on load/focus/visibility/pageshow and while the page stays open.
   Auto-update checks a tiny no-cache build marker and refreshes the app when a newer deployment is live. */
(()=>{
  'use strict';
  if(window.__PB711_RUNTIME__)return;
  window.__PB711_RUNTIME__=true;

  const INSTALL_KEY='photobridge:pwa-installed';
  const INSTALL_DURABLE_KEY='photobridge:pwa-installed-v713';
  const INSTALL_CHANNEL='photobridge:pwa-install-state';
  const RELATED_CONFIRMED_KEY='photobridge:pwa-related-confirmed';
  const CURRENT_BUILD='902';
  const BUILD_URL='/photobridge-build.json';
  const HEADER_THEME='#dff2f6';
  const MOBILE='(max-width: 820px)';
  const root=document.documentElement;
  root.classList.add('pb771InstallChecking');
  const qs=(s,r=document)=>r?.querySelector?.(s)||null;
  const qsa=(s,r=document)=>r?.querySelectorAll?[...r.querySelectorAll(s)]:[];
  const mobile=()=>{try{return matchMedia(MOBILE).matches}catch{return innerWidth<=820}};
  const isiOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(/macintosh/i.test(navigator.userAgent)&&navigator.maxTouchPoints>1);
  const isAndroid=()=>/android/i.test(navigator.userAgent);
  const standalone=()=>{try{return matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches||navigator.standalone===true||String(document.referrer||'').startsWith('android-app://')}catch{return navigator.standalone===true}};
  const readMarker=()=>{try{return localStorage.getItem(INSTALL_KEY)==='1'||!!localStorage.getItem(INSTALL_DURABLE_KEY)}catch{return false}};
  const writeMarker=v=>{try{if(v){localStorage.setItem(INSTALL_KEY,'1');localStorage.setItem(INSTALL_DURABLE_KEY,String(Date.now()))}else{localStorage.removeItem(INSTALL_KEY);localStorage.removeItem(INSTALL_DURABLE_KEY)}}catch{}};
  const relatedConfirmed=()=>{try{return localStorage.getItem(RELATED_CONFIRMED_KEY)==='1'}catch{return false}};
  const setRelatedConfirmed=v=>{try{v?localStorage.setItem(RELATED_CONFIRMED_KEY,'1'):localStorage.removeItem(RELATED_CONFIRMED_KEY)}catch{}};

  let installChannel=null;
  try{if('BroadcastChannel' in window)installChannel=new BroadcastChannel(INSTALL_CHANNEL)}catch{}
  let promptEvent=null;
  let installed=standalone()||readMarker();
  let raf=0,timer=0,lastHref=location.href,observer=null,installVerifyTimer=0,installPollTimer=0,relatedMisses=0,buildTimer=0,buildBusy=false;
  const broadcastInstalled=()=>{try{installChannel?.postMessage?.({installed:true,at:Date.now()})}catch{}};
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  if(standalone()){writeMarker(true);broadcastInstalled()}

  function syncThemeChrome(){
    try{
      let meta=document.querySelector('meta[name=\"theme-color\"]');
      if(!meta){meta=document.createElement('meta');meta.name='theme-color';document.head.appendChild(meta)}
      const cached=(()=>{try{return localStorage.getItem('photobridge:appearance:top')||''}catch{return ''}})();const top=root.style.getPropertyValue('--pb771-top').trim()||(/^#[0-9a-f]{6}$/i.test(cached)?cached:HEADER_THEME);
      meta.setAttribute('content',top);
      document.documentElement.style.setProperty('background-color',top,'important');
    }catch{}
  }

  function paintInstall(){
    const ready=!installed;
    root.classList.toggle('pb711Installed',!!installed);
    root.classList.toggle('pb711InstallReady',!!ready);
    // Keep the v710 state classes too because the React-owned header CSS intentionally uses them.
    root.classList.toggle('pb710Installed',!!installed);
    root.classList.toggle('pb710InstallReady',!!ready);
  }

  const isPhotoBridgeRelatedApp=app=>{
    const platform=String(app?.platform||'').toLowerCase();
    const id=String(app?.id||'');
    const url=String(app?.url||'');
    if(platform!=='webapp')return false;
    return id==='https://photobridge.ir/photobridge-pwa'||id.endsWith('/photobridge-pwa')||/photobridge\.webmanifest(?:[?#]|$)/i.test(url);
  };

  async function relatedInstallState(retries=0){
    if(typeof navigator.getInstalledRelatedApps!=='function')return {supported:false,known:false,installed:false};
    let last=[];
    for(let i=0;i<=retries;i++){
      try{
        const apps=await navigator.getInstalledRelatedApps();
        if(!Array.isArray(apps))return {supported:true,known:false,installed:false};
        last=apps;
        if(apps.some(isPhotoBridgeRelatedApp))return {supported:true,known:true,installed:true,apps};
      }catch{return {supported:true,known:false,installed:false}}
      if(i<retries)await wait(i===0?220:i===1?520:900);
    }
    return {supported:true,known:true,installed:false,apps:last};
  }

  async function detectInstalled({allowUninstall=false,retries=0}={}){
    if(standalone()){
      installed=true;writeMarker(true);broadcastInstalled();paintInstall();return true;
    }
    const related=await relatedInstallState(retries);
    if(related.installed){
      relatedMisses=0;setRelatedConfirmed(true);installed=true;writeMarker(true);broadcastInstalled();paintInstall();return true;
    }
    // A fresh beforeinstallprompt is the strongest browser signal that the PWA is
    // installable again, so a previous durable marker is stale.
    if(allowUninstall&&promptEvent&&((related.supported&&related.known)||!related.supported)){
      relatedMisses=0;setRelatedConfirmed(false);installed=false;writeMarker(false);paintInstall();return false;
    }
    // When this browser has previously positively identified our installed web app,
    // several consecutive empty checks while the tab is visible are enough to notice
    // an uninstall without requiring a manual refresh. Consecutive misses protect
    // against the transient [] results seen during navigation/restore.
    if(allowUninstall&&related.supported&&related.known&&relatedConfirmed()&&!document.hidden){
      relatedMisses+=1;
      if(relatedMisses>=4){setRelatedConfirmed(false);installed=false;writeMarker(false);paintInstall();return false}
    }else if(related.supported&&related.known){
      relatedMisses=0;
    }
    installed=readMarker();
    paintInstall();return installed;
  }

  function manualHelp(){
    if(isiOS())alert('برای نصب PhotoBridge در iPhone/iPad: در Safari دکمه Share را بزنید و Add to Home Screen را انتخاب کنید.');
    else alert('برای نصب PhotoBridge، از منوی مرورگر گزینه Install app / نصب برنامه را انتخاب کنید.');
  }

  window.PB710InstallApp=window.PB711InstallApp=async()=>{
    if(standalone()){installed=true;writeMarker(true);paintInstall();return}
    // If an install prompt exists, reconcile it against the installed-related-apps API
    // before deciding that a durable marker is stale.
    await detectInstalled({allowUninstall:!!promptEvent,retries:2});
    if(installed)return;
    // v782: notification permission is part of the same PhotoBridge install flow.
    // Browsers still render their own system permission dialog, but users do not need
    // to visit a separate PhotoBridge settings page. If permission is granted, the
    // current lab/photographer account is subscribed immediately.
    try{await window.PB782PreparePushForInstall?.()}catch{}
    if(isiOS()){manualHelp();return}
    const p=promptEvent||window.__PB_INSTALL_PROMPT__||null;
    if(!p){manualHelp();return}
    promptEvent=null;window.__PB_INSTALL_PROMPT__=null;paintInstall();
    try{
      await p.prompt();
      const choice=await p.userChoice;
      if(choice?.outcome==='accepted'){installed=true;writeMarker(true);broadcastInstalled();setTimeout(()=>{void detectInstalled({retries:2})},1200)}
    }catch{}
    paintInstall();
  };

  addEventListener('beforeinstallprompt',e=>{
    e.preventDefault();
    promptEvent=e;window.__PB_INSTALL_PROMPT__=e;
    // Do not erase the installed marker synchronously. That caused the install button
    // to reappear after a normal refresh on some Android/Chromium devices. Keep the
    // current state hidden while we verify. If the PWA was actually removed, the
    // installable signal + repeated related-app check will clear the stale marker.
    if(!readMarker()){installed=false;paintInstall();return}
    installed=true;paintInstall();
    clearTimeout(installVerifyTimer);
    installVerifyTimer=setTimeout(()=>{void detectInstalled({allowUninstall:true,retries:2})},260);
  });
  addEventListener('appinstalled',()=>{
    relatedMisses=0;installed=true;writeMarker(true);broadcastInstalled();promptEvent=null;window.__PB_INSTALL_PROMPT__=null;paintInstall();
    setTimeout(()=>{void detectInstalled({retries:3})},900);
  });
  addEventListener('pageshow',()=>{
    syncThemeChrome();
    if(standalone()){installed=true;writeMarker(true);broadcastInstalled()}
    void detectInstalled({allowUninstall:true,retries:1});
    void checkForAppUpdate();
    schedule(40);
  },{passive:true});
  addEventListener('storage',e=>{
    if(e.key===INSTALL_KEY||e.key===INSTALL_DURABLE_KEY){installed=standalone()||readMarker();paintInstall()}
  });
  addEventListener('visibilitychange',()=>{if(!document.hidden){syncThemeChrome();void detectInstalled({allowUninstall:true,retries:1});void checkForAppUpdate()}},{passive:true});
  addEventListener('focus',()=>{syncThemeChrome();void detectInstalled({allowUninstall:true,retries:1});void checkForAppUpdate()},{passive:true});
  addEventListener('online',()=>{void detectInstalled({allowUninstall:true,retries:1});void checkForAppUpdate()},{passive:true});
  try{matchMedia('(display-mode: standalone)').addEventListener?.('change',()=>{if(standalone()){installed=true;writeMarker(true);broadcastInstalled()}void detectInstalled({allowUninstall:!!promptEvent,retries:1})})}catch{}
  if(installChannel)installChannel.onmessage=e=>{if(e?.data?.installed){installed=true;writeMarker(true);paintInstall()}};


  function startInstallWatcher(){
    clearInterval(installPollTimer);
    installPollTimer=setInterval(()=>{
      if(document.hidden)return;
      void detectInstalled({allowUninstall:true,retries:0});
    },4000);
  }

  async function checkForAppUpdate(){
    if(buildBusy||document.hidden||!navigator.onLine)return;
    buildBusy=true;
    try{
      const r=await fetch(`${BUILD_URL}?t=${Date.now()}`,{cache:'no-store',credentials:'same-origin',headers:{'cache-control':'no-cache'}});
      if(!r.ok)return;
      const d=await r.json().catch(()=>null);
      const remote=String(d?.version||'').trim();
      if(!remote||remote===CURRENT_BUILD)return;
      // Never hard-refresh an authenticated workspace in the background.
      // A previous runtime compared an old embedded build id with the live build marker
      // every 45 seconds and replaced the current URL, which could throw the user out of
      // gallery management / print flows. Record the update and apply it on the user's
      // next normal navigation or manual refresh instead.
      const k=`photobridge:update-ready:${remote}`;
      if(sessionStorage.getItem(k)==='1')return;
      sessionStorage.setItem(k,'1');
      try{window.dispatchEvent(new CustomEvent('photobridge:update-ready',{detail:{version:remote}}))}catch{}
    }catch{}finally{buildBusy=false}
  }

  function startBuildWatcher(){
    clearInterval(buildTimer);
    buildTimer=setInterval(()=>{if(!document.hidden)void checkForAppUpdate()},45000);
  }

  const STORE_ADMIN_ONLY=false;
  function syncAdminOnlyStore(){
    if(!STORE_ADMIN_ONLY)return;
    // Hide only discovery/entry points. Never touch the equipment-store application itself:
    // the v712 broad href selector accidentally changed the working store UI for the admin.
    qsa('.photographerStoreEntry,.photographerStoreMobileNav,.storeLoginNav,.publicAudienceCard.store').forEach(el=>{el.hidden=true;el.setAttribute('aria-hidden','true')});
    qsa('.publicHome a[href="/rental"],.publicHome a[href^="/equipment-rental"],#pbCanonicalHeaderV584 a[href="/rental"],#pbCanonicalHeaderV584 a[href^="/equipment-rental"],#pbCanonicalHeaderV624 a[href="/rental"],#pbCanonicalHeaderV624 a[href^="/equipment-rental"],#pbCanonicalFooterV584 a[href^="/equipment-rental"]').forEach(el=>{el.hidden=true;el.setAttribute('aria-hidden','true')});
    // Admin access stays exactly on the existing "اجاره تجهیزات · تستی" entry.
  }

  const photographerMain=()=>qs('.photographerMain');
  const photographerHeader=()=>qs('#photographerRoleHeaderV710')||qs('.photographerMain>.unifiedRoleHeader.photographerHeaderRefined');
  const routeMode=()=>{
    const p=location.pathname.replace(/\/+$/,'')||'/';
    if(/^\/photographer\/ai(?:\/|$)/.test(p))return 'ai';
    if(p==='/photographer/gallery')return 'gallery';
    if(/^\/photographer\/album-design(?:\/|$)/.test(p))return new URLSearchParams(location.search).get('pb_mode')==='instagram'?'instagram':'album';
    if(/^\/photographer\/store(?:\/|$)/.test(p))return 'store';
    return '';
  };
  const fa=n=>Number(n||0).toLocaleString('fa-IR');
  const filterIcon=()=>'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" stroke-width="2" stroke-linecap="round"/></svg>';
  const gridButtons=()=>{
    const t=qs('.photographerAlbumDesignCatalog .albumDesignModelViewToolbar');
    const a=t?qsa('.albumDesignMobileGridToggle button',t):[];
    return a.length>=2?a:qsa('.photographerAlbumDesignCatalog .albumDesignMobilePicker .albumDesignMobileGridToggle button').slice(0,2);
  };
  const modelCount=()=>{
    const b=qs('.photographerAlbumDesignCatalog .albumDesignModelViewToolbar>b');
    if(b?.textContent?.trim())return b.textContent.trim();
    const n=qsa('.photographerAlbumDesignCatalog .albumDesignModelGrid>.albumDesignModelCard').length;
    return n?`${fa(n)} مدل`:'۰ مدل';
  };
  const galleryCount=()=>`${fa(qsa('.clientGalleryCards>.clientGalleryCard').length)} پروژه`;
  const filterActive=()=>{
    const b=qs('.photographerAlbumDesignCatalog .albumDesignModelViewToolbar .albumDesignMobileTopFilter, .photographerAlbumDesignCatalog .albumDesignCatalogFilters .pb599AlbumFilterButton');
    return !!b?.classList.contains('pb603FilterActive');
  };
  const aiState=()=>qsa('.photographerAiSectionNav>button').slice(0,2).map(x=>x.classList.contains('active')?1:0).join('');

  function contextMarkup(mode){
    if(mode==='ai'){
      const a=qsa('.photographerAiSectionNav>button');
      return `<div class="pb711ContextTitle"><b>هوش مصنوعی</b></div><div class="pb711ContextActions pb711AiActions"><button data-pb711-ai="0" class="${a[0]?.classList.contains('active')?'active':''}">روتوش صورت AI</button><button data-pb711-ai="1" class="${a[1]?.classList.contains('active')?'active':''}">سایر ابزارهای AI</button></div>`;
    }
    if(mode==='gallery'){
      return `<div class="pb711ContextTitle"><b>گالری مشتریان</b><span class="pb711ContextMeta">${galleryCount()}</span></div><div class="pb711ContextActions"><button class="pb711PrimaryAction" data-pb711-gallery-new="1">＋ گالری جدید</button></div>`;
    }
    if(mode==='store'){
      return `<div class="pb711ContextTitle"><b>فروشگاه تجهیزات</b><span class="pb711ContextMeta">فعال</span></div>`;
    }
    if(mode==='album'||mode==='instagram'){
      const g=gridButtons(),two=g[0]?.classList.contains('active'),one=g[1]?.classList.contains('active');
      const title=mode==='instagram'?'طراحی اینستاگرام':'طراحی آلبوم';
      return `<div class="pb711ContextTitle"><b>${title}</b><span class="pb711ContextMeta">${modelCount()}</span></div><div class="pb711ContextActions pb711DesignActions"><button class="pb711FilterButton ${filterActive()?'active':''}" data-pb711-filter="1" aria-label="فیلتر مدل‌ها" title="فیلتر">${filterIcon()}<span>فیلتر</span></button><span class="pb711ViewLabel">نمایش</span><button class="pb711Square ${two?'active':''}" data-pb711-grid="0" aria-label="نمایش دو ستونه" title="دو ستونه">▦</button><button class="pb711Square ${one?'active':''}" data-pb711-grid="1" aria-label="نمایش تک ستونه" title="تک ستونه">▤</button></div>`;
    }
    return '';
  }

  function removeContext(){
    qs('#pb711PhotographerContextBar')?.remove();
    root.classList.remove('pb711ContextVisible','pb711AiContext','pb711GalleryContext','pb711DesignContext','pb711InstagramContext');
    root.style.removeProperty('--pb711-context-top');
  }

  function syncContext(){
    const app=photographerMain(),h=photographerHeader(),mode=routeMode();
    if(mode==='store'){location.replace('/equipment-rental/book');return}
    const blocked=!mobile()||!app||!h||app.classList.contains('photographerPrintWorkspace')||!mode;
    if(blocked){removeContext();return}

    let bar=qs('#pb711PhotographerContextBar');
    if(!bar){
      bar=document.createElement('div');
      bar.id='pb711PhotographerContextBar';
      bar.setAttribute('role','navigation');
      bar.setAttribute('aria-label','ابزارهای سریع صفحه');
      document.body.appendChild(bar);
    }

    const sig=[mode,modelCount(),galleryCount(),filterActive()?1:0,gridButtons().map(x=>x.classList.contains('active')?1:0).join(''),aiState()].join('|');
    if(bar.dataset.sig!==sig){bar.dataset.sig=sig;bar.innerHTML=contextMarkup(mode)}
    const rect=h.getBoundingClientRect();
    root.style.setProperty('--pb711-context-top',`${Math.max(0,Math.round(rect.bottom))}px`);
    root.classList.add('pb711ContextVisible');
    root.classList.toggle('pb711AiContext',mode==='ai');
    root.classList.toggle('pb711GalleryContext',mode==='gallery');
    root.classList.toggle('pb711DesignContext',mode==='album'||mode==='instagram');
    root.classList.toggle('pb711InstagramContext',mode==='instagram');
  }

  function schedule(delay=0){
    if(delay){clearTimeout(timer);timer=setTimeout(()=>schedule(),delay);return}
    if(raf)return;
    raf=requestAnimationFrame(()=>{raf=0;syncAdminOnlyStore();syncContext()});
  }
  const after=()=>{schedule(20);setTimeout(()=>schedule(),90);setTimeout(()=>schedule(),220)};

  document.addEventListener('click',e=>{
    const b=e.target?.closest?.('[data-pb711-ai],[data-pb711-gallery-new],[data-pb711-filter],[data-pb711-grid]');
    if(!b)return;
    if(b.dataset.pb711Ai!==undefined)qsa('.photographerAiSectionNav>button')[Number(b.dataset.pb711Ai)]?.click();
    else if(b.dataset.pb711GalleryNew!==undefined)qs('.clientGalleryListHead>button.primary,.clientGalleryEmpty>button.primary')?.click();
    else if(b.dataset.pb711Filter!==undefined)qs('.photographerAlbumDesignCatalog .albumDesignModelViewToolbar .albumDesignMobileTopFilter,.photographerAlbumDesignCatalog .albumDesignCatalogFilters .pb599AlbumFilterButton')?.click();
    else if(b.dataset.pb711Grid!==undefined)gridButtons()[Number(b.dataset.pb711Grid)]?.click();
    e.preventDefault();e.stopPropagation();after();
  },true);

  document.addEventListener('click',e=>{
    if(e.target?.closest?.('.photographerBottomAppNav button,.photographerAiSectionNav>button,.albumDesignMobileGridToggle button,.clientGalleryListHead>button.primary'))after();
  },true);

  const wrap=n=>{
    const old=history[n];
    if(!old||old.__pb711)return;
    const fn=function(...args){const out=old.apply(this,args);if(location.href!==lastHref){lastHref=location.href;after()}return out};
    fn.__pb711=true;history[n]=fn;
  };
  try{wrap('pushState');wrap('replaceState')}catch{}
  addEventListener('popstate',()=>{lastHref=location.href;after()},{passive:true});
  addEventListener('resize',()=>schedule(70),{passive:true});
  addEventListener('orientationchange',()=>schedule(120),{passive:true});

  function startObserver(){
    observer?.disconnect();
    const target=qs('#root');
    if(!target)return;
    observer=new MutationObserver(()=>schedule(24));
    observer.observe(target,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  }

  if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){
    addEventListener('load',async()=>{
      try{
        const reg=await navigator.serviceWorker.register('/photobridge-sw-v710.js',{scope:'/',updateViaCache:'none'});
        await reg.update().catch(()=>{});
        setInterval(()=>{if(!document.hidden)reg.update().catch(()=>{})},60000);
      }catch{}
    },{once:true});
  }

  const start=()=>{
    syncThemeChrome();startObserver();syncAdminOnlyStore();paintInstall();void detectInstalled({allowUninstall:true,retries:2}).finally(()=>root.classList.remove('pb771InstallChecking'));syncContext();startInstallWatcher();startBuildWatcher();void checkForAppUpdate();setTimeout(()=>{syncThemeChrome();syncAdminOnlyStore();syncContext()},160);setTimeout(()=>{syncThemeChrome();syncAdminOnlyStore();syncContext()},700);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  console.info('[PhotoBridge] v731 print/album mobile alignment + composer controls + PWA auto-update + push bootstrap active');
})();
