/* PhotoBridge mobile context v694 — unified attached blue bars + non-blocking design navigation.
   Route hooks + ResizeObserver only; no polling. Print actions are visual proxies so React DOM stays authoritative. */
(()=>{
  'use strict';
  /* v696 supersedes this runtime when both tags are present. */
  if(document.querySelector('script[src*="photobridge-mobile-context-v696.js"]')){console.info('[PhotoBridge] v694 compatibility runtime skipped because v696 is active');return;}
  const VERSION='v694';
  const MOBILE='(max-width: 820px)';
  let resizeObserver=null;
  let observedHeader=null;
  let transientObserver=null;
  let transientTimer=0;
  let scheduled=false;

  const mobile=()=>{try{return window.matchMedia(MOBILE).matches}catch{return innerWidth<=820}};
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const route=()=>{
    const path=location.pathname.replace(/\/+$/,'')||'/';
    if(/^\/photographer\/ai(?:\/|$)/.test(path))return 'ai';
    if(path==='/photographer/gallery')return 'gallery';
    if(/^\/photographer\/album-design(?:\/|$)/.test(path))return new URLSearchParams(location.search).get('pb_mode')==='instagram'?'instagram':'album';
    return '';
  };
  const header=()=>qs('.photographerMain>.unifiedRoleHeader.photographerHeaderRefined, #photographerStoreRoleHeader');
  const main=()=>qs('.photographerMain');

  function contextSourceReady(mode){
    if(!mode)return true;
    if(mode==='ai')return qsa('.photographerAiSectionNav>button').length>=2;
    if(mode==='gallery')return !!qs('.clientGalleryListHead, .clientGalleryWorkspace');
    if(mode==='album'||mode==='instagram')return !!qs('.photographerAlbumDesignCatalog .albumDesignModelViewToolbar, .photographerAlbumDesignCatalog .albumDesignModelGrid');
    return true;
  }
  function ensureTransientObserver(){
    if(transientObserver||!document.body)return;
    transientObserver=new MutationObserver(()=>{
      const h=header(),mode=route();
      scheduleSync();
      if(h&&contextSourceReady(mode)){
        transientObserver?.disconnect();transientObserver=null;
        if(transientTimer)clearTimeout(transientTimer);transientTimer=0;
      }
    });
    transientObserver.observe(qs('#root')||document.body,{childList:true,subtree:true});
    transientTimer=setTimeout(()=>{transientObserver?.disconnect();transientObserver=null;transientTimer=0;scheduleSync()},2200);
  }

  function scheduleSync(){
    if(scheduled)return;scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;sync()});
  }
  function afterReact(){requestAnimationFrame(()=>requestAnimationFrame(scheduleSync));setTimeout(scheduleSync,70)}

  /* One compact Invite button lives visually beside the bell on every mobile photographer header.
     It stays body-level so changing tabs cannot cause React reconciliation glitches. */
  function ensureInvite(h){
    let btn=qs('#pb694HeaderInviteButton');
    const bell=h?.querySelector('.photographerMobileHeaderQuickActions>.mobileNotificationBell, .photographerMobileHeaderQuickActions .mobileNotificationBell');
    if(!mobile()||!h||!bell){btn&&btn.remove();return}
    if(!btn){
      btn=document.createElement('button');
      btn.id='pb694HeaderInviteButton';
      btn.type='button';
      btn.textContent='دعوت همکار';
      btn.setAttribute('aria-label','دعوت همکار');
      btn.setAttribute('title','دعوت همکار');
      btn.addEventListener('click',ev=>{
        ev.preventDefault();ev.stopPropagation();
        const native=qs('.photographerInviteHeaderBtn');
        if(native){native.click();return}
        location.href='/photographer/settings/invites';
      });
      document.body.appendChild(btn);
    }
    const r=bell.getBoundingClientRect();
    btn.style.left=`${Math.round(r.right+6)}px`;
    btn.style.top=`${Math.round(r.top+4)}px`;
  }

  function filterIcon(){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" stroke-width="2" stroke-linecap="round"/></svg>'}
  function clickAlbumFilter(){
    const source=qs('.photographerAlbumDesignCatalog .albumDesignModelViewToolbar .albumDesignMobileTopFilter, .photographerAlbumDesignCatalog .albumDesignCatalogFilters .pb599AlbumFilterButton');
    source&&source.click();afterReact();
  }
  function albumGridButtons(){
    const toolbar=qs('.photographerAlbumDesignCatalog .albumDesignModelViewToolbar');
    const fromToolbar=toolbar?qsa('.albumDesignMobileGridToggle button',toolbar):[];
    if(fromToolbar.length>=2)return fromToolbar;
    return qsa('.photographerAlbumDesignCatalog .albumDesignMobilePicker .albumDesignMobileGridToggle button').slice(0,2);
  }
  function clickAlbumGrid(index){const b=albumGridButtons()[index];b&&b.click();afterReact()}
  function albumCount(){
    const b=qs('.photographerAlbumDesignCatalog .albumDesignModelViewToolbar>b');
    if(b&&b.textContent?.trim())return b.textContent.trim();
    const n=qsa('.photographerAlbumDesignCatalog .albumDesignModelGrid>.albumDesignModelCard').length;
    return n?`${n.toLocaleString('fa-IR')} مدل`:'';
  }
  function albumFilterActive(){
    const b=qs('.photographerAlbumDesignCatalog .albumDesignModelViewToolbar .albumDesignMobileTopFilter, .photographerAlbumDesignCatalog .albumDesignCatalogFilters .pb599AlbumFilterButton');
    return !!b?.classList.contains('pb603FilterActive');
  }
  function aiState(){
    return qsa('.photographerAiSectionNav>button').slice(0,2).map(x=>x.classList.contains('active')?1:0).join('');
  }

  function contextMarkup(mode){
    if(mode==='ai'){
      const src=qsa('.photographerAiSectionNav>button');
      const retouch=src[0]?.classList.contains('active'),tools=src[1]?.classList.contains('active');
      return `<div class="pb694ContextTitle"><b>هوش مصنوعی</b></div><div class="pb694ContextActions"><button data-pb694-ai="0" class="${retouch?'active':''}">روتوش صورت AI</button><button data-pb694-ai="1" class="${tools?'active':''}">سایر ابزار</button></div>`;
    }
    if(mode==='gallery'){
      return `<div class="pb694ContextTitle"><b>گالری مشتریان</b></div><div class="pb694ContextActions"><button data-pb694-gallery-new="1">＋ گالری جدید</button></div>`;
    }
    if(mode==='album'||mode==='instagram'){
      const buttons=albumGridButtons(),two=buttons[0]?.classList.contains('active'),one=buttons[1]?.classList.contains('active'),count=albumCount();
      const title=mode==='instagram'?'ترای پست اینستاگرام':'طراحی آلبوم';
      return `<div class="pb694ContextTitle"><b>${title}</b>${mode==='instagram'?'<span class="pb694FreeBadge">رایگان</span>':''}${count?`<span class="pb694ModelCount">${count}</span>`:''}</div><div class="pb694ContextActions"><button class="pb694Square pb694FilterButton ${albumFilterActive()?'active':''}" data-pb694-filter="1" aria-label="فیلتر مدل‌ها">${filterIcon()}</button><button class="pb694Square ${two?'active':''}" data-pb694-grid="0" aria-label="نمای دو ستونه">▦</button><button class="pb694Square ${one?'active':''}" data-pb694-grid="1" aria-label="نمای تک ستونه">▤</button></div>`;
    }
    return '';
  }

  function bindContext(bar){
    qsa('[data-pb694-ai]',bar).forEach(btn=>btn.addEventListener('click',()=>{
      const i=Number(btn.getAttribute('data-pb694-ai'));
      qsa('.photographerAiSectionNav>button')[i]?.click();afterReact();
    }));
    qs('[data-pb694-gallery-new]',bar)?.addEventListener('click',()=>{
      qs('.clientGalleryListHead>button.primary, .clientGalleryEmpty>button.primary')?.click();afterReact();
    });
    qs('[data-pb694-filter]',bar)?.addEventListener('click',clickAlbumFilter);
    qsa('[data-pb694-grid]',bar).forEach(btn=>btn.addEventListener('click',()=>clickAlbumGrid(Number(btn.getAttribute('data-pb694-grid')))));
  }

  function ensureContext(h){
    let bar=qs('#pb694PhotographerContextBar');
    const app=main();
    const mode=route();
    const blocked=!mobile()||!h||!app||app.classList.contains('photographerPrintWorkspace')||!mode;
    if(blocked){
      bar&&bar.remove();
      app?.classList.remove('pb694ContextBarActive','pb694DesignContext','pb694AiContext','pb694GalleryContext');
      return;
    }
    if(!bar){
      bar=document.createElement('div');bar.id='pb694PhotographerContextBar';bar.setAttribute('role','navigation');document.body.appendChild(bar);
    }
    const r=h.getBoundingClientRect();
    /* one-pixel overlap removes sub-pixel seams between white header and blue context strip */
    bar.style.top=`${Math.max(0,Math.round(r.bottom)-1)}px`;
    const gridState=albumGridButtons().map(x=>x.classList.contains('active')?1:0).join('');
    const signature=`${mode}|${albumCount()}|${albumFilterActive()?1:0}|${gridState}|${aiState()}`;
    if(bar.dataset.signature!==signature){
      bar.dataset.signature=signature;bar.dataset.mode=mode;bar.innerHTML=contextMarkup(mode);bindContext(bar);
    }
    app.classList.add('pb694ContextBarActive');
    app.classList.toggle('pb694DesignContext',mode==='album'||mode==='instagram');
    app.classList.toggle('pb694AiContext',mode==='ai');
    app.classList.toggle('pb694GalleryContext',mode==='gallery');
  }

  /* Print keeps its real active-lab selector. Archive/Invoice are overlaid inside that same blue strip,
     proxying the React-owned source actions. */
  function ensurePrintActions(){
    let wrap=qs('#pb694PrintBarActions');
    const app=main();
    const labBar=qs('.photographerMain.photographerPrintWorkspace .photographerPrintModeHeader .photographerPrintTopLab');
    const archive=qs('.photographerPrintModeUtilityCluster .photographerPrintCommonAction.archive');
    const finance=qs('.photographerPrintModeUtilityCluster .photographerPrintCommonAction.finance');
    if(!mobile()||!app?.classList.contains('photographerPrintWorkspace')||!labBar||!archive||!finance){wrap&&wrap.remove();return}
    if(!wrap){
      wrap=document.createElement('div');wrap.id='pb694PrintBarActions';
      wrap.innerHTML='<button type="button" data-pb694-print="archive">آرشیو</button><button type="button" data-pb694-print="finance">فاکتور</button>';
      wrap.addEventListener('click',ev=>{
        const btn=ev.target.closest?.('[data-pb694-print]');if(!btn)return;
        ev.preventDefault();ev.stopPropagation();
        const type=btn.getAttribute('data-pb694-print');
        qs(`.photographerPrintModeUtilityCluster .photographerPrintCommonAction.${type}`)?.click();afterReact();
      });
      document.body.appendChild(wrap);
    }
    const r=labBar.getBoundingClientRect();
    wrap.style.top=`${Math.round(r.top+6)}px`;
    wrap.style.left='8px';
    wrap.style.height=`${Math.max(28,Math.round(r.height-12))}px`;
    const a=qs('[data-pb694-print="archive"]',wrap),f=qs('[data-pb694-print="finance"]',wrap);
    a?.classList.toggle('active',archive.classList.contains('active'));
    f?.classList.toggle('active',finance.classList.contains('active'));
  }

  function tuneCatalog(){
    if(!mobile()||!/^\/photographer\/album-design(?:\/|$)/.test(location.pathname))return;
    const run=()=>qsa('.photographerAlbumDesignCatalog .albumDesignModelGrid img').forEach(img=>{
      img.loading='lazy';img.decoding='async';try{img.fetchPriority='low'}catch{}
    });
    if('requestIdleCallback'in window)window.requestIdleCallback(run,{timeout:180});else setTimeout(run,40);
  }

  function observeHeader(h){
    if(observedHeader===h)return;
    resizeObserver?.disconnect();observedHeader=h;
    if(h&&'ResizeObserver'in window){resizeObserver=new ResizeObserver(scheduleSync);resizeObserver.observe(h)}
  }

  function cleanupLegacy(){
    qs('#pb693PhotographerContextBar')?.remove();
    qs('#pb693GlobalInviteButton')?.remove();
    document.documentElement.classList.remove('pb693FastNavigate');
    main()?.classList.remove('pb693ContextBarActive','pb693DesignContext','pb693AiContext','pb693GalleryContext');
  }

  function sync(){
    cleanupLegacy();
    const h=header(),mode=route();
    if(!h||!contextSourceReady(mode))ensureTransientObserver();
    observeHeader(h);ensureInvite(h);ensureContext(h);ensurePrintActions();tuneCatalog();
    if(!/^\/photographer\/album-design(?:\/|$)/.test(location.pathname))document.documentElement.classList.remove('pb694FastNavigate');
  }

  /* Release expensive off-screen model paint as soon as the user starts a bottom-nav switch. */
  document.addEventListener('pointerdown',ev=>{
    if(!mobile())return;
    const target=ev.target?.closest?.('.photographerBottomAppNav button');
    if(!target||!qs('.photographerAlbumDesignCatalog'))return;
    document.documentElement.classList.add('pb694FastNavigate');
  },true);

  const wrapHistory=name=>{
    const original=history[name];if(original.__pb694)return;
    const wrapped=function(...args){const out=original.apply(this,args);scheduleSync();return out};
    wrapped.__pb694=true;history[name]=wrapped;
  };
  try{wrapHistory('pushState');wrapHistory('replaceState')}catch{}
  window.addEventListener('popstate',scheduleSync,{passive:true});
  window.addEventListener('pageshow',scheduleSync,{passive:true});
  window.addEventListener('resize',scheduleSync,{passive:true});
  document.addEventListener('DOMContentLoaded',scheduleSync,{once:true});
  if(document.readyState!=='loading')scheduleSync();
  console.info('[PhotoBridge] unified mobile header/context bars',VERSION);
})();
