/* PhotoBridge v706 — consolidated low-overhead UI/PWA runtime. */
(()=>{
  'use strict';
  if(window.__PB706_RUNTIME__)return;
  window.__PB706_RUNTIME__=true;
  const MOBILE='(max-width: 820px)';
  const qs=(s,r=document)=>r?.querySelector?.(s)||null;
  const qsa=(s,r=document)=>r?.querySelectorAll?[...r.querySelectorAll(s)]:[];
  const mobile=()=>{try{return matchMedia(MOBILE).matches}catch{return innerWidth<=820}};
  const standalone=()=>{try{return matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches||navigator.standalone===true}catch{return navigator.standalone===true}};
  const isiOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(/macintosh/i.test(navigator.userAgent)&&navigator.maxTouchPoints>1);
  let installPrompt=null,raf=0,timer=0,observer=null,lastHref=location.href;
  const schedule=(delay=0)=>{
    if(delay){clearTimeout(timer);timer=setTimeout(()=>schedule(),delay);return}
    if(raf)return;raf=requestAnimationFrame(()=>{raf=0;sync()});
  };
  const after=()=>{schedule(35);setTimeout(()=>schedule(),120)};
  const main=()=>qs('.photographerMain');
  const header=()=>qs('#photographerStoreRoleHeader')||qs('.photographerMain>.unifiedRoleHeader.photographerHeaderRefined');
  const route=()=>{
    const p=location.pathname.replace(/\/+$/,'')||'/';
    if(/^\/photographer\/ai(?:\/|$)/.test(p))return 'ai';
    if(p==='/photographer/gallery')return 'gallery';
    if(/^\/photographer\/album-design(?:\/|$)/.test(p))return new URLSearchParams(location.search).get('pb_mode')==='instagram'?'instagram':'album';
    return '';
  };

  function ensureSecondRow(h){
    if(!h)return null;
    let row=qs(':scope>.pb704MobileSecondaryActions',h);
    if(!row){row=document.createElement('div');row.className='pb704MobileSecondaryActions';h.appendChild(row)}
    return row;
  }
  function normalizeInvite(h,second){
    if(!h||!second)return null;
    const all=qsa('.mobileHeaderInvite',h);let invite=all.shift()||null;all.forEach(x=>x.remove());
    if(!invite){invite=document.createElement('button');invite.type='button';invite.className='mobileHeaderInvite';invite.addEventListener('click',e=>{e.preventDefault();location.href='/photographer/settings/invites'})}
    invite.id='pb706HeaderInviteButton';invite.title='دعوت همکار';invite.setAttribute('aria-label','دعوت همکار');
    let label=qs(':scope>.pb704InviteLabel',invite);if(!label){label=document.createElement('span');label.className='pb698InviteLabel pb704InviteLabel'}
    label.textContent='دعوت همکار';invite.replaceChildren(label);second.appendChild(invite);return invite;
  }
  function installHelp(){
    let overlay=qs('#pb704InstallOverlay');
    if(!overlay){
      overlay=document.createElement('div');overlay.id='pb704InstallOverlay';overlay.hidden=true;
      overlay.innerHTML='<section id="pb704InstallSheet" role="dialog" aria-modal="true" aria-labelledby="pb704InstallTitle"><div class="pb704InstallHead"><b id="pb704InstallTitle">نصب PhotoBridge</b><button class="pb704InstallClose" type="button" aria-label="بستن">×</button></div><div class="pb704InstallBody"></div><button class="pb704InstallPrimary" type="button">متوجه شدم</button></section>';
      document.body.appendChild(overlay);const close=()=>overlay.hidden=true;
      qs('.pb704InstallClose',overlay).onclick=close;qs('.pb704InstallPrimary',overlay).onclick=close;overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
    }
    const body=qs('.pb704InstallBody',overlay);
    if(isiOS())body.innerHTML='<p>در iPhone و iPad نصب از Safari انجام می‌شود:</p><ol><li>Share / اشتراک‌گذاری را بزنید.</li><li>Add to Home Screen / افزودن به صفحه اصلی را انتخاب کنید.</li><li>Add / افزودن را تأیید کنید.</li></ol>';
    else body.innerHTML='<p>اگر پنجره نصب مستقیم نمایش داده نشد، از منوی Chrome گزینه «Install app / نصب برنامه» را انتخاب کنید.</p>';
    overlay.hidden=false;
  }
  async function requestInstall(){
    if(standalone())return;
    if(installPrompt){const p=installPrompt;installPrompt=null;try{await p.prompt();await p.userChoice}catch{}after();return}
    installHelp();
  }
  function ensureInstall(second){
    if(!second)return null;let b=qs(':scope>.mobileHeaderInstall',second);
    if(!b){b=document.createElement('button');b.type='button';b.className='mobileHeaderInstall';b.innerHTML='<span class="pb704InstallGlyph" aria-hidden="true">↧</span><span>نصب برنامه</span>';b.title='نصب PhotoBridge روی گوشی';b.setAttribute('aria-label','نصب برنامه PhotoBridge');b.addEventListener('click',requestInstall);second.appendChild(b)}
    b.classList.toggle('pb704Installed',standalone());return b;
  }
  function normalizeMobileHeader(h){
    if(!mobile()||!h)return;const primary=qs('.photographerMobileHeaderQuickActions',h);if(!primary)return;
    qsa('.photographerMobileAiInviteRow',h).forEach(x=>x.remove());
    const second=ensureSecondRow(h),invite=normalizeInvite(h,second),install=ensureInstall(second);
    const bell=qs('.mobileNotificationBell',primary),power=qs('.mobileHeaderPower',primary),settings=qs('.mobileHeaderSettings',primary),wallet=qs('.mobileHeaderWallet',primary);
    [bell,power,settings,wallet].filter(Boolean).forEach(x=>primary.appendChild(x));if(invite)second.appendChild(invite);if(install)second.appendChild(install);
    primary.classList.add('pb704MobilePrimaryActions');h.classList.add('pb704TwoLineMobileHeader');
  }

  function ensureDesktopInstagram(nav){
    if(!nav||mobile())return;if(qs('button[data-main-href="/photographer/album-design?pb_mode=instagram"]',nav)||qs('.photographerInstagramDesignEntry',nav))return;
    const b=document.createElement('button');b.type='button';b.className='rolePrimaryAction photographerInstagramDesignEntry';b.textContent='طراحی اینستاگرام';b.addEventListener('click',()=>location.assign('/photographer/album-design?pb_mode=instagram'));
    const store=qs('.photographerStoreEntry,.storeDesktopPrimary',nav);if(store)nav.insertBefore(b,store);else nav.appendChild(b);
  }
  function decorateDesktopHeader(h){
    if(!h||mobile()||h.classList.contains('photographerPrintModeHeader'))return;
    const nav=qs(':scope>.photographerHomeModeNav,:scope>.photographerHeaderNav',h),tools=qs(':scope>.photographerHeaderTools,:scope>.roleHeaderCenter',h),identity=qs(':scope>.photographerHeaderIdentity,:scope>.workspaceIdentity',h);if(!nav||!tools||!identity)return;
    ensureDesktopInstagram(nav);const toolButtons=qs('.roleHeaderToolButtons',tools);
    if(h.id==='photographerStoreRoleHeader'&&toolButtons&&!qs('.photographerInviteHeaderBtn',toolButtons)){
      const invite=document.createElement('button');invite.type='button';invite.className='headerUtilityBtn photographerInviteHeaderBtn';invite.textContent='دعوت همکار';invite.title='دعوت همکار';invite.addEventListener('click',()=>location.assign('/photographer/settings/invites'));
      const bell=qs('#storeDesktopNotificationBtn,.systemNotificationBell',toolButtons);if(bell)toolButtons.insertBefore(invite,bell);else toolButtons.appendChild(invite);
    }
    h.classList.add('pb704DesktopPhotographerHeader');nav.classList.add('pb704DesktopPrimaryNav');tools.classList.add('pb704DesktopTools');
    let sep=qs(':scope>.pb704DesktopHeaderSeparator',h);if(!sep){sep=document.createElement('span');sep.className='pb704DesktopHeaderSeparator';sep.setAttribute('aria-hidden','true');h.insertBefore(sep,tools)}
  }
  function setupDesktopStore(){
    if(mobile())return;const root=qs('#storePhotographerWorkspace'),nav=qs('#storeSectionNavV673');if(!root||!nav)return;
    decorateDesktopHeader(qs('#photographerStoreRoleHeader'));nav.classList.add('pb704DesktopStoreTabs');
  }

  function filterIcon(){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" stroke-width="2" stroke-linecap="round"/></svg>'}
  function gridButtons(){const t=qs('.photographerAlbumDesignCatalog .albumDesignModelViewToolbar');const a=t?qsa('.albumDesignMobileGridToggle button',t):[];return a.length>=2?a:qsa('.photographerAlbumDesignCatalog .albumDesignMobilePicker .albumDesignMobileGridToggle button').slice(0,2)}
  function modelCount(){const b=qs('.photographerAlbumDesignCatalog .albumDesignModelViewToolbar>b');if(b?.textContent?.trim())return b.textContent.trim();const n=qsa('.photographerAlbumDesignCatalog .albumDesignModelGrid>.albumDesignModelCard').length;return n?`${n.toLocaleString('fa-IR')} مدل`:''}
  function filterActive(){const b=qs('.photographerAlbumDesignCatalog .albumDesignModelViewToolbar .albumDesignMobileTopFilter, .photographerAlbumDesignCatalog .albumDesignCatalogFilters .pb599AlbumFilterButton');return !!b?.classList.contains('pb603FilterActive')}
  function aiState(){return qsa('.photographerAiSectionNav>button').slice(0,2).map(x=>x.classList.contains('active')?1:0).join('')}
  function contextMarkup(mode){
    if(mode==='ai'){const a=qsa('.photographerAiSectionNav>button');return `<div class="pb698ContextTitle"><b>هوش مصنوعی</b></div><div class="pb698ContextActions"><button data-pb698-ai="0" class="${a[0]?.classList.contains('active')?'active':''}">روتوش صورت AI</button><button data-pb698-ai="1" class="${a[1]?.classList.contains('active')?'active':''}">سایر ابزار</button></div>`}
    if(mode==='gallery')return '<div class="pb698ContextTitle"><b>گالری مشتریان</b></div><div class="pb698ContextActions"><button data-pb698-gallery-new="1">＋ گالری جدید</button></div>';
    if(mode==='album'||mode==='instagram'){const g=gridButtons(),two=g[0]?.classList.contains('active'),one=g[1]?.classList.contains('active'),count=modelCount(),title=mode==='instagram'?'طراحی اینستاگرام':'طراحی آلبوم';return `<div class="pb698ContextTitle"><b>${title}</b>${mode==='instagram'?'<span class="pb698FreeBadge">رایگان</span>':''}${count?`<span class="pb698ModelCount">${count}</span>`:''}</div><div class="pb698ContextActions"><button class="pb698Square pb698FilterButton ${filterActive()?'active':''}" data-pb698-filter="1" aria-label="فیلتر">${filterIcon()}</button><button class="pb698Square ${two?'active':''}" data-pb698-grid="0" aria-label="دو ستونه">▦</button><button class="pb698Square ${one?'active':''}" data-pb698-grid="1" aria-label="تک ستونه">▤</button></div>`}
    return '';
  }
  function ensureContext(h){
    const app=main(),mode=route();let bar=qs('#pb698PhotographerContextBar');const blocked=!mobile()||!app||!h||app.classList.contains('photographerPrintWorkspace')||!mode;
    if(blocked){bar?.remove();app?.classList.remove('pb698ContextBarActive','pb698DesignContext','pb698AiContext','pb698GalleryContext');return}
    if(!bar){bar=document.createElement('div');bar.id='pb698PhotographerContextBar';bar.setAttribute('role','navigation')}
    if(bar.parentElement!==app||bar.previousElementSibling!==h)h.insertAdjacentElement('afterend',bar);
    const sig=`${mode}|${modelCount()}|${filterActive()?1:0}|${gridButtons().map(x=>x.classList.contains('active')?1:0).join('')}|${aiState()}`;
    if(bar.dataset.sig!==sig){bar.dataset.sig=sig;bar.innerHTML=contextMarkup(mode)}
    app.classList.add('pb698ContextBarActive');app.classList.toggle('pb698DesignContext',mode==='album'||mode==='instagram');app.classList.toggle('pb698AiContext',mode==='ai');app.classList.toggle('pb698GalleryContext',mode==='gallery');
  }
  function ensurePrintActions(){
    const app=main(),lab=qs('.photographerMain.photographerPrintWorkspace .photographerPrintModeHeader .photographerPrintTopLab'),archive=qs('.photographerPrintModeUtilityCluster .photographerPrintCommonAction.archive'),finance=qs('.photographerPrintModeUtilityCluster .photographerPrintCommonAction.finance');let w=qs('#pb698PrintBarActions');
    if(!mobile()||!app?.classList.contains('photographerPrintWorkspace')||!lab||!archive||!finance){w?.remove();return}
    if(!w){w=document.createElement('div');w.id='pb698PrintBarActions';w.innerHTML='<button data-pb698-print="archive">آرشیو</button><button data-pb698-print="finance">فاکتور</button>';document.body.appendChild(w)}
    const r=lab.getBoundingClientRect();w.style.top=`${Math.round(r.top+6)}px`;w.style.left='8px';w.style.height=`${Math.max(28,Math.round(r.height-12))}px`;qs('[data-pb698-print="archive"]',w)?.classList.toggle('active',archive.classList.contains('active'));qs('[data-pb698-print="finance"]',w)?.classList.toggle('active',finance.classList.contains('active'));
  }
  function ensureCatalogLoader(mode){
    let l=qs('#pb698CatalogLoader');if(!mobile()||!(mode==='album'||mode==='instagram')){l?.remove();return}
    const area=qs('.photographerMain>.photographerRolePageScrollArea');if(!area)return;const native=qs('.photographerAlbumDesignCatalog .albumDesignSavedLoading'),cards=qsa('.photographerAlbumDesignCatalog .albumDesignModelGrid>.albumDesignModelCard'),empty=qs('.photographerAlbumDesignCatalog .albumDesignNoSavedModels');
    let waiting=!!native||(!cards.length&&!empty);const imgs=qsa('.photographerAlbumDesignCatalog .albumDesignModelGrid>.albumDesignModelCard img').slice(0,4);
    imgs.forEach((img,i)=>{img.loading=i<2?'eager':'lazy';img.decoding='async';try{img.fetchPriority=i<2?'high':'low'}catch{};if(!img.complete){waiting=true;if(!img.dataset.pb706Watch){img.dataset.pb706Watch='1';img.addEventListener('load',after,{once:true});img.addEventListener('error',after,{once:true})}}});
    if(!waiting){l?.remove();return}if(!l){l=document.createElement('div');l.id='pb698CatalogLoader';l.className='pb698CatalogLoader';l.setAttribute('role','status');area.prepend(l)}l.textContent=mode==='instagram'?'در حال بارگذاری طرح‌های اینستاگرام…':'در حال بارگذاری طرح‌ها…';
  }
  function cleanupStaleGuideButtons(){const printNav=qs('.photographerPrintWorkspace .photographerPrintModeNav');qsa('.pb569WorkflowGuideButton').forEach(btn=>{if(!printNav||!printNav.contains(btn))btn.remove()})}

  function sync(){
    const h=header();
    if(mobile()){if(h)normalizeMobileHeader(h);ensureContext(h);ensurePrintActions();ensureCatalogLoader(route())}
    else{qs('#pb698PhotographerContextBar')?.remove();qs('#pb698PrintBarActions')?.remove();qsa('.photographerMain>.photographerHeaderRefined:not(.photographerPrintModeHeader)').forEach(decorateDesktopHeader);decorateDesktopHeader(qs('#photographerStoreRoleHeader'));setupDesktopStore()}
    cleanupStaleGuideButtons();lastHref=location.href;
  }

  document.addEventListener('click',e=>{
    const b=e.target?.closest?.('[data-pb698-ai],[data-pb698-gallery-new],[data-pb698-filter],[data-pb698-grid],[data-pb698-print]');
    if(b){
      if(b.dataset.pb698Ai!==undefined)qsa('.photographerAiSectionNav>button')[Number(b.dataset.pb698Ai)]?.click();
      else if(b.dataset.pb698GalleryNew!==undefined)qs('.clientGalleryListHead>button.primary,.clientGalleryEmpty>button.primary')?.click();
      else if(b.dataset.pb698Filter!==undefined)qs('.photographerAlbumDesignCatalog .albumDesignModelViewToolbar .albumDesignMobileTopFilter,.photographerAlbumDesignCatalog .albumDesignCatalogFilters .pb599AlbumFilterButton')?.click();
      else if(b.dataset.pb698Grid!==undefined)gridButtons()[Number(b.dataset.pb698Grid)]?.click();
      else if(b.dataset.pb698Print)qs(`.photographerPrintModeUtilityCluster .photographerPrintCommonAction.${b.dataset.pb698Print}`)?.click();
      e.preventDefault();after();return;
    }
    if(e.target?.closest?.('.photographerBottomAppNav button,.photographerPrintModeNav>.rolePrimaryAction,#storeSectionNavV673 [data-store-panel],.photographerAiSectionNav>button,.albumDesignMobileGridToggle button'))after();
  },true);
  const wrap=n=>{const old=history[n];if(!old||old.__pb706)return;const fn=function(...args){const out=old.apply(this,args);if(location.href!==lastHref)after();return out};fn.__pb706=true;history[n]=fn};
  try{wrap('pushState');wrap('replaceState')}catch{}
  addEventListener('popstate',after,{passive:true});addEventListener('pageshow',after,{passive:true});addEventListener('resize',()=>schedule(80),{passive:true});
  addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;after()});addEventListener('appinstalled',()=>{installPrompt=null;after()});

  function startObserver(){
    observer?.disconnect();observer=new MutationObserver(()=>schedule(32));const target=qs('#root')||qs('#storePhotographerWorkspace')||document.body;if(target)observer.observe(target,{childList:true,subtree:true});
  }
  if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1'))addEventListener('load',()=>navigator.serviceWorker.register('/photobridge-sw-v706.js',{scope:'/'}).catch(()=>{}),{once:true});
  const start=()=>{startObserver();sync();setTimeout(sync,180);setTimeout(sync,800)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  console.info('[PhotoBridge] v706 consolidated low-overhead runtime active');
})();
