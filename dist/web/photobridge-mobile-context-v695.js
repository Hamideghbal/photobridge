/* PhotoBridge mobile context v695 — fixed chrome + in-flow context bar + responsive catalog loading. */
(()=>{
  'use strict';
  const VERSION='v695';
  const MOBILE='(max-width: 820px)';
  let resizeObserver=null,observedHeader=null,transientObserver=null,transientTimer=0,scheduled=false;
  const mobile=()=>{try{return window.matchMedia(MOBILE).matches}catch{return innerWidth<=820}};
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const main=()=>qs('.photographerMain');
  const header=()=>qs('.photographerMain>.unifiedRoleHeader.photographerHeaderRefined, #photographerStoreRoleHeader');
  const route=()=>{
    const path=location.pathname.replace(/\/+$/,'')||'/';
    if(/^\/photographer\/ai(?:\/|$)/.test(path))return 'ai';
    if(path==='/photographer/gallery')return 'gallery';
    if(/^\/photographer\/album-design(?:\/|$)/.test(path))return new URLSearchParams(location.search).get('pb_mode')==='instagram'?'instagram':'album';
    return '';
  };
  const afterReact=()=>{requestAnimationFrame(()=>requestAnimationFrame(scheduleSync));setTimeout(scheduleSync,70)};
  function scheduleSync(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;sync()})}

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
      scheduleSync();
      const h=header(),mode=route();
      if(h&&contextSourceReady(mode)){
        transientObserver?.disconnect();transientObserver=null;
        if(transientTimer)clearTimeout(transientTimer);transientTimer=0;
      }
    });
    transientObserver.observe(qs('#root')||document.body,{childList:true,subtree:true});
    transientTimer=setTimeout(()=>{transientObserver?.disconnect();transientObserver=null;transientTimer=0;scheduleSync()},2600);
  }

  function cleanOldChrome(){
    qsa('.photographerMobileAiInviteRow').forEach(x=>x.remove());
    qs('#pb694HeaderInviteButton')?.remove();
    qs('#pb693GlobalInviteButton')?.remove();
    qs('#pb694PhotographerContextBar')?.remove();
    qs('#pb694PrintBarActions')?.remove();
    const app=main();
    app?.classList.remove('pb694ContextBarActive','pb694DesignContext','pb694AiContext','pb694GalleryContext','pb693ContextBarActive','pb693DesignContext','pb693AiContext','pb693GalleryContext');
    document.documentElement.classList.remove('pb694FastNavigate','pb693FastNavigate');
  }

  function clickDesktopAction(selector,fallback){
    const native=qs(selector);
    if(native){native.click();afterReact();return}
    if(fallback)location.href=fallback;
  }

  function ensureHeaderActions(h){
    const row=h?.querySelector('.photographerMobileHeaderQuickActions');
    if(!mobile()||!h||!row){qs('#pb695HeaderInviteButton')?.remove();qs('#pb695HeaderSettingsButton')?.remove();return}
    qsa('.photographerMobileAiInviteRow').forEach(x=>x.remove());

    let settings=Array.from(row.children).find(x=>x.classList?.contains('mobileHeaderSettings'));
    if(!settings){
      settings=document.createElement('button');
      settings.id='pb695HeaderSettingsButton';
      settings.className='mobileHeaderSettings';
      settings.type='button';
      settings.innerHTML='<span aria-hidden="true">⚙</span>';
      settings.setAttribute('title','تنظیمات عکاسی');
      settings.setAttribute('aria-label','تنظیمات عکاسی');
      settings.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();clickDesktopAction('.photographerHeaderTools .settingsIconBtn','/photographer/settings')});
      const wallet=row.querySelector('.mobileHeaderWallet');
      wallet?row.insertBefore(settings,wallet):row.appendChild(settings);
    }

    let invite=row.querySelector('.mobileHeaderInvite,#pb695HeaderInviteButton');
    if(!invite){
      invite=document.createElement('button');
      invite.id='pb695HeaderInviteButton';
      invite.className='mobileHeaderInvite';
      invite.type='button';
      invite.textContent='دعوت همکار';
      invite.setAttribute('aria-label','دعوت همکار');
      invite.setAttribute('title','دعوت همکار');
      invite.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();clickDesktopAction('.photographerInviteHeaderBtn','/photographer/settings/invites')});
      const wallet=row.querySelector('.mobileHeaderWallet');
      wallet?row.insertBefore(invite,wallet):row.appendChild(invite);
    }
  }

  function filterIcon(){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" stroke-width="2" stroke-linecap="round"/></svg>'}
  function albumGridButtons(){
    const toolbar=qs('.photographerAlbumDesignCatalog .albumDesignModelViewToolbar');
    const a=toolbar?qsa('.albumDesignMobileGridToggle button',toolbar):[];
    return a.length>=2?a:qsa('.photographerAlbumDesignCatalog .albumDesignMobilePicker .albumDesignMobileGridToggle button').slice(0,2);
  }
  function albumCount(){
    const b=qs('.photographerAlbumDesignCatalog .albumDesignModelViewToolbar>b');
    if(b&&b.textContent?.trim())return b.textContent.trim();
    const n=qsa('.photographerAlbumDesignCatalog .albumDesignModelGrid>.albumDesignModelCard').length;
    return n?`${n.toLocaleString('fa-IR')} مدل`:'';
  }
  function albumFilterActive(){const b=qs('.photographerAlbumDesignCatalog .albumDesignModelViewToolbar .albumDesignMobileTopFilter, .photographerAlbumDesignCatalog .albumDesignCatalogFilters .pb599AlbumFilterButton');return !!b?.classList.contains('pb603FilterActive')}
  function aiState(){return qsa('.photographerAiSectionNav>button').slice(0,2).map(x=>x.classList.contains('active')?1:0).join('')}
  function clickAlbumFilter(){qs('.photographerAlbumDesignCatalog .albumDesignModelViewToolbar .albumDesignMobileTopFilter, .photographerAlbumDesignCatalog .albumDesignCatalogFilters .pb599AlbumFilterButton')?.click();afterReact()}
  function clickAlbumGrid(i){albumGridButtons()[i]?.click();afterReact()}

  function contextMarkup(mode){
    if(mode==='ai'){
      const src=qsa('.photographerAiSectionNav>button'),retouch=src[0]?.classList.contains('active'),tools=src[1]?.classList.contains('active');
      return `<div class="pb695ContextTitle"><b>هوش مصنوعی</b></div><div class="pb695ContextActions"><button data-pb695-ai="0" class="${retouch?'active':''}">روتوش صورت AI</button><button data-pb695-ai="1" class="${tools?'active':''}">سایر ابزار</button></div>`;
    }
    if(mode==='gallery')return '<div class="pb695ContextTitle"><b>گالری مشتریان</b></div><div class="pb695ContextActions"><button data-pb695-gallery-new="1">＋ گالری جدید</button></div>';
    if(mode==='album'||mode==='instagram'){
      const buttons=albumGridButtons(),two=buttons[0]?.classList.contains('active'),one=buttons[1]?.classList.contains('active'),count=albumCount(),title=mode==='instagram'?'طراحی اینستاگرام':'طراحی آلبوم';
      return `<div class="pb695ContextTitle"><b>${title}</b>${mode==='instagram'?'<span class="pb695FreeBadge">رایگان</span>':''}${count?`<span class="pb695ModelCount">${count}</span>`:''}</div><div class="pb695ContextActions"><button class="pb695Square pb695FilterButton ${albumFilterActive()?'active':''}" data-pb695-filter="1" aria-label="فیلتر مدل‌ها">${filterIcon()}</button><button class="pb695Square ${two?'active':''}" data-pb695-grid="0" aria-label="نمای دو ستونه">▦</button><button class="pb695Square ${one?'active':''}" data-pb695-grid="1" aria-label="نمای تک ستونه">▤</button></div>`;
    }
    return '';
  }
  function bindContext(bar){
    qsa('[data-pb695-ai]',bar).forEach(btn=>btn.addEventListener('click',()=>{qsa('.photographerAiSectionNav>button')[Number(btn.getAttribute('data-pb695-ai'))]?.click();afterReact()}));
    qs('[data-pb695-gallery-new]',bar)?.addEventListener('click',()=>{qs('.clientGalleryListHead>button.primary, .clientGalleryEmpty>button.primary')?.click();afterReact()});
    qs('[data-pb695-filter]',bar)?.addEventListener('click',clickAlbumFilter);
    qsa('[data-pb695-grid]',bar).forEach(btn=>btn.addEventListener('click',()=>clickAlbumGrid(Number(btn.getAttribute('data-pb695-grid')))));
  }
  function ensureContext(h){
    let bar=qs('#pb695PhotographerContextBar');
    const app=main(),mode=route(),blocked=!mobile()||!h||!app||app.classList.contains('photographerPrintWorkspace')||!mode;
    if(blocked){bar?.remove();app?.classList.remove('pb695ContextBarActive','pb695DesignContext','pb695AiContext','pb695GalleryContext');return}
    if(!bar){bar=document.createElement('div');bar.id='pb695PhotographerContextBar';bar.setAttribute('role','navigation')}
    if(bar.parentElement!==app||bar.previousElementSibling!==h)h.insertAdjacentElement('afterend',bar);
    const gridState=albumGridButtons().map(x=>x.classList.contains('active')?1:0).join('');
    const signature=`${mode}|${albumCount()}|${albumFilterActive()?1:0}|${gridState}|${aiState()}`;
    if(bar.dataset.signature!==signature){bar.dataset.signature=signature;bar.dataset.mode=mode;bar.innerHTML=contextMarkup(mode);bindContext(bar)}
    app.classList.add('pb695ContextBarActive');
    app.classList.toggle('pb695DesignContext',mode==='album'||mode==='instagram');
    app.classList.toggle('pb695AiContext',mode==='ai');
    app.classList.toggle('pb695GalleryContext',mode==='gallery');
  }

  function ensurePrintActions(){
    let wrap=qs('#pb695PrintBarActions');
    const app=main(),labBar=qs('.photographerMain.photographerPrintWorkspace .photographerPrintModeHeader .photographerPrintTopLab'),archive=qs('.photographerPrintModeUtilityCluster .photographerPrintCommonAction.archive'),finance=qs('.photographerPrintModeUtilityCluster .photographerPrintCommonAction.finance');
    if(!mobile()||!app?.classList.contains('photographerPrintWorkspace')||!labBar||!archive||!finance){wrap?.remove();return}
    if(!wrap){
      wrap=document.createElement('div');wrap.id='pb695PrintBarActions';
      wrap.innerHTML='<button type="button" data-pb695-print="archive">آرشیو</button><button type="button" data-pb695-print="finance">فاکتور</button>';
      wrap.addEventListener('click',ev=>{const btn=ev.target.closest?.('[data-pb695-print]');if(!btn)return;ev.preventDefault();ev.stopPropagation();qs(`.photographerPrintModeUtilityCluster .photographerPrintCommonAction.${btn.getAttribute('data-pb695-print')}`)?.click();afterReact()});
      document.body.appendChild(wrap);
    }
    const r=labBar.getBoundingClientRect();
    wrap.style.top=`${Math.round(r.top+6)}px`;wrap.style.left='8px';wrap.style.height=`${Math.max(28,Math.round(r.height-12))}px`;
    qs('[data-pb695-print="archive"]',wrap)?.classList.toggle('active',archive.classList.contains('active'));
    qs('[data-pb695-print="finance"]',wrap)?.classList.toggle('active',finance.classList.contains('active'));
  }

  function tuneCatalog(mode){
    if(!mobile()||!(mode==='album'||mode==='instagram'))return;
    const imgs=qsa('.photographerAlbumDesignCatalog .albumDesignModelGrid img');
    imgs.forEach((img,i)=>{
      img.decoding='async';
      if(i<8){img.loading='eager';try{img.fetchPriority=i<4?'high':'auto'}catch{}}
      else{img.loading='lazy';try{img.fetchPriority='low'}catch{}}
    });
  }

  function ensureCatalogLoader(mode){
    let loader=qs('#pb695CatalogLoader');
    if(!mobile()||!(mode==='album'||mode==='instagram')){loader?.remove();return}
    const area=qs('.photographerMain>.photographerRolePageScrollArea');
    if(!area)return;
    const nativeLoading=qs('.photographerAlbumDesignCatalog .albumDesignSavedLoading');
    const cards=qsa('.photographerAlbumDesignCatalog .albumDesignModelGrid>.albumDesignModelCard');
    const noModels=qs('.photographerAlbumDesignCatalog .albumDesignNoSavedModels');
    let waiting=!!nativeLoading||(!cards.length&&!noModels),text='در حال بارگذاری طرح‌ها…';
    if(!waiting&&cards.length){
      const firstImgs=qsa('.photographerAlbumDesignCatalog .albumDesignModelGrid>.albumDesignModelCard img').slice(0,6);
      if(firstImgs.length&&firstImgs.some(img=>!img.complete)){waiting=true;text='در حال آماده‌سازی پیش‌نمایش طرح‌ها…';firstImgs.forEach(img=>{if(!img.dataset.pb695Watch){img.dataset.pb695Watch='1';img.addEventListener('load',scheduleSync,{once:true});img.addEventListener('error',scheduleSync,{once:true})}})}
    }
    if(!waiting){loader?.remove();return}
    if(!loader){loader=document.createElement('div');loader.id='pb695CatalogLoader';loader.className='pb695CatalogLoader';loader.setAttribute('role','status');area.prepend(loader)}
    loader.textContent=text;
  }

  function observeHeader(h){if(observedHeader===h)return;resizeObserver?.disconnect();observedHeader=h;if(h&&'ResizeObserver'in window){resizeObserver=new ResizeObserver(scheduleSync);resizeObserver.observe(h)}}
  function applyChromeLock(h){document.documentElement.classList.toggle('pb695PhotographerMobileChrome',Boolean(mobile()&&h&&main()))}

  function sync(){
    cleanOldChrome();
    const h=header(),mode=route();
    if(!h||!contextSourceReady(mode))ensureTransientObserver();
    applyChromeLock(h);observeHeader(h);ensureHeaderActions(h);ensureContext(h);ensurePrintActions();tuneCatalog(mode);ensureCatalogLoader(mode);
    if(!(mode==='album'||mode==='instagram'))document.documentElement.classList.remove('pb695FastNavigate');
  }

  document.addEventListener('pointerdown',ev=>{
    if(!mobile())return;
    const target=ev.target?.closest?.('.photographerBottomAppNav button');
    if(!target||!qs('.photographerAlbumDesignCatalog'))return;
    document.documentElement.classList.add('pb695FastNavigate');
  },true);

  const wrapHistory=name=>{const original=history[name];if(original.__pb695)return;const wrapped=function(...args){const out=original.apply(this,args);scheduleSync();return out};wrapped.__pb695=true;history[name]=wrapped};
  try{wrapHistory('pushState');wrapHistory('replaceState')}catch{}
  window.addEventListener('popstate',scheduleSync,{passive:true});
  window.addEventListener('pageshow',scheduleSync,{passive:true});
  window.addEventListener('resize',scheduleSync,{passive:true});
  document.addEventListener('DOMContentLoaded',scheduleSync,{once:true});
  if(document.readyState!=='loading')scheduleSync();
  console.info('[PhotoBridge] mobile chrome + catalog responsiveness',VERSION);
})();
